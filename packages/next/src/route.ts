import { APP_ERROR_STATUS, AppError } from "@inbeat/core/errors";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { captureAppError } from "./capture";

export type RouteErrorBody = { error: string; code: string; errorId?: string };

type RouteContext<TParams> = { params: Promise<TParams> };

export type RouteConfig<
  TViewer,
  TParams extends Record<string, string | string[]>,
  TQuery extends z.ZodType | undefined,
  TBody extends z.ZodType | undefined,
> = {
  name: string;
  /** Same rule as `action()`: every handler states its access decision. */
  authorize: (request: Request) => Promise<TViewer>;
  query?: TQuery;
  body?: TBody;
  handler: (args: {
    request: Request;
    viewer: TViewer;
    params: TParams;
    query: TQuery extends z.ZodType ? z.output<TQuery> : undefined;
    body: TBody extends z.ZodType ? z.output<TBody> : undefined;
  }) => Promise<Response | unknown>;
};

export function errorResponse(err: unknown, name: string): NextResponse<RouteErrorBody> {
  const captured = captureAppError(err, { tags: { route: name } });
  return NextResponse.json(
    {
      error: captured.safeMessage,
      code: captured.kind,
      ...(captured.errorId ? { errorId: captured.errorId } : {}),
    },
    { status: APP_ERROR_STATUS[captured.kind] },
  );
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("validation", "Request body is not valid JSON", {
      safeMessage: "The request body is not valid JSON.",
    });
  }
}

/**
 * Route handler contract. Returns JSON with a real HTTP status, and errors as
 * `{ error, code, errorId? }` so every client can branch on `code`.
 */
export function route<
  TViewer,
  TParams extends Record<string, string | string[]> = Record<string, never>,
  TQuery extends z.ZodType | undefined = undefined,
  TBody extends z.ZodType | undefined = undefined,
>(config: RouteConfig<TViewer, TParams, TQuery, TBody>) {
  return async (request: Request, context: RouteContext<TParams>): Promise<Response> => {
    try {
      const viewer = await config.authorize(request);
      const params = (await context?.params) ?? ({} as TParams);
      const query = config.query
        ? config.query.parse(Object.fromEntries(new URL(request.url).searchParams))
        : undefined;
      const body = config.body ? config.body.parse(await readJson(request)) : undefined;
      const output = await config.handler({
        request,
        viewer,
        params,
        query: query as never,
        body: body as never,
      });
      return output instanceof Response ? output : NextResponse.json(output ?? null);
    } catch (err) {
      return errorResponse(err, config.name);
    }
  };
}
