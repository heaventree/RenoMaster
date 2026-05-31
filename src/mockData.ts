import { Project, Room, Category, Item, CustomStatus } from "./types";

// Helper to construct dates relative to today
const getDateRelative = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const DEFAULT_STATUSES: CustomStatus[] = [
  { name: 'Maybe', color: 'slate', isFinal: false },
  { name: 'Considering', color: 'blue', isFinal: false },
  { name: 'Colour option', color: 'fuchsia', isFinal: false },
  { name: 'Sample ordered', color: 'violet', isFinal: false },
  { name: 'Quoted', color: 'amber', isFinal: false },
  { name: 'Approved', color: 'cyan', isFinal: false },
  { name: 'Final', color: 'emerald', isFinal: true },
  { name: 'Ordered', color: 'indigo', isFinal: false },
  { name: 'Delivered', color: 'teal', isFinal: false },
  { name: 'Installed', color: 'emerald', isFinal: false },
  { name: 'Rejected', color: 'red', isFinal: false },
  { name: 'Archived', color: 'zinc', isFinal: false }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj_1",
    name: "Victorian Terrace Refurbishment",
    propertyName: "124 Queens Road, London",
    budget: 45000,
    currency: "GBP",
    status: "In Progress",
    notes: "Full renovation of a 3-bedroom Victorian terraced house. Retaining original architectural features like coving and fireplaces while modernizing the kitchen, bathroom, and lighting systems.",
    startDate: getDateRelative(-20),
    targetCompletionDate: getDateRelative(120)
  },
  {
    id: "proj_2",
    name: "Cottage Garden Office & Studio",
    propertyName: "The Thatch, Oxfordshire",
    budget: 15000,
    currency: "GBP",
    status: "Planning",
    notes: "Conversion of old outbuilding brick stable into a premium insulated remote work studio.",
    startDate: getDateRelative(30),
    targetCompletionDate: getDateRelative(90)
  }
];

export const MOCK_ROOMS: Room[] = [
  {
    id: "room_kitchen",
    projectId: "proj_1",
    name: "Kitchen & Dining Room",
    description: "Creating an open-plan kitchen-diner with premium handleless cabinets, direct garden access, and quartz worktops.",
    notes: "Check plumbing lines before cabinetry layout installation. Contractor needs to wire for double island pendant.",
    budget: 18000,
    measurements: {
      length: 5.4,
      width: 4.2,
      height: 2.8,
      floorArea: 22.68,
      wallArea: 53.76,
      ceilingArea: 22.68
    }
  },
  {
    id: "room_bathroom",
    projectId: "proj_1",
    name: "Master Bathroom",
    description: "Boutique spa-like bathroom centering a walk-in wet room shower area and free-standing stone composite bathtub.",
    notes: "Requires full tanking and electric underfloor heating setup. Use large format porcelain tiles.",
    budget: 10000,
    measurements: {
      length: 3.1,
      width: 2.4,
      height: 2.7,
      floorArea: 7.44,
      wallArea: 29.7,
      ceilingArea: 7.44
    }
  },
  {
    id: "room_living",
    projectId: "proj_1",
    name: "Living Room",
    description: "Cozy primary reception room showcasing restored Victorian fireplace, integrated custom alcove shelving, and engineered oak floors.",
    notes: "Farrow & Ball paint requested. Plaster repairs around cornices needed first.",
    budget: 8000,
    measurements: {
      length: 4.5,
      width: 3.8,
      height: 2.9,
      floorArea: 17.1,
      wallArea: 48.14,
      ceilingArea: 17.1
    }
  },
  {
    id: "room_bedroom1",
    projectId: "proj_1",
    name: "Master Bedroom",
    description: "Peaceful retreat featuring neutral linen textures, panelled feature wall behind headboard, and dimmable accent lighting.",
    notes: "Saddle carpet required. Custom floor-to-ceiling wardrobes to be built in-situ.",
    budget: 6000,
    measurements: {
      length: 4.0,
      width: 3.6,
      height: 2.8,
      floorArea: 14.4,
      wallArea: 42.56,
      ceilingArea: 14.4
    }
  }
];

export const MOCK_CATEGORIES: Category[] = [
  // Kitchen Categories
  { id: "cat_kit_floor", roomId: "room_kitchen", name: "Flooring", description: "Hard-wearing natural or composite kitchen flooring choices", defaultUnitType: "sq_m" },
  { id: "cat_kit_cabinets", roomId: "room_kitchen", name: "Cabinets & Worktops", description: "Bespoke kitchen runs, storage drawers, wood/stone islands", defaultUnitType: "unit" },
  { id: "cat_kit_lighting", roomId: "room_kitchen", name: "Lighting", description: "Task spotlights, under-counter bars, and island pendants", defaultUnitType: "unit" },
  { id: "cat_kit_appliances", roomId: "room_kitchen", name: "Appliances", description: "Ovens, induction hobs, integrated dishwasher, fridge freezer", defaultUnitType: "unit" },
  { id: "cat_kit_paint", roomId: "room_kitchen", name: "Paint & Walls", description: "Moisture-resistant kitchen matte finish paint", defaultUnitType: "l" },

  // Bathroom Categories
  { id: "cat_bath_tiles", roomId: "room_bathroom", name: "Tiles & Stone", description: "Premium anti-slip porcelain wall & floor tiling options", defaultUnitType: "sq_m" },
  { id: "cat_bath_fixtures", roomId: "room_bathroom", name: "Bath & Shower Fixtures", description: "Hansgrohe taps, thermostatic mixers, double vanity basin units", defaultUnitType: "unit" },
  { id: "cat_bath_elec", roomId: "room_bathroom", name: "Underfloor Heating & Electrical", description: "Electric mesh heating mat and smart digital thermostat setups", defaultUnitType: "unit" },

  // Living Room Categories
  { id: "cat_liv_floor", roomId: "room_living", name: "Flooring", description: "Engineered herringbone oak floorboards or wool carpets", defaultUnitType: "sq_m" },
  { id: "cat_liv_paint", roomId: "room_living", name: "Paint & Plaster", description: "Chalky matte designer wall paints and feature wall wallpapers", defaultUnitType: "l" },
  { id: "cat_liv_furniture", roomId: "room_living", name: "Furniture & Decor", description: "Statement sofas, sideboards, rugs and fireplace accents", defaultUnitType: "unit" },

  // Bedroom Categories
  { id: "cat_bed_carpet", roomId: "room_bedroom1", name: "Flooring", description: "Plush deeply cushioned saxony wool carpets", defaultUnitType: "sq_m" },
  { id: "cat_bed_decor", roomId: "room_bedroom1", name: "Furniture & Custom Joinery", description: "Bespoke built-in wardrobe designs and headboard panelling", defaultUnitType: "unit" }
];

