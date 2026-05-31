import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import RoomView from "./components/RoomView";
import CategoryView from "./components/CategoryView";
import BoardView from "./components/BoardView";
import TableView from "./components/TableView";
import ComparisonView from "./components/ComparisonView";
import MoodboardView from "./components/MoodboardView";
import FinalItemsView from "./components/FinalItemsView";
import ItemDialog from "./components/ItemDialog";

import { Project, Room, Category, Item, CustomStatus, Attachment } from "./types";
import { 
  MOCK_PROJECTS, 
  MOCK_ROOMS, 
  MOCK_CATEGORIES, 
  MOCK_ITEMS, 
  DEFAULT_STATUSES 
} from "./mockData";
import { Sparkles, Calendar, Coins, Building, Info, AlertCircle, Plus } from "lucide-react";

export default function App() {
  // STATE DEFINITIONS
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>(MOCK_PROJECTS[0].id);

  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState<string>(MOCK_ROOMS[0].id);

  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const [statuses] = useState<CustomStatus[]>(DEFAULT_STATUSES);

  const [activeView, setActiveView] = useState<string>("dashboard");

  // Dialog State controls
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Active Selected Project helpers
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  // Helper arrays filtered to selected Project space
  const projectRooms = rooms.filter(r => r.projectId === activeProjectId);
  const projectRoomIds = projectRooms.map(r => r.id);
  const projectCategories = categories.filter(c => projectRoomIds.includes(c.roomId));
  const projectItems = items.filter(it => projectRoomIds.includes(it.roomId));

  // HANDLERS FOR PROJECT
  const handleAddProject = (newProj: Omit<Project, 'id' | 'currency'>) => {
    const freshId = `proj_${Date.now()}`;
    const constructed: Project = {
      ...newProj,
      id: freshId,
      currency: "GBP"
    };
    setProjects(prev => [...prev, constructed]);
    setActiveProjectId(freshId);

    // Bootstrap a default room in the new Project space so it isn't empty!
    const defaultRoomId = `room_boot_${Date.now()}`;
    const bootRoom: Room = {
      id: defaultRoomId,
      projectId: freshId,
      name: "Main Reception Space",
      description: "Default living space room container",
      notes: "",
      budget: 5000,
      measurements: {
        length: 4, width: 3, height: 2.7,
        floorArea: 12, wallArea: 34, ceilingArea: 12
      }
    };
    setRooms(prev => [...prev, bootRoom]);
    setActiveRoomId(defaultRoomId);

    // Bootstrap default category
    const defaultCatId = `cat_boot_${Date.now()}`;
    const bootCat: Category = {
      id: defaultCatId,
      roomId: defaultRoomId,
      name: "Flooring",
      description: "Laminates and timber alternatives",
      defaultUnitType: "sq_m"
    };
    setCategories(prev => [...prev, bootCat]);
  };

  // HANDLERS FOR ROOMS
  const handleAddRoom = (newRoom: Omit<Room, 'id'>) => {
    const freshId = `room_${Date.now()}`;
    const constructed: Room = {
      ...newRoom,
      id: freshId,
      projectId: activeProjectId
    };
    setRooms(prev => [...prev, constructed]);
    setActiveRoomId(freshId);

    // Bootstrap single default Category
    setCategories(prev => [...prev, {
      id: `cat_${Date.now()}`,
      roomId: freshId,
      name: "General Fittings",
      description: "",
      defaultUnitType: "unit"
    }]);
  };

  const handleUpdateRoom = (updatedRoom: Room) => {
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
  };

  const handleDuplicateRoom = (roomIdToDuplicate: string) => {
    const originalRoom = rooms.find(r => r.id === roomIdToDuplicate);
    if (!originalRoom) return;

    const duplicatedRoomId = `room_dup_${Date.now()}`;
    const clonedRoom: Room = {
      ...originalRoom,
      id: duplicatedRoomId,
      name: `${originalRoom.name} (Copy)`
    };

    // Find original categories & duplicate them mapping to newly created room space
    const originalCats = categories.filter(c => c.roomId === roomIdToDuplicate);
    const catIdMapping: Record<string, string> = {};

    const clonedCats = originalCats.map(cat => {
      const freshCatId = `cat_dup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      catIdMapping[cat.id] = freshCatId;
      return {
        ...cat,
        id: freshCatId,
        roomId: duplicatedRoomId
      };
    });

    // Find original items map and clone matching new categories id mapping
    const originalItems = items.filter(it => it.roomId === roomIdToDuplicate);
    const clonedItems = originalItems.map(item => ({
      ...item,
      id: `item_dup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      roomId: duplicatedRoomId,
      categoryId: catIdMapping[item.categoryId] || item.categoryId,
      createdAt: new Date().toISOString().split("T")[0]
    }));

    setRooms(prev => [...prev, clonedRoom]);
    setCategories(prev => [...prev, ...clonedCats]);
    setItems(prev => [...prev, ...clonedItems]);
    setActiveRoomId(duplicatedRoomId);
  };

  const handleDeleteRoom = (roomIdToDelete: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomIdToDelete));
    setCategories(prev => prev.filter(c => c.roomId !== roomIdToDelete));
    setItems(prev => prev.filter(it => it.roomId !== roomIdToDelete));

    // Fallback switch active room selectors
    const remains = rooms.filter(r => r.id !== roomIdToDelete && r.projectId === activeProjectId);
    if (remains.length > 0) {
      setActiveRoomId(remains[0].id);
    }
  };

  // HANDLERS FOR CATEGORIES
  const handleAddCategory = (newCat: Omit<Category, 'id'>) => {
    const freshId = `cat_${Date.now()}`;
    const constructed: Category = {
      ...newCat,
      id: freshId
    };
    setCategories(prev => [...prev, constructed]);
  };

  const handleDeleteCategory = (catIdToDelete: string) => {
    setCategories(prev => prev.filter(c => c.id !== catIdToDelete));
    // Items inside can match Unassigned placeholder or general category
  };

  // HANDLERS FOR ITEMS
  const handleStartAddItem = () => {
    // Collect active Room first category to serve as default
    const firstCat = projectCategories.find(c => c.roomId === activeRoomId) || projectCategories[0];
    
    const freshItem: Item = {
      id: `item_${Date.now()}`,
      projectId: activeProjectId,
      roomId: activeRoomId,
      categoryId: firstCat ? firstCat.id : "uncategorized",
      name: "",
      description: "",
      supplier: "",
      productUrl: "",
      thumbnailUrl: "",
      images: [],
      unitPrice: 0,
      unitType: "unit",
      quantity: 1,
      wastePercentage: 0,
      deliveryCost: 0,
      discount: 0,
      tax: 20, // 20% Standard UK VAT default
      estimatedTotal: 0,
      actualTotal: 0,
      status: "Proposed",
      priority: "Medium",
      notes: "",
      tags: [],
      attachments: [],
      history: [],
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0]
    };
    
    setEditingItem(freshItem);
    setIsItemDialogOpen(true);
  };

  const handleStartEditItem = (item: Item) => {
    setEditingItem(item);
    setIsItemDialogOpen(true);
  };

  const handleSaveItem = (saved: Item) => {
    const isNew = !items.some(it => it.id === saved.id);
    if (isNew) {
      setItems(prev => [...prev, saved]);
    } else {
      setItems(prev => prev.map(it => it.id === saved.id ? saved : it));
    }
    setIsItemDialogOpen(false);
    setEditingItem(null);
  };

  const handleUpdateItemDirectly = (updated: Item) => {
    setItems(prev => prev.map(it => it.id === updated.id ? updated : it));
  };

  const handleDeleteItem = (itemIdToDelete: string) => {
    setItems(prev => prev.filter(it => it.id !== itemIdToDelete));
  };


  return (
    <div className="flex bg-natural-bg font-sans h-screen w-screen overflow-hidden">
      
      {/* Side drawer Navigation projects container panel */}
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onAddProject={handleAddProject}
        activeView={activeView}
        onSelectView={setActiveView}
      />

      {/* Main viewport area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        
        {/* UPPER STATUS HEAD WITH PROJECT METRICS FOR QUICK AUDIT */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between border-b border-natural-border pb-4 gap-4 no-print sm:items-stretch">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-natural-accent text-natural-primary rounded-xl shadow-xs">
              <Building size={20} />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl text-natural-text-head leading-tight">
                {activeProject.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-natural-text-muted mt-1 font-semibold">
                <span className="flex items-center gap-0.5"><Calendar size={11} /> Est: {activeProject.startDate} to {activeProject.targetCompletionDate}</span>
                <span>•</span>
                <span>Location: {activeProject.propertyName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 select-none self-end flex-wrap">
            <div className="p-2 px-3.5 bg-white border border-natural-border rounded-xl text-right shadow-sm">
              <span className="text-[9px] font-bold text-natural-text-muted uppercase tracking-widest block">Allocated Budget</span>
              <span className="font-serif text-sm font-bold text-natural-text-head">£{activeProject.budget.toLocaleString()}</span>
            </div>

            <button
              onClick={handleStartAddItem}
              className="px-4 py-2 bg-natural-primary hover:bg-natural-primary-hover text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm shadow-natural-primary/20 cursor-pointer"
            >
              <Plus size={14} />
              Add Product / Option
            </button>
          </div>
        </div>

        {/* ACTIVE CONDITIONAL FOR EACH VIEW RENDER BLOCK */}
        <div className="pb-16">
          {activeView === "dashboard" && (
            <DashboardView
              project={activeProject}
              rooms={projectRooms}
              categories={projectCategories}
              items={projectItems}
              onEditItem={handleStartEditItem}
              onNavigateToView={setActiveView}
            />
          )}

          {activeView === "rooms" && (
            <RoomView
              rooms={projectRooms}
              categories={projectCategories}
              items={projectItems}
              activeRoomId={activeRoomId}
              onSelectRoom={setActiveRoomId}
              onAddRoom={handleAddRoom}
              onUpdateRoom={handleUpdateRoom}
              onDuplicateRoom={handleDuplicateRoom}
              onDeleteRoom={handleDeleteRoom}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddItem={handleStartAddItem}
              onEditItem={handleStartEditItem}
              onDeleteItem={handleDeleteItem}
              statuses={statuses}
            />
          )}

          {activeView === "categories" && (
            <CategoryView
              categories={projectCategories}
              rooms={projectRooms}
              items={projectItems}
              onEditItem={handleStartEditItem}
              onDeleteItem={handleDeleteItem}
              statuses={statuses}
            />
          )}

          {activeView === "board" && (
            <BoardView
              items={projectItems}
              rooms={projectRooms}
              categories={projectCategories}
              statuses={statuses}
              onEditItem={handleStartEditItem}
            />
          )}

          {activeView === "table" && (
            <TableView
              items={projectItems}
              rooms={projectRooms}
              categories={projectCategories}
              statuses={statuses}
              onUpdateItemDirectly={handleUpdateItemDirectly}
              onDeleteItem={handleDeleteItem}
              onEditItem={handleStartEditItem}
            />
          )}

          {activeView === "comparison" && (
            <ComparisonView
              items={projectItems}
              rooms={projectRooms}
              categories={projectCategories}
              statuses={statuses}
            />
          )}

          {activeView === "canvas" && (
            <MoodboardView
              items={projectItems}
              rooms={projectRooms}
            />
          )}

          {activeView === "final" && (
            <FinalItemsView
              items={projectItems}
              rooms={projectRooms}
              categories={projectCategories}
              statuses={statuses}
            />
          )}
        </div>

      </main>

      {/* COMPACT MODAL: PRODUCT DETAILS ADD / EDIT DIALOG */}
      {isItemDialogOpen && editingItem && (
        <ItemDialog
          isOpen={isItemDialogOpen}
          onClose={() => {
            setIsItemDialogOpen(false);
            setEditingItem(null);
          }}
          itemToEdit={editingItem}
          onSave={handleSaveItem}
          categories={projectCategories}
          rooms={projectRooms}
          currentRoomId={activeRoomId}
          statuses={statuses}
        />
      )}

    </div>
  );
}
