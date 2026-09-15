import { createFileRoute } from "@tanstack/react-router";
import {
  Hotel,
  Sparkles,
  MessageCircle,
  Briefcase,
  Compass,
  Landmark,
  Heart,
  Bell,
  Lightbulb,
  Plus,
  Mic,
  ArrowUp,
  MoreHorizontal,
  MapPin,
  LayoutGrid,
  Mountain,
  Waves,
  Camera,
  TreePalm,
  Coffee,
  Building2,
  Users,
  Wallet,
  Sparkle,
  X,
  PartyPopper,
  Moon,
  Crown,
  Footprints,
  Utensils,
  ShoppingBag,
  Armchair,
  User,
  UserRoundPlus,
  Coins,
  Gem,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Fragment, useEffect, useState, useMemo } from "react";
import { getRecommendations } from "@/lib/recommend/getRecommendations";
import { getRecommendations as getInspireVideos } from "@/lib/inspire/getRecommendations";
import { Link } from "@tanstack/react-router";
import { getPlaceImage } from "@/lib/google/places";
import { loadPlaceImages } from "@/lib/recommend/loadPlaceImages";
import Sidebar from "@/components/Sidebar";
import { useTravelStore } from "@/store/travelStore";
import { loadTravelData } from "@/lib/travel/loadTravelData";
import { getUserLocation } from "@/lib/location/getUserLocation";
import { createPlanner } from "@/lib/ai/planner";
import { chatWithAI, resetTrip } from "@/lib/ai/chat";
import { Bot, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { loadRecommendationCache } from "@/lib/recommend/loadRecommendationCache";
import remarkGfm from "remark-gfm";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import googleMapIcon from "../assets/google-map.png";
import geminiIcon from "../assets/ai/gemini.png";
import gptIcon from "../assets/ai/gpt.png";
import claudeIcon from "../assets/ai/claude.png";





export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "TravelWise — Plan your perfect trip" },
      { name: "description", content: "AI-powered travel planning. Ask anything travel related." },
    ],
  }),
  component: Home,
});

const navItems = [
  { icon: MessageCircle, label: "Chats", badge: 1 },
  { icon: Briefcase, label: "Trips", to: "/trips", },
  { icon: Compass, label: "Explore" },
  { icon: Heart, label: "Saved" },
  { icon: Bell, label: "Updates" },
  { icon: Lightbulb, label: "Inspiration" },
  { icon: Plus, label: "Create" },
];


