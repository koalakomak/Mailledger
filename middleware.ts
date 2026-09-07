import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protect every dashboard page; API routes perform their own auth checks.
  matcher: ["/dashboard/:path*"],
};
