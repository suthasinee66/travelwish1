import type {
    TripPlanInput
} from "./types";

import {
    rankPlacesOld
} from "./oldAlgorithm";

import {
    rankPlacesDiversity,
    attractionSimilarity
} from "./diversityAlgorithm";

import {
    distanceKm
} from "./oldAlgorithm";


/*
==================================================
 Types
==================================================
*/

export interface AlgorithmEvaluation {

    algorithm: string;

    resultCount: number;

    averagePreferenceScore: number;

    topicDiversity: number;

    geographicDiversity: number;

    averageDistanceKm: number;

    processingTimeMs: number;

}


export interface AlgorithmComparisonResult {

    old: {

        results: any[];

        evaluation:
            AlgorithmEvaluation;

    };

    diversity: {

        results: any[];

        evaluation:
            AlgorithmEvaluation;

    };

    overlap: {

        commonCount: number;

        oldOnlyCount: number;

        diversityOnlyCount: number;

        commonIds: string[];

        oldOnlyIds: string[];

        diversityOnlyIds: string[];

    };

}


/*
==================================================
 Round
==================================================
*/

function round(
    value: number,
    digits = 4
): number {

    return Number(
        value.toFixed(digits)
    );

}


/*
==================================================
 Average Preference
==================================================
*/

function calculateAveragePreference(
    results: any[]
): number {

    if (
        results.length === 0
    ) {

        return 0;

    }


    const total =
        results.reduce(

            (sum, result) =>

                sum +
                Number(
                    result.attraction.score ?? 0
                ),

            0

        );


    return (
        total /
        results.length
    );

}


/*
==================================================
 Topic Diversity
==================================================
*/

function calculateTopicDiversity(
    results: any[]
): number {

    if (
        results.length < 2
    ) {

        return 0;

    }


    let total = 0;

    let count = 0;


    for (
        let i = 0;
        i < results.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < results.length;
            j++
        ) {

            const similarity =
                attractionSimilarity(

                    results[i].attraction,

                    results[j].attraction

                );


            total +=
                1 - similarity;


            count++;

        }

    }


    return count > 0
        ? total / count
        : 0;

}


/*
==================================================
 Geographic Diversity
==================================================
*/

function calculateAverageDistance(
    results: any[]
): number {

    if (
        results.length < 2
    ) {

        return 0;

    }


    let total = 0;

    let count = 0;


    for (
        let i = 0;
        i < results.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < results.length;
            j++
        ) {

            const a =
                results[i].attraction;

            const b =
                results[j].attraction;


            const distance =
                distanceKm(

                    Number(a.latitude),
                    Number(a.longitude),

                    Number(b.latitude),
                    Number(b.longitude)

                );


            total +=
                distance;

            count++;

        }

    }


    return count > 0
        ? total / count
        : 0;

}


/*
==================================================
 Normalize Geographic Diversity
==================================================
*/

function normalizeGeographicDiversity(
    averageDistanceKm: number
): number {

    return Math.min(
        averageDistanceKm / 50,
        1
    );

}


/*
==================================================
 Evaluate
==================================================
*/

function evaluateAlgorithm(
    name: string,
    results: any[],
    processingTimeMs: number
): AlgorithmEvaluation {

    const averagePreferenceScore =
        calculateAveragePreference(
            results
        );


    const averageDistanceKm =
        calculateAverageDistance(
            results
        );


    const topicDiversity =
        calculateTopicDiversity(
            results
        );


    const geographicDiversity =
        normalizeGeographicDiversity(
            averageDistanceKm
        );


    return {

        algorithm:
            name,

        resultCount:
            results.length,

        averagePreferenceScore:
            round(
                averagePreferenceScore
            ),

        topicDiversity:
            round(
                topicDiversity
            ),

        geographicDiversity:
            round(
                geographicDiversity
            ),

        averageDistanceKm:
            round(
                averageDistanceKm,
                2
            ),

        processingTimeMs:
            round(
                processingTimeMs,
                3
            )

    };

}


/*
==================================================
 IDs
==================================================
*/

function getIds(
    results: any[]
): string[] {

    return results.map(
        result =>
            String(
                result.attraction.id
            )
    );

}


/*
==================================================
 Overlap
==================================================
*/

function calculateOverlap(
    oldResults: any[],
    diversityResults: any[]
) {

    const oldIds =
        getIds(
            oldResults
        );


    const diversityIds =
        getIds(
            diversityResults
        );


    const oldSet =
        new Set(oldIds);

    const diversitySet =
        new Set(diversityIds);


    const commonIds =
        oldIds.filter(
            id =>
                diversitySet.has(id)
        );


    const oldOnlyIds =
        oldIds.filter(
            id =>
                !diversitySet.has(id)
        );


    const diversityOnlyIds =
        diversityIds.filter(
            id =>
                !oldSet.has(id)
        );


    return {

        commonCount:
            commonIds.length,

        oldOnlyCount:
            oldOnlyIds.length,

        diversityOnlyCount:
            diversityOnlyIds.length,

        commonIds,

        oldOnlyIds,

        diversityOnlyIds

    };

}

