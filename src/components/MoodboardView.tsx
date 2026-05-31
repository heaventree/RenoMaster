import React, { useState } from "react";
import { Item, Room, Category } from "../types";
import { ClipboardList, Plus, Trash2, Maximize2, Move, Layers, RefreshCw } from "lucide-react";

interface MoodboardViewProps {
  items: Item[];
  rooms: Room[];
}

interface PlacedItem {
  id: string;
  item: Item;
  x: number; // grid relative position %
  y: number;
  size: 'small' | 'medium' | 'large';
  rotation: number; // degrees style
}

export default function MoodboardView({
  items,
  rooms
}: MoodboardViewProps) {
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [filterRoomId, setFilterRoomId] = useState("all");

  const canvasItems = items.filter(it => {
    return filterRoomId === "all" || it.roomId === filterRoomId;
  });

  const handlePlaceOnBoard = (item: Item) => {
    // Prevent duplicating identical item on canvas multiple times if desired
    if (placedItems.some(p => p.item.id === item.id)) return;

    const sizeMap: Record<string, 'small' | 'medium' | 'large'> = {
      'cat_kit_paint': 'small',
      'Paint': 'small',
    };

    const newPlaced: PlacedItem = {
      id: "placed_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      item,
      // Stagger default placement slightly near center
      x: 10 + (placedItems.length * 15) % 60,
      y: 10 + (placedItems.length * 10) % 50,
      size: 'medium',
      rotation: Math.floor(Math.random() * 20) - 10 // subtle random angle for realism
    };

    setPlacedItems(prev => [...prev, newPlaced]);
  };

  const handleMoveItem = (placedId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    setPlacedItems(prev => prev.map(p => {
      if (p.id !== placedId) return p;
      let { x, y } = p;
      if (direction === 'up') y = Math.max(0, y - 5);
      if (direction === 'down') y = Math.min(80, y + 5);
      if (direction === 'left') x = Math.max(0, x - 5);
      if (direction === 'right') x = Math.min(80, x + 5);
      return { ...p, x, y };
    }));
  };

  const handleResizeItem = (placedId: string) => {
    setPlacedItems(prev => prev.map(p => {
      if (p.id !== placedId) return p;
      const nextSizeMap: Record<'small' | 'medium' | 'large', 'small' | 'medium' | 'large'> = {
        'small': 'medium',
        'medium': 'large',
        'large': 'small'
      };
      return { ...p, size: nextSizeMap[p.size] };
    }));
  };

  const handleRotateItem = (placedId: string) => {
    setPlacedItems(prev => prev.map(p => {
      if (p.id !== placedId) return p;
      return { ...p, rotation: (p.rotation + 15) % 360 };
    }));
  };

  const removePlacedItem = (id: string) => {
    setPlacedItems(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Upper header panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="text-emerald-600" />
            Visual Pinboard Workspace
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">Place, rotate, and arrange materials swatches to form cohesive palettes.</p>
        </div>

        <button
          onClick={() => setPlacedItems([])}
          className="text-xs font-semibold text-zinc-500 hover:text-red-600 hover:bg-red-50 p-1.5 px-3 rounded-lg border border-zinc-200 transition-colors cursor-pointer"
        >
          Reset Swatches Grid
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Left drawer panel - Swatch list */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-3xs space-y-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Loaded Materials</h4>
            <select
              value={filterRoomId}
              onChange={(e) => setFilterRoomId(e.target.value)}
              className="w-full py-1.5 px-2 bg-zinc-100 text-xs text-zinc-700 font-semibold rounded-lg focus:outline-none focus:bg-white focus:border-zinc-300"
            >
              <option value="all">Whole Project</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pt-1">
            {canvasItems.length === 0 ? (
              <p className="text-[11px] text-zinc-400 italic">No materials cataloged.</p>
            ) : (
              canvasItems.map((item) => {
                const isPlaced = placedItems.some(p => p.item.id === item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-zinc-55 border border-zinc-100 rounded-xl text-xs gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="w-8 h-8 object-cover rounded-md border border-zinc-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80';
                        }}
                      />
                      <span className="font-semibold text-zinc-700 truncate block" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handlePlaceOnBoard(item)}
                      disabled={isPlaced}
                      className="p-1 text-emerald-700 bg-white hover:bg-emerald-50 border border-zinc-200 disabled:opacity-50 disabled:bg-zinc-100 disabled:text-zinc-400 rounded-lg shrink-0"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right workspace - Interactive Pinboard Canvas */}
        <div className="p-4 bg-zinc-100 border border-zinc-250 rounded-2xl xl:col-span-3 min-h-[500px] h-[580px] relative overflow-hidden clip-path-grid shadow-inner flex flex-col justify-between">
          
          {placedItems.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-zinc-400 pointer-events-none">
              <ClipboardList size={36} className="text-zinc-300 stroke-1 mb-2" />
              <p className="text-xs font-semibold">Architect's Pinboard Empty</p>
              <p className="text-[11px] max-w-xs mt-1">Use the <b>Plus</b> icon on the left to pin swatch cards here, then rotatably layer them to compare wood, paint, and fixture textures.</p>
            </div>
          ) : null}

          {/* Render draggable items on pinboard */}
          <div className="relative flex-1 w-full h-full">
            {placedItems.map((placed) => {
              const cardSizeClasses = 
                placed.size === 'small' ? 'w-28' :
                placed.size === 'large' ? 'w-48' : 'w-36'; // medium standard

              return (
                <div
                  key={placed.id}
                  className={`absolute bg-white rounded-xl shadow-md border border-zinc-200 select-none group transition-all p-2 flex flex-col gap-2 ${cardSizeClasses}`}
                  style={{
                    left: `${placed.x}%`,
                    top: `${placed.y}%`,
                    transform: `rotate(${placed.rotation}deg)`,
                    zIndex: placed.size === 'large' ? 10 : placed.size === 'medium' ? 5 : 1
                  }}
                >
                  {/* Swatch image */}
                  <div className="relative aspect-square bg-zinc-55 rounded-lg overflow-hidden border border-zinc-100">
                    <img
                      src={placed.item.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover pointer-events-none"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80';
                      }}
                    />
                  </div>

                  {/* Name details */}
                  <div className="text-[10px] space-y-1">
                    <p className="font-bold text-zinc-800 line-clamp-1 truncate block">{placed.item.name}</p>
                    <p className="text-zinc-400 truncate text-[9px] font-medium uppercase tracking-wider">Store: {placed.item.supplier || "Bespoke"}</p>
                  </div>

                  {/* Hover Actions Bar inside card controls */}
                  <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 shadow-xs gap-1.5 shrink-0 z-50 bg-white">
                    <button
                      onClick={() => handleMoveItem(placed.id, 'left')}
                      className="p-1 hover:bg-zinc-200 text-zinc-600 rounded text-[10px] font-extrabold"
                      title="Move Left"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => handleMoveItem(placed.id, 'up')}
                      className="p-1 hover:bg-zinc-200 text-zinc-600 rounded text-[10px] font-extrabold"
                      title="Move Up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveItem(placed.id, 'down')}
                      className="p-1 hover:bg-zinc-200 text-zinc-600 rounded text-[10px] font-extrabold"
                      title="Move Down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleMoveItem(placed.id, 'right')}
                      className="p-1 hover:bg-zinc-200 text-zinc-600 rounded text-[10px] font-extrabold"
                      title="Move Right"
                    >
                      →
                    </button>
                    <button
                      onClick={() => handleResizeItem(placed.id)}
                      className="p-1 hover:bg-emerald-50 text-emerald-800 rounded"
                      title="Toggle Card Scaling"
                    >
                      <Maximize2 size={11} />
                    </button>
                    <button
                      onClick={() => handleRotateItem(placed.id)}
                      className="p-1 hover:bg-blue-50 text-blue-800 rounded"
                      title="Rotate Swatch"
                    >
                      <RefreshCw size={11} />
                    </button>
                    <button
                      onClick={() => removePlacedItem(placed.id)}
                      className="p-1 hover:bg-red-50 text-red-650 rounded"
                      title="Remove Swatch"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl text-[10px] text-center font-semibold text-zinc-400">
            Use the popover floating arrow controls (visible on card hover) to arrange and scale swatches dynamically on our 2D grid.
          </div>

        </div>

      </div>

    </div>
  );
}
