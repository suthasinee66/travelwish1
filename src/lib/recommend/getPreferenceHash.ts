export async function getPreferenceHash(preferences: any) {
  const normalized = JSON.stringify({
    travel_type: [...(preferences?.travel_type || [])].sort(),
    activities: [...(preferences?.activities || [])].sort(),
    atmosphere: [...(preferences?.atmosphere || [])].sort(),
    budget: [...(preferences?.budget || [])].sort(),
    companion: [...(preferences?.companion || [])].sort(),
  });

  const encoder = new TextEncoder();

  const data = encoder.encode(normalized);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array.from(
    new Uint8Array(hashBuffer)
  )
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}