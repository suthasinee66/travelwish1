import type { TripPlanInput } from "./types";

/* =========================================================
   TDMC ALGORITHM
   ========================================================= */

export interface TDMCWeights {
    alpha: number; // Accuracy
    beta: number;  // Popularity
    gamma: number; // Distance
}

export interface TDMCExperimentConfig extends TDMCWeights {
    id: string;
    name: string;
}

export interface TDMCPlace {
    att_id?: string | number;
    id?: string | number;

    name_th?: string;
    name_en?: string;
    name?: string;

    province?: string;

    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;

    category?: string;

    travel_type?: string[];
    activities?: string[];
    atmosphere?: string[];
    budget?: string[];
    travel_companion?: string[];

    rating?: number;
    averageRating?: number;
    predictedRating?: number;
    predictedRatingByAttraction?: number;

    popularity?: number;
    visitors?: number;
    visitorCount?: number;

    images?: string[];

    [key: string]: unknown;
}

export interface TDMCScoredPlace extends TDMCPlace {
    tdmcScore: number;

    accuracyScore: number;
    popularityScore: number;
    distanceScore: number;

    normalizedRating: number;
    normalizedPopularity: number;
    normalizedDistance: number;

    topicSimilarity: number;
    topicDiversity: number;

    distanceKm: number;
}

export interface TDMCResult {
    recommendations: TDMCScoredPlace[];

    weights: TDMCWeights;

    averageScore: number;
    averageRating: number;
    averagePopularity: number;
    averageDistance: number;

    diversity: number;

    runtime: number;
}

/* =========================================================
   EXPERIMENT CONFIGURATIONS
   ========================================================= */

export const TDMC_EXPERIMENT_CONFIGS: TDMCExperimentConfig[] = [
    {
        id: "accuracy_only",
        name: "Accuracy Only",
        alpha: 1.0,
        beta: 0.0,
        gamma: 0.0,
    },

    {
        id: "accuracy_popularity",
        name: "Accuracy + Popularity",
        alpha: 0.8,
        beta: 0.2,
        gamma: 0.0,
    },

    {
        id: "accuracy_distance",
        name: "Accuracy + Distance",
        alpha: 0.8,
        beta: 0.0,
        gamma: 0.2,
    },

    {
        id: "balanced",
        name: "Balanced TDMC",
        alpha: 0.6,
        beta: 0.2,
        gamma: 0.2,
    },

    {
        id: "equal_weight",
        name: "Equal Weight",
        alpha: 1 / 3,
        beta: 1 / 3,
        gamma: 1 / 3,
    },

    {
        id: "popularity_emphasis",
        name: "Popularity Emphasis",
        alpha: 0.5,
        beta: 0.3,
        gamma: 0.2,
    },

    {
        id: "distance_emphasis",
        name: "Distance Emphasis",
        alpha: 0.2,
        beta: 0.3,
        gamma: 0.5,
    },
];

/* =========================================================
   TOPICS
   ========================================================= */

const TOPICS = [
    // travel_type
    "ภูเขา",
    "ทะเล",
    "วัฒนธรรม",
    "คาเฟ่",
    "ธรรมชาติ",
    "เมือง",

    // activities
    "ถ่ายรูป",
    "เดินป่า",
    "อาหาร",
    "ช้อปปิ้ง",
    "พักผ่อน",

    // atmosphere
    "คึกคัก",
    "เงียบสงบ",
    "ผจญภัย",
    "หรูหรา",

    // budget
    "ประหยัด",
    "ปานกลาง",
    "หรูหรา",

    // companion
    "คนเดียว",
    "คู่รัก",
    "ครอบครัว",
    "เพื่อน",
];

/* =========================================================
   HELPERS
   ========================================================= */

function normalizeText(value: unknown): string {
    if (value == null) {
        return "";
    }

    return String(value)
        .trim()
        .toLowerCase();
}

function toArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value
            .map(item => String(item))
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [];
}

