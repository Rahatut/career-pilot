import * as React from "react";
import { StatCard } from "../dashboard/StatCard";
import { JobCard } from "../dashboard/JobCard";
import { KanbanColumn } from "../dashboard/KanbanColumn";
import { Card, SignatureCard, CTABand } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Briefcase, CalendarDays, Flame, Target, TrendingUp, Sparkles, ArrowRight, AlertCircle } from "lucide-react";
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
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;
    setError(null);
    Promise.all([getDashboard(), getApplications()])
      .then(([dash, apps]) => { setDashData(dash); setApplications(apps); })
      .catch((err) => { setError(err.message); console.error("Dashboard load failed:", err); })
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
    <div className="space-y-section">
      {error && (
        <div className="mx-auto max-w-7xl px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-body-md text-destructive flex-1">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}
      {/* Hero section - white canvas with 96px rhythm */}
      <section className="section-padding container-editorial">
        <h2 className="text-display-lg mb-2">Good morning{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h2>
        <p className="text-body-md text-muted-foreground">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
      </section>

      {/* Stats grid */}
      <section className="section-padding container-editorial">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>
      </section>

      {/* Main content area - 2/3 + 1/3 split */}
      <section className="section-padding container-editorial">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Top job matches */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-title-lg">Top job matches today</h3>
                <Button variant="ghost" size="sm" className="text-primary gap-1" onClick={() => onNavigate?.("jobs")}>
                  See all <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                {topJobs.map((job) => (
                  <div key={job.id} onClick={() => onNavigate?.("job-detail", job.id)} className="cursor-pointer">
                    <JobCard {...job} />
                  </div>
                ))}
                {topJobs.length === 0 && (
                  <Card className="p-8 text-center border-border">
                    <p className="text-body-md text-muted-foreground">No recent job matches yet</p>
                    <Button className="mt-4" variant="outline" onClick={() => onNavigate?.("jobs")}>Find jobs</Button>
                  </Card>
                )}
              </div>
            </div>

            {/* Application pipeline - Kanban preview */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-title-lg">Application pipeline</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary gap-1"
                  onClick={() => onNavigate?.("kanban")}
                >
                  See all <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {kanbanData.map((column) => (
                  <KanbanColumn key={column.title} {...column} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar column - Roadmap progress + AI nudge */}
          <div className="space-y-8">
            {/* Roadmap progress card */}
            <Card className="p-6 border border-border bg-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-title-lg">Roadmap progress</h3>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-4">
                {roadmapItems.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-body-md mb-2">
                      <span className="text-muted-foreground">{item.skill}</span>
                      <span className="font-medium">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-1.5" />
                  </div>
                ))}
                {roadmapItems.length === 0 && (
                  <p className="text-body-md text-muted-foreground text-center py-4">No roadmap generated yet</p>
                )}
              </div>
            </Card>

            {/* AI nudge - signature coral card per DESIGN.md */}
            <SignatureCard variant="coral">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">AI nudge</h4>
                  <p className="text-body-md text-muted-foreground mb-4">
                    {dashData?.skill_gaps.length
                      ? `Gap areas: ${dashData.skill_gaps.slice(0, 3).join(", ")}.`
                      : "You're on track! Keep up the momentum."}
                  </p>
                  <Button size="sm" variant="secondary-on-dark" onClick={() => onNavigate?.("jobs")}>
                    View roles
                  </Button>
                </div>
              </div>
            </SignatureCard>
          </div>
        </div>
      </section>

      {/* CTA Band - light gray per DESIGN.md */}
      <section className="section-padding container-editorial">
        <CTABand>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-display-md mb-2">Ready to accelerate your career?</h3>
              <p className="text-body-md text-muted-foreground">Generate a personalized learning roadmap and start closing skill gaps today.</p>
            </div>
            <Button size="lg" onClick={() => onNavigate?.("roadmap")}>
              Generate Roadmap
            </Button>
          </div>
        </CTABand>
      </section>
    </div>
  );
}