'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useIsKioskMode } from '@/hooks';
import type { ItemVariant } from '@/types';

interface VariantSegmentedProps {
  variants: ItemVariant[];
  selectedVariantId: string | null;
  onSelect: (variant: ItemVariant) => void;
  basePrice: number;
}

export function VariantSegmented({
  variants,
  selectedVariantId,
  onSelect,
  basePrice,
}: VariantSegmentedProps) {
  const isKiosk = useIsKioskMode();

  if (variants.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className={cn('font-semibold', isKiosk ? 'text-lg' : 'text-base')}>
          Size
        </h4>
        <span className="text-sm text-muted-foreground">Required</span>
      </div>

      <div className="inline-flex rounded-lg border border-input bg-muted p-1">
        {variants.map((variant) => {
          const isSelected = selectedVariantId === variant.id;
          const isDisabled = !variant.isAvailable;

          return (
            <button
              key={variant.id}
              type="button"
              disabled={isDisabled}
              className={cn(
                'px-4 py-2 font-medium transition-all touch-target whitespace-nowrap',
                'first:rounded-l-md last:rounded-r-md',
                isSelected
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
                isDisabled && 'opacity-50 cursor-not-allowed',
                isKiosk && 'px-6 py-3 text-lg'
              )}
              onClick={() => !isDisabled && onSelect(variant)}
            >
              {variant.name}
              {variant.priceAdjustment !== 0 && (
                <span className="ml-1 text-xs opacity-70">
                  {variant.priceAdjustment > 0 ? '+' : ''}{formatCurrency(variant.priceAdjustment)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
