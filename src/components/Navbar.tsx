import { useState } from "react";
import { Search, Menu, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const navLinks = ["Home", "Destinations", "Recommendations", "Travel Tips", "About"];

interface NavbarProps {
  onSearch?: (query: string) => void;
}

const Navbar = ({ onSearch }: NavbarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="#" className="flex items-center gap-2">
          <span className="text-2xl font-heading font-bold text-gradient">TravelWise</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(" ", "-")}`}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex items-center bg-muted rounded-full px-4 py-2 gap-2">
          <div className="hidden md:flex items-center gap-2">
  <button
    onClick={() => navigate({ to: "/login" })}
    className="px-3 py-1.5 text-sm rounded-full hover:bg-muted transition"
  >
    Login
  </button>

  <button
    onClick={() => navigate({ to: "/register" })}
    className="px-3 py-1.5 text-sm rounded-full bg-primary text-white hover:opacity-90 transition"
  >
    Sign Up
  </button>
</div>
        </form>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 animate-fade-in">
          <form onSubmit={handleSearch} className="flex items-center bg-muted rounded-full px-4 py-2 gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
            />
          </form>
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(" ", "-")}`}
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
