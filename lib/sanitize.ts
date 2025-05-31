// Input sanitization utilities
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove null bytes and control characters
  return input
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control chars
    .trim();
}

export function sanitizeEmail(email: string): string {
  return sanitizeInput(email).toLowerCase();
}

export function sanitizeName(name: string): string {
  // Allow letters, spaces, hyphens, apostrophes, and periods
  return sanitizeInput(name)
    .replace(/[^a-zA-Z\s\-'.]/g, "")
    .slice(0, 100);
}

export function sanitizeUsername(username: string): string {
  // Allow alphanumeric characters, underscores, and hyphens only
  return sanitizeInput(username)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 30);
}
