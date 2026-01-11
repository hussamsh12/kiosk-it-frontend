'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useIsKioskMode } from '@/hooks';
import type { ItemVariant } from '@/types';

interface VariantCardsProps {
  variants: ItemVariant[];
  selectedVariantId: string | null;
  onSelect: (variant: ItemVariant) => void;
  basePrice: number;
}

export function VariantCards({
  variants,
  selectedVariantId,
  onSelect,
  basePrice,
}: VariantCardsProps) {
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

      <div className={cn(
        'grid gap-3',
        isKiosk ? 'grid-cols-3' : 'grid-cols-3'
      )}>
        {variants.map((variant) => {
          const isSelected = selectedVariantId === variant.id;
          const isDisabled = !variant.isAvailable;
          const totalPrice = basePrice + variant.priceAdjustment;

          return (
            <button
              key={variant.id}
              type="button"
              disabled={isDisabled}
              className={cn(
                'relative flex flex-col items-center p-4 rounded-xl border-2 transition-all touch-target',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50',
                isDisabled && 'opacity-50 cursor-not-allowed',
                isKiosk && 'p-5'
              )}
              onClick={() => !isDisabled && onSelect(variant)}
            >
              {/* Size icon/visual */}
              <div className={cn(
                'rounded-full bg-muted flex items-center justify-center mb-2',
                variant.name.toLowerCase().includes('small') ? 'w-8 h-8' :
                variant.name.toLowerCase().includes('large') ? 'w-14 h-14' : 'w-10 h-10',
                isKiosk && (
                  variant.name.toLowerCase().includes('small') ? 'w-10 h-10' :
                  variant.name.toLowerCase().includes('large') ? 'w-16 h-16' : 'w-12 h-12'
                )
              )}>
                <span className="text-xs font-bold text-muted-foreground">
                  {variant.name.charAt(0)}
                </span>
              </div>

              <span className={cn('font-medium', isKiosk && 'text-lg')}>
                {variant.name}
              </span>

              <span className="text-sm text-muted-foreground">
                {formatCurrency(totalPrice)}
              </span>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
