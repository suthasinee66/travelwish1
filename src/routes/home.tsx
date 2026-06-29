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
            <div className="text-sm font-medium truncate">สุธาสินี บุตรลพ</div>
            <div className="text-xs text-muted-foreground truncate">@stsnbl2005</div>
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
      <main className="flex-1 flex flex-col min-w-0">
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

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl mb-4">🌍✨</div>
          <h1 className="text-3xl font-semibold tracking-tight">Where to today, สุธาสินี?</h1>
          <p className="text-muted-foreground mt-3 max-w-md">
            Hey there, I'm here to assist you in planning your experience.<br />
            Ask me anything travel related.
          </p>
        </div>

        {/* Chat input */}
        <div className="px-6 pb-8">
          <div className="max-w-2xl mx-auto border border-border rounded-2xl shadow-sm bg-card">
            <input
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
                <button className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center">
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

      {/* Right panel */}
      <aside className="w-[480px] shrink-0 border-l border-border overflow-y-auto p-5 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Recommend for you </h2>
              <button className="ml-2 text-xs border border-border rounded-full px-2.5 py-1 flex items-center gap-1">
                <LayoutGrid className="h-3 w-3" /> Map
              </button>
            </div>
            <a className="text-sm text-muted-foreground hover:underline" href="#">Explore</a>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {forYou.map((c) => (
              <div key={c.title} className="relative rounded-xl overflow-hidden aspect-[3/4] group cursor-pointer">
                <img src={c.img} alt={c.title} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 p-3 text-white">
                  <div className="text-sm font-semibold leading-tight line-clamp-2">{c.title}</div>
                  <div className="text-[11px] opacity-90 mt-1">{c.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-3">Get started</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl overflow-hidden aspect-[4/3] relative cursor-pointer"
              style={{ background: "linear-gradient(135deg, oklch(0.7 0.15 230), oklch(0.65 0.18 250))" }}>
              <div className="absolute inset-0 flex items-center justify-center text-6xl">🦩</div>
              <div className="absolute bottom-3 left-3 text-white font-semibold">Create a trip</div>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-[4/3] relative cursor-pointer"
              style={{ background: "linear-gradient(135deg, oklch(0.85 0.16 80), oklch(0.75 0.18 60))" }}>
              <div className="absolute inset-0 flex items-center justify-center text-6xl">🏄‍♀️</div>
              <div className="absolute bottom-3 left-3 text-white font-semibold">Creator tools</div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Get inspired</h2>
            <a className="text-sm text-muted-foreground hover:underline" href="#">See all</a>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {inspired.map((c) => (
              <div key={c.title} className="relative rounded-xl overflow-hidden aspect-[3/4] cursor-pointer group">
                <img src={c.img} alt={c.title} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
                <div className={`absolute top-2 left-2 h-7 w-7 rounded-full ${c.color} text-white text-xs font-semibold flex items-center justify-center ring-2 ring-white/40`}>
                  {c.initial}
                </div>
                <div className="absolute bottom-0 p-3 text-white text-sm font-semibold leading-tight">{c.title}</div>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
