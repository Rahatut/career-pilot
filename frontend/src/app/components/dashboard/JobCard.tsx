import * as React from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { MapPin, Building2 } from "lucide-react";

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  fitScore: number;
  posted?: string;
}

export function JobCard({ title, company, location, fitScore, posted }: JobCardProps) {
  const fitColor = fitScore >= 80
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <Card className="p-4 border border-border bg-card hover:border-primary/30 transition-all cursor-pointer group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium mb-1 group-hover:text-primary transition-colors truncate">
            {title}
          </h4>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">{company}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{location}</span>
            </div>
          </div>
          {posted && (
            <p className="text-xs text-muted-foreground">{posted}</p>
          )}
        </div>
        <Badge className={`${fitColor} border shrink-0`}>
          {fitScore}%
        </Badge>
      </div>
    </Card>
  );
}
