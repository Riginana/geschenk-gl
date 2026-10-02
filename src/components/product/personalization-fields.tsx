import { forwardRef, useImperativeHandle, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import {
  MESSAGE_MAX,
  NAME_MAX,
  formatDE,
  maskDate,
  parseDE,
  personalizationSchema,
  type PersonalizationValues,
} from "@/lib/personalization-schema";

export type PersonalizationHandle = {
  validate: () => Promise<PersonalizationValues | null>;
};

type FormIn = { names: string; date: string; message: string };
const ORDER: (keyof FormIn)[] = ["names", "date", "message"];

const fieldCls = (err: boolean) =>
  cn(
    "mt-1.5 rounded-lg bg-cream px-4 text-sm focus-visible:ring-brass",
    err ? "border-destructive focus-visible:ring-destructive" : "border-border",
  );

export const PersonalizationFields = forwardRef<PersonalizationHandle>(function PersonalizationFields(_, ref) {
  const { t } = useT();
  const [calOpen, setCalOpen] = useState(false);
  const form = useForm<FormIn, unknown, PersonalizationValues>({
    resolver: zodResolver(personalizationSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { names: "", date: "", message: "" },
  });
  const { register, formState, watch, setValue, trigger, getValues, setFocus } = form;
  const { errors } = formState;
  const names = watch("names");
  const date = watch("date");
  const message = watch("message");

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const ok = await trigger();
      if (!ok) {
        const first = ORDER.find((k) => form.getFieldState(k).error);
        if (first) {
          const el = document.getElementById(`pers-${first}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          setFocus(first);
        }
        return null;
      }
      return personalizationSchema.parse(getValues());
    },
  }));

  const err = (k: keyof FormIn) => {
    const m = errors[k]?.message;
    return m ? t(`pers.errors.${m}`) : null;
  };

  const nameReg = register("names", {
    onBlur: (e) => setValue("names", e.target.value.replace(/\s+/g, " ").trim()),
  });
  const dateReg = register("date");
  const nameErr = err("names");
  const dateErr = err("date");
  const msgErr = err("message");
  const selected = parseDE(date) ?? undefined;

  return (
    <div className="mt-6 space-y-4 rounded-2xl bg-card p-6 ring-1 ring-border/60">
      <p className="eyebrow">{t("pers.title")}</p>

      <div>
        <Label htmlFor="pers-names" className="text-xs font-normal text-muted-foreground">
          {t("pers.name")} *
        </Label>
        <Input
          id="pers-names"
          {...nameReg}
          maxLength={NAME_MAX}
          placeholder={t("pers.namePlaceholder")}
          aria-invalid={!!nameErr}
          aria-describedby="pers-names-hint"
          className={cn(fieldCls(!!nameErr), "h-11")}
        />
        <span id="pers-names-hint" className="mt-1 flex justify-between gap-2 text-[11px]">
          <span className="text-destructive">{nameErr}</span>
          <span className="text-muted-foreground">
            {names.length}/{NAME_MAX}
          </span>
        </span>
      </div>

      <div>
        <Label htmlFor="pers-date" className="text-xs font-normal text-muted-foreground">
          {t("pers.date")}
        </Label>
        <div className="relative">
          <Input
            id="pers-date"
            {...dateReg}
            onChange={(e) => {
              e.target.value = maskDate(e.target.value);
              dateReg.onChange(e);
            }}
            inputMode="numeric"
            maxLength={10}
            placeholder={t("pers.datePlaceholder")}
            aria-invalid={!!dateErr}
            aria-describedby="pers-date-hint"
            className={cn(fieldCls(!!dateErr), "h-11 pr-12")}
          />
          <Popover open={calOpen} onOpenChange={setCalOpen}>
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
                mode="single"
                selected={selected}
                defaultMonth={selected}
                captionLayout="dropdown"
                startMonth={new Date(1900, 0)}
                endMonth={new Date(2100, 11)}
                onSelect={(d) => {
                  if (d) setValue("date", formatDE(d), { shouldValidate: true });
                  setCalOpen(false);
                }}
                className="pointer-events-auto p-3"
              />
            </PopoverContent>
          </Popover>
        </div>
        {dateErr && (
          <span id="pers-date-hint" className="mt-1 block text-[11px] text-destructive">
            {dateErr}
          </span>
        )}
      </div>

      <div>
        <Label htmlFor="pers-message" className="text-xs font-normal text-muted-foreground">
          {t("pers.message")}
        </Label>
        <Textarea
          id="pers-message"
          rows={3}
          {...register("message")}
          maxLength={MESSAGE_MAX}
          placeholder={t("pers.messagePlaceholder")}
          aria-invalid={!!msgErr}
          aria-describedby="pers-message-hint"
          className={cn(fieldCls(!!msgErr), "resize-none py-2.5")}
        />
        <span id="pers-message-hint" className="mt-1 flex justify-between gap-2 text-[11px]">
          <span className="text-destructive">{msgErr}</span>
          <span className="text-muted-foreground">
            {message.length}/{MESSAGE_MAX}
          </span>
        </span>
      </div>
    </div>
  );
});
