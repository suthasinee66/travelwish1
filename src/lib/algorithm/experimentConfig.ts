import type {
    TripPlanInput,
} from "./types";


export const EXPERIMENT_CONFIG = {

    /* ==========================================
       K
    ========================================== */

    K_VALUES: [
        1,2,3,4,5,6,7,8,9,10,
        
    ],


    /* ==========================================
       Province
    ========================================== */

    TEST_PROVINCES: [
        "เชียงใหม่",
        "นครสวรรค์",
        "กำแพงเพชร",
    ],


    /* ==========================================
       Ground Truth
    ========================================== */

    RELEVANT_RATING_THRESHOLD: 4,


    /* ==========================================
       Topic Vector
    ========================================== */

    TOPIC_VECTOR_SIZE: 22,


    /* ==========================================
       TDMC
    ========================================== */

    CANDIDATE_MULTIPLIER: 5,

    ACCURACY_WEIGHT: 0.5,

    DIVERSITY_WEIGHT: 0.5,

};


export const TEST_TRIP: TripPlanInput = {

    province: "",

    travelType: [
        "ภูเขา",
        "ธรรมชาติ",
    ],

    activities: [
        "เดินป่า",
    ],

    atmosphere: [
        "ผจญภัย",
    ],

    budget: 3000,

    companion: "เพื่อน",
};