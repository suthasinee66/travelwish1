/*
 * ============================================================
 * Research 1
 * Aspect Personalization Recommendation
 * ============================================================
 *
 * Final Score:
 *
 * S(u,p)
 * =
 * α × r_hat(u,p) × p-Div
 * +
 * β × Pop(p) × p-Pop
 * +
 * γ × Dis(u,p) × p-Dis
 *
 * โดย
 *
 * r_hat(u,p)
 *     = Predicted Rating
 *
 * p-Div
 *     = Personalized Diversity
 *
 * p-Pop
 *     = Personalized Popularity
 *
 * p-Dis
 *     = Personalized Distance
 *
 * Pop และ Dis ถูก Normalize ให้อยู่ในช่วง 0–5
 *
 * ============================================================
 */

import type {
    UserHistoryItem,
    AttractionForRecommendation,
    CategoryPreferenceVector,
    AspectScore,
} from "./types";


/*
 * ============================================================
 * Constants
 * ============================================================
 */

const EARTH_RADIUS_KM = 6371;

const DEFAULT_TOP_K = 15;

const DEFAULT_ALPHA = 1;

const DEFAULT_BETA = 1;

const DEFAULT_GAMMA = 1;

const DEFAULT_TIME_DECAY = 0.01;


/*
 * ============================================================
 * Haversine Distance
 * ============================================================
 *
 * คำนวณระยะทางระหว่าง 2 จุดบนโลก
 *
 * return:
 *      distance หน่วย km
 *
 * ถ้าพิกัดไม่ถูกต้อง
 *      return Infinity
 *
 * ============================================================
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
        return Infinity;
    }


    const dLat =
        (lat2 - lat1) *
        Math.PI /
        180;


    const dLon =
        (lon2 - lon1) *
        Math.PI /
        180;


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)

        +

        Math.cos(
            lat1 *
            Math.PI /
            180
        )

        *

        Math.cos(
            lat2 *
            Math.PI /
            180
        )

        *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    return (
        EARTH_RADIUS_KM *

        2 *

        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        )
    );
}


/*
 * ============================================================
 * Clamp
 * ============================================================
 *
 * จำกัดค่าให้อยู่ระหว่าง min และ max
 *
 * ============================================================
 */

export function clamp(
    value: number,
    min: number,
    max: number
): number {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}


/*
 * ============================================================
 * Normalize 0–1
 * ============================================================
 */

export function normalize01(
    value: number,
    min: number,
    max: number
): number {

    if (
        !Number.isFinite(value)
    ) {
        return 0;
    }


    if (
        max <= min
    ) {
        return 0;
    }


    return clamp(
        (
            value - min
        ) /
        (
            max - min
        ),
        0,
        1
    );
}


/*
 * ============================================================
 * Normalize Popularity
 * ============================================================
 *
 * สมมติว่า popularity ใน database อยู่ในช่วง 0–1
 *
 * 0.00 → 0
 * 0.50 → 2.5
 * 1.00 → 5
 *
 * ถ้า database ของคุณเป็น scale อื่น
 * ให้แก้ function นี้เพียงจุดเดียว
 *
 * ============================================================
 */

export function normalizePopularity(
    popularity: number
): number {

    if (
        !Number.isFinite(popularity)
    ) {
        return 0;
    }


    return (
        clamp(
            popularity,
            0,
            1
        )
        *
        5
    );
}


/*
 * ============================================================
 * Normalize Distance
 * ============================================================
 *
 * Distance ยิ่งน้อย → คะแนนยิ่งสูง
 *
 * เช่น
 *
 * 0 km
 *     → 5
 *
 * maxDistance
 *     → 0
 *
 * ============================================================
 */

export function normalizeDistance(
    distance: number,
    maxDistance: number
): number {

    if (
        !Number.isFinite(distance)
    ) {
        return 0;
    }


    if (
        !Number.isFinite(maxDistance) ||
        maxDistance <= 0
    ) {
        return 5;
    }


    const normalized =
        1 -
        (
            distance /
            maxDistance
        );


    return (
        clamp(
            normalized,
            0,
            1
        )
        *
        5
    );
}


/*
 * ============================================================
 * Time Weight
 * ============================================================
 *
 * History ที่เกิดขึ้นใหม่
 * จะมีน้ำหนักมากกว่า history เก่า
 *
 * Formula:
 *
 * t = exp(-λ × days)
 *
 * ============================================================
 */

