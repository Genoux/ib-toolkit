"use client";

import { Checkbox } from "./checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { SearchInput } from "./search-input";
import { selectTriggerClassName } from "./select";
import { Spinner } from "./spinner";
import { ChevronDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { PersonAvatar } from "./person-identity";

const ELLIPSIS = "…";

export type MultiSelectOption = {
  value: string;
  label: string;
  imageUrl?: string | null;
};

function truncateText(value: string, maxLength: number): string {
  if (maxLength < 1) return ELLIPSIS;
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - ELLIPSIS.length))}${ELLIPSIS}`;
}

export function toggleMultiSelectValue<T extends string>(selected: T[], value: T): T[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

export function getMultiSelectLabel({
  placeholder,
  selectedValues,
  options,
}: {
  placeholder: string;
  selectedValues: string[];
  options: MultiSelectOption[];
}) {
  if (selectedValues.length === 0) return placeholder;
  if (selectedValues.length === 1) {
    return truncateText(
      options.find((option) => option.value === selectedValues[0])?.label ?? placeholder,
      18,
    );
  }
  return `${placeholder} (${selectedValues.length})`;
}

export function MultiSelectOptionList({
  options,
  selectedValues,
  onToggle,
  disabled,
  emptyMessage = "No options",
  isPending,
  keepOpenOnToggle = true,
  idPrefix = "multi-select-option",
  searchable,
  searchPlaceholder = "Search…",
}: {
  options: MultiSelectOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
  emptyMessage?: string;
  isPending?: boolean;
  keepOpenOnToggle?: boolean;
  idPrefix?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");
  const visibleOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!searchable || !q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  if (isPending) {
    return (
      <div className="flex min-h-[140px] w-full items-center justify-center p-4">
        <Spinner className="size-5" />
      </div>
    );
  }

  return (
    <div className="flex max-h-64 flex-col">
      {searchable ? (
        <div className="shrink-0 border-b p-1.5">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={searchPlaceholder}
            className="w-full"
          />
        </div>
      ) : null}
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-1"
        onWheel={(event) => event.stopPropagation()}
      >
        {visibleOptions.map((option) => {
          const checked = selectedValues.includes(option.value);
          const rowId = `${idPrefix}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={rowId}
              onPointerDown={keepOpenOnToggle ? (event) => event.preventDefault() : undefined}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                "hover:bg-muted/80 has-focus-visible:ring-2 has-focus-visible:ring-ring",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              <Checkbox
                id={rowId}
                checked={checked}
                disabled={disabled}
                onCheckedChange={disabled ? undefined : () => onToggle(option.value)}
              />
              {option.imageUrl !== undefined ? (
                <PersonAvatar imageUrl={option.imageUrl} name={option.label} />
              ) : null}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
            </label>
          );
        })}
        {visibleOptions.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            {options.length === 0 ? emptyMessage : "No matches."}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function MultiSelectPopover({
  placeholder,
  selectedValues,
  options,
  onChange,
  triggerClassName = "min-w-36 w-44 max-w-44",
  contentClassName = "w-72 overflow-hidden",
  emptyMessage,
  disabled,
  idPrefix,
}: {
  placeholder: string;
  selectedValues: string[];
  options: MultiSelectOption[];
  onChange: (values: string[]) => void;
  triggerClassName?: string;
  contentClassName?: string;
  emptyMessage?: string;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const isActive = selectedValues.length > 0;
  const triggerLabel = getMultiSelectLabel({ placeholder, selectedValues, options });

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-size="sm"
          className={selectTriggerClassName({
            className: triggerClassName,
            noneSelected: !isActive,
          })}
          disabled={disabled}
        >
          <span data-slot="select-value" className="truncate">
            {triggerLabel}
          </span>
          <ChevronDownIcon className="size-3.5 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("overscroll-y-contain p-0", contentClassName)}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onWheel={(event) => event.stopPropagation()}
      >
        <MultiSelectOptionList
          options={options}
          selectedValues={selectedValues}
          onToggle={(value) => onChange(toggleMultiSelectValue(selectedValues, value))}
          disabled={disabled}
          emptyMessage={emptyMessage}
          idPrefix={idPrefix}
        />
      </PopoverContent>
    </Popover>
  );
}
