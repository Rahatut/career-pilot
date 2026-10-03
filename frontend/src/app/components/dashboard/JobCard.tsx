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
  const fitVariant = fitScore >= 80
    ? "forest"
    : fitScore >= 60
    ? "mint"
    : "secondary";

  return (
    <Card className="p-4 border border-border bg-card hover:border-border-strong/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-title-sm mb-1 truncate">
            {title}
          </h4>
          <div className="flex items-center gap-3 text-body-md text-muted-foreground mb-2">
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
            <p className="text-caption text-muted-foreground">{posted}</p>
          )}
        </div>
        <Badge variant={fitVariant} className="shrink-0">
          {fitScore}%
        </Badge>
      </div>
    </Card>
  );
}