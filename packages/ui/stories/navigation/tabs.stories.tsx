import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsContent, TabsList } from "../../src/components/tabs";

const TABS = [
  { value: "all", label: "All", count: 24 },
  { value: "active", label: "Active", count: 8 },
  { value: "archived", label: "Archived" },
];

const meta = {
  title: "Navigation/Tabs",
  component: Tabs,
  render: () => (
    <Tabs defaultValue={TABS[0]?.value} className="w-md">
      <TabsList tabs={TABS} />
      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <p className="py-4 text-muted-foreground">{tab.label} panel</p>
        </TabsContent>
      ))}
    </Tabs>
  ),
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="all" className="w-md">
      <TabsList
        tabs={TABS.map((tab) => (tab.value === "archived" ? { ...tab, disabled: true } : tab))}
      />
    </Tabs>
  ),
};
