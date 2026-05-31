import React from "react";
import { Project, Room, Category, Item } from "../types";
import { 
  PiggyBank, 
  CheckCircle2, 
  CircleDot, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  ShoppingBag,
  ExternalLink,
  Edit3,
  Search,
  FileMinus
} from "lucide-react";

interface DashboardViewProps {
  project: Project;
  rooms: Room[];
  categories: Category[];
  items: Item[];
  onEditItem: (item: Item) => void;
  onNavigateToView: (view: string) => void;
}

export default function DashboardView({
  project,
  rooms,
  categories,
  items,
  onEditItem,
  onNavigateToView
}: DashboardViewProps) {
  // FILTER RULES: Dashboard totals ONLY include status === 'Final' items!
  const finalItems = items.filter(item => item.status === "Final");
  const undecidedItems = items.filter(item => item.status !== "Final" && item.status !== "Rejected" && item.status !== "Archived");

  // Calculations
  const totalBudget = project.budget || 0;
  
  // Total Estimated Project Cost = sum of final item estimates
  const totalFinalEstimatedCost = finalItems.reduce((acc, item) => acc + item.estimatedTotal, 0);
  
  const totalActualCost = finalItems.reduce((acc, item) => acc + (item.actualTotal || item.estimatedTotal), 0);

  const budgetRemaining = totalBudget - totalFinalEstimatedCost;
  const isOverBudget = budgetRemaining < 0;
  const budgetUsedPercentage = totalBudget > 0 ? (totalFinalEstimatedCost / totalBudget) * 100 : 0;

  // Breakdown Calculations (Final Items Only)
  // Costs by Room
  const roomCostMap: Record<string, number> = {};
  rooms.forEach(r => { roomCostMap[r.id] = 0; });
  finalItems.forEach(item => {
    if (roomCostMap[item.roomId] !== undefined) {
      roomCostMap[item.roomId] += item.estimatedTotal;
    } else {
      roomCostMap[item.roomId] = item.estimatedTotal;
    }
  });

  const roomsWithCosts = rooms.map(r => ({
    id: r.id,
    name: r.name,
    cost: roomCostMap[r.id] || 0,
    budget: r.budget || 0
  })).sort((a,b) => b.cost - a.cost);

  // Costs by Category
  const categoryCostMap: Record<string, number> = {};
  finalItems.forEach(item => {
    const cat = categories.find(c => c.id === item.categoryId);
    const catName = cat ? cat.name : "Uncategorized";
    categoryCostMap[catName] = (categoryCostMap[catName] || 0) + item.estimatedTotal;
  });

  const categoriesWithCosts = Object.entries(categoryCostMap).map(([name, cost]) => ({
    name,
    cost
  })).sort((a,b) => b.cost - a.cost);

  // Cost by Supplier
  const supplierCostMap: Record<string, number> = {};
  finalItems.forEach(item => {
    const sName = item.supplier || "Direct / Unknown";
    supplierCostMap[sName] = (supplierCostMap[sName] || 0) + item.estimatedTotal;
  });
  
  const suppliersWithCosts = Object.entries(supplierCostMap).map(([name, cost]) => ({
    name,
    cost
  })).sort((a,b) => b.cost - a.cost);

  // Warnings Scanner (Final Items missing details)
  const missingPriceItems = finalItems.filter(item => !item.unitPrice || item.unitPrice === 0);
  const missingLinkItems = finalItems.filter(item => !item.productUrl);
  const missingQtyItems = finalItems.filter(item => !item.quantity || item.quantity <= 0);
  const missingThumbnailItems = finalItems.filter(item => !item.thumbnailUrl || item.thumbnailUrl.includes("photo-1513694203232-719a280e022f"));

  // Check if any specific room is over budget
  const overBudgetRooms = rooms.map(r => {
    const rCost = roomCostMap[r.id] || 0;
    return {
      name: r.name,
      cost: rCost,
      budget: r.budget || 0,
      isOver: r.budget ? rCost > r.budget : false
    };
  }).filter(r => r.isOver);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Title Header with Hero Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-natural-text-head tracking-tight">Active Project Overview</h2>
          <p className="text-natural-text-muted text-xs mt-0.5">Renovation metrics based exclusively on <b>Final</b> items selection</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigateToView("rooms")}
            className="px-4 py-2 text-xs font-semibold text-natural-text-head bg-white border border-natural-border hover:bg-natural-sidebar rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Manage Rooms
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-semibold text-white bg-natural-primary hover:bg-natural-primary-hover rounded-xl transition-all cursor-pointer shadow-sm shadow-natural-primary/20"
          >
            Export / Print Ledger
          </button>
        </div>
      </div>

      {/* Warnings & Alerts Ribbon */}
      {(isOverBudget || overBudgetRooms.length > 0 || missingPriceItems.length > 0 || missingQtyItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
          {/* Budget Limit warning */}
          {isOverBudget && (
            <div className="flex gap-3 p-4 bg-red-50/75 border border-red-200 rounded-xl text-xs text-red-800">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
              <div>
                <span className="font-serif font-bold block text-sm text-red-950">Project Budget Exceeded</span>
                <p className="mt-0.5 text-[11px] leading-relaxed text-red-700">
                  The aggregate final selected materials currently stand at <b>£{totalFinalEstimatedCost.toLocaleString()}</b>, which exceeds your set budget parameter of £{totalBudget.toLocaleString()} by <b>£{Math.abs(budgetRemaining).toLocaleString()}</b>. Consider refining item decision statuses or quantities.
                </p>
              </div>
            </div>
          )}

          {/* Rooms over budget alert */}
          {overBudgetRooms.length > 0 && (
            <div className="flex gap-3 p-4 bg-amber-50/75 border border-amber-200 rounded-xl text-xs text-amber-900">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <span className="font-serif font-bold block text-sm text-amber-950">Room-specific Budgets Overrun</span>
                <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
                  The following rooms are exceeding their independent budgets:
                  {overBudgetRooms.map((r, i) => (
                    <span key={i} className="block mt-0.5 font-medium">
                      • <b>{r.name}</b>: £{r.cost.toLocaleString()} used of £{r.budget.toLocaleString()} budget (Over by £{(r.cost - r.budget).toLocaleString()})
                    </span>
                  ))}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Primary KPI Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI: Financial status */}
        <div className="p-5 bg-white border border-natural-border rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-natural-text-muted block mb-3">Overall Pricing Ledger</span>
          <div className="space-y-1.5">
            <span className="text-2xl font-serif font-bold text-natural-text-head">£{totalFinalEstimatedCost.toLocaleString()}</span>
            <div className="flex justify-between text-xs text-natural-text-muted font-semibold">
              <span>Actual: £{totalActualCost.toLocaleString()}</span>
              <span className="text-natural-primary font-bold">{finalItems.length} items</span>
            </div>
          </div>
          <div className="absolute top-4 right-4 p-2.5 bg-[#DDE2C6] text-natural-primary rounded-xl">
            <TrendingUp size={18} />
          </div>
        </div>

        {/* KPI: Budget Remaining */}
        <div className="p-5 bg-white border border-natural-border rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-natural-text-muted block mb-3">Allocated Remaining Budget</span>
          <div className="space-y-1.5">
            <span className={`text-2xl font-serif font-bold ${isOverBudget ? 'text-red-700' : 'text-natural-text-head'}`}>
              {isOverBudget ? "-" : ""}£{Math.abs(budgetRemaining).toLocaleString()}
            </span>
            <div className="w-full bg-[#EAE3D8] rounded-full h-1.5 overflow-hidden mt-1">
              <div 
                className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-natural-primary'}`}
                style={{ width: `${Math.min(100, budgetUsedPercentage)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-natural-text-muted mt-2 font-semibold">
              <span>Budget: £{totalBudget.toLocaleString()}</span>
              <span className="text-natural-primary">{budgetUsedPercentage.toFixed(0)}% Utilized</span>
            </div>
          </div>
          <div className={`absolute top-4 right-4 p-2.5 rounded-xl ${isOverBudget ? 'bg-red-50 text-red-650' : 'bg-natural-sidebar text-natural-primary'}`}>
            <PiggyBank size={18} />
          </div>
        </div>

        {/* KPI: Decisions tracker */}
        <div className="p-5 bg-white border border-natural-border rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-natural-text-muted block mb-3">Item Select Statuses</span>
          <div className="space-y-1.5">
            <span className="text-2xl font-serif font-bold text-natural-text-head">{finalItems.length} Finalized</span>
            <div className="flex items-center gap-1.5 text-xs text-natural-text-muted font-semibold">
              <CircleDot size={12} className="text-natural-primary animate-pulse w-3 h-3" />
              <span>{undecidedItems.length} ideas/proposals active</span>
            </div>
          </div>
          <div className="absolute top-4 right-4 p-2.5 bg-[#DDE2C6] text-natural-primary rounded-xl">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* KPI: Audit Scanner alerts count */}
        <div className="p-5 bg-white border border-natural-border rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-natural-text-muted block mb-3">Product Spec Audit Tracker</span>
          <div className="space-y-1.5">
            <span className="text-2xl font-serif font-bold text-natural-text-head">
              {missingPriceItems.length + missingLinkItems.length + missingQtyItems.length} Missing
            </span>
            <div className="flex justify-between text-[10px] text-red-700 font-semibold gap-1.5 mt-1.5">
              <span>{missingPriceItems.length} Price</span>
              <span>•</span>
              <span>{missingQtyItems.length} Qty</span>
              <span>•</span>
              <span>{missingLinkItems.length} Links</span>
            </div>
          </div>
          <div className="absolute top-4 right-4 p-2.5 bg-red-50 text-red-600 rounded-xl">
            <Activity size={18} />
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Cost by Room Spaces Breakdown Bar Chart */}
        <div className="p-5 bg-white border border-natural-border rounded-2xl shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h4 className="font-serif font-bold text-base text-natural-text-head col-span-12">Room-by-Room Cost Distributions</h4>
            <p className="text-natural-text-muted text-[11px]">Compare final purchase commitments across active home spaces</p>
          </div>

          <div className="space-y-4 pt-1">
            {roomsWithCosts.length === 0 ? (
              <p className="text-xs text-natural-text-muted italic">No room locations registered.</p>
            ) : (
              roomsWithCosts.map(r => {
                const maxCost = Math.max(...roomsWithCosts.map(el => el.cost), 1);
                const pct = (r.cost / maxCost) * 100;
                return (
                  <div key={r.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-natural-text-head">{r.name}</span>
                      <div className="font-serif flex items-center gap-2">
                        <span className="text-natural-text-head font-bold">£{r.cost.toLocaleString()}</span>
                        {r.budget > 0 && (
                          <span className="text-[10px] text-natural-text-muted font-normal">/ budget £{r.budget.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-natural-bg rounded-lg h-3 overflow-hidden border border-natural-border/40 flex">
                      <div 
                        className={`h-full rounded-sm transition-all duration-500 ${
                          r.budget && r.cost > r.budget ? 'bg-red-500' : 'bg-natural-primary'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cost by Category Pie-Bar List */}
        <div className="p-5 bg-white border border-natural-border rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-serif font-bold text-base text-natural-text-head">Categorical Allocations</h4>
            <p className="text-natural-text-muted text-[11px]">Summary of expenditure grouped by material categories</p>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-60 mt-1 custom-scrollbar">
            {categoriesWithCosts.length === 0 ? (
              <p className="text-xs text-natural-text-muted italic py-6 text-center">No final products catalogued into categories yet.</p>
            ) : (
              categoriesWithCosts.map((cat, idx) => {
                const totalCatsSum = categoriesWithCosts.reduce((acc, c) => acc + c.cost, 0) || 1;
                const ratio = (cat.cost / totalCatsSum) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-natural-text-head">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 bg-natural-primary rounded-full"></span>
                        {cat.name}
                      </span>
                      <span className="font-serif text-natural-text-head text-right font-bold">
                        £{cat.cost.toFixed(2)}
                        <span className="text-[10px] text-natural-text-muted font-normal ml-1">({ratio.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-natural-bg h-1.5 rounded-full overflow-hidden border border-natural-border/20">
                      <div className="h-full bg-natural-primary rounded-full" style={{ width: `${ratio}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Audit Warnings Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Audit Missing parameters warnings box */}
        <div className="p-5 bg-white border border-natural-border rounded-2xl shadow-sm space-y-4">
          <div>
            <h4 className="font-serif font-bold text-base text-natural-text-head">Final Items Missing Details</h4>
            <p className="text-natural-text-muted text-[11px]">Correcting these ensures precise contractor coordination and budget finality</p>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar">
            {missingPriceItems.length === 0 && missingLinkItems.length === 0 && missingQtyItems.length === 0 && missingThumbnailItems.length === 0 ? (
              <div className="text-center py-8 bg-natural-bg rounded-xl border border-dashed border-natural-border text-xs text-natural-text-muted">
                <CheckCircle2 size={24} className="text-natural-primary mx-auto mb-2" />
                <p className="font-bold">Audit Complete!</p>
                <p className="text-[10px] text-natural-text-muted mt-0.5">All final selected products have fully filled links, quantities, and prices.</p>
              </div>
            ) : (
              <>
                {missingPriceItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 bg-red-50/50 border border-red-100 rounded-xl text-xs gap-3">
                    <div className="overflow-hidden">
                      <span className="font-semibold text-red-900 truncate block">{item.name}</span>
                      <span className="text-[10px] text-red-600 font-medium">Missing Price: Currently listed at £0.00</span>
                    </div>
                    <button
                      onClick={() => onEditItem(item)}
                      className="p-1 px-2.5 text-[11px] font-bold text-red-800 bg-red-100 hover:bg-red-200 rounded-md transition-colors cursor-pointer"
                    >
                      Fix Price
                    </button>
                  </div>
                ))}
                {missingQtyItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl text-xs gap-3">
                    <div className="overflow-hidden">
                      <span className="font-semibold text-amber-900 truncate block">{item.name}</span>
                      <span className="text-[10px] text-amber-600 font-medium">Missing Quantity: Set as 0 items required</span>
                    </div>
                    <button
                      onClick={() => onEditItem(item)}
                      className="p-1 px-2.5 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors cursor-pointer"
                    >
                      Set Qty
                    </button>
                  </div>
                ))}
                {missingLinkItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs gap-3">
                    <div className="overflow-hidden">
                      <span className="font-semibold text-blue-900 truncate block">{item.name}</span>
                      <span className="text-[10px] text-blue-600 font-medium">Missing URL: No purchase website linked</span>
                    </div>
                    <button
                      onClick={() => onEditItem(item)}
                      className="p-1 px-2.5 text-[11px] font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors cursor-pointer"
                    >
                      Paste Link
                    </button>
                  </div>
                ))}
                {missingThumbnailItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 bg-natural-bg border border-natural-border rounded-xl text-xs gap-3">
                    <div className="overflow-hidden">
                      <span className="font-semibold text-natural-text-head truncate block">{item.name}</span>
                      <span className="text-[10px] text-natural-text-muted font-medium">Missing Thumbnail: Shows blank category icon</span>
                    </div>
                    <button
                      onClick={() => onEditItem(item)}
                      className="p-1 px-2.5 text-[11px] font-bold text-natural-primary bg-natural-sidebar hover:bg-natural-border rounded-md transition-colors cursor-pointer animate-pulse"
                    >
                      Attach Pic
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Supplier breakdown card */}
        <div className="p-5 bg-white border border-natural-border rounded-2xl shadow-sm space-y-4">
          <div>
            <h4 className="font-serif font-bold text-base text-natural-text-head">Purchase Ledger by Store</h4>
            <p className="text-natural-text-muted text-[11px]">Organize orders, delivery combos, and trade accounts</p>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {suppliersWithCosts.length === 0 ? (
              <p className="text-xs text-natural-text-muted py-6 text-center italic">No suppliers referenced</p>
            ) : (
              suppliersWithCosts.map((sup, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-natural-bg border border-natural-border rounded-xl text-xs">
                  <span className="font-semibold text-natural-text-head">{sup.name}</span>
                  <span className="font-serif font-bold text-natural-primary bg-natural-accent/50 p-1 px-2.5 rounded-lg border border-natural-accent/70">
                    £{sup.cost.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FINAL SELECTED ITEMS shopping lists section */}
      <div className="p-6 bg-white border border-natural-border rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-natural-border pb-4">
          <div>
            <h4 className="font-serif font-bold text-base text-natural-text-head">Shopping List & Procurement Guide</h4>
            <p className="text-natural-text-muted text-xs mt-0.5">Comprehensive contractor checklist containing only marked <b>Final</b> items</p>
          </div>
          <button
            onClick={() => onNavigateToView("final")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-natural-primary font-semibold bg-natural-accent hover:bg-natural-accent/80 rounded-lg border border-natural-border transition-colors cursor-pointer"
          >
            <ShoppingBag size={13} />
            Full shopping sheet
          </button>
        </div>

        {finalItems.length === 0 ? (
          <div className="text-center py-12 bg-natural-bg border border-dashed border-natural-border rounded-xl text-xs text-natural-text-muted space-y-2">
            <ShoppingBag className="mx-auto text-natural-text-light stroke-1" size={32} />
            <p>No products are marked as final.</p>
            <p className="text-[11px] text-natural-text-muted max-w-sm mx-auto">Go to any <b>Room Space</b>, add details, and change status to <b>Final</b> to see them compile in this master shopping sheet with cost totals.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar border border-natural-border rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-natural-sidebar border-b border-natural-border text-[10px] uppercase font-bold text-natural-primary tracking-wider">
                  <th className="py-3 px-4">Thumbnail</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Room Location</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Cost Structure</th>
                  <th className="py-3 px-4 text-right">Totals</th>
                  <th className="py-3 px-4 text-center">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-border bg-white">
                {finalItems.map((item) => {
                  const room = rooms.find(r => r.id === item.roomId);
                  return (
                    <tr key={item.id} className="hover:bg-natural-bg/40 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <img 
                          src={item.thumbnailUrl} 
                          alt="" 
                          className="w-10 h-10 object-cover rounded-md shadow-2xs border border-natural-border" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80';
                          }}
                        />
                      </td>
                      <td className="py-3 px-4 font-serif font-bold text-natural-text-head">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-natural-text-muted font-medium">
                        {room?.name}
                      </td>
                      <td className="py-3 px-4 font-semibold text-natural-text-muted">
                        {item.supplier || "—"}
                      </td>
                      <td className="py-3 px-4 text-natural-text-muted text-[11px] font-semibold">
                        £{item.unitPrice} per {item.unitType === 'unit' ? 'unit' : item.unitType} <br />
                        Qty: <b>{item.quantity}</b> {item.wastePercentage > 0 ? `(+${item.wastePercentage}% waste)` : ''}
                      </td>
                      <td className="py-3 px-4 text-right font-serif font-bold text-natural-primary">
                        £{item.estimatedTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.productUrl ? (
                          <a 
                            href={item.productUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-natural-primary hover:text-natural-primary-hover font-bold"
                          >
                            <span>Link</span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-natural-text-light">Missing link</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
