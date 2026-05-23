import * as React from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Slider } from "../ui/slider";
import { Search, MapPin, Building2, Bookmark, ExternalLink, SlidersHorizontal, Filter } from "lucide-react";
import { searchJobs } from "../../../lib/api";
import { useUser } from "../../contexts";

// ── Frontend job shape (matches UI expectations) ─────────────────────────────
interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  posted: string;
  skills: string[];
  salary: string;
  deadline: string;
  fitScore: number;
  companyColor: string;
  companyInitial: string;
  saved: boolean;
  url?: string;
}

const MOCK_JOBS: JobItem[] = [
  {
    id: "1", title: "ML Engineer Intern", company: "DataMind AI", location: "Dhaka",
    type: "Internship", posted: "2 days ago", skills: ["Python", "TensorFlow", "ML"],
    salary: "৳25,000/mo", deadline: "Dec 15", fitScore: 88, companyColor: "#6366f1",
    companyInitial: "D", saved: false,
  },
  {
    id: "2", title: "Backend Developer", company: "TechNova", location: "Remote",
    type: "Full-time", posted: "5 days ago", skills: ["Node.js", "Python", "SQL"],
    salary: "৳80,000/mo", deadline: "Dec 20", fitScore: 72, companyColor: "#10b981",
    companyInitial: "T", saved: true,
  },
];

// ── Backend job → frontend JobItem ───────────────────────────────────────────
function mapJob(raw: { id: string; title: string; company: string; location: string; job_type: string; skills: string[]; posted_date: string; salary: string; fit_score: number; url?: string }): JobItem {
  const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];
  return {
    id: raw.id,
    title: raw.title,
    company: raw.company,
    location: raw.location ?? "Remote",
    type: raw.job_type ?? "Full-time",
    posted: raw.posted_date ?? "Recently posted",
    skills: raw.skills ?? [],
    salary: raw.salary ?? "Competitive",
    deadline: "See link",
    fitScore: Math.round(raw.fit_score ?? 0),
    companyColor: COLORS[raw.id.charCodeAt(0) % COLORS.length],
    companyInitial: raw.company.charAt(0).toUpperCase(),
    saved: false,
    url: raw.url,
  };
}

interface FindJobsProps {
  onNavigate?: (page: string, jobId?: string) => void;
}

