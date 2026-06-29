import { Star } from "lucide-react";
import type { Destination } from "@/data/destinations";

interface DestinationCardProps {
  destination: Destination;
}

const DestinationCard = ({ destination }: DestinationCardProps) => {
  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
      <div className="relative overflow-hidden h-52">
        <img
          src={destination.image}
          alt={`${destination.name}, ${destination.country}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
          <Star className="w-4 h-4 text-warm fill-warm" />
          <span className="text-sm font-semibold text-foreground">{destination.rating}</span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-heading font-bold text-lg text-foreground">{destination.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">{destination.country}</p>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{destination.description}</p>
        <button className="text-primary font-semibold text-sm hover:underline transition-colors">
          View Details →
        </button>
      </div>
    </div>
  );
};

export default DestinationCard;
