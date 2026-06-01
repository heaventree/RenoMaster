import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";

dotenv.config();

// Create persistent Turso Database connection client
const tursoUrl = process.env.TURSO_DATABASE_URL || "libsql://renomaster-heaventree.aws-eu-west-1.turso.io";
const tursoToken = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAyNzM2MzMsImlkIjoiMDE5ZTgwOTMtYjkwMS03YmQyLWIxNDgtOGRlZjdiOWI2M2M1IiwicmlkIjoiODRiMTljNzAtZjU4My00ODRhLThhNDQtZmE1MWVmMTczNGExIn0.CUnBF5Vret5btHpkNTfalH8ZO4MXT4MF3WPWHoEkqBBOTSNSfFZ-uaZNue5wppZrfqyOpjjpHPZw12GW-TWvBg";

const db = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

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

async function initializeDatabase() {
  try {
    console.log("Initializing Turso database tables...");

    // Create projects table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT,
        propertyName TEXT,
        budget REAL,
        currency TEXT,
        status TEXT,
        notes TEXT,
        startDate TEXT,
        targetCompletionDate TEXT
      )
    `);

    // Create rooms table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        projectId TEXT,
        name TEXT,
        description TEXT,
        notes TEXT,
        budget REAL,
        measurements TEXT
      )
    `);

    // Create categories table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        roomId TEXT,
        name TEXT,
        description TEXT,
        defaultUnitType TEXT
      )
    `);

    // Create items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        projectId TEXT,
        roomId TEXT,
        categoryId TEXT,
        name TEXT,
        description TEXT,
        productUrl TEXT,
        supplier TEXT,
        thumbnailUrl TEXT,
        images TEXT,
        status TEXT,
        tags TEXT,
        priority TEXT,
        unitPrice REAL,
        unitType TEXT,
        quantity REAL,
        wastePercentage REAL,
        deliveryCost REAL,
        discount REAL,
        tax REAL,
        estimatedTotal REAL,
        actualTotal REAL,
        notes TEXT,
        attachments TEXT,
        history TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);

    // Check if projects table is empty
    const checkProjects = await db.execute("SELECT COUNT(*) as count FROM projects");
    const count = Number(checkProjects.rows[0].count);
    
    if (count === 0) {
      console.log("Database is empty. Seeding mock data partitions...");

      const getDateRelativeStr = (daysOffset: number): string => {
        const d = new Date();
        d.setDate(d.getDate() + daysOffset);
        return d.toISOString().split('T')[0];
      };

      // Seed projects
      await db.execute({
        sql: "INSERT INTO projects VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [
          "proj_1",
          "Victorian Terrace Refurbishment",
          "124 Queens Road, London",
          45000,
          "GBP",
          "In Progress",
          "Full renovation of a 3-bedroom Victorian terraced house. Retaining original architectural features like coving and fireplaces while modernizing the kitchen, bathroom, and lighting systems.",
          getDateRelativeStr(-20),
          getDateRelativeStr(120)
        ]
      });

      await db.execute({
        sql: "INSERT INTO projects VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [
          "proj_2",
          "Cottage Garden Office & Studio",
          "The Thatch, Oxfordshire",
          15000,
          "GBP",
          "Planning",
          "Conversion of old outbuilding brick stable into a premium insulated remote work studio.",
          getDateRelativeStr(30),
          getDateRelativeStr(90)
        ]
      });

      // Seed rooms
      const mockRooms = [
        {
          id: "room_kitchen",
          projectId: "proj_1",
          name: "Kitchen & Dining Room",
          description: "Creating an open-plan kitchen-diner with premium handleless cabinets, direct garden access, and quartz worktops.",
          notes: "Check plumbing lines before cabinetry layout installation. Contractor needs to wire for double island pendant.",
          budget: 18000,
          measurements: JSON.stringify({
            length: 5.4, width: 4.2, height: 2.8,
            floorArea: 22.68, wallArea: 53.76, ceilingArea: 22.68
          })
        },
        {
          id: "room_bathroom",
          projectId: "proj_1",
          name: "Master Bathroom",
          description: "Boutique spa-like bathroom centering a walk-in wet room shower area and free-standing stone composite bathtub.",
          notes: "Requires full tanking and electric underfloor heating setup. Use large format porcelain tiles.",
          budget: 10000,
          measurements: JSON.stringify({
            length: 3.1, width: 2.4, height: 2.7,
            floorArea: 7.44, wallArea: 29.7, ceilingArea: 7.44
          })
        },
        {
          id: "room_living",
          projectId: "proj_1",
          name: "Living Room",
          description: "Cozy primary reception room showcasing restored Victorian fireplace, integrated custom alcove shelving, and engineered oak floors.",
          notes: "Farrow & Ball paint requested. Plaster repairs around cornices needed first.",
          budget: 8000,
          measurements: JSON.stringify({
            length: 4.5, width: 3.8, height: 2.9,
            floorArea: 17.1, wallArea: 48.14, ceilingArea: 17.1
          })
        },
        {
          id: "room_bedroom1",
          projectId: "proj_1",
          name: "Master Bedroom",
          description: "Peaceful retreat featuring neutral linen textures, panelled feature wall behind headboard, and dimmable accent lighting.",
          notes: "Saddle carpet required. Custom floor-to-ceiling wardrobes to be built in-situ.",
          budget: 6000,
          measurements: JSON.stringify({
            length: 4.0, width: 3.6, height: 2.8,
            floorArea: 14.4, wallArea: 42.56, ceilingArea: 14.4
          })
        }
      ];

      for (const r of mockRooms) {
        await db.execute({
          sql: "INSERT INTO rooms VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [r.id, r.projectId, r.name, r.description, r.notes, r.budget, r.measurements]
        });
      }

      // Seed categories
      const mockCategories = [
        { id: "cat_kit_floor", roomId: "room_kitchen", name: "Flooring", description: "Hard-wearing natural or composite kitchen flooring choices", defaultUnitType: "sq_m" },
        { id: "cat_kit_cabinets", roomId: "room_kitchen", name: "Cabinets & Worktops", description: "Bespoke kitchen runs, storage drawers, wood/stone islands", defaultUnitType: "unit" },
        { id: "cat_kit_lighting", roomId: "room_kitchen", name: "Lighting", description: "Task spotlights, under-counter bars, and island pendants", defaultUnitType: "unit" },
        { id: "cat_kit_appliances", roomId: "room_kitchen", name: "Appliances", description: "Ovens, induction hobs, integrated dishwasher, fridge freezer", defaultUnitType: "unit" },
        { id: "cat_kit_paint", roomId: "room_kitchen", name: "Paint & Walls", description: "Moisture-resistant kitchen matte finish paint", defaultUnitType: "l" },
        { id: "cat_bath_tiles", roomId: "room_bathroom", name: "Tiles & Stone", description: "Premium anti-slip porcelain wall & floor tiling options", defaultUnitType: "sq_m" },
        { id: "cat_bath_fixtures", roomId: "room_bathroom", name: "Bath & Shower Fixtures", description: "Hansgrohe taps, thermostatic mixers, double vanity basin units", defaultUnitType: "unit" },
        { id: "cat_bath_elec", roomId: "room_bathroom", name: "Underfloor Heating & Electrical", description: "Electric mesh heating mat and smart digital thermostat setups", defaultUnitType: "unit" },
        { id: "cat_liv_floor", roomId: "room_living", name: "Flooring", description: "Engineered herringbone oak floorboards or wool carpets", defaultUnitType: "sq_m" },
        { id: "cat_liv_paint", roomId: "room_living", name: "Paint & Plaster", description: "Chalky matte designer wall paints and feature wall wallpapers", defaultUnitType: "l" },
        { id: "cat_liv_furniture", roomId: "room_living", name: "Furniture & Decor", description: "Statement sofas, sideboards, rugs and fireplace accents", defaultUnitType: "unit" },
        { id: "cat_bed_carpet", roomId: "room_bedroom1", name: "Flooring", description: "Plush deeply cushioned saxony wool carpets", defaultUnitType: "sq_m" },
        { id: "cat_bed_decor", roomId: "room_bedroom1", name: "Furniture & Custom Joinery", description: "Bespoke built-in wardrobe designs and headboard panelling", defaultUnitType: "unit" }
      ];

      for (const c of mockCategories) {
        await db.execute({
          sql: "INSERT INTO categories VALUES (?, ?, ?, ?, ?)",
          args: [c.id, c.roomId, c.name, c.description, c.defaultUnitType]
        });
      }

      // Seed items
      const mockItems = [
        {
          id: "item_k_f1",
          projectId: "proj_1",
          roomId: "room_kitchen",
          categoryId: "cat_kit_floor",
          name: "Classic Herringbone Engineered Oak Flooring",
          description: "Premium European brushed gold engineered oak, 15mm thickness with a 4mm solid oak top wear layer. Underfloor heating compatible.",
          productUrl: "https://www.woodpeckerflooring.co.uk/product/goodrich-natural-oak/",
          supplier: "Woodpecker Flooring",
          thumbnailUrl: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=500&q=80",
          images: JSON.stringify([]),
          status: "Final",
          tags: JSON.stringify(["Oak", "Underfloor Heating", "Traditional"]),
          priority: "High",
          unitPrice: 65.00,
          unitType: "sq_m",
          quantity: 23,
          wastePercentage: 10,
          deliveryCost: 45.00,
          discount: 50.00,
          tax: 20,
          estimatedTotal: 1954.26,
          actualTotal: 1954.26,
          notes: "Calculated kitchen floor area of 22.7m². Rounded up with 10% cutting waste threshold to 25m² total. Delivery checked.",
          attachments: JSON.stringify([
            { id: "att_1", name: "flooring_quotation.pdf", type: "application/pdf", size: "142 KB", data: "", date: "2026-05-15" }
          ]),
          history: JSON.stringify([
            { id: "h_1", date: "2026-05-12", oldStatus: "Maybe", newStatus: "Considering", notes: "Excellent physical sample received. Texture feels perfect." },
            { id: "h_2", date: "2026-05-24", oldStatus: "Considering", newStatus: "Final", notes: "Approved by everyone. Ordering direct." }
          ]),
          createdAt: "2026-05-12",
          updatedAt: "2026-05-24"
        },
        {
          id: "item_k_f2",
          projectId: "proj_1",
          roomId: "room_kitchen",
          categoryId: "cat_kit_floor",
          name: "Polished Concrete Porcelain Tiles",
          description: "Large format 900x900mm concrete-effect tiles. Durable and extremely modern option, but cold underfoot.",
          productUrl: "https://www.toppstiles.co.uk/stone/concrete/polished-concrete",
          supplier: "Topps Tiles",
          thumbnailUrl: "https://images.unsplash.com/photo-1576016770956-debb63d900ad?auto=format&fit=crop&w=500&q=80",
          images: JSON.stringify([]),
          status: "Rejected",
          tags: JSON.stringify(["Tiles", "Concrete", "Modern"]),
          priority: "Medium",
          unitPrice: 42.50,
          unitType: "sq_m",
          quantity: 23,
          wastePercentage: 8,
          deliveryCost: 60.00,
          discount: 0,
          tax: 20,
          estimatedTotal: 1245.00,
          actualTotal: 0,
          notes: "Rejected because concrete tiles were deemed too cold and industrial for our Victorian design aesthetic.",
          attachments: JSON.stringify([]),
          history: JSON.stringify([
            { id: "h_3", date: "2026-05-12", oldStatus: "Maybe", newStatus: "Rejected", notes: "Too cold. We prefer real wood warmth." }
          ]),
          createdAt: "2026-05-12",
          updatedAt: "2026-05-12"
        },
        {
          id: "item_k_c1",
          projectId: "proj_1",
          roomId: "room_kitchen",
          categoryId: "cat_kit_cabinets",
          name: "Hale Blue Shaker-style Cabins Set",
          description: "In-frame timber cabinets painted in Hale Navy blue with premium solid brass cup drawer pulls.",
          productUrl: "https://www.diy-kitchens.com/shaker-hale-navy",
          supplier: "DIY Kitchens",
          thumbnailUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=500&q=80",
          images: JSON.stringify([]),
          status: "Final",
          tags: JSON.stringify(["Cabinets", "Navy Blue", "Timber"]),
          priority: "High",
          unitPrice: 7200.00,
          unitType: "unit",
          quantity: 1,
          wastePercentage: 0,
          deliveryCost: 150.00,
          discount: 200.00,
          tax: 20,
          estimatedTotal: 8580.00,
          actualTotal: 8580.00,
          notes: "Includes all carcasses, painted fronts, hinges, drawer boxes and dummy island casing. Extremely solid construction.",
          attachments: JSON.stringify([
            { id: "att_2", name: "kitchen_cad_layout.jpg", type: "image/jpeg", size: "1.2 MB", data: "", date: "2026-05-18" }
          ]),
          history: JSON.stringify([
            { id: "h_4", date: "2026-05-20", oldStatus: "Quoted", newStatus: "Final", notes: "Final CAD layout approved with contractor measurements verified." }
          ]),
          createdAt: "2026-05-10",
          updatedAt: "2026-05-20"
        },
        {
          id: "item_k_c2",
          projectId: "proj_1",
          roomId: "room_kitchen",
          categoryId: "cat_kit_cabinets",
          name: "Calacatta Gold Quartz Island Worktop",
          description: "30mm thick white quartz with deep elegant golden veining. Mitred 50mm waterfall edges on both island sides.",
          productUrl: "https://www.caesarstone.co.uk/catalogue/5131-calacatta-nuvo/",
          supplier: "Caesarstone",
          thumbnailUrl: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=500&q=80",
          images: JSON.stringify([]),
          status: "Final",
          tags: JSON.stringify(["Quartz", "Marble Look", "Luxury"]),
          priority: "High",
          unitPrice: 3200.00,
          unitType: "unit",
          quantity: 1,
          wastePercentage: 0,
          deliveryCost: 250.00,
          discount: 0,
          tax: 20,
          estimatedTotal: 4140.00,
          actualTotal: 4140.00,
          notes: "Templating to occur after cabinetry carcass installation is 100% complete. Lead time is 10 business days.",
          attachments: JSON.stringify([]),
          history: JSON.stringify([]),
          createdAt: "2026-05-15",
          updatedAt: "2026-05-15"
        },
        {
          id: "item_k_ap1",
          projectId: "proj_1",
          roomId: "room_kitchen",
          categoryId: "cat_kit_appliances",
          name: "Fisher & Paykel Integrated French Door Fridge Freezer",
          description: "ActiveSmart foodcare technology, sleek integrated design requiring custom blue matching face panels of 72 inches width.",
          productUrl: "https://www.fisherpaykel.com/uk/cooling/refrigeration/integrated-refrigeration/",
          supplier: "AO.com",
          thumbnailUrl: "https://images.unsplash.com/photo-1571175432247-fe0320b5de80?auto=format&fit=crop&w=500&q=80",
          images: JSON.stringify([]),
          status: "Considering",
          tags: JSON.stringify(["Fridge", "Luxury", "Smart"]),
          priority: "Medium",
          unitPrice: 2899.00,
          unitType: "unit",
          quantity: 1,
          wastePercentage: 0,
          deliveryCost: 0,
          discount: 100.00,
          tax: 20,
          estimatedTotal: 3358.80,
          actualTotal: 0,
          notes: "Looking for potentially discounted bulk appliances order together with stove and induction hob.",
          attachments: JSON.stringify([]),
          history: JSON.stringify([]),
          createdAt: "2026-05-18",
          updatedAt: "2026-05-18"
        },
        {
          id: "item_k_l1",
          projectId: "proj_1",
          roomId: "room_kitchen",
          categoryId: "cat_kit_lighting",
          name: "Amber Glass Ribbed Pendant Light",
          description: "Delicate ribbed amber globe glass with brushed hardware, perfect for casting a warm ambient glow above the island.",
          productUrl: "https://www.houseof.com/lighting/pendants/amber-ribbed-globe/",
          supplier: "HouseOf Designer Lights",
          thumbnailUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=500&q=80",
          images: JSON.stringify([]),
          status: "Final",
          tags: JSON.stringify(["Lighting", "Amber Glass", "Pendant"]),
          priority: "High",
          unitPrice: 110.00,
          unitType: "unit",
          quantity: 2,
          wastePercentage: 0,
          deliveryCost: 15.00,
          discount: 15.00,
          tax: 20,
          estimatedTotal: 264.00,
          actualTotal: 264.00,
          notes: "Bought during spring clearance sale. Need brass ceiling roses to match.",
          attachments: JSON.stringify([]),
          history: JSON.stringify([
            { id: "h_5", date: "2026-05-25", oldStatus: "Consider", newStatus: "Final", notes: "Bought under clearance code. 15 GBP overall discount applied." }
          ]),
          createdAt: "2026-05-15",
          updatedAt: "2026-05-25"
        },
        {
          id: "item_k_p1",
          projectId: "proj_1",
          roomId: "room_kitchen",
          categoryId: "cat_kit_paint",
          name: "School House White paint (F&B)",
          description: "Soft off-white shade, perfectly warm tone. Wood & Metal soft sheen paint + Modern emulsion for walls.",
          productUrl: "https://www.farrow-ball.com/paint/school-house-white",
          supplier: "Farrow & Ball",
          thumbnailUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=500&q=80",
          images: JSON.stringify([]),
          status: "Colour option",
          tags: JSON.stringify(["Off White", "Warm", "Paint"]),
          priority: "Low",
          unitPrice: 59.00,
          unitType: "l",
          quantity: 5,
          wastePercentage: 0,
          deliveryCost: 5.00,
          discount: 0,
          tax: 20,
          estimatedTotal: 360.00,
          actualTotal: 0,
          notes: "Requires 1 tester pot first to assess undertone on different walls in the room.",
          attachments: JSON.stringify([]),
          history: JSON.stringify([]),
          createdAt: "2026-05-28",
          updatedAt: "2026-05-28"
        },
        {
          id: "item_b_t1",
          projectId: "proj_1",
          roomId: "room_bathroom",
          categoryId: "cat_bath_tiles",
          name: "Carrara Marble Effect Porcelain Tiles",
          description: "Stunning 600x600mm honed porcelain wall and floor tiles, presenting high-contrast luxury looking grey veins.",
          productUrl: "https://www.mandaringone.com/carrara-look-honed",
          supplier: "Mandarin Stone",
          thumbnailUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=500&q=80",
          images: JSON.stringify([]),
          status: "Final",
          tags: JSON.stringify(["Marble Look", "Porcelain", "Bathroom"]),
          priority: "High",
          unitPrice: 38.00,
          unitType: "sq_m",
          quantity: 16,
          wastePercentage: 12,
          deliveryCost: 40.00,
          discount: 0,
          tax: 20,
          estimatedTotal: 864.96,
          actualTotal: 864.96,
          notes: "Required 16 sq. m for wet room zone and floor. 12% cutting allowance applied.",
          attachments: JSON.stringify([]),
          history: JSON.stringify([]),
          createdAt: "2026-05-15",
          updatedAt: "2026-05-20"
        },
        {
          id: "item_b_f1",
          projectId: "proj_1",
          roomId: "room_bathroom",
          categoryId: "cat_bath_fixtures",
          name: "Brushed Brass Shower Mixer Set",
          description: "Thermostatic brass shower mixer featuring 250mm overhead rainfall shower and secondary handheld wand, solid brass chassis.",
          productUrl: "https://www.lussostone.com/showers-brass-brushed",
          supplier: "Lusso Stone",
          thumbnailUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80",
          images: JSON.stringify([]),
          status: "Final",
          tags: JSON.stringify(["Brass", "Shower", "Luxury"]),
          priority: "High",
          unitPrice: 495.00,
          unitType: "unit",
          quantity: 1,
          wastePercentage: 0,
          deliveryCost: 0,
          discount: 40.00,
          tax: 20,
          estimatedTotal: 546.00,
          actualTotal: 546.00,
          notes: "Ordered on dynamic bundle deal! Looks beautiful with concrete-look tile backups.",
          attachments: JSON.stringify([]),
          history: JSON.stringify([]),
          createdAt: "2026-05-20",
          updatedAt: "2026-05-22"
        },
        {
          id: "item_l_f1",
          projectId: "proj_1",
          roomId: "room_living",
          categoryId: "cat_liv_floor",
          name: "Engineered Oak Boards (Bevelled Edge)",
          description: "Long grand oak boards with bevelled micro-edge and classic oil finish. Fits Victorian fireplace look.",
          productUrl: "https://www.woodpeckerflooring.co.uk/long-plank-gold",
          supplier: "Woodpecker Flooring",
          thumbnailUrl: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=500&q=80",
          images: JSON.stringify([]),
          status: "Final",
          tags: JSON.stringify(["Oak Plank", "Victorian", "Warmth"]),
          priority: "High",
          unitPrice: 58.00,
          unitType: "sq_m",
          quantity: 18,
          wastePercentage: 8,
          deliveryCost: 0,
          discount: 0,
          tax: 20,
          estimatedTotal: 1359.36,
          actualTotal: 1359.36,
          notes: "Matched wood tone of entry hallway. Free delivery guaranteed since we purchased flooring combo from Woodpecker.",
          attachments: JSON.stringify([]),
          history: JSON.stringify([]),
          createdAt: "2026-05-22",
          updatedAt: "2026-05-25"
        },
        {
          id: "item_l_fur1",
          projectId: "proj_1",
          roomId: "room_living",
          categoryId: "cat_liv_furniture",
          name: "Classic Sage Green Velvet 3-Seater Sofa",
          description: "Luxe brushed sage green velvet sofa with elegant dark wood legs and golden turn wheels.",
          productUrl: "https://www.made.com/sofas/green-velvet-couch",
          supplier: "Swoon Editions",
          thumbnailUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=500&q=80",
          images: JSON.stringify([]),
          status: "Considering",
          tags: JSON.stringify(["Green Velvet", "Sofa", "Plush"]),
          priority: "Medium",
          unitPrice: 1250.00,
          unitType: "unit",
          quantity: 1,
          wastePercentage: 0,
          deliveryCost: 75.00,
          discount: 0,
          tax: 20,
          estimatedTotal: 1590.00,
          actualTotal: 0,
          notes: "Requires checking clearance through front window. Doorway width is tight.",
          attachments: JSON.stringify([]),
          history: JSON.stringify([]),
          createdAt: "2026-05-25",
          updatedAt: "2026-05-25"
        }
      ];

      for (const it of mockItems) {
        await db.execute({
          sql: `INSERT INTO items (
            id, projectId, roomId, categoryId, name, description, productUrl, supplier, thumbnailUrl, 
            images, status, tags, priority, unitPrice, unitType, quantity, wastePercentage, 
            deliveryCost, discount, tax, estimatedTotal, actualTotal, notes, attachments, history, 
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          args: [
            it.id, it.projectId, it.roomId, it.categoryId, it.name, it.description, it.productUrl, it.supplier, it.thumbnailUrl,
            it.images, it.status, it.tags, it.priority, it.unitPrice, it.unitType, it.quantity, it.wastePercentage,
            it.deliveryCost, it.discount, it.tax, it.estimatedTotal, it.actualTotal, it.notes, it.attachments, it.history,
            it.createdAt, it.updatedAt
          ]
        });
      }

      console.log("Database seeded successfully!");
    } else {
      console.log(`Database already has ${count} projects. Skipping seed.`);
    }

  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

