import React, { useState, useEffect } from "react";
import { Room, Category, Item, CustomStatus } from "../types";
import { 
  Building, 
  Trash2, 
  Copy, 
  FolderPlus, 
  Plus, 
  Info, 
  HelpCircle,
  Eye, 
  Edit3, 
  Search, 
  Calculator, 
  ArrowUpDown,
  Archive,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";

interface RoomViewProps {
  rooms: Room[];
  categories: Category[];
  items: Item[];
  activeRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onAddRoom: (room: Omit<Room, 'id'>) => void;
  onUpdateRoom: (room: Room) => void;
  onDuplicateRoom: (roomId: string) => void;
  onDeleteRoom: (roomId: string) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (catId: string) => void;
  onAddItem: () => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
  statuses: CustomStatus[];
  currencySymbol: string;
}

export default function RoomView({
  rooms,
  categories,
  items,
  activeRoomId,
  onSelectRoom,
  onAddRoom,
  onUpdateRoom,
  onDuplicateRoom,
  onDeleteRoom,
  onAddCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  statuses,
  currencySymbol
}: RoomViewProps) {
  // Room editing trigger
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  
  // Room states inputs
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [newRoomBudget, setNewRoomBudget] = useState<number | null>(null);

  // Edit Room states inputs
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomDesc, setEditRoomDesc] = useState("");
  const [editRoomBudget, setEditRoomBudget] = useState<number | null>(null);

  // New Category states
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatUnit, setNewCatUnit] = useState("unit");

  // Filter, sort, search controls
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState<'cost' | 'supplier' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Specs Edit States
  const [specL, setSpecL] = useState<number | "">("");
  const [specW, setSpecW] = useState<number | "">("");
  const [specH, setSpecH] = useState<number | "">("");
  const [specFloorArea, setSpecFloorArea] = useState<number | "">("");
  const [specWallArea, setSpecWallArea] = useState<number | "">("");
  
  // Calculators drawer state
  const [showCalculator, setShowCalculator] = useState(false);

  // Find active room objects
  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  // Set initial spec variables
  useEffect(() => {
    if (activeRoom) {
      setSpecL(activeRoom.measurements?.length || "");
      setSpecW(activeRoom.measurements?.width || "");
      setSpecH(activeRoom.measurements?.height || "");
      setSpecFloorArea(activeRoom.measurements?.floorArea || "");
      setSpecWallArea(activeRoom.measurements?.wallArea || "");
    }
  }, [activeRoom]);

  if (!activeRoom) {
    return (
      <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-zinc-200">
        <Building className="mx-auto h-12 w-12 text-zinc-350 stroke-1 mb-3" />
        <h3 className="font-display font-semibold text-zinc-700">No rooms active</h3>
        <p className="text-zinc-500 text-xs mt-1">Add a room (like Kitchen or Bedroom) to start cataloguing renovation options.</p>
        <button
          onClick={() => setIsAddingRoom(true)}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Create First Room
        </button>
      </div>
    );
  }

  // Handle Room adding standard
  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    onAddRoom({
      projectId: "proj_1",
      name: newRoomName.trim(),
      description: newRoomDesc.trim(),
      notes: "",
      budget: newRoomBudget,
      measurements: {
        length: null, width: null, height: null,
        floorArea: null, wallArea: null, ceilingArea: null
      }
    });

    setNewRoomName("");
    setNewRoomDesc("");
    setNewRoomBudget(null);
    setIsAddingRoom(false);
  };

  // Handle Room details editing submit
  const handleUpdateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoomName.trim()) return;

    onUpdateRoom({
      ...activeRoom,
      name: editRoomName.trim(),
      description: editRoomDesc.trim(),
      budget: editRoomBudget
    });

    setIsEditingRoom(false);
  };

  // Handle Category adding
  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    onAddCategory({
      roomId: activeRoom.id,
      name: newCatName.trim(),
      description: "",
      defaultUnitType: newCatUnit
    });

    setNewCatName("");
    setNewCatUnit("unit");
    setIsAddingCategory(false);
  };

  // Specs multipliers calculation helper
  const handleAutoCalcSpecs = () => {
    const length = Number(specL);
    const width = Number(specW);
    const height = Number(specH);

    if (length && width) {
      setSpecFloorArea(parseFloat((length * width).toFixed(2)));
    }
    if (length && width && height) {
      // Wall surface calculation: 2 * (L + W) * H minus some standard 10% doors coverage
      const calculatedWallArea = 2 * (length + width) * height;
      setSpecWallArea(parseFloat((calculatedWallArea * 0.9).toFixed(2)));
    }
  };

  const handleSaveSpecs = () => {
    const updatedRoom: Room = {
      ...activeRoom,
      measurements: {
        length: specL === "" ? null : Number(specL),
        width: specW === "" ? null : Number(specW),
        height: specH === "" ? null : Number(specH),
        floorArea: specFloorArea === "" ? null : Number(specFloorArea),
        wallArea: specWallArea === "" ? null : Number(specWallArea),
        ceilingArea: specFloorArea === "" ? null : Number(specFloorArea) // Ceiling size identical to floor
      }
    };
    onUpdateRoom(updatedRoom);
    setIsEditingSpecs(false);
  };

  // Items processing (filter, sorting, search)
  const roomItems = items.filter(item => item.roomId === activeRoom.id);
  const roomCategories = categories.filter(c => c.roomId === activeRoom.id);

  const searchedAndFilteredItems = roomItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || item.status === filterStatus;

    return matchesSearch && matchesStatus;
  }).sort((a,b) => {
    let propA: any = a.createdAt;
    let propB: any = b.createdAt;

    if (sortBy === 'cost') {
      propA = a.estimatedTotal;
      propB = b.estimatedTotal;
    } else if (sortBy === 'supplier') {
      propA = a.supplier.toLowerCase();
      propB = b.supplier.toLowerCase();
    }

    if (propA < propB) return sortOrder === 'asc' ? -1 : 1;
    if (propA > propB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Material usage calculations estimators references
  const computedFloorAreaSqM = activeRoom.measurements?.floorArea || 0;
  const computedWallAreaSqM = activeRoom.measurements?.wallArea || 0;
  
  // Standard formulas:
  // Paint: 1 Litre covers 12 sq.m (dual coat)
  const estPaintLitres = computedWallAreaSqM > 0 ? (computedWallAreaSqM * 2 / 12).toFixed(1) : 0;
  // Floor wood boxes: 1 box covers 1.8 sq.m. + 10% waste buffer
  const estFlooringBoxes = computedFloorAreaSqM > 0 ? Math.ceil((computedFloorAreaSqM * 1.1) / 1.8) : 0;
  // Wall tiles: 1 box wraps 1 sq.m
  const estTilePacks = computedWallAreaSqM > 0 ? Math.ceil(computedWallAreaSqM * 1.1) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Upper Selector tabs for active rooms */}
      <div className="flex flex-wrap items-center justify-between border-b border-natural-border pb-3 gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {rooms.map(r => (
            <button
              key={r.id}
              onClick={() => onSelectRoom(r.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeRoom.id === r.id
                  ? 'bg-natural-primary text-white shadow-sm font-serif font-bold'
                  : 'bg-natural-sidebar text-natural-text-muted hover:bg-natural-border/40'
              }`}
            >
              {r.name}
            </button>
          ))}
          <button
            onClick={() => setIsAddingRoom(true)}
            className="px-2.5 py-1.5 text-xs font-bold text-natural-primary bg-[#DDE2C6] hover:bg-[#DDE2C6]/80 rounded-lg flex items-center gap-1 transition-colors border border-natural-border/60 shadow-sm cursor-pointer"
          >
            <Plus size={13} />
            Add Room Space
          </button>
        </div>

        {/* Room general action board (Edit details, duplicate, delete) */}
        <div className="flex gap-1.5 shrink-0">
          <button 
            onClick={() => {
              setEditRoomName(activeRoom.name);
              setEditRoomDesc(activeRoom.description || "");
              setEditRoomBudget(activeRoom.budget);
              setIsEditingRoom(true);
            }}
            className="p-1.5 text-natural-text-muted hover:text-natural-primary hover:bg-natural-sidebar rounded-lg transition-colors border border-natural-border/60 cursor-pointer flex items-center gap-1 text-[11px] font-bold px-2 shadow-xs"
            title="Edit Room details (Name, description, budget limit)"
          >
            <Edit3 size={13} />
            <span>Edit Room</span>
          </button>
          <button 
            onClick={() => onDuplicateRoom(activeRoom.id)}
            className="p-1.5 text-natural-text-muted hover:text-natural-primary hover:bg-natural-sidebar rounded-lg transition-colors border border-natural-border/60 cursor-pointer"
            title="Duplicate Room with Categories and Products"
          >
            <Copy size={13} />
          </button>
          <button 
            onClick={() => {
              if (confirm(`Are you sure you want to delete room '${activeRoom.name}' and all associated materials?`)) {
                onDeleteRoom(activeRoom.id);
              }
            }}
            className="p-1.5 text-red-500 hover:text-red-750 hover:bg-red-50 rounded-lg transition-colors border border-red-100 cursor-pointer"
            title="Delete Room space"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Room Info & Estimator layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INFO COLUMN */}
        <div className="space-y-4 lg:col-span-2">
          
          <div className="p-5 bg-white border border-natural-border rounded-2xl shadow-sm space-y-3">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-serif font-bold text-xl text-natural-text-head">{activeRoom.name}</h3>
                <p className="text-natural-text-muted text-xs mt-0.5 leading-relaxed">{activeRoom.description || "No general description added."}</p>
              </div>
              {activeRoom.budget && (
                <div className="bg-[#DDE2C6] text-natural-primary p-2 px-3 border border-natural-border/40 text-right rounded-xl shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-natural-primary/80 block">Room Budget Limit</span>
                  <span className="font-serif font-bold text-sm">{currencySymbol}{activeRoom.budget.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Room spec notes */}
            <div className="pt-2">
              <label className="text-[10px] font-bold text-natural-text-muted uppercase tracking-widest block mb-1">Contractor comments / Room notes</label>
              <textarea
                rows={1.5}
                className="w-full text-xs p-2 text-natural-text-head bg-natural-bg border border-natural-border/60 rounded-lg focus:outline-none focus:border-natural-primary"
                placeholder="Check flooring profiles, radiator plumbing paths, door thresholds..."
                value={activeRoom.notes || ""}
                onChange={(e) => onUpdateRoom({ ...activeRoom, notes: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* MEASUREMENTS CALCULATOR COLUMN */}
        <div className="p-5 bg-white border border-natural-border rounded-2xl shadow-sm space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold font-serif text-natural-text-head uppercase tracking-wider flex items-center gap-1.5">
              <Calculator size={14} className="text-natural-primary" />
              Dimensions & Estimations
            </h4>
            <button
              onClick={() => setIsEditingSpecs(!isEditingSpecs)}
              className="text-[11px] font-bold text-natural-primary hover:text-natural-primary-hover"
            >
              {isEditingSpecs ? "Cancel" : "Configure"}
            </button>
          </div>

          {isEditingSpecs ? (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 font-semibold block mb-0.5">Length (m)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="3.5"
                    value={specL}
                    onChange={(e) => setSpecL(e.target.value !== "" ? parseFloat(e.target.value) : "")}
                    className="w-full text-xs p-1.5 border border-zinc-200 rounded-md focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-semibold block mb-0.5">Width (m)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="2.8"
                    value={specW}
                    onChange={(e) => setSpecW(e.target.value !== "" ? parseFloat(e.target.value) : "")}
                    className="w-full text-xs p-1.5 border border-zinc-200 rounded-md focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-semibold block mb-0.5">Height (m)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="2.7"
                    value={specH}
                    onChange={(e) => setSpecH(e.target.value !== "" ? parseFloat(e.target.value) : "")}
                    className="w-full text-xs p-1.5 border border-zinc-200 rounded-md focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={handleAutoCalcSpecs}
                  className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-[10px] text-zinc-700 font-semibold rounded"
                >
                  Auto-Calculate Areas
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-medium">Floor / Ceiling (m²)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Calculated"
                    value={specFloorArea}
                    onChange={(e) => setSpecFloorArea(e.target.value !== "" ? parseFloat(e.target.value) : "")}
                    className="w-full p-1.5 border border-zinc-250 rounded-md focus:outline-none bg-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 font-medium">Wall Area (m²)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Calculated"
                    value={specWallArea}
                    onChange={(e) => setSpecWallArea(e.target.value !== "" ? parseFloat(e.target.value) : "")}
                    className="w-full p-1.5 border border-zinc-250 rounded-md focus:outline-none bg-zinc-50"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveSpecs}
                className="w-full mt-2 py-1.5 text-center bg-natural-primary hover:bg-natural-primary-hover text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Apply Room Specs
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {/* Output specifications table */}
              <div className="grid grid-cols-3 gap-2 text-[11px] bg-natural-bg p-2.5 rounded-xl border border-natural-border/30">
                <div>
                  <span className="text-natural-text-muted block font-medium">Length</span>
                  <span className="text-natural-text-head font-bold font-serif">{activeRoom.measurements?.length ? `${activeRoom.measurements.length}m` : "—"}</span>
                </div>
                <div>
                  <span className="text-natural-text-muted block font-medium">Width</span>
                  <span className="text-natural-text-head font-bold font-serif">{activeRoom.measurements?.width ? `${activeRoom.measurements.width}m` : "—"}</span>
                </div>
                <div>
                  <span className="text-natural-text-muted block font-medium">Height</span>
                  <span className="text-natural-text-head font-bold font-serif">{activeRoom.measurements?.height ? `${activeRoom.measurements.height}m` : "—"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-natural-text-muted font-medium">
                <div className="p-2 bg-natural-bg/50 border border-natural-border/20 rounded-lg">
                  <span className="text-natural-text-muted block">Floor Area</span>
                  <b className="text-xs text-natural-text-head font-serif">{activeRoom.measurements?.floorArea ? `${activeRoom.measurements.floorArea} m²` : "—"}</b>
                </div>
                <div className="p-2 bg-natural-bg/50 border border-natural-border/20 rounded-lg">
                  <span className="text-natural-text-muted block">Wall Area</span>
                  <b className="text-xs text-natural-text-head font-serif">{activeRoom.measurements?.wallArea ? `${activeRoom.measurements.wallArea} m²` : "—"}</b>
                </div>
              </div>

              {/* Dynamic calculations list */}
              {activeRoom.measurements?.floorArea || activeRoom.measurements?.wallArea ? (
                <div className="border-t border-natural-border/40 pt-2.5 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-natural-text-muted uppercase tracking-widest block mb-1">Project material guidelines</span>
                  
                  {computedWallAreaSqM > 0 && (
                    <div className="flex justify-between text-natural-text-muted font-semibold">
                      <span>Paint Needed (Wall, 2 coats):</span>
                      <span className="font-serif font-bold text-natural-text-head">{estPaintLitres} Litres</span>
                    </div>
                  )}

                  {computedFloorAreaSqM > 0 && (
                    <div className="flex justify-between text-natural-text-muted font-semibold">
                      <span>Flooring Packs (approx.):</span>
                      <span className="font-serif font-bold text-natural-text-head">{estFlooringBoxes} Boxes</span>
                    </div>
                  )}

                  {computedWallAreaSqM > 0 && (
                    <div className="flex justify-between text-natural-text-muted font-semibold">
                      <span>Wall Tiling packs (approx.):</span>
                      <span className="font-serif font-bold text-natural-text-head">{estTilePacks} Packs</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-natural-text-muted/70 italic">Configure length, width, and height specs to see paint and tiling materials calculators automatically map guidelines.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FILTER & CONTROL PANEL */}
      <div className="p-4 bg-white border border-natural-border rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center text-natural-text-muted">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search material items, suppliers, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-natural-border rounded-xl focus:outline-none focus:border-natural-primary bg-white text-natural-text-head"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 select-status-wrapper">
            <span className="text-natural-text-muted font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-1.5 px-2.5 bg-natural-sidebar border border-natural-border/60 rounded-lg focus:outline-none focus:bg-white focus:border-natural-border text-xs text-natural-text-head font-semibold cursor-pointer"
            >
              <option value="all">All statuses</option>
              {statuses.map(s => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 select-sort-wrapper">
            <span className="text-natural-text-muted font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-2.5 bg-natural-sidebar border border-natural-border/60 rounded-lg focus:outline-none focus:bg-white focus:border-natural-border text-xs text-natural-text-head font-semibold cursor-pointer"
            >
              <option value="date">Date added</option>
              <option value="cost">Total Cost</option>
              <option value="supplier">Supplier name</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 bg-natural-sidebar border border-natural-border/40 rounded-lg hover:bg-natural-border/80 transition-colors cursor-pointer"
              title="Toggle sort direction"
            >
              <ArrowUpDown size={13} className="text-natural-text-head" />
            </button>
          </div>
        </div>

      </div>

      {/* CATEGORIES GRID BLOCK AND ITEMS CONTAINER */}
      <div className="space-y-6">
        
        {/* Helper layout to create a new bespoke Category inside this room */}
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-zinc-900 text-sm">Room Categories & Custom Groups</h3>
          
          {isAddingCategory ? (
            <form onSubmit={handleCreateCategorySubmit} className="flex items-center gap-1.5">
              <input
                type="text"
                required
                placeholder="Category name (e.g. Paint)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
              />
              <select
                value={newCatUnit}
                onChange={(e) => setNewCatUnit(e.target.value)}
                className="px-2 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white"
              >
                <option value="unit">unit</option>
                <option value="sq_m">sq_m</option>
                <option value="m">meter</option>
                <option value="l">litre</option>
                <option value="pack">pack</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-semibold rounded-lg"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="px-2.5 py-1.5 text-xs text-zinc-500 bg-white border border-zinc-200 rounded-lg"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingCategory(true)}
              className="text-xs font-semibold text-emerald-700 flex items-center gap-1 hover:text-emerald-950"
            >
              <FolderPlus size={14} />
              Add Custom Category group
            </button>
          )}
        </div>

         {/* List categories with assigned items inside */}
        {roomCategories.length === 0 ? (
          <div className="p-8 text-center bg-natural-bg rounded-xl border border-dashed border-natural-border text-xs text-natural-text-muted space-y-1">
            <FolderPlus size={24} className="mx-auto text-natural-primary mb-1" />
            <p>No customized categories created inside this Room Space yet.</p>
            <p className="text-[10px]">Create custom categories like "Flooring," "Paint," "Timber," or "Appliances" to structure room designs.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {roomCategories.map((catKey) => {
              // Get items related to this specific category
              const catFilteredItems = searchedAndFilteredItems.filter(it => it.categoryId === catKey.id);
              
              return (
                <div key={catKey.id} className="bg-white border border-natural-border rounded-2xl overflow-hidden shadow-sm">
                  
                  {/* Category Header Bar */}
                  <div className="px-5 py-3 bg-natural-sidebar border-b border-natural-border flex justify-between items-center">
                    <div>
                      <h4 className="font-serif font-bold text-xs text-natural-text-head uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-natural-primary rounded-full"></span>
                        {catKey.name}
                      </h4>
                      {catKey.description && (
                        <p className="text-[10px] text-natural-text-muted mt-0.5">{catKey.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-natural-text-muted font-bold">
                        {catFilteredItems.length} items catalogued
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove the Category group '${catKey.name}'? Items tagged inside will remain, but become uncategorized.`)) {
                            onDeleteCategory(catKey.id);
                          }
                        }}
                        className="p-1 text-natural-text-muted hover:text-red-500 rounded-md transition-colors cursor-pointer"
                        title="Delete this Category group"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Items inside category list */}
                  <div className="divide-y divide-natural-border/40">
                    {catFilteredItems.length === 0 ? (
                      <div className="p-6 text-center text-xs text-natural-text-muted italic">
                        No product options registered in this group. 
                        {" "}
                        <button 
                          onClick={onAddItem}
                          className="font-bold text-natural-primary hover:underline inline-flex items-center"
                        >
                          Add new item <Plus size={11} className="ml-0.5" />
                        </button>
                      </div>
                    ) : (
                      catFilteredItems.map((item) => {
                        const statusColor = statuses.find(s => s.name === item.status)?.color || "slate";
                        return (
                          <div 
                            key={item.id} 
                            className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between hover:bg-natural-bg/40 transition-colors"
                          >
                            {/* Product Info Segment */}
                            <div className="flex items-center gap-4 overflow-hidden flex-1 min-w-0">
                              <img
                                src={item.thumbnailUrl}
                                alt=""
                                className="w-12 h-12 object-cover rounded-lg border border-natural-border shrink-0 shadow-sm"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80';
                                }}
                              />
                              <div className="overflow-hidden space-y-0.5">
                                <div className="flex items-center gap-2 wrap flex-wrap">
                                  <h5 className="font-serif font-bold text-xs text-natural-text-head line-clamp-1">{item.name}</h5>
                                  <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-natural-border/45 bg-white uppercase ${
                                    statusColor === "emerald" ? "text-natural-primary border-natural-accent bg-[#DDE2C6]/50" :
                                    statusColor === "blue" ? "text-blue-800 border-blue-105 bg-blue-50/50" :
                                    statusColor === "amber" ? "text-amber-800 border-amber-105 bg-amber-50/50" :
                                    statusColor === "indigo" ? "text-indigo-800 border-indigo-105 bg-indigo-50/50" :
                                    statusColor === "red" ? "text-red-800 border-red-105 bg-red-50/50" :
                                    "text-natural-text-muted"
                                  }`}>
                                    {item.status}
                                  </span>
                                  {item.priority === 'High' && (
                                    <span className="text-[8px] bg-red-100 text-red-950 font-black px-1.5 py-0.2 rounded uppercase">Urgent</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-natural-text-muted line-clamp-1 italic">{item.description || "No specifications description catalogued."}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-natural-text-muted font-bold flex-wrap">
                                  {item.supplier && <span>Store: <b>{item.supplier}</b></span>}
                                  {item.supplier && item.tags.length > 0 && <span>•</span>}
                                  {item.tags.map((tg, idx) => (
                                    <span key={idx} className="bg-natural-bg p-0.5 px-1.5 rounded text-natural-primary font-semibold">{tg}</span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Costings Metrics Block */}
                            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-natural-border/30">
                              <div className="text-right flex flex-col justify-center">
                                <span className="font-serif font-bold text-xs text-natural-text-head">
                                  {currencySymbol}{item.estimatedTotal.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-natural-text-muted font-semibold">
                                  {currencySymbol}{item.unitPrice}/{item.unitType === 'unit' ? 'pc' : item.unitType} × {item.quantity}
                                  {item.wastePercentage > 0 ? ` (+${item.wastePercentage}% waste)` : ""}
                                </span>
                              </div>

                              {/* Action Items Panel */}
                              <div className="flex items-center gap-1">
                                {item.productUrl && (
                                  <a
                                    href={item.productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 px-1.5 font-bold text-[10px] text-natural-primary bg-natural-accent hover:bg-natural-accent/80 rounded-md border border-natural-border/60 transition-colors flex items-center gap-0.5"
                                  >
                                    <span>Link</span>
                                    <ExternalLink size={10} />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onEditItem(item)}
                                  className="p-1.5 text-natural-text-muted hover:text-natural-primary hover:bg-natural-bg rounded-md transition-colors cursor-pointer"
                                  title="Edit item specifications"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Delete catalog item '${item.name}'?`)) {
                                      onDeleteItem(item.id);
                                    }
                                  }}
                                  className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: CREATE ROOM */}
      {isAddingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1E16]/60 backdrop-blur-xs text-natural-text-head">
          <div className="bg-white rounded-2xl shadow-xl border border-natural-border w-full max-w-sm p-6 overflow-hidden">
            <h3 className="font-serif font-bold text-base text-natural-text-head pb-3 border-b border-natural-border/60 mb-4">Create Room Space</h3>
            
            <form onSubmit={handleCreateRoomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-natural-text-head mb-1 font-serif">Room Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Bedroom"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg bg-white text-natural-text-head focus:outline-none focus:border-natural-primary font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-natural-text-head mb-1 font-serif">Description / Scope</label>
                <input
                  type="text"
                  placeholder="e.g. Victorian features restoration"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg bg-white text-natural-text-head focus:outline-none focus:border-natural-primary font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-natural-text-head mb-1 font-serif">Allocated Budget Limit ({currencySymbol})</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 5000"
                  value={newRoomBudget || ""}
                  onChange={(e) => setNewRoomBudget(e.target.value !== "" ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg bg-white text-natural-text-head focus:outline-none focus:border-natural-primary font-semibold"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-natural-border/60">
                <button
                  type="button"
                  onClick={() => setIsAddingRoom(false)}
                  className="px-4 py-2 text-xs font-bold text-natural-text-head bg-white border border-natural-border hover:bg-natural-sidebar rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-natural-primary hover:bg-natural-primary-hover rounded-xl shadow-xs cursor-pointer shadow-natural-primary/10"
                >
                  Create Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ROOM DETAILS */}
      {isEditingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1E16]/60 backdrop-blur-xs text-natural-text-head">
          <div className="bg-white rounded-2xl shadow-xl border border-natural-border w-full max-w-sm p-6 overflow-hidden">
            <h2 className="font-serif font-bold text-base text-natural-text-head pb-3 border-b border-natural-border/60 mb-4">Edit Room details</h2>
            
            <form onSubmit={handleUpdateRoomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-natural-text-head mb-1 font-serif">Room Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Living Area"
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg bg-white text-natural-text-head focus:outline-none focus:border-natural-primary font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3E3D39] mb-1 font-serif">Description / Scope of Work</label>
                <input
                  type="text"
                  placeholder="e.g. Flooring and feature wall detailing"
                  value={editRoomDesc}
                  onChange={(e) => setEditRoomDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg bg-white text-natural-text-head focus:outline-none focus:border-natural-primary font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3E3D39] mb-1 font-serif">Allocated Budget Limit ({currencySymbol})</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 10000"
                  value={editRoomBudget || ""}
                  onChange={(e) => setEditRoomBudget(e.target.value !== "" ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg bg-white text-natural-text-head focus:outline-none focus:border-natural-primary font-semibold"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-natural-border/60">
                <button
                  type="button"
                  onClick={() => setIsEditingRoom(false)}
                  className="px-4 py-2 text-xs font-bold text-natural-text-head bg-white border border-natural-border hover:bg-natural-sidebar rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-natural-primary hover:bg-natural-primary-hover rounded-xl shadow-xs cursor-pointer shadow-natural-primary/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
