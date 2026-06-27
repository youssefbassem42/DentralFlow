import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  Truck,
  History,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/context';
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from './api';
import type { InventoryItem } from './types';

// Validation schema
const itemSchema = z.object({
  item: z.string().min(1, 'Item name is required'),
  quantity: z.number().int().nonnegative('Quantity cannot be negative'),
  minimumQuantity: z.number().int().nonnegative('Minimum quantity cannot be negative'),
  supplier: z.string().optional().nullable(),
  price: z.number().positive('Price must be greater than zero'),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export function WarehousePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Tabs: 'all' | 'lowStock' | 'suppliers'
  const [activeTab, setActiveTab] = useState<'all' | 'lowStock' | 'suppliers'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Modals / Editors
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedAuditItem, setSelectedAuditItem] = useState<InventoryItem | null>(null);

  // Role permissions
  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const canModify = isAdmin || isReceptionist;

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema) as any,
  });

  // Query inventory
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory', page, searchQuery, activeTab],
    queryFn: () =>
      getInventory({
        page,
        limit: 10,
        search: searchQuery || undefined,
        lowStock: activeTab === 'lowStock' ? true : undefined,
      }),
  });
  const items = inventoryData?.data?.items || [];
  const totalItems = inventoryData?.data?.pagination?.total || 0;
  const totalPages = inventoryData?.data?.pagination?.totalPages || 1;

  // Fetch all items for counts & suppliers breakdown (limit 200)
  const { data: allItemsData } = useQuery({
    queryKey: ['inventory-all-summary'],
    queryFn: () => getInventory({ limit: 200 }),
  });
  const allItems = allItemsData?.data?.items || [];

  // Aggregated metadata summary stats
  const totalUniqueItems = allItems.length;
  const lowStockCount = allItems.filter((i) => i.quantity <= i.minimumQuantity).length;
  const uniqueSuppliers = Array.from(new Set(allItems.map((i) => i.supplier).filter(Boolean)));

  // Mutations
  const createMutation = useMutation({
    mutationFn: createInventoryItem,
    onSuccess: (res) => {
      toast.success(res.message || 'Item registered successfully.');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-all-summary'] });
      setIsFormOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to register item.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ItemFormValues> }) =>
      updateInventoryItem(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Item updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-all-summary'] });
      setIsFormOpen(false);
      setEditingItem(null);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update item.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: () => {
      toast.success('Item deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-all-summary'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete item.');
    },
  });

  // Action submissions
  const handleFormSubmit = (values: ItemFormValues) => {
    const payload = {
      ...values,
      supplier: values.supplier || null,
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEditOpen = (item: InventoryItem) => {
    setEditingItem(item);
    reset({
      item: item.item,
      quantity: item.quantity,
      minimumQuantity: item.minimumQuantity,
      supplier: item.supplier || '',
      price: Number(item.price),
    });
    setIsFormOpen(true);
  };

  const handleCreateOpen = () => {
    setEditingItem(null);
    reset({
      item: '',
      quantity: 0,
      minimumQuantity: 10,
      supplier: '',
      price: 0,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      deleteMutation.mutate(id);
    }
  };

  // Helper styles for inventory quantity status
  const getQuantityBadge = (qty: number, minQty: number) => {
    if (qty === 0) {
      return 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900';
    }
    if (qty <= minQty) {
      return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900';
    }
    return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
  };

  const getQuantityStatusText = (qty: number, minQty: number) => {
    if (qty === 0) return 'Out of Stock';
    if (qty <= minQty) return 'Low Stock / Reorder';
    return 'In Stock';
  };

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* ------------------ METADATA SUMMARY STATISTICS ------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Unique Items */}
        <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Unique Items</span>
            <h3 className="text-2xl font-extrabold text-foreground mt-1">{totalUniqueItems}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Warehouse catalog items count</p>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <Package size={24} />
          </div>
        </div>

        {/* Low Stock Items Alert Card */}
        <div className={`border rounded-xl p-5 shadow-sm flex items-center justify-between transition-colors ${
          lowStockCount > 0
            ? 'bg-amber-500/10 border-amber-300 dark:border-amber-900'
            : 'bg-surface-container-lowest dark:bg-inverse-surface border-outline-variant'
        }`}>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reorder Alerts</span>
            <h3 className={`text-2xl font-extrabold mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-foreground'}`}>
              {lowStockCount}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1">Items at or below critical threshold</p>
          </div>
          <div className={`p-3 rounded-lg ${lowStockCount > 0 ? 'bg-amber-500/20 text-amber-600' : 'bg-secondary/10 text-secondary-foreground'}`}>
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Suppliers logged */}
        <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Suppliers</span>
            <h3 className="text-2xl font-extrabold text-foreground mt-1">{uniqueSuppliers.length}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Distinct clinical supply vendors</p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-600 rounded-lg">
            <Truck size={24} />
          </div>
        </div>
      </div>

      {/* ------------------ TAB NAVIGATION BAR ------------------ */}
      <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setActiveTab('all');
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface hover:bg-surface-container-low text-foreground border-outline-variant'
            }`}
          >
            All Inventory
          </button>
          <button
            onClick={() => {
              setActiveTab('lowStock');
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
              activeTab === 'lowStock'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-surface hover:bg-surface-container-low text-foreground border-outline-variant'
            }`}
          >
            <TrendingDown size={12} /> Low Stock Alerts
          </button>
          <button
            onClick={() => {
              setActiveTab('suppliers');
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
              activeTab === 'suppliers'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-surface hover:bg-surface-container-low text-foreground border-outline-variant'
            }`}
          >
            <Truck size={12} /> Registered Suppliers
          </button>
        </div>

        {activeTab !== 'suppliers' && (
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search catalog/supplier..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs w-full md:w-48"
              />
            </div>
            {canModify && (
              <button
                onClick={handleCreateOpen}
                className="bg-primary text-primary-foreground py-1.5 px-4 rounded-lg text-xs font-bold hover:brightness-95 transition-all shadow-sm flex items-center gap-2"
              >
                <Plus size={14} /> Register Item
              </button>
            )}
          </div>
        )}
      </div>

      {/* ------------------ VIEW: SUPPLIERS LOG TABS ------------------ */}
      {activeTab === 'suppliers' ? (
        <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground border-b border-outline-variant pb-2 flex items-center gap-1.5">
            <Truck size={16} className="text-purple-600" /> Active Supply Partnerships
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueSuppliers.map((sup) => {
              const suppliedItems = allItems.filter((i) => i.supplier === sup);
              const totalValue = suppliedItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

              return (
                <div key={sup} className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col justify-between hover:border-primary transition-all shadow-sm">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{sup}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Supplies: {suppliedItems.length} registered items
                    </p>
                  </div>
                  <div className="pt-3 border-t border-outline-variant mt-4 flex justify-between items-center text-[10px] font-semibold text-muted-foreground">
                    <span>Stock Asset Value:</span>
                    <span className="text-foreground">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })}
            {uniqueSuppliers.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-6 col-span-3">
                No active suppliers configured.
              </p>
            )}
          </div>
        </div>
      ) : (
        /* ------------------ VIEW: INVENTORY TABLE ------------------ */
        <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          {isLoadingInventory ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-2 text-muted-foreground py-12">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
              <p className="text-sm font-semibold">Loading warehouse log...</p>
            </div>
          ) : (
            <div className="overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="p-3 pl-4">Item Name</th>
                    <th className="p-3">Quantity Status</th>
                    <th className="p-3">Min Threshold</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3">Supplier Partnership</th>
                    <th className="p-3">Last Updated</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-outline-variant text-foreground">
                  {items.map((i) => (
                    <tr key={i.id} className="hover:bg-primary/5 transition-colors">
                      <td className="p-3 pl-4 font-semibold">{i.item}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{i.quantity} units</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getQuantityBadge(i.quantity, i.minimumQuantity)}`}>
                            {getQuantityStatusText(i.quantity, i.minimumQuantity)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-muted-foreground">{i.minimumQuantity} units</td>
                      <td className="p-3 font-semibold text-primary">
                        ${Number(i.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-muted-foreground font-medium">{i.supplier || 'N/A'}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(i.lastUpdated).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-3 text-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => setSelectedAuditItem(i)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Stock Audit details"
                        >
                          <History size={14} />
                        </button>
                        {canModify && (
                          <button
                            onClick={() => handleEditOpen(i)}
                            className="p-1 text-primary hover:brightness-95 transition-colors"
                            title="Edit Item"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(i.id)}
                            className="p-1 text-rose-500 hover:text-rose-600 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground font-semibold">
                        No warehouse items registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
            <span className="text-xs text-muted-foreground">
              Showing {items.length} of {totalItems} items
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 border border-outline-variant rounded bg-surface hover:bg-muted disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 border border-outline-variant rounded bg-surface hover:bg-muted disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ REGISTER / EDIT MODAL DRAWER ------------------ */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 p-1 hover:bg-muted rounded text-muted-foreground"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-bold text-foreground mb-4">
              {editingItem ? 'Update Stock Item' : 'Register Stock Item'}
            </h3>

            <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Item Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Latex Gloves Medium"
                  {...register('item')}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                />
                {errors.item && (
                  <p className="text-[10px] text-error mt-1">{errors.item.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Initial Stock <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    {...register('quantity', { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {errors.quantity && (
                    <p className="text-[10px] text-error mt-1">{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Min Stock Threshold <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    {...register('minimumQuantity', { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {errors.minimumQuantity && (
                    <p className="text-[10px] text-error mt-1">{errors.minimumQuantity.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Unit Price ($) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('price', { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {errors.price && (
                    <p className="text-[10px] text-error mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Supplier Partner
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dental Supply Corp"
                    {...register('supplier')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold bg-surface hover:bg-surface-container-low text-foreground transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-1 shadow-sm"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="animate-spin w-3 h-3" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ VIEW: STOCK AUDIT LOG DETAILS MODAL ------------------ */}
      {selectedAuditItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedAuditItem(null)}
              className="absolute right-4 top-4 p-1 hover:bg-muted rounded text-muted-foreground"
            >
              <X size={16} />
            </button>

            <h3 className="text-sm font-bold text-foreground border-b border-outline-variant pb-2 flex items-center gap-1.5">
              <History size={16} className="text-primary" /> Stock Audit Details
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-foreground">
              <div className="grid grid-cols-3">
                <span className="text-muted-foreground font-semibold">Item Name:</span>
                <span className="col-span-2 font-bold">{selectedAuditItem.item}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-muted-foreground font-semibold">Asset ID:</span>
                <span className="col-span-2 font-mono text-[10px] truncate">{selectedAuditItem.id}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-muted-foreground font-semibold">Available Stock:</span>
                <span className="col-span-2 font-bold">{selectedAuditItem.quantity} units</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-muted-foreground font-semibold">Creator User ID:</span>
                <span className="col-span-2 font-mono text-[10px] truncate">{selectedAuditItem.createdBy}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-muted-foreground font-semibold">Created At:</span>
                <span className="col-span-2 text-muted-foreground">
                  {new Date(selectedAuditItem.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-muted-foreground font-semibold">Last Updated At:</span>
                <span className="col-span-2 text-muted-foreground">
                  {new Date(selectedAuditItem.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant flex justify-end">
              <button
                onClick={() => setSelectedAuditItem(null)}
                className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:brightness-95 shadow-sm"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
