import type {
    TripPlanInput
} from "./types";


/*
==================================================
 Maximum Raw Score
==================================================

travel_type      6 × 3 = 18
activities       5 × 2 = 10
atmosphere       4 × 2 = 8
budget           1 × 2 = 2
travel_companion 1 × 2 = 2

Maximum = 40
==================================================
*/

const MAX_SCORE = 40;


/*
==================================================
 Distance
==================================================
*/

export function distanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {

    if (
        !Number.isFinite(lat1) ||
        !Number.isFinite(lon1) ||
        !Number.isFinite(lat2) ||
        !Number.isFinite(lon2)
    ) {
        return 999;
    }

    const R = 6371;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;

    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            lat1 * Math.PI / 180
        ) *

        Math.cos(
            lat2 * Math.PI / 180
        ) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return (
        R *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        )
    );
}


/*
==================================================
 Score Attraction
==================================================
*/

export function scoreAttraction(
    place: any,
    trip: TripPlanInput
): number {

    let score = 0;


    /*
    ==========================================
    Travel Type
    ==========================================
    */

    if (
        Array.isArray(place.travel_type) &&
        Array.isArray(trip.travelType)
    ) {

        for (
            const type of trip.travelType
        ) {

            if (
                place.travel_type.includes(type)
            ) {

                score += 3;

            }

        }

    }


    /*
    ==========================================
    Activities
    ==========================================
    */

    if (
        Array.isArray(place.activities) &&
        Array.isArray(trip.activities)
    ) {

        for (
            const activity of trip.activities
        ) {

            if (
                place.activities.includes(activity)
            ) {

                score += 2;

            }

        }

    }


    /*
    ==========================================
    Atmosphere
    ==========================================
    */

    if (
        Array.isArray(place.atmosphere) &&
        Array.isArray(trip.atmosphere)
    ) {

        for (
            const atmosphere of trip.atmosphere
        ) {

            if (
                place.atmosphere.includes(atmosphere)
            ) {

                score += 2;

            }

        }

    }


    /*
    ==========================================
    Companion
    ==========================================
    */

    if (
        Array.isArray(place.travel_companion) &&
        trip.companion
    ) {

        if (
            place.travel_companion.includes(
                trip.companion
            )
        ) {

            score += 2;

        }

    }


    /*
    ==========================================
    Budget
    ==========================================
    */

    if (
        Array.isArray(place.budget) &&
        trip.budget != null
    ) {

        let userBudget = "";

        if (
            trip.budget <= 3000
        ) {

            userBudget = "ประหยัด";

        } else if (
            trip.budget <= 10000
        ) {

            userBudget = "ปานกลาง";

        } else {

            userBudget = "หรูหรา";

        }


        if (
            place.budget.includes(userBudget)
        ) {

            score += 2;

        }

    }


    return score;
}


/*
==================================================
 Find Nearby Restaurants
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
            restaurant =>
                restaurant.distance < 10
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
 Main Algorithm
==================================================
*/
export function rankPlacesOld(
    attractions: any[],
    restaurants: any[],
    trip: TripPlanInput
) {

    console.log(
        "========== OLD ALGORITHM =========="
    );

    console.log(
        "Attractions ทั้งหมด =",
        attractions.length
    );

    console.log(
        "จังหวัดที่เลือก =",
        trip.province
    );

    // ==========================================
    // Filter ตามจังหวัด
    // ==========================================

    const provinceAttractions =
        attractions.filter(place =>
            place.province === trip.province
        );

    console.log(
        "Attractions หลังกรองจังหวัด =",
        provinceAttractions.length
    );

    // ==========================================
    // Score
    // ==========================================

    const scored =
        provinceAttractions.map(place => {

            const rawScore =
                scoreAttraction(
                    place,
                    trip
                );

            const normalizedScore =
                Math.min(
                    rawScore / MAX_SCORE,
                    1
                );

            return {

                id:
                    place.att_id,

                name_th:
                    place.name_th,

                province:
                    place.province,

                latitude:
                    place.latitude,

                longitude:
                    place.longitude,

                rawScore,

                score:
                    normalizedScore

            };
        });

    // ==========================================
    // Sort
    // ==========================================

    const topPlaces =
        scored
            .sort((a, b) => {

                if (
                    b.rawScore !==
                    a.rawScore
                ) {
                    return (
                        b.rawScore -
                        a.rawScore
                    );
                }

                return 0;
            })
            .slice(0, 15);

    // ==========================================
    // Result
    // ==========================================

    return topPlaces.map(place => ({

        attraction: {

            id:
                place.id,

            name_th:
                place.name_th,

            province:
                place.province,

            latitude:
                place.latitude,

            longitude:
                place.longitude,

            score:
                place.score,

            rawScore:
                place.rawScore

        },

        nearbyRestaurants:

            findNearbyRestaurants(
                place,
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

    }));
}