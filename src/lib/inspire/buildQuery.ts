import { map } from "./mapPreference";

export function buildQuery(pref: any) {

  const region =
    pref.region
      ? pref.region
      : "";

  const travelType =
    Array.isArray(pref.travel_type)
      ? pref.travel_type.map(
          (t:string)=>map.travel_type[t]
        )
      : [];


  const activities =
    Array.isArray(pref.activities)
      ? pref.activities.map(
          (a:string)=>map.activities[a]
        )
      : [];


  const atmosphere =
    Array.isArray(pref.atmosphere)
      ? pref.atmosphere.map(
          (a:string)=>map.atmosphere[a]
        )
      : pref.atmosphere
        ? [map.atmosphere[pref.atmosphere]]
        : [];


  const budget =
    Array.isArray(pref.budget)
      ? pref.budget.map(
          (b:string)=>map.budget[b]
        )
      : pref.budget
        ? [map.budget[pref.budget]]
        : [];


  const query = `
    ${travelType.join(" ")}
    ${activities.join(" ")}
    ${region}
    ท่องเที่ยวในประเทศไทย
  `.trim();


  console.log("YOUTUBE QUERY:", query);


  return query;
}