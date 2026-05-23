import * as React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  CheckCircle2, Circle, Lock, Sparkles, BookOpen, ExternalLink,
  TrendingUp, Clock, ChevronDown, ChevronUp, Zap, Loader2
} from "lucide-react";
import { getRoadmap, generateRoadmap, type Roadmap, type RoadmapNode } from "../../../lib/api";

interface Resource {
  title: string;
  type: "video" | "article" | "course" | "practice";
  duration: string;
  url?: string;
}

interface WeekPlan {
  week: number;
  theme: string;
  focus: string;
  status: "done" | "current" | "locked";
  tasks: { text: string; done: boolean }[];
  resources: Resource[];
}

const TYPE_COLOR: Record<string, string> = {
  video: "#1d4ed8",
  article: "#2563eb",
  course: "#3b82f6",
  practice: "#60a5fa",
};

// Maps RoadmapNode from API to local WeekPlan shape
function nodeToWeek(node: RoadmapNode, index: number): WeekPlan {
  return {
    week: index + 1,
    theme: node.skill,
    focus: node.milestones?.[0] ?? "",
    status: node.status as "done" | "current" | "locked",
    tasks: (node.milestones ?? []).map((m) => ({ text: m, done: node.status === "done" })),
    resources: (node.resources ?? []).map((r) => ({
      title: r.title ?? r.name ?? "",
      type: (r.type ?? "article") as Resource["type"],
      duration: r.duration ?? "",
      url: r.url,
    })),
  };
}

// Fallback mock weeks shown while loading (when API returns no nodes)
const MOCK_WEEKS: WeekPlan[] = [
  {
    week: 1, theme: "Python & Fundamentals", focus: "Solidify core Python and CS basics",
    status: "done",
    tasks: [
      { text: "Complete Python data structures review", done: true },
      { text: "Big-O notation cheatsheet", done: true },
      { text: "Solve 10 LeetCode easy problems", done: true },
    ],
    resources: [
      { title: "CS50P — Python for CS", type: "course", duration: "8h" },
      { title: "Big-O explained visually", type: "article", duration: "20min" },
      { title: "LeetCode easy track", type: "practice", duration: "ongoing" },
    ],
  },
  {
    week: 2, theme: "Machine Learning Core", focus: "Cover supervised learning fundamentals",
    status: "done",
    tasks: [
      { text: "Linear & logistic regression from scratch", done: true },
      { text: "Decision trees and random forests", done: true },
      { text: "Train first sklearn model", done: true },
    ],
    resources: [
      { title: "Andrew Ng's ML Course (Week 1–3)", type: "course", duration: "12h" },
      { title: "Scikit-learn docs", type: "article", duration: "2h" },
      { title: "Kaggle Titanic starter", type: "practice", duration: "3h" },
    ],
  },
  {
    week: 3, theme: "Deep Learning & PyTorch", focus: "Neural networks and PyTorch workflow",
    status: "current",
    tasks: [
      { text: "Build a simple MLP in PyTorch", done: true },
      { text: "Train MNIST classifier", done: true },
      { text: "Understand backpropagation", done: false },
      { text: "Implement CNN from scratch", done: false },
    ],
    resources: [
      { title: "fast.ai Practical Deep Learning", type: "course", duration: "10h" },
      { title: "PyTorch 60-min blitz", type: "article", duration: "1h" },
      { title: "3Blue1Brown neural networks", type: "video", duration: "3h" },
      { title: "PyTorch exercises on GitHub", type: "practice", duration: "5h" },
    ],
  },
  {
    week: 4, theme: "NLP & Transformers", focus: "HuggingFace, BERT, and fine-tuning",
    status: "locked",
    tasks: [
      { text: "Understand transformer attention mechanism", done: false },
      { text: "Fine-tune BERT on custom dataset", done: false },
      { text: "Build text classification pipeline", done: false },
    ],
    resources: [
      { title: "HuggingFace NLP course", type: "course", duration: "8h" },
      { title: "Attention is All You Need (paper)", type: "article", duration: "2h" },
      { title: "Fine-tuning walkthrough video", type: "video", duration: "1.5h" },
    ],
  },
  {
    week: 5, theme: "System Design Basics", focus: "Core distributed systems concepts",
    status: "locked",
    tasks: [
      { text: "Study CAP theorem and consistency models", done: false },
      { text: "Design a URL shortener", done: false },
      { text: "Understand load balancing and caching", done: false },
    ],
    resources: [
      { title: "System Design Primer (GitHub)", type: "article", duration: "6h" },
      { title: "Designing Data-Intensive Applications", type: "course", duration: "10h" },
      { title: "Grokking System Design", type: "course", duration: "8h" },
    ],
  },
  {
    week: 6, theme: "MLOps & Deployment", focus: "Deploy ML models to production",
    status: "locked",
    tasks: [
      { text: "Containerise ML model with Docker", done: false },
      { text: "Build FastAPI inference endpoint", done: false },
      { text: "Set up basic CI/CD pipeline", done: false },
    ],
    resources: [
      { title: "MLOps Zoomcamp", type: "course", duration: "12h" },
      { title: "FastAPI + Docker tutorial", type: "video", duration: "2h" },
      { title: "GitHub Actions for ML", type: "article", duration: "1h" },
    ],
  },
  {
    week: 7, theme: "Interview Prep", focus: "LC medium, behaviorals, and mock interviews",
    status: "locked",
    tasks: [
      { text: "Solve 20 LeetCode medium problems", done: false },
      { text: "Prep STAR stories for 5 behaviorals", done: false },
      { text: "Complete 2 mock interviews", done: false },
    ],
    resources: [
      { title: "Neetcode 150 roadmap", type: "practice", duration: "ongoing" },
      { title: "Tech Interview Handbook", type: "article", duration: "3h" },
      { title: "Pramp mock interviews", type: "practice", duration: "ongoing" },
    ],
  },
  {
    week: 8, theme: "Apply & Polish", focus: "Applications, portfolio, and final prep",
    status: "locked",
    tasks: [
      { text: "Polish CV and LinkedIn", done: false },
      { text: "Apply to 10 target companies", done: false },
      { text: "Prepare company-specific research", done: false },
    ],
    resources: [
      { title: "CV LaTeX template", type: "article", duration: "1h" },
      { title: "Levels.fyi job board", type: "practice", duration: "ongoing" },
      { title: "Cold email templates", type: "article", duration: "30min" },
    ],
  },
];

