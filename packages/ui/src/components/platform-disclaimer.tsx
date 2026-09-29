"use client";

import { X } from "lucide-react";
import { motion } from "motion/react";
import { useLayoutEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { Tooltip } from "./tooltip";

const DISMISS_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function isDismissed(cookieName: string): boolean {
  return document.cookie.split("; ").includes(`${cookieName}=1`);
}

function persistDismissed(cookieName: string) {
  // biome-ignore lint/suspicious/noDocumentCookie: CookieStore API lacks Safari support
  document.cookie = `${cookieName}=1; path=/; max-age=${DISMISS_MAX_AGE_SECONDS}; SameSite=Lax`;
}

type PlatformDisclaimerProps = {
  title: string;
  description: string;
  cookieName: string;
};

function PlatformDisclaimer({ title, description, cookieName }: PlatformDisclaimerProps) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    setDismissed(isDismissed(cookieName));
  }, [cookieName]);

  if (dismissed !== false) return null;

  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-40">
      <motion.div
        className="pointer-events-auto max-w-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 2 }}
      >
        <Alert className="shadow-elevated flex items-start gap-3 rounded-xl p-4">
          <div className="min-w-0 flex-1">
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="text-foreground/80">{description}</AlertDescription>
          </div>
          <Tooltip content="Dismiss">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Dismiss"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                persistDismissed(cookieName);
                setDismissed(true);
              }}
            >
              <X />
            </Button>
          </Tooltip>
        </Alert>
      </motion.div>
    </div>
  );
}

export { PlatformDisclaimer };
