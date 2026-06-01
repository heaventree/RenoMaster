import React, { useState } from "react";
import { Item, Room, Category, CustomStatus } from "../types";
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
  ExternalLink,
  CheckSquare,
  FileSpreadsheet,
  FileDown,
  Printer
} from "lucide-react";

interface FinalItemsViewProps {
  items: Item[];
  rooms: Room[];
  categories: Category[];
  statuses: CustomStatus[];
  currencySymbol: string;
}

export default function FinalItemsView({
  items,
  rooms,
  categories,
  statuses,
  currencySymbol
}: FinalItemsViewProps) {
  // Only include items where status equals "Final"
  const finalItems = items.filter(item => item.status === "Final");

  // Sum calculations
  const totalQuantity = finalItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCost = finalItems.reduce((acc, item) => acc + item.estimatedTotal, 0);
  const totalTax = finalItems.reduce((acc, item) => {
    const qtyWithWaste = item.quantity * (1 + item.wastePercentage / 100);
    return acc + (item.unitPrice * qtyWithWaste * (item.tax / 100));
  }, 0);

  const [exportSuccessMessage, setExportSuccessMessage] = useState("");

  const triggerMockExport = (format: 'CSV' | 'Excel') => {
    // CSV compiling simulation
    let headers = `Item Name,Room Location,Category,Supplier,Quantity,Unit Cost (${currencySymbol}),Total Cost (${currencySymbol}),URL\n`;
    const body = finalItems.map(item => {
      const room = rooms.find(r => r.id === item.roomId)?.name || "General";
      const cat = categories.find(c => c.id === item.categoryId)?.name || "General";
      return `"${item.name}","${room}","${cat}","${item.supplier || "Direct"}",${item.quantity},${item.unitPrice},${item.estimatedTotal},"${item.productUrl || ""}"`;
    }).join("\n");

    const fullExportData = headers + body;
    
    // Simulate dynamic file creation & download trigger
    try {
      const blob = new Blob([fullExportData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = url;
      tempLink.setAttribute('download', `Final_Renovation_Materials_${format.toLowerCase()}.csv`);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);

      setExportSuccessMessage(`Your procurement ledger successfully exported of ${finalItems.length} items to ${format} sheet file.`);
      setTimeout(() => setExportSuccessMessage(""), 5000);
    } catch (e) {
      alert(`Mock Export: Formulated ${finalItems.length} records in ${format}! Export function triggers download callbacks safely in standalone browser tab.`);
    }
  };  return (
    <div className="space-y-6 animate-fadeIn printable-area">
      
      {/* Title Header with Export Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-natural-border pb-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-natural-text-head tracking-tight flex items-center gap-2">
            <CheckSquare className="text-natural-primary" />
            Final Procurement & Shopping List
          </h2>
          <p className="text-natural-text-muted text-xs mt-0.5">Comprehensive contractor-ready guidelines listing approved items.</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold self-start no-print">
          <button
            onClick={() => triggerMockExport('CSV')}
            className="px-3.5 py-2 font-bold text-natural-text-head bg-white border border-natural-border hover:bg-natural-sidebar rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Download CSV Materials Checklist"
          >
            <FileSpreadsheet size={13} className="text-natural-primary" />
            Export CSV
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 font-extrabold text-white bg-natural-primary hover:bg-natural-primary-hover rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-natural-primary/20"
            title="Print Checkout Ledger page"
          >
            <Printer size={13} />
            Print List
          </button>
        </div>
      </div>

      {exportSuccessMessage && (
        <div className="p-3 bg-[#DDE2C6]/50 border border-natural-border/40 rounded-xl text-xs text-natural-primary font-bold no-print">
          {exportSuccessMessage}
        </div>
      )}

      {/* Main calculation sheet block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cost stats */}
        <div className="p-5 bg-natural-primary text-white rounded-2xl relative overflow-hidden flex flex-col justify-between h-32 shadow-md">
          <span className="text-[9px] uppercase font-bold tracking-widest text-natural-accent/85">Approved Purchase Commitments</span>
          <div className="space-y-0.5">
            <span className="text-3xl font-serif font-bold text-white">{currencySymbol}{totalCost.toFixed(2)}</span>
            <span className="text-[11px] text-natural-accent/70 block font-medium">Includes shipping feeds & bulk trade price margins</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-natural-border rounded-2xl flex flex-col justify-between h-32 shadow-sm">
          <span className="text-[9px] uppercase font-bold tracking-widest text-natural-text-muted">Aggregate Logistics</span>
          <div className="space-y-0.5">
            <span className="text-2xl font-serif font-bold text-natural-text-head">{totalQuantity} Units registered</span>
            <span className="text-[11px] text-natural-text-muted block font-medium">Split across {rooms.length} renovation zones</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-natural-border rounded-2xl flex flex-col justify-between h-32 shadow-sm">
          <span className="text-[9px] uppercase font-bold tracking-widest text-natural-text-muted">VAT Sales Margins</span>
          <div className="space-y-0.5">
            <span className="text-2xl font-serif font-bold text-natural-text-head">{currencySymbol}{totalTax.toFixed(2)}</span>
            <span className="text-[11px] text-natural-text-muted block font-medium">Estimated tax allocations standard in budget</span>
          </div>
        </div>

      </div>

      {/* Ledger lists compilation table */}
      {finalItems.length === 0 ? (
        <div className="p-12 text-center bg-natural-bg border border-dashed border-natural-border rounded-2xl text-xs text-natural-text-muted space-y-2">
          <CheckSquare className="mx-auto text-natural-primary" size={32} />
          <p className="font-bold">No approved products inside shopping checklist yet</p>
          <p className="text-[11px] max-w-sm mx-auto">Items with status equal to "Final" are catalogued in this list automatically. Adjust your renovation category items is simple.</p>
        </div>
      ) : (
        <div className="bg-white border border-natural-border rounded-2xl overflow-hidden shadow-sm">
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-natural-sidebar border-b border-natural-border text-[10px] uppercase font-bold text-natural-primary tracking-wider">
                  <th className="py-3 px-4">Thumbnail</th>
                  <th className="py-3 px-4">Item details</th>
                  <th className="py-3 px-4">Renovation Room</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Purchase URL</th>
                  <th className="py-3 px-4">Unit Pricing</th>
                  <th className="py-3 px-4 text-right">Aggregate Total ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-border/40 bg-white">
                {finalItems.map((item) => {
                  const room = rooms.find(r => r.id === item.roomId)?.name || "General Location";
                  
                  return (
                    <tr key={item.id} className="hover:bg-natural-bg/40 transition-colors">
                      {/* Image */}
                      <td className="py-3 px-4">
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          className="w-10 h-10 object-cover rounded-md border border-natural-border shadow-xs shrink-0 bg-natural-bg"
                          referrerPolicy="referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80';
                          }}
                        />
                      </td>

                      {/* Name Details */}
                      <td className="py-3 px-4 shrink-0">
                        <span className="font-serif font-bold text-natural-text-head block text-xs">{item.name}</span>
                        {item.description && (
                          <span className="text-[10px] text-natural-text-muted font-semibold truncate block max-w-xs">{item.description}</span>
                        )}
                      </td>

                      {/* Room */}
                      <td className="py-3 px-4 text-natural-text-muted text-[11px] font-semibold">
                        {room}
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-4 font-semibold text-natural-text-head">
                        {item.supplier || "—"}
                      </td>

                      {/* URL Link */}
                      <td className="py-3 px-4">
                        {item.productUrl ? (
                          <a
                            href={item.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-natural-primary hover:text-natural-primary-hover font-bold inline-flex items-center gap-1 hover:underline text-[11px]"
                          >
                            <span>Go to Supplier</span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-natural-text-muted italic">Manual Entry</span>
                        )}
                      </td>

                      {/* Quantity pricing multipliers */}
                      <td className="py-3 px-4 text-[10px] text-natural-text-muted font-medium">
                        <b>{currencySymbol}{item.unitPrice.toFixed(2)}</b> per {item.unitType === 'unit' ? 'unit' : item.unitType} <br />
                        Qty: <b>{item.quantity}</b> {item.wastePercentage > 0 ? ` (+${item.wastePercentage}% waste)` : ""}
                      </td>

                      {/* Net Price output */}
                      <td className="py-3 px-4 text-right font-serif font-bold text-natural-primary text-sm">
                        {currencySymbol}{item.estimatedTotal.toFixed(2)}
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
