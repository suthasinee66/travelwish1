import baliImg from "@/assets/bali.jpg";
import kyotoImg from "@/assets/kyoto.jpg";
import swissAlpsImg from "@/assets/swiss-alps.jpg";
import phuketImg from "@/assets/phuket.jpg";
import santoriniImg from "@/assets/santorini.jpg";
import machuPicchuImg from "@/assets/machu-picchu.jpg";
import marrakechImg from "@/assets/marrakech.jpg";

export type Interest = "beaches" | "mountains" | "cities" | "nature" | "cultural" | "food" | "adventure";

export interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  rating: number;
  description: string;
  tags: Interest[];
}

export const destinations: Destination[] = [
  {
    id: "bali",
    name: "Bali",
    country: "Indonesia",
    image: baliImg,
    rating: 4.8,
    description: "Tropical paradise with stunning rice terraces, ancient temples, and vibrant culture.",
    tags: ["beaches", "nature", "cultural", "food"],
  },
  {
    id: "kyoto",
    name: "Kyoto",
    country: "Japan",
    image: kyotoImg,
    rating: 4.9,
    description: "A city of traditional temples, stunning gardens, and exquisite Japanese cuisine.",
    tags: ["cultural", "cities", "food", "nature"],
  },
  {
    id: "swiss-alps",
    name: "Swiss Alps",
    country: "Switzerland",
    image: swissAlpsImg,
    rating: 4.9,
    description: "Breathtaking mountain scenery with world-class skiing and hiking trails.",
    tags: ["mountains", "nature", "adventure"],
  },
  {
    id: "phuket",
    name: "Phuket",
    country: "Thailand",
    image: phuketImg,
    rating: 4.6,
    description: "Crystal-clear waters, stunning beaches, and vibrant nightlife in tropical Thailand.",
    tags: ["beaches", "food", "adventure"],
  },
  {
    id: "santorini",
    name: "Santorini",
    country: "Greece",
    image: santoriniImg,
    rating: 4.8,
    description: "Iconic white-washed buildings with blue domes overlooking the Aegean Sea.",
    tags: ["beaches", "cultural", "food", "cities"],
  },
  {
    id: "machu-picchu",
    name: "Machu Picchu",
    country: "Peru",
    image: machuPicchuImg,
    rating: 4.9,
    description: "Ancient Incan citadel set high in the Andes Mountains, a wonder of the world.",
    tags: ["mountains", "cultural", "adventure", "nature"],
  },
  {
    id: "marrakech",
    name: "Marrakech",
    country: "Morocco",
    image: marrakechImg,
    rating: 4.5,
    description: "Vibrant souks, aromatic spices, and stunning Moroccan architecture.",
    tags: ["cultural", "food", "cities"],
  },
];

export const interests: { id: Interest; label: string; icon: string }[] = [
  { id: "beaches", label: "Beaches", icon: "🏖️" },
  { id: "mountains", label: "Mountains", icon: "🏔️" },
  { id: "cities", label: "Cities", icon: "🏙️" },
  { id: "nature", label: "Nature", icon: "🌿" },
  { id: "cultural", label: "Cultural Places", icon: "🏛️" },
  { id: "food", label: "Food & Cuisine", icon: "🍜" },
  { id: "adventure", label: "Adventure", icon: "🧗" },
];
