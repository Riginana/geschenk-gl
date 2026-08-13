import { z } from "zod";
import { SHIPPING_METHODS, SHIPPING_ZONES } from "@/lib/shipping";

export const checkoutSchema = z.object({
  email: z.string().email().max(255),
  address: z.object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    street: z.string().min(1).max(120),
    houseNumber: z.string().min(1).max(20),
    plz: z.string().regex(/^\d{4,5}$/),
    city: z.string().min(1).max(80),
    country: z.string().min(2).max(60),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(120),
        slug: z.string().min(1).max(120),
        name: z.string().min(1).max(200),
        qty: z.number().int().min(1).max(50),
        personalization: z.record(z.string(), z.string().max(500)).optional(),
      }),
    )
    .min(1)
    .max(50),
  shippingMethod: z.enum(SHIPPING_METHODS),
  shippingZone: z.enum(SHIPPING_ZONES),
  locale: z.enum(["de", "en"]).default("de"),
  /** Same-origin base URL the customer returns to after paying. */
  origin: z.string().url().max(300),
  environment: z.enum(["sandbox", "live"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
