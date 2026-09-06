export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length === 0) {
    return email;
  }
  if (local.length <= 3) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local.slice(-2)}@${domain}`;
}