export function calculateTimeWeight(
    visitDate: string,
    decay = DEFAULT_TIME_DECAY
): number {

    const visitTimestamp =
        new Date(
            visitDate
        ).getTime();


    if (
        !Number.isFinite(
            visitTimestamp
        )
    ) {
        return 0;
    }


    const now =
        Date.now();


    const days =
        Math.max(
            0,
            (
                now -
                visitTimestamp
            )
            /
            (
                1000 *
                60 *
                60 *
                24
            )
        );


    return Math.exp(
        -decay *
        days
    );
}


/*
 * ============================================================
 * Build Attraction Map
 * ============================================================
 */

export function buildAttractionMap(
    attractions: AttractionForRecommendation[]
) {

    return new Map<
        string | number,
        AttractionForRecommendation
    >(
        attractions.map(
            place => [
                place.att_id,
                place
            ]
        )
    );
}


/*
 * ============================================================
 * Calculate User Average Popularity
 * ============================================================
 *
 * ดูสถานที่ที่ User เคยไป
 * แล้วคำนวณ popularity แบบถ่วงน้ำหนักเวลา
 *
 * ผลลัพธ์อยู่ในช่วง 0–1
 *
 * ============================================================
 */

export function calculateUserPopularityPreference(
    history: UserHistoryItem[],
    attractionMap: Map<
        string | number,
        AttractionForRecommendation
    >
): number {

    if (
        history.length === 0
    ) {
        return 0;
    }


    let weightedPopularity = 0;

    let totalWeight = 0;


    for (
        const item
        of history
    ) {

        const place =
            attractionMap.get(
                item.att_id
            );


        if (!place) {
            continue;
        }


        const popularity =
            Number(
                place.popularity
            );


        if (
            !Number.isFinite(
                popularity
            )
        ) {
            continue;
        }


        const weight =
            calculateTimeWeight(
                item.visit_date
            );


        weightedPopularity +=
            popularity *
            weight;


        totalWeight +=
            weight;
    }


    if (
        totalWeight === 0
    ) {
        return 0;
    }


    return (
        weightedPopularity /
        totalWeight
    );
}


/*
 * ============================================================
 * Calculate p-Pop
 * ============================================================
 *
 * แนวคิด:
 *
 * User แต่ละคนมีความชอบต่อระดับ popularity แตกต่างกัน
 *
 * userPopularityPreference
 *     ↓
 * เปรียบเทียบกับ popularity ของ POI
 *
 * ยิ่งใกล้กัน
 *     → p-Pop สูง
 *
 * ============================================================
 *
 * หมายเหตุ:
 * สูตรย่อย p-Pop ที่ paper ระบุในข้อเสนอโครงการ
 * ยังไม่ได้ให้สมการละเอียด
 *
 * ดังนั้น function นี้แยกไว้เพื่อให้เปลี่ยนสูตร
 * ตาม paper ตัวจริงได้โดยไม่ต้องแก้ส่วนอื่น
 *
 * ============================================================
 */

export function calculatePPop(
    placePopularity: number,
    userPopularityPreference: number
): number {

    if (
        !Number.isFinite(
            placePopularity
        )
    ) {
        return 0;
    }


    if (
        !Number.isFinite(
            userPopularityPreference
        )
    ) {
        return 0;
    }


    const difference =
        Math.abs(
            placePopularity -
            userPopularityPreference
        );


    /*
     * difference:
     *
     * 0 → เหมือน preference มากที่สุด
     * 1 → แตกต่างมากที่สุด
     *
     * แปลงเป็น 0–1
     */

    return clamp(
        1 -
        difference,
        0,
        1
    );
}


/*
 * ============================================================
 * Calculate User Distance Preference
 * ============================================================
 *
 * หา average distance ที่ User เคยเดินทาง
 *
 * ใช้ visit history + latitude/longitude
 *
 * ============================================================
 */

export function calculateUserDistancePreference(
    history: UserHistoryItem[],
    attractionMap: Map<
        string | number,
        AttractionForRecommendation
    >,
    userLat: number,
    userLon: number
): number {

    if (
        history.length === 0
    ) {
        return 0;
    }


    if (
        !Number.isFinite(userLat) ||
        !Number.isFinite(userLon)
    ) {
        return 0;
    }


    let weightedDistance = 0;

    let totalWeight = 0;


    for (
        const item
        of history
    ) {

        const place =
            attractionMap.get(
                item.att_id
            );


        if (!place) {
            continue;
        }


        const latitude =
            Number(
                place.latitude
            );


        const longitude =
            Number(
                place.longitude
            );


        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {
            continue;
        }


        const distance =
            distanceKm(
                userLat,
                userLon,
                latitude,
                longitude
            );


        if (
            !Number.isFinite(
                distance
            )
        ) {
            continue;
        }


        const weight =
            calculateTimeWeight(
                item.visit_date
            );


        weightedDistance +=
            distance *
            weight;


        totalWeight +=
            weight;
    }


    if (
        totalWeight === 0
    ) {
        return 0;
    }


    return (
        weightedDistance /
        totalWeight
    );
}


