import { supabase } from "@/lib/supabase";
import { getRecommendations } from "@/lib/recommend/getRecommendations";


export async function loadTravelData(){

const {
 data:userData
}=await supabase.auth.getUser();


if(!userData.user)
return null;



const user=userData.user;



const {
 data:pref
}=await supabase
.from("user_preferences")
.select("*")
.eq(
"profile_id",
user.id
)
.single();



let allData:any[]=[];


const pageSize=1000;

let from=0;


while(true){

const {
data,
error
}=await supabase
.from("attraction")
.select("*")
.range(
from,
from+pageSize-1
);



if(error)
break;


if(!data || data.length===0)
break;



allData=[
...allData,
...data
];



if(data.length < pageSize)
break;


from+=pageSize;

}



const recommend =
await getRecommendations(pref);



const {
data:nearby
}=await supabase
.from("attraction")
.select(`
att_id,
name_th,
province,
images,
travel_type
`)
.limit(8);



return {

user,

preferences:pref,

allPlaces:allData,

recommend,

nearbyPlaces:nearby || []

};


}