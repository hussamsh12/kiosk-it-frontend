'use client';

import { Check, Square, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useIsKioskMode } from '@/hooks';
import { ModifierChips } from './modifier-chips';
import { ModifierSegmented } from './modifier-segmented';
import { ModifierCards } from './modifier-cards';
import type { ModifierGroup, Modifier, ModifierDisplayType } from '@/types';

interface ModifierGroupSelectorProps {
  group: ModifierGroup;
  selectedModifierIds: Set<string>;
  onToggle: (modifier: Modifier) => void;
}

export function ModifierGroupSelector({
  group,
  selectedModifierIds,
  onToggle,
}: ModifierGroupSelectorProps) {
  // Resolve display type: AUTO uses radio/checkbox based on maxSelections
  const resolvedDisplayType = resolveDisplayType(group.displayType, group.maxSelections);

  // Route to specialized component based on display type
  switch (resolvedDisplayType) {
    case 'CHIPS':
      return <ModifierChips group={group} selectedModifierIds={selectedModifierIds} onToggle={onToggle} />;
    case 'SEGMENTED':
      return <ModifierSegmented group={group} selectedModifierIds={selectedModifierIds} onToggle={onToggle} />;
    case 'CARDS':
      return <ModifierCards group={group} selectedModifierIds={selectedModifierIds} onToggle={onToggle} />;
    case 'RADIO':
    case 'CHECKBOX':
    default:
      return <ModifierRadioCheckbox group={group} selectedModifierIds={selectedModifierIds} onToggle={onToggle} />;
  }
}

function resolveDisplayType(displayType: ModifierDisplayType, maxSelections: number): ModifierDisplayType {
  if (displayType === 'AUTO') {
    return maxSelections === 1 ? 'RADIO' : 'CHECKBOX';
  }
  return displayType;
}

// Default Radio/Checkbox implementation
function ModifierRadioCheckbox({
  group,
  selectedModifierIds,
  onToggle,
}: ModifierGroupSelectorProps) {
  const isKiosk = useIsKioskMode();
  const selectedCount = group.modifiers.filter(m => selectedModifierIds.has(m.id)).length;

  const isRequired = group.minSelections > 0;
  const isValid = !isRequired || selectedCount >= group.minSelections;
  const canSelectMore = selectedCount < group.maxSelections;
  const isRadio = group.maxSelections === 1;

  let requirementLabel = '';
  if (isRequired) {
    requirementLabel = group.minSelections === group.maxSelections
      ? `Select ${group.minSelections}`
      : `Select ${group.minSelections}-${group.maxSelections}`;
  } else {
    requirementLabel = group.maxSelections === 1 ? 'Optional' : `Select up to ${group.maxSelections}`;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className={cn('font-semibold', isKiosk ? 'text-lg' : 'text-base')}>
          {group.name}
        </h4>
        <Badge variant={isValid ? 'secondary' : 'destructive'} className="text-xs">
          {requirementLabel}
        </Badge>
      </div>

      <div className="grid gap-2">
        {group.modifiers.map((modifier) => {
          const isSelected = selectedModifierIds.has(modifier.id);
          // For radio behavior, always allow switching between options
          // For checkbox, disable unselected options when max is reached
          const isDisabled = !modifier.isAvailable || (!isRadio && !isSelected && !canSelectMore);

          return (
            <button
              key={modifier.id}
              type="button"
              disabled={isDisabled}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-all touch-target',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:border-primary/50',
                isDisabled && 'opacity-50 cursor-not-allowed',
                isKiosk && 'p-4'
              )}
              onClick={() => !isDisabled && onToggle(modifier)}
            >
              <div className="flex items-center gap-3">
                {isRadio ? (
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                ) : (
                  isSelected ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground/30" />
                  )
                )}
                <span className={cn('font-medium', isKiosk && 'text-lg')}>
                  {modifier.name}
                </span>
                {!modifier.isAvailable && (
                  <span className="text-xs text-muted-foreground">(Unavailable)</span>
                )}
              </div>

              {modifier.price > 0 && (
                <span className={cn('font-medium text-muted-foreground', isKiosk && 'text-lg')}>
                  +{formatCurrency(modifier.price)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
