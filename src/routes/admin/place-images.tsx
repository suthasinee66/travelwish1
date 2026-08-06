import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Image,
  Loader2,
  Search,
  Save,
  Plus,
  Trash2,
  CheckCircle,
} from "lucide-react";


export const Route = createFileRoute(
  "/admin/place-images"
)({
  component: PlaceImagesPage,
});


function PlaceImagesPage(){

  const [places,setPlaces] = useState<any[]>([]);
  const [loading,setLoading] = useState(false);

  const [search,setSearch] = useState("");

  const [selected,setSelected] = useState<any>(null);

  const [urls,setUrls] = useState<string[]>([
    ""
  ]);

  const [type,setType] = useState<
  "attraction" | "restaurant"
>("attraction");
async function loadPlaces(){

  setLoading(true);

  let allPlaces:any[] = [];

  const pageSize = 1000;

  let from = 0;


  while(true){

    const query =
      type === "attraction"
      ?
      supabase
        .from("attraction")
        .select(`
          att_id,
          name_th,
          province,
          images
        `)
      :
      supabase
        .from("restaurant")
        .select(`
          id,
          place_name_th,
          province_name_th,
          images
        `);



    const {
      data,
      error
    } = await query
      .order(
        type === "attraction"
        ? "name_th"
        : "place_name_th"
      )
      .range(
        from,
        from + pageSize - 1
      );



    if(error){
      console.error(error);
      break;
    }



    if(!data || data.length===0)
      break;



    const mapped =
      type === "attraction"
      ?
      data
      :
      data.map(r=>({
        att_id:r.id,
        name_th:r.place_name_th,
        province:r.province_name_th,
        images:r.images
      }));


    allPlaces.push(
      ...mapped
    );


    if(data.length < pageSize)
      break;


    from += pageSize;

  }



  setPlaces(allPlaces);


  console.log(
    type,
    allPlaces.length
  );


  setLoading(false);

}



  useEffect(()=>{

  loadPlaces();

},[type]);



  function openEditor(place:any){

    setSelected(place);

    setUrls(
      place.images?.length
      ?
      place.images
      :
      [""]
    );

  }




  function addUrl(){

    setUrls([
      ...urls,
      ""
    ]);

  }




  function removeUrl(index:number){

    setUrls(
      urls.filter(
        (_,i)=>i!==index
      )
    );

  }




  function changeUrl(
    index:number,
    value:string
  ){

    const copy=[...urls];

    copy[index]=value;

    setUrls(copy);

  }



async function saveImages(){

  if(!selected)
    return;


  const images =
    urls.filter(
      url =>
      url.trim() !== ""
    );


  const table =
    type === "attraction"
    ? "attraction"
    : "restaurant";


  const idColumn =
    type === "attraction"
    ? "att_id"
    : "id";


  const {error} =
    await supabase
      .from(table)
      .update({
        images
      })
      .eq(
        idColumn,
        selected.att_id
      );


  if(error){

    console.error(error);
    return;

  }


  setPlaces(prev =>
    prev.map(item =>
      item.att_id === selected.att_id
      ?
      {
        ...item,
        images
      }
      :
      item
    )
  );


  setSelected(null);

}


  const filtered =
    places.filter(place=>
      place.name_th
      ?.toLowerCase()
      .includes(
        search.toLowerCase()
      )
    );





  return (

    <div className="
      min-h-screen
      bg-gray-50
      p-8
    ">


      <div className="
        max-w-6xl
        mx-auto
      ">

<h1 className="
  text-3xl
  font-bold
  mb-6
">
  Place Images Manager
</h1>


{/* เลือกประเภท */}
<div className="
  flex
  gap-3
  mb-5
">

  <button
    onClick={()=>setType("attraction")}
    className={`
      px-4
      py-2
      rounded-lg
      ${
        type==="attraction"
        ? "bg-black text-white"
        : "bg-gray-200"
      }
    `}
  >
    สถานที่ท่องเที่ยว
  </button>


  <button
    onClick={()=>setType("restaurant")}
    className={`
      px-4
      py-2
      rounded-lg
      ${
        type==="restaurant"
        ? "bg-black text-white"
        : "bg-gray-200"
      }
    `}
  >
    ร้านอาหาร
  </button>

</div>



<div className="
  bg-white
  rounded-xl
  p-4
  mb-6
  flex
  gap-3
">

  <Search/>

  <input
    className="
      flex-1
      outline-none
    "
    placeholder="
      ค้นหาสถานที่
    "
    value={search}
    onChange={
      e=>setSearch(
        e.target.value
      )
    }
  />

</div>





        {
          loading

          ?

          <Loader2
            className="
              animate-spin
            "
          />

          :

          <div className="
            bg-white
            rounded-xl
            overflow-hidden
          ">


          {
            filtered.map(place=>(


              <div
                key={
                  place.att_id
                }
                className="
                  flex
                  justify-between
                  items-center
                  p-5
                  border-b
                "
              >


                <div>

                  <h2 className="
                    font-semibold
                  ">
                    {place.name_th}
                  </h2>


                  <p className="
                    text-gray-500
                  ">
                    {place.province}
                  </p>


                  <div className="
                    flex
                    gap-2
                    mt-2
                  ">


                  {
                    place.images?.length

                    ?

                    <>
                    <CheckCircle
                      size={18}
                    />

                    {place.images.length}
                    {" "}
                    รูป
                    </>


                    :

                    <>
                    <Image size={18}/>
                    ไม่มีรูป
                    </>


                  }


                  </div>

                </div>




                <button
                  onClick={()=>
                    openEditor(place)
                  }
                  className="
                    px-4
                    py-2
                    rounded-lg
                    bg-black
                    text-white
                  "
                >

                  จัดการรูป

                </button>


              </div>


            ))
          }


          </div>

        }



      </div>





      {
        selected &&

        <div className="
          fixed
          inset-0
          bg-black/40
          flex
          items-center
          justify-center
        ">


          <div className="
            bg-white
            rounded-xl
            p-6
            w-[600px]
          ">


            <h2 className="
              text-xl
              font-bold
              mb-4
            ">

              {selected.name_th}

            </h2>




            {
              urls.map((url,index)=>(


                <div
                  key={index}
                  className="
                    flex
                    gap-2
                    mb-3
                  "
                >

                  <input
                    value={url}
                    onChange={
                      e=>
                      changeUrl(
                        index,
                        e.target.value
                      )
                    }
                    placeholder="
                      https://example.com/image.jpg
                    "
                    className="
                      flex-1
                      border
                      rounded-lg
                      px-3
                      py-2
                    "
                  />



                  <button
                    onClick={()=>
                      removeUrl(index)
                    }
                  >

                    <Trash2/>

                  </button>


                </div>


              ))
            }





            <button
              onClick={addUrl}
              className="
                flex
                items-center
                gap-2
                mb-5
              "
            >

              <Plus/>

              เพิ่ม URL

            </button>




            <div className="
              grid
              grid-cols-3
              gap-3
              mb-5
            ">

            {
              urls
              .filter(x=>x)
              .map((url,index)=>(

                <img
                  key={index}
                  src={url}
                  className="
                    h-24
                    w-full
                    object-cover
                    rounded-lg
                  "
                />

              ))
            }

            </div>





            <div className="
              flex
              justify-end
              gap-3
            ">


              <button
                onClick={()=>
                  setSelected(null)
                }
                className="
                  px-4
                  py-2
                  rounded-lg
                  bg-gray-200
                "
              >

                ยกเลิก

              </button>



              <button
                onClick={saveImages}
                className="
                  px-4
                  py-2
                  rounded-lg
                  bg-black
                  text-white
                  flex
                  gap-2
                "
              >

                <Save size={18}/>

                บันทึก

              </button>


            </div>


          </div>


        </div>

      }



    </div>

  );

}