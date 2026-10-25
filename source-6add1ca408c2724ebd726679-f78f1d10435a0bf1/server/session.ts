export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

// Verifies the Auth.js session cookie on the server. A cookie that is missing,
// expired, tampered with or signed with another secret yields null.
export async function sessionUser(req: Request): Promise<SessionUser | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const { getToken } = await import("@auth/core/jwt");
  const token = await getToken({
    req,
    secret,
    secureCookie: new URL(req.url).protocol === "https:",
  }).catch(() => null);
  if (!token || typeof token.sub !== "string" || !token.sub) return null;
  return {
    id: token.sub,
    name: typeof token.name === "string" ? token.name : null,
    email: typeof token.email === "string" ? token.email : null,
  };
}
