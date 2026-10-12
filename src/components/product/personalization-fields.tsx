import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, Check } from "lucide-react";
import { de, enUS } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { formatDE, maskDate, parseDE } from "@/lib/personalization-schema";
import {
  cleanAnswer,
  optionLabel,
  resolveBlocks,
  resolveHeading,
  toBlock,
  validateAnswer,
  type PersBlock,
  type PersSection,
  type ProductScopeInfo,
} from "@/lib/personalization-blocks";

export type PersonalizationResult = { answers: Record<string, string>; labels: Record<string, string> };
export type PersonalizationHandle = { validate: () => Promise<PersonalizationResult | null> };

export const personalizationQueryOptions = {
  queryKey: ["personalization-blocks"] as const,
  queryFn: async () => {
    const [b, s] = await Promise.all([
      supabase.from("personalization_blocks").select("*").eq("is_active", true),
      supabase.from("personalization_sections").select("*"),
    ]);
    if (b.error) throw b.error;
    return {
      blocks: (b.data ?? []).map((r) => toBlock(r as Record<string, unknown>)),
      sections: (s.data ?? []) as PersSection[],
    };
  },
  staleTime: 30_000,
};

const fieldCls = (err: boolean) =>
  cn(
    "mt-1.5 rounded-lg bg-cream px-4 text-sm focus-visible:ring-brass",
    err ? "border-destructive focus-visible:ring-destructive" : "border-border",
  );

type Props = {
  product: ProductScopeInfo;
  /** Admin preview: render this block list instead of loading from the database. */
  previewBlocks?: PersBlock[];
  previewHeading?: string;
};

