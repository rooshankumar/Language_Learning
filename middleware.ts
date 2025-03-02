import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get("auth")
  const { pathname } = request.nextUrl

  // Auth routes that don't require authentication
  const authRoutes = ["/sign-in", "/sign-up", "/forgot-password"]

  // Routes that require authentication
  const protectedRoutes = ["/", "/chat", "/community", "/profile", "/settings"]

  // Add a protection to prevent redirect loops - check if there's a loop flag
  const hasRedirectLoop = request.cookies.get("redirect-loop")
  if (hasRedirectLoop) {
    // Clear the loop flag and bypass the redirect
    const response = NextResponse.next()
    response.cookies.delete("redirect-loop")
    return response
  }

  // Check if the route is protected and user is not authenticated
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !authCookie) {
    const response = NextResponse.redirect(new URL("/sign-in", request.url))
    // Set a cookie to detect potential redirect loops
    response.cookies.set("redirect-loop", "true", { maxAge: 5 }) // Short-lived cookie
    return response
  }

  // Check if the route is an auth route and user is authenticated
  if (authRoutes.includes(pathname) && authCookie) {
    const response = NextResponse.redirect(new URL("/", request.url))
    // Set a cookie to detect potential redirect loops
    response.cookies.set("redirect-loop", "true", { maxAge: 5 }) // Short-lived cookie
    return response
  }

  // If none of the conditions are met, continue with the request
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

