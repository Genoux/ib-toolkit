interface NumberDotProps {
  count: number;
}

export function NumberDot({ count }: NumberDotProps) {
  if (count <= 0) return null;

  return (
    <span className="ml-0.5 text-xs bg-muted-foreground/10 px-1 font-bold rounded-full flex items-center justify-center text-muted-foreground">
      {count}
    </span>
  );
}
