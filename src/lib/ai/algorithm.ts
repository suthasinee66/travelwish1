
import type { TripPlanInput } from "./types";

import {
    rankPlacesTDMC,
    normalizeWeights,
    type TDMCPlace,
    type TDMCWeights,
    type TDMCResult,
    type TDMCScoredPlace,
} from "../algorithm/tdmcAlgorithm";

/* =========================================================
   DISTANCE
   ========================================================= */

function distanceKm(
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

        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *

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


/* =========================================================
   NEARBY RESTAURANTS
   ========================================================= */

function findNearbyRestaurants(
    place: TDMCPlace,
    restaurants: any[],
    limit = 3
) {

    const placeLat =
        Number(
            place.latitude ??
            place.lat
        );

    const placeLng =
        Number(
            place.longitude ??
            place.lng
        );

    if (
        !Number.isFinite(placeLat) ||
        !Number.isFinite(placeLng)
    ) {
        return [];
    }

    return restaurants

        .map(rest => {

            const restLat =
                Number(rest.latitude);

            const restLng =
                Number(rest.longitude);

            const distance =
                distanceKm(
                    placeLat,
                    placeLng,
                    restLat,
                    restLng
                );

            return {
                ...rest,
                distance
            };

        })

        .filter(
            rest =>
                Number.isFinite(rest.distance) &&
                rest.distance < 10
        )

        .sort(
            (a, b) =>
                a.distance -
                b.distance
        )

        .slice(0, limit);
}


/* =========================================================
   TDMC RESULT → SYSTEM RESULT
   ========================================================= */

function formatRankedPlaces(
    rankedPlaces: TDMCScoredPlace[],
    restaurants: any[]
) {

    return rankedPlaces.map(
        place => ({

            /* =============================================
               ATTRACTION
               ============================================= */

            attraction: {

                id:
                    place.att_id ??
                    place.id,

                name_th:
                    place.name_th,

                name_en:
                    place.name_en,

                latitude:
                    place.latitude ??
                    place.lat,

                longitude:
                    place.longitude ??
                    place.lng,


                /* =========================================
                   MAIN TDMC SCORE
                   ========================================= */

                score:
                    place.tdmcScore,


                /* =========================================
                   TDMC COMPONENT SCORES

                   ใช้สำหรับ Debug / Experiment
                   ========================================= */

                tdmcScore:
                    place.tdmcScore,

                accuracyScore:
                    place.accuracyScore,

                popularityScore:
                    place.popularityScore,

                distanceScore:
                    place.distanceScore,


                /* =========================================
                   NORMALIZED VALUES
                   ========================================= */

                normalizedRating:
                    place.normalizedRating,

                normalizedPopularity:
                    place.normalizedPopularity,

                normalizedDistance:
                    place.normalizedDistance,


                /* =========================================
                   TOPIC METRICS
                   ========================================= */

                topicSimilarity:
                    place.topicSimilarity,

                topicDiversity:
                    place.topicDiversity,


                /* =========================================
                   DISTANCE
                   ========================================= */

                distanceKm:
                    place.distanceKm,


                /* =========================================
                   OPTIONAL INFORMATION
                   ========================================= */

                category:
                    place.category,

                province:
                    place.province,

                rating:
                    place.rating ??
                    place.averageRating ??
                    place.predictedRating ??
                    place.predictedRatingByAttraction,

                popularity:
                    place.popularity ??
                    place.visitors ??
                    place.visitorCount,

            },


            /* =============================================
               NEARBY RESTAURANTS
               ============================================= */

            nearbyRestaurants:

                findNearbyRestaurants(
                    place,
                    restaurants
                )

                .map(
                    rest => ({

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

                    })
                )

        })
    );
}


/* =========================================================
   MAIN ALGORITHM

   ใช้ในระบบเดิม

   DEFAULT:
   Balanced TDMC

   α = 0.6
   β = 0.2
   γ = 0.2
   ========================================================= */

export function rankPlaces(
    attractions: any[],
    restaurants: any[],
    trip: TripPlanInput,
    options?: {

        limit?: number;

        weights?: TDMCWeights;

        candidateMultiplier?: number;

    }
) {

    console.log(
        "\n=========================================="
    );

    console.log(
        "🧠 TDMC ALGORITHM"
    );

    console.log(
        "=========================================="
    );


    /* =============================================
       TRIP INPUT
       ============================================= */

    console.log(
        "📍 Province:",
        trip.province
    );

    console.log(
        "👥 Companion:",
        trip.companion
    );

    console.log(
        "💰 Budget:",
        trip.budget
    );

    console.log(
        "🏔️ Travel Type:",
        trip.travelType
    );

    console.log(
        "🎯 Activities:",
        trip.activities
    );

    console.log(
        "🌤️ Atmosphere:",
        trip.atmosphere
    );


    /* =============================================
       DEFAULT WEIGHTS

       Balanced TDMC
       ============================================= */

    const weights =
        normalizeWeights(
            options?.weights ?? {

                alpha: 0.2,

                beta: 0.3,

                gamma: 0.5

            }
        );


    console.log(
        "\n⚖️ TDMC WEIGHTS"
    );

    console.table({
        alpha: weights.alpha,
        beta: weights.beta,
        gamma: weights.gamma
    });


    /* =============================================
       RUN TDMC
       ============================================= */

    const tdmcResult: TDMCResult =
        rankPlacesTDMC(

            attractions as TDMCPlace[],

            trip,

            {

                limit:
                    options?.limit ?? 10,

                weights,

                candidateMultiplier:
                    options?.candidateMultiplier ?? 3

            }

        );


    /* =============================================
       LOG RESULT
       ============================================= */

    console.log(
        "\n=========================================="
    );

    console.log(
        "📊 TDMC RESULT"
    );

    console.log(
        "=========================================="
    );


    console.log(
        "Total Attractions:",
        attractions.length
    );

    console.log(
        "Recommended:",
        tdmcResult.recommendations.length
    );

    console.log(
        "Average TDMC Score:",
        tdmcResult.averageScore
    );

    console.log(
        "Average Rating:",
        tdmcResult.averageRating
    );

    console.log(
        "Average Popularity:",
        tdmcResult.averagePopularity
    );

    console.log(
        "Average Distance:",
        tdmcResult.averageDistance
    );

    console.log(
        "Topic Diversity:",
        tdmcResult.diversity
    );

    console.log(
        "Runtime:",
        `${tdmcResult.runtime.toFixed(2)} ms`
    );


    /* =============================================
       TABLE FOR EXPERIMENT / DEBUG
       ============================================= */

    console.table(

        tdmcResult.recommendations.map(
            (
                place,
                index
            ) => ({

                rank:
                    index + 1,

                attraction:
                    place.name_th ??
                    place.name ??
                    "Unknown",

                tdmcScore:
                    Number(
                        place.tdmcScore
                    ).toFixed(4),

                accuracy:
                    Number(
                        place.accuracyScore
                    ).toFixed(4),

                popularity:
                    Number(
                        place.popularityScore
                    ).toFixed(4),

                distance:
                    Number(
                        place.distanceScore
                    ).toFixed(4),

                topicSimilarity:
                    Number(
                        place.topicSimilarity
                    ).toFixed(4),

                topicDiversity:
                    Number(
                        place.topicDiversity
                    ).toFixed(4),

                distanceKm:
                    Number(
                        place.distanceKm
                    ).toFixed(2)

            })
        )

    );


    /* =============================================
       RETURN FORMAT

       คง Format เดิม
       เพื่อไม่ให้ Planner พัง
       ============================================= */

    return formatRankedPlaces(
        tdmcResult.recommendations,
        restaurants
    );
}


/* =========================================================
   EXPERIMENT VERSION

   สำหรับใช้ในการทดลอง
   ========================================================= */

export function rankPlacesWithTDMCResult(
    attractions: any[],
    trip: TripPlanInput,
    options?: {

        limit?: number;

        weights?: TDMCWeights;

        candidateMultiplier?: number;

    }
): TDMCResult {

    return rankPlacesTDMC(

        attractions as TDMCPlace[],

        trip,

        {

            limit:
                options?.limit ?? 10,

            weights:
                options?.weights,

            candidateMultiplier:
                options?.candidateMultiplier ?? 3

        }

    );
}


/* =========================================================
   HELPER

   Run TDMC ด้วย Weight ที่กำหนด
   ========================================================= */

export function rankPlacesWithWeights(
    attractions: any[],
    restaurants: any[],
    trip: TripPlanInput,

    alpha: number,

    beta: number,

    gamma: number
) {

    return rankPlaces(
        attractions,
        restaurants,
        trip,
        {
            limit: 10,

            weights: {
                alpha,
                beta,
                gamma
            }
        }
    );
}

