import type { Meta, StoryObj } from "@storybook/react-vite";

type TokenPair = readonly [token: string, textToken?: string];

const COLOR_GROUPS: ReadonlyArray<{ title: string; tokens: readonly TokenPair[] }> = [
  {
    title: "Surfaces",
    tokens: [
      ["background", "foreground"],
      ["card", "card-foreground"],
      ["popover", "popover-foreground"],
      ["cream"],
    ],
  },
  {
    title: "Actions",
    tokens: [
      ["primary", "primary-foreground"],
      ["secondary", "secondary-foreground"],
      ["muted", "muted-foreground"],
      ["accent", "accent-foreground"],
      ["destructive"],
    ],
  },
  { title: "Lines", tokens: [["border"], ["input"], ["ring"]] },
  {
    title: "Sidebar",
    tokens: [
      ["sidebar", "sidebar-foreground"],
      ["sidebar-accent", "sidebar-accent-foreground"],
      ["sidebar-border"],
      ["sidebar-ring"],
    ],
  },
];

const RADII = [
  "rounded-sm",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "rounded-2xl",
  "rounded-3xl",
  "rounded-4xl",
  "rounded-full",
] as const;

function Swatch({ token, textToken }: { token: string; textToken?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex h-16 w-40 items-end rounded-lg border p-2 text-xs font-medium"
        style={{
          background: `var(--${token})`,
          color: textToken ? `var(--${textToken})` : undefined,
        }}
      >
        {textToken ? "Aa" : null}
      </div>
      <code className="text-xs text-muted-foreground">--{token}</code>
    </div>
  );
}

const meta = {
  title: "Foundations",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {COLOR_GROUPS.map(({ title, tokens }) => (
        <section key={title} className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="flex flex-wrap gap-4">
            {tokens.map(([token, textToken]) => (
              <Swatch key={token} token={token} textToken={textToken} />
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Radius: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {RADII.map((radius) => (
        <div key={radius} className="flex flex-col items-center gap-2">
          <div className={`size-20 border-2 border-foreground/20 bg-muted ${radius}`} />
          <code className="text-xs text-muted-foreground">{radius}</code>
        </div>
      ))}
    </div>
  ),
};

export const Shadows: Story = {
  render: () => (
    <div className="flex gap-6">
      {["shadow-hairline", "shadow-subtle", "shadow-elevated"].map((shadow) => (
        <div key={shadow} className="flex flex-col items-center gap-2">
          <div className={`size-24 rounded-xl bg-background ${shadow}`} />
          <code className="text-xs text-muted-foreground">{shadow}</code>
        </div>
      ))}
    </div>
  ),
};
