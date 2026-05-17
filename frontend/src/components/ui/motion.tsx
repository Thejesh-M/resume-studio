"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   FadeIn — fade + optional slide on scroll
   ───────────────────────────────────────────── */

type Direction = "up" | "down" | "left" | "right" | "none";

interface FadeInProps {
  readonly children: ReactNode;
  readonly direction?: Direction;
  readonly distance?: number;
  readonly delay?: number;
  readonly duration?: number;
  readonly className?: string;
  readonly once?: boolean;
}

function getInitial(direction: Direction, distance: number) {
  const map = {
    up: { opacity: 0, y: distance },
    down: { opacity: 0, y: -distance },
    left: { opacity: 0, x: distance },
    right: { opacity: 0, x: -distance },
    none: { opacity: 0 },
  } as const;
  return { ...map[direction] };
}

export function FadeIn({
  children,
  direction = "up",
  distance = 24,
  delay = 0,
  duration = 0.5,
  className,
  once = true,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={getInitial(direction, distance)}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : getInitial(direction, distance)}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   StaggerContainer — staggers children on scroll
   ───────────────────────────────────────────── */

interface StaggerContainerProps {
  readonly children: ReactNode;
  readonly stagger?: number;
  readonly className?: string;
  readonly once?: boolean;
}

export function StaggerContainer({
  children,
  stagger = 0.1,
  className,
  once = true,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   StaggerItem — must be direct child of StaggerContainer
   ───────────────────────────────────────────── */

interface StaggerItemProps {
  readonly children: ReactNode;
  readonly direction?: Direction;
  readonly distance?: number;
  readonly className?: string;
}

export function StaggerItem({
  children,
  direction = "up",
  distance = 24,
  className,
}: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: getInitial(direction, distance),
        visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   ScaleIn — scale up from 0 on scroll
   ───────────────────────────────────────────── */

interface ScaleInProps {
  readonly children: ReactNode;
  readonly delay?: number;
  readonly className?: string;
}

export function ScaleIn({ children, delay = 0, className }: ScaleInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   AnimatedCounter — counts up to target value
   ───────────────────────────────────────────── */

interface AnimatedCounterProps {
  readonly target: number;
  readonly suffix?: string;
  readonly prefix?: string;
  readonly duration?: number;
  readonly className?: string;
}

export function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 1.5,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [hasAnimated, setHasAnimated] = useState(false);

  const springValue = useSpring(0, { duration: duration * 1000 });
  const displayValue = useTransform(springValue, (v) => Math.round(v));

  useEffect(() => {
    if (isInView && !hasAnimated) {
      springValue.set(target);
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated, springValue, target]);

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const unsubscribe = displayValue.on("change", (v) => {
      setCurrent(v);
    });
    return unsubscribe;
  }, [displayValue]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {current}
      {suffix}
    </span>
  );
}

/* ─────────────────────────────────────────────
   FloatingElement — gentle floating animation
   ───────────────────────────────────────────── */

interface FloatingElementProps {
  readonly children: ReactNode;
  readonly amplitude?: number;
  readonly duration?: number;
  readonly className?: string;
}

export function FloatingElement({
  children,
  amplitude = 8,
  duration = 3,
  className,
}: FloatingElementProps) {
  return (
    <motion.div
      animate={{ y: [-amplitude, amplitude, -amplitude] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
