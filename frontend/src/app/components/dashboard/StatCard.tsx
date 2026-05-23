import * as React from "react";
import { Card } from "../ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
}

export function StatCard({ label, value, sublabel, icon }: StatCardProps) {
  return (
    <Card className="p-4 border border-border bg-card hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <h3 className="text-3xl font-semibold mb-1">{value}</h3>
          {sublabel && (
            <p className="text-xs text-muted-foreground">{sublabel}</p>
          )}
        </div>
        <div className="text-primary opacity-80">{icon}</div>
      </div>
    </Card>
  );
}