function safeNumber(
    value: unknown,
    fallback = 0
): number {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

function clamp(
    value: number,
    min = 0,
    max = 1
): number {
    return Math.max(
        min,
        Math.min(max, value)
    );
}

/* =========================================================
   BUDGET
   ========================================================= */

function getBudgetCategory(
    budget: number
): string {
    if (budget <= 3000) {
        return "ประหยัด";
    }

    if (budget <= 8000) {
        return "ปานกลาง";
    }

    return "หรูหรา";
}

/* =========================================================
   TOPIC VECTOR
   ========================================================= */

function createTopicVector(
    place: TDMCPlace
): number[] {
    const placeTopics = [
        ...toArray(place.travel_type),
        ...toArray(place.activities),
        ...toArray(place.atmosphere),
        ...toArray(place.budget),
        ...toArray(place.travel_companion),
    ];

    const normalizedTopics =
        new Set(
            placeTopics.map(normalizeText)
        );

    return TOPICS.map(topic =>
        normalizedTopics.has(
            normalizeText(topic)
        )
            ? 1
            : 0
    );
}

function createUserTopicVector(
    trip: TripPlanInput
): number[] {
    const userTopics = [
        ...toArray(trip.travelType),
        ...toArray(trip.activities),
        ...toArray(trip.atmosphere),
        ...(
            trip.companion
                ? [trip.companion]
                : []
        ),
        getBudgetCategory(
            safeNumber(trip.budget)
        ),
    ];

    const normalizedTopics =
        new Set(
            userTopics.map(normalizeText)
        );

    return TOPICS.map(topic =>
        normalizedTopics.has(
            normalizeText(topic)
        )
            ? 1
            : 0
    );
}

/* =========================================================
   COSINE SIMILARITY
   ========================================================= */

function cosineSimilarity(
    a: number[],
    b: number[]
): number {
    if (
        !a.length ||
        !b.length ||
        a.length !== b.length
    ) {
        return 0;
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];

        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (
        normA === 0 ||
        normB === 0
    ) {
        return 0;
    }

    return clamp(
        dot /
        (
            Math.sqrt(normA) *
            Math.sqrt(normB)
        )
    );
}

/* =========================================================
   RATING
   ========================================================= */

function getRating(
    place: TDMCPlace
): number {
    const values = [
        place.predictedRatingByAttraction,
        place.predictedRating,
        place.averageRating,
        place.rating,
    ];

    for (const value of values) {
        const rating = safeNumber(value);

        if (rating > 0) {
            return clamp(
                rating,
                0,
                5
            );
        }
    }

    return 0;
}

/* =========================================================
   ACCURACY
   ========================================================= */

function calculateAccuracy(
    place: TDMCPlace,
    topicSimilarity: number
): number {
    const rating = getRating(place);

    if (rating > 0) {
        return clamp(
            rating / 5
        );
    }

    return topicSimilarity;
}

/* =========================================================
   POPULARITY
   ========================================================= */

function getPopularity(
    place: TDMCPlace
): number {
    const values = [
        place.visitors,
        place.visitorCount,
        place.popularity,
    ];

    for (const value of values) {
        const count = safeNumber(value);

        if (count > 0) {
            return count;
        }
    }

    return 0;
}

function calculatePOIPopularity(
    place: TDMCPlace,
    places: TDMCPlace[]
): number {
    const rating = getRating(place);

    const ratingComponent =
        rating > 0
            ? rating / 5
            : 0;

    const counts = places.map(
        item => getPopularity(item)
    );

    const totalCount = counts.reduce(
        (sum, count) => sum + count,
        0
    );

    const count =
        getPopularity(place);

    const countComponent =
        totalCount > 0 && count > 0
            ? count / totalCount
            : 0;

    return clamp(
        ratingComponent +
        countComponent
    );
}

function calculatePopularityMap(
    places: TDMCPlace[]
): Map<string, number> {
    const map =
        new Map<string, number>();

    for (const place of places) {
        const key =
            String(
                place.att_id ??
                place.id ??
                place.name_th ??
                place.name ??
                Math.random()
            );

        map.set(
            key,
            calculatePOIPopularity(
                place,
                places
            )
        );
    }

    return map;
}

/* =========================================================
   COORDINATES
   ========================================================= */

function getCoordinates(
    place: TDMCPlace
): {
    latitude: number;
    longitude: number;
} | null {
    const latitude =
        place.latitude ??
        place.lat;

    const longitude =
        place.longitude ??
        place.lng;

    const lat = safeNumber(latitude);
    const lng = safeNumber(longitude);

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat === 0 && lng === 0
    ) {
        return null;
    }

    return {
        latitude: lat,
        longitude: lng,
    };
}

/* =========================================================
   HAVERSINE
   ========================================================= */

function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371;

    const dLat =
        (
            lat2 - lat1
        ) *
        Math.PI /
        180;

    const dLon =
        (
            lon2 - lon1
        ) *
        Math.PI /
        180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(
            lat1 * Math.PI / 180
        ) *
        Math.cos(
            lat2 * Math.PI / 180
        ) *
        Math.sin(dLon / 2) ** 2;

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}

/* =========================================================
   CENTROID
   ========================================================= */

function calculateCentroid(
    places: TDMCPlace[]
): {
    latitude: number;
    longitude: number;
} | null {
    const validPlaces =
        places
            .map(place => ({
                place,
                coordinates:
                    getCoordinates(place),
            }))
            .filter(
                item =>
                    item.coordinates !== null
            );

    if (!validPlaces.length) {
        return null;
    }

    const latitude =
        validPlaces.reduce(
            (sum, item) =>
                sum +
                (item.coordinates?.latitude ?? 0),
            0
        ) /
        validPlaces.length;

    const longitude =
        validPlaces.reduce(
            (sum, item) =>
                sum +
                (item.coordinates?.longitude ?? 0),
            0
        ) /
        validPlaces.length;

    return {
        latitude,
        longitude,
    };
}

