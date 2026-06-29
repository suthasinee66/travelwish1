import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DestinationCard from "./DestinationCard";
import type { Destination } from "@/data/destinations";

interface PopularSectionProps {
  destinations: Destination[];
}

const PopularSection = ({ destinations }: PopularSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 340;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="destinations" className="py-20 bg-green-soft-light">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
              Popular Destinations
            </h2>
            <p className="text-muted-foreground mt-2">Trending places loved by travelers worldwide.</p>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {destinations.map((dest) => (
            <div key={dest.id} className="min-w-[300px] snap-start">
              <DestinationCard destination={dest} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularSection;
