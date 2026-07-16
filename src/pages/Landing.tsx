import { useState } from "react";

export type LandingRole = "pm" | "supplier" | "prospect";

export interface LandingProps {
  onSelectRole: (role: LandingRole) => void;
}

export function Landing({ onSelectRole }: LandingProps) {
  const [hoveredRole, setHoveredRole] = useState<LandingRole | null>(null);

  const roles = [
    {
      id: "pm" as const,
      name: "Sabine Müller",
      title: "Procurement Manager",
      company: "Lynk PM",
      description:
        "Dashboard, compliance monitoring, contract management, data governance, qualification, reporting.",
      buttonText: "Open Procurement Dashboard",
      icon: "👤",
      bgClass: "bg-slate-900 text-white",
    },
    {
      id: "supplier" as const,
      name: "Martin Weber",
      title: "Active Supplier",
      company: "EuroBau Components",
      description:
        "Manage compliance documents, request sensitive data changes, view performance ratings and score history.",
      buttonText: "Open Supplier Account",
      icon: "👥",
      bgClass: "bg-white border border-border",
    },
    {
      id: "prospect" as const,
      name: "Mehmet Yilmaz",
      title: "Prospect",
      company: "Yilmaz Elektrotechnik",
      description:
        "New supplier invited to the platform. Complete profile, upload compliance documents, go through onboarding.",
      buttonText: "Open Onboarding Portal",
      icon: "📋",
      bgClass: "bg-white border border-border",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-12 max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            L
          </div>
          <span className="text-lg font-semibold">Lynk</span>
        </div>
        <h1 className="text-4xl font-bold mb-2">Supplier Management Platform</h1>
        <p className="text-muted-foreground mb-2">Three distinct user experiences within the same workflow.</p>
        <p className="text-muted-foreground">Choose a role to explore.</p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-8">
        {roles.map((role) => (
          <div
            key={role.id}
            onMouseEnter={() => setHoveredRole(role.id)}
            onMouseLeave={() => setHoveredRole(null)}
            className={`p-6 rounded-2xl transition-all duration-300 ${
              role.bgClass
            } ${
              hoveredRole === role.id
                ? "shadow-lg scale-105 cursor-pointer"
                : "shadow-md"
            }`}
          >
            {/* Icon */}
            <div className="text-3xl mb-4">{role.icon}</div>

            {/* Name & Title */}
            <h2 className={`text-lg font-semibold mb-1 ${
              role.bgClass.includes("white") ? "text-foreground" : ""
            }`}>
              {role.name}
            </h2>
            <p className={`text-sm mb-3 ${
              role.bgClass.includes("white") ? "text-muted-foreground" : "text-gray-300"
            }`}>
              {role.title} · {role.company}
            </p>

            {/* Description */}
            <p className={`text-sm mb-6 leading-relaxed ${
              role.bgClass.includes("white") ? "text-foreground" : ""
            }`}>
              {role.description}
            </p>

            {/* Button */}
            <button
              onClick={() => onSelectRole(role.id)}
              className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                role.bgClass.includes("white")
                  ? "text-primary hover:text-primary/80"
                  : "text-blue-400 hover:text-blue-300"
              }`}
            >
              {role.buttonText}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground text-center max-w-2xl">
        In production these would be separate authenticated sessions. This demo simulates all three.
      </p>
    </div>
  );
}
