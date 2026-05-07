// Auth checks happen in route handlers / server components via getCurrentUser().
// Middleware kept minimal (no edge-runtime auth lookup needed since we don't redirect on auth).
export {};

export const config = {
  matcher: [],
};
