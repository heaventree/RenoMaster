import React, { useState, useEffect } from "react";
import { Item, Category, Room, Attachment, DecisionLog } from "../types";
import { X, Sparkles, Link as LinkIcon, DollarSign, Plus, Trash2, Calendar, FileText, ArrowRight, Eye } from "lucide-react";

interface ItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
  itemToEdit?: Item | null;
  categories: Category[];
  rooms: Room[];
  currentRoomId?: string;
  statuses: { name: string; color: string; isFinal: boolean }[];
  currencySymbol: string;
}

export default function ItemDialog({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  categories,
  rooms,
  currentRoomId,
  statuses,
  currencySymbol
}: ItemDialogProps) {
  // Fields state
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [supplier, setSupplier] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [status, setStatus] = useState("Maybe");
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>("Medium");
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");

  // Pricing fields standard
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [unitType, setUnitType] = useState("unit");
  const [quantity, setQuantity] = useState<number>(1);
  const [wastePercentage, setWastePercentage] = useState<number>(0);
  const [deliveryCost, setDeliveryCost] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(20); // default 20% VAT
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [history, setHistory] = useState<DecisionLog[]>([]);

  // UI state
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [activeTab, setActiveTab] = useState<'details' | 'pricing' | 'history' | 'attachments'>('details');

  // Load editing values or reset
  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || "");
      setRoomId(itemToEdit.roomId || "");
      setCategoryId(itemToEdit.categoryId || "");
      setDescription(itemToEdit.description || "");
      setProductUrl(itemToEdit.productUrl || "");
      setSupplier(itemToEdit.supplier || "");
      setThumbnailUrl(itemToEdit.thumbnailUrl || "");
      setStatus(itemToEdit.status || "Maybe");
      setPriority(itemToEdit.priority || "Medium");
      setTagsInput(itemToEdit.tags?.join(", ") || "");
      setNotes(itemToEdit.notes || "");
      setUnitPrice(itemToEdit.unitPrice || 0);
      setUnitType(itemToEdit.unitType || "unit");
      setQuantity(itemToEdit.quantity || 1);
      setWastePercentage(itemToEdit.wastePercentage || 0);
      setDeliveryCost(itemToEdit.deliveryCost || 0);
      setDiscount(itemToEdit.discount || 0);
      setTax(itemToEdit.tax || 0);
      setAttachments(itemToEdit.attachments || []);
      setHistory(itemToEdit.history || []);
    } else {
      setName("");
      setRoomId(currentRoomId || (rooms.length > 0 ? rooms[0].id : ""));
      setCategoryId(categories.length > 0 ? categories[0].id : "");
      setDescription("");
      setProductUrl("");
      setSupplier("");
      setThumbnailUrl("");
      setStatus("Maybe");
      setPriority("Medium");
      setTagsInput("");
      setNotes("");
      setUnitPrice(0);
      setUnitType("unit");
      setQuantity(1);
      setWastePercentage(0);
      setDeliveryCost(0);
      setDiscount(0);
      setTax(20);
      setAttachments([]);
      setHistory([]);
    }
    setActiveTab('details');
    setPreviewError("");
  }, [itemToEdit, isOpen, currentRoomId, rooms, categories]);

  // Adjust category when room changes if current selected category doesn't belong
  useEffect(() => {
    if (roomId && !itemToEdit) {
      const availableCats = categories.filter(c => c.roomId === roomId);
      if (availableCats.length > 0) {
        setCategoryId(availableCats[0].id);
      } else {
        setCategoryId("");
      }
    }
  }, [roomId, categories, itemToEdit]);

  if (!isOpen) return null;

  // Pricing calculations
  const calculateTotals = () => {
    const qtyWithWaste = quantity * (1 + wastePercentage / 100);
    const subtotal = unitPrice * qtyWithWaste;
    const taxAmount = subtotal * (tax / 100);
    const estimatedTotal = subtotal + deliveryCost + taxAmount - discount;
    return {
      estimatedTotal: isNaN(estimatedTotal) ? 0 : Math.max(0, parseFloat(estimatedTotal.toFixed(2))),
      qtyWithWaste: isNaN(qtyWithWaste) ? 0 : parseFloat(qtyWithWaste.toFixed(2))
    };
  };

  const { estimatedTotal, qtyWithWaste } = calculateTotals();

  // Call the server API for Link Preview
  const handleFetchMetadata = async () => {
    if (!productUrl) {
      setPreviewError("Please enter a product URL first.");
      return;
    }
    setIsLoadingMetadata(true);
    setPreviewError("");
    try {
      const response = await fetch("/api/link-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productUrl })
      });
      if (!response.ok) {
        throw new Error("HTTP error: " + response.status);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Autofill fields
      if (data.name) setName(data.name);
      if (data.supplier) setSupplier(data.supplier);
      if (data.price) setUnitPrice(data.price);
      if (data.thumbnailUrl) setThumbnailUrl(data.thumbnailUrl);
      if (data.description) setDescription(data.description);
      
      // Select appropriate category based on name keywords if empty
      if (!categoryId && categories.length > 0) {
        const titleL = data.name.toLowerCase();
        let matchedCat = categories.find(c => titleL.includes(c.name.toLowerCase()));
        if (matchedCat) {
          setCategoryId(matchedCat.id);
        } else {
          setCategoryId(categories[0].id);
        }
      }

    } catch (err) {
      setPreviewError("Could not fetch product details automatically. You can still input data manually.");
      console.error(err);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Convert files to base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment: Attachment = {
          id: "att_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
          name: file.name,
          type: file.type,
          size: (file.size / 1024).toFixed(1) + " KB",
          data: reader.result as string,
          date: new Date().toISOString().split('T')[0]
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please provide an item name.");
      return;
    }
    if (!roomId) {
      alert("Please specify a room.");
      return;
    }

    const tagsArray = tagsInput
      ? tagsInput.split(",").map(t => t.trim()).filter(Boolean)
      : [];

    // Form history log if status changed
    let updatedHistory = [...history];
    if (itemToEdit && itemToEdit.status !== status) {
      const historyLog: DecisionLog = {
        id: "hist_" + Date.now(),
        date: new Date().toISOString().split('T')[0],
        oldStatus: itemToEdit.status,
        newStatus: status,
        notes: `Status changed to '${status}' during manual update.`
      };
      updatedHistory.unshift(historyLog);
    } else if (!itemToEdit) {
      // New item creation log
      const historyLog: DecisionLog = {
        id: "hist_" + Date.now(),
        date: new Date().toISOString().split('T')[0],
        oldStatus: "(New Item)",
        newStatus: status,
        notes: "Item catalogued in database."
      };
      updatedHistory.unshift(historyLog);
    }

    const savedItem: Item = {
      id: itemToEdit?.id || "item_" + Date.now(),
      projectId: itemToEdit?.projectId || (rooms.find(r => r.id === roomId)?.projectId || "proj_1"),
      roomId,
      categoryId,
      name: name.trim(),
      description: description.trim(),
      productUrl: productUrl.trim(),
      supplier: supplier.trim(),
      thumbnailUrl: thumbnailUrl.trim() || "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=80",
      images: itemToEdit?.images || [],
      status,
      tags: tagsArray,
      priority,
      unitPrice: Number(unitPrice) || 0,
      unitType,
      quantity: Number(quantity) || 1,
      wastePercentage: Number(wastePercentage) || 0,
      deliveryCost: Number(deliveryCost) || 0,
      discount: Number(discount) || 0,
      tax: Number(tax) || 0,
      estimatedTotal,
      actualTotal: status === "Final" ? estimatedTotal : 0, // actual final price sets once approved/final
      notes: notes.trim(),
      attachments,
      history: updatedHistory,
      createdAt: itemToEdit?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    onSave(savedItem);
    onClose();
  };

  const filteredCategories = categories.filter(c => c.roomId === roomId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1E16]/60 backdrop-blur-subtle">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl border border-natural-border overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-natural-border bg-[#F4F1EA]">
          <div>
            <h3 className="font-serif text-lg font-bold text-natural-text-head">
              {itemToEdit ? "Edit Product Space" : "Catalogue New Product / Material"}
            </h3>
            <p className="text-xs text-natural-text-muted mt-0.5 font-medium">Collect specifications, pricing margins, and visual previews</p>
          </div>
          <button 
            id="btn_dialog_close"
            onClick={onClose} 
            className="p-1.5 text-natural-text-muted hover:text-natural-text-head rounded-lg hover:bg-natural-bg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-6 border-b border-natural-border/50 bg-[#F4F1EA]/50">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-natural-primary text-natural-primary font-bold'
                : 'border-transparent text-natural-text-muted hover:text-natural-text-head'
            }`}
          >
            Product Details
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === 'pricing'
                ? 'border-natural-primary text-natural-primary font-bold'
                : 'border-transparent text-natural-text-muted hover:text-natural-text-head'
            }`}
          >
            Pricing & Calculations
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 -mb-px transition-colors gap-1.5 flex items-center cursor-pointer ${
              activeTab === 'attachments'
                ? 'border-natural-primary text-natural-primary font-bold'
                : 'border-transparent text-natural-text-muted hover:text-natural-text-head'
            }`}
          >
            Files & Attachments
            {attachments.length > 0 && (
              <span className="px-1.5 py-0.2 bg-[#DDE2C6] text-natural-primary rounded-full text-[10px] font-bold">
                {attachments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-natural-primary text-natural-primary font-bold'
                : 'border-transparent text-natural-text-muted hover:text-natural-text-head'
            }`}
          >
            Decision Log
          </button>
        </div>

        {/* Content body Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              
              {/* URL Scanner Banner */}
              <div className="p-4 bg-[#DDE2C6]/20 border border-natural-border/50 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-natural-primary">
                  Import from Retailer Link
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-3 flex items-center text-natural-text-muted">
                      <LinkIcon size={14} />
                    </span>
                    <input
                      type="url"
                      placeholder="Paste B&Q, IKEA, Wayfair or paint web address..."
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary bg-white text-natural-text-head"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchMetadata}
                    disabled={isLoadingMetadata || !productUrl}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-natural-primary hover:bg-natural-primary-hover rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer animate-all"
                  >
                    {isLoadingMetadata ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        Auto-Fetch
                      </>
                    )}
                  </button>
                </div>
                {previewError && (
                  <p className="text-[11px] text-red-700 bg-red-50 p-1 px-2 rounded font-medium">{previewError}</p>
                )}
                {!previewError && !isLoadingMetadata && (
                  <p className="text-[10px] text-natural-text-muted italic">Pasting a product web link fills product image source, title, store and unit cost via server-backed parse indexing.</p>
                )}
              </div>

              {/* Standard Attributes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Item / Material Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Farrow & Ball Green No. 12"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Supplier / Shop Name</label>
                  <input
                    type="text"
                    placeholder="e.g. IKEA / Topps Tiles"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Assign Room *</label>
                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg bg-white focus:outline-none focus:border-natural-primary cursor-pointer"
                  >
                    <option value="" disabled>Select Room Location</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Specification Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg bg-white focus:outline-none focus:border-natural-primary cursor-pointer"
                  >
                    <option value="">No Category assigned</option>
                    {filteredCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Renovation Decision Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg bg-white focus:outline-none focus:border-natural-primary cursor-pointer"
                  >
                    {statuses.map(st => (
                      <option key={st.name} value={st.name}>
                        {st.name} {st.isFinal ? "⭐ (Dashboard Included)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Procurement Priority</label>
                  <div className="flex gap-2">
                    {['Low', 'Medium', 'High'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p as any)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          priority === p
                            ? 'bg-[#DDE2C6] border-natural-primary text-natural-primary'
                            : 'border-natural-border text-natural-text-muted hover:bg-natural-bg/40'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Graphic Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-natural-border/40 pt-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Visual Thumbnail Image URL</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary"
                  />
                  <p className="text-[10px] text-natural-text-muted mt-1">If left blank, a catalog placeholder will stand in. Supports Unsplash design links.</p>
                </div>
                <div className="flex flex-col items-center justify-center border border-natural-border rounded-lg p-2 bg-[#F4F1EA]/40 h-28 overflow-hidden">
                  {thumbnailUrl ? (
                    <img 
                       src={thumbnailUrl} 
                      alt="Thumbnail preview" 
                      className="max-h-full object-cover rounded-md shadow-sm max-w-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80';
                      }}
                    />
                  ) : (
                    <div className="text-natural-text-muted flex flex-col items-center text-center">
                      <FileText size={20} className="stroke-1" />
                      <span className="text-[10px] mt-1">No Image Yet</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Large Descriptions */}
              <div>
                <label className="block text-xs font-bold text-natural-text-head mb-1">Material Description or Spec Sheet Info</label>
                <textarea
                  rows={2}
                  placeholder="Dimensions, grade ratings, finish specs, codes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-natural-text-head mb-1">Personal Notes & Decision Log</label>
                <textarea
                  rows={2}
                  placeholder="Why are we choosing this? Installation notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary"
                />
              </div>

            </div>
          )}          {/* TAB 2: PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Unit Cost (Net Price)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-natural-text-muted text-xs font-semibold">{currencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 text-xs border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Unit Type Selection</label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg bg-white focus:outline-none focus:border-natural-primary cursor-pointer"
                  >
                    <option value="unit">unit / each</option>
                    <option value="sq_m">square metres (sq.m)</option>
                    <option value="m">linear metres (m)</option>
                    <option value="l">litres (l)</option>
                    <option value="pack">pack</option>
                    <option value="box">box</option>
                    <option value="roll">roll</option>
                    <option value="sheet">sheet</option>
                    <option value="custom">Custom unit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Quantity Requested</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Waste Buffer / Allowance (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={wastePercentage}
                      onChange={(e) => setWastePercentage(parseFloat(e.target.value) || 0)}
                      className="w-full pr-7 pl-3 py-2 text-xs border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-natural-text-muted text-xs font-semibold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Delivery / Transport costs</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-natural-text-muted text-xs font-semibold">{currencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={deliveryCost}
                      onChange={(e) => setDeliveryCost(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 text-xs border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Pre-tax Bulk Discount</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-natural-text-muted text-xs font-semibold">{currencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 text-xs border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1">Tax rate (VAT %)</label>
                  <div className="relative col-span-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tax}
                      onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                      className="w-full pr-7 pl-3 py-2 text-xs border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-natural-text-muted text-xs font-semibold">%</span>
                  </div>
                </div>

              </div>

              {/* Calculator Summary Table */}
              <div className="p-5 bg-[#F4F1EA] border border-natural-border rounded-2xl">
                <h4 className="text-xs font-bold text-natural-primary uppercase tracking-wider mb-3 font-serif">Cost Breakdown Analysis</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-natural-text-muted font-semibold">
                    <span>Base Subtotal ({quantity} {unitType === 'unit' ? 'units' : unitType}):</span>
                    <span className="font-serif">{currencySymbol}{(unitPrice * quantity).toFixed(2)}</span>
                  </div>
                  {wastePercentage > 0 && (
                    <div className="flex justify-between text-natural-text-muted font-semibold">
                      <span>Subtotal with {wastePercentage}% Waste ({qtyWithWaste} {unitType === 'unit' ? 'units' : unitType}):</span>
                      <span className="font-serif">{currencySymbol}{(unitPrice * qtyWithWaste).toFixed(2)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between text-natural-text-muted font-semibold">
                      <span>VAT ({tax}%):</span>
                      <span className="font-serif">{currencySymbol}{((unitPrice * qtyWithWaste) * (tax/100)).toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryCost > 0 && (
                    <div className="flex justify-between text-natural-text-muted font-semibold">
                      <span>Delivery/Shipping Charges:</span>
                      <span className="font-serif">+ {currencySymbol}{deliveryCost.toFixed(2)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-natural-primary font-bold">
                      <span>Trade / Shop Discount Code:</span>
                      <span className="font-serif">- {currencySymbol}{discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm font-bold text-[#3C3D2D] border-t border-natural-border/60 pt-3 mt-1">
                    <span>Estimated Total Costs:</span>
                    <span className="text-natural-primary font-serif font-bold text-base">{currencySymbol}{estimatedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATTACHMENTS */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-natural-text-head">Receipts, Quotes, Contractor Invoices & Samples</label>
              
              {/* Drop area */}
              <div className="relative border-2 border-dashed border-natural-border hover:border-natural-primary rounded-xl p-6 text-center transition-colors bg-[#F4F1EA]/50">
                <input
                  type="file"
                  multiple
                  id="dialog_file_upload"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <Plus className="mx-auto h-8 w-8 text-natural-primary stroke-1" />
                  <p className="text-xs font-bold text-natural-text-head">Click to upload or drag files here</p>
                  <p className="text-[10px] text-natural-text-muted">PDFs, images, receipt files, measurements sheets</p>
                </div>
              </div>

              {/* Uploads ledger */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-natural-text-head block">Catalogued Vault ({attachments.length})</span>
                {attachments.length === 0 ? (
                  <p className="text-xs text-natural-text-muted italic">No associated files catalogued for this product yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between p-2.5 bg-natural-bg border border-natural-border/60 rounded-lg text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText size={16} className="text-natural-primary shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-bold text-natural-text-head truncate" title={att.name}>{att.name}</p>
                            <p className="text-[10px] text-natural-text-muted font-semibold">{att.size} • {att.date}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {att.data && (
                            <a
                              href={att.data}
                              download={att.name}
                              className="p-1 text-natural-text-muted hover:text-natural-text-head hover:bg-natural-border/40 rounded-md transition-colors"
                              title="Download Attachment File"
                            >
                              <ArrowRight size={13} className="rotate-90" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DECISION HISTORY LOG */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-natural-primary uppercase tracking-wider mb-2 font-serif">Decision Log & State Shifts</h4>
              {history.length === 0 ? (
                <p className="text-xs text-natural-text-muted italic">No state changes logged yet for this item. State modifications are tracked dynamically.</p>
              ) : (
                <div className="relative pl-6 border-l-2 border-natural-border space-y-5 py-2">
                  {history.map((log) => (
                    <div key={log.id} className="relative space-y-1">
                      {/* Node dot icon */}
                      <span className="absolute -left-[31px] top-1.5 h-2 w-2 rounded-full border-2 border-natural-primary bg-white"></span>
                      
                      <div className="flex items-center gap-2 text-xs text-natural-text-muted">
                        <span className="font-bold text-natural-text-head">{log.date}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span className="px-1.5 py-0.5 bg-natural-sidebar rounded text-natural-text-muted font-semibold">{log.oldStatus}</span>
                          <ArrowRight size={10} className="text-natural-text-muted" />
                          <span className="px-1.5 py-0.5 bg-[#DDE2C6] text-natural-primary rounded font-bold">{log.newStatus}</span>
                        </div>
                      </div>
                      <p className="text-xs text-natural-text-head italic mt-1 bg-natural-bg p-2 rounded-lg border border-natural-border/30">
                        {log.notes}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Action Panel Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-natural-border bg-[#F4F1EA]">
          <div className="text-xs text-natural-text-muted">
            {estimatedTotal > 0 && (
              <span className="font-semibold text-natural-text-head">
                Total Estimate: <b className="text-natural-primary font-serif font-bold text-sm">{currencySymbol}{estimatedTotal.toFixed(2)}</b>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-natural-text-head bg-white border border-natural-border hover:bg-natural-sidebar rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-natural-primary hover:bg-natural-primary-hover rounded-xl transition-colors shadow-sm cursor-pointer shadow-natural-primary/20"
            >
              Save Product Record
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
