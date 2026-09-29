import { fail, type Result } from "@inbeat/core/result";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import { captureAppError } from "./capture";

export type ActionConfig<TSchema extends z.ZodType, TViewer, TData> = {
  name: string;
  schema: TSchema;
  /**
   * Required on purpose: an action cannot exist without an explicit access decision.
   * Throw `AppError("auth" | "forbidden")` to deny; use `publicAccess` for unauthenticated
   * actions, which must then be rate limited inside `run`.
   */
  authorize: () => Promise<TViewer>;
  run: (input: z.output<TSchema>, viewer: TViewer) => Promise<Result<TData>>;
  revalidate?: (input: z.output<TSchema>, data: TData) => string[];
};

export const publicAccess = async (): Promise<null> => null;

/**
 * Server action contract: authorize, validate, run, revalidate, and always resolve to a Result.
 * Expected failures come back as values; anything thrown is classified, reported and replaced
 * with safe copy, so no raw error message ever crosses to the client.
 */
export function action<TSchema extends z.ZodType, TViewer, TData>(
  config: ActionConfig<TSchema, TViewer, TData>,
): (input: z.input<TSchema>) => Promise<Result<TData>> {
  return async (rawInput) => {
    try {
      const viewer = await config.authorize();
      const input = config.schema.parse(rawInput);
      const result = await config.run(input, viewer);
      if (result.ok) {
        for (const path of config.revalidate?.(input, result.data) ?? []) revalidatePath(path);
      }
      return result;
    } catch (err) {
      unstable_rethrow(err);
      const captured = captureAppError(err, { tags: { action: config.name } });
      return fail(captured.safeMessage, captured.kind, captured.errorId);
    }
  };
}