const forYou = [
  { title: "Temple of the Emerald Buddha (Wat Phra Kaew)", tag: "🏛 Attraction", img: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80" },
  { title: "Sra Bua by Kiin Kiin", tag: "🍴 Thai · $$", img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80" },
  { title: "Jim Thompson House Museum", tag: "🏛 Attraction", img: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80" },
];

const inspired = [
  { title: "Trip to Bangkok, August 2026", initial: "B", color: "bg-amber-700", img: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80" },
  { title: "Family Guide to Bangkok", initial: "C", color: "bg-violet-600", img: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80" },
  { title: "Trip to Thailand", initial: "S", color: "bg-teal-600", img: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80" },
];


function WherePicker({
  tripInput,
  setTripInput,
  filteredProvinces,
  setActiveStep,
  showProvinceDropdown,
  setShowProvinceDropdown,
  onComplete,
}: {
  tripInput: any;
  setTripInput: any;
  filteredProvinces: string[];
  setActiveStep: any;
  showProvinceDropdown: boolean;
  setShowProvinceDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  onComplete: () => void;
}) {
  console.log(tripInput.province);
  console.log(filteredProvinces);
  console.log(showProvinceDropdown);
  return (

    <div>

      <div className="relative">

        <input
          value={tripInput.province}
          onFocus={() => setShowProvinceDropdown(true)}
          onChange={(e) => {
            setTripInput({
              ...tripInput,
              province: e.target.value,
            });

          }}
          placeholder="Location"
          className="w-full border rounded-full px-5 py-4 outline-none"
        />
        {showProvinceDropdown &&
          tripInput.province &&

          filteredProvinces.length > 0 && (

            <div className="absolute left-0 right-0 mt-2 bg-white border rounded-2xl shadow-lg max-h-60 overflow-y-auto z-50">

              {filteredProvinces.map((province) => (
                <button
                  type="button"
                  key={province}
                  onClick={() => {
                    setTripInput({
                      ...tripInput,
                      province,
                    });

                    setShowProvinceDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100"
                >
                  {province}
                </button>
              ))}

            </div>
          )}

      </div>



      <div
        className="
flex
justify-end
items-center
gap-3
mt-5
"
      >






      </div>



      <button


        onClick={() => {

          setActiveStep("days")

        }}

        className={`
mt-10
ml-auto
block
px-10
py-3
rounded-full
font-semibold

${tripInput.province

            ?
            "bg-black text-white"

            :
            "bg-gray-300 text-white"

          }

`}
      >

        Save

      </button>


    </div>

  )

}
function DaysPicker({
  tripInput,
  setTripInput,
  setActiveStep,
}: any) {
  return (
    <div>
      <h2 className="font-semibold mb-4">
        How many days?
      </h2>

      <input
        type="number"
        min={1}
        placeholder="Number of days"
        value={tripInput.days ?? ""}
        onChange={(e) =>
          setTripInput({
            ...tripInput,
            days: Number(e.target.value),
          })
        }
        className="w-full border rounded-xl px-4 py-3 outline-none"
      />

      <button
        onClick={() => setActiveStep("who")}
        className={`mt-8 ml-auto block px-8 py-3 rounded-full font-semibold ${tripInput.days
          ? "bg-black text-white"
          : "bg-gray-300 text-white"
          }`}
      >
        Next
      </button>
    </div>
  );
}
function WhoPicker({
  tripInput,
  setTripInput,
  setActiveStep,
}: {
  tripInput: any;
  setTripInput: any;
  setActiveStep: any;
}) {
  return (
    <div>
      <h2 className="font-semibold mb-4">
        Who are you traveling with?
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {[
          "คนเดียว",
          "คู่รัก",
          "เพื่อน",
          "ครอบครัว",
        ].map((x) => (
          <button
            key={x}
            type="button"
            onClick={() => {
              setTripInput({
                ...tripInput,
                companion: x,
              });

              setActiveStep("budget");
            }}
            className={`
              border
              rounded-xl
              px-5
              py-3
              transition
              ${tripInput.companion === x
                ? "bg-black text-white border-black"
                : "hover:bg-gray-100"
              }
            `}
          >
            {x}
          </button>
        ))}
      </div>
    </div>
  );
}
function BudgetPicker({
  tripInput,
  setTripInput,
  setTripModal,
  onComplete,
}: {
  tripInput: any;
  setTripInput: any;
  setTripModal: any;
  onComplete: () => void;
}) {

  return (
    <div>

      <h2 className="font-semibold mb-4">
        What is your budget?
      </h2>


      <input
        type="number"
        placeholder="Enter your budget (บาท)"
        value={tripInput.budget ?? ""}
        onChange={(e) =>
          setTripInput(prev => ({
            ...prev,
            budget: Number(e.target.value)
          }))
        }
        className="w-full border rounded-xl px-4 py-3"
      />


      <button


        onClick={() => {

          setTripModal(false);
          onComplete();

        }}

        className={`
mt-8
ml-auto
block
px-8
py-3
rounded-full
font-semibold
${tripInput.budget
            ?
            "bg-black text-white"
            :
            "bg-gray-300 text-white"
          }
`}

      >
        Save

      </button>


    </div>
  )

}
function MapUpdater({
  center
}: {
  center: {
    lat: number;
    lng: number;
  }
}) {

  const map = useMap();

  useEffect(() => {

    if (!map) return;

    map.panTo(center);

  }, [
    map,
    center.lat,
    center.lng
  ]);

  return null;
}

function MapRoute({
  places,
  onRouteLoaded,
}: {
  places: any[];
  onRouteLoaded: (legs: any[]) => void;
}) {

  const map = useMap();


  useEffect(()=>{

    if(!map) return;

    if(places.length < 2) return;


    async function drawRoute(){

      const response = await fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method:"POST",

          headers:{
            "Content-Type":"application/json",

            "X-Goog-Api-Key":
              import.meta.env.VITE_GOOGLE_MAPS_API_KEY,

            "X-Goog-FieldMask":
    "routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration"
          },


          body:JSON.stringify({

            origin:{
              location:{
                latLng:{
                  latitude:
                  Number(
                    places[0].location.latitude
                  ),

                  longitude:
                  Number(
                    places[0].location.longitude
                  )
                }
              }
            },


            destination:{
              location:{
                latLng:{
                  latitude:
                  Number(
                    places[places.length-1]
                    .location.latitude
                  ),

                  longitude:
                  Number(
                    places[places.length-1]
                    .location.longitude
                  )
                }
              }
            },


            intermediates:
              places
              .slice(1,-1)
              .map(p=>({
                location:{
                  latLng:{
                    latitude:
                    Number(
                    p.location.latitude
                    ),

                    longitude:
                    Number(
                    p.location.longitude
                    )
                  }
                }
              })),


            travelMode:
              "DRIVE",


            optimizeWaypointOrder:false

          })

        }
      );


      const data =
        await response.json();
        onRouteLoaded(data.routes?.[0]?.legs || []);


      const encoded =
        data.routes?.[0]
        ?.polyline
        ?.encodedPolyline;


      if(!encoded) return;

const path =
  google.maps.geometry.encoding.decodePath(encoded);


      const polyline =
        new google.maps.Polyline({

          path,

          strokeColor:"#4285F4",

          strokeWeight:6,

          strokeOpacity:1

        });



      polyline.setMap(map);



      return ()=>{

        polyline.setMap(null);

      };

    }


    drawRoute();


  },[
 map,
 JSON.stringify(places)
]);


  return null;

}
function SortablePlaceItem({
  item,
  index,
  findPlace,
  findRestaurant,
}: any) {

  const sortableId =
    item.type === "restaurant"
      ? `restaurant-${item.restaurant_id}`
      : `place-${item.place_id}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: sortableId
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="
        flex
        items-center
        gap-3
        border
        rounded-2xl
        p-3
        bg-white
        shadow-sm
        cursor-grab
      "
    >

      {/* ลำดับ */}
      <div
        className="
          w-8
          h-8
          rounded-full
          bg-black
          text-white
          flex
          items-center
          justify-center
          font-bold
          shrink-0
        "
      >
        {index + 1}
      </div>

      {/* รูป */}
      {item.images?.[0] ? (
        <img
          src={item.images[0]}
          alt={item.name}
          className="
            w-14
            h-14
            rounded-xl
            object-cover
            shrink-0
          "
        />
      ) : (
        <div
          className="
            w-14
            h-14
            rounded-xl
            bg-gray-200
            shrink-0
          "
        />
      )}

      {/* ชื่อ */}
      <div className="flex-1">

        <div className="font-semibold text-sm">
          {item.name}
        </div>

        <div className="text-xs text-gray-400">
          {item.period}
        </div>

      </div>

    </div>
  );
}

function TripPlanPanel({
  plannerJson,
  plan,
  tripInput,
  allPlaces,
  restaurants,
  mapCenter,
}: {
  plannerJson:any;
  plan:string;
  tripInput:any;
  allPlaces:any[];
  restaurants:any[];
  mapCenter:{
    lat:number;
    lng:number;
  };
}) {
  console.log("🔥 TripPlanPanel RENDER");

  const [selectedDay, setSelectedDay] = useState(0);
  const [routePlaces, setRoutePlaces] = useState<any[]>([]);
  const [routePlacesByDay,setRoutePlacesByDay] = useState<any>({});
  const [routeLegs, setRouteLegs] = useState<any[]>([]);
  const [hotelModal, setHotelModal] = useState(false);
const [hotelSearch, setHotelSearch] = useState("");
const [hotels, setHotels] = useState<any[]>([]);
const [hotelLoading, setHotelLoading] = useState(false);
const filteredHotels = useMemo(() => {

  const keyword = hotelSearch.toLowerCase();

  return hotels.filter((hotel) => {

    const thaiName =
      hotel.acc_name_th
        ?.toLowerCase() || "";

    const engName =
      hotel.acc_name_en
        ?.toLowerCase() || "";


    return (
      thaiName.includes(keyword) ||
      engName.includes(keyword)
    );

  });

}, [hotels, hotelSearch]);

  const loadHotels = async () => {
    console.log("🔥 LOAD HOTELS START");

  setHotelLoading(true);

  const { data, error } = await supabase
    .from("accommodation")
    .select(`
      acc_id,
      acc_name_th,
      acc_name_en,
      province_name_th,
      acc_address,
      latitude,
      longitude,
      star_level,
      accom_price_name,
      images

    `)
    .eq("province_name_th", tripInput.province)
    .order("star_level", { ascending: false });

  if (error) {
    console.error(error);
    setHotelLoading(false);
    return;
  }

  setHotels(data || []);
  console.log("HOTELS:", data);
console.log("FIRST HOTEL:", data?.[0]);
  setHotelLoading(false);

};

  const getCoordinates = (places: any[]) => {

    const place = places.find(
      p => p.latitude && p.longitude
    );


    if (place) {

      return {
        lat: Number(place.latitude),
        lng: Number(place.longitude)
      };

    }


    return {
      lat: 13.7563,
      lng: 100.5018
    };

  };
const openGoogleMaps = (items: any[]) => {
  const locations: string[] = [];

  items.forEach((item) => {

    // =========================
    // 1. สถานที่ท่องเที่ยว
    // =========================
    if (item.place_id) {
      const place = findPlace(item.place_id);

      console.log("📍 PLACE:", {
        id: item.place_id,
        name: item.place_name,
        found: place,
      });

      if (
        place &&
        place.latitude != null &&
        place.longitude != null
      ) {
        locations.push(
          `${place.latitude},${place.longitude}`
        );
      } else {
        console.warn(
          "❌ ไม่พบพิกัดสถานที่:",
          item.place_name,
          item.place_id
        );
      }
    }

    // =========================
    // 2. ร้านอาหาร
    // =========================
    if (item.restaurant_id) {
      const restaurant = findRestaurant(
        item.restaurant_id
      );

      console.log("🍜 RESTAURANT:", {
        id: item.restaurant_id,
        name: item.restaurant_name,
        found: restaurant,
      });

      if (
        restaurant &&
        restaurant.latitude != null &&
        restaurant.longitude != null
      ) {
        locations.push(
          `${restaurant.latitude},${restaurant.longitude}`
        );
      } else {
        console.warn(
          "❌ ไม่พบพิกัดร้าน:",
          item.restaurant_name,
          item.restaurant_id
        );
      }
    }
  });

  console.log(
    "🗺️ GOOGLE MAP LOCATIONS:",
    locations
  );

  if (locations.length === 0) {
    console.warn("❌ ไม่มีสถานที่ที่มีพิกัด");
    return;
  }

  const url =
    `https://www.google.com/maps/dir/${locations.join("/")}`;

  console.log("🌎 GOOGLE MAP URL:", url);

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
};
const handleDragEnd = (event: any) => {

  const { active, over } = event;

  if (!over) return;

  if (active.id === over.id) return;

  setRoutePlaces((items) => {

    const getSortableId = (item: any) => {

      if (item.type === "restaurant") {
        return `restaurant-${item.restaurant_id}`;
      }

      return `place-${item.place_id}`;
    };

    const oldIndex = items.findIndex(
      item =>
        getSortableId(item) === String(active.id)
    );

    const newIndex = items.findIndex(
      item =>
        getSortableId(item) === String(over.id)
    );

    console.log("🔄 DRAG:", {
      active: active.id,
      over: over.id,
      oldIndex,
      newIndex
    });

    if (oldIndex === -1 || newIndex === -1) {
      console.warn("❌ Drag item not found");
      return items;
    }

    return arrayMove(
      items,
      oldIndex,
      newIndex
    );

  });

};

const sensors = useSensors(
  useSensor(PointerSensor,{
    activationConstraint:{
      distance:5
    }
  })
);

  const plannerItems = Array.isArray(plannerJson)
  ? plannerJson
  : plannerJson?.selectedPlaces || [];
  console.log("RAW PLANNER JSON", plannerJson);
  console.log("🔥 PLANNER ITEMS", plannerItems);

console.log(
  "🍜 RESTAURANT ITEMS",
  plannerItems.filter(x => x.restaurant_id)
);

console.log(
  "PLANNER ITEMS DETAIL",
  plannerItems.map(x => ({
    day:x.day,
    place_id:x.place_id,
    place_name:x.place_name,
    restaurant_id:x.restaurant_id
  }))
);
const days = useMemo(() => {

  return Array.from(
    new Set(
      plannerItems.map(x => Number(x.day))
    )
  ).map(day => {

    const items = plannerItems
      .filter(
        x => Number(x.day) === day
      )
      .filter(
        (item, index, array) =>
          array.findIndex(
            x =>
              x.place_id === item.place_id &&
              x.restaurant_id === item.restaurant_id
          ) === index
      )
      .map(item => ({
        ...item,
        type: "plan"
      }));

    const title =
      plannerItems.find(
        x => Number(x.day) === day
      )?.title ?? "";

    return {
      day,
      title,
      items
    };

  });

}, [plannerItems]);

  const findPlace = (placeId: string) => {

  const result = allPlaces.find(
    p => String(p.att_id) === String(placeId)
  );


  console.log(
    "FIND PLACE",
    placeId,
    result
  );


  return result;
};
const findRestaurant = (restaurantId: string) => {

  const result = restaurants.find(
    r =>
      String(r.place_id) === String(restaurantId)
  );


  console.log(
    "🍜 FIND RESTAURANT",
    restaurantId,
    result
  );
  console.log(
  "ALL RESTAURANT IDS",
  restaurants.slice(0,10)
);


  return result;
};

  console.log(
    "DAY CONTENT",
    days[selectedDay]?.content
  );

  console.log(
  "SELECTED DAY ITEMS",
  days[selectedDay]?.items
);

console.log(
  "ALL DAYS",
  days
);
const mapPlaces = useMemo(() => {

  const result: any[] = [];

  days[selectedDay]?.items.forEach((item) => {

    // =========================
    // PLACE
    // =========================

    if (item.place_id) {

      const place = findPlace(item.place_id);

      if (place) {

        result.push({
          ...item,

          type: "place",

          location: place,

          name:
            place.name_th ??
            place.name_en ??
            item.place_name ??
            "สถานที่",

          images: place.images,
        });

      }

    }


    // =========================
    // RESTAURANT
    // =========================

    if (item.restaurant_id) {

      const restaurant =
        findRestaurant(item.restaurant_id);

      if (restaurant) {

        result.push({
          ...item,

          type: "restaurant",

          location: restaurant,

          name:
            restaurant.place_name_th ??
            restaurant.place_name_en ??
            item.restaurant_name ??
            "ร้านอาหาร",

          images: restaurant.images,
        });

      }

    }

  });

  return result.filter(
    x =>
      x.location?.latitude != null &&
      x.location?.longitude != null
  );

}, [
  days,
  selectedDay,
  allPlaces,
  restaurants
]);
useEffect(() => {

  console.log("CHANGE DAY RESET");
  console.log("NEW MAP PLACES", mapPlaces);

  setRoutePlaces([...mapPlaces]);

}, [selectedDay, mapPlaces]);

console.log(
  "FINAL MAP PLACES",
  mapPlaces
);



console.log(
  "FINAL MARKERS",
  mapPlaces.map(x => ({
    number: x.number,
    name: x.name,
    id: x.restaurant_id ?? x.place_id,
    lat: Number(x.location.latitude),
    lng: Number(x.location.longitude)
  }))
);
  const markerCenter =
mapPlaces.length
?
{
 lat:Number(mapPlaces[0].location.latitude),
 lng:Number(mapPlaces[0].location.longitude)
}
:
mapCenter;

  return (
    <div className="flex flex-col gap-3 w-full">
      

      {/* MAP */}
      <div
        className="
  h-[260px]
  rounded-2xl
  overflow-hidden
  "
      >

        <APIProvider
  apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
  libraries={["geometry"]}
>
<Map
  defaultCenter={markerCenter}
  defaultZoom={13}
  mapId="9d5ca48506fddf5eb0fea298"
  gestureHandling="greedy"
  draggable={true}
  disableDefaultUI={false}
>

  <MapUpdater center={markerCenter}/>

            <MapRoute
    places={routePlaces}
    onRouteLoaded={setRouteLegs}
/>
{
  routePlaces.map((place,index)=>(
    <AdvancedMarker
      key={`${place.type}-${place.restaurant_id ?? place.place_id}`}
      position={{
        lat:Number(place.location.latitude),
        lng:Number(place.location.longitude)
      }}
    >
      <div
        className="
        w-8
        h-8
        rounded-full
        bg-black
        text-white
        flex
        items-center
        justify-center
        font-bold
        shadow-lg
        border-2
        border-white
        "
      >
        {index + 1}
      </div>

    </AdvancedMarker>
  ))
}


          </Map>

        </APIProvider>


      </div>



      {/* HEADER */}
      <div>

  <div className="flex items-start justify-between">

    <div>
      <h1 className="text-xl font-bold">
        Trip to {tripInput.province}
      </h1>

      <p className="text-xs text-gray-500">
        {tripInput.days} days itinerary
      </p>
    </div>
<div className="relative">
  <button
  onClick={async () => {
    console.log("CLICK HOTEL BUTTON");

    if (hotelModal) {
      setHotelModal(false);
      return;
    }

    setHotelModal(true);

    if (hotels.length === 0) {
      await loadHotels();
    }
  }}
  className="
    flex
    items-center
    gap-2
    px-4
    py-2
    rounded-xl
    border
    bg-white
    hover:bg-gray-100
    shadow-sm
    text-sm
    font-medium
  "
>
  <Hotel size={16} />
  เพิ่มที่พัก
</button>

  {hotelModal && (
    <div
      className="
        absolute
        right-0
        top-full
        mt-2
        w-[360px]
        rounded-2xl
        border
        bg-white
        shadow-xl
        p-4
        z-50
      "
    >
      <input
        value={hotelSearch}
        onChange={(e) => setHotelSearch(e.target.value)}
        placeholder="ค้นหาโรงแรม..."
        className="
          w-full
          border
          rounded-xl
          px-4
          py-3
          outline-none
        "
      />
      <div className="
mt-3
max-h-72
overflow-y-auto
space-y-2
">

{
hotelLoading ? (

<div className="text-sm text-gray-500">
กำลังโหลดโรงแรม...
</div>

)

:
filteredHotels.map(hotel => (

<button
key={hotel.acc_id}
className="
w-full
flex
gap-3
text-left
border
rounded-xl
p-3
hover:bg-gray-100
"
>

{/* รูปโรงแรม */}
{hotel.images ? (

<img
src={hotel.images}
alt={hotel.acc_name_th}

className="
w-16
h-16
rounded-xl
object-cover
shrink-0
"
/>

) : (

<div
className="
w-16
h-16
rounded-xl
bg-gray-200
shrink-0
flex
items-center
justify-center
"
>
<Hotel size={22} className="text-gray-400"/>
</div>

)}


<div className="flex-1">
<div className="font-semibold text-sm">
  {hotel.acc_name_th}
</div>

<div className="
  text-xs
  text-gray-600
  mt-0.5
">
  {hotel.acc_name_en}
</div>


<div className="text-xs text-gray-500">
{hotel.province_name_th}
</div>


<div className="text-xs text-gray-400">
⭐ {hotel.star_level ?? "-"}
</div>

</div>


</button>

))

}

</div>
    </div>
  )}
</div>

  </div>


        {/* TABS */}
        <div
          className="
          flex
          gap-5
          border-b
          mt-3
          "
        >

          {days.map((_, index) => (
<button
  key={index}
  onClick={() => {
    setSelectedDay(index);

  }}

              className={`
              text-xs
              pb-2
              ${selectedDay === index
                  ? "font-bold border-b-2 border-black"
                  : "text-gray-400"
                }
              `}
            >
              Day {index + 1}

            </button>

          ))}


        </div>




        {/* PLACE LIST */}
       <div className="mt-3 space-y-3 ml-6">
<div className="flex items-center justify-between">

  <h2 className="text-sm font-bold">
    Day {days[selectedDay]?.day}
    {" "}
    {days[selectedDay]?.title}
  </h2>


  <button
    onClick={() =>
      openGoogleMaps(
        days[selectedDay]?.items || []
      )
    }
    className="
      flex
      items-center
      gap-1
      text-xs
      px-3
      py-1.5
      rounded-full
      border
      hover:bg-gray-100
    "
  >
    <img
  src={googleMapIcon}
  className="w-5 h-7"
/>
</button>

</div>
<DndContext
 sensors={sensors}
 collisionDetection={closestCenter}
 onDragEnd={handleDragEnd}
>
  
<SortableContext
  items={routePlaces.map((item) =>
    item.type === "restaurant"
      ? `restaurant-${item.restaurant_id}`
      : `place-${item.place_id}`
  )}
  strategy={verticalListSortingStrategy}
>

{
routePlaces.map((item, index) => (

  <Fragment
key={
  `${selectedDay}-${
    item.type === "restaurant"
      ? `restaurant-${item.restaurant_id}`
      : `place-${item.place_id}`
  }`
}
>

    <SortablePlaceItem
      item={item}
      index={index}
      findPlace={findPlace}
      findRestaurant={findRestaurant}
    />

    {index < routePlaces.length - 1 &&
      routeLegs[index] && (

      <div
        className="
          ml-10
          py-2
          flex
          items-center
          gap-2
          text-sm
          text-gray-500
        "
      >
        <div className="w-px h-6 bg-gray-300 ml-2" />

        <span>
          {" "}
          {routeLegs[index].distanceMeters < 1000
            ? `${routeLegs[index].distanceMeters} เมตร`
            : `${(
                routeLegs[index].distanceMeters / 1000
              ).toFixed(1)} กม.`}
        </span>

      </div>

    )}

  </Fragment>

))
}

</SortableContext>

</DndContext>

<div className="flex justify-end mt-6">
  <button
    className="
      px-5
      py-2
      rounded-lg
      bg-black
      text-white
      text-sm
      font-medium
      hover:bg-gray-800
    "
  >
    Save
  </button>
</div>

</div>


      </div>


    </div>
  );
}
async function loadAllRestaurants() {

  const pageSize = 1000;
  let allRestaurants: any[] = [];

  let from = 0;

  while (true) {

    const {
      data,
      error
    } = await supabase
      .from("restaurant")
      .select("*")
      .range(
        from,
        from + pageSize - 1
      );


    if (error) {
      console.error(error);
      break;
    }


    console.log(
      "restaurant page:",
      from,
      data.length
    );


    if (data.length === 0) {
      break;
    }


    allRestaurants.push(...data);


    if (data.length < pageSize) {
      break;
    }


    from += pageSize;

  }


  console.log(
    "TOTAL RESTAURANTS",
    allRestaurants.length
  );


  return allRestaurants;

}

function Home() {
  const {
    user,
    preferences,
    recommend,
    allPlaces,
    explorePlaces,
    allRecommend,
    setUser,
    setPreferences,
    setRecommend,
    setAllPlaces,
    setExplorePlaces,
    setAllRecommend
  } = useTravelStore();

  const [inspire, setInspire] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<"gemini" | "gpt" | "claude">("gemini");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [hasChatStarted, setHasChatStarted] = useState(false);
  const [tripPlaces, setTripPlaces] = useState<any[]>([]);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [imageIndex, setImageIndex] = useState<Record<string, number>>({});
  const [recommendLoading, setRecommendLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedTravelType, setSelectedTravelType] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string[]>([]);
  const [selectedAtmosphere, setSelectedAtmosphere] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string[]>([]);
  const [selectedCompanion, setSelectedCompanion] = useState<string[]>([]);
  const skeletonCards = Array.from({ length: 6 });
  const [visibleCount, setVisibleCount] = useState(20);
  const [isFiltering, setIsFiltering] = useState(false);
  const [recommendOrder, setRecommendOrder] = useState<Record<string, number>>({});
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [tripModal, setTripModal] = useState(false);
  const [waitingPlanConfirm, setWaitingPlanConfirm] = useState(false);
  const [plannerJson, setPlannerJson] = useState<any[]>([]);
  const [activeStep, setActiveStep] =
    useState<
      "where" |
      "days" |
      "who" |
      "preference" |
      "budget"
    >("where");
type TripInput = {
  province: string;
  days: number | null;
  companion: string;
  budget: number | null;
  travelType: string[];
  activities: string[];
  atmosphere: string[];
};
const [tripInput, setTripInput] = useState<TripInput>({
  province: "",
  days: null,
  companion: "",
  budget: null,

  travelType: [],
  activities: [],
  atmosphere: []
});
  const [mapCenter, setMapCenter] = useState({
    lat: 13.7563,
    lng: 100.5018
  });
  const [restaurants, setRestaurants] = useState([]);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [searchProvince, setSearchProvince] = useState("");
  const [showTripPlan, setShowTripPlan] = useState(false);
  const hasFilter =
    searchText ||
    selectedRegion ||
    selectedTravelType.length > 0 ||
    selectedActivity.length > 0 ||
    selectedAtmosphere.length > 0 ||
    selectedBudget.length > 0 ||
    selectedCompanion.length > 0;

    const loadUserTripPreference = async () => {

  if (!user?.id) return;


  const {
    data,
    error
  } = await supabase
    .from("user_preferences")
    .select(`
      travel_type,
      activities,
      atmosphere
    `)
    .eq(
      "profile_id",
      user.id
    )
    .single();


  if (error) {

    console.error(
      "Load user preference error:",
      error
    );

    return;

  }


  setTripInput(prev => ({
    ...prev,

    travelType:
      data.travel_type || [],

    activities:
      data.activities || [],

    atmosphere:
      data.atmosphere
        ? [data.atmosphere]
        : []

  }));


};
useEffect(() => {

  loadUserTripPreference();

}, [user]);
const aiModels = [
  {
    id: "gemini" as const,
    name: "Gemini",
    icon: geminiIcon,
    description: "Google AI",
  },
  {
    id: "gpt" as const,
    name: "GPT",
    icon: gptIcon,
    description: "OpenAI",
  },
  {
    id: "claude" as const,
    name: "Claude",
    icon: claudeIcon,
    description: "Anthropic",
  },
];

  const loadChatMessages = async (chatId: string) => {

    console.log("LOAD CHAT:", chatId);

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq(
        "session_id",
        chatId
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


    if (error) {
      console.error(error);
      return;
    }
    console.log(data);
console.log(data?.[0]);
console.log(data?.[0]?.planner_json);


    setCurrentChatId(chatId);
    const { data: session } = await supabase
  .from("chat_sessions")
  .select("trip_preferences, ai_model")
  .eq("id", chatId)
  .single();

if (session?.trip_preferences) {
  setTripInput(session.trip_preferences);
}

// โหลด AI model ของ chat นี้
if (
  session?.ai_model === "gemini" ||
  session?.ai_model === "gpt" ||
  session?.ai_model === "claude"
) {
  setSelectedModel(session.ai_model);
}

if (session?.trip_preferences) {
  setTripInput(session.trip_preferences);
}

const formatted = data.map((m) => ({
  role: m.role,
  text: m.content
}));

setMessages(formatted);
// ===============================
// โหลด planner_json
// ===============================

const planner = data
  .filter((m) => m.role === "ai")
  .find((m) => m.planner_json != null);

console.log("🔎 PLANNER MESSAGE:", planner);

if (planner?.planner_json) {

  const json =
    typeof planner.planner_json === "string"
      ? JSON.parse(planner.planner_json)
      : planner.planner_json;

  console.log("🗺️ LOADED PLANNER:", json);
  console.log("IS ARRAY:", Array.isArray(json));
  console.log("LENGTH:", Array.isArray(json) ? json.length : 0);

  setPlannerJson(json);

  // มี planner_json = แสดง TripPlanPanel
  if (Array.isArray(json) && json.length > 0) {
    setShowTripPlan(true);
  } else {
    setShowTripPlan(false);
  }

} else {

  console.log("❌ NO PLANNER JSON");

  setPlannerJson([]);
  setPlan(null);
  setShowTripPlan(false);
}


    setHasChatStarted(true);

  };

  const filteredPlaces = (
    hasFilter
      ? allPlaces
      : explorePlaces
  )
    .filter((place) => {

      const matchSearch =
        place.name_th
          ?.toLowerCase()
          .includes(searchText.toLowerCase());


      const matchRegion =
        selectedRegion
          ? place.region === selectedRegion
          : true;



      // ในกลุ่มเดียวกัน OR
      const matchTravelType =
        selectedTravelType.length > 0
          ? selectedTravelType.some(
            v => place.travel_type?.includes(v)
          )
          : true;



      const matchActivity =
        selectedActivity.length > 0
          ? selectedActivity.some(
            v => place.activities?.includes(v)
          )
          : true;



      const matchAtmosphere =
        selectedAtmosphere.length > 0
          ? selectedAtmosphere.some(
            v => place.atmosphere?.includes(v)
          )
          : true;


      const matchBudget =
        selectedBudget.length > 0
          ? selectedBudget.some(
            v => place.budget?.includes(v)
          )
          : true;


      const matchCompanion =
        selectedCompanion.length > 0
          ? selectedCompanion.some(
            v => place.travel_companion?.includes(v)
          )
          : true;



      // ข้ามกลุ่มเป็น AND
      return (
        matchSearch &&
        matchRegion &&
        matchTravelType &&
        matchActivity &&
        matchAtmosphere &&
        matchBudget &&
        matchCompanion
      );


    })
    .sort((a, b) => {

      const aRank =
        recommendOrder[a.att_id] ?? 99999;

      const bRank =
        recommendOrder[b.att_id] ?? 99999;


      return aRank - bRank;

    });


  const toggleFilter = (
    value: string,
    setter: any,
    current: string[]
  ) => {

    setVisibleCount(20);

    if (current.includes(value)) {
      setter(
        current.filter(v => v !== value)
      );
    } else {
      setter([
        ...current,
        value
      ]);
    }

  };
  const FilterChip = ({
    value,
    selected,
    onClick,
  }: {
    value: string;
    selected: boolean;
    onClick: () => void;
  }) => {

    return (
      <button
        onClick={onClick}
        className={`
        px-3
        py-1.5
        rounded-full
        text-sm
        border
        transition-all
        duration-200
        ${selected
            ?
            "bg-black text-white border-black shadow-sm"
            :
            "bg-white hover:bg-gray-100 border-gray-200"
          }
      `}
      >
        {value}
      </button>
    );
  };

  const FilterButton = ({
    label,
    icon: Icon,
    active,
    onClick,
  }: any) => {

    return (
      <button
        onClick={onClick}
        className={`
flex
items-center
gap-2
px-3
py-2
rounded-xl
text-sm
border
transition-all
duration-200
${active
            ?
            "bg-black text-white border-black shadow-md scale-[1.02]"
            :
            "bg-white hover:bg-gray-100 border-gray-200"
          }
`}
      >

        {Icon && <Icon size={15} />}

        <span>{label}</span>

      </button>
    )

  }

  const provinces = [
    ...new Set(
      allPlaces
        .map((p) => p.province)
        .filter(Boolean)
    ),
  ].sort();


  const filteredProvinces = provinces.filter((province) =>
    province
      .toLowerCase()
      .includes(tripInput.province.toLowerCase())
  );



  const loadExplorePlaces = () => {

    setExploreLoading(true);

    setExplorePlaces(recommend);

    setExploreLoading(false);

  };
  const handleImageError = (
    id: string,
    max: number
  ) => {

    setImageIndex(prev => {

      const current = prev[id] || 0;

      if (current >= max - 1) {
        return prev;
      }

      return {
        ...prev,
        [id]: current + 1
      };

    });

  };
  const changeImage = (
    id: string,
    direction: "next" | "prev",
    max: number
  ) => {

    setImageIndex(prev => {

      const current = prev[id] || 0;

      let nextIndex = current;

      if (direction === "next") {
        nextIndex = current + 1 >= max
          ? 0
          : current + 1;
      }

      if (direction === "prev") {
        nextIndex = current - 1 < 0
          ? max - 1
          : current - 1;
      }

      return {
        ...prev,
        [id]: nextIndex
      };

    });

  };
  const handleExplore = () => {

    setVisibleCount(20);


    setExplorePlaces(
      allRecommend
    );


    setExploreOpen(true);

  };
  const checkTripInput = () => {
  return true;
};

  const handleNewChat = () => {
  setMessages([]);
  setInput("");

  setCurrentChatId(null);
  setHasChatStarted(false);

  setPlan(null);
  setPlannerJson([]);
  setShowTripPlan(false);

  setWaitingPlanConfirm(false);

  setExploreOpen(false);

  // reset planner panel
  setTripPlaces([]);

  // ถ้าต้องการเริ่มทริปใหม่ด้วย
  setTripInput({
    province: "",
    days: null,
    companion: "",
    budget: null,
    travelType: [],
    activities: [],
    atmosphere: [],
  });

  setMapCenter({
    lat: 13.7563,
    lng: 100.5018,
  });
};

const ensureChatSession = async (): Promise<string | null> => {
  // มี session อยู่แล้ว
  if (currentChatId) {
    return currentChatId;
  }

  if (!user?.id) {
    console.error("❌ ไม่มี user.id");
    return null;
  }

  const title = [
  tripInput.province && tripInput.province,
  tripInput.days && `${tripInput.days} วัน`,
  tripInput.companion && `กับ${tripInput.companion}`,
  tripInput.budget && `งบ ${tripInput.budget.toLocaleString()} บาท`,
]
  .filter(Boolean)
  .join(" ");

  console.log("🔥 CREATE CHAT SESSION");
  console.log({
    user_id: user.id,
    title,
    trip_preferences: tripInput,
    ai_model: selectedModel,
  });

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: user.id,
      title,
      trip_preferences: tripInput,
      ai_model: selectedModel,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ CREATE CHAT SESSION ERROR:", error);
    return null;
  }

  console.log("✅ CHAT SESSION CREATED:", data);

  setCurrentChatId(data.id);

  setChatSessions(prev => [
    data,
    ...prev,
  ]);

  return data.id;
};
const handleTripComplete = async () => {
  const chatId = await ensureChatSession();

  if (!chatId) {
    setMessages(prev => [
      ...prev,
      {
        role: "ai",
        text: "ไม่สามารถสร้างแชตได้ กรุณาลองใหม่อีกครั้ง"
      }
    ]);

    return;
  }

  setMessages(prev => [
    ...prev,
    {
      role: "ai",
      text: "ได้เลยครับ ✨ ต้องการให้ผมจัดแพลนจากข้อมูลที่มีตอนนี้เลยไหม?"
    }
  ]);

  setWaitingPlanConfirm(true);
};
const handleSend = async () => {
  if (!input.trim()) return;

  const text = input.trim();
  setInput("");

  // =====================================
  // 1. ถ้าผู้ใช้พิมพ์ว่าต้องการสร้างทริป
  // =====================================

  const wantsTrip =
    text.includes("จัดทริป") ||
    text.includes("จัดแพลน") ||
    text.includes("วางแผนเที่ยว") ||
    text.includes("สร้างทริป");

  if (wantsTrip) {
    setActiveStep("where");
    setTripModal(true);
    return;
  }

  // =====================================
  // 2. สร้าง chat session แม้ข้อมูลยังไม่ครบ
  // =====================================

  let chatId = currentChatId;

  if (!chatId) {
    chatId = await ensureChatSession();

    if (!chatId) {
      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          text: "ไม่สามารถสร้างแชตได้ กรุณาลองใหม่อีกครั้ง"
        }
      ]);

      return;
    }
  }

  setHasChatStarted(true);

  // =====================================
  // 3. ถ้ากำลังรอคำตอบว่าจะจัดทริปไหม
  // =====================================

  if (waitingPlanConfirm) {

    setMessages(prev => [
      ...prev,
      {
        role: "user",
        text
      }
    ]);

    await supabase
      .from("chat_messages")
      .insert({
        session_id: chatId,
        user_id: user.id,
        role: "user",
        content: text
      });

    // ===============================
    // ตอบตกลง
    // ===============================

    const wantsPlan =
      text.includes("ใช่") ||
      text.includes("จัดเลย") ||
      text.includes("ตกลง") ||
      text.includes("เอาเลย") ||
      text.includes("ต้องการ") ||
      text.includes("ครับ");

    if (wantsPlan) {

      setWaitingPlanConfirm(false);

      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          text: "⏳ กำลังสร้างแผนเที่ยว..."
        }
      ]);

      try {

        const result = await createPlanner(
          tripInput,
          chatId,
          user.id,
          selectedModel
        );

        setPlan(result.markdown);
        setPlannerJson(result.planner_json);
        setShowTripPlan(true);

        setExploreOpen(false);

        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            role: "ai",
            text: result
          }
        ]);

      } catch (err) {

        console.error(err);

        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            role: "ai",
            text:
              "ขออภัย ขณะนี้ AI มีผู้ใช้งานจำนวนมาก กรุณาลองใหม่อีกครั้ง"
          }
        ]);

      }

      return;
    }

    // ===============================
    // ถ้าตอบว่าไม่
    // ===============================

    const doesNotWantPlan =
      text.includes("ไม่") ||
      text.includes("ยังไม่") ||
      text.includes("ไม่ต้อง");

    if (doesNotWantPlan) {

      setWaitingPlanConfirm(false);

      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          text: "ได้เลยครับ 😊 ถ้าต้องการวางแผนเที่ยวเมื่อไหร่ บอกผมได้เลย"
        }
      ]);

      return;
    }

    // ถ้าไม่ใช่คำตอบ Yes/No
    setMessages(prev => [
      ...prev,
      {
        role: "ai",
        text:
          "ต้องการให้ผมจัดแพลนจากข้อมูลที่มีตอนนี้เลยไหมครับ?"
      }
    ]);

    return;
  }

  // =====================================
  // 4. ข้อความปกติ
  // =====================================

  setMessages(prev => [
    ...prev,
    {
      role: "user",
      text
    }
  ]);

  const aiText =
    "ได้เลยครับ ✨ ต้องการให้ผมจัดแพลนจากข้อมูลที่มีตอนนี้เลยไหม?";

  setMessages(prev => [
    ...prev,
    {
      role: "ai",
      text: aiText
    }
  ]);

  await supabase
    .from("chat_messages")
    .insert({
      session_id: chatId,
      user_id: user.id,
      role: "ai",
      content: aiText
    });

  setWaitingPlanConfirm(true);
};


  const handleSave = async (place: any) => {

    const {
      data: userData
    } = await supabase.auth.getUser();


    if (!userData.user) return;



    const isSaved =
      savedIds.includes(place.att_id);



    if (isSaved) {


      await supabase
        .from("saved_places")
        .delete()
        .eq(
          "profile_id",
          userData.user.id
        )
        .eq(
          "att_id",
          place.att_id
        );



      setSavedIds(
        savedIds.filter(
          id => id !== place.att_id
        )
      );


      return;

    }



    const {
      error
    } = await supabase
      .from("saved_places")
      .insert({

        profile_id: userData.user.id,

        att_id: place.att_id,

        collection: "Want to go"

      });



    if (!error) {

      setSavedIds([
        ...savedIds,
        place.att_id
      ]);

    }


  };

  useEffect(() => {

    async function loadChats() {

      if (!user) return;


      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq(
          "user_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


      if (!error) {

        setChatSessions(data || []);

      }

    }


    loadChats();


  }, [user]);

  useEffect(() => {

    async function loadSaved() {

      const {
        data: userData
      } = await supabase.auth.getUser();


      if (!userData.user) return;


      const {
        data
      } = await supabase
        .from("saved_places")
        .select("att_id")
        .eq(
          "profile_id",
          userData.user.id
        );


      setSavedIds(
        data?.map(x => x.att_id) || []
      );


    }


    loadSaved();

  }, []);
  useEffect(() => {
  let cancelled = false;

  async function init() {
    try {
      console.log("🚀 HOME INIT");

      // ==========================================
      // 1. ถ้ามีข้อมูลใน Zustand อยู่แล้ว → แสดงทันที
      // ==========================================

      if (
        allPlaces.length > 0 &&
        recommend.length > 0 &&
        explorePlaces.length > 0
      ) {
        console.log("⚡ ใช้ข้อมูลจาก STORE ทันที");

        setRecommendLoading(false);

        // ร้านอาหารไม่ต้องบล็อกหน้า
        loadAllRestaurants().then((data) => {
          if (!cancelled) {
            setRestaurants(data);
          }
        });

        return;
      }

      // ==========================================
      // 2. โหลด Travel Data
      // ==========================================

      console.time("loadTravelData");

      const data = await loadTravelData();

      console.timeEnd("loadTravelData");

      if (!data || cancelled) return;

      setUser(data.user);
      setPreferences(data.preferences);
      setAllPlaces(data.allPlaces);

      // ==========================================
      // 3. Recommendation ต้องโหลดทันที
      // ==========================================

      console.time("recommendation");

      const {
        data: recommendData,
        fromCache,
      } = await loadRecommendationCache(
        data.user.id,
        data.preferences
      );

      console.timeEnd("recommendation");

      if (cancelled) return;

      console.log(
        fromCache
          ? "⚡ ใช้ Recommendation จาก Cache"
          : "🔥 สร้าง Recommendation ใหม่"
      );

      // ==========================================
      // สำคัญมาก
      // SET UI ทันที
      // ==========================================

      setRecommend(
        recommendData.slice(0, 6)
      );

      setExplorePlaces(
        recommendData
      );

      setAllRecommend(
        recommendData
      );

      setRecommendLoading(false);

      console.log(
        "✅ RECOMMEND แสดงแล้ว"
      );

      // ==========================================
      // 4. งานที่ไม่จำเป็นต่อ Recommend
      //    ให้ทำ BACKGROUND
      // ==========================================

      Promise.allSettled([

        // Restaurants
        loadAllRestaurants()
          .then((restaurantsData) => {

            if (!cancelled) {
              console.log(
                "🍜 RESTAURANT TOTAL",
                restaurantsData.length
              );

              setRestaurants(
                restaurantsData
              );
            }

          }),

        // Location
        getUserLocation()
          .then(async (location) => {

            try {

              await supabase
                .from("user_locations")
                .upsert(
                  {
                    user_id: data.user.id,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    updated_at: new Date(),
                  },
                  {
                    onConflict: "user_id",
                  }
                );

              console.log(
                "📍 saved location",
                location
              );

            } catch (err) {

              console.log(
                "location save error",
                err
              );

            }

          })

      ]);

    } catch (err) {

      console.error(
        "❌ LOAD HOME ERROR",
        err
      );

      setRecommendLoading(false);

    }
  }

  init();

  return () => {
    cancelled = true;
  };

}, []);


  return (
    <div className="travel-home flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar
        user={user}
        chatSessions={chatSessions}
        onSelectChat={loadChatMessages}
        onNewChat={handleNewChat}
      />
      {
        tripModal && (

          <div
            className="
fixed
inset-0
z-[100]
bg-black/40
backdrop-blur-md
flex
items-center
justify-center
"
            onClick={() => setTripModal(false)}
          >


            <div
              onClick={(e) => e.stopPropagation()}
              className="
w-[520px]
min-h-[260px]
bg-white
rounded-3xl
shadow-2xl
p-6
"
            >





              {/* Header */}

              <div
                className="
relative
flex
items-center
justify-center
mb-8
"
              >

                <button
                  onClick={() => setTripModal(false)}
                  className="
absolute
left-0
text-2xl
"
                >
                  ×
                </button>


                <h1 className="
font-semibold
text-xl
">
                  {activeStep === "where" && "Where"}

                  {activeStep === "days" && "Days"}

                  {activeStep === "who" && "Who"}

                  {activeStep === "budget" && "Budget"}

                </h1>


              </div>


              {
                activeStep === "where" &&
                <WherePicker
                  tripInput={tripInput}
                  setTripInput={setTripInput}
                  filteredProvinces={filteredProvinces}
                  setActiveStep={setActiveStep}
                  showProvinceDropdown={showProvinceDropdown}
                  setShowProvinceDropdown={setShowProvinceDropdown}
                />

              }


              {
                activeStep === "days" &&
                <DaysPicker
                  tripInput={tripInput}
                  setTripInput={setTripInput}
                  setActiveStep={setActiveStep}
                />
              }


              {
                activeStep === "who" &&
                <WhoPicker
                  tripInput={tripInput}
                  setTripInput={setTripInput}
                  setActiveStep={setActiveStep}
                />
              }


              {
                activeStep === "budget" &&
                <BudgetPicker
                  tripInput={tripInput}
                  setTripInput={setTripInput}
                  setTripModal={setTripModal}
                  onComplete={handleTripComplete}

                />
              }

              {
                activeStep === "preference" &&
                <PreferencePicker
                  tripInput={tripInput}
                  setTripInput={setTripInput}
                  setActiveStep={setActiveStep}
                />
              }


            </div>

          </div>




        )
      }


      {/* Center */}
      <main
        className={`
    travel-main
    flex-1
    flex
    flex-col
    min-w-0
    transition-all
    duration-300
    pr-[600px]
  `}
      >
        {exploreOpen && (
          <div
            className="
      fixed
      inset-0
      z-40
      bg-black/20
      backdrop-blur-sm
    "
            onClick={() => setExploreOpen(false)}
          />
        )}
        <header className="travel-header h-16 flex items-center px-6">
          <button onClick={handleNewChat} className="text-sm font-medium flex items-center gap-1">
            New chat <span className="text-muted-foreground">▾</span>
          </button>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-6 text-sm">
              <button
                onClick={() => {
                  setActiveStep("where");
                  setTripModal(true);
                }}
              >
                Where
                <br />

                <span className="text-xs text-gray-400">
                  {tripInput.province || "Add location"}
                </span>

              </button>



              <button
                onClick={() => {
                  setActiveStep("days");
                  setTripModal(true);
                }}
              >
                Days
                <br />

                <span className="text-xs text-gray-400">
                  {tripInput.days
                    ? `${tripInput.days} วัน`
                    : "Add dates"}
                </span>

              </button>



              <button
                onClick={() => {
                  setActiveStep("who");
                  setTripModal(true);
                }}
              >
                Who
                <br />

                <span className="text-xs text-gray-400">
                  {tripInput.companion || "Add people"}
                </span>

              </button>



              <button
                onClick={() => {
                  setActiveStep("budget");
                  setTripModal(true);
                }}
              >
                Budget
                <br />

                <span className="text-xs text-gray-400">
                  {tripInput.budget
                    ? `${tripInput.budget.toLocaleString()} บาท`
                    : "Add budget"}
                </span>

              </button>


            </div>
          </div>
          <button className="bg-foreground text-background rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Create a trip
          </button>
        </header>

        <div className="flex-1 px-6 overflow-y-auto">
          <div className="
max-w-3xl
mx-auto
w-full
space-y-8
mt-8
">

            {messages.map((m, i) => (

              <div
                key={i}
                className={`
flex
gap-4
${m.role === "user"
                    ?
                    "justify-end"
                    :
                    "justify-start"
                  }
`}
              >


                {/* AI Avatar */}

                {m.role === "ai" && (
  <div
    className="
      w-9
      h-9
      rounded-full
      bg-white
      border
      flex
      items-center
      justify-center
      shrink-0
      overflow-hidden
    "
  >
    <img
      src={
        aiModels.find(
          model => model.id === selectedModel
        )?.icon
      }
      alt={selectedModel}
      className="w-7 h-7 object-contain"
    />
  </div>
)}



                <div
                  className={`
max-w-2xl
text-[15px]
leading-7

${m.role === "user"

                      ?

                      "bg-gray-100 px-5 py-3 rounded-3xl"

                      :

                      ""

                    }

`}
                >
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({ children }) => (
      <h1 className="
        text-2xl
        font-bold
        mt-8
        mb-4
      ">
        {children}
      </h1>
    ),

    h2: ({ children }) => (
      <h2 className="
        text-xl
        font-bold
        mt-6
        mb-3
      ">
        {children}
      </h2>
    ),

    p: ({ children }) => (
      <p className="
        leading-7
        mb-3
      ">
        {children}
      </p>
    ),

    li: ({ children }) => (
      <li className="ml-5 list-disc">
        {children}
      </li>
    ),

    // =========================
    // TABLE
    // =========================

    table: ({ children }) => (
      <div className="
        w-full
        overflow-x-auto
        my-5
        rounded-xl
        border
        border-gray-200
      ">
        <table className="
          min-w-[700px]
          w-full
          border-collapse
          text-sm
        ">
          {children}
        </table>
      </div>
    ),

    thead: ({ children }) => (
      <thead className="
        bg-gray-50
        border-b
        border-gray-200
      ">
        {children}
      </thead>
    ),

    tbody: ({ children }) => (
      <tbody>
        {children}
      </tbody>
    ),

    tr: ({ children }) => (
      <tr className="
        border-b
        border-gray-100
        last:border-b-0
        hover:bg-gray-50
      ">
        {children}
      </tr>
    ),

    th: ({ children }) => (
      <th className="
        px-4
        py-3
        text-left
        font-semibold
        whitespace-nowrap
        align-middle
      ">
        {children}
      </th>
    ),

    td: ({ children }) => (
      <td className="
        px-4
        py-3
        align-top
        leading-6
        whitespace-normal
      ">
        {children}
      </td>
    )
  }}
>
  {
    typeof m.text === "string"
      ? m.text
      : m.text?.markdown ?? ""
  }
</ReactMarkdown>



                  {
                    m.role === "ai" && (

                      <div
                        className="
flex
gap-2
mt-4
"
                      >


                        <button
                          className="
p-2
rounded-full
hover:bg-gray-100
"
                        >
                          <Copy size={16} />
                        </button>


                        <button
                          className="
p-2
rounded-full
hover:bg-gray-100
"
                        >
                          <ThumbsUp size={16} />
                        </button>


                        <button
                          className="
p-2
rounded-full
hover:bg-gray-100
"
                        >
                          <ThumbsDown size={16} />
                        </button>


                      </div>

                    )

                  }


                </div>


              </div>


            ))}


          </div>

        </div>

        {/* Chat input */}
        <div className="px-6 pb-8"></div>
        {!hasChatStarted && (
          <div className="travel-hero flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="text-5xl mb-4">🌍✨</div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Where to today, {user?.user_metadata?.full_name || "Guest"}?
            </h1>

            <p className="text-muted-foreground mt-3 max-w-md">
              Hey there, I'm here to assist you in planning your experience.<br />
              Ask me anything travel related.
            </p>
          </div>
        )}

        {/* Chat input */}
        <div className="px-6 pb-8">
          <div className="travel-composer max-w-2xl mx-auto border border-border rounded-2xl shadow-sm bg-card">
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setHasChatStarted(true);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything"
              className="w-full px-5 pt-4 pb-2 bg-transparent outline-none text-base"
            />
            <div className="flex items-center justify-between px-3 pb-3">

  {/* LEFT SIDE */}
  <div className="flex items-center gap-2">

    {/* Plus */}
    <button
      className="
        h-8 w-8
        rounded-full
        hover:bg-accent
        flex items-center justify-center
      "
    >
      <Plus className="h-4 w-4" />
    </button>

    {/* AI MODEL SELECTOR */}
    <div className="relative">

      <button
  type="button"
  onClick={() => setShowModelMenu(prev => !prev)}
  className="
    flex
    items-center
    gap-2
    px-3
    h-8
    rounded-full
    border
    border-border
    bg-background
    hover:bg-accent
    transition
    text-xs
    font-medium
  "
