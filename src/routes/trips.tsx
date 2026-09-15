import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

import {
  Sparkles,
  Plus,
  Calendar,
  MapPin,
  Users,
  Search,
  Map,
} from "lucide-react";


export const Route = createFileRoute("/trips")({
  component: Trips,
});

function Trips() {

  const navigate = Route.useNavigate();

  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [trips, setTrips] = useState<any[]>([]);

  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);


  useEffect(() => {
    loadTrips();
  }, []);



  async function loadTrips() {

    setLoading(true);


    const { data: auth } =
      await supabase.auth.getUser();


    if (!auth.user) {

      setLoading(false);
      return;

    }


    setUser(auth.user);



    const { data, error } =
      await supabase
        .from("trip")
        .select(`
          *,
          trip_places(
            id,
            day,
            sort_order,
            attraction(
              att_id,
              name_th,
              province,
              images
            )
          )
        `)
        .eq(
          "profile_id",
          auth.user.id
        )
        .order(
          "created_at",
          {
            ascending:false
          }
        );



    if(error){

      console.error(error);
      setTrips([]);

    }else{

      setTrips(data || []);

    }


    setLoading(false);

  }



  const filteredTrips =
    useMemo(()=>{

      if(!search.trim())
        return trips;


      return trips.filter((trip)=>

        trip.title
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )

      );

    },[
      trips,
      search
    ]);




  async function createTrip(){

    if(!user)
      return;



    const {error} =
      await supabase
        .from("trip")
        .insert({

          profile_id:user.id,

          title:"New Trip",

          destination:"",

          image:null,

          people:"1 traveler"

        });



    if(error){

      console.error(error);
      return;

    }


    loadTrips();

  }




  function formatDate(
    date:string|null
  ){

    if(!date)
      return "-";


    return new Date(date)
      .toLocaleDateString(
        "en-GB",
        {
          day:"numeric",
          month:"short",
          year:"numeric"
        }
      );

  }




  function getCover(
    trip:any
  ){

    if(trip.image)
      return trip.image;



    const img =
      trip.trip_places
      ?.find(
        (x:any)=>
          x.attraction
          ?.images
          ?.length > 0
      )
      ?.attraction
      ?.images?.[0];



    return (
      img ||
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200"
    );

  }




  function getStops(
    trip:any
  ){

    return (
      trip.trip_places?.length || 0
    );

  }



  return (

<div className="travel-trips aurora-canvas flex min-h-screen text-[#49334f]">


      <Sidebar user={user}/>



      <main
        className="
          flex-1
          overflow-y-auto
          min-w-0
        "
      >


        <header
          className="travel-header sticky top-0 z-10 flex min-h-16 items-center gap-4 px-4 sm:px-8"
        >


          <h1 className="text-sm font-semibold">
            Trips
          </h1>



          <div
            className="
              flex-1
              flex
              justify-center
            "
          >

            <div
              className="
                relative
                w-full
                max-w-sm
              "
            >

              <Search
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  h-4
                  w-4
                  text-gray-400
                "
              />


              <input

                value={search}

                onChange={(e)=>
                  setSearch(e.target.value)
                }

                placeholder="Search your trips..."

                className="pastel-input w-full rounded-full border px-4 py-2 pl-9 text-sm outline-none"

              />

            </div>

          </div>



          <button

             onClick={() => setShowCreateModal(true)}

            className="pastel-primary flex items-center gap-2 rounded-full px-5 py-2 text-sm"

          >

            <Sparkles size={16}/>

            Create Trip

          </button>


        </header>





        <div
          className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10"
        >


          <div className="mb-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a2779f]">Your travel journal</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Upcoming Trips</h2>
              <p className="mt-2 text-sm text-[#806f88]">Every plan, place, and memory in one beautiful space.</p>
            </div>
            <div className="rounded-2xl bg-white/55 px-4 py-3 text-right shadow-sm ring-1 ring-white/70">
              <div className="text-2xl font-semibold">{filteredTrips.length}</div>
              <div className="text-xs text-[#806f88]">trips planned</div>
            </div>
          </div>




          <div
            className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >



            <button

               onClick={() => setShowCreateModal(true)}

              className="trip-create-card hover-lift flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-[#c9a8c8]/70 bg-white/35 text-[#49334f]"

            >

              <div
                className="
                  h-12
                  w-12
                  rounded-full
                  bg-gray-100
                  flex
                  items-center
                  justify-center
                "
              >

                <Plus size={22}/>

              </div>


              <span className="font-medium">
                New Trip
              </span>


            </button>





            {loading &&

              Array
              .from({length:5})
              .map((_,i)=>(

                <div

                  key={i}

className="glass-surface animate-fade-up overflow-hidden rounded-3xl border-white/70"

                >

                  <div className="h-40 bg-gray-200"/>

                  <div className="p-5 space-y-3">

                    <div className="h-5 bg-gray-200 rounded"/>

                    <div className="h-4 bg-gray-100 rounded"/>

                    <div className="h-4 bg-gray-100 rounded"/>

                  </div>

                </div>

              ))

            }





            {!loading &&

              filteredTrips.map((trip)=>(


                <div

                  key={trip.id}

                  onClick={()=>{

                    navigate({

                      to:"/trips/$id",

                      params:{
                        id:trip.id
                      }

                    });

                  }}

                  className="trip-card glass-surface group hover-lift overflow-hidden rounded-[28px] cursor-pointer border-white/70"

                >



                  <div
                    className="relative h-48 overflow-hidden"
                  >

                    <img

                      src={getCover(trip)}

                      alt={trip.title}

                      className="
                        h-full
                        w-full
                        object-cover
                        group-hover:scale-105
                        transition
                      "

                    />



                    <div

                      className="
                        absolute
                        top-3
                        right-3
                        rounded-full
                        bg-black/70
                        text-white
                        text-xs
                        px-2
                        py-1
                      "

                    >

                      {getStops(trip)} stops

                    </div>


                  </div>





                  <div className="p-5">


                    <h3 className="font-semibold text-lg">

                      {trip.title}

                    </h3>




                    <div
                      className="mt-4 flex flex-col gap-3 text-sm text-[#806f88]"
                    >


                      <div className="flex items-center gap-2">

                        <Calendar size={16}/>

                        {formatDate(trip.start_date)}

                        {" - "}

                        {formatDate(trip.end_date)}

                      </div>




                      <div className="flex items-center gap-2">

                        <MapPin size={16}/>

                        {trip.destination || "No destination"}

                      </div>




                      <div className="flex items-center gap-2">

                        <Users size={16}/>

                        {trip.people || "1 traveler"}

                      </div>



                    </div>




                    <button
                      className="mt-5 w-full rounded-full border border-[#c9a8c8]/60 bg-white/45 py-2.5 text-sm font-medium transition hover:bg-white/75"
                    >

                      View Trip

                    </button>



                  </div>



                </div>


              ))

            }




            {!loading &&
              filteredTrips.length===0 && (

                <div
                  className="
                    col-span-full
                    py-20
                    text-center
                    text-gray-500
                  "
                >

                  No trips found.

                </div>

              )
            }




          </div>


        </div>

{showCreateModal && (

  <div
    className="
      fixed
      inset-0
      flex
      items-center
      justify-center
      bg-[#49334f]/35
      p-4
      backdrop-blur-sm
      z-50
    "
    onClick={() => setShowCreateModal(false)}
  >

    <div
      className="
        glass-surface
        w-full
        max-w-[420px]
        rounded-3xl
        border-white/70
        p-6
        shadow-2xl sm:p-8
      "
      onClick={(e)=>e.stopPropagation()}
    >


      <h2 className="text-2xl font-semibold">
        Create New Trip
      </h2>


      <p className="text-gray-500 mt-2">
        How would you like to plan your trip?
      </p>



      <div className="mt-6 space-y-4">


        <button

          onClick={()=>{
            setShowCreateModal(false);

            navigate({
              to:"/create_withAI"
            });

          }}

          className="
            w-full
            rounded-2xl
            border
            p-5
            text-left
            hover:bg-gray-50
            transition
          "

        >

          <div className="flex items-center gap-3">

            <div
              className="
                h-10
                w-10
                rounded-full
                bg-black
                text-white
                flex
                items-center
                justify-center
              "
            >

              <Sparkles size={18}/>

            </div>


            <div>

              <h3 className="font-semibold">
                Plan with AI
              </h3>

              <p className="text-sm text-gray-500">
                Let AI create your itinerary
              </p>

            </div>

          </div>


        </button>





        <button

          onClick={async()=>{

            setShowCreateModal(false);

            await createTrip();

          }}

          className="
            w-full
            rounded-2xl
            border
            p-5
            text-left
            hover:bg-gray-50
            transition
          "

        >

          <div className="flex items-center gap-3">


              <div
              className="
                flex
                size-10
                items-center
                justify-center
                rounded-full
                bg-[#f1e8f7]
                text-[#80618d]
              "
            >

              <Map size={18}/>

            </div>



            <div>

              <h3 className="font-semibold">
                Create manually
              </h3>


              <p className="text-sm text-gray-500">
                Choose places and arrange your trip
              </p>


            </div>


          </div>


        </button>



      </div>


    </div>


  </div>

)}

      </main>


    </div>

  );

}
