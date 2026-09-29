"use server";

import { createLogger } from "@inbeat/core/logger";
import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { requireViewer } from "@/shared/lib/auth";
import { feedbackSchema } from "../schemas";

const logger = createLogger({ bindings: { action: "send-feedback" } });

export const sendFeedback = action({
  name: "send-feedback",
  schema: feedbackSchema,
  authorize: requireViewer,
  run: async (input, viewer) => {
    logger.info("feedback received", { userId: viewer.userId, length: input.message.length });
    return ok();
  },
});
