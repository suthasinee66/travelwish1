import DestinationCard from "./DestinationCard";
import type { Destination } from "@/data/destinations";

interface RecommendationSectionProps {
  recommendations: Destination[];
  visible: boolean;
}

const RecommendationSection = ({ recommendations, visible }: RecommendationSectionProps) => {
  if (!visible) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground text-center mb-3">
          Recommended For You
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          Based on your interests, we think you'll love these destinations.
        </p>

        {recommendations.length === 0 ? (
          <p className="text-center text-muted-foreground">No matching destinations found. Try selecting different interests!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
            {recommendations.map((dest) => (
              <DestinationCard key={dest.id} destination={dest} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecommendationSection;
