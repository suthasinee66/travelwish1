import { GoogleGenAI } from "@google/genai";
import { createPlanner } from "./planner";


const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});


/* ==========================
   Types
========================== */

export interface TripInfo {

  province:string | null;

  days:number | null;

  budget:number | null;

  companion:string | null;

  travelType:string[];

  activities:string[];

  atmosphere:string | null;

}


export interface ChatResult {

  reply:string;

  completed:boolean;

  tripInfo:TripInfo;

}



/* ==========================
   Memory
========================== */


let currentTrip:TripInfo = {

  province:null,

  days:null,

  budget:null,

  companion:null,

  travelType:[],

  activities:[],

  atmosphere:null

};



export function resetTrip(){

 currentTrip={

  province:null,

  days:null,

  budget:null,

  companion:null,

  travelType:[],

  activities:[],

  atmosphere:null

 };

}



/* ==========================
   Extract User Data
========================== */

function extractTripInfoFast(message:string){

const text = message.toLowerCase();


const data:any = {
 province:null,
 days:null,
 budget:null,
 companion:null,
 travelType:[],
 activities:[],
 atmosphere:null
};



// จังหวัด

const provinces=[
"เชียงใหม่",
"เชียงราย",
"กรุงเทพมหานคร",
"ภูเก็ต",
"กระบี่",
"พังงา",
"ชลบุรี",
"กาญจนบุรี"
];


for(const p of provinces){

 if(text.includes(p)){
   data.province=p;
   break;
 }

}


// วัน

const day =
text.match(/(\d+)\s*วัน/);


if(day){
 data.days=Number(day[1]);
}


// งบ

const money =
text.match(/(\d[\d,]*)\s*(บาท|฿)?/);


if(money){

 data.budget=
 Number(
  money[1].replace(",","")
 );

}


// คนไปด้วย


if(
 text.includes("แฟน") ||
 text.includes("คู่รัก")
){

 data.companion="คู่รัก";

}


else if(text.includes("เพื่อน")){

 data.companion="เพื่อน";

}


else if(text.includes("ครอบครัว")){

 data.companion="ครอบครัว";

}


else if(text.includes("คนเดียว")){

 data.companion="คนเดียว";

}



// ประเภท

const types=[
"ทะเล",
"ภูเขา",
"ธรรมชาติ",
"คาเฟ่",
"วัฒนธรรม",
"เมือง"
];


data.travelType =
types.filter(t=>text.includes(t));




// activity

const acts=[
"ถ่ายรูป",
"เดินป่า",
"อาหาร",
"ช้อปปิ้ง",
"พักผ่อน"
];


data.activities =
acts.filter(a=>text.includes(a));



return data;

}



/* ==========================
   Update Memory
========================== */
async function updateTrip(message: string) {

  // 1. ดึงข้อมูลด้วย Regex ก่อน
  let data = extractTripInfoFast(message);

  console.log("⚡ FAST:", data);

  // 2. ถ้าข้อมูลยังไม่ครบ ใช้ Gemini ช่วย
  if (needAI(data)) {

    try {

      const aiData = await extractTripInfo(message);

      console.log("🤖 GEMINI:", aiData);

      data = {

        province: data.province ?? aiData.province,
        days: data.days ?? aiData.days,
        budget: data.budget ?? aiData.budget,
        companion: data.companion ?? aiData.companion,
        travelType:
          data.travelType.length > 0
            ? data.travelType
            : aiData.travelType ?? [],
        activities:
          data.activities.length > 0
            ? data.activities
            : aiData.activities ?? [],
        atmosphere:
          data.atmosphere ?? aiData.atmosphere

      };

    } catch (err) {

      console.log("Gemini parse failed", err);

    }

  }

  if (data.province)
    currentTrip.province = data.province;

  if (data.days)
    currentTrip.days = data.days;

  if (data.budget)
    currentTrip.budget = data.budget;

  if (data.companion)
    currentTrip.companion = data.companion;

  if (data.travelType.length)
    currentTrip.travelType = data.travelType;

  if (data.activities.length)
    currentTrip.activities = data.activities;

  if (data.atmosphere)
    currentTrip.atmosphere = data.atmosphere;

  console.log("📦 CURRENT:", currentTrip);

}

/* ==========================
   Check Complete
========================== */

function isComplete() {

    return (
        currentTrip.province &&
        currentTrip.days &&
        currentTrip.budget &&
        currentTrip.companion &&
        currentTrip.travelType.length > 0
    );

}



/* ==========================
   Question
========================== */


/* ==========================
   Main Chat
========================== */
export async function chatWithAI(
  message:string,
  messages?:any[],
  preferences?:any,
  attraction?:any[],
  tripInput?:any
):Promise<ChatResult>{

if (tripInput) {

    if (tripInput.province)
        currentTrip.province = tripInput.province;

    if (tripInput.days)
        currentTrip.days = tripInput.days;

    if (tripInput.budget)
        currentTrip.budget = tripInput.budget;

    if (tripInput.companion)
        currentTrip.companion = tripInput.companion;

    if (tripInput.travelType?.length)
        currentTrip.travelType = tripInput.travelType;

    if (tripInput.activities?.length)
        currentTrip.activities = tripInput.activities;

    if (tripInput.atmosphere)
        currentTrip.atmosphere = tripInput.atmosphere;
}


await updateTrip(message);


if(!isComplete()){


return {

 reply:
 "ข้อมูลทริปยังไม่ครบครับ กรุณากรอกข้อมูลให้ครบก่อน",

 completed:false,

 tripInfo:currentTrip

};


}


const plan =
await createPlanner(
 currentTrip as any
);



return {

reply: plan,

completed:true,


tripInfo:currentTrip


};



}

async function extractTripInfo(message:string){

const response =
await ai.models.generateContent({

model:"gemini-2.5-flash",
contents: `
อ่านข้อความของผู้ใช้

"${message}"

แยกข้อมูลการท่องเที่ยว

กฎ

- "หมื่น" = 10000
- "สองหมื่น" = 20000
- "ห้าพัน" = 5000
- "สุดสัปดาห์หน้า" = 2 วัน
- "วันเดียว" = 1 วัน
- "สองคืน" = 2 วัน
- "สามคืน" = 3 วัน
- "แฟน" = "คู่รัก"
- "เมีย" = "คู่รัก"
- "ภรรยา" = "คู่รัก"
- "ลูก" = "ครอบครัว"

ตอบ JSON เท่านั้น

{
  "province": null,
  "days": null,
  "budget": null,
  "companion": null,
  "travelType": [],
  "activities": [],
  "atmosphere": null
}
`

});


const text=response.text ?? "";


return JSON.parse(
text
.replace(/```json/g,"")
.replace(/```/g,"")
.trim()
);


}
function needAI(data: any) {

  return  (
    data.province == null ||
    data.days == null ||
    data.budget == null ||
    data.companion == null ||
    !data.travelType ||
    data.travelType.length === 0
  );

}




