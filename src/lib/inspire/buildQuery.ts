import { map } from "./mapPreference";

export function buildQuery(pref: any) {
  const travelType =
    pref.travel_type?.map((t: string) => map.travel_type[t]) || [];

  const activities =
    pref.activities?.map((a: string) => map.activities[a]) || [];

  const atmosphere = map.atmosphere[pref.atmosphere] || "";
  const budget = map.budget[pref.budget] || "";

  return `
    ${travelType.join(" ")}
    ${activities.join(" ")}
    ${atmosphere}
    ${budget}
    thailand travel vlog
  `.trim();
}