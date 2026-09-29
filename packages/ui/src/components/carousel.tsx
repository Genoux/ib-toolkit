"use client";

import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import * as React from "react";
import { cn } from "../lib/utils";

type CarouselOptions = Parameters<typeof useEmblaCarousel>[0];

const CarouselContext = React.createContext<{ carouselRef: UseEmblaCarouselType[0] } | null>(
  null,
);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) throw new Error("useCarousel must be used within a <Carousel />");
  return context;
}

function Carousel({
  opts,
  scrollDuration,
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  opts?: CarouselOptions;
  /** Embla scrolls with physics, not easing: higher is slower. Embla's default is 25. */
  scrollDuration?: number;
}) {
  const [carouselRef, api] = useEmblaCarousel({
    ...opts,
    ...(scrollDuration !== undefined && { duration: scrollDuration }),
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      api?.scrollPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      api?.scrollNext();
    }
  };

  return (
    <CarouselContext.Provider value={{ carouselRef }}>
      <section
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        aria-label="Carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </section>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef } = useCarousel();

  return (
    <div ref={carouselRef} className="overflow-x-auto" data-slot="carousel-content">
      <div className={cn("flex h-full gap-2 backface-hidden touch-pan-y", className)} {...props} />
    </div>
  );
}

/** Embla needs fixed item widths to compute snaps: override `basis-full` (e.g. `basis-auto`, `basis-1/4`). */
function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  useCarousel();

  return (
    <div
      data-slot="carousel-item"
      className={cn("min-w-0 shrink-0 grow-0 basis-full [&_video]:touch-pan-y", className)}
      {...props}
    />
  );
}

export { Carousel, CarouselContent, CarouselItem };
