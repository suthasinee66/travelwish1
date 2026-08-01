import { create } from "zustand";

interface TravelStore {

    user: any;

    preferences: any;

    allPlaces: any[];

    recommend: any[];

    nearbyPlaces: any[];

    explorePlaces: any[];

    savedItems: any[];

    savedIds: string[];

    allRecommend: any[];

    setAllRecommend: (data: any[]) => void;

    setUser: (data: any) => void;

    setPreferences: (data: any) => void;

    setAllPlaces: (data: any[]) => void;

    setRecommend: (data: any[]) => void;

    setExplorePlaces: (data: any[]) => void;

    setNearbyPlaces: (data: any[]) => void;

    setSavedItems: (data: any[]) => void;

    setSavedIds: (data: string[]) => void;

    addSaved: (data: any) => void;

    removeSaved: (id: string) => void;

}


export const useTravelStore = create<TravelStore>((set) => ({

    user: null,

    preferences: null,

    allRecommend:[],

    allPlaces: [],

    recommend: [],

    explorePlaces: [],

    nearbyPlaces: [],

    savedItems: [],

    savedIds: [],



    setUser: (data) =>
        set({
            user: data
        }),


        setAllRecommend:(data)=>
 set({
   allRecommend:data
 }),

    setPreferences: (data) =>
        set({
            preferences: data
        }),



    setAllPlaces: (data) =>
        set({
            allPlaces: data
        }),



    setRecommend: (data) =>
        set({
            recommend: data
        }),



    setExplorePlaces: (data) =>
        set({
            explorePlaces: data
        }),

    setNearbyPlaces: (data) =>
        set({
            nearbyPlaces: data
        }),



    setSavedItems: (data) =>
        set({
            savedItems: data
        }),



    addSaved: (data) =>
        set((state) => ({

            savedItems: [
                ...state.savedItems,
                data
            ]

        })),

    setSavedIds: (data) =>
        set({
            savedIds: data
        }),


    removeSaved: (id) =>
        set((state) => ({

            savedItems:
                state.savedItems.filter(
                    item => item.id !== id
                )

        }))

}));