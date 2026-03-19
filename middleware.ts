import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware temporaire sans authentification :
// laisse passer toutes les requêtes vers /admin/* sans vérifier le token.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
