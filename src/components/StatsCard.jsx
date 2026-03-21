import React from "react";
import { Calendar, CheckCircle, Users } from "lucide-react";

const statsConfig = [
  {
    icon: Calendar,
    label: "Upcoming",
    value: 0,
    bg: "bg-primary-soft",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
  },
  {
    icon: CheckCircle,
    label: "Completed",
    value: 0,
    bg: "bg-secondary/10",
    iconBg: "bg-secondary/20",
    iconColor: "text-secondary",
  },
  {
    icon: Users,
    label: "Patients",
    value: 0,
    bg: "bg-accent/10",
    iconBg: "bg-accent/20",
    iconColor: "text-accent",
  },
];

export default function StatsCard({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
      {statsConfig.map((stat, i) => {
        const StatIcon = stat.icon;
        const value = stats?.[stat.label.toLowerCase()] ?? stat.value;
        return (
          <div
            key={stat.label}
            className={`rounded-2xl shadow-sm border border-border p-6 flex items-center gap-4 group transition-all duration-300 bg-white hover:shadow-lg hover:scale-[1.02]`}
            style={{ background: "linear-gradient(135deg, #E6F2EF 0%, #FFFFFF 100%)" }}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow ${stat.iconBg} group-hover:scale-110 transition-transform`}>
              <StatIcon className={`w-7 h-7 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-3xl font-bold text-text-main mb-1">{value}</p>
              <p className="text-base text-text-soft font-medium tracking-wide">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