/* =========================================================
   DISTANCE SCORE
   ========================================================= */

function calculateDistanceScore(
    distanceKm: number
): number {
    return clamp(
        1 -
        distanceKm / 50
    );
}

/* =========================================================
   TOPIC DIVERSITY
   ========================================================= */

function calculateTopicDiversity(
    place: TDMCPlace,
    selected: TDMCScoredPlace[]
): number {
    if (!selected.length) {
        return 1;
    }

    const placeVector =
        createTopicVector(place);

    let maxSimilarity = 0;

    for (const selectedPlace of selected) {
        const similarity =
            cosineSimilarity(
                placeVector,
                createTopicVector(
                    selectedPlace
                )
            );

        maxSimilarity =
            Math.max(
                maxSimilarity,
                similarity
            );
    }

    return clamp(
        1 - maxSimilarity
    );
}

/* =========================================================
   NORMALIZE WEIGHTS
   ========================================================= */

export function normalizeWeights(
    weights?: TDMCWeights
): TDMCWeights {
    const alpha =
        Math.max(
            0,
            safeNumber(
                weights?.alpha,
                0.6
            )
        );

    const beta =
        Math.max(
            0,
            safeNumber(
                weights?.beta,
                0.2
            )
        );

    const gamma =
        Math.max(
            0,
            safeNumber(
                weights?.gamma,
                0.2
            )
        );

    const total =
        alpha +
        beta +
        gamma;

    if (total === 0) {
        return {
            alpha: 1,
            beta: 0,
            gamma: 0,
        };
    }

    return {
        alpha: alpha / total,
        beta: beta / total,
        gamma: gamma / total,
    };
}

/* =========================================================
   TDMC SCORE
   ========================================================= */

export function calculateTDMCScore(
    accuracy: number,
    popularity: number,
    distance: number,
    weights: TDMCWeights
): number {
    return clamp(
        weights.alpha * accuracy +
        weights.beta * popularity +
        weights.gamma * distance
    );
}

/* =========================================================
   RANK
   ========================================================= */

