import { Calendar, Wallet, CheckSquare } from "lucide-react";

const tips = [
  {
    icon: Calendar,
    title: "Best Time to Travel",
    description:
      "Research the best seasons for your destination. Shoulder seasons often offer great weather with fewer crowds and lower prices.",
  },
  {
    icon: Wallet,
    title: "Budget Travel Tips",
    description:
      "Book flights mid-week, use local transport, stay in guesthouses, and eat where locals eat to save significantly on your trip.",
  },
  {
    icon: CheckSquare,
    title: "Packing Checklist",
    description:
      "Pack light with versatile clothing, don't forget chargers and adapters, and always carry a reusable water bottle and sunscreen.",
  },
];

const TravelTipsSection = () => {
  return (
    <section id="travel-tips" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground text-center mb-3">
          Travel Tips
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          Helpful advice to make your next trip smooth and memorable.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tips.map((tip) => (
            <div
              key={tip.title}
              className="bg-card rounded-xl p-8 border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-sky-light flex items-center justify-center mx-auto mb-5">
                <tip.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-3">{tip.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TravelTipsSection;
