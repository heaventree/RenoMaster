import React, { useState, useEffect } from "react";
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
import { 
  Sparkles, 
  Calendar, 
  Coins, 
  Building, 
  Info, 
  AlertCircle, 
  Plus,
  LayoutDashboard,
  Home,
  KanbanSquare,
  CheckSquare,
  Menu,
  Tag,
  Table,
  ClipboardList,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";

export default function App() {
  // STATE DEFINITIONS
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>(MOCK_PROJECTS[0].id);

  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState<string>(MOCK_ROOMS[0].id);

  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const [statuses] = useState<CustomStatus[]>(DEFAULT_STATUSES);

  // Synchronize on mounts
  useEffect(() => {
    fetch("/api/all-data")
      .then(res => res.json())
      .then(data => {
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects);
          setActiveProjectId(prev => {
            const hasPrev = data.projects.some((p: any) => p.id === prev);
            return hasPrev ? prev : data.projects[0].id;
          });
        }
        if (data.rooms) {
          setRooms(data.rooms);
          setActiveRoomId(prev => {
            const hasPrev = data.rooms.some((r: any) => r.id === prev);
            return hasPrev ? prev : (data.rooms.length > 0 ? data.rooms[0].id : "");
          });
        }
        if (data.categories) {
          setCategories(data.categories);
        }
        if (data.items) {
          setItems(data.items);
        }
      })
      .catch(err => console.error("Error fetching all database data:", err));
  }, []);

  const [currency, setCurrency] = useState<string>(() => {
    return localStorage.getItem("renovation_currency") || "GBP";
  });

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      GBP: "£",
      USD: "$",
      EUR: "€",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
    };
    return symbols[code] || "£";
  };

  const currencySymbol = getCurrencySymbol(currency);

  const [activeView, setActiveView] = useState<string>("dashboard");

  // Dialog State controls
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

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

    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(constructed)
    }).catch(err => console.error("Database project add failed:", err));

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

    fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bootRoom)
    }).catch(err => console.error("Database room bootstrap failed:", err));

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

    fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bootCat)
    }).catch(err => console.error("Database category bootstrap failed:", err));

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

    fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(constructed)
    }).catch(err => console.error("Database room add failed:", err));

    setRooms(prev => [...prev, constructed]);
    setActiveRoomId(freshId);

    // Bootstrap single default Category
    const bootCat = {
      id: `cat_${Date.now()}`,
      roomId: freshId,
      name: "General Fittings",
      description: "",
      defaultUnitType: "unit"
    };

    fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bootCat)
    }).catch(err => console.error("Database category add failed:", err));

    setCategories(prev => [...prev, bootCat]);
  };

  const handleUpdateRoom = (updatedRoom: Room) => {
    fetch(`/api/rooms/${updatedRoom.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedRoom)
    }).catch(err => console.error("Database room update failed:", err));

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

    fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clonedRoom)
    }).catch(err => console.error("Database room duplication failed:", err));

    // Find original categories & duplicate them mapping to newly created room space
    const originalCats = categories.filter(c => c.roomId === roomIdToDuplicate);
    const catIdMapping: Record<string, string> = {};

    const clonedCats = originalCats.map(cat => {
      const freshCatId = `cat_dup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      catIdMapping[cat.id] = freshCatId;
      const freshCat = {
        ...cat,
        id: freshCatId,
        roomId: duplicatedRoomId
      };

      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(freshCat)
      }).catch(err => console.error("Database duplicated category add failed:", err));

      return freshCat;
    });

    // Find original items map and clone matching new categories id mapping
    const originalItems = items.filter(it => it.roomId === roomIdToDuplicate);
    const clonedItems = originalItems.map(item => {
      const freshItem = {
        ...item,
        id: `item_dup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        roomId: duplicatedRoomId,
        categoryId: catIdMapping[item.categoryId] || item.categoryId,
        createdAt: new Date().toISOString().split("T")[0]
      };

      fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(freshItem)
      }).catch(err => console.error("Database duplicated item add failed:", err));

      return freshItem;
    });

    setRooms(prev => [...prev, clonedRoom]);
    setCategories(prev => [...prev, ...clonedCats]);
    setItems(prev => [...prev, ...clonedItems]);
    setActiveRoomId(duplicatedRoomId);
  };

  const handleDeleteRoom = (roomIdToDelete: string) => {
    fetch(`/api/rooms/${roomIdToDelete}`, {
      method: "DELETE"
    }).catch(err => console.error("Database room delete failed:", err));

    // Cascade delete related categories and items in database triggers too
    const catsToDelete = categories.filter(c => c.roomId === roomIdToDelete);
    catsToDelete.forEach(c => {
      fetch(`/api/categories/${c.id}`, { method: "DELETE" }).catch(err => console.error("Cascade cat delete failed:", err));
    });

    const itemsToDelete = items.filter(it => it.roomId === roomIdToDelete);
    itemsToDelete.forEach(it => {
      fetch(`/api/items/${it.id}`, { method: "DELETE" }).catch(err => console.error("Cascade item delete failed:", err));
    });

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

    fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(constructed)
    }).catch(err => console.error("Database category creation failed:", err));

    setCategories(prev => [...prev, constructed]);
  };

  const handleDeleteCategory = (catIdToDelete: string) => {
    fetch(`/api/categories/${catIdToDelete}`, {
      method: "DELETE"
    }).catch(err => console.error("Database category delete failed:", err));

    setCategories(prev => prev.filter(c => c.id !== catIdToDelete));
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
      fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saved)
      }).catch(err => console.error("Database item creation failed:", err));

      setItems(prev => [...prev, saved]);
    } else {
      fetch(`/api/items/${saved.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saved)
      }).catch(err => console.error("Database item update failed:", err));

      setItems(prev => prev.map(it => it.id === saved.id ? saved : it));
    }
    setIsItemDialogOpen(false);
    setEditingItem(null);
  };

  const handleUpdateItemDirectly = (updated: Item) => {
    fetch(`/api/items/${updated.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    }).catch(err => console.error("Database item inline update failed:", err));

    setItems(prev => prev.map(it => it.id === updated.id ? updated : it));
  };

  const handleDeleteItem = (itemIdToDelete: string) => {
    fetch(`/api/items/${itemIdToDelete}`, {
      method: "DELETE"
    }).catch(err => console.error("Database item delete failed:", err));

    setItems(prev => prev.filter(it => it.id !== itemIdToDelete));
  };


  return (
    <div className="flex flex-col md:flex-row bg-natural-bg font-sans h-screen w-screen overflow-hidden">
      
      {/* Mobile Top Header Bar */}
      <header className="md:hidden sticky top-0 left-0 right-0 h-14 bg-natural-sidebar border-b border-natural-border flex items-center justify-between px-4 z-30 shrink-0 no-print">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-natural-primary flex items-center justify-center font-serif font-bold text-white text-xs">
            R
          </div>
          <div>
            <h1 className="font-serif font-bold text-xs text-natural-text-head tracking-tight">Renovation Studio</h1>
            <p className="text-[9px] text-natural-text-muted font-medium">Refurbishment Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick Add trigger */}
          <button
            onClick={handleStartAddItem}
            className="p-1.5 bg-natural-primary text-white rounded-lg hover:bg-natural-primary-hover shadow-sm transition-colors cursor-pointer animate-pulse"
            title="Add Product Choice"
          >
            <Plus size={14} />
          </button>
          
          <button
            onClick={() => setIsMobileMoreOpen(true)}
            className="p-1.5 text-natural-text-muted hover:text-natural-text-head bg-white/40 rounded-lg border border-natural-border/30 cursor-pointer"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </header>

      {/* Side drawer Navigation projects container panel */}
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onAddProject={handleAddProject}
        activeView={activeView}
        onSelectView={setActiveView}
        currencySymbol={currencySymbol}
        showAddProjectModal={showAddProjectModal}
        setShowAddProjectModal={setShowAddProjectModal}
      />

      {/* Main viewport area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 custom-scrollbar">
        
        {/* UPPER STATUS HEAD WITH PROJECT METRICS FOR QUICK AUDIT */}
        <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between border-b border-natural-border pb-4 gap-4 no-print sm:items-stretch">
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
            {/* Currency selector */}
            <div className="flex items-center gap-1 bg-white border border-natural-border px-2.5 py-1.5 rounded-xl shadow-sm text-xs font-semibold text-natural-text-muted">
              <span className="text-[10px] font-bold text-natural-text-muted uppercase tracking-wider">Currency:</span>
              <select
                id="currency_selector"
                value={currency}
                onChange={(e) => {
                  const val = e.target.value;
                  setCurrency(val);
                  localStorage.setItem("renovation_currency", val);
                }}
                className="text-xs font-bold text-natural-text-head bg-transparent border-none outline-none focus:ring-0 cursor-pointer p-0 select-none"
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>

            <div className="p-2 px-3.5 bg-white border border-natural-border rounded-xl text-right shadow-sm">
              <span className="text-[9px] font-bold text-natural-text-muted uppercase tracking-widest block">Allocated Budget</span>
              <span className="font-serif text-sm font-bold text-natural-text-head">{currencySymbol}{activeProject.budget.toLocaleString()}</span>
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
              currencySymbol={currencySymbol}
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
              currencySymbol={currencySymbol}
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
              currencySymbol={currencySymbol}
            />
          )}

          {activeView === "board" && (
            <BoardView
              items={projectItems}
              rooms={projectRooms}
              categories={projectCategories}
              statuses={statuses}
              onEditItem={handleStartEditItem}
              currencySymbol={currencySymbol}
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
              currencySymbol={currencySymbol}
            />
          )}

          {activeView === "comparison" && (
            <ComparisonView
              items={projectItems}
              rooms={projectRooms}
              categories={projectCategories}
              statuses={statuses}
              currencySymbol={currencySymbol}
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
              currencySymbol={currencySymbol}
            />
          )}
        </div>

      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-natural-sidebar border-t border-natural-border flex items-center justify-around px-2 z-40 md:hidden no-print shadow-lg shadow-natural-text-main/10 rounded-t-xl">
        <button
          onClick={() => {
            setActiveView("dashboard");
            setIsMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer ${
            activeView === "dashboard" && !isMobileMoreOpen
              ? "text-natural-primary font-bold scale-102"
              : "text-natural-text-muted hover:text-natural-text-head"
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[10px] mt-1 tracking-wider uppercase font-semibold">Dashboard</span>
        </button>

        <button
          onClick={() => {
            setActiveView("rooms");
            setIsMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer ${
            activeView === "rooms" && !isMobileMoreOpen
              ? "text-natural-primary font-bold scale-102"
              : "text-natural-text-muted hover:text-natural-text-head"
          }`}
        >
          <Home size={18} />
          <span className="text-[10px] mt-1 tracking-wider uppercase font-semibold">Spaces</span>
        </button>

        <button
          onClick={() => {
            setActiveView("board");
            setIsMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer ${
            activeView === "board" && !isMobileMoreOpen
              ? "text-natural-primary font-bold scale-102"
              : "text-natural-text-muted hover:text-natural-text-head"
          }`}
        >
          <KanbanSquare size={18} />
          <span className="text-[10px] mt-1 tracking-wider uppercase font-semibold">Moodboard</span>
        </button>

        <button
          onClick={() => {
            setActiveView("final");
            setIsMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer ${
            activeView === "final" && !isMobileMoreOpen
              ? "text-natural-primary font-bold scale-102"
              : "text-natural-text-muted hover:text-natural-text-head"
          }`}
        >
          <CheckSquare size={18} />
          <span className="text-[10px] mt-1 tracking-wider uppercase font-semibold">Procure</span>
        </button>

        <button
          onClick={() => setIsMobileMoreOpen(prev => !prev)}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer ${
            isMobileMoreOpen
              ? "text-natural-primary font-bold scale-102"
              : "text-natural-text-muted hover:text-natural-text-head"
          }`}
        >
          <Menu size={18} />
          <span className="text-[10px] mt-1 tracking-wider uppercase font-semibold">More</span>
        </button>
      </nav>

      {/* Mobile Drawer Options Panel */}
      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 backdrop-blur-subtle md:hidden animate-fadeIn">
          {/* Backdrop Dismiss Click Area */}
          <div className="absolute inset-0 animate-fadeIn" onClick={() => setIsMobileMoreOpen(false)}></div>
          
          <div className="relative w-full max-h-[80vh] bg-white rounded-t-3xl border-t border-natural-border px-5 py-6 overflow-y-auto z-40 flex flex-col gap-5 animate-slideUp custom-scrollbar">
            
            {/* Header selector Indicator line */}
            <div className="mx-auto w-12 h-1.5 bg-natural-border rounded-full hover:bg-natural-text-muted mb-2 shrink-0" onClick={() => setIsMobileMoreOpen(false)}></div>

            <div className="flex justify-between items-center pb-2 border-b border-natural-border">
              <h3 className="font-serif font-bold text-base text-natural-text-head">Additional Workspaces</h3>
              <button 
                onClick={() => setIsMobileMoreOpen(false)}
                className="text-xs font-bold text-natural-primary hover:bg-natural-sidebar p-1.5 px-3 rounded-xl border border-natural-border transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Other view navigations */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-natural-text-muted uppercase tracking-wider block px-1">Alternative Workspace Views</span>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "categories", label: "Category Analytics", icon: Tag, desc: "Aggregated costs list" },
                  { id: "table", label: "Sheet Ledger", icon: Table, desc: "Editable tabular grid" },
                  { id: "comparison", label: "Spec Compare", icon: Sparkles, desc: "Evaluate options side-by-side" },
                  { id: "canvas", label: "Color Palette", icon: ClipboardList, desc: "Aesthetic swatch canvas" },
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setIsMobileMoreOpen(false);
                      }}
                      className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isActive
                          ? "bg-natural-primary border-natural-primary text-white"
                          : "bg-natural-bg/50 border-natural-border/60 hover:bg-natural-sidebar text-natural-text-head"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs font-serif">
                        <Icon size={14} className={isActive ? "text-natural-accent" : "text-natural-primary"} />
                        <span>{item.label}</span>
                      </div>
                      <span className={`text-[9px] mt-1 font-semibold ${isActive ? "text-white/80" : "text-natural-text-muted"}`}>
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project Switcher section */}
            <div className="space-y-2 pt-2 border-t border-natural-border/40">
              <span className="text-[10px] font-bold text-natural-text-muted uppercase tracking-wider block px-1">Switch Renovation Project</span>
              <div className="relative">
                <select
                  value={activeProjectId}
                  onChange={(e) => {
                    setActiveProjectId(e.target.value);
                    setIsMobileMoreOpen(false);
                  }}
                  className="w-full pl-3 pr-8 py-3 bg-natural-bg border border-natural-border text-natural-text-head text-xs font-bold rounded-xl focus:outline-none focus:border-natural-primary cursor-pointer appearance-none animate-fadeIn"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="text-[#3E3D39] font-semibold">{p.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-natural-primary">
                  <ChevronDown size={14} />
                </div>
              </div>
              
              {/* Show Add Project trigger too */}
              <button
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setShowAddProjectModal(true);
                }}
                className="flex items-center justify-center gap-1.5 w-full mt-2 py-3 bg-natural-sidebar text-natural-primary hover:bg-[#DDE2C6] rounded-xl text-xs font-bold transition-colors cursor-pointer border border-natural-border/70"
              >
                <Plus size={13} />
                Add New Project Space
              </button>
            </div>

          </div>
        </div>
      )}

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
          currencySymbol={currencySymbol}
        />
      )}

    </div>
  );
}
