export interface UserHistoryItem {
    id: string;

    profile_id: string;

    att_id: string | number;

    rating: number | null;

    visit_date: string;

    created_at?: string;
}


export interface AttractionForRecommendation {

    att_id: string | number;

    name_th: string;

    latitude: number | null;

    longitude: number | null;

    travel_type: string[] | null;

    popularity: number | null;
}


export type CategoryPreferenceVector =
    Record<string, number>;


export interface AspectScore {

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
}