import type {
    TripPlanInput
} from "./types";

/*
 คำนวณระยะทางระหว่าง 2 จุด
 km
*/
function distanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) {
    if (
        lat1 == null ||
        lon1 == null ||
        lat2 == null ||
        lon2 == null
    ) {
        return 999;
    }


    const R = 6371;


    const dLat =
        (lat2 - lat1)
        *
        Math.PI / 180;


    const dLon =
        (lon2 - lon1)
        *
        Math.PI / 180;


    const a =
        Math.sin(dLat / 2)
        *
        Math.sin(dLat / 2)
        +
        Math.cos(lat1 * Math.PI / 180)
        *
        Math.cos(lat2 * Math.PI / 180)
        *
        Math.sin(dLon / 2)
        *
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
 ให้คะแนนสถานที่
*/
function scoreAttraction(
    place: any,
    trip: TripPlanInput
) {

    let score = 0;



    /*
    ประเภทเที่ยว
    */
    if (
        place.travel_type &&
        trip.travelType?.length
    ) {

        for (const type of trip.travelType) {

            if (Array.isArray(place.travel_type)) {

                if (place.travel_type.includes(type)) {
                    score += 3;
                }

            } else if (typeof place.travel_type === "string") {

                if (place.travel_type.includes(type)) {
                    score += 3;
                }

            }

        }

    }



    /*
    กิจกรรม
    */
    if (
        place.activities &&
        trip.activities?.length
    ) {

        for (const act of trip.activities) {

            if (Array.isArray(place.activities)) {

                if (place.activities.includes(act))
                    score += 2;

            } else if (typeof place.activities === "string") {

                if (place.activities.includes(act))
                    score += 2;

            }

        }

    }


    /*
    บรรยากาศ
    */
    if (
        place.atmosphere &&
        trip.atmosphere
    ) {

        if (Array.isArray(place.atmosphere)) {

            if (place.atmosphere.includes(trip.atmosphere))
                score += 2;

        } else {

            if (place.atmosphere.includes(trip.atmosphere))
                score += 2;

        }

    }

    /*
    คู่รัก
    */
    if (
        place.travel_companion &&
        trip.companion
    ) {

        if (Array.isArray(place.travel_companion)) {

            if (place.travel_companion.includes(trip.companion))
                score += 2;

        }

    }

    if (place.budget) {

        let userBudget = "";

        if (trip.budget <= 3000)
            userBudget = "ประหยัด";

        else if (trip.budget <= 10000)
            userBudget = "ปานกลาง";

        else
            userBudget = "หรูหรา";

        if (
            Array.isArray(place.budget) &&
            place.budget.includes(userBudget)
        ) {

            score += 2;

        }

    }
}

    /*
     หา restaurant ใกล้สถานที่
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
                r => r.distance < 10
            )

            .sort(
                (a, b) =>
                    a.distance - b.distance
            )

            .slice(0, 3);


    }





    /*
     Main Algorithm
    */
    export function rankPlaces(

        attractions: any[],

        restaurants: any[],

        trip: TripPlanInput

    ) {



        /*
        1.
        score สถานที่
        */


        const scored =
            attractions.map(place => ({


                ...place,


                score:
                    scoreAttraction(
                        place,
                        trip
                    )


            }));




        /*
        2.
        เรียงคะแนน
        */
        const topPlaces =
            scored
                .sort((a, b) => b.score - a.score)
                .slice(0, 50);
        console.table(
            topPlaces.map(p => ({
                name: p.name_th,
                score: p.score,
                travelType: p.travel_type,
                activities: p.activities,
                atmosphere: p.atmosphere
            }))
        );


        /*
        3.
        เติมร้านอาหารใกล้ ๆ
        */


        const result =
            topPlaces.map(place => {


                return {

                    attraction: place,


                    nearbyRestaurants:
                        findNearbyRestaurants(
                            place,
                            restaurants
                        )


                };


            });
        console.log(
            result.map(r => ({
                attraction: r.attraction.name_th,
                restaurants: r.nearbyRestaurants.map(x => x.restaurant_name_th)
            }))
        );

        return result;


    }
