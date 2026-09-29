import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { getInitials } from "../lib/initials";
import { cn } from "../lib/utils";

export type PersonIdentityProfile = {
  name: string;
  imageUrl?: string | null;
};

export interface PersonAvatarProps {
  imageUrl?: string | null;
  name: string;
  className?: string;
  fallbackClassName?: string;
}

export function PersonAvatar({ imageUrl, name, className, fallbackClassName }: PersonAvatarProps) {
  return (
    <Avatar className={cn("size-5 shrink-0 text-[8px] leading-none", className)}>
      {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
      <AvatarFallback className={cn("text-[8px] leading-none", fallbackClassName)}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export interface PersonNameProps {
  name: string;
  className?: string;
}

export function PersonName({ name, className }: PersonNameProps) {
  return (
    <p className={cn("w-full whitespace-nowrap text-[13px] text-muted-foreground", className)}>
      {name}
    </p>
  );
}

export interface PersonIdentityProps extends PersonIdentityProfile {
  className?: string;
}

export function PersonIdentity({ name, imageUrl, className }: PersonIdentityProps) {
  return (
    <div className={cn("flex items-center gap-1.5 cursor-pointer", className)}>
      <PersonAvatar imageUrl={imageUrl} name={name} />
      <PersonName name={name} />
    </div>
  );
}
