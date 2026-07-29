import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);

const model = ai.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function chatWithAI(
  message: string,
  history: any[] = [],
  profile: any = null,
  attraction: any[] = []
) {
  const profileText = profile
    ? `
Personal Profile
- ประเภทการท่องเที่ยว: ${profile.travel_type ?? "-"}
- กิจกรรมที่ชอบ: ${profile.activity ?? "-"}
- บรรยากาศที่ชอบ: ${profile.atmosphere ?? "-"}
- เดินทางกับ: ${profile.travel_companion ?? "-"}
- งบประมาณที่ชอบ: ${profile.budget ?? "-"}
- ช่วงเวลาที่ชอบ: ${profile.travel_time ?? "-"}
- ภูมิภาคที่ชอบ: ${profile.preferred_region ?? "-"}
- เป้าหมายการเดินทาง: ${profile.travel_goal ?? "-"}
`
    : "";

  const attractionText = (attraction ?? [])
  .map(
      (a) => `
id:${a.att_id}
ชื่อ:${a.name_th}
จังหวัด:${a.province}
ประเภท:${a.category}
รายละเอียด:${a.detail_th}
`
    )
    .join("\n");

  const prompt = `
คุณคือ TravelWise AI ผู้ช่วยวางแผนการเดินทาง

====================
Personal Profile
====================

${profileText}

หากผู้ใช้ไม่ได้ตอบข้อมูลบางข้อ
ให้ใช้ข้อมูลจาก Personal Profile เป็นค่าเริ่มต้น

หากผู้ใช้ตอบเอง
ให้ใช้ข้อมูลของผู้ใช้เสมอ

====================
ข้อมูลสถานที่
====================

${attractionText}

====================
Conversation History
====================

${(history ?? [])
  .map((m) => `${m.role}: ${m.text}`)
  .join("\n")}

====================
หน้าที่
====================

รวบรวมข้อมูลต่อไปนี้

1. ไปเที่ยวที่ไหน
2. ไปกี่วัน
3. งบประมาณ
4. ไปกับใคร
5. ชอบเที่ยวแบบไหน

กฎ

- ถามทีละข้อ
- ห้ามถามซ้ำ
- ถ้ารู้คำตอบแล้วไม่ต้องถามอีก
- ถ้าข้อมูลยังไม่ครบ ให้ถามเฉพาะข้อมูลที่ขาด

เมื่อข้อมูลครบ

1. สรุปข้อมูลทั้งหมด
2. วิเคราะห์ Personal Profile
3. เลือกสถานที่จากฐานข้อมูลที่เหมาะสมที่สุด
4. เลือกจำนวน 6-10 สถานที่
5. ห้ามสร้างสถานที่เอง
6. recommendations ต้องเป็น att_id จากฐานข้อมูลเท่านั้น

ตอบเป็น JSON เท่านั้น

{
  "reply":"ข้อความตอบผู้ใช้",

  "tripInfo":{
    "location":"",
    "days":"",
    "budget":"",
    "companions":"",
    "style":""
  },

  "recommendations":[
    "2010051822462910",
    "2010051822462911"
  ],

  "completed":false
}

ข้อความล่าสุดของผู้ใช้

${message}
`;

  const result = await model.generateContent(prompt);

  const raw = result.response.text();

  console.log(raw);

  const json = extractJSON(raw);

  const parsed = JSON.parse(json);

  return {
    reply: parsed.reply ?? "",
    tripInfo: parsed.tripInfo ?? {},
    recommendations: parsed.recommendations ?? [],
    completed: parsed.completed ?? false,
  };
}

function extractJSON(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}