import { supabase } from "@/lib/supabase";
import { getPlaceImage } from "@/lib/google/places";


export async function loadPlaceImages(place:any) {


  // 1. มีรูปใน Supabase แล้ว
  if (
    place.images &&
    place.images.length > 0
  ) {

    return {
      ...place,
      image: place.images[0]
    };

  }



  // 2. ไม่มีรูป -> ยิง Google API

  try {

    const images = await getPlaceImage(
      place.name_th,
      place.province
    );


    if(images?.length){


      // 3. save กลับ Supabase

      await supabase
        .from("attraction")
        .update({
          images
        })
        .eq(
          "att_id",
          place.att_id
        );



      return {
        ...place,
        images,
        image: images[0]
      };


    }


  } catch(err){

    console.error(
      "image load error",
      err
    );

  }



  return place;

}