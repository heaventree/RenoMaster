import React, { useState } from "react";
import { Project } from "../types";
import {
  LayoutDashboard,
  Home,
  Tag,
  KanbanSquare,
  Table,
  CheckSquare,
  Sparkles,
  ClipboardList,
  Plus,
  Coins,
  Settings,
  Calendar,
  Building,
  ChevronDown
} from "lucide-react";

interface SidebarProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onAddProject: (p: Omit<Project, 'id' | 'currency'>) => void;
  activeView: string;
  onSelectView: (view: string) => void;
}

export default function Sidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  activeView,
  onSelectView
}: SidebarProps) {
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjProp, setNewProjProp] = useState("");
  const [newProjBudget, setNewProjBudget] = useState<number>(20000);
  const [newProjNotes, setNewProjNotes] = useState("");
  const [newProjStart, setNewProjStart] = useState("");
  const [newProjEnd, setNewProjEnd] = useState("");

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    onAddProject({
      name: newProjName.trim(),
      propertyName: newProjProp.trim() || "Unspecified Location",
      budget: Number(newProjBudget) || 10000,
      status: "Planning",
      notes: newProjNotes.trim(),
      startDate: newProjStart || new Date().toISOString().split('T')[0],
      targetCompletionDate: newProjEnd || new Date().toISOString().split('T')[0]
    });

    // Reset fields
    setNewProjName("");
    setNewProjProp("");
    setNewProjBudget(20000);
    setNewProjNotes("");
    setNewProjStart("");
    setNewProjEnd("");
    setShowAddProjectModal(false);
  };

  const navMenuItems = [
    { id: "dashboard", label: "Project Dashboard", icon: LayoutDashboard },
    { id: "rooms", label: "Room Spaces", icon: Home },
    { id: "categories", label: "Category Aggregator", icon: Tag },
    { id: "board", label: "Pinterest Moodboard", icon: KanbanSquare },
    { id: "table", label: "Spreadsheet Ledger", icon: Table },
    { id: "comparison", label: "Product Comparison", icon: Sparkles },
    { id: "canvas", label: "Visual Color Board", icon: ClipboardList },
    { id: "final", label: "Shopping & Procurement (Final Only)", icon: CheckSquare },
  ];

  return (
    <aside className="w-68 bg-natural-sidebar text-natural-text-main border-r border-natural-border flex flex-col h-full shrink-0">
      
      {/* Brand Title Frame */}
      <div className="p-6 border-b border-natural-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-natural-primary flex items-center justify-center font-serif font-bold text-white text-base">
            R
          </div>
          <div>
            <h1 className="font-serif font-bold text-sm text-natural-text-head tracking-tight">Renovation Studio</h1>
            <p className="text-[10px] text-natural-text-muted font-medium">Refurbishment Workspace</p>
          </div>
        </div>
      </div>

      {/* Project Switcher Selector */}
      <div className="px-4 py-4 border-b border-natural-border gap-2 flex flex-col shrink-0">
        <label className="text-[10px] font-bold text-natural-primary uppercase tracking-widest px-2">Active Renovation</label>
        
        <div className="relative">
          <select
            value={activeProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            className="w-full pl-2.5 pr-8 py-2 bg-natural-bg border border-natural-border text-natural-text-head text-xs font-semibold rounded-lg focus:outline-none focus:border-natural-primary cursor-pointer appearance-none"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id} className="text-[#3E3D39]">{p.name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-natural-primary">
            <ChevronDown size={14} />
          </div>
        </div>

        {/* Short property description card */}
        {activeProject && (
          <div className="p-2.5 bg-natural-bg rounded-lg text-[11px] text-natural-text-muted border border-natural-border mt-1">
            <div className="flex items-center gap-1 font-serif font-semibold text-natural-text-head mb-0.5 truncate">
              <Building size={11} className="text-natural-primary" />
              <span className="truncate">{activeProject.propertyName}</span>
            </div>
            <div className="flex items-center gap-1 text-natural-text-muted">
              <Coins size={11} />
              <span>Budget: £{activeProject.budget.toLocaleString()}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowAddProjectModal(true)}
          className="flex items-center justify-center gap-1.5 w-full mt-2 py-1.5 border border-dashed border-natural-border hover:border-natural-primary hover:text-natural-primary rounded-lg text-xs font-medium transition-colors cursor-pointer text-natural-text-muted"
        >
          <Plus size={13} />
          Create Project
        </button>
      </div>

      {/* Nav Menu Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 custom-scrollbar">
        <span className="text-[10px] font-bold text-natural-primary uppercase tracking-widest px-3 mb-2 block">Navigation</span>
        {navMenuItems.map(item => {
          const IconComponent = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-natural-primary text-white font-bold shadow-sm shadow-natural-primary/20'
                  : 'text-natural-text-muted hover:bg-natural-bg hover:text-natural-text-head'
              }`}
            >
              <IconComponent size={15} className={isActive ? 'text-white' : 'text-natural-text-muted'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer copyright label */}
      <div className="p-4 border-t border-natural-border text-center shrink-0">
        <p className="text-[10px] text-natural-text-muted font-mono">Renovation Planner v1.5.0</p>
      </div>

      {/* MODAL: ADD PROJECT */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-subtle text-zinc-900">
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-md p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
              <h3 className="font-display font-bold text-base text-zinc-900">New Renovation Project</h3>
              <button
                onClick={() => setShowAddProjectModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Victorian Terrace Refurbishment"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Property Name / Address</label>
                <input
                  type="text"
                  placeholder="e.g. 124 Queens Road"
                  value={newProjProp}
                  onChange={(e) => setNewProjProp(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Overall Budget (£) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 25000"
                    value={newProjBudget}
                    onChange={(e) => setNewProjBudget(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newProjStart}
                    onChange={(e) => setNewProjStart(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={newProjEnd}
                  onChange={(e) => setNewProjEnd(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Project Scope / Summary</label>
                <textarea
                  rows={2}
                  placeholder="Briefly state scope and team details..."
                  value={newProjNotes}
                  onChange={(e) => setNewProjNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-650 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Create Project space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </aside>
  );
}

// Inline mini X component for project dialog close
function X({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
