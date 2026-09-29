import type { ReactNode } from "react";
import type { AppNavItem } from "../../src/components/app-nav";

export function renderNavButton(onSelect: (item: AppNavItem) => void) {
  return (item: AppNavItem, content: ReactNode) => (
    <button
      type="button"
      onClick={() => {
        if (!item.disabled) onSelect(item);
      }}
    >
      {content}
    </button>
  );
}
