/* Ace with Mr. Yeboah host routing (when custom domains are attached):
   - admin.mryeboah.study → Owner Admin
   - forms.mryeboah.study → student contribution (phase 2)
*/
import { next } from "@vercel/edge";

export const config = {
  matcher: ["/((?!api|_next|assets|favicon|.*\\..*).*)"],
};

export default function middleware(request) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const url = new URL(request.url);

  if (host === "admin.mryeboah.study") {
    if (url.pathname === "/" || url.pathname === "") {
      return next({ rewrite: new URL("/admin.html", request.url) });
    }
  }

  if (host === "forms.mryeboah.study") {
    if (url.pathname === "/" || url.pathname === "") {
      return next({ rewrite: new URL("/forms.html", request.url) });
    }
  }

  return next();
}
