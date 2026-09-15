import type {
    TripPlanInput
} from "./types";

import {
    distanceKm
} from "./oldAlgorithm";


/*
==================================================
 TOPICS
==================================================
*/

export const TOPICS = {

    travel_type: [
        "ภูเข",
        "ทะเล",
        "วัฒนธรรม",
        "คาเฟ่",
        "ธรรมชาติ",
        "เมือง"
    ],

    activities: [
        "ถ่ายรูป",
        "เดินป่า",
        "อาหาร",
        "ช้อปปิ้ง",
        "พักผ่อน"
    ],

    atmosphere: [
        "คึกคัก",
        "เงียบสงบ",
        "ผจญภัย",
        "หรูหรา"
    ],

    budget: [
        "ประหยัด",
        "ปานกลาง",
        "หรูหรา"
    ],

    travel_companion: [
        "คนเดียว",
        "คู่รัก",
        "ครอบครัว",
        "เพื่อน"
    ]

} as const;


/*
==================================================
 Normalize Array
==================================================
*/

function normalizeArray(
    value: any
): string[] {

    if (Array.isArray(value)) {

        return value
            .map(v =>
                String(v).trim()
            )
            .filter(Boolean);

    }

    if (typeof value === "string") {

        return value
            .split(",")
            .map(v =>
                v.trim()
            )
            .filter(Boolean);

    }

    return [];

}


/*
==================================================
 Budget Category
==================================================
*/

function getBudgetCategory(
    budget:
        number |
        null |
        undefined
): string[] {

    if (budget == null) {
        return [];
    }

    if (budget <= 3000) {
        return ["ประหยัด"];
    }

    if (budget <= 10000) {
        return ["ปานกลาง"];
    }

    return ["หรูหรา"];

}


/*
==================================================
 Topic Vector
==================================================

6 + 5 + 4 + 3 + 4

= 22 dimensions
==================================================
*/

export function createTopicVector(
    place: any
): number[] {

    const vector: number[] = [];


    const travelType =
        normalizeArray(
            place.travel_type
        );

    const activities =
        normalizeArray(
            place.activities
        );

    const atmosphere =
        normalizeArray(
            place.atmosphere
        );

    const budget =
        normalizeArray(
            place.budget
        );

    const companion =
        normalizeArray(
            place.travel_companion
        );


    /*
    Travel Type
    */

    for (
        const topic of TOPICS.travel_type
    ) {

        vector.push(
            travelType.includes(topic)
                ? 1
                : 0
        );

    }


    /*
    Activities
    */

    for (
        const topic of TOPICS.activities
    ) {

        vector.push(
            activities.includes(topic)
                ? 1
                : 0
        );

    }


    /*
    Atmosphere
    */

    for (
        const topic of TOPICS.atmosphere
    ) {

        vector.push(
            atmosphere.includes(topic)
                ? 1
                : 0
        );

    }


    /*
    Budget
    */

    for (
        const topic of TOPICS.budget
    ) {

        vector.push(
            budget.includes(topic)
                ? 1
                : 0
        );

    }


    /*
    Companion
    */

    for (
        const topic of TOPICS.travel_companion
    ) {

        vector.push(
            companion.includes(topic)
                ? 1
                : 0
        );

    }


    return vector;

}


/*
==================================================
 User Vector
==================================================
*/

function createUserTopicVector(
    trip: TripPlanInput
): number[] {

    return createTopicVector({

        travel_type:
            trip.travelType,

        activities:
            trip.activities,

        atmosphere:
            trip.atmosphere,

        budget:
            getBudgetCategory(
                trip.budget
            ),

        travel_companion:
            trip.companion
                ? [trip.companion]
                : []

    });

}


/*
==================================================
 Cosine Similarity
==================================================
*/

export function cosineSimilarity(
    a: number[],
    b: number[]
): number {

    if (
        a.length !== b.length ||
        a.length === 0
    ) {

        return 0;

    }


    let dot = 0;

    let magnitudeA = 0;

    let magnitudeB = 0;


    for (
        let i = 0;
        i < a.length;
        i++
    ) {

        dot +=
            a[i] * b[i];

        magnitudeA +=
            a[i] * a[i];

        magnitudeB +=
            b[i] * b[i];

    }


    if (
        magnitudeA === 0 ||
        magnitudeB === 0
    ) {

        return 0;

    }


    return (
        dot /
        (
            Math.sqrt(magnitudeA) *
            Math.sqrt(magnitudeB)
        )
    );

}


/*
==================================================
 Attraction Similarity
==================================================
*/

export function attractionSimilarity(
    a: any,
    b: any
): number {

    return cosineSimilarity(

        createTopicVector(a),

        createTopicVector(b)

    );

}


