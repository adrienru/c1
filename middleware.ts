import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSession } from "@/lib/session"

export const config = {
  matcher: ["/dashboard/:path*", "/((?!api|_next/static|_next/image|favicon.ico|login|.*\\..*).*)"],
}

export async function middleware(request: NextRequest) {
  const session = await getSession()
  const { pathname } = request.nextUrl

  // Permitir acceso a la página de inicio (/) sin autenticación
  if (pathname === "/") {
    if (session) {
      // Si ya está logueado, redirigir al dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  // Permitir acceso a la página de login sin autenticación
  if (pathname === "/login") {
    if (session) {
      // Si ya está logueado, redirigir al dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  // Proteger rutas del dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}