/*
 * ============================================================
 * Calculate p-Dis
 * ============================================================
 *
 * เปรียบเทียบ distance ของ POI
 * กับ distance tolerance ของ User
 *
 * User เคยเดินทางประมาณ 10 km
 *
 * POI ใหม่:
 *
 * 9 km
 *     → p-Dis สูง
 *
 * 40 km
 *     → p-Dis ต่ำ
 *
 * ============================================================
 *
 * return 0–1
 *
 * ============================================================
 */

export function calculatePDis(
    placeDistance: number,
    userDistancePreference: number
): number {

    if (
        !Number.isFinite(
            placeDistance
        )
    ) {
        return 0;
    }


    if (
        !Number.isFinite(
            userDistancePreference
        ) ||
        userDistancePreference <= 0
    ) {
        /*
         * ถ้าไม่มี history
         * ยังไม่สามารถเรียนรู้ distance tolerance
         */

        return 0;
    }


    const difference =
        Math.abs(
            placeDistance -
            userDistancePreference
        );


    /*
     * ยิ่งใกล้กับ distance
     * ที่ User เคยยอมรับ
     * → p-Dis สูง
     */

    return clamp(
        Math.exp(
            -difference /
            userDistancePreference
        ),
        0,
        1
    );
}


/*
 * ============================================================
 * Calculate p-Div
 * ============================================================
 *
 * categoryPreference มาจาก
 * User Category Vector
 *
 * ในขั้นสุดท้ายควรมาจาก Autoencoder
 *
 * ตัวอย่าง:
 *
 * {
 *     "ธรรมชาติ": 0.90,
 *     "ภูเขา": 0.80,
 *     "ทะเล": 0.30
 * }
 *
 * ถ้า POI มี:
 *
 * ["ธรรมชาติ", "ภูเขา"]
 *
 * p-Div จะสูง
 *
 * ============================================================
 */

export function calculatePDiv(
    place: AttractionForRecommendation,
    categoryPreference:
        CategoryPreferenceVector
): number {

    const categories =
        Array.isArray(
            place.travel_type
        )
            ? place.travel_type
            : [];


    if (
        categories.length === 0
    ) {
        return 0;
    }


    const values =
        categories.map(
            category => {

                const value =
                    Number(
                        categoryPreference[
                            category
                        ]
                    );


                if (
                    !Number.isFinite(
                        value
                    )
                ) {
                    return 0;
                }


                return clamp(
                    value,
                    0,
                    1
                );
            }
        );


    const average =
        values.reduce(
            (
                sum,
                value
            ) =>
                sum +
                value,
            0
        )
        /
        values.length;


    return clamp(
        average,
        0,
        1
    );
}


/*
 * ============================================================
 * Predicted Rating
 * ============================================================
 *
 * IMPORTANT
 *
 * Function นี้ออกแบบให้รับค่าที่ได้จาก
 * Autoencoder โดยตรง
 *
 * predictedRatingByAttraction:
 *
 * Map<att_id, predictedRating>
 *
 * เช่น:
 *
 * 101 → 4.72
 * 102 → 3.81
 * 103 → 4.91
 *
 * ============================================================
 */

export function getPredictedRating(
    placeId: string | number,
    predictedRatingByAttraction:
        Map<
            string | number,
            number
        >
): number {

    const rating =
        predictedRatingByAttraction.get(
            placeId
        );


    if (
        rating == null ||
        !Number.isFinite(rating)
    ) {
        return 0;
    }


    /*
     * Rating ของงานวิจัย
     * สมมติเป็น 0–5
     */

    return clamp(
        rating,
        0,
        5
    );
}


/*
 * ============================================================
 * Calculate Final Score
 * ============================================================
 *
 * Formula:
 *
 * S(u,p)
 *
 * =
 *
 * α × r_hat × p-Div
 *
 * +
 *
 * β × Pop × p-Pop
 *
 * +
 *
 * γ × Dis × p-Dis
 *
 * ============================================================
 */

