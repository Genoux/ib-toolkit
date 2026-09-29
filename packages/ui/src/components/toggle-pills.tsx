import { Button } from "./button";

interface TogglePillsProps {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function TogglePills({ options, selected, onToggle }: TogglePillsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <Button
            key={option}
            type="button"
            variant={isSelected ? "default" : "outline"}
            onClick={() => onToggle(option)}
            className={`text-xs px-2.5 h-8 border border-transparent rounded-full ${
              isSelected
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground"
            }`}
          >
            {option}
          </Button>
        );
      })}
    </div>
  );
}
