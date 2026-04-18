import React from "react";

export default function Header({
  name,
  onManageAvailability,
}) {
  return (
    <div className="bg-card rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border border-border">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-text-main mb-1 tracking-tight">
          Welcome back <span className="inline-block">👋</span>
        </h1>
        <p className="text-text-soft text-base font-normal">
          Ready to help someone today
        </p>
      </div>
      <button
        onClick={onManageAvailability}
        className="rounded-xl px-6 py-3 bg-primary text-white font-semibold shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-soft flex items-center gap-2 text-base"
      >
        Manage Availability
      </button>
    </div>
  );
}
