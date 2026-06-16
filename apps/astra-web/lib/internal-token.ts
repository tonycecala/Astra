import "server-only";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

export function resolveInternalApiToken() {
  const token = clean(process.env.ASTRA_INTERNAL_API_TOKEN);
  if (token) return token;
  throw new Error("ASTRA_INTERNAL_API_TOKEN is required for internal API calls.");
}

export function hasValidInternalApiToken(request: Request) {
  return request.headers.get("x-astra-internal-token") === resolveInternalApiToken();
}
