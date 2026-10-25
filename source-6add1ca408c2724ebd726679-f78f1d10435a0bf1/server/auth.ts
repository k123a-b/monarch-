import { Auth, type AuthConfig } from "@auth/core";
import Google from "@auth/core/providers/google";

// Google is the only sign-in method. Sessions are signed, encrypted JWT cookies
// issued by Auth.js; no session state is kept on the server.
export const googleConfigured = () =>
  Boolean(
    process.env.AUTH_SECRET &&
      process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET,
  );

function config(): AuthConfig {
  return {
    basePath: "/api/auth",
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      }),
    ],
    session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
    pages: { signIn: "/", error: "/" },
    callbacks: {
      // Expose Google's stable account id (the JWT subject) to the browser.
      session({ session, token }) {
        if (session.user && token.sub) (session.user as any).id = token.sub;
        return session;
      },
    },
  };
}

export const authHandler = (req: Request) => Auth(req, config());
