"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

/**
 * Smoothly animates between numeric values using framer-motion.
 * Numbers count up/down instead of snapping — the single most impactful
 * micro-interaction for a data-heavy dashboard.
 */
export default function AnimatedNumber({
  value,
  duration = 0.6,
  format,
  className,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(value);
  const display = useTransform(motionValue, (v) =>
    format ? format(v) : v.toFixed(2),
  );
  const isFirst = useRef(true);

  useEffect(() => {
    // Skip animation on first render — show the value immediately
    if (isFirst.current) {
      isFirst.current = false;
      motionValue.set(value);
      return;
    }

    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
    });

    return controls.stop;
  }, [value, duration, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
}
