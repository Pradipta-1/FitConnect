/**
 * apiFetch – drop-in replacement for fetch() that automatically attaches
 * the per-tab sessionStorage JWT as an Authorization: Bearer header.
 *
 * Cookies are domain-wide and shared across all browser tabs, so two users
 * logged in to different tabs would clobber each other's session.
 * sessionStorage is per-tab and survives navigation but NOT other tabs.
 */
export function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  // Only on the client side
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("auth_token")
      : null;

  const headers = new Headers(init.headers ?? {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
    // Keep credentials:include so the cookie still works as a fallback
    // (e.g. SSR or in environments where sessionStorage isn't available)
    credentials: "include",
  });
}
