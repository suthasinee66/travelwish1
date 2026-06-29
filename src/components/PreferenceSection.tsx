import { interests, type Interest } from "@/data/destinations";

interface PreferenceSectionProps {
  selected: Interest[];
  onToggle: (interest: Interest) => void;
  onGetRecommendations: () => void;
}

const PreferenceSection = ({ selected, onToggle, onGetRecommendations }: PreferenceSectionProps) => {
  return (
    <section id="recommendations" className="py-20 bg-sky-light">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
          Tell Us What You Like
        </h2>
        <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
          Select your travel interests and we'll find the perfect destinations for you.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-10 max-w-2xl mx-auto">
          {interests.map((interest) => {
            const isSelected = selected.includes(interest.id);
            return (
              <button
                key={interest.id}
                onClick={() => onToggle(interest.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all border-2 ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                    : "bg-card text-foreground border-border hover:border-primary/50 hover:shadow-md"
                }`}
              >
                <span className="text-lg">{interest.icon}</span>
                {interest.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onGetRecommendations}
          disabled={selected.length === 0}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-4 rounded-full text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Get Recommendations
        </button>
      </div>
    </section>
  );
};

export default PreferenceSection;
