import { z } from "zod";

/** Shared (browser + server) rules for the product "Personalisierung" block. Error messages are i18n keys under `pers.errors`. */

export const NAME_MAX = 50;
export const MESSAGE_MAX = 150;
const NAME_RE = /^[\p{L}\p{M}' &+-]+$/u;
const MESSAGE_RE = /^[\p{L}\p{M}\p{N} \n.,!?:;\-'"&()❤\u2019\u201E\u201C\uFE0F]*$/u;
const URL_RE = /(https?:\/\/|www\.|\b[\w-]+\.(com|de|net|org|io|info|ru|eu|co|app|shop)\b)/i;

export function sanitizeName(v: string): string {
  return v.replace(/\s+/g, " ").trim();
}

export function sanitizeMessage(v: string): string {
  return v
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim();
}

/** Digits-only date mask → TT.MM.JJJJ */
export function maskDate(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`;
}

export function parseDE(v: string): Date | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(v);
  if (!m) return null;
  const day = +m[1], month = +m[2], year = +m[3];
  if (year < 1900 || year > 2100) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

export function formatDE(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export const isValidDate = (v: string) => parseDE(v) !== null;

export const nameSchema = z
  .string()
  .transform(sanitizeName)
  .pipe(
    z
      .string()
      .min(2, "nameMin")
      .max(NAME_MAX, "nameMax")
      .regex(NAME_RE, "nameChars"),
  );

export const dateSchema = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v === "" || isValidDate(v), "date");

export const messageSchema = z
  .string()
  .transform(sanitizeMessage)
  .superRefine((v, ctx) => {
    if (v.length > MESSAGE_MAX) ctx.addIssue({ code: "custom", message: "messageMax" });
    else if (
      !MESSAGE_RE.test(v) ||
      URL_RE.test(v) ||
      /(.)\1{3,}/u.test(v) ||
      (v.match(/\n/g)?.length ?? 0) > 3
    )
      ctx.addIssue({ code: "custom", message: "messageChars" });
  });

export const personalizationSchema = z.object({
  names: nameSchema,
  date: dateSchema,
  message: messageSchema,
});

export type PersonalizationValues = z.output<typeof personalizationSchema>;
