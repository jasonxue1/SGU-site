import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

const ease = [0.22, 1, 0.36, 1] as const;

type PageTransitionProps = {
  /** 后台区域略短、位移更小 */
  variant?: "public" | "admin";
};

export function PageTransition({ variant = "public" }: PageTransitionProps) {
  const location = useLocation();
  const reduce = useReducedMotion();

  const y = variant === "admin" ? 10 : 16;
  const yExit = variant === "admin" ? -6 : -12;
  const duration = reduce ? 0.01 : variant === "admin" ? 0.26 : 0.32;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className={variant === "admin" ? "page-transition page-transition--admin" : "page-transition"}
        initial={{ opacity: 0, y: reduce ? 0 : y }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduce ? 0 : yExit }}
        transition={{
          duration,
          ease,
        }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
