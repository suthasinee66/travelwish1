import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  Map,
  ArrowLeft,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


export const Route = createFileRoute("/create")({
  component: CreateTrip,
});


function CreateTrip(){

  const navigate = useNavigate();


  const [user,setUser] = useState<any>(null);


  useEffect(()=>{

    loadUser();

  },[]);



  async function loadUser(){

    const {data} =
      await supabase.auth.getUser();

    setUser(data.user);

  }




  return (

    <div
      className="
        flex
        h-screen
        bg-background
      "
    >


      {/* Sidebar */}

      <Sidebar user={user}/>





      {/* Main */}

      <main
        className="
          flex-1
          flex
          items-center
          justify-center
          px-6
        "
      >


        <div
          className="
            w-full
            max-w-xl
            bg-white
            rounded-3xl
            shadow-xl
            p-8
          "
        >



          <button

            onClick={()=>navigate({
              to:"/trips"
            })}

            className="
              flex
              items-center
              gap-2
              text-sm
              text-gray-500
              mb-8
            "

          >

            <ArrowLeft size={16}/>

            Back

          </button>





          <h1 className="text-3xl font-semibold">

            Create New Trip

          </h1>



          <p className="mt-2 text-gray-500">

            Choose how you want to create your trip

          </p>





          <div className="mt-8 space-y-4">



            {/* AI */}

            <button

              onClick={()=>navigate({
                to:"/create_withAI"
              })}

              className="
                w-full
                border
                rounded-2xl
                p-5
                flex
                items-center
                gap-4
                hover:bg-gray-50
                transition
                text-left
              "

            >

              <div
                className="
                  h-12
                  w-12
                  rounded-xl
                  bg-black
                  text-white
                  flex
                  items-center
                  justify-center
                "
              >

                <Sparkles size={22}/>

              </div>



              <div>

                <h2 className="font-semibold text-lg">

                  Plan with AI

                </h2>


                <p className="text-sm text-gray-500">

                  Let AI create itinerary for you

                </p>


              </div>


            </button>






            {/* Manual */}

            <button

              onClick={()=>navigate({
                to:"/create_withManual"
              })}

              className="
                w-full
                border
                rounded-2xl
                p-5
                flex
                items-center
                gap-4
                hover:bg-gray-50
                transition
                text-left
              "

            >


              <div
                className="
                  h-12
                  w-12
                  rounded-xl
                  bg-gray-100
                  flex
                  items-center
                  justify-center
                "
              >

                <Map size={22}/>

              </div>



              <div>

                <h2 className="font-semibold text-lg">

                  Create Manually

                </h2>


                <p className="text-sm text-gray-500">

                  Select places and arrange your route

                </p>


              </div>


            </button>



          </div>



        </div>


      </main>


    </div>

  );

}