export const defaultComposerOperatorKey = "local-operator";

export function composerOperatorKeyFrom(request: Request, value?: string | null) {
  return value?.trim() || request.headers.get("x-composer-operator-key")?.trim() || defaultComposerOperatorKey;
}
