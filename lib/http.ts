import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { AppError, Errors } from './errors';

export function errorEnvelope(code: string, message: string, details?: unknown) {
  return { error: { code, message, ...(details !== undefined ? { details } : {}) } };
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleError(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json(errorEnvelope(err.code, err.message, err.details), {
      status: err.status,
    });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      errorEnvelope(
        'VALIDATION_ERROR',
        'Invalid input',
        err.issues.map((i) => ({ field: i.path.join('.'), issue: i.message })),
      ),
      { status: 422 },
    );
  }
  console.error('[unhandled-error]', err);
  return NextResponse.json(errorEnvelope('INTERNAL', 'Internal server error'), { status: 500 });
}

/** Parse and validate a JSON request body against a Zod schema. */
export async function parseBody<S extends z.ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<z.infer<S>> {
  let data: unknown;
  try {
    data = await req.json();
  } catch {
    throw Errors.validation('Request body must be valid JSON');
  }
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(
      422,
      'VALIDATION_ERROR',
      'Invalid input',
      result.error.issues.map((i) => ({ field: i.path.join('.'), issue: i.message })),
    );
  }
  return result.data;
}

/** Parse search params against a Zod schema (for GET query params). */
export function parseQuery<S extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: S,
): z.infer<S> {
  const raw: Record<string, string | string[]> = {};
  searchParams.forEach((value, key) => {
    const existing = raw[key];
    if (existing === undefined) raw[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else raw[key] = [existing, value];
  });
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new AppError(
      422,
      'VALIDATION_ERROR',
      'Invalid query parameters',
      result.error.issues.map((i) => ({ field: i.path.join('.'), issue: i.message })),
    );
  }
  return result.data;
}

/** Wrap a route handler with a top-level error boundary. */
export function withError(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  return fn().catch((err) => handleError(err));
}
