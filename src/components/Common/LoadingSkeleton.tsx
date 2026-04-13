"use client";

import React from "react";

type SkeletonVariant = "card" | "text" | "bar" | "list" | "camera";

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`skeleton rounded-sm bg-white/[0.04] ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

function CardSkeleton() {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-3 space-y-2">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="h-2 w-16" />
      <SkeletonBlock className="h-8 w-32" />
      <SkeletonBlock className="h-2 w-full" />
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="space-y-1.5">
      <SkeletonBlock className="h-2 w-full" />
      <SkeletonBlock className="h-2 w-4/5" />
      <SkeletonBlock className="h-2 w-3/5" />
    </div>
  );
}

function BarSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <SkeletonBlock className="h-2 w-20" />
      <SkeletonBlock className="h-[10px] flex-1" />
      <SkeletonBlock className="h-3 w-12" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-2.5 space-y-1.5">
      <SkeletonBlock className="h-2 w-16" />
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-2 w-3/4" />
    </div>
  );
}

function CameraSkeleton() {
  return (
    <div className="w-[200px] shrink-0 border border-white/10 bg-white/[0.02]">
      <SkeletonBlock className="h-[110px] w-full rounded-none" />
      <div className="p-2.5 space-y-1.5">
        <SkeletonBlock className="h-2 w-20" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-2 w-24" />
      </div>
    </div>
  );
}

const VARIANTS: Record<SkeletonVariant, () => React.JSX.Element> = {
  card: CardSkeleton,
  text: TextSkeleton,
  bar: BarSkeleton,
  list: ListSkeleton,
  camera: CameraSkeleton,
};

export default function LoadingSkeleton({
  variant = "text",
  count = 1,
  className,
}: LoadingSkeletonProps) {
  const Component = VARIANTS[variant];
  return (
    <div className={className} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Component key={i} />
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

export { CardSkeleton, TextSkeleton, BarSkeleton, ListSkeleton, CameraSkeleton };
