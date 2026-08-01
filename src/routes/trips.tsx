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

    <div
      className="
        flex
        h-screen
        bg-background
        text-foreground
      "
    >


      <Sidebar user={user}/>



      <main
        className="
          flex-1
          overflow-y-auto
          min-w-0
        "
      >


        <header
          className="
            sticky
            top-0
            z-10
            h-14
            border-b
            bg-background/90
            backdrop-blur
            flex
            items-center
            gap-4
            px-8
          "
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

                className="
                  w-full
                  rounded-full
                  border
                  bg-white
                  pl-9
                  pr-4
                  py-2
                  text-sm
                  outline-none
                "

              />

            </div>

          </div>



          <button

             onClick={() => setShowCreateModal(true)}

            className="
              rounded-full
              bg-black
              text-white
              px-5
              py-2
              text-sm
              flex
              items-center
              gap-2
              hover:bg-gray-800
            "

          >

            <Sparkles size={16}/>

            Create Trip

          </button>


        </header>





        <div
          className="
            max-w-6xl
            mx-auto
            px-8
            py-8
          "
        >


          <h2 className="text-3xl font-semibold">
            Upcoming Trips
          </h2>


          <p className="text-gray-500 mt-2">
            {filteredTrips.length} trips planned
          </p>




          <div
            className="
              grid
              xl:grid-cols-3
              md:grid-cols-2
              gap-5
              mt-8
            "
          >



            <button

               onClick={() => setShowCreateModal(true)}

              className="
                border-2
                border-dashed
                rounded-2xl
                min-h-[260px]
                flex
                flex-col
                justify-center
                items-center
                gap-3
                hover:bg-gray-50
              "

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

                  className="
                    rounded-2xl
                    border
                    overflow-hidden
                    animate-pulse
                  "

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

                  className="
                    rounded-2xl
                    overflow-hidden
                    border
                    bg-white
                    hover:shadow-xl
                    transition
                    cursor-pointer
                    group
                  "

                >



                  <div
                    className="
                      relative
                      h-40
                      overflow-hidden
                    "
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
                      className="
                        mt-4
                        space-y-3
                        text-sm
                        text-gray-500
                      "
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
                      className="
                        mt-5
                        w-full
                        rounded-xl
                        border
                        py-2
                        text-sm
                        hover:bg-gray-50
                      "
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
      bg-black/40
      flex
      items-center
      justify-center
      z-50
    "
    onClick={() => setShowCreateModal(false)}
  >

    <div
      className="
        bg-white
        rounded-3xl
        p-8
        w-[420px]
        shadow-xl
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
                h-10
                w-10
                rounded-full
                bg-gray-100
                flex
                items-center
                justify-center
              "
            >

              🗺️

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