>
  {/* AI LOGO */}
  <img
    src={
      aiModels.find(
        model => model.id === selectedModel
      )?.icon
    }
    alt="AI"
    className="w-4 h-4 object-contain"
  />

  {/* ชื่อ AI */}
  <span>
    {aiModels.find(
      model => model.id === selectedModel
    )?.name}
  </span>

  {/* ลูกศร */}
  <span className="text-muted-foreground">
    ▾
  </span>
</button>


      {/* MODEL MENU */}
      {showModelMenu && (
        <div
          className="
            absolute
            bottom-11
            left-0
            w-56
            bg-card
            border
            border-border
            rounded-2xl
            shadow-xl
            p-2
            z-50
          "
        >

          <div className="px-3 py-2">
            <p className="text-xs font-semibold">
              เลือก AI
            </p>

            <p className="text-[11px] text-muted-foreground">
              เลือกโมเดลสำหรับช่วยวางแผนท่องเที่ยว
            </p>
          </div>


          {aiModels.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                setSelectedModel(model.id);
                setShowModelMenu(false);
              }}
              className={`
                w-full
                flex
                items-center
                gap-3
                px-3
                py-2.5
                rounded-xl
                text-left
                transition
                ${
                  selectedModel === model.id
                    ? "bg-accent"
                    : "hover:bg-accent/60"
                }
              `}
            >

              <div
                className="
                  w-8
                  h-8
                  rounded-lg
                  bg-muted
                  flex
                  items-center
                  justify-center
                  text-sm
                "
              >
                <img
  src={model.icon}
  alt={model.name}
  className="w-5 h-5 object-contain"
/>
              </div>

              <div className="flex-1">

                <div className="text-sm font-medium">
                  {model.name}
                </div>

                <div className="text-[11px] text-muted-foreground">
                  {model.description}
                </div>

              </div>

              {selectedModel === model.id && (
                <span className="text-xs font-bold">
                  ✓
                </span>
              )}

            </button>
          ))}

        </div>
      )}

    </div>

  </div>


  {/* RIGHT SIDE */}
  <div className="flex items-center gap-1">

    {/* Mic */}
    <button
      className="
        h-8
        w-8
        rounded-full
        hover:bg-accent
        flex
        items-center
        justify-center
      "
    >
      <Mic className="h-4 w-4 text-muted-foreground" />
    </button>


    {/* Send */}
    <button
      onClick={handleSend}
      className="
        h-8
        w-8
        rounded-full
        bg-foreground
        text-background
        flex
        items-center
        justify-center
      "
    >
      <ArrowUp className="h-4 w-4" />
    </button>

  </div>

