/** Coerce a backend numeric value (often a Decimal serialized as string) to number. */
export function toNumber(value: string | number | null): number {
  if (value === null) {
    return 0;
  }
  return typeof value === "number" ? value : Number(value);
}

/** Same as toNumber but preserves null (for optional money fields). */
export function toNullableNumber(value: string | number | null): number | null {
  return value === null ? null : toNumber(value);
}
