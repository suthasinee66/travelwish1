import { supabase } from "@/lib/supabase";
import { rankPlaces } from "./algorithm";
import { GoogleGenAI } from "@google/genai";
import type { TripPlanInput } from "./types";

const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});




/*
 โหลดสถานที่เที่ยวทั้งหมด
 ไม่จำกัด 1000 row
*/
async function loadAllAttractions(
    province: string
) {

    let all: any[] = [];

    let from = 0;

    const size = 1000;


    while (true) {


        const {
            data,
            error
        } = await supabase
            .from("attraction")
            .select("*")
            .eq(
                "province",
                province
            )
            .range(
                from,
                from + size - 1
            );


        if (error) {

            console.log(error);
            break;

        }


        if (!data || data.length === 0)
            break;


        all.push(...data);


        if (data.length < size)
            break;


        from += size;

    }


    return all;

}

async function loadUserPreferences(
    userId: string
) {

    const {
        data,
        error
    } = await supabase
        .from("user_preferences")
        .select("*")
        .eq(
            "profile_id",
            userId
        )
        .single();


    if(error){

        console.error(
            "Load preferences error",
            error
        );

        return null;
    }


    return data;

}

/*
 โหลดร้านอาหารทั้งหมด
*/
async function loadAllRestaurants(province: string) {

    let all: any[] = [];

    let from = 0;

    const size = 1000;

    console.log("province =", JSON.stringify(province));

    while (true) {

        const { data, error } = await supabase
            .from("restaurant")
            .select("*")
            .eq("province_name_th", province.trim())
            .range(from, from + size - 1);

        console.log("Restaurant Error =", error);
        console.log("Restaurant Rows =", data?.length);
        console.log("Restaurant Data =", data?.slice(0, 3));

        if (error) {
            break;
        }

        if (!data || data.length === 0) {
            break;
        }

        all.push(...data);

        if (data.length < size)
            break;

        from += size;
    }

    return all;
}



