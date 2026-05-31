import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Standardize system instruction of Gemini for product link extraction
const LINK_PREVIEW_INSTRUCTION = `You are an expert product metadata extractor and categorizer for home renovation projects.
Take a URL and optional raw HTML snippets from a home DIY or refurbishment shop (e.g., IKEA, B&Q, Wayfair, Farrow & Ball, etc.).
Your job is to parse these and return a clean, fully filled JSON object.

If the HTML snippet is empty or missing, use intelligent guessing based entirely on the URL domain name, directory path, and standard market pricing in that country.
For the 'thumbnailUrl' field:
- If a valid, high-resolution product image URL is found natively in the HTML, extract it.
- If not, return a beautiful, targeted high-quality Unsplash image URL representing the category. 
  Construct a themed, reliable unsplash URL using fit=crop&w=500&q=80. For example:
  - Paint / Wall colors: Use high-quality paint swatches or clean painted room photos (e.g., https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=500&q=80)
  - Wood Flooring / Laminate: Use architectural light oak flooring (e.g., https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=500&q=80)
  - Couch / Sofa / General Furniture: Use cozy modern living rooms or sofas (e.g., https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=500&q=80)
  - Lights / Pendants: Use elegant brass or black pendant light fixtures (e.g., https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=500&q=80)
  - Taps / Sink / Fixtures: Use sleek brass taps or designer vanity basins (e.g., https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80)
  - Wall Tile / Marble: Use textured bathroom ceramic tiles or marble details (e.g., https://images.unsplash.com/photo-1576016770956-debb63d900ad?auto=format&fit=crop&w=500&q=80)
  - Doorknobs / Cabinet Handles: Use vintage or modern brass handles (e.g., https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=500&q=80)

Make sure the price is returned as a number and currency is a clean 3-letter currency code (usually EUR, GBP, or USD). Make sure all properties are fully completed. No placeholders like '(empty)'.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing and size limits
  app.use(express.json({ limit: '10mb' }));

  // Initialize server-side Gemini Client
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      geminiConfigured: !!ai,
    });
  });

  // Link Preview Extractor API Route
  app.post("/api/link-preview", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "Missing or invalid url parameter" });
      }

      let cleanedUrl = url.trim();
      if (!cleanedUrl.startsWith("http://") && !cleanedUrl.startsWith("https://")) {
        cleanedUrl = "https://" + cleanedUrl;
      }

      let htmlSnip = "";
      let fetchSuccess = false;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

        const response = await fetch(cleanedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/437.36'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const bodyText = await response.text();
          // Extract first 15KB or head contents to avoid massive tokens
          const headStart = bodyText.toLowerCase().indexOf("<head>");
          const headEnd = bodyText.toLowerCase().indexOf("</head>");
          if (headStart !== -1 && headEnd !== -1) {
            htmlSnip = bodyText.substring(headStart, headEnd + 7);
          } else {
            htmlSnip = bodyText.substring(0, 15000);
          }
          fetchSuccess = true;
        }
      } catch (e) {
        console.warn("Direct URL retrieval bypassed or failed:", (e as Error).message);
      }

      // If Gemini client isn't configured, fall back to simple local regex/rule extraction
      if (!ai) {
        const parsedUrl = new URL(cleanedUrl);
        const domain = parsedUrl.hostname.replace("www.", "");
        const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
        const nameGuess = pathParts.length > 0 
          ? pathParts[pathParts.length - 1].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
          : `${domain} Product`;

        return res.json({
          name: nameGuess,
          price: 49.99,
          currency: "GBP",
          supplier: domain.split(".")[0].toUpperCase(),
          thumbnailUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=80",
          description: "Product from " + domain + " added via URL link.",
          warning: "Gemini API key is not configured; fell back to rule-based parser."
        });
      }

      // Prompt Gemini to extract details
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Process this request:
URL: ${cleanedUrl}
Fetch succeeded: ${fetchSuccess}
Page snippet (if any):
${htmlSnip ? htmlSnip.substring(0, 10000) : "No page text could be downloaded. Please inspect the URL name pathways to guess."}`,
        config: {
          systemInstruction: LINK_PREVIEW_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Simple, human-friendly name of the product" },
              price: { type: Type.NUMBER, description: "Store price amount of product (as floating number)" },
              currency: { type: Type.STRING, description: "3-letter currency code, e.g. GBP, EUR, USD" },
              supplier: { type: Type.STRING, description: "Brand name / store name, e.g. IKEA" },
              thumbnailUrl: { type: Type.STRING, description: "Direct extracted product image URL or a matching premium Unsplash categorised URL" },
              description: { type: Type.STRING, description: "Highlight specification or short summary description" }
            },
            required: ["name", "price", "currency", "supplier", "thumbnailUrl", "description"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty text returned from Gemini API");
      }

      const cleanJson = JSON.parse(text.trim());
      res.json(cleanJson);

    } catch (err) {
      console.error("Link Preview service exception:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Serve static UI inside production and mounting Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server with Vite overlay and Gemini API running on HTTP port ${PORT}`);
  });
}

startServer();