export const MOCK_ITEMS: Item[] = [
  // Kitchen Flooring Items
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
    images: [],
    status: "Final",
    tags: ["Oak", "Underfloor Heating", "Traditional"],
    priority: "High",
    unitPrice: 65.00,
    unitType: "sq_m",
    quantity: 23,
    wastePercentage: 10,
    deliveryCost: 45.00,
    discount: 50.00,
    tax: 20, // 20% VAT standard
    estimatedTotal: 1954.26, // custom calculated later in client code, but stored
    actualTotal: 1954.26,
    notes: "Calculated kitchen floor area of 22.7m². Rounded up with 10% cutting waste threshold to 25m² total. Delivery checked.",
    attachments: [
      { id: "att_1", name: "flooring_quotation.pdf", type: "application/pdf", size: "142 KB", data: "", date: "2026-05-15" }
    ],
    history: [
      { id: "h_1", date: "2026-05-12", oldStatus: "Maybe", newStatus: "Considering", notes: "Excellent physical sample received. Texture feels perfect." },
      { id: "h_2", date: "2026-05-24", oldStatus: "Considering", newStatus: "Final", notes: "Approved by everyone. Ordering direct." }
    ],
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
    images: [],
    status: "Rejected",
    tags: ["Tiles", "Concrete", "Modern"],
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
    attachments: [],
    history: [
      { id: "h_3", date: "2026-05-12", oldStatus: "Maybe", newStatus: "Rejected", notes: "Too cold. We prefer real wood warmth." }
    ],
    createdAt: "2026-05-12",
    updatedAt: "2026-05-12"
  },

  // Kitchen Cabinets
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
    images: [],
    status: "Final",
    tags: ["Cabinets", "Navy Blue", "Timber"],
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
    attachments: [
      { id: "att_2", name: "kitchen_cad_layout.jpg", type: "image/jpeg", size: "1.2 MB", data: "", date: "2026-05-18" }
    ],
    history: [
      { id: "h_4", date: "2026-05-20", oldStatus: "Quoted", newStatus: "Final", notes: "Final CAD layout approved with contractor measurements verified." }
    ],
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
    images: [],
    status: "Final",
    tags: ["Quartz", "Marble Look", "Luxury"],
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
    attachments: [],
    history: [],
    createdAt: "2026-05-15",
    updatedAt: "2026-05-15"
  },

  // Kitchen Appliances
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
    images: [],
    status: "Considering",
    tags: ["Fridge", "Luxury", "Smart"],
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
    attachments: [],
    history: [],
    createdAt: "2026-05-18",
    updatedAt: "2026-05-18"
  },

  // Kitchen Lighting
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
    images: [],
    status: "Final",
    tags: ["Lighting", "Amber Glass", "Pendant"],
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
    attachments: [],
    history: [
      { id: "h_5", date: "2026-05-25", oldStatus: "Consider", newStatus: "Final", notes: "Bought under clearance code. 15 GBP overall discount applied." }
    ],
    createdAt: "2026-05-15",
    updatedAt: "2026-05-25"
  },

  // Kitchen Paint
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
    images: [],
    status: "Colour option",
    tags: ["Off White", "Warm", "Paint"],
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
    attachments: [],
    history: [],
    createdAt: "2026-05-28",
    updatedAt: "2026-05-28"
  },

  // Bathroom Items
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
    images: [],
    status: "Final",
    tags: ["Marble Look", "Porcelain", "Bathroom"],
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
    attachments: [],
    history: [],
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
    images: [],
    status: "Final",
    tags: ["Brass", "Shower", "Luxury"],
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
    attachments: [],
    history: [],
    createdAt: "2026-05-20",
    updatedAt: "2026-05-22"
  },

  // Living Room Flooring
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
    images: [],
    status: "Final",
    tags: ["Oak Plank", "Victorian", "Warmth"],
    priority: "High",
    unitPrice: 58.00,
    unitType: "sq_m",
    quantity: 18,
    wastePercentage: 8,
    deliveryCost: 0, // free on bulk with kitchen floor
    discount: 0,
    tax: 20,
    estimatedTotal: 1359.36,
    actualTotal: 1359.36,
    notes: "Matched wood tone of entry hallway. Free delivery guaranteed since we purchased flooring combo from Woodpecker.",
    attachments: [],
    history: [],
    createdAt: "2026-05-22",
    updatedAt: "2026-05-25"
  },

  // Living Room Sofa
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
    images: [],
    status: "Considering",
    tags: ["Green Velvet", "Sofa", "Plush"],
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
    attachments: [],
    history: [],
    createdAt: "2026-05-25",
    updatedAt: "2026-05-25"
  }
];
