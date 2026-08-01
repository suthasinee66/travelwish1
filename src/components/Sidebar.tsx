import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
    MessageCircle,
    Briefcase,
    Compass,
    Heart,
    Bell,
    Lightbulb,
    Plus,
    Sparkles,
    MoreHorizontal,
} from "lucide-react";

const navItems = [
    {
        icon: MessageCircle,
        label: "Chats",
        to: "/home",
    },
    {
        icon: Briefcase,
        label: "Trips",
        to: "/trips",
    },
    {
        icon: Compass,
        label: "Explore",
        to: "/explore",
    },
    {
        icon: Heart,
        label: "Saved",
        to: "/saved",
    },
    
    {
        icon: Lightbulb,
        label: "Inspiration",
        to: "/inspiration",
    },
    {
    icon: Plus,
    label: "Create",
    action: "create",
},
];

export default function Sidebar({ user }: any) {

    const navigate = useNavigate();

    const [showCreateModal, setShowCreateModal] = useState(false);
    return (
        <aside className="w-60 shrink-0 border-r border-border flex flex-col bg-sidebar">
            <div className="px-5 py-5 flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                <span className="text-lg font-semibold tracking-tight">TravelWise.</span>
            </div>

            <nav className="px-2 flex-1">
                {navItems.map((n) => (
                    <div key={n.label}>
                        {n.to ? (

    <Link
        to={n.to}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-accent text-sidebar-foreground"
    >
        <n.icon className="h-[18px] w-[18px]" />
        <span className="flex-1 text-left">{n.label}</span>
    </Link>

) : (

    <button
        onClick={() => {

            if(n.action === "create"){
                setShowCreateModal(true);
            }

        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-accent text-sidebar-foreground"
    >
        <n.icon className="h-[18px] w-[18px]" />
        <span className="flex-1 text-left">
            {n.label}
        </span>
    </button>

)}
                    </div>
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
                <div className="mt-1">© 2026 TravelWise, Inc.</div>
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
    Choose how you want to plan your trip
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
border
rounded-2xl
p-5
text-left
hover:bg-gray-50
"

>

<div className="flex gap-3 items-center">


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
AI creates your itinerary
</p>

</div>


</div>


</button>




<button

onClick={()=>{

    setShowCreateModal(false);

    navigate({
        to:"/create_withManual"
    });

}}

className="
w-full
border
rounded-2xl
p-5
text-left
hover:bg-gray-50
"

>

<div className="flex gap-3 items-center">


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
<Plus size={18}/>
</div>


<div>

<h3 className="font-semibold">
Create Manually
</h3>

<p className="text-sm text-gray-500">
Choose places yourself
</p>

</div>


</div>


</button>


</div>


</div>


</div>

)}
        </aside>
    );
}