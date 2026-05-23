import * as React from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

interface KanbanItem {
  id: string;
  title: string;
  company: string;
}

interface KanbanColumnProps {
  title: string;
  count: number;
  items: KanbanItem[];
  accentColor?: string;
}

export function KanbanColumn({ title, count, items, accentColor }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[200px]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">{title}</h4>
        <Badge variant="secondary" className="text-xs border border-border">
          {count}
        </Badge>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <Card
            key={item.id}
            className={`p-3 border bg-card hover:border-primary/30 transition-all cursor-pointer ${
              accentColor ? `border-l-2 border-l-${accentColor}` : "border-border"
            }`}
            style={accentColor ? { borderLeftColor: accentColor } : {}}
          >
            <p className="text-sm font-medium mb-0.5 truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground truncate">{item.company}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
