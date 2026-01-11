'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/hooks';
import { useUIStore } from '@/stores/ui-store';
import { getMenu, getItemDetails } from '@/lib/api';
import { CategorySidebar, ItemGrid, ItemDetailModal } from '@/components/menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import type { Category, MenuItem, MenuItemBrief } from '@/types';

export default function MenuPage() {
  const { store, tenant, isInitialized } = useSession();
  const selectedCategoryId = useUIStore((state) => state.selectedCategoryId);
  const setSelectedCategory = useUIStore((state) => state.setSelectedCategory);

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  // Fetch menu
  useEffect(() => {
    if (!isInitialized || !store) return;

    const fetchMenu = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMenu();
        setCategories(data);

        // Auto-select first category
        if (data.length > 0 && !selectedCategoryId) {
          setSelectedCategory(data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch menu:', err);
        setError('Failed to load menu. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, [isInitialized, store, selectedCategoryId, setSelectedCategory]);

  // Get items for selected category
  const currentItems = useMemo(() => {
    if (!selectedCategoryId) return [];
    const category = categories.find((c) => c.id === selectedCategoryId);
    return category?.items || [];
  }, [categories, selectedCategoryId]);

  // Get current category
  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  // Handle item selection - fetch full details for modal
  const handleSelectItem = async (briefItem: MenuItemBrief) => {
    try {
      const fullItem = await getItemDetails(briefItem.id);
      setSelectedItem(fullItem);
      setIsItemModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch item details:', err);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsItemModalOpen(false);
    setTimeout(() => setSelectedItem(null), 200);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar skeleton */}
        <aside className="w-48 lg:w-56 bg-background border-r p-4 space-y-4">
          <Skeleton className="h-6 w-20" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <Skeleton className="w-20 h-20 rounded-xl" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </aside>

        {/* Main content skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="h-20 border-b bg-background px-6 flex items-center">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex-1 p-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border bg-card overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Menu Available</h2>
            <p className="text-muted-foreground">
              The menu for this store is not available yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Sidebar - Categories */}
      <CategorySidebar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategory}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Row */}
        <header className="h-20 border-b bg-background px-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold">
              {currentCategory?.name || 'Menu'}
            </h1>
            {currentCategory?.description && (
              <p className="text-sm text-muted-foreground">
                {currentCategory.description}
              </p>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentItems.length} {currentItems.length === 1 ? 'item' : 'items'}
          </div>
        </header>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
          {currentItems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                No items in this category yet.
              </p>
            </div>
          ) : (
            <ItemGrid items={currentItems} onSelectItem={handleSelectItem} />
          )}
        </div>
      </div>

      {/* Item detail modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={isItemModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
