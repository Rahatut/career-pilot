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
}

export function KanbanColumn({ title, count, items }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[200px]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-label-md">{title}</h4>
        <Badge variant="secondary" size="sm">
          {count}
        </Badge>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className="p-3 border border-border bg-card transition-colors cursor-pointer hover:border-border-strong"
          >
            <p className="text-body-md font-medium mb-0.5 truncate">{item.title}</p>
            <p className="text-caption text-muted-foreground truncate">{item.company}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}