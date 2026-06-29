import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-heading font-bold mb-4">TravelMatch</h3>
            <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-sm">
              Discover your perfect travel destination with personalized recommendations tailored to your unique interests and preferences.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              {["Home", "Destinations", "Recommendations", "Travel Tips", "About"].map((link) => (
                <li key={link}>
                  <a href={`#${link.toLowerCase().replace(" ", "-")}`} className="hover:text-primary-foreground transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} TravelMatch. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
