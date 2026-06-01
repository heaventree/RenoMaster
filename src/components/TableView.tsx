import React from "react";
import { Item, Room, Category, CustomStatus } from "../types";
import { Table, Search, Edit3, Trash2, CheckCircle2, Save, ExternalLink } from "lucide-react";

interface TableViewProps {
  items: Item[];
  rooms: Room[];
  categories: Category[];
  statuses: CustomStatus[];
  onUpdateItemDirectly: (item: Item) => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (item: Item) => void;
  currencySymbol: string;
}

export default function TableView({
  items,
  rooms,
  categories,
  statuses,
  onUpdateItemDirectly,
  onDeleteItem,
  onEditItem,
  currencySymbol
}: TableViewProps) {
  
  // Direct inline edits updates handles
  const handlePriceChange = (item: Item, value: string) => {
    const unitPrice = parseFloat(value) || 0;
    const qtyWithWaste = item.quantity * (1 + item.wastePercentage / 100);
    const subtotal = unitPrice * qtyWithWaste;
    const taxAmount = subtotal * (item.tax / 100);
    const estimatedTotal = subtotal + item.deliveryCost + taxAmount - item.discount;

    onUpdateItemDirectly({
      ...item,
      unitPrice,
      estimatedTotal: Math.max(0, parseFloat(estimatedTotal.toFixed(2))),
      actualTotal: item.status === "Final" ? Math.max(0, parseFloat(estimatedTotal.toFixed(2))) : 0,
      updatedAt: new Date().toISOString().split("T")[0]
    });
  };

  const handleQtyChange = (item: Item, value: string) => {
    const quantity = parseFloat(value) || 0;
    const qtyWithWaste = quantity * (1 + item.wastePercentage / 100);
    const subtotal = item.unitPrice * qtyWithWaste;
    const taxAmount = subtotal * (item.tax / 100);
    const estimatedTotal = subtotal + item.deliveryCost + taxAmount - item.discount;

    onUpdateItemDirectly({
      ...item,
      quantity,
      estimatedTotal: Math.max(0, parseFloat(estimatedTotal.toFixed(2))),
      actualTotal: item.status === "Final" ? Math.max(0, parseFloat(estimatedTotal.toFixed(2))) : 0,
      updatedAt: new Date().toISOString().split("T")[0]
    });
  };

  const handleStatusChange = (item: Item, status: string) => {
    onUpdateItemDirectly({
      ...item,
      status,
      actualTotal: status === "Final" ? item.estimatedTotal : 0,
      updatedAt: new Date().toISOString().split("T")[0]
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Table general Header */}
      <div className="border-b border-zinc-200 pb-3">
        <h2 className="font-display text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <Table className="text-teal-600" />
          Spreadsheet Ledger
        </h2>
        <p className="text-zinc-500 text-xs mt-0.5">Quickly edit product estimates, quantities, and decision states in inline fields.</p>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-zinc-400 py-12 text-center bg-zinc-50 border border-zinc-200 rounded-2xl">
          No items cataloged in active renovation database yet.
        </p>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Room Space</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Unit Cost ({currencySymbol})</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Waste %</th>
                  <th className="py-3 px-4">Total Estimate ({currencySymbol})</th>
                  <th className="py-3 px-4 text-center">Reference</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {items.map((item) => {
                  const rName = rooms.find(r => r.id === item.roomId)?.name || "Unassigned";
                  const cName = categories.find(c => c.id === item.categoryId)?.name || "General";
                  
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-4 font-semibold text-zinc-800 truncate max-w-xs" title={item.name}>
                        {item.name}
                      </td>
                      
                      {/* Room */}
                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        {rName}
                      </td>
                      
                      {/* Category */}
                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        {cName}
                      </td>
                      
                      {/* Status select drop */}
                      <td className="py-3 px-4">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item, e.target.value)}
                          className="py-1 px-2 border border-zinc-200 bg-zinc-50 font-semibold rounded text-[11px] focus:outline-none focus:border-zinc-400"
                        >
                          {statuses.map(st => (
                            <option key={st.name} value={st.name}>
                              {st.name} {st.isFinal ? "⭐" : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                      
                      {/* Unit Price */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-400">{currencySymbol}</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handlePriceChange(item, e.target.value)}
                            className="w-16 py-1 px-1.5 border border-zinc-200 text-xs rounded font-mono focus:outline-none focus:border-zinc-450 bg-zinc-50/50"
                          />
                        </div>
                      </td>
                      
                      {/* Qty */}
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(item, e.target.value)}
                          className="w-12 py-1 px-1.5 border border-zinc-200 text-xs rounded font-mono focus:outline-none focus:border-zinc-450 bg-zinc-50/50"
                        />
                      </td>

                      {/* Waste */}
                      <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">
                        {item.wastePercentage}%
                      </td>
                      
                      {/* Total */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        {currencySymbol}{item.estimatedTotal.toFixed(2)}
                      </td>
                      
                      {/* Link */}
                      <td className="py-3 px-4 text-center">
                        {item.productUrl ? (
                          <a
                            href={item.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-emerald-700 hover:text-emerald-900"
                            title="Go to product page"
                          >
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded"
                            title="Complete Specs Card Edit"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove item '${item.name}'?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="p-1 text-red-400 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Delete Item"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
