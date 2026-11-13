import { AvatarGroup, AvatarGroupCount } from "./avatar";
import { PersonAvatar } from "./person-identity";
import { Tooltip } from "./tooltip";

export type MemberAvatarProfile = {
  id: string;
  name: string | null;
  imageUrl: string | null;
  /** Stands in for a missing name, in the avatar initials and the tooltip. */
  email?: string | null;
};

type NamedMember = Pick<MemberAvatarProfile, "name" | "email">;

const SHOWN_AVATARS = 3;
// Past this many the tooltip gets too tall to read; the rest collapse into "+N more".
const MAX_NAMES = 10;

const displayName = ({ name, email }: NamedMember) => name ?? email ?? null;

/** Everyone's name, one per line: the stack's "+N" hides people, the tooltip says who they are. */
export function memberNames(members: NamedMember[]): string {
  const names = members
    .map(displayName)
    .filter((name) => name !== null)
    .slice(0, MAX_NAMES);
  if (names.length === 0) return "";

  const hiddenCount = members.length - names.length;
  return [...names, ...(hiddenCount > 0 ? [`+${hiddenCount} more`] : [])].join("\n");
}

export function MemberAvatarStack({ members }: { members?: MemberAvatarProfile[] | null }) {
  const visibleMembers = members ?? [];

  if (visibleMembers.length === 0)
    return (
      <div className="flex w-full items-center justify-start">
        <p className="transition-colors text-xs bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground group-hover:bg-black/5">
          Empty
        </p>
      </div>
    );

  const shown = visibleMembers.slice(0, SHOWN_AVATARS);
  const extra = visibleMembers.length - shown.length;
  const names = memberNames(visibleMembers);

  const stack = (
    <AvatarGroup className="shrink-0">
      {shown.map((m) => (
        <PersonAvatar
          key={m.id}
          imageUrl={m.imageUrl}
          name={displayName(m) ?? ""}
          fallbackClassName="text-[8px]"
        />
      ))}
      {extra > 0 ? (
        <AvatarGroupCount className="size-5 text-[9px]">+{extra}</AvatarGroupCount>
      ) : null}
    </AvatarGroup>
  );

  return names ? (
    <Tooltip content={<p className="whitespace-pre-line">{names}</p>}>
      {/* Block-level, not inline: an inline wrapper sits on the text baseline and floats above
          the middle of the row. */}
      <span className="flex w-fit">{stack}</span>
    </Tooltip>
  ) : (
    stack
  );
}
