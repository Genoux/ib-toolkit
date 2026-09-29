import { AvatarGroup, AvatarGroupCount } from "./avatar";
import { PersonAvatar } from "./person-identity";

export type MemberAvatarProfile = {
  id: string;
  name: string | null;
  imageUrl: string | null;
};

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

  const shown = visibleMembers
    .filter((m): m is MemberAvatarProfile & { name: string; imageUrl: string } =>
      Boolean(m.name && m.imageUrl),
    )
    .slice(0, 3);
  const extra = visibleMembers.length - shown.length;

  return (
    <AvatarGroup className="shrink-0">
      {shown.map((m) => (
        <PersonAvatar
          key={m.id}
          imageUrl={m.imageUrl}
          name={m.name}
          fallbackClassName="text-[8px]"
        />
      ))}
      {extra > 0 ? (
        <AvatarGroupCount className="size-5 text-[9px]">+{extra}</AvatarGroupCount>
      ) : null}
    </AvatarGroup>
  );
}
