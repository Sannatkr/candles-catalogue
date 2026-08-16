/**
 * India Post's public pincode lookup. No key, no cost. Anything unexpected
 * resolves to null so the form never blocks on it.
 */
export async function lookupPincode(
  pincode: string,
  signal?: AbortSignal,
): Promise<{ state: string; district: string } | null> {
  if (!/^\d{6}$/.test(pincode)) return null;

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { signal });
    if (!res.ok) return null;

    const body = (await res.json()) as {
      Status?: string;
      PostOffice?: { State?: string; District?: string }[] | null;
    }[];

    const entry = body?.[0];
    if (entry?.Status !== "Success" || !entry.PostOffice?.length) return null;

    const office = entry.PostOffice[0];
    if (!office.State) return null;

    return { state: office.State, district: office.District ?? "" };
  } catch {
    return null;
  }
}