/*
==================================================
 Province Check
==================================================
*/

function checkResultProvince(
    results: any[],
    selectedProvince: string
) {

    return results.map((result, index) => {

        const attraction =
            result.attraction;

        const province =
            attraction.province;

        const latitude =
            Number(attraction.latitude);

        const longitude =
            Number(attraction.longitude);

        return {

            rank:
                index + 1,

            name:
                attraction.name_th ?? "-",

            province:
                province ?? "-",

            provinceMatch:
                province === selectedProvince,

            latitude,

            longitude

        };

    });

}

/*
==================================================
 Main Comparison
==================================================
*/
export function compareAlgorithms(
    attractions: any[],
    restaurants: any[],
    trip: TripPlanInput
): AlgorithmComparisonResult {

    /*
    ==========================================
    Filter Province
    ==========================================
    */

    console.log(
        "\n=========================================="
    );

    console.log(
        "FILTER BY PROVINCE"
    );

    console.log(
        "=========================================="
    );

    console.log(
        "จังหวัดที่เลือก:",
        trip.province
    );

    console.log(
        "Attractions ทั้งหมด:",
        attractions.length
    );


    const comparisonAttractions =
        attractions.filter(
            place =>
                place.province === trip.province
        );


    console.log(
        "Attractions หลังกรองจังหวัด:",
        comparisonAttractions.length
    );


    /*
    ==========================================
    Old Algorithm
    ==========================================
    */

    const oldStart =
        performance.now();


    const oldResults =
        rankPlacesOld(

            comparisonAttractions,

            restaurants,

            trip

        );


    const oldTime =
        performance.now() -
        oldStart;


    /*
    ==========================================
    Diversity Algorithm
    ==========================================
    */

    const diversityStart =
        performance.now();


    const diversityResults =
        rankPlacesDiversity(

            comparisonAttractions,

            restaurants,

            trip

        );


    const diversityTime =
        performance.now() -
        diversityStart;


    /*
    ==========================================
    Evaluation
    ==========================================
    */

    const oldEvaluation =
        evaluateAlgorithm(

            "Old Algorithm",

            oldResults,

            oldTime

        );


    const diversityEvaluation =
        evaluateAlgorithm(

            "Diversity Algorithm",

            diversityResults,

            diversityTime

        );


    /*
    ==========================================
    Overlap
    ==========================================
    */

    const overlap =
        calculateOverlap(

            oldResults,

            diversityResults

        );


    /*
    ==========================================
    Console
    ==========================================
    */

    console.log(
        "\n=========================================="
    );

    console.log(
        "ALGORITHM COMPARISON"
    );

    console.log(
        "=========================================="
    );


    console.table([

        oldEvaluation,

        diversityEvaluation

    ]);


    /*
    ==========================================
    Result Overlap
    ==========================================
    */

    console.log(
        "\n=========================================="
    );

    console.log(
        "RESULT OVERLAP"
    );

    console.log(
        "=========================================="
    );


    console.table({

        common:
            overlap.commonCount,

        oldOnly:
            overlap.oldOnlyCount,

        diversityOnly:
            overlap.diversityOnlyCount

    });


    /*
    ==========================================
    Top 15
    ==========================================
    */

    console.log(
        "\n=========================================="
    );

    console.log(
        "TOP 15 COMPARISON"
    );

    console.log(
        "=========================================="
    );


    console.table(

        Array.from(

            {
                length:
                    Math.max(

                        oldResults.length,

                        diversityResults.length

                    )
            },

            (_, index) => ({

                rank:
                    index + 1,


                oldAlgorithm:

                    oldResults[index]
                        ?.attraction
                        ?.name_th ?? "-",


                oldPreference:

                    oldResults[index]
                        ?.attraction
                        ?.score ?? 0,


                oldRawScore:

                    oldResults[index]
                        ?.attraction
                        ?.rawScore ?? 0,


                diversityAlgorithm:

                    diversityResults[index]
                        ?.attraction
                        ?.name_th ?? "-",


                diversityPreference:

                    diversityResults[index]
                        ?.attraction
                        ?.score ?? 0,


                diversityFinal:

                    diversityResults[index]
                        ?.attraction
                        ?.diverseScore ?? 0

            })

        )

    );


    return {

        old: {

            results:
                oldResults,

            evaluation:
                oldEvaluation

        },


        diversity: {

            results:
                diversityResults,

            evaluation:
                diversityEvaluation

        },


        overlap

    };

}