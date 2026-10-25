// Browser side of Auth.js (served from /api/auth). Google is the only provider.
// The session lives in an HTTP-only cookie; nothing secret is readable here.
const base = "/api/auth";
const returnRedirect = { "X-Auth-Return-Redirect": "1" };

async function csrfToken() {
  const r = await fetch(`${base}/csrf`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!r.ok) throw Error("Sign-in is unavailable right now.");
  return (await r.json()).csrfToken;
}

async function post(path, fields) {
  const r = await fetch(`${base}/${path}`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...returnRedirect,
    },
    body: new URLSearchParams({ csrfToken: await csrfToken(), ...fields }),
  });
  return r.json().catch(() => ({}));
}

export async function getUser() {
  try {
    const r = await fetch(`${base}/session`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!r.ok) return null;
    const session = await r.json();
    return session?.user?.id
      ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        }
      : null;
  } catch {
    return null;
  }
}

export async function getProviders() {
  const r = await fetch("/api/config", { cache: "no-store" });
  if (!r.ok) throw Error("Could not read sign-in settings.");
  return r.json();
}

export async function loginWithGoogle() {
  const { url } = await post("signin/google", {
    callbackUrl: location.origin + "/",
  });
  if (!url) throw Error("Google sign-in could not start. Please try again.");
  location.assign(url);
}

export async function logout() {
  await post("signout", { callbackUrl: location.origin + "/" });
}
