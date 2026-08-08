import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className,
  y = 24,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  // Do not branch the rendered element or its props on `useReducedMotion()`:
  // the server always renders the animated variant, so a different client
  // output causes a hydration mismatch that can trip the route error boundary.
  // Reduced motion is handled globally via <MotionConfig reducedMotion="user">.
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

