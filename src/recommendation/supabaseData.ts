// src/recommendation/supabaseData.ts

import type {
    Attraction,
    UserHistory
} from "./types";

import {
    supabase
} from "../lib/supabase";


/**
 * Load ALL attractions from Supabase
 *
 * Supabase REST API จำกัดจำนวนข้อมูลต่อ request
 * จึงต้องแบ่งเป็นหลาย page
 */
export async function loadAttractions(): Promise<Attraction[]> {

    const PAGE_SIZE = 1000;

    let from = 0;

    const allAttractions: Attraction[] = [];

    while (true) {

        const to =
            from + PAGE_SIZE - 1;

        console.log(
            `Loading attraction ${from} - ${to}`
        );

        const {
            data,
            error
        } = await supabase
            .from("attraction")
            .select("*")
            .range(
                from,
                to
            );

        if (error) {

            console.error(
                "Failed to load attractions:",
                error
            );

            throw error;
        }

        if (!data) {
            break;
        }

        console.log(
            `Received ${data.length} attractions`
        );

        allAttractions.push(
            ...(data as Attraction[])
        );

        /*
         * ถ้าได้ข้อมูลน้อยกว่า PAGE_SIZE
         * แปลว่าเป็นหน้าสุดท้าย
         */
        if (
            data.length <
            PAGE_SIZE
        ) {
            break;
        }

        /*
         * ไปหน้าถัดไป
         */
        from += PAGE_SIZE;
    }

    console.log(
        "================================"
    );

    console.log(
        "TOTAL ATTRACTIONS:",
        allAttractions.length
    );

    console.log(
        "================================"
    );

    return allAttractions;
}


/**
 * Load user history
 */
export async function loadUserHistory(
    profileId: string
): Promise<UserHistory[]> {

    const {
        data,
        error
    } = await supabase
        .from(
            "user_attraction_history"
        )
        .select("*")
        .eq(
            "profile_id",
            profileId
        )
        .order(
            "visited_at",
            {
                ascending: true
            }
        );

    if (error) {

        console.error(
            "Failed to load history:",
            error
        );

        throw error;
    }

    return (
        data ?? []
    ) as UserHistory[];
}