const STATUS_CONFIG = {
  done: { label: "Completed", color: "#1d4ed8", bg: "bg-blue-50 border-blue-200" },
  current: { label: "In Progress", color: "#2563eb", bg: "bg-blue-50 border-blue-200" },
  locked: { label: "Upcoming", color: "#94a3b8", bg: "bg-slate-50 border-slate-200" },
};

export function Roadmap() {
  const { user } = useUser();
  const [roadmap, setRoadmap] = React.useState<Roadmap | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [expanded, setExpanded] = React.useState<number | null>(null);

  // Derive weeks from live roadmap, fall back to MOCK_WEEKS while loading
  const rawWeeks: WeekPlan[] = roadmap?.content && roadmap.content.length > 0
    ? roadmap.content.map(nodeToWeek)
    : MOCK_WEEKS;
  const weeks = rawWeeks;

  React.useEffect(() => {
    setLoading(true);
    getRoadmap()
      .then(setRoadmap)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const generated = await generateRoadmap({
        target_role: roadmap?.target_role ?? "Software Engineer",
        skill_gaps: roadmap?.skill_gaps,
        timeline_weeks: roadmap?.timeline_weeks,
      });
      setRoadmap(generated);
    } catch (e) {
      // silent fail — user can retry
    } finally {
      setGenerating(false);
    }
  };

  const completedWeeks = weeks.filter((w) => w.status === "done").length;
  const totalTasks = weeks.flatMap((w) => w.tasks).length;
  const doneTasks = weeks.flatMap((w) => w.tasks).filter((t) => t.done).length;
  const overallPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const currentWeek = weeks.find((w) => w.status === "current");
  const currentTasksDone = currentWeek?.tasks.filter((t) => t.done).length ?? 0;
  const currentTasksTotal = currentWeek?.tasks.length ?? 0;

  const skillGaps = roadmap?.skill_gaps;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Learning Roadmap</h2>
          <p className="text-sm text-muted-foreground">
            {roadmap?.target_role
              ? `AI-generated plan to reach ${roadmap.target_role}`
              : "AI-generated 8-week plan to close your skill gaps and land your target role"}
          </p>
        </div>
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 gap-1.5"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {roadmap ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Overall progress", value: loading ? "—" : `${overallPct}%`, sub: `${doneTasks}/${totalTasks} tasks`, color: "#1d4ed8" },
          { label: "Weeks done", value: loading ? "—" : `${roadmap?.weeks_completed ?? 0}/${weeks.length}`, sub: "weeks complete", color: "#2563eb" },
          { label: "Current week", value: loading ? "—" : `${currentTasksDone}/${currentTasksTotal}`, sub: "tasks this week", color: "#3b82f6" },
          { label: "Est. completion", value: roadmap?.timeline_weeks ? `${roadmap.timeline_weeks} weeks` : "—", sub: roadmap?.target_role ? `${roadmap.current_role} → ${roadmap.target_role}` : "target not set", color: "#94a3b8" },
        ].map((s) => (
          <Card key={s.label} className="p-4 border border-border bg-card">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-2xl font-semibold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Overall bar */}
      <Card className="p-4 border border-border bg-card">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> {weeks.length}-week roadmap progress
          </span>
          <span className="text-muted-foreground">{overallPct}%</span>
        </div>
        <div className="flex gap-1 h-3">
          {weeks.map((w) => {
            const wDone = w.tasks.filter(t => t.done).length;
            const wTotal = w.tasks.length;
            const fill = wTotal > 0 ? wDone / wTotal : 0;
            return (
              <div key={w.week} className="flex-1 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${fill * 100}%`,
                    backgroundColor: w.status === "done" ? "#1d4ed8" : w.status === "current" ? "#3b82f6" : "#cbd5e1",
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
          <span>Week 1</span>
          <span>Week {weeks.length}</span>
        </div>
      </Card>

      {/* AI nudge */}
      <Card className="p-4 border border-primary/20 bg-primary/5 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm mb-0.5">AI insight</p>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading your roadmap..."
              : skillGaps && skillGaps.length > 0
              ? `Focus areas: ${skillGaps.slice(0, 3).join(", ")}${skillGaps.length > 3 ? ` and ${skillGaps.length - 3} more` : ""}.`
              : currentWeek
              ? `You're on track for Week ${currentWeek.week} (${currentWeek.theme}).`
              : "Generate a roadmap to get personalized learning recommendations."}
          </p>
        </div>
      </Card>

      {/* Weekly plan accordion */}
      <div className="space-y-3">
        {weeks.map((week) => {
          const cfg = STATUS_CONFIG[week.status];
          const isOpen = expanded === week.week;
          const tasksDone = week.tasks.filter((t) => t.done).length;
          const pct = week.tasks.length > 0 ? Math.round((tasksDone / week.tasks.length) * 100) : 0;

          return (
            <Card
              key={week.week}
              className={`border transition-all overflow-hidden ${
                week.status === "current"
                  ? "border-primary/30 shadow-sm"
                  : "border-border"
              } ${week.status === "locked" ? "opacity-70" : ""}`}
            >
              <button
                className="w-full flex items-center gap-4 p-4 text-left"
                onClick={() => setExpanded(isOpen ? null : week.week)}
                disabled={week.status === "locked"}
              >
                {/* Week indicator */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ backgroundColor: cfg.color + "18", color: cfg.color }}
                >
                  {week.status === "done" ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: cfg.color }} />
                  ) : week.status === "locked" ? (
                    <Lock className="w-4 h-4" style={{ color: cfg.color }} />
                  ) : (
                    <Zap className="w-5 h-5" style={{ color: cfg.color }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-muted-foreground">Week {week.week}</span>
                    <Badge
                      className="text-xs px-2 py-0 h-5 border"
                      style={{
                        backgroundColor: cfg.color + "12",
                        color: cfg.color,
                        borderColor: cfg.color + "30",
                      }}
                    >
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm">{week.theme}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {week.status !== "locked" && (
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">{tasksDone}/{week.tasks.length} tasks</span>
                      <div className="w-20 h-1 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                        />
                      </div>
                    </div>
                  )}
                  {week.status !== "locked" && (
                    isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isOpen && week.status !== "locked" && (
                <div className="border-t border-border">
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tasks */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                        Tasks this week
                      </p>
                      <div className="space-y-2">
                        {week.tasks.map((task, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            {task.done ? (
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                            )}
                            <span
                              className={`text-sm leading-snug ${
                                task.done ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {task.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resources */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                        Resources
                      </p>
                      <div className="space-y-2">
                        {week.resources.map((res, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer group"
                            onClick={() => res.url && window.open(res.url, "_blank")}
                          >
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                              style={{ backgroundColor: TYPE_COLOR[res.type] + "18" }}
                            >
                              <BookOpen
                                className="w-3.5 h-3.5"
                                style={{ color: TYPE_COLOR[res.type] }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{res.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge
                                  className="text-xs px-1.5 py-0 h-4 border-0 capitalize"
                                  style={{
                                    backgroundColor: TYPE_COLOR[res.type] + "15",
                                    color: TYPE_COLOR[res.type],
                                  }}
                                >
                                  {res.type}
                                </Badge>
                                {res.duration && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {res.duration}
                                  </span>
                                )}
                              </div>
                            </div>
                            {res.url && (
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {week.status === "current" && (
                    <div className="px-4 pb-4 flex gap-2">
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        Mark week complete
                      </Button>
                      <Button size="sm" variant="outline" className="border-border gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Ask AI for help
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
