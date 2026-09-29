import "./preview.css";
import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview, ReactRenderer } from "@storybook/react-vite";
import { Toaster } from "../src/components/sonner";
import { TooltipProvider } from "../src/components/tooltip";

const withAppProviders: Decorator = (Story) => (
  <TooltipProvider>
    <Story />
    <Toaster />
  </TooltipProvider>
);

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    a11y: { test: "todo" },
    options: {
      storySort: {
        order: [
          "Foundations",
          "Actions",
          "Forms",
          "Display",
          "Feedback",
          "Navigation",
          "Overlays",
          "Data",
        ],
      },
    },
  },
  decorators: [
    withAppProviders,
    withThemeByClassName<ReactRenderer>({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
