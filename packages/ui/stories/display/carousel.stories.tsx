import type { Meta, StoryObj } from "@storybook/react-vite";
import { Carousel, CarouselContent, CarouselItem } from "../../src/components/carousel";

const SLIDES = Array.from({ length: 8 }, (_, index) => index + 1);

const meta = {
  title: "Display/Carousel",
  component: Carousel,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Carousel className="w-xl" opts={{ align: "start", slidesToScroll: "auto" }}>
      <CarouselContent>
        {SLIDES.map((slide) => (
          <CarouselItem key={slide} className="basis-auto">
            <div className="flex aspect-9/16 w-32 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
              {slide}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  ),
};
