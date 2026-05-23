import * as React from "react";
import { StatCard } from "../dashboard/StatCard";
import { JobCard } from "../dashboard/JobCard";
import { KanbanColumn } from "../dashboard/KanbanColumn";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Briefcase, CalendarDays, Flame, Target, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { getDashboard, getApplications, type DashboardStats, type Application } from "../../../lib/api";
import { useUser } from "../../contexts";

interface DashboardProps {
  onNavigate?: (page: string, jobId?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useUser();
  const [dashData, setDashData] = React.useState<DashboardStats | null>(null);
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    Promise.all([getDashboard(), getApplications()])
      .then(([dash, apps]) => { setDashData(dash); setApplications(apps); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const stats = [
    { label: "Applications", value: String(dashData?.total_applications ?? 0), sublabel: "This week", icon: <Briefcase className="w-5 h-5" /> },
    { label: "Interviews", value: String(dashData?.interviews ?? 0), sublabel: "26 May", icon: <CalendarDays className="w-5 h-5" /> },
    { label: "Pending", value: String(dashData?.pending ?? 0), sublabel: "In pipeline", icon: <Flame className="w-5 h-5" /> },
    { label: "Roadmap", value: dashData ? `${Math.round((dashData.weekly_goals.filter((g) => g.completed).length / Math.max(dashData.weekly_goals.length, 1)) * 100)}%` : "0%", sublabel: "Complete", icon: <Target className="w-5 h-5" /> },
  ];

  const topJobs = (dashData?.applied_recently ?? []).slice(0, 4).map((job) => ({
    id: job.id, title: job.job_title, company: job.company, location: "—", fitScore: 75, posted: job.applied_date,
  }));

  const roadmapItems = (dashData?.weekly_goals ?? []).map((goal) => ({
    skill: goal.title, progress: goal.completed ? 100 : 0,
  }));

  const KANBAN_COLUMNS = ["saved", "applied", "interview", "offer"] as const;
  const kanbanData = KANBAN_COLUMNS.map((status) => {
    const items = applications
      .filter((a) => a.status === status)
      .map((a) => ({ id: a.id ?? "", title: a.job_title, company: a.company }));
    return { title: status.charAt(0).toUpperCase() + status.slice(1), count: items.length, items };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Good morning{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h2>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Top job matches today</h3>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => onNavigate?.("jobs")}>
              See all <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {topJobs.map((job) => (
              <div key={job.id} onClick={() => onNavigate?.("job-detail", job.id)} className="cursor-pointer">
                <JobCard {...job} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card
            className="p-4 border border-border bg-card cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => onNavigate?.("roadmap")}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Roadmap progress</h3>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-3">
              {roadmapItems.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">{item.skill}</span>
                    <span className="font-medium">{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-1.5" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 border border-primary/30 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">AI nudge</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {dashData?.skill_gaps.length
                    ? `Gap areas: ${dashData.skill_gaps.slice(0, 3).join(", ")}.`
                    : "You're on track! Keep up the momentum."}
                </p>
                <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white" onClick={() => onNavigate?.("jobs")}>
                  View roles
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-5 border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Application pipeline</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={() => onNavigate?.("kanban")}
          >
            See all <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {kanbanData.map((column, idx) => (
            <KanbanColumn key={idx} {...column} />
          ))}
        </div>
      </Card>
    </div>
  );
}
