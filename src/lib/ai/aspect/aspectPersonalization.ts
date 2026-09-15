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
} from "./types_aspect.ts";
import { supabase } from "@/lib/supabase";


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
    history: UserHistoryItem[] = [],
    attractionMap: Map<
        string | number,
        AttractionForRecommendation
    > = new Map()
): number {

    if (history.length === 0) {
        return 0;
    }

    let weightedPopularity = 0;
    let totalWeight = 0;

    for (const item of history) {

        const place =
            attractionMap.get(item.att_id);

        if (!place) {
            continue;
        }

        const popularity =
            Number(place.popularity);

        if (!Number.isFinite(popularity)) {
            continue;
        }

        const weight =
            calculateTimeWeight(item.visit_date);

        weightedPopularity +=
            popularity * weight;

        totalWeight += weight;
    }

    if (totalWeight === 0) {
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
    userPopularityPreference: number,
    hasHistory = true
): number {

    if (
        !Number.isFinite(placePopularity)
    ) {
        return 0;
    }

    /*
     * ไม่มีประวัติ User
     *
     * ยังไม่สามารถรู้ได้ว่า
     * User ชอบสถานที่ดังหรือไม่ดัง
     *
     * จึงไม่ควร bias ไปทางใดทางหนึ่ง
     */

    if (!hasHistory) {
        return 1;
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

    return clamp(
        1 - difference,
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
    history: UserHistoryItem[] = [],
    attractionMap: Map<
        string | number,
        AttractionForRecommendation
    > = new Map(),
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

export async function rankAspectPersonalization(

    attractions: AttractionForRecommendation[],

    history: UserHistoryItem[] = [],

    userLat: number,

    userLon: number,

    predictedRatingByAttraction:
        Map<string | number, number> = new Map(),

    categoryPreference:
        CategoryPreferenceVector = {},

    options:
        RankAspectPersonalizationOptions = {}

): Promise<AspectRecommendationResult[]> {


    // ============================================================
    // 1. LOAD USER
    // ============================================================

    const {
        data: userData,
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !userData.user) {

        console.error(
            "❌ GET USER ERROR:",
            userError
        );

        return [];

    }

    const userId = userData.user.id;

// ============================================================
// LOAD ALL ATTRACTIONS
// ============================================================

let dbAttractions: any[] = [];

const pageSize = 1000;
let from = 0;

while (true) {

    const {
        data,
        error
    } = await supabase
        .from("attraction")
        .select(`
            att_id,
            name_th,
            latitude,
            longitude,
            travel_type,
            popularity
        `)
        .range(
            from,
            from + pageSize - 1
        );

    if (error) {

        console.error(
            "❌ ATTRACTION ERROR:",
            error
        );

        break;
    }

    if (
        !data ||
        data.length === 0
    ) {

        break;
    }

    dbAttractions = [
        ...dbAttractions,
        ...data
    ];

    console.log(
        `📥 LOAD ATTRACTION: ${from} - ${from + data.length - 1}`
    );

    // ถ้าจำนวนน้อยกว่า 1000
    // แปลว่าหน้าสุดท้ายแล้ว
    if (
        data.length < pageSize
    ) {

        break;
    }

    from += pageSize;
}


console.log(
    "🔥 TOTAL ATTRACTIONS FROM DB:",
    dbAttractions.length
);

    // เอาข้อมูลจาก DB มาใช้เป็นหลัก
    attractions =
        (dbAttractions || []).map(
            place => ({

                att_id:
                    place.att_id,

                name_th:
                    place.name_th,

                latitude:
                    place.latitude != null
                        ? Number(place.latitude)
                        : null,

                longitude:
                    place.longitude != null
                        ? Number(place.longitude)
                        : null,

                travel_type:
                    Array.isArray(place.travel_type)
                        ? place.travel_type
                        : [],

                popularity:
                    place.popularity != null
                        ? Number(place.popularity)
                        : null

            })
        );


    console.log(
        "🔥 ATTRACTIONS FROM DB:",
        attractions.length
    );

    console.log(
        "📦 FIRST ATTRACTION:",
        attractions[0]
    );


    // ============================================================
    // 3. LOAD USER HISTORY
    // ============================================================

    const {
        data: dbHistory,
        error: historyError
    } = await supabase
        .from("user_attraction_history")
        .select(`
            id,
            profile_id,
            att_id,
            rating,
            visit_date,
            created_at
        `)
        .eq(
            "profile_id",
            userId
        )
        .order(
            "visit_date",
            {
                ascending: false
            }
        );


    if (historyError) {

        console.error(
            "❌ HISTORY ERROR:",
            historyError
        );

        history = [];

    } else {

        history =
            (dbHistory || []) as UserHistoryItem[];

    }


    console.log(
        "🔥 HISTORY FROM DB:",
        history
    );

    console.log(
        "🔥 HISTORY COUNT:",
        history.length
    );


    // ============================================================
    // 4. HISTORY → ATTRACTION MATCH
    // ============================================================

    const attractionIds =
        new Set(
            attractions.map(
                place =>
                    String(place.att_id)
            )
        );


    let matchedHistory = 0;
    let unmatchedHistory = 0;


    for (
        const item of history
    ) {

        if (
            attractionIds.has(
                String(item.att_id)
            )
        ) {

            matchedHistory++;

        } else {

            unmatchedHistory++;
        }
    }


    console.log(
        "🔗 HISTORY → ATTRACTION"
    );

    console.log(
        "   matched:",
        matchedHistory
    );

    console.log(
        "   unmatched:",
        unmatchedHistory
    );


    // ============================================================
    // 5. BUILD ATTRACTION MAP
    // ============================================================

    const attractionMap =
        buildAttractionMap(
            attractions
        );


    // ============================================================
    // 6. BUILD CATEGORY PREFERENCE
    // ============================================================

    /*
     * ถ้าไม่ได้ส่ง categoryPreference มา
     * ให้สร้างจาก history อัตโนมัติ
     */

    if (
        !categoryPreference ||
        Object.keys(categoryPreference).length === 0
    ) {

        categoryPreference =
            buildCategoryPreferenceFromHistory(
                history,
                attractionMap
            );

        console.log(
            "🗂️ CATEGORY PREFERENCE FROM HISTORY:",
            categoryPreference
        );
    }


    // ============================================================
    // 7. OPTIONS
    // ============================================================

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


    // ============================================================
    // 8. USER POPULARITY PREFERENCE
    // ============================================================

    const userPopularityPreference =
        calculateUserPopularityPreference(
            history,
            attractionMap
        );


    console.log(
        "⭐ USER POPULARITY PREFERENCE:",
        userPopularityPreference
    );


    // ============================================================
    // 9. USER DISTANCE PREFERENCE
    // ============================================================

    const userDistancePreference =
        calculateUserDistancePreference(
            history,
            attractionMap,
            userLat,
            userLon
        );


    console.log(
        "📍 USER DISTANCE PREFERENCE:",
        userDistancePreference
    );


    // ============================================================
    // 10. MAX DISTANCE
    // ============================================================

    const distances =
        attractions
            .map(
                place =>
                    distanceKm(
                        userLat,
                        userLon,
                        Number(place.latitude),
                        Number(place.longitude)
                    )
            )
            .filter(
                distance =>
                    Number.isFinite(distance)
            );


    const maxDistance =
        distances.length > 0
            ? Math.max(...distances)
            : 0;


    // ============================================================
    // 11. SCORE ALL ATTRACTIONS
    // ============================================================

    const scored =
        attractions.map(
            place => {

                const distance =
                    distanceKm(
                        userLat,
                        userLon,
                        Number(place.latitude),
                        Number(place.longitude)
                    );


                const predictedRating =
                    getPredictedRating(
                        place.att_id,
                        predictedRatingByAttraction
                    );


                const pDiv =
                    calculatePDiv(
                        place,
                        categoryPreference
                    );


                const popularityRaw =
                    Number.isFinite(
                        Number(place.popularity)
                    )
                        ? Number(place.popularity)
                        : 0;


                const popularityNormalized =
                    normalizePopularity(
                        popularityRaw
                    );


                const pPop =
                    calculatePPop(
                        popularityRaw,
                        userPopularityPreference,
                        history.length > 0
                    );


                const distanceNormalized =
                    normalizeDistance(
                        distance,
                        maxDistance
                    );


                const pDis =
                    calculatePDis(
                        distance,
                        userDistancePreference
                    );


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


    // ============================================================
    // 12. SORT
    // ============================================================

    scored.sort(
        (a, b) =>
            b.metrics.finalScore -
            a.metrics.finalScore
    );


    // ============================================================
    // 13. TOP K
    // ============================================================

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
    history: UserHistoryItem[] = [],
    attractionMap: Map<
        string | number,
        AttractionForRecommendation
    >
): CategoryPreferenceVector {
     history = history ?? [];

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

/*
 * ============================================================
 * Research 1 - Input Validation Log
 * ============================================================
 */

function logResearch1InputStatus(
    attractions: AttractionForRecommendation[],
    history: UserHistoryItem[],
    userLat: number,
    userLon: number,
    predictedRatingByAttraction:
        Map<string | number, number>,
    categoryPreference:
        CategoryPreferenceVector
) {

    console.log("");
    console.log("======================================================");
    console.log("🔎 RESEARCH 1 - INPUT DATA CHECK");
    console.log("======================================================");

    /*
     * --------------------------------------------------------
     * 1. Attractions
     * --------------------------------------------------------
     */

    console.log("");
    console.log("📍 1. ATTRACTIONS");

    if (!Array.isArray(attractions)) {

        console.error(
            "❌ attractions ไม่มีข้อมูล / ไม่ใช่ Array"
        );

    } else if (attractions.length === 0) {

        console.warn(
            "⚠️ attractions เป็น Array ว่าง"
        );

    } else {

        console.log(
            `✅ attractions มี ${attractions.length} รายการ`
        );

        let missingId = 0;
        let missingName = 0;
        let missingLat = 0;
        let missingLon = 0;
        let missingCategory = 0;
        let missingPopularity = 0;

        for (const place of attractions) {

            if (
                place.att_id == null ||
                place.att_id === ""
            ) {
                missingId++;
            }

            if (
                !place.name_th
            ) {
                missingName++;
            }

            if (
                place.latitude == null ||
                !Number.isFinite(
                    Number(place.latitude)
                )
            ) {
                missingLat++;
            }

            if (
                place.longitude == null ||
                !Number.isFinite(
                    Number(place.longitude)
                )
            ) {
                missingLon++;
            }

            if (
                !Array.isArray(
                    place.travel_type
                ) ||
                place.travel_type.length === 0
            ) {
                missingCategory++;
            }

            if (
                place.popularity == null ||
                !Number.isFinite(
                    Number(place.popularity)
                )
            ) {
                missingPopularity++;
            }
        }

        console.log(
            missingId === 0
                ? "   ✅ att_id ครบ"
                : `   ❌ att_id หาย ${missingId} รายการ`
        );

        console.log(
            missingName === 0
                ? "   ✅ name_th ครบ"
                : `   ❌ name_th หาย ${missingName} รายการ`
        );

        console.log(
            missingLat === 0
                ? "   ✅ latitude ครบ"
                : `   ❌ latitude หาย/ผิด ${missingLat} รายการ`
        );

        console.log(
            missingLon === 0
                ? "   ✅ longitude ครบ"
                : `   ❌ longitude หาย/ผิด ${missingLon} รายการ`
        );

        console.log(
            missingCategory === 0
                ? "   ✅ travel_type ครบ"
                : `   ❌ travel_type หาย ${missingCategory} รายการ`
        );

        console.log(
            missingPopularity === 0
                ? "   ✅ popularity ครบ"
                : `   ❌ popularity หาย/ผิด ${missingPopularity} รายการ`
        );

        console.log(
            "   📦 ตัวอย่าง Attraction:",
            attractions[0]
        );
    }


    /*
     * --------------------------------------------------------
     * 2. User History
     * --------------------------------------------------------
     */

    console.log("");
    console.log("👤 2. USER HISTORY");

    if (!Array.isArray(history)) {

        console.error(
            "❌ history ไม่มีข้อมูล / ไม่ใช่ Array"
        );

    } else if (history.length === 0) {

        console.warn(
            "⚠️ history ว่าง"
        );

        console.warn(
            "   → ยังไม่มี visited attractions"
        );

        console.warn(
            "   → ยังไม่มี rating history"
        );

        console.warn(
            "   → userPopularityPreference จะคำนวณไม่ได้"
        );

        console.warn(
            "   → userDistancePreference จะคำนวณไม่ได้"
        );

    } else {

        console.log(
            `✅ history มี ${history.length} รายการ`
        );

        let missingAttId = 0;
        let missingRating = 0;
        let missingVisitDate = 0;

        for (const item of history) {

            if (
                item.att_id == null ||
                item.att_id === ""
            ) {
                missingAttId++;
            }

            if (
                item.rating == null
            ) {
                missingRating++;
            }

            if (
                !item.visit_date
            ) {
                missingVisitDate++;
            }
        }

        console.log(
            missingAttId === 0
                ? "   ✅ history.att_id ครบ"
                : `   ❌ history.att_id หาย ${missingAttId} รายการ`
        );

        console.log(
            missingRating === 0
                ? "   ✅ rating ครบ"
                : `   ⚠️ rating ไม่มี ${missingRating} รายการ`
        );

        console.log(
            missingVisitDate === 0
                ? "   ✅ visit_date ครบ"
                : `   ❌ visit_date หาย ${missingVisitDate} รายการ`
        );

        console.log(
            "   📦 ตัวอย่าง History:",
            history[0]
        );
    }


    /*
     * --------------------------------------------------------
     * 3. User Location
     * --------------------------------------------------------
     */

    console.log("");
    console.log("🌍 3. USER LOCATION");

    const validLat =
        Number.isFinite(
            Number(userLat)
        );

    const validLon =
        Number.isFinite(
            Number(userLon)
        );

    console.log(
        validLat
            ? `   ✅ userLat: ${userLat}`
            : "   ❌ userLat ไม่มีหรือไม่ถูกต้อง"
    );

    console.log(
        validLon
            ? `   ✅ userLon: ${userLon}`
            : "   ❌ userLon ไม่มีหรือไม่ถูกต้อง"
    );


    /*
     * --------------------------------------------------------
     * 4. Predicted Rating
     * --------------------------------------------------------
     */

    console.log("");
    console.log("⭐ 4. PREDICTED RATING");

    if (
        !(predictedRatingByAttraction instanceof Map)
    ) {

        console.error(
            "❌ predictedRatingByAttraction ไม่ใช่ Map"
        );

    } else if (
        predictedRatingByAttraction.size === 0
    ) {

        console.warn(
            "⚠️ predictedRatingByAttraction ว่าง"
        );

        console.warn(
            "   → predictedRating ทุกสถานที่จะเป็น 0"
        );

        console.warn(
            "   → ตอนนี้ยังไม่มีผลจาก Autoencoder"
        );

    } else {

        console.log(
            `✅ predictedRating มี ${predictedRatingByAttraction.size} รายการ`
        );

        console.log(
            "   📦 ตัวอย่าง:",
            Array.from(
                predictedRatingByAttraction.entries()
            ).slice(0, 5)
        );

        let matched = 0;
        let unmatched = 0;

        for (const place of attractions) {

            if (
                predictedRatingByAttraction.has(
                    place.att_id
                )
            ) {
                matched++;
            } else {
                unmatched++;
            }
        }

        console.log(
            `   ✅ Match กับ Attraction: ${matched}`
        );

        console.log(
            unmatched === 0
                ? "   ✅ predictedRating ครบทุก Attraction"
                : `   ⚠️ predictedRating ไม่มี ${unmatched} Attraction`
        );
    }


    /*
     * --------------------------------------------------------
     * 5. Category Preference
     * --------------------------------------------------------
     */

    console.log("");
    console.log("🗂️ 5. CATEGORY PREFERENCE");

    if (
        !categoryPreference ||
        typeof categoryPreference !== "object"
    ) {

        console.error(
            "❌ categoryPreference ไม่มีข้อมูล"
        );

    } else {

        const categories =
            Object.keys(
                categoryPreference
            );

        if (
            categories.length === 0
        ) {

            console.warn(
                "⚠️ categoryPreference ว่าง"
            );

            console.warn(
                "   → pDiv จะเป็น 0"
            );

        } else {

            console.log(
                `✅ categoryPreference มี ${categories.length} categories`
            );

            console.log(
                "   📦 category preference:",
                categoryPreference
            );

            /*
             * ตรวจว่าค่าเป็นตัวเลขหรือไม่
             */

            let invalid = 0;

            for (
                const category of categories
            ) {

                const value =
                    Number(
                        categoryPreference[
                            category
                        ]
                    );

                if (
                    !Number.isFinite(value)
                ) {
                    invalid++;
                }
            }

            console.log(
                invalid === 0
                    ? "   ✅ category preference values ถูกต้อง"
                    : `   ❌ มีค่าไม่ถูกต้อง ${invalid} categories`
            );
        }
    }


    /*
     * --------------------------------------------------------
     * 6. Attraction Category Match
     * --------------------------------------------------------
     */

    console.log("");
    console.log("🔗 6. CATEGORY MATCH");

    if (
        Array.isArray(attractions) &&
        categoryPreference
    ) {

        const knownCategories =
            new Set(
                Object.keys(
                    categoryPreference
                )
            );

        let attractionsWithMatch = 0;
        let attractionsWithoutMatch = 0;

        for (
            const place of attractions
        ) {

            const categories =
                Array.isArray(
                    place.travel_type
                )
                    ? place.travel_type
                    : [];

            const hasMatch =
                categories.some(
                    category =>
                        knownCategories.has(
                            category
                        )
                );

            if (hasMatch) {
                attractionsWithMatch++;
            } else {
                attractionsWithoutMatch++;
            }
        }

        console.log(
            `   ✅ Attraction ที่ match category: ${attractionsWithMatch}`
        );

        console.log(
            attractionsWithoutMatch === 0
                ? "   ✅ ทุก Attraction มี category ที่ match"
                : `   ⚠️ ${attractionsWithoutMatch} Attraction ไม่มี category ที่ match`
        );
    }


    /*
     * --------------------------------------------------------
     * 7. History → Attraction Match
     * --------------------------------------------------------
     */

    console.log("");
    console.log("🔗 7. HISTORY → ATTRACTION MATCH");

    if (
        Array.isArray(history) &&
        Array.isArray(attractions)
    ) {

        const attractionIds =
            new Set(
                attractions.map(
                    place =>
                        String(
                            place.att_id
                        )
                )
            );

        let matched = 0;
        let unmatched = 0;

        for (
            const item of history
        ) {

            if (
                attractionIds.has(
                    String(item.att_id)
                )
            ) {

                matched++;

            } else {

                unmatched++;
            }
        }

        console.log(
            `   ✅ History ที่ match: ${matched}`
        );

        console.log(
            unmatched === 0
                ? "   ✅ History ทุกตัว match กับ Attraction"
                : `   ❌ History ${unmatched} รายการหา Attraction ไม่เจอ`
        );
    }


    /*
     * --------------------------------------------------------
     * 8. สรุปสิ่งที่ขาด
     * --------------------------------------------------------
     */

    console.log("");
    console.log("======================================================");
    console.log("📊 RESEARCH 1 - SUMMARY");
    console.log("======================================================");

    const problems: string[] = [];

    if (
        !Array.isArray(attractions) ||
        attractions.length === 0
    ) {
        problems.push(
            "Attractions"
        );
    }

    if (
        !Array.isArray(history) ||
        history.length === 0
    ) {
        problems.push(
            "User History"
        );
    }

    if (
        !validLat ||
        !validLon
    ) {
        problems.push(
            "User Latitude / Longitude"
        );
    }

    if (
        !(predictedRatingByAttraction instanceof Map) ||
        predictedRatingByAttraction.size === 0
    ) {
        problems.push(
            "Predicted Rating"
        );
    }

    if (
        !categoryPreference ||
        Object.keys(
            categoryPreference
        ).length === 0
    ) {
        problems.push(
            "Category Preference"
        );
    }

    const hasPopularity =
        Array.isArray(attractions) &&
        attractions.some(
            place =>
                Number.isFinite(
                    Number(
                        place.popularity
                    )
                )
        );

    if (!hasPopularity) {
        problems.push(
            "Popularity"
        );
    }

    const hasCategory =
        Array.isArray(attractions) &&
        attractions.some(
            place =>
                Array.isArray(
                    place.travel_type
                ) &&
                place.travel_type.length > 0
        );

    if (!hasCategory) {
        problems.push(
            "Travel Type / Category"
        );
    }


    if (
        problems.length === 0
    ) {

        console.log(
            "✅ ไม่มีข้อมูลสำคัญที่ขาด"
        );

    } else {

        console.warn(
            "⚠️ ข้อมูลที่ยังขาด:"
        );

        for (
            const problem of problems
        ) {

            console.warn(
                `   ❌ ${problem}`
            );
        }
    }

    console.log(
        "======================================================"
    );
    console.log("");
}