/*
 Main Planner
*/
export async function createPlanner(
    trip: TripPlanInput,
    chatId: string,
    userId: string
) {

    console.log("==================================================");
    console.log("🚀 เริ่มสร้างแผนเที่ยว");
    console.log("==================================================");

    console.log("📋 ข้อมูลทริป");
    console.log(trip);

    const preferences = await loadUserPreferences(userId);


console.log(
    "🎯 User Preferences",
    preferences
);

    // 1. โหลดสถานที่
    console.log("📍 กำลังโหลดสถานที่...");
    const attractions = await loadAllAttractions(trip.province);
    console.log(`✅ โหลดสถานที่สำเร็จ ${attractions.length} แห่ง`);

    // 2. โหลดร้านอาหาร
    console.log("🍜 กำลังโหลดร้านอาหาร...");
    const restaurants = await loadAllRestaurants(trip.province);
    console.log(`✅ โหลดร้านอาหารสำเร็จ ${restaurants.length} ร้าน`);

    // 3. Algorithm
    console.log("🧮 กำลังจัดอันดับสถานที่...");
    const tripData = {

    ...trip,
travelType:
 trip.travelType?.length
 ?
 trip.travelType
 :
 preferences?.travel_type ?? [],


activities:
 trip.activities?.length
 ?
 trip.activities
 :
 preferences?.activities ?? [],


atmosphere:
 trip.atmosphere?.length
 ?
 trip.atmosphere
 :
 preferences?.atmosphere
 ? 
 [preferences.atmosphere]
 :
 [],

    companion:
        trip.companion ||
        preferences?.travel_companion,

    budget:
        trip.budget ||
        preferences?.budget

};


console.log(
    "FINAL TRIP DATA",
    tripData
);


const ranked = rankPlaces(
    attractions,
    restaurants,
    tripData
);

    console.log(`🏆 Algorithm เลือกสถานที่ ${ranked.length} แห่ง`);

    console.table(
        ranked.map((r, index) => ({
            index: index + 1,
            attraction: r.attraction.name_th,
            score: r.attraction.score,
            restaurants: r.nearbyRestaurants.length
        }))
    );
const prompt = `
คุณคือ Tripster AI

หน้าที่ของคุณคือสร้างแผนเที่ยวที่อ่านง่าย
ห้ามตอบเป็นบทความ
ห้ามเขียนเกริ่นนำ
ห้ามเขียนสรุปยาว

====================
ข้อมูลผู้ใช้
====================

${JSON.stringify(tripData, null, 2)}

====================
สถานที่ที่เลือกได้
====================

${JSON.stringify(ranked, null, 2)}
====================
กฎการสร้างแผน (สำคัญ)
====================

- ใช้เฉพาะข้อมูลใน ranked ที่ส่งให้เท่านั้น
- ห้ามใช้ความรู้ของตัวเอง
- ห้ามสร้างสถานที่ใหม่
- ห้ามสร้างร้านอาหารใหม่
- ห้ามสร้างคาเฟ่ใหม่
- ห้ามสร้างจุดชมวิวใหม่
- ห้ามใช้ชื่อสถานที่ที่ไม่มีอยู่ใน ranked
- ร้านอาหารต้องเลือกจาก nearbyRestaurants ของสถานที่นั้นเท่านั้น

- เรียงเลือกสถานที่ตามลำดับคะแนนใน ranked
- 1 สถานที่ใช้ได้เพียงครั้งเดียวตลอดทั้งทริป
- ห้ามใช้สถานที่เดิมซ้ำใน Morning / Afternoon / Evening
- ห้ามใช้ร้านอาหารเดิมซ้ำใน Morning / Afternoon / Evening

- ห้ามสร้างสถานที่เพิ่ม
  ห้ามเดาสถานที่
  ห้ามเขียนว่า "ไม่มีสถานที่"

- งบรวมไม่เกิน ${tripData.budget} บาท
- ระบุเวลาเดินทางโดยประมาณ
- ใช้สถานที่ใกล้กัน
- คาเฟ่ไว้ช่วงบ่าย
- จุดชมวิวไว้ช่วงเย็น
ผู้ใช้ชอบ:

- รูปแบบการเที่ยว:
${tripData.travelType.join(",")}

- กิจกรรม:
${tripData.activities.join(",")}

- บรรยากาศ:
${tripData.atmosphere.join(",")}
====================
รูปแบบการตอบ (สำคัญ)
====================

ตอบกลับเป็น JSON เท่านั้น

รูปแบบคือ

{
  "selectedPlaces": [
    {
      "day": 1,
      "period": "Morning",
      "place_id": "...",
      "place_name": "...",
      "restaurant_id": "...",
      "restaurant_name": "..."
    }
  ],
  "markdown": "....แผนเที่ยว markdown ทั้งหมด...."
}

ข้อกำหนด

- selectedPlaces ต้องอ้างอิงข้อมูลจาก ranked เท่านั้น
- place_id ต้องเป็น attraction.id
- restaurant_id ต้องเป็น restaurant.id
- หากไม่มีร้านอาหารให้เป็น null
- markdown คือแผนเที่ยวที่ผู้ใช้เห็น
- ห้ามมีข้อความอื่นนอก JSON

ใช้รูปแบบนี้ทุกวัน

---

# ✨ Day 1 - ชื่อธีมของวัน

> คำอธิบายสั้นๆ 1 บรรทัด

☀️ Morning

📍 สถานที่

- ทำอะไร
- ใช้เวลาประมาณ ...
- เดินทางต่อ ... นาที

🍜 Lunch

ร้าน ...

- แนะนำเมนู

🌤 Afternoon

📍 สถานที่

- ทำอะไร

🌅 Evening

📍 สถานที่

- ถ่ายรูป
- ชมวิว

🌙 Dinner

ร้าน ...

---

# ✨ Day 2

...

---

# ✨ Day 3

...

====================

ตอนท้ายให้สรุปเป็น

---

## 💰 สรุปงบ

| รายการ | ราคา |
|--------|------|
| ค่าอาหาร | xxx |
| ค่าเข้า | xxx |
| รวม | xxx |

---

## 📌 Tips

- ...
- ...
ห้ามมีข้อความอื่นนอก JSON

markdown สามารถมีรายละเอียดแผนเที่ยวทั้งหมดได้

ให้เริ่ม markdown ด้วย

# ✨ Day 1

ทันที
`;
console.log(prompt);
    console.log("==================================================");
    console.log("🤖 ส่งข้อมูลให้ Gemini");
    console.log("==================================================");

    console.log("📦 ข้อมูลผู้ใช้");
    console.log(trip);

    console.log("📍 จำนวนสถานที่ที่ส่ง =", ranked.length);

    console.log(
        "📋 รายชื่อสถานที่",
        ranked.map(r => r.attraction.name_th)
    );

    console.log(
        "🍜 ร้านอาหารทั้งหมด",
        ranked.reduce(
            (sum, r) => sum + r.nearbyRestaurants.length,
            0
        )
    );
    console.log

    console.log("📄 Prompt Length =", prompt.length);

    console.log("⏳ Gemini กำลังประมวลผล...");

    const start = performance.now();

    const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
    responseMimeType: "application/json",
    temperature: 0.2
}
});

    const end = performance.now();

    console.log("✅ Gemini ตอบกลับแล้ว");
    console.log(
        `⏱️ ใช้เวลา ${((end - start) / 1000).toFixed(2)} วินาที`
    );

    console.log("📄 Response Length =", response.text?.length ?? 0);
const raw = response.text ?? "";

let result;

try {

    const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

    result = JSON.parse(cleaned);

} catch (e) {

    console.error("Gemini JSON Parse Error");
    console.log(raw);

    throw new Error("Gemini returned invalid JSON");
}

const aiMessage = result.markdown ?? "";

const selectedPlaces = result.selectedPlaces ?? [];
console.log(selectedPlaces);


console.log("💾 กำลังบันทึก planner ลง database...");
const { data, error } = await supabase
.from("chat_messages")
.insert({
    session_id: chatId,
    user_id: userId,
    role: "ai",
    content: aiMessage,
    planner_json: result.selectedPlaces
})
.select();


if(error){

    console.error(
        "❌ บันทึก planner ไม่สำเร็จ",
        error
    );

}
else{

    console.log(
        "✅ บันทึก planner ลง database แล้ว",
        data
    );

}


console.log("🎉 สร้างแผนเที่ยวเสร็จ");
console.log("==================================================");


return aiMessage;

}

