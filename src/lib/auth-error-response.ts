import { NextResponse } from "next/server";

type BuildAuthErrorResponseParams<TCode extends string> = {
  request: Request;
  formRedirectPath: string;
  errorCode: TCode;
  status: number;
  errorMessages: Record<TCode, string>;
  options?: {
    email?: string;
    retryAfterSeconds?: number;
  };
};

export function isFormSubmission(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

export function buildAuthErrorResponse<TCode extends string>({
  request,
  formRedirectPath,
  errorCode,
  status,
  errorMessages,
  options,
}: BuildAuthErrorResponseParams<TCode>) {
  if (isFormSubmission(request)) {
    const redirectUrl = new URL(formRedirectPath, request.url);
    redirectUrl.searchParams.set("error", errorCode);
    if (options?.email) {
      redirectUrl.searchParams.set("email", options.email);
    }
    if (options?.retryAfterSeconds) {
      redirectUrl.searchParams.set(
        "retryAfter",
        options.retryAfterSeconds.toString(),
      );
    }
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  return NextResponse.json(
    { error: errorMessages[errorCode] ?? "Request failed." },
    {
      status,
      headers: options?.retryAfterSeconds
        ? { "Retry-After": options.retryAfterSeconds.toString() }
        : undefined,
    },
  );
}