export const PersonalizationFields = forwardRef<PersonalizationHandle, Props>(function PersonalizationFields(
  { product, previewBlocks, previewHeading },
  ref,
) {
  const { t, locale } = useT();
  const { data } = useQuery({ ...personalizationQueryOptions, enabled: !previewBlocks });
  const blocks = useMemo(
    () => previewBlocks ?? (data ? resolveBlocks(data.blocks, product) : []),
    [previewBlocks, data, product],
  );
  const heading =
    previewHeading ?? (data ? resolveHeading(data.sections, product, locale) : null) ?? t("pers.title");
  const [values, setValues] = useState<Record<string, string>>({});
  const [errs, setErrs] = useState<Record<string, string | null>>({});
  const [calOpen, setCalOpen] = useState<string | null>(null);

  const L = (b: PersBlock, k: "title" | "description" | "placeholder" | "hint" | "error") => {
    const de_ = b[`${k}_de`];
    return locale === "en" ? b[`${k}_en`] || de_ : de_;
  };
  const errText = (b: PersBlock, key: string | null | undefined) => {
    if (!key) return null;
    return L(b, "error") || t(`pers.errors.${key}`);
  };
  const check = (b: PersBlock, raw: string) => {
    const v = cleanAnswer(b, raw);
    const e = validateAnswer(b, v);
    setErrs((x) => ({ ...x, [b.field_key]: e }));
    return { v, e };
  };
  const set = (b: PersBlock, v: string, validate = false) => {
    setValues((x) => ({ ...x, [b.field_key]: v }));
    if (validate || errs[b.field_key]) check(b, v);
  };

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const answers: Record<string, string> = {};
      const labels: Record<string, string> = {};
      let first: string | null = null;
      for (const b of blocks) {
        const { v, e } = check(b, values[b.field_key] ?? "");
        if (e && !first) first = b.field_key;
        if (v) {
          answers[b.field_key] = v;
          labels[b.field_key] = b.title_de || b.internal_name;
        }
      }
      if (first) {
        const el = document.getElementById(`pers-${first}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
        return null;
      }
      return { answers, labels };
    },
  }));

  if (!blocks.length) return null;

  return (
    <div className="mt-6 space-y-4 rounded-2xl bg-card p-6 ring-1 ring-border/60">
      <p className="eyebrow">{heading}</p>
      {blocks.map((b) => {
        const id = `pers-${b.field_key}`;
        const v = values[b.field_key] ?? "";
        const e = errText(b, errs[b.field_key]);
        const desc = L(b, "description");
        const hint = L(b, "hint");
        const max = b.max_length || 150;
        return (
          <div key={b.id}>
            {b.field_type !== "checkbox" && (
              <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
                {L(b, "title")}
                {b.required ? " *" : ""}
              </Label>
            )}
            {desc && <p className="mt-0.5 text-xs text-muted-foreground/80">{desc}</p>}

            {b.field_type === "text" && (
              <Input
                id={id}
                value={v}
                maxLength={max}
                placeholder={L(b, "placeholder")}
                onChange={(ev) => set(b, ev.target.value)}
                onBlur={() => check(b, v)}
                aria-invalid={!!e}
                className={cn(fieldCls(!!e), "h-11")}
              />
            )}
            {b.field_type === "textarea" && (
              <Textarea
                id={id}
                rows={3}
                value={v}
                maxLength={max}
                placeholder={L(b, "placeholder")}
                onChange={(ev) => set(b, ev.target.value)}
                onBlur={() => check(b, v)}
                aria-invalid={!!e}
                className={cn(fieldCls(!!e), "resize-none py-2.5")}
              />
            )}
            {b.field_type === "date" && (
              <div className="relative">
                <Input
                  id={id}
                  value={v}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder={L(b, "placeholder") || t("pers.datePlaceholder")}
                  onChange={(ev) => set(b, maskDate(ev.target.value))}
                  onBlur={() => check(b, v)}
                  aria-invalid={!!e}
                  className={cn(fieldCls(!!e), "h-11 pr-12")}
                />
                <Popover open={calOpen === b.field_key} onOpenChange={(o) => setCalOpen(o ? b.field_key : null)}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("pers.openCalendar")}
                      className="absolute right-1.5 top-[calc(50%+3px)] grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-walnut/70 transition hover:bg-linen hover:text-walnut"
                    >
                      <CalendarIcon size={16} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      locale={locale === "de" ? de : enUS}
                      mode="single"
                      selected={parseDE(v) ?? undefined}
                      defaultMonth={parseDE(v) ?? undefined}
                      captionLayout="dropdown"
                      startMonth={new Date(1900, 0)}
                      endMonth={new Date(2100, 11)}
                      onSelect={(d) => {
                        if (d) set(b, formatDE(d), true);
                        setCalOpen(null);
                      }}
                      className="pointer-events-auto p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {b.field_type === "select" && (
              <select
                id={id}
                value={v}
                onChange={(ev) => set(b, ev.target.value, true)}
                aria-invalid={!!e}
                className={cn(fieldCls(!!e), "h-11 w-full border")}
              >
                <option value="">{L(b, "placeholder") || "—"}</option>
                {b.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {optionLabel(o, locale)}
                  </option>
                ))}
              </select>
            )}
            {b.field_type === "checkbox" && (
              <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox id={id} checked={v === "ja"} onCheckedChange={(c) => set(b, c ? "ja" : "", true)} />
                {L(b, "title")}
                {b.required ? " *" : ""}
              </label>
            )}
            {(b.field_type === "font" || b.field_type === "image") && (
              <div id={id} tabIndex={-1} className={cn("mt-1.5 grid gap-2", b.field_type === "image" ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2")}>
                {b.options.map((o) => {
                  const sel = v === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => set(b, o.value, true)}
                      className={cn(
                        "relative rounded-lg border bg-cream p-2 text-left text-sm transition",
                        sel ? "border-walnut ring-1 ring-walnut" : "border-border hover:border-walnut/50",
                      )}
                    >
                      {b.field_type === "image" && o.image_url && (
                        <img src={o.image_url} alt="" loading="lazy" className="mb-1 aspect-square w-full rounded object-cover" />
                      )}
                      <span style={b.field_type === "font" ? { fontFamily: o.value } : undefined} className={b.field_type === "font" ? "text-lg" : "text-xs"}>
                        {optionLabel(o, locale)}
                      </span>
                      {sel && <Check size={14} className="absolute right-1.5 top-1.5 text-walnut" />}
                    </button>
                  );
                })}
              </div>
            )}

            <span className="mt-1 flex justify-between gap-2 text-[11px]">
              <span className={e ? "text-destructive" : "text-muted-foreground"}>{e ?? hint}</span>
              {(b.field_type === "text" || b.field_type === "textarea") && (
                <span className="text-muted-foreground">
                  {v.length}/{max}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
});
