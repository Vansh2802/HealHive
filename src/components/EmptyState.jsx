import React from "react";

export default function EmptyState({
  icon,
  title,
  subtext,
  illustration,
  emoji,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-10 bg-card rounded-2xl border border-border shadow-sm ${className}`}
    >
      {illustration ? (
        <img
          src={illustration}
          alt="Empty state illustration"
          className="w-28 h-28 mb-4 opacity-90"
        />
      ) : emoji ? (
        <span className="text-5xl mb-3">{emoji}</span>
      ) : icon ? (
        <span className="mb-3">{icon}</span>
      ) : null}
      <p className="text-base text-text-main font-medium mb-1">{title}</p>
      {subtext && <p className="text-sm text-text-soft mt-1 text-center max-w-xs">{subtext}</p>}
    </div>
  );
}
