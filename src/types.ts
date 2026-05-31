export interface Project {
  id: string;
  name: string;
  propertyName: string;
  budget: number;
  currency: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Complete';
  notes: string;
  startDate: string;
  targetCompletionDate: string;
}

export interface Measurements {
  length: number | null;
  width: number | null;
  height: number | null;
  floorArea: number | null;
  wallArea: number | null;
  ceilingArea: number | null;
}

export interface Room {
  id: string;
  projectId: string;
  name: string;
  description: string;
  notes: string;
  budget: number | null;
  measurements: Measurements;
}

export interface Category {
  id: string;
  roomId: string; // Belongs to a room, but can also be project-wide
  name: string;
  description: string;
  defaultUnitType: string;
}

export interface DecisionLog {
  id: string;
  date: string;
  oldStatus: string;
  newStatus: string;
  notes: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  data: string; // Base64 file contents or mock URLs
  date: string;
}

export interface Item {
  id: string;
  projectId: string;
  roomId: string;
  categoryId: string;
  name: string;
  description: string;
  productUrl: string;
  supplier: string;
  thumbnailUrl: string;
  images: string[];
  status: string; // e.g. Maybe, Considering, Colour option, Sample ordered, Quoted, Approved, Final, Ordered, Delivered, Installed, Rejected, Archived
  tags: string[];
  priority: 'High' | 'Medium' | 'Low';
  unitPrice: number;
  unitType: string; // e.g. sq_m, m, l, pack, box, roll, sheet, unit, custom
  quantity: number;
  wastePercentage: number;
  deliveryCost: number;
  discount: number;
  tax: number;
  estimatedTotal: number;
  actualTotal: number;
  notes: string;
  attachments: Attachment[];
  history: DecisionLog[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomStatus {
  name: string;
  color: string; // tailwind color class prefix, e.g. 'amber', 'emerald'
  isFinal: boolean; // items with this status are counted in dashboard
}
