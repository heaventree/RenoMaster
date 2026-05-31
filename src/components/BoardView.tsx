import React, { useState } from "react";
import { Item, Room, Category, CustomStatus } from "../types";
import { 
  Tag, 
  ExternalLink, 
  Layers, 
  FolderLock, 
  HelpCircle,
  Clock,
  Palette
} from "lucide-react";

interface BoardViewProps {
  items: Item[];
  rooms: Room[];
  categories: Category[];
  statuses: CustomStatus[];
  onEditItem: (item: Item) => void;
}

export default function BoardView({
  items,
  rooms,
  categories,
  statuses,
  onEditItem
}: BoardViewProps) {
  const [roomFilter, setRoomFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filteredItems = items.filter(it => {
    const matchesRoom = roomFilter === "all" || it.roomId === roomFilter;
    const matchesPriority = priorityFilter === "all" || it.priority === priorityFilter;
    return matchesRoom && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Visual Board Top Bar controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Palette className="text-pink-500 fill-pink-100" />
            Pinterest Moodboard Board
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">Pinterest-style visual design board representing material selections</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="py-1.5 px-3 bg-zinc-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-zinc-300 text-xs text-zinc-700 font-bold cursor-pointer"
          >
            <option value="all">All Rooms</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="py-1.5 px-3 bg-zinc-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-zinc-300 text-xs text-zinc-700 font-bold cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="High">Urgent (High)</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Grid listing */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-zinc-50 rounded-2xl border border-zinc-200 text-xs text-zinc-400">
          <Palette className="mx-auto text-zinc-300 stroke-1 mb-2 animate-pulse" size={32} />
          <p>No products available that match the active filters.</p>
        </div>
      ) : (
        // Masonry style grid container
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filteredItems.map((item) => {
            const roomName = rooms.find(r => r.id === item.roomId)?.name || "Room";
            const categoryName = categories.find(c => c.id === item.categoryId)?.name || "Spec";
            const statusColor = statuses.find(s => s.name === item.status)?.color || "slate";

            return (
              <div 
                key={item.id} 
                className="break-inside-avoid bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all flex flex-col group cursor-pointer relative"
                onClick={() => onEditItem(item)}
              >
                {/* Product Image Frame */}
                <div className="relative overflow-hidden bg-zinc-100 aspect-16/10">
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover transition-transform group-hover:scale-103 duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80';
                    }}
                  />
                  {/* Status Overlay Float badge */}
                  <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-2xs border border-white uppercase text-white bg-zinc-900/80 backdrop-blur-3xs ${
                    statusColor === 'emerald' ? 'bg-emerald-650/90' :
                    statusColor === 'blue' ? 'bg-blue-650/90' :
                    statusColor === 'amber' ? 'bg-amber-655/90' :
                    'bg-zinc-800/80'
                  }`}>
                    {item.status}
                  </span>

                  {item.priority === 'High' && (
                    <span className="absolute top-3 right-3 text-[8px] bg-red-655 text-white font-extrabold px-1.5 py-0.5 rounded shadow-2xs animate-pulse">
                      Urgent
                    </span>
                  )}
                </div>

                {/* Info Text Compartment */}
                <div className="p-4 space-y-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      <span>{roomName}</span>
                      <span>•</span>
                      <span>{categoryName}</span>
                    </div>
                    <h3 className="font-display font-semibold text-xs text-zinc-900 group-hover:text-emerald-700 transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-zinc-500 line-clamp-3 leading-relaxed italic">
                      "{item.description}"
                    </p>
                  )}

                  {/* Pricing footer row */}
                  <div className="flex items-center justify-between border-t border-zinc-50 pt-2.5">
                    <div className="text-left font-mono">
                      <span className="text-zinc-400 text-[10px] block">Estimates:</span>
                      <span className="font-bold text-zinc-900 text-xs">£{item.estimatedTotal.toFixed(2)}</span>
                    </div>

                    <div className="flex gap-1">
                      {item.productUrl && (
                        <a
                          href={item.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()} // halt edit form popups
                          className="p-1 px-2 border border-zinc-200 hover:border-emerald-600 rounded-lg text-zinc-400 hover:text-emerald-700 transition-colors flex items-center bg-white"
                          title="Store Details Link"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
