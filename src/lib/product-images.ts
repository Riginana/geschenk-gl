import wedding from "@/assets/p-wedding.jpg";
import birthday from "@/assets/p-birthday.jpg";
import baby from "@/assets/p-baby.jpg";
import baptism from "@/assets/p-baptism.jpg";
import confirmation from "@/assets/p-confirmation.jpg";
import anniversary from "@/assets/p-anniversary.jpg";
import retirement from "@/assets/p-retirement.jpg";
import christmas from "@/assets/p-christmas.jpg";
import farewell from "@/assets/p-farewell.jpg";
import hero from "@/assets/hero-frame.jpg";

const byOccasion: Record<string, string> = {
  hochzeit: wedding,
  geburtstag: birthday,
  geburt: baby,
  taufe: baptism,
  konfirmation: confirmation,
  jubilaeum: anniversary,
  ruhestand: retirement,
  weihnachten: christmas,
  abschied: farewell,
};

export function imageFor(occasion: string): string {
  return byOccasion[occasion] ?? hero;
}

export function secondaryImageFor(occasion: string): string {
  // For card hover: rotate through the gallery
  const list = Object.values(byOccasion);
  const idx = Object.keys(byOccasion).indexOf(occasion);
  return list[(idx + 1) % list.length];
}

export { hero as heroImage };
