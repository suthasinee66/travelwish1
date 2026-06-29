import { useNavigate } from "@tanstack/react-router";
import heroImg from "@/assets/hero-travel.jpg";


interface HeroSectionProps {
  onStartExploring: () => void;
}

const HeroSection = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/login");
  };

  return (
    <section id="home" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <img
        src={heroImg}
        alt="Beautiful tropical beach destination"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-foreground/70" />

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-primary-foreground mb-4 leading-tight">
          Find Your Perfect Travel Destination
        </h1>

        <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 font-body">
          Get personalized travel recommendations based on your interests.
        </p>

        <button
  onClick={() => navigate("/login")}
  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 rounded-full"
>
  Start Exploring
</button>
      </div>
    </section>
  );
};

export default HeroSection;
