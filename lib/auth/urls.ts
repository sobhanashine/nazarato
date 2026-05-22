/** Only allow same-origin relative paths as a post-login redirect target. */
export function safeNext(value: string): string {
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  ) {
    return value;
  }
  return "/";
}
