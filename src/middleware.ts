import { NextRequest, NextResponse } from "next/server";

const isPublicRoute = (pathname: string) => {
  return (
    pathname === "/" ||
    pathname === "/portal-cliente" ||
    pathname.startsWith("/portal-cliente/") ||
    pathname === "/portal-pedidos" ||
    pathname.startsWith("/portal-pedidos/") ||
    pathname === "/politica-de-privacidad" ||
    pathname === "/eliminar-cuenta" ||
    pathname === "/evento/bases" ||
    // Login y registro nuevos (cada paso con su URL).
    pathname === "/ingresar" ||
    pathname.startsWith("/ingresar/") ||
    pathname === "/registro" ||
    pathname.startsWith("/registro/")
  );
};

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (request.cookies.get("sid")?.value) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/", request.url);
  loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};