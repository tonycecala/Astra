export function validateRawModelText(text: string) {
  const errors: string[] = [];
  if (/\*\*Chart Evidence\*\*/i.test(text)) {
    errors.push("Writer output must not include Chart Evidence; evidence is rendered deterministically.");
  }
  return errors;
}

export function wordCount(value: string | undefined) {
  return String(value ?? "").trim().split(/\s+/).filter(Boolean).length;
}
