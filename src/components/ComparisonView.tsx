import React, { useState } from "react";
import { Item, Category, Room, CustomStatus } from "../types";
import { Sparkles, ArrowRight, CheckCircle2, HelpCircle } from "lucide-react";

interface ComparisonViewProps {
  items: Item[];
  rooms: Room[];
  categories: Category[];
  statuses: CustomStatus[];
  currencySymbol: string;
}

export default function ComparisonView({
  items,
  rooms,
  categories,
  statuses,
  currencySymbol
}: ComparisonViewProps) {
  const [selectedCatName, setSelectedCatName] = useState("");

  // Get list of unique category names across the project to group comparison targets
  const uniqueCategoryNames = Array.from(new Set(categories.map(c => c.name)));

  // Filter items in the selected aggregated category
  const candidateItems = items.filter(it => {
    const cat = categories.find(c => c.id === it.categoryId);
    return cat && cat.name.toLowerCase() === selectedCatName.toLowerCase();
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header controls select target group */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Sparkles className="text-amber-500 fill-amber-100" />
            Product Comparison Matrix
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">Compare product alternatives side-by-side to make the final choice.</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold self-start">
          <span>Compare Category:</span>
          <select
            value={selectedCatName}
            onChange={(e) => setSelectedCatName(e.target.value)}
            className="py-1.5 px-3 bg-zinc-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-zinc-300 text-xs text-zinc-700 font-bold cursor-pointer"
          >
            <option value="">-- Choose Category --</option>
            {uniqueCategoryNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MATRIX DISPATCH */}
      {!selectedCatName ? (
        <div className="p-12 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl text-xs text-zinc-400 space-y-1">
          <Sparkles className="mx-auto text-zinc-300 mb-1" size={28} />
          <p className="font-bold">Choose a category to compare</p>
          <p className="text-[10px]">Select any available category in the dropdown (like Flooring, Paint, or Lighting) to inspect options side-by-side.</p>
        </div>
      ) : candidateItems.length === 0 ? (
        <p className="text-xs text-zinc-400 italic py-6 text-center">No active material options are currently registered inside category '{selectedCatName}'.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
          
          {candidateItems.map((item) => {
            const roomName = rooms.find(r => r.id === item.roomId)?.name || "Room";
            const statusColor = statuses.find(s => s.name === item.status)?.color || "slate";

            return (
              <div key={item.id} className="bg-white border-2 border-zinc-200 hover:border-emerald-500 rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xs group relative transition-colors p-4 space-y-4">
                
                {/* Visual */}
                <div className="space-y-3">
                  <div className="relative aspect-16/10 rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50">
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80';
                      }}
                    />
                    <span className={`absolute bottom-2 left-2 px-1.5 py-0.2 rounded-full text-[8px] font-black tracking-widest uppercase border border-zinc-150 bg-white ${
                      statusColor === 'emerald' ? 'text-emerald-800' : 'text-zinc-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold tracking-wider">{roomName} Specs</span>
                    <h4 className="font-semibold text-xs text-zinc-800 group-hover:text-emerald-700 transition-colors">{item.name}</h4>
                  </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="divide-y divide-zinc-100 text-[11px] bg-zinc-55 p-3 rounded-xl border border-zinc-100/50 space-y-2 pb-0 pt-0">
                  <div className="flex justify-between py-2 text-zinc-500">
                    <span>Supplier Store:</span>
                    <b className="text-zinc-800">{item.supplier || "—"}</b>
                  </div>
                  <div className="flex justify-between py-2 text-zinc-500 font-mono">
                    <span>Base Unit Cost:</span>
                    <b className="text-zinc-800">{currencySymbol}{item.unitPrice.toFixed(2)} / {item.unitType}</b>
                  </div>
                  <div className="flex justify-between py-2 text-zinc-500 font-mono">
                    <span>Quantity Limit:</span>
                    <b className="text-zinc-800">{item.quantity}</b>
                  </div>
                  <div className="flex justify-between py-2 text-zinc-500">
                    <span>Waste buffer:</span>
                    <b className="text-zinc-800">{item.wastePercentage}%</b>
                  </div>
                  <div className="flex justify-between py-2 text-zinc-500 font-mono">
                    <span>Delivery charges:</span>
                    <b className="text-zinc-800">{currencySymbol}{item.deliveryCost.toFixed(2)}</b>
                  </div>
                  <div className="flex justify-between py-2 text-zinc-500 font-mono">
                    <span>Tax rates (VAT %):</span>
                    <b className="text-zinc-800">{item.tax}%</b>
                  </div>
                  <div className="flex justify-between py-2.5 text-zinc-800 font-bold border-t border-zinc-200">
                    <span>Estimated Total:</span>
                    <span className="text-emerald-700 font-mono text-xs">{currencySymbol}{item.estimatedTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Notes box */}
                <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 h-16 overflow-y-auto text-[10px] text-zinc-500 custom-scrollbar italic leading-relaxed">
                  {item.notes ? `"${item.notes}"` : "No special comparison notes."}
                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}
