import React, { useState } from "react";
import { Item, Category, Room, CustomStatus } from "../types";
import { Info, ExternalLink, Calendar, Edit3, Trash2 } from "lucide-react";

interface CategoryViewProps {
  categories: Category[];
  rooms: Room[];
  items: Item[];
  onEditItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
  statuses: CustomStatus[];
}

export default function CategoryView({
  categories,
  rooms,
  items,
  onEditItem,
  onDeleteItem,
  statuses
}: CategoryViewProps) {
  const [filterRoomId, setFilterRoomId] = useState("all");

  // Compile full catalog of unique category names across rooms to aggregate them properly
  const uniqueCategoryNames = Array.from(new Set(categories.map(c => c.name)));

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Title Header with Room Location Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-zinc-900 tracking-tight">Category Aggregator</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Aggregate matching materials (e.g. Paint, Floors, Sinks) across different rooms</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-600 font-semibold self-start">
          <span>Isolate Room:</span>
          <select
            value={filterRoomId}
            onChange={(e) => setFilterRoomId(e.target.value)}
            className="py-1.5 px-3 bg-zinc-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-zinc-300 text-xs text-zinc-700 font-bold cursor-pointer"
          >
            <option value="all">Whole Project (all rooms)</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate Lists */}
      {uniqueCategoryNames.length === 0 ? (
        <p className="text-xs text-zinc-400 italic">No design categories defined. Create categories in the <b>Room Spaces</b> view first.</p>
      ) : (
        <div className="space-y-8">
          {uniqueCategoryNames.map((catName) => {
            // Find items that are under category with name `catName`
            const aggregatedItems = items.filter(item => {
              const matchesRoom = filterRoomId === "all" || item.roomId === filterRoomId;
              const cat = categories.find(c => c.id === item.categoryId);
              const matchesCat = cat && cat.name.toLowerCase() === catName.toLowerCase();
              return matchesRoom && matchesCat;
            });

            if (aggregatedItems.length === 0) return null;

            return (
              <div key={catName} className="space-y-3">
                <h3 className="font-display font-semibold text-zinc-800 text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></span>
                  {catName} Overviews
                  <span className="text-[10px] text-zinc-400 font-normal lowercase">({aggregatedItems.length} styles active)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aggregatedItems.map((item) => {
                    const roomName = rooms.find(r => r.id === item.roomId)?.name || "Unknown Room";
                    const statusColor = statuses.find(s => s.name === item.status)?.color || "slate";
                    return (
                      <div key={item.id} className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-3xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-3.5 relative overflow-hiddenGroup">
                        <div className="space-y-3">
                          {/* Image and name row */}
                          <div className="flex gap-3 items-start">
                            <img
                              src={item.thumbnailUrl}
                              alt=""
                              className="w-14 h-14 object-cover rounded-xl border border-zinc-200 shrink-0 shadow-2xs"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80';
                              }}
                            />
                            <div className="space-y-0.5">
                              <h4 className="font-semibold text-xs text-zinc-800 line-clamp-2 leading-snug">{item.name}</h4>
                              <p className="text-[10px] text-zinc-400 font-medium">{roomName}</p>
                            </div>
                          </div>

                          <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed h-8">
                            {item.description || "No specifications defined for this product choice."}
                          </p>

                          <div className="flex justify-between items-center text-xs border-t border-zinc-50 pt-2.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border border-zinc-150 uppercase ${
                              statusColor === 'emerald' ? 'text-emerald-800 bg-emerald-50' : 'text-zinc-600 bg-zinc-50'
                            }`}>
                              {item.status}
                            </span>
                            <span className="font-mono font-bold text-zinc-950">£{item.estimatedTotal.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 text-xs h-8 border-t border-zinc-100 pt-2">
                          <button
                            type="button"
                            onClick={() => onEditItem(item)}
                            className="flex-1 py-1 bg-zinc-50 hover:bg-zinc-150 font-bold text-zinc-700 text-[10px] rounded-lg border border-zinc-200"
                          >
                            Edit Spec
                          </button>
                          {item.productUrl && (
                            <a
                              href={item.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-800 flex items-center justify-center border border-emerald-100"
                              title="Purchase link"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