</div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            ⓘ TravelWise can make mistakes. Check important info.
          </p>
        </div>
      </main>

      {/* Right panel */}
      <aside
        className={`
    fixed
    top-0
    right-0
    h-screen
    bg-background
    border-l
    shadow-2xl
    z-50
    transition-all
    duration-500
    overflow-hidden
    ${exploreOpen ? "w-[80vw]" : "w-[600px]"}
  `}
      >
        {exploreOpen && (
          <button
            onClick={() => setExploreOpen(false)}
            className="
      absolute
      top-4
      right-4
      z-[60]
      rounded-full
      p-2
      hover:bg-accent
      text-lg
    "
          >
            ✕
          </button>
        )}
        <div
          className={`
    h-full
    overflow-y-auto
    p-5
    ${exploreOpen ? "flex gap-6" : "space-y-6"}
  `}
        >
          {exploreOpen && (
            <div
              className="
w-72
shrink-0
border-r
pr-6
space-y-6
overflow-y-auto
h-full
"
            >

              <div className="flex items-center justify-between">

                <h2 className="text-xl font-semibold">
                  Filter
                </h2>


                <button
                  onClick={() => {

                    setSearchText("");
                    setSelectedRegion("");
                    setSelectedTravelType([]);
                    setSelectedActivity([]);
                    setSelectedAtmosphere([]);
                    setSelectedBudget([]);
                    setSelectedCompanion([]);

                  }}
                  className="
text-xs
text-muted-foreground
hover:text-black
"
                >
                  Clear all
                </button>

              </div>


              <div className="
relative
">

                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search destination..."
                  className="
w-full
rounded-2xl
border
bg-gray-50
px-4
py-3
text-sm
outline-none
focus:ring-2
focus:ring-black/20
"
                />


              </div>
              <div>

                <label className="text-sm font-medium">
                  Region
                </label>


                <div className="grid grid-cols-2 gap-2 mt-3">

                  {
                    [
                      "ภาคเหนือ",
                      "ภาคกลาง",
                      "ภาคตะวันออกเฉียงเหนือ",
                      "ภาคตะวันออก",
                      "ภาคใต้"
                    ].map(region => (

                      <FilterButton

                        key={region}

                        label={region}

                        active={
                          selectedRegion === region
                        }

                        onClick={() => {

                          setSelectedRegion(
                            selectedRegion === region
                              ?
                              ""
                              :
                              region
                          )

                        }}

                      />

                    ))

                  }

                </div>

              </div>

              <div>

                <label className="text-sm font-medium">
                  Travel style
                </label>


                <div className="flex flex-wrap gap-2 mt-3">


                  <FilterButton
                    label="ภูเขา"
                    icon={Mountain}
                    active={selectedTravelType.includes("ภูเขา")}
                    onClick={() => toggleFilter(
                      "ภูเขา",
                      setSelectedTravelType,
                      selectedTravelType
                    )}
                  />


                  <FilterButton
                    label="ทะเล"
                    icon={Waves}
                    active={selectedTravelType.includes("ทะเล")}
                    onClick={() => toggleFilter(
                      "ทะเล",
                      setSelectedTravelType,
                      selectedTravelType
                    )}
                  />


                  <FilterButton
                    label="ธรรมชาติ"
                    icon={TreePalm}
                    active={selectedTravelType.includes("ธรรมชาติ")}
                    onClick={() => toggleFilter(
                      "ธรรมชาติ",
                      setSelectedTravelType,
                      selectedTravelType
                    )}
                  />

                  <FilterButton
                    label="วัฒนธรรม"
                    icon={Landmark}
                    active={selectedTravelType.includes("วัฒนธรรม")}
                    onClick={() => toggleFilter(
                      "วัฒนธรรม",
                      setSelectedTravelType,
                      selectedTravelType
                    )}
                  />


                  <FilterButton
                    label="คาเฟ่"
                    icon={Coffee}
                    active={selectedTravelType.includes("คาเฟ่")}
                    onClick={() => toggleFilter(
                      "คาเฟ่",
                      setSelectedTravelType,
                      selectedTravelType
                    )}
                  />


                  <FilterButton
                    label="เมือง"
                    icon={Building2}
                    active={selectedTravelType.includes("เมือง")}
                    onClick={() => toggleFilter(
                      "เมือง",
                      setSelectedTravelType,
                      selectedTravelType
                    )}
                  />


                </div>


              </div>
              <div>

                <label className="text-sm font-medium">
                  Activities
                </label>


                <div className="flex flex-wrap gap-2 mt-3">


                  <FilterButton

                    label="ถ่ายรูป"
                    icon={Camera}
                    active={
                      selectedActivity.includes("ถ่ายรูป")
                    }
                    onClick={() =>
                      toggleFilter(
                        "ถ่ายรูป",
                        setSelectedActivity,
                        selectedActivity
                      )
                    }

                  />


                  <FilterButton

                    label="เดินป่า"
                    icon={Footprints}
                    active={
                      selectedActivity.includes("เดินป่า")
                    }
                    onClick={() =>
                      toggleFilter(
                        "เดินป่า",
                        setSelectedActivity,
                        selectedActivity
                      )
                    }

                  />


                  <FilterButton

                    label="อาหาร"
                    icon={Utensils}
                    active={
                      selectedActivity.includes("อาหาร")
                    }
                    onClick={() =>
                      toggleFilter(
                        "อาหาร",
                        setSelectedActivity,
                        selectedActivity
                      )
                    }

                  />


                  <FilterButton

                    label="ช้อปปิ้ง"
                    icon={ShoppingBag}
                    active={
                      selectedActivity.includes("ช้อปปิ้ง")
                    }
                    onClick={() =>
                      toggleFilter(
                        "ช้อปปิ้ง",
                        setSelectedActivity,
                        selectedActivity
                      )
                    }

                  />


                  <FilterButton

                    label="พักผ่อน"
                    icon={Armchair}
                    active={
                      selectedActivity.includes("พักผ่อน")
                    }
                    onClick={() =>
                      toggleFilter(
                        "พักผ่อน",
                        setSelectedActivity,
                        selectedActivity
                      )
                    }

                  />


                </div>

              </div>

              <div>

                <label className="text-sm font-medium">
                  Atmosphere
                </label>


                <div className="flex flex-wrap gap-2 mt-3">


                  <FilterButton

                    label="คึกคัก"
                    icon={PartyPopper}
                    active={
                      selectedAtmosphere.includes("คึกคัก")
                    }
                    onClick={() =>
                      toggleFilter(
                        "คึกคัก",
                        setSelectedAtmosphere,
                        selectedAtmosphere
                      )
                    }

                  />


                  <FilterButton

                    label="เงียบสงบ"
                    icon={Moon}
                    active={
                      selectedAtmosphere.includes("เงียบสงบ")
                    }
                    onClick={() =>
                      toggleFilter(
                        "เงียบสงบ",
                        setSelectedAtmosphere,
                        selectedAtmosphere
                      )
                    }

                  />


                  <FilterButton

                    label="ผจญภัย"
                    icon={Mountain}
                    active={
                      selectedAtmosphere.includes("ผจญภัย")
                    }
                    onClick={() =>
                      toggleFilter(
                        "ผจญภัย",
                        setSelectedAtmosphere,
                        selectedAtmosphere
                      )
                    }

                  />


                  <FilterButton

                    label="หรูหรา"
                    icon={Crown}
                    active={
                      selectedAtmosphere.includes("หรูหรา")
                    }
                    onClick={() =>
                      toggleFilter(
                        "หรูหรา",
                        setSelectedAtmosphere,
                        selectedAtmosphere
                      )
                    }

                  />


                </div>

              </div>
              <div>

                <label className="text-sm font-medium">
                  Budget
                </label>


                <div className="flex flex-wrap gap-2 mt-3">


                  <FilterButton

                    label="ประหยัด"
                    icon={Coins}
                    active={
                      selectedBudget.includes("ประหยัด")
                    }
                    onClick={() =>
                      toggleFilter(
                        "ประหยัด",
                        setSelectedBudget,
                        selectedBudget
                      )
                    }

                  />


                  <FilterButton

                    label="ปานกลาง"
                    icon={Wallet}
                    active={
                      selectedBudget.includes("ปานกลาง")
                    }
                    onClick={() =>
                      toggleFilter(
                        "ปานกลาง",
                        setSelectedBudget,
                        selectedBudget
                      )
                    }

                  />


                  <FilterButton

                    label="หรูหรา"
                    icon={Gem}
                    active={
                      selectedBudget.includes("หรูหรา")
                    }
                    onClick={() =>
                      toggleFilter(
                        "หรูหรา",
                        setSelectedBudget,
                        selectedBudget
                      )
                    }

                  />


                </div>

              </div>
              <div>

                <label className="text-sm font-medium">
                  Companion
                </label>


                <div className="flex flex-wrap gap-2 mt-3">


                  <FilterButton

                    label="คนเดียว"
                    icon={User}
                    active={
                      selectedCompanion.includes("คนเดียว")
                    }
                    onClick={() =>
                      toggleFilter(
                        "คนเดียว",
                        setSelectedCompanion,
                        selectedCompanion
                      )
                    }

                  />


                  <FilterButton

                    label="คู่รัก"
                    icon={Heart}
                    active={
                      selectedCompanion.includes("คู่รัก")
                    }
                    onClick={() =>
                      toggleFilter(
                        "คู่รัก",
                        setSelectedCompanion,
                        selectedCompanion
                      )
                    }

                  />


                  <FilterButton

                    label="ครอบครัว"
                    icon={Users}
                    active={
                      selectedCompanion.includes("ครอบครัว")
                    }
                    onClick={() =>
                      toggleFilter(
                        "ครอบครัว",
                        setSelectedCompanion,
                        selectedCompanion
                      )
                    }

                  />


                  <FilterButton

                    label="เพื่อน"
                    icon={UserRoundPlus}
                    active={
                      selectedCompanion.includes("เพื่อน")
                    }
                    onClick={() =>
                      toggleFilter(
                        "เพื่อน",
                        setSelectedCompanion,
                        selectedCompanion
                      )
                    }

                  />


                </div>

              </div>
            </div>

          )}
          <div className="flex-1 flex flex-col">
            {showTripPlan && (
  <TripPlanPanel
    key={currentChatId ?? "new"}
    plannerJson={plannerJson}
    plan={plan}
    tripInput={tripInput}
    allPlaces={allPlaces}
    restaurants={restaurants}
    mapCenter={mapCenter}
  />
)}


            {/* Recommend เดิม เอาออกจาก else */}
            {!showTripPlan && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">
                      Recommend for you
                    </h2>

                    <button className="ml-2 text-xs border rounded-full px-2.5 py-1 flex items-center gap-1">
                      <LayoutGrid className="h-3 w-3" />
                      Map
                    </button>
                  </div>

                  {!exploreOpen && (
                    <button
                      onClick={handleExplore}
                      className="text-xs text-muted-foreground hover:text-black"
                    >
                      Explore
                    </button>
                  )}
                </div>


                <div
                  className={`
        grid
        gap-3
        ${exploreOpen
                      ? "grid-cols-4 w-full"
                      : "grid-cols-3 w-full"
                    }
      `}
                >
                  {(
                    recommendLoading
                      ? skeletonCards
                      : (exploreOpen
                        ? filteredPlaces.slice(0, visibleCount)
                        : recommend.slice(0, 6))
                  ).map((c: any, index) => (
                    <div
                      key={c?.att_id ?? index}
                      className="
                    relative
                    rounded-xl
                    overflow-hidden
                    aspect-[3/4]
                    bg-gray-100
                    "
                    >


                      {
                        recommendLoading ? (

                          <div className="
                        absolute
                        inset-0
                        bg-gray-200
                        animate-pulse
                        ">

                            <div className="
                        absolute
                        bottom-5
                        left-3
                        right-3
                        space-y-2
                        ">

                              <div className="
                        h-3
                        w-3/4
                        bg-gray-300
                        rounded
                        "/>

                              <div className="
                        h-3
                        w-1/2
                        bg-gray-300
                        rounded
                        "/>

                            </div>

                          </div>


                        ) : (

                          <>

                            <img
                              src={
                                c.images?.[imageIndex[c.att_id] || 0]
                                || c.image
                              }
                              onError={() =>
                                handleImageError(
                                  c.att_id,
                                  c.images?.length || 0
                                )
                              }
                              className="
  absolute
  inset-0
  h-full
  w-full
  object-cover
  "
                            />

                            {/* Save Heart */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSave(c);
                                console.log("save", c.att_id);
                              }}
                              className={
                                `
absolute
z-30
top-2
left-2
rounded-full
bg-black/40
backdrop-blur-md
flex
items-center
justify-center
hover:bg-black/60
transition
${exploreOpen
                                  ? "w-9 h-9"
                                  : "w-7 h-7"
                                }
${savedIds.includes(c.att_id)
                                  ? "bg-white/90"
                                  : "bg-black/40"
                                }

`}
                            >
                              <Heart
                                size={18}
                                className={
                                  savedIds.includes(c.att_id)
                                    ? "text-rose-500 fill-rose-500"
                                    : "text-white"
                                }
                              />
                            </button>



                            {/* Add Trip */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("add trip", c.att_id);
                              }}
                              className={`
absolute
z-30
top-2
right-2
rounded-full
bg-black/40
backdrop-blur-md
flex
items-center
justify-center
hover:bg-black/60
transition
${exploreOpen
                                  ? "w-9 h-9"
                                  : "w-7 h-7"
                                }
`}
                            >
                              <Plus
                                size={exploreOpen ? 20 : 15}
                                strokeWidth={2.5}
                                className="text-white"
                              />
                            </button>

                            {c.images?.length > 1 && (
                              <>
                                {/* Previous */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    changeImage(
                                      c.att_id,
                                      "prev",
                                      c.images.length
                                    );
                                  }}
                                  className="
  absolute
  z-20
  left-2
  top-1/2
  -translate-y-1/2
  bg-black/40
  text-white
  rounded-full
  w-8
  h-8
  flex
  items-center
  justify-center
  hover:bg-black/70
  "
                                >
                                  ‹
                                </button>


                                {/* Next */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    changeImage(
                                      c.att_id,
                                      "next",
                                      c.images.length
                                    );
                                  }}
                                  className="
      absolute
      z-20
      right-2
      top-1/2
      -translate-y-1/2
      bg-black/40
      text-white
      rounded-full
      w-8
      h-8
      flex
      items-center
      justify-center
      hover:bg-black/70
      "
                                >
                                  ›
                                </button>
                              </>
                            )}
                            <div className="
absolute
inset-0
bg-gradient-to-t
from-black/80
via-black/20
"/>


                            <div className="
absolute
bottom-0
p-3
text-white
">
                              {c.images?.length > 1 && (
                                <div className="flex gap-1 mb-2">

                                  {c.images.map((_: any, i: number) => (
                                    <div
                                      key={i}
                                      className={`
        h-1.5
        rounded-full
        transition-all
        ${(imageIndex[c.att_id] || 0) === i
                                          ? "w-5 bg-white"
                                          : "w-1.5 bg-white/50"
                                        }
        `}
                                    />
                                  ))}

                                </div>

                              )}
                              <div className="
text-sm
font-semibold
line-clamp-2
">
                                {c.name_th}
                              </div>


                              <div className="
mt-1
flex
items-center
gap-1
text-xs
text-white/80
">

                                <MapPin
                                  size={12}
                                  strokeWidth={2}
                                />

                                {c.province}

                              </div>
                            </div>
                          </>
                        )

                      }


                    </div>

                  ))}
                </div>


                {exploreOpen && visibleCount < filteredPlaces.length && (
                  <div className="w-full flex justify-center mt-10 mb-10">
                    <button
                      onClick={() =>
                        setVisibleCount((prev) => prev + 20)
                      }
                      className="
                    px-8
                    py-3
                    rounded-xl
                    border
                    bg-white
                    hover:bg-gray-100
                    shadow-sm
                  "
                    >
                      Load More
                    </button>
                  </div>
                )}

              </>
            )}

            {!exploreOpen && !showTripPlan && (
              <section>
                <h2 className="font-semibold mb-3">
                  Get started
                </h2>

                <div className="grid grid-cols-2 gap-3 w-[430px]">

                  <div className="rounded-2xl overflow-hidden aspect-[4/3] relative cursor-pointer"
                    style={{ background: "linear-gradient(135deg, oklch(0.7 0.15 230), oklch(0.65 0.18 250))" }}>
                    <div className="absolute inset-0 flex items-center justify-center text-6xl">
                      🦩
                    </div>
                    <div className="absolute bottom-3 left-3 text-white font-semibold">
                      Create a trip
                    </div>
                  </div>


                  <div className="rounded-2xl overflow-hidden aspect-[4/3] relative cursor-pointer"
                    style={{ background: "linear-gradient(135deg, oklch(0.85 0.16 80), oklch(0.75 0.18 60))" }}>
                    <div className="absolute inset-0 flex items-center justify-center text-6xl">
                      🏄‍♀️
                    </div>
                    <div className="absolute bottom-3 left-3 text-white font-semibold">
                      Creator tools
                    </div>
                  </div>

                </div>
              </section>
            )}
            {tripPlaces.length > 0 && (
              <section>
                <h2 className="font-semibold mb-3">
                  AI Recommended Places
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  {tripPlaces.map((place) => (
                    <div
                      key={place.att_id}
                      className="rounded-xl overflow-hidden border bg-card shadow-sm hover:shadow-md transition"
                    >
                      <img
                        src={place.image}
                        alt={place.name_th}
                        className="w-full h-36 object-cover"
                      />

                      <div className="p-3">
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {place.name_th}
                        </h3>

                        <p className="text-xs text-muted-foreground mt-1">
                          {place.category}
                        </p>

                        <p className="text-xs mt-2 line-clamp-3">
                          {place.detail_th}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {!exploreOpen && !showTripPlan && (
              <section>
                <h2 className="font-semibold mb-3">
                  Get inspired for you
                </h2>

                <div
                  className={`grid gap-3 ${exploreOpen
                    ? "grid-cols-4"
                    : "grid-cols-3 w-[430px]"
                    }`}
                >
                  {inspire.map((v) => (
                    <div key={v.id} className="rounded-xl overflow-hidden bg-black">
                      <iframe
                        src={v.videoUrl}
                        className="w-full aspect-[9/16]"
                        allowFullScreen
                      />

                      <div className="p-2 text-white text-sm line-clamp-2">
                        {v.title}
                      </div>
                    </div>
                  ))}

                </div>

              </section>
            )}

          </div>
        </div>
      </aside >

    </div >
  );
}