/*
==================================================
 Topic Diversity
==================================================
*/

function topicDiversityScore(
    candidate: any,
    selected: any[]
): number {

    if (
        selected.length === 0
    ) {

        return 1;

    }


    let maxSimilarity = 0;


    for (
        const selectedPlace of selected
    ) {

        const similarity =
            attractionSimilarity(

                candidate.raw,

                selectedPlace.raw

            );


        maxSimilarity =
            Math.max(
                maxSimilarity,
                similarity
            );

    }


    return 1 - maxSimilarity;

}

/*
==================================================
 Geographic Proximity Score
==================================================

ยิ่งใกล้สถานที่ที่เลือกแล้ว
คะแนนยิ่งสูง

0 - 5 km     = 1.00
5 - 10 km    = 0.85
10 - 20 km   = 0.65
20 - 30 km   = 0.40
30 - 50 km   = 0.15
มากกว่า 50   = 0.00

==================================================
*/

function geographicDiversityScore(
    candidate: any,
    selected: any[]
): number {

    /*
    ------------------------------------------
    สถานที่แรก
    ------------------------------------------
    */

    if (
        selected.length === 0
    ) {

        return 1;

    }


    const lat =
        Number(
            candidate.raw?.latitude
        );

    const lon =
        Number(
            candidate.raw?.longitude
        );


    /*
    ------------------------------------------
    ตรวจพิกัด Candidate
    ------------------------------------------
    */

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon)
    ) {

        console.warn(
            "Invalid candidate coordinates:",
            candidate.raw?.name_th,
            candidate.raw?.latitude,
            candidate.raw?.longitude
        );

        return 0;

    }


    /*
    ------------------------------------------
    คำนวณระยะทางกับสถานที่ที่เลือกแล้ว
    ------------------------------------------
    */

    const distances: number[] = [];


    for (
        const selectedPlace of selected
    ) {

        const selectedLat =
            Number(
                selectedPlace.raw?.latitude
            );

        const selectedLon =
            Number(
                selectedPlace.raw?.longitude
            );


        /*
        --------------------------------------
        ข้ามสถานที่ที่พิกัดผิด
        --------------------------------------
        */

        if (
            !Number.isFinite(selectedLat) ||
            !Number.isFinite(selectedLon)
        ) {

            continue;

        }


        const distance =
            distanceKm(

                lat,
                lon,

                selectedLat,
                selectedLon

            );


        if (
            Number.isFinite(distance)
        ) {

            distances.push(
                distance
            );

        }

    }


    /*
    ------------------------------------------
    ไม่มีระยะทางที่ใช้ได้
    ------------------------------------------
    */

    if (
        distances.length === 0
    ) {

        return 0;

    }


    /*
    ------------------------------------------
    ใช้จุดที่ใกล้ที่สุด
    ------------------------------------------
    */

    const minDistance =
        Math.min(
            ...distances
        );


    /*
    ------------------------------------------
    แปลงระยะทางเป็นคะแนน
    ------------------------------------------
    */

    if (
        minDistance <= 5
    ) {

        return 1;

    }

    if (
        minDistance <= 10
    ) {

        return 0.85;

    }

    if (
        minDistance <= 20
    ) {

        return 0.65;

    }

    if (
        minDistance <= 30
    ) {

        return 0.40;

    }

    if (
        minDistance <= 50
    ) {

        return 0.15;

    }


    return 0;

}
/*
==================================================
 Final Diverse Score
==================================================

Preference           50%
Topic Diversity      15%
Geographic Proximity 35%

==================================================
*/

function calculateDiverseScore(
    candidate: any,
    selected: any[],
    maxPreference: number
): number {

    /*
    ------------------------------------------
    Preference
    ------------------------------------------
    */

    const preferenceScore =
        Number(
            candidate.preferenceScore
        );


    const preference =
        Number.isFinite(preferenceScore) &&
        maxPreference > 0

            ? preferenceScore /
              maxPreference

            : 0;


    /*
    ------------------------------------------
    Topic Diversity
    ------------------------------------------
    */

    const topicDiversity =
        topicDiversityScore(
            candidate,
            selected
        );


    /*
    ------------------------------------------
    Geographic Proximity
    ------------------------------------------
    */

    const geographicProximity =
        geographicDiversityScore(
            candidate,
            selected
        );


    /*
    ------------------------------------------
    Final Score
    ------------------------------------------
    */

    const finalScore =

        preference * 0.50 +

        topicDiversity * 0.15 +

        geographicProximity * 0.35;


    /*
    ------------------------------------------
    ป้องกัน NaN / Infinity
    ------------------------------------------
    */

    if (
        !Number.isFinite(finalScore)
    ) {

        console.warn(
            "Invalid diverse score:",
            {
                name:
                    candidate.raw?.name_th,

                preference,

                topicDiversity,

                geographicProximity
            }
        );

        return 0;

    }


    return finalScore;

}


