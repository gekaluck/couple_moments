import type { ReactNode } from "react";

type HorizontalRailProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
};

export default function HorizontalRail<T>({
  items,
  getKey,
  renderItem,
}: HorizontalRailProps<T>) {
  return (
    <div className="stagger-children -mx-4 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:snap-none md:flex-col md:gap-4 md:overflow-visible md:px-0 md:pb-0">
      {items.map((item) => (
        <div
          key={getKey(item)}
          className="flex min-w-[72%] max-w-[78%] snap-start md:min-w-0 md:max-w-none [&:only-child]:min-w-full [&:only-child]:max-w-full"
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
