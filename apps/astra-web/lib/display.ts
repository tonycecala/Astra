export function displayTimezone(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "";
}
