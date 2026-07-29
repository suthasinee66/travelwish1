import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  MessageCircle,
  Briefcase,
  Compass,
  Heart,
  Bell,
  Lightbulb,
  Plus,
  Mic,
  ArrowUp,
  MoreHorizontal,
  MapPin,
  LayoutGrid,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { getRecommendations } from "@/lib/recommend/getRecommendations";
import { getRecommendations as getInspireVideos } from "@/lib/inspire/getRecommendations";
import { chatWithAI } from "@/lib/ai/chat";
import { Link } from "@tanstack/react-router";
import { getPlaceImage } from "@/lib/google/places";
import { loadPlaceImages } from "@/lib/recommend/loadPlaceImages";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Mindtrip — Plan your perfect trip" },
      { name: "description", content: "AI-powered travel planning. Ask anything travel related." },
    ],
  }),
  component: Home,
});

const navItems = [
  { icon: MessageCircle, label: "Chats", badge: 1 },
  { icon: Briefcase, label: "Trips" },
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


function Home() {
  const [user, setUser] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [recommend, setRecommend] = useState<any[]>([]);
  const [inspire, setInspire] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [plan, setPlan] = useState<any>(null);
  const [hasChatStarted, setHasChatStarted] = useState(false);
  const [tripPlaces, setTripPlaces] = useState<any[]>([]);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [explorePlaces, setExplorePlaces] = useState<any[]>([]);
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
  const [allRecommend, setAllRecommend] = useState<any[]>([]);
  const skeletonCards = Array.from({ length: 6 });
  const [visibleCount, setVisibleCount] = useState(20);

  const filteredPlaces = explorePlaces.filter((place) => {


    const matchSearch =
      place.name_th
        ?.toLowerCase()
        .includes(searchText.toLowerCase());



    const matchTravelType =
      selectedTravelType.length
        ? selectedTravelType.some(
          (v) => place.travel_type?.includes(v)
        )
        : true;



    const matchActivity =
      selectedActivity.length
        ? selectedActivity.some(
          (v) => place.activities?.includes(v)
        )
        : true;



    const matchAtmosphere =
      selectedAtmosphere.length
        ? selectedAtmosphere.some(
          (v) => place.atmosphere?.includes(v)
        )
        : true;



    const matchBudget =
      selectedBudget.length
        ? selectedBudget.includes(place.budget)
        : true;



    const matchCompanion =
      selectedCompanion.length
        ? selectedCompanion.some(
          (v) => place.travel_companion?.includes(v)
        )
        : true;



    return (
      matchSearch &&
      matchTravelType &&
      matchActivity &&
      matchAtmosphere &&
      matchBudget &&
      matchCompanion
    );


  });

  const toggleFilter = (
    value: string,
    setter: any,
    current: string[]
  ) => {

    if (current.includes(value)) {

      setter(
        current.filter((v) => v !== value)
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
    setExplorePlaces(allRecommend);
    setExploreOpen(true);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    setHasChatStarted(true);

    const userInput = input;
    const { data: attraction, error } = await supabase
      .from("attraction")
      .select("*");

    if (error) {
      console.error(error);
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userInput,
      },
    ]);

    setInput("");

    try {
      const result = await chatWithAI(
        userInput,
        messages,
        preferences,
        attraction
      );

      console.log(result);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: result.reply,   // ✅ เอาเฉพาะ reply
        },
      ]);

      setPlan(result.tripInfo);
      if (result.completed) {
        const selected = (attraction ?? []).filter((a) =>
          result.recommendations.includes(a.att_id)
        );

        setTripPlaces(selected);
      }

    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "AI ตอบกลับผิดพลาด",
        },
      ]);
    }
  };
  useEffect(() => {
    const loadUser = async () => {

      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) return;

      setUser(userData.user);

      const { data: pref } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("profile_id", userData.user.id)
        .single();

      setPreferences(pref);

      // ⭐ NEW: get recommendation
      // ⭐ Load recommendation immediately
      setRecommendLoading(true);

      getRecommendations(pref)
        .then(async (rec) => {


          // เก็บทั้งหมดไว้สำหรับ Explore
          setAllRecommend(rec);


          // แสดงแค่ 6 อันแรกหน้าแรก
          const firstSix = rec.slice(0, 6);

          setRecommend(firstSix);



          // โหลดรูป 6 อันแรก
          firstSix.forEach(async (place) => {

            const updatedPlace = await loadPlaceImages(place);


            setRecommend(prev =>
              prev.map(item =>
                item.att_id === place.att_id
                  ? updatedPlace
                  : item
              )
            );


            setAllRecommend(prev =>
              prev.map(item =>
                item.att_id === place.att_id
                  ? updatedPlace
                  : item
              )
            );


          });



          // 3. โหลดที่เหลือทีหลัง
          setTimeout(() => {

            const rest = rec.slice(6);

            rest.forEach(async (place) => {

              const updatedPlace = await loadPlaceImages(place);


              setAllRecommend(prev =>
                prev.map(item =>
                  item.att_id === place.att_id
                    ? updatedPlace
                    : item
                )
              );


            });


          }, 5000);



        })
        .finally(() => {

          setRecommendLoading(false);

        });
      // ⭐ Load inspiration separately
      getInspireVideos(pref)
        .then((vids) => {

          console.log("videos loaded", vids);

          setInspire(vids);

        })
        .catch((err) => {

          console.error("video error", err);

        });
    };

    loadUser();
  }, []);
  useEffect(() => {

    if (allRecommend.length > 0) {

      setExplorePlaces(allRecommend);

    }

  }, [allRecommend]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border flex flex-col bg-sidebar">
        <div className="px-5 py-5 flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          <span className="text-lg font-semibold tracking-tight">TravelWise.</span>
        </div>

        <nav className="px-2 flex-1">
          {navItems.map((n) => (
            <button
              key={n.label}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-accent text-sidebar-foreground"
            >
              <n.icon className="h-[18px] w-[18px]" />
              <span className="flex-1 text-left">{n.label}</span>
              {n.badge && (
                <span className="text-xs text-muted-foreground">{n.badge}</span>
              )}
            </button>
          ))}

          <button className="mt-4 w-full text-sm font-medium bg-secondary hover:bg-accent rounded-full py-2.5">
            New chat
          </button>
        </nav>

        {/* PayPal promo */}
        <div className="m-3 rounded-2xl overflow-hidden relative p-4 text-sm text-white"
          style={{ background: "linear-gradient(135deg, oklch(0.75 0.15 320), oklch(0.7 0.18 260))" }}>
          <button className="absolute top-2 right-2 text-white/80">×</button>
          <div className="font-semibold">PayPal</div>
          <div className="font-bold text-base mt-1">Fly Now. Pay Later.</div>
          <div className="text-xs mt-1 opacity-90">Get 5K points when you spend $250.</div>
          <a className="text-xs underline mt-1 inline-block" href="#">Save offer</a>
        </div>

        <div className="border-t border-border p-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {user?.user_metadata?.full_name || user?.email || "Guest"}
            </div>

            <div className="text-xs text-muted-foreground truncate">
              {user?.email}
            </div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="px-4 pb-4 text-[11px] text-muted-foreground space-x-2">
          <span>Company</span>·<span>Contact</span>·<span>Help</span><br />
          <span>Terms</span>·<span>Privacy</span>
          <div className="mt-1">© 2026 Mindtrip, Inc.</div>
        </div>
      </aside>

      {/* Center */}
      <main
        className={`
    flex-1
    flex
    flex-col
    min-w-0
    transition-all
    duration-300
    pr-[480px]
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
        <header className="h-14 flex items-center px-6">
          <button className="text-sm font-medium flex items-center gap-1">
            New chat <span className="text-muted-foreground">▾</span>
          </button>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <button className="hover:text-foreground">Where</button>
              <button className="hover:text-foreground">When</button>
              <button className="hover:text-foreground">Who</button>
              <button className="hover:text-foreground">Budget</button>
            </div>
          </div>
          <button className="bg-foreground text-background rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Create a trip
          </button>
        </header>
        <div className="flex-1 px-6 overflow-y-auto">

          <div className="flex flex-col gap-2 mt-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm p-2 rounded-lg max-w-md ${m.role === "user"
                  ? "bg-blue-500 text-white ml-auto"
                  : "bg-gray-200 text-black mr-auto"
                  }`}
              >
                {m.text}
              </div>
            ))}
          </div>

        </div>

        {/* Chat input */}
        <div className="px-6 pb-8"></div>
        {!hasChatStarted && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
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
          <div className="max-w-2xl mx-auto border border-border rounded-2xl shadow-sm bg-card">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything"
              className="w-full px-5 pt-4 pb-2 bg-transparent outline-none text-base"
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <button className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                <button className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center">
                  <Mic className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={handleSend}
                  className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            ⓘ Mindtrip can make mistakes. Check important info.
          </p>
        </div>
      </main>
      {exploreOpen && (
        <div
          className="
      fixed
      inset-0
      bg-black/30
      backdrop-blur-sm
      z-40
    "
          onClick={() => setExploreOpen(false)}
        />
      )}
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
    ${exploreOpen ? "w-[80vw]" : "w-[480px]"}
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
              w-64
              shrink-0
              border-r
              pr-5
              space-y-5
              "
            >

              <h2 className="font-semibold text-lg">
                Filter
              </h2>


              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search place..."
                className="
                w-full
                border
                rounded-xl
                px-3
                py-2
                text-sm
                "
              />



              <div>

                <label className="text-sm">
                  Region
                </label>

                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full border rounded-lg p-2 mt-1"
                >

                  <option value="">
                    All
                  </option>

                  <option value="ภาคเหนือ">
                    ภาคเหนือ
                  </option>

                  <option value="ภาคกลาง">
                    ภาคกลาง
                  </option>

                  <option value="ภาคใต้">
                    ภาคใต้
                  </option>


                </select>

              </div>



              <div>

                <label className="text-sm font-medium">
                  Travel Type
                </label>


                <div className="space-y-2 mt-2">

                  {
                    [
                      "ภูเขา",
                      "ทะเล",
                      "วัฒนธรรม",
                      "คาเฟ่",
                      "ธรรมชาติ",
                      "เมือง"
                    ].map((item) => (

                      <label
                        key={item}
                        className="flex items-center gap-2 text-sm"
                      >

                        <input
                          type="checkbox"
                          checked={selectedTravelType.includes(item)}
                          onChange={() =>
                            toggleFilter(
                              item,
                              setSelectedTravelType,
                              selectedTravelType
                            )
                          }
                        />

                        {item}

                      </label>

                    ))

                  }

                </div>

              </div>
              <div>

                <label className="text-sm font-medium">
                  Activities
                </label>


                <div className="space-y-2 mt-2">

                  {
                    [
                      "ถ่ายรูป",
                      "เดินป่า",
                      "อาหาร",
                      "ช้อปปิ้ง",
                      "พักผ่อน"
                    ].map((item) => (

                      <label
                        key={item}
                        className="flex items-center gap-2 text-sm"
                      >

                        <input
                          type="checkbox"
                          checked={selectedActivity.includes(item)}
                          onChange={() =>
                            toggleFilter(
                              item,
                              setSelectedActivity,
                              selectedActivity
                            )
                          }
                        />

                        {item}

                      </label>

                    ))

                  }

                </div>

              </div>


              <div>

                <label className="text-sm">
                  Atmosphere
                </label>


                <div className="space-y-2 mt-2">

                  {
                    [
                      "คึกคัก",
                      "เงียบสงบ",
                      "ผจญภัย",
                      "หรูหรา"
                    ].map((item) => (

                      <label
                        key={item}
                        className="flex items-center gap-2 text-sm"
                      >

                        <input
                          type="checkbox"
                          checked={selectedAtmosphere.includes(item)}
                          onChange={() =>
                            toggleFilter(
                              item,
                              setSelectedAtmosphere,
                              selectedAtmosphere
                            )
                          }
                        />

                        {item}

                      </label>

                    ))

                  }

                </div>

              </div>

              <div>

                <label className="text-sm">
                  Budget
                </label>

                <div className="space-y-2 mt-2">

                  {
                    [
                      "ประหยัด",
                      "ปานกลาง",
                      "หรูหรา"
                    ].map((item) => (

                      <label
                        key={item}
                        className="flex items-center gap-2 text-sm"
                      >

                        <input
                          type="checkbox"
                          checked={selectedBudget.includes(item)}
                          onChange={() =>
                            toggleFilter(
                              item,
                              setSelectedBudget,
                              selectedBudget
                            )
                          }
                        />

                        {item}

                      </label>

                    ))

                  }

                </div>

              </div>

              <div>

                <label className="text-sm font-medium">
                  Companion
                </label>


                <div className="space-y-2 mt-2">

                  {
                    [
                      "คนเดียว",
                      "คู่รัก",
                      "ครอบครัว",
                      "เพื่อน"
                    ].map((item) => (

                      <label
                        key={item}
                        className="flex items-center gap-2 text-sm"
                      >

                        <input
                          type="checkbox"
                          checked={selectedCompanion.includes(item)}
                          onChange={() =>
                            toggleFilter(
                              item,
                              setSelectedCompanion,
                              selectedCompanion
                            )
                          }
                        />

                        {item}

                      </label>

                    ))

                  }

                </div>

              </div>

            </div>

          )}
          <div className="flex-1 flex flex-col">
            <section className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">Recommend for you </h2>
                  <button className="ml-2 text-xs border border-border rounded-full px-2.5 py-1 flex items-center gap-1">
                    <LayoutGrid className="h-3 w-3" /> Map
                  </button>
                </div>
                {!exploreOpen && (
                  <button
                    onClick={handleExplore}
                    className="text-sm text-muted-foreground hover:underline"
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
                    : "grid-cols-3 w-[430px]"
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
                          />{c.images?.length > 1 && (
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
                          </div>
                        </>
                      )

                    }


                  </div>

                ))}
              </div>
              {visibleCount < filteredPlaces.length && (
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


            </section>

            {!exploreOpen && (
              <section>
                <h2 className="font-semibold mb-3">Get started</h2>

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
            {!exploreOpen && (
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
      </aside>

    </div>
  );
}
