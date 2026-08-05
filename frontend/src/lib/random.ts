const ALPHANUMERIC = "abcdefghijklmnopqrstuvwxyz0123456789"

/** Cryptographically random alphanumeric string (mock tokens, codes). */
export function randomAlphanumeric(length: number): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ""
  for (const byte of bytes) {
    out += ALPHANUMERIC[byte % ALPHANUMERIC.length]
  }
  return out
}

/** Cryptographically random numeric string of the given length. */
export function randomDigits(length: number): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ""
  for (const byte of bytes) {
    out += String(byte % 10)
  }
  return out
}
