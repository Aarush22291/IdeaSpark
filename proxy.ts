import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/register",
});

export const config = {
  matcher: [
    "/account/:path*",
    "/dashboard/:path*",
    "/panel/:path*",
    "/admin/:path*",
  ],
};
