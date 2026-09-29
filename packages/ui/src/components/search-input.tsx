"use client";

import { Search, X } from "lucide-react";
import type * as React from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Spinner } from "./spinner";
import { cn } from "../lib/utils";

interface SearchInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

export function SearchInput({
  value,
  onChange,
  isLoading,
  placeholder = "Search…",
  className,
  ...props
}: SearchInputProps) {
  const showClear = value.length > 0;

  return (
    <div className={cn("relative min-w-56 w-80 max-w-full", className)}>
      {isLoading ? (
        <Spinner className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
      ) : (
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      )}
      <Input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("h-8 rounded-lg pl-9 text-sm", showClear && "pr-8")}
      />
      {showClear && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X aria-hidden strokeWidth={3} />
        </Button>
      )}
    </div>
  );
}