export function rankPlacesTDMC(
    places: TDMCPlace[],
    trip: TripPlanInput,
    options?: {
        limit?: number;
        weights?: TDMCWeights;
        candidateMultiplier?: number;
    }
): TDMCResult {
    const startTime =
        performance.now();

    const limit =
        options?.limit ?? 15;

    const candidateMultiplier =
        options?.candidateMultiplier ?? 3;

    const weights =
        normalizeWeights(
            options?.weights
        );

    const userVector =
        createUserTopicVector(trip);

    /* -----------------------------------------------------
       Remove duplicate attractions
       ----------------------------------------------------- */

    const uniqueMap =
        new Map<string, TDMCPlace>();

    for (const place of places) {
        const name =
            normalizeText(
                place.name_th ??
                place.name_en ??
                place.name ??
                ""
            );

        const province =
            normalizeText(
                place.province ?? ""
            );

        const key =
            `${name}|${province}`;

        if (!uniqueMap.has(key)) {
            uniqueMap.set(
                key,
                place
            );
        }
    }

    const uniquePlaces =
        Array.from(
            uniqueMap.values()
        );

    if (!uniquePlaces.length) {
        return {
            recommendations: [],
            weights,
            averageScore: 0,
            averageRating: 0,
            averagePopularity: 0,
            averageDistance: 0,
            diversity: 0,
            runtime:
                performance.now() -
                startTime,
        };
    }

    /* -----------------------------------------------------
       Popularity map
       ----------------------------------------------------- */

    const popularityMap =
        calculatePopularityMap(
            uniquePlaces
        );

    /* -----------------------------------------------------
       Centroid
       ----------------------------------------------------- */

    const centroid =
        calculateCentroid(
            uniquePlaces
        );

    /* -----------------------------------------------------
       Score every candidate
       ----------------------------------------------------- */

    const scored =
        uniquePlaces.map(
            place => {
                const topicSimilarity =
                    cosineSimilarity(
                        createTopicVector(
                            place
                        ),
                        userVector
                    );

                const rating =
                    getRating(place);

                const accuracyScore =
                    calculateAccuracy(
                        place,
                        topicSimilarity
                    );

                const popularityKey =
                    String(
                        place.att_id ??
                        place.id ??
                        place.name_th ??
                        place.name ??
                        ""
                    );

                const popularityScore =
                    popularityMap.get(
                        popularityKey
                    ) ?? 0;

                let distanceKm = 0;

                if (centroid) {
                    const coordinates =
                        getCoordinates(place);

                    if (coordinates) {
                        distanceKm =
                            haversineDistance(
                                coordinates.latitude,
                                coordinates.longitude,
                                centroid.latitude,
                                centroid.longitude
                            );
                    }
                }

                const distanceScore =
                    calculateDistanceScore(
                        distanceKm
                    );

                const tdmcScore =
                    calculateTDMCScore(
                        accuracyScore,
                        popularityScore,
                        distanceScore,
                        weights
                    );

                return {
                    ...place,

                    tdmcScore,

                    accuracyScore,
                    popularityScore,
                    distanceScore,

                    normalizedRating:
                        rating / 5,

                    normalizedPopularity:
                        popularityScore,

                    normalizedDistance:
                        distanceScore,

                    topicSimilarity,

                    topicDiversity: 0,

                    distanceKm,
                };
            }
        );

    /* -----------------------------------------------------
       Candidate pool
       
       Same pool is used for every weight configuration.
       ----------------------------------------------------- */

    const candidatePoolSize =
        Math.min(
            scored.length,
            Math.max(
                limit,
                limit *
                candidateMultiplier
            )
        );

    /*
       Sort by accuracy only to build
       a fixed candidate pool.

       This means the candidate pool does not
       change when alpha/beta/gamma change.
    */
    const candidatePool =
        [...scored]
            .sort(
                (a, b) =>
                    b.accuracyScore -
                    a.accuracyScore
            )
            .slice(
                0,
                candidatePoolSize
            );

    /* -----------------------------------------------------
       Greedy selection
       ----------------------------------------------------- */

    const selected: TDMCScoredPlace[] =
        [];

    const remaining =
        [...candidatePool];

    while (
        selected.length < limit &&
        remaining.length > 0
    ) {
        let bestIndex = 0;
        let bestValue = -Infinity;

        for (
            let i = 0;
            i < remaining.length;
            i++
        ) {
            const candidate =
                remaining[i];

            const diversity =
                calculateTopicDiversity(
                    candidate,
                    selected
                );

            /*
             * Diversity is retained as an evaluation
             * metric but is intentionally NOT included
             * in TDMC score.
             */

            if (
                candidate.tdmcScore >
                bestValue
            ) {
                bestValue =
                    candidate.tdmcScore;

                bestIndex = i;
            }
        }

        const selectedPlace =
            remaining.splice(
                bestIndex,
                1
            )[0];

        selectedPlace.topicDiversity =
            calculateTopicDiversity(
                selectedPlace,
                selected
            );

        selected.push(
            selectedPlace
        );
    }

    /* -----------------------------------------------------
       Final sort
       ----------------------------------------------------- */

    selected.sort(
        (a, b) =>
            b.tdmcScore -
            a.tdmcScore
    );

    /* -----------------------------------------------------
       Metrics
       ----------------------------------------------------- */

    const averageScore =
        selected.length
            ? selected.reduce(
                (sum, place) =>
                    sum +
                    place.tdmcScore,
                0
            ) /
            selected.length
            : 0;

    const averageRating =
        selected.length
            ? selected.reduce(
                (sum, place) =>
                    sum +
                    getRating(place),
                0
            ) /
            selected.length
            : 0;

    const averagePopularity =
        selected.length
            ? selected.reduce(
                (sum, place) =>
                    sum +
                    getPopularity(place),
                0
            ) /
            selected.length
            : 0;

    const averageDistance =
        selected.length
            ? selected.reduce(
                (sum, place) =>
                    sum +
                    place.distanceKm,
                0
            ) /
            selected.length
            : 0;

    const diversity =
        selected.length
            ? selected.reduce(
                (sum, place) =>
                    sum +
                    place.topicDiversity,
                0
            ) /
            selected.length
            : 0;

    const runtime =
        performance.now() -
        startTime;

    return {
        recommendations:
            selected,

        weights,

        averageScore,
        averageRating,
        averagePopularity,
        averageDistance,

        diversity,

        runtime,
    };
}

/* =========================================================
   WRAPPER
   ========================================================= */

export function tdmcAlgorithm(
    places: TDMCPlace[],
    trip: TripPlanInput,
    limit = 15,
    weights?: TDMCWeights
): TDMCScoredPlace[] {
    return rankPlacesTDMC(
        places,
        trip,
        {
            limit,
            weights,
        }
    ).recommendations;
}

export function runTDMCAlgorithm(
    places: TDMCPlace[],
    trip: TripPlanInput,
    limit = 15,
    weights?: TDMCWeights
): TDMCScoredPlace[] {
    return tdmcAlgorithm(
        places,
        trip,
        limit,
        weights
    );
}