async function startServer() {
  // Initialize and check/seed Tables before serving any requests
  await initializeDatabase();

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

  // REST API: Load all database data
  app.get("/api/all-data", async (req, res) => {
    try {
      const projectsRes = await db.execute("SELECT * FROM projects");
      const roomsRes = await db.execute("SELECT * FROM rooms");
      const categoriesRes = await db.execute("SELECT * FROM categories");
      const itemsRes = await db.execute("SELECT * FROM items");

      // Parse JSON fields
      const parsedRooms = roomsRes.rows.map(row => ({
        ...row,
        measurements: row.measurements ? JSON.parse(row.measurements as string) : null,
      }));

      const parsedItems = itemsRes.rows.map(row => ({
        ...row,
        images: row.images ? JSON.parse(row.images as string) : [],
        tags: row.tags ? JSON.parse(row.tags as string) : [],
        attachments: row.attachments ? JSON.parse(row.attachments as string) : [],
        history: row.history ? JSON.parse(row.history as string) : [],
      }));

      res.json({
        projects: projectsRes.rows,
        rooms: parsedRooms,
        categories: categoriesRes.rows,
        items: parsedItems,
      });
    } catch (err) {
      console.error("Failed to load database data:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Projects endpoints
  app.post("/api/projects", async (req, res) => {
    try {
      const p = req.body;
      await db.execute({
        sql: "INSERT INTO projects (id, name, propertyName, budget, currency, status, notes, startDate, targetCompletionDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [p.id, p.name, p.propertyName, p.budget, p.currency, p.status, p.notes, p.startDate, p.targetCompletionDate]
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to insert project:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const p = req.body;
      await db.execute({
        sql: "UPDATE projects SET name = ?, propertyName = ?, budget = ?, currency = ?, status = ?, notes = ?, startDate = ?, targetCompletionDate = ? WHERE id = ?",
        args: [p.name, p.propertyName, p.budget, p.currency, p.status, p.notes, p.startDate, p.targetCompletionDate, req.params.id]
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to update project:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await db.execute({ sql: "DELETE FROM projects WHERE id = ?", args: [req.params.id] });
      // Cascade delete rooms, categories, and items or keep db flexible
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete project:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Rooms endpoints
  app.post("/api/rooms", async (req, res) => {
    try {
      const r = req.body;
      await db.execute({
        sql: "INSERT INTO rooms (id, projectId, name, description, notes, budget, measurements) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [r.id, r.projectId, r.name, r.description, r.notes, r.budget, JSON.stringify(r.measurements || {})]
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to insert room:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put("/api/rooms/:id", async (req, res) => {
    try {
      const r = req.body;
      await db.execute({
        sql: "UPDATE rooms SET name = ?, description = ?, notes = ?, budget = ?, measurements = ? WHERE id = ?",
        args: [r.name, r.description, r.notes, r.budget, JSON.stringify(r.measurements || {}), req.params.id]
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to update room:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    try {
      await db.execute({ sql: "DELETE FROM rooms WHERE id = ?", args: [req.params.id] });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete room:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Categories endpoints
  app.post("/api/categories", async (req, res) => {
    try {
      const c = req.body;
      await db.execute({
        sql: "INSERT INTO categories (id, roomId, name, description, defaultUnitType) VALUES (?, ?, ?, ?, ?)",
        args: [c.id, c.roomId, c.name, c.description, c.defaultUnitType]
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to insert category:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await db.execute({ sql: "DELETE FROM categories WHERE id = ?", args: [req.params.id] });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete category:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Items endpoints
  app.post("/api/items", async (req, res) => {
    try {
      const it = req.body;
      await db.execute({
        sql: `INSERT INTO items (
          id, projectId, roomId, categoryId, name, description, productUrl, supplier, thumbnailUrl, 
          images, status, tags, priority, unitPrice, unitType, quantity, wastePercentage, 
          deliveryCost, discount, tax, estimatedTotal, actualTotal, notes, attachments, history, 
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          it.id, it.projectId, it.roomId, it.categoryId, it.name, it.description, it.productUrl, it.supplier, it.thumbnailUrl,
          JSON.stringify(it.images || []), it.status, JSON.stringify(it.tags || []), it.priority, it.unitPrice, it.unitType, it.quantity, it.wastePercentage,
          it.deliveryCost, it.discount, it.tax, it.estimatedTotal, it.actualTotal, it.notes, JSON.stringify(it.attachments || []), JSON.stringify(it.history || []),
          it.createdAt, it.updatedAt
        ]
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to insert item:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put("/api/items/:id", async (req, res) => {
    try {
      const it = req.body;
      await db.execute({
        sql: `UPDATE items SET 
          projectId = ?, roomId = ?, categoryId = ?, name = ?, description = ?, productUrl = ?, supplier = ?, thumbnailUrl = ?, 
          images = ?, status = ?, tags = ?, priority = ?, unitPrice = ?, unitType = ?, quantity = ?, wastePercentage = ?, 
          deliveryCost = ?, discount = ?, tax = ?, estimatedTotal = ?, actualTotal = ?, notes = ?, attachments = ?, history = ?, 
          updatedAt = ? WHERE id = ?`,
        args: [
          it.projectId, it.roomId, it.categoryId, it.name, it.description, it.productUrl, it.supplier, it.thumbnailUrl,
          JSON.stringify(it.images || []), it.status, JSON.stringify(it.tags || []), it.priority, it.unitPrice, it.unitType, it.quantity, it.wastePercentage,
          it.deliveryCost, it.discount, it.tax, it.estimatedTotal, it.actualTotal, it.notes, JSON.stringify(it.attachments || []), JSON.stringify(it.history || []),
          it.updatedAt, req.params.id
        ]
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to update item:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      await db.execute({ sql: "DELETE FROM items WHERE id = ?", args: [req.params.id] });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete item:", err);
      res.status(500).json({ error: (err as Error).message });
    }
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
