/* ─────────────────────────────────────────────────────────────────
   AUTH COOKIE
   The customer session token lives in an httpOnly cookie (not readable
   by JS → not exposed to XSS). Route handlers read it from the request
   and set/clear it on the response.
───────────────────────────────────────────────────────────────── */
import type { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE = "ct";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Read the customer token from the request's httpOnly cookie. */
export function readAuthToken(req: NextRequest): string | undefined {
  return req.cookies.get(AUTH_COOKIE)?.value || undefined;
}

/** Set the httpOnly session cookie on a response (called on login). */
export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Clear the session cookie (called on logout). */
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