export function calculateFinalScore(
    predictedRating: number,

    pDiv: number,

    popularityNormalized: number,

    pPop: number,

    distanceNormalized: number,

    pDis: number,

    alpha = DEFAULT_ALPHA,

    beta = DEFAULT_BETA,

    gamma = DEFAULT_GAMMA
): number {

    const rating =
        clamp(
            predictedRating,
            0,
            5
        );


    const diversity =
        clamp(
            pDiv,
            0,
            1
        );


    const popularity =
        clamp(
            popularityNormalized,
            0,
            5
        );


    const popularityPreference =
        clamp(
            pPop,
            0,
            1
        );


    const distance =
        clamp(
            distanceNormalized,
            0,
            5
        );


    const distancePreference =
        clamp(
            pDis,
            0,
            1
        );


    return (

        alpha *
        rating *
        diversity

    )

    +

    (

        beta *
        popularity *
        popularityPreference

    )

    +

    (

        gamma *
        distance *
        distancePreference

    );
}


/*
 * ============================================================
 * Main Algorithm
 * ============================================================
 *
 * rankAspectPersonalization()
 *
 * INPUT:
 *
 * attractions
 * history
 * user latitude
 * user longitude
 * predicted ratings
 * category preferences
 *
 * OUTPUT:
 *
 * Top-K recommendations
 *
 * พร้อม metric ทุกตัว
 *
 * ============================================================
 */

export interface RankAspectPersonalizationOptions {

    alpha?: number;

    beta?: number;

    gamma?: number;

    topK?: number;

    timeDecay?: number;
}


export interface AspectRecommendationResult {

    attraction: {

        id: string | number;

        name_th: string;

        latitude:
            number | null;

        longitude:
            number | null;
    };


    metrics: {

        predictedRating: number;

        pDiv: number;

        popularityRaw: number;

        popularityNormalized: number;

        userPopularityPreference: number;

        pPop: number;

        distanceRaw: number;

        distanceNormalized: number;

        userDistancePreference: number;

        pDis: number;

        finalScore: number;
    };
}


export function rankAspectPersonalization(
    attractions:
        AttractionForRecommendation[],

    history:
        UserHistoryItem[],

    userLat: number,

    userLon: number,

    predictedRatingByAttraction:
        Map<
            string | number,
            number
        >,

    categoryPreference:
        CategoryPreferenceVector,

    options:
        RankAspectPersonalizationOptions = {}
): AspectRecommendationResult[] {


    /*
     * ========================================================
     * Options
     * ========================================================
     */

    const alpha =
        options.alpha ??
        DEFAULT_ALPHA;


    const beta =
        options.beta ??
        DEFAULT_BETA;


    const gamma =
        options.gamma ??
        DEFAULT_GAMMA;


    const topK =
        options.topK ??
        DEFAULT_TOP_K;


    /*
     * ========================================================
     * Attraction Map
     * ========================================================
     */

    const attractionMap =
        buildAttractionMap(
            attractions
        );


    /*
     * ========================================================
     * User Personalized Popularity
     * ========================================================
     */

    const userPopularityPreference =
        calculateUserPopularityPreference(
            history,
            attractionMap
        );


    /*
     * ========================================================
     * User Personalized Distance
     * ========================================================
     */

    const userDistancePreference =
        calculateUserDistancePreference(
            history,
            attractionMap,
            userLat,
            userLon
        );


    /*
     * ========================================================
     * Calculate Maximum Distance
     *
     * ใช้สำหรับ Normalize distance
     * ให้อยู่ในช่วง 0–5
     * ========================================================
     */

    const distances =
        attractions
            .map(
                place =>
                    distanceKm(
                        userLat,
                        userLon,
                        Number(
                            place.latitude
                        ),
                        Number(
                            place.longitude
                        )
                    )
            )
            .filter(
                distance =>
                    Number.isFinite(
                        distance
                    )
            );


    const maxDistance =
        distances.length > 0
            ? Math.max(
                ...distances
            )
            : 0;


    /*
     * ========================================================
     * Score Every Attraction
     * ========================================================
     */

    const scored =
        attractions.map(
            place => {

                /*
                 * ------------------------------------------------
                 * Distance
                 * ------------------------------------------------
                 */

                const distance =
                    distanceKm(
                        userLat,
                        userLon,
                        Number(
                            place.latitude
                        ),
                        Number(
                            place.longitude
                        )
                    );


                /*
                 * ------------------------------------------------
                 * Predicted Rating
                 * ------------------------------------------------
                 */

                const predictedRating =
                    getPredictedRating(
                        place.att_id,
                        predictedRatingByAttraction
                    );


                /*
                 * ------------------------------------------------
                 * Personalized Diversity
                 * ------------------------------------------------
                 */

                const pDiv =
                    calculatePDiv(
                        place,
                        categoryPreference
                    );


                /*
                 * ------------------------------------------------
                 * Popularity
                 * ------------------------------------------------
                 */

                const popularity =
                    Number(
                        place.popularity
                    );


                const popularityRaw =
                    Number.isFinite(
                        popularity
                    )
                        ? popularity
                        : 0;


                const popularityNormalized =
                    normalizePopularity(
                        popularityRaw
                    );


                /*
                 * ------------------------------------------------
                 * Personalized Popularity
                 * ------------------------------------------------
                 */

                const pPop =
                    calculatePPop(
                        popularityRaw,
                        userPopularityPreference
                    );


                /*
                 * ------------------------------------------------
                 * Distance Normalize
                 * ------------------------------------------------
                 */

                const distanceNormalized =
                    normalizeDistance(
                        distance,
                        maxDistance
                    );


                /*
                 * ------------------------------------------------
                 * Personalized Distance
                 * ------------------------------------------------
                 */

                const pDis =
                    calculatePDis(
                        distance,
                        userDistancePreference
                    );


                /*
                 * ------------------------------------------------
                 * Final Score
                 * ------------------------------------------------
                 */

                const finalScore =
                    calculateFinalScore(

                        predictedRating,

                        pDiv,

                        popularityNormalized,

                        pPop,

                        distanceNormalized,

                        pDis,

                        alpha,

                        beta,

                        gamma
                    );


                /*
                 * ------------------------------------------------
                 * Return All Metrics
                 * ------------------------------------------------
                 */

                return {

                    attraction: {

                        id:
                            place.att_id,

                        name_th:
                            place.name_th,

                        latitude:
                            place.latitude,

                        longitude:
                            place.longitude
                    },


                    metrics: {

                        predictedRating,

                        pDiv,

                        popularityRaw,

                        popularityNormalized,

                        userPopularityPreference,

                        pPop,

                        distanceRaw:
                            distance,

                        distanceNormalized,

                        userDistancePreference,

                        pDis,

                        finalScore
                    }
                };
            }
        );


    /*
     * ========================================================
     * Sort
     * ========================================================
     */

    scored.sort(
        (
            a,
            b
        ) =>
            b.metrics.finalScore -
            a.metrics.finalScore
    );


    /*
     * ========================================================
     * Top-K
     * ========================================================
     */

    return scored.slice(
        0,
        topK
    );
}


