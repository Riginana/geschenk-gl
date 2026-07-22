import heroFallback from "@/assets/hero-frame.jpg";
import heroes from "@/data/occasion-heroes.json";

const heroMap = heroes as Record<string, string>;

export function imageFor(occasion: string): string {
  return heroMap[occasion] ?? heroFallback;
}

export function secondaryImageFor(occasion: string): string {
  const keys = Object.keys(heroMap);
  const idx = keys.indexOf(occasion);
  const nextKey = keys[(idx + 1) % keys.length] ?? keys[0];
  return heroMap[nextKey] ?? heroFallback;
}

export { heroFallback as heroImage };