/*
==================================================
 Nearby Restaurants
==================================================
*/

function findNearbyRestaurants(
    place: any,
    restaurants: any[]
) {

    return restaurants

        .map(rest => {

            const distance =
                distanceKm(

                    Number(place.latitude),
                    Number(place.longitude),

                    Number(rest.latitude),
                    Number(rest.longitude)

                );

            return {
                ...rest,
                distance
            };

        })

        .filter(
            rest =>
                rest.distance < 10
        )

        .sort(
            (a, b) =>
                a.distance -
                b.distance
        )

        .slice(0, 3);

}


/*
==================================================
 Select Diverse Places
==================================================
*/

function selectDiversePlaces(
    attractions: any[],
    trip: TripPlanInput,
    limit = 15
) {

    /*
    ==========================================
    User Vector
    ==========================================
    */

    const userVector =
        createUserTopicVector(
            trip
        );


    /*
    ==========================================
    Candidates
    ==========================================
    */

    const candidates =
        attractions.map(place => {

            const topicVector =
                createTopicVector(
                    place
                );


            const preferenceScore =
                cosineSimilarity(

                    userVector,

                    topicVector

                );


            return {

                raw:
                    place,

                topicVector,

                preferenceScore

            };

        });


    /*
    ==========================================
    Maximum Preference
    ==========================================
    */

    const maxPreference =
        Math.max(

            ...candidates.map(
                c =>
                    c.preferenceScore
            ),

            1

        );


    /*
    ==========================================
    Minimum Preference
    ==========================================
    */

    const minimumPreference =
        maxPreference * 0.30;


    const filtered =
        candidates.filter(

            candidate =>
                candidate.preferenceScore >=
                minimumPreference

        );


    /*
    ถ้ามีน้อยกว่า 15
    ให้ใช้ทั้งหมด
    */

    const pool =
        filtered.length >= limit
            ? filtered
            : candidates;


    /*
    ==========================================
    Greedy Selection
    ==========================================
    */

    const selected: any[] = [];

    const available =
        [...pool];


    while (
        selected.length < limit &&
        available.length > 0
    ) {

        let bestIndex = 0;

        let bestScore = -Infinity;


        for (
            let i = 0;
            i < available.length;
            i++
        ) {

            const candidate =
                available[i];


            const diverseScore =
                calculateDiverseScore(

                    candidate,

                    selected,

                    maxPreference

                );


            if (
                diverseScore >
                bestScore
            ) {

                bestScore =
                    diverseScore;

                bestIndex =
                    i;

            }

        }


        const selectedPlace =
    available.splice(
        bestIndex,
        1
    )[0];

selected.push({

    ...selectedPlace,

    diverseScore:
        bestScore

});

    }


    return selected;

}


/*
==================================================
 Main Algorithm
==================================================
*/
export function rankPlacesDiversity(
    attractions: any[],
    restaurants: any[],
    trip: TripPlanInput
) {

    // ==========================================
    // Filter จังหวัด
    // ==========================================

    const provinceAttractions =
        attractions.filter(
            place =>
                place.province ===
                trip.province
        );


    console.log(
        "========== DIVERSITY ALGORITHM =========="
    );

    console.log(
        "จังหวัดที่ใช้:",
        trip.province
    );

    console.log(
        "จำนวน attractions ทั้งหมด:",
        attractions.length
    );

    console.log(
        "จำนวน attractions หลังกรองจังหวัด:",
        provinceAttractions.length
    );


    // ==========================================
    // Diversity Ranking
    // ==========================================

    const topPlaces =
        selectDiversePlaces(
            provinceAttractions,
            trip,
            15
        );


    return topPlaces.map(
        place => ({

            attraction: {

                id:
                    place.raw.att_id,

                name_th:
                    place.raw.name_th,

                province:
                    place.raw.province,

                latitude:
                    place.raw.latitude,

                longitude:
                    place.raw.longitude,

                score:
                    place.preferenceScore,

                diverseScore:
                    place.diverseScore

            },

            nearbyRestaurants:

                findNearbyRestaurants(
                    place.raw,
                    restaurants
                )
                .map(rest => ({

                    id:
                        rest.place_id,

                    restaurant_name_th:
                        rest.place_name_th,

                    latitude:
                        rest.latitude,

                    longitude:
                        rest.longitude,

                    distance:
                        rest.distance

                }))

        })
    );
}


/*
==================================================
 Export
==================================================
*/

export {
    topicDiversityScore,
    geographicDiversityScore
};