/*
 * ============================================================
 * Utility:
 * Build Category Preference Vector
 * ============================================================
 *
 * ใช้เป็น baseline / fallback
 *
 * IMPORTANT:
 *
 * งานวิจัยตัวจริงควรแทนที่ vector นี้ด้วย
 * output จาก Autoencoder
 *
 * Function นี้ไม่ได้ทำ Autoencoder
 *
 * ============================================================
 */

export function buildCategoryPreferenceFromHistory(
    history: UserHistoryItem[],
    attractionMap: Map<
        string | number,
        AttractionForRecommendation
    >
): CategoryPreferenceVector {

    const categoryScores:
        Record<
            string,
            {
                score: number;
                weight: number;
            }
        >
        = {};


    for (
        const item
        of history
    ) {

        const place =
            attractionMap.get(
                item.att_id
            );


        if (!place) {
            continue;
        }


        const categories =
            Array.isArray(
                place.travel_type
            )
                ? place.travel_type
                : [];


        if (
            categories.length === 0
        ) {
            continue;
        }


        const timeWeight =
            calculateTimeWeight(
                item.visit_date
            );


        /*
         * ถ้ามี rating
         * ใช้ rating เป็นตัวช่วย
         *
         * 5 → 1
         * 4 → 0.8
         * 3 → 0.6
         * ...
         */

        const ratingWeight =
            item.rating != null
                ? clamp(
                    Number(
                        item.rating
                    ) / 5,
                    0,
                    1
                )
                : 1;


        const weight =
            timeWeight *
            ratingWeight;


        for (
            const category
            of categories
        ) {

            if (
                !categoryScores[
                    category
                ]
            ) {

                categoryScores[
                    category
                ] = {

                    score: 0,

                    weight: 0
                };
            }


            categoryScores[
                category
            ].score +=
                weight;


            categoryScores[
                category
            ].weight +=
                timeWeight;
        }
    }


    const result:
        CategoryPreferenceVector
        = {};


    for (
        const category
        of Object.keys(
            categoryScores
        )
    ) {

        const data =
            categoryScores[
                category
            ];


        if (
            data.weight <= 0
        ) {
            result[
                category
            ] = 0;

            continue;
        }


        result[
            category
        ] =
            clamp(
                data.score /
                data.weight,
                0,
                1
            );
    }


    return result;
}