export function FindJobs({ onNavigate }: FindJobsProps) {
  const { user } = useUser();
  const [rawJobs, setRawJobs] = React.useState<JobItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [savedJobs, setSavedJobs] = React.useState<Set<string>>(new Set());
  const [draftQuery, setDraftQuery] = React.useState("");
  const [query, setQuery] = React.useState("ml engineer");
  const [savedOnly, setSavedOnly] = React.useState(false);
  const [minFitScore, setMinFitScore] = React.useState(60);
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>([]);
  const [dateFilter, setDateFilter] = React.useState<"any" | "24h" | "3d" | "week">("any");
  const [hasCv, setHasCv] = React.useState(false);

  // Fetch jobs whenever query changes
  React.useEffect(() => {
    setLoading(true);
    searchJobs({ q: query, page_size: 20 })
      .then((res) => setRawJobs(res.jobs.map(mapJob)))
      .catch(() => setRawJobs(MOCK_JOBS))
      .finally(() => setLoading(false));
  }, [query]);

  // Seed savedJobs from loaded data
  React.useEffect(() => {
    setSavedJobs(new Set(rawJobs.filter(j => j.saved).map(j => j.id)));
  }, [rawJobs]);

  const jobTypes = React.useMemo(() => Array.from(new Set(rawJobs.map((j) => j.type))), []);
  const jobLocations = React.useMemo(() => Array.from(new Set(rawJobs.map((j) => j.location))), []);

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedJobs((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelection = (value: string, items: string[], setItems: (next: string[]) => void) => {
    setItems(items.includes(value) ? items.filter((i) => i !== value) : [...items, value]);
  };

  const parsePostedHours = (posted: string) => {
    const match = posted.match(/(\d+)/);
    if (!match) return 9999;
    const value = Number(match[1]);
    if (posted.includes("d")) return value * 24;
    if (posted.includes("h")) return value;
    return 9999;
  };

  const applySearch = () => {
    setQuery(draftQuery.trim());
  };

  const matchesDate = (posted: string) => {
    if (dateFilter === "any") return true;
    const hours = parsePostedHours(posted);
    if (dateFilter === "24h") return hours <= 24;
    if (dateFilter === "3d") return hours <= 72;
    return hours <= 168;
  };

  const filtered = rawJobs.filter((j) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.skills.some((s) => s.toLowerCase().includes(q));
    const matchesSaved = !savedOnly || savedJobs.has(j.id);
    const matchesFit = j.fitScore >= minFitScore;
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(j.type);
    const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(j.location);
    const matchesPosted = matchesDate(j.posted);
    return matchesQuery && matchesSaved && matchesFit && matchesType && matchesLocation && matchesPosted;
  }).sort((a, b) => b.fitScore - a.fitScore);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Job search</h2>
        <p className="text-sm text-muted-foreground">Find roles ranked by your fit score and goals</p>
      </div>

      {!hasCv && (
        <Card className="p-4 border border-blue-200 bg-blue-50/60">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Upload your CV first</p>
              <p className="text-xs text-muted-foreground">
                We need your CV to score job matches and highlight skill gaps.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => onNavigate?.("cv")}>
                Upload CV
              </Button>
              <Button size="sm" variant="outline" className="border-border" onClick={() => setHasCv(true)}>
                Dismiss
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <Card className="p-4 border border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applySearch();
          }}
          className="flex flex-col lg:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Try: Find ML internships in Dhaka open this month"
              className="pl-10 border-border"
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
            />
          </div>
          <Button type="submit" className="bg-primary hover:bg-primary/90 shrink-0">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            className={`shrink-0 border-border ${savedOnly ? "border-primary text-primary" : ""}`}
            onClick={() => setSavedOnly((prev) => !prev)}
          >
            <Bookmark className={`w-4 h-4 mr-2 ${savedOnly ? "fill-primary" : ""}`} />
            Saved only
          </Button>
        </form>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {loading ? "Fetching jobs…" : `${rawJobs.length} jobs loaded — filters apply client-side`}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Filters */}
        <Card className="p-4 border border-border h-fit">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Filters</h3>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                setSelectedTypes([]);
                setSelectedLocations([]);
                setDateFilter("any");
                setMinFitScore(60);
                setSavedOnly(false);
              }}
            >
              Reset
            </Button>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Location</p>
              <div className="flex flex-wrap gap-2">
                {jobLocations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => toggleSelection(loc, selectedLocations, setSelectedLocations)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      selectedLocations.includes(loc)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Job type</p>
              <div className="flex flex-wrap gap-2">
                {jobTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleSelection(type, selectedTypes, setSelectedTypes)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      selectedTypes.includes(type)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Date posted</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { id: "any", label: "Any time" },
                  { id: "24h", label: "Last 24h" },
                  { id: "3d", label: "Last 3 days" },
                  { id: "week", label: "Last week" },
                ] as const).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDateFilter(d.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      dateFilter === d.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Minimum fit</p>
              <div className="flex items-center gap-3">
                <Slider
                  value={[minFitScore]}
                  min={40}
                  max={100}
                  step={5}
                  onValueChange={(val) => setMinFitScore(val[0])}
                />
                <span className="text-xs font-medium text-muted-foreground w-10 text-right">
                  {minFitScore}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">
                {loading ? "Loading jobs…" : `Results`}
              </p>
              <p className="text-xs text-muted-foreground">Sorted by fit score · {filtered.length} roles</p>
            </div>
            <div className="text-xs text-muted-foreground">Showing top matches for your profile</div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filtered.map((job) => {
              const fitColor = job.fitScore >= 80
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : job.fitScore >= 60
                ? "bg-slate-50 text-slate-600 border-slate-200"
                : "bg-slate-100 text-slate-600 border-slate-200";
              const isSaved = savedJobs.has(job.id);

              return (
                <Card
                  key={job.id}
                  className="p-5 border border-border hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => onNavigate?.("job-detail", job.id)}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
                        style={{ backgroundColor: job.companyColor + "18", color: job.companyColor }}
                      >
                        {job.companyInitial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" /> {job.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {job.location}
                          </span>
                          <span className="text-xs">{job.type}</span>
                          <span className="text-xs">· {job.posted}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`${fitColor} border shrink-0`}>{job.fitScore}% fit</Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3 ml-12">
                    {job.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="border border-border text-xs">{skill}</Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground ml-12 mb-4">
                    <span>{job.salary}</span>
                    <span>Deadline {job.deadline}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 ml-12" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => toggleSave(e, job.id)}
                      className={`gap-1.5 ${isSaved ? "border-primary text-primary" : "border-border"}`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-primary" : ""}`} />
                      {isSaved ? "Saved" : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 gap-1.5"
                      onClick={(e) => { e.stopPropagation(); onNavigate?.("job-detail", job.id); }}
                    >
                      View details <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No jobs found</p>
              <p className="text-sm">Try a different search or remove filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
