import * as React from "react";
import { Card, SignatureCard } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Separator } from "../ui/separator";
import {
  ArrowLeft, MapPin, Building2, Calendar, Briefcase, DollarSign,
  CheckCircle2, XCircle, Sparkles, Bookmark, ExternalLink, FileText, ChevronRight, Target, Loader2
} from "lucide-react";
import { getJobDetail, getJobFitScore, createApplication } from "../../../lib/api";
import { useUser } from "../../contexts";

// ── Backend shape ─────────────────────────────────────────────────────────────
interface BackendJobDetail {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  description: string;
  requirements: string[];
  skills: string[];
  salary: string;
  posted_date: string;
  url?: string;
}

interface BackendFitScore {
  fit_score: number;
  matched_skills: string[];
  missing_skills: string[];
  breakdown: { skills: number; experience: number; location: number; education: number };
}

// ── Local UI shape (mirrors what the component expects) ─────────────────────
interface LocalJob {
  id: string;
  title: string;
  company: string;
  companyColor: string;
  companyInitial: string;
  location: string;
  type: string;
  salary: string;
  deadline: string;
  skills: string[];
  posted: string;
  description: string;
  requirements: string[];
  requiredSkills: { skill: string; have: boolean }[];
  fitScore: number;
  fitBreakdown: { skills: number; experience: number; location: number; education: number };
  link: string;
}

function mapJob(raw: BackendJobDetail, fit: BackendFitScore | null): LocalJob {
  return {
    id: raw.id,
    title: raw.title,
    company: raw.company,
    companyColor: "#aa2d00",
    companyInitial: raw.company.charAt(0).toUpperCase(),
    location: raw.location ?? "Remote",
    type: raw.job_type ?? "Full-time",
    salary: raw.salary ?? "Competitive",
    deadline: "See link",
    skills: raw.skills ?? [],
    posted: raw.posted_date ?? "Recently posted",
    description: raw.description ?? "",
    requirements: raw.requirements ?? [],
    requiredSkills: (raw.skills ?? []).map((sk) => ({
      skill: sk,
      have: fit ? fit.matched_skills.includes(sk) : false,
    })),
    fitScore: fit ? Math.round(fit.fit_score) : 50,
    fitBreakdown: fit?.breakdown ?? { skills: 50, experience: 50, location: 50, education: 50 },
    link: raw.url ?? "#",
  };
}

function FitRing({ score }: { score: number }) {
  const size = 120;
  const sw = 10;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#0a2e0e" : score >= 60 ? "#fcab79" : "#9297a0";
  const label = score >= 80 ? "Strong match" : score >= 60 ? "Good match" : "Partial match";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e0e2e6" strokeWidth={sw} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={sw}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold" style={{ color }}>{score}%</span>
        </div>
      </div>
      <span className="text-sm font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

interface JobDetailProps {
  jobId: string;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export function JobDetail({ jobId, onBack, onNavigate }: JobDetailProps) {
  const { user } = useUser();
  const [job, setJob] = React.useState<LocalJob | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saved, setSaved] = React.useState(false);
  const [applied, setApplied] = React.useState(false);
  const [coverLetterOpen, setCoverLetterOpen] = React.useState(false);
  const [coverLetterText, setCoverLetterText] = React.useState(
    "Dear Hiring Manager,\n\nI'm excited to apply for the role at your company..."
  );

  React.useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([getJobDetail(jobId), getJobFitScore(jobId)])
      .then(([rawJob, fitScore]) => {
        setJob(mapJob(rawJob, fitScore));
      })
      .catch(() => {
        setJob(null);
      })
      .finally(() => setLoading(false));
  }, [jobId, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading job details…</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Job not found.</p>
        <Button variant="outline" onClick={onBack} className="border-border">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go back
        </Button>
      </div>
    );
  }

  const matchedSkills = job.requiredSkills.filter((s) => s.have);
  const missingSkills = job.requiredSkills.filter((s) => !s.have);
  const breakdown = job.fitBreakdown;
  const breakdownItems = [
    { label: "Skills", value: breakdown.skills, color: "#181d26" },
    { label: "Experience", value: breakdown.experience, color: "#0a2e0e" },
    { label: "Location", value: breakdown.location, color: "#aa2d00" },
    { label: "Education", value: breakdown.education, color: "#fcab79" },
  ];

  return (
    <div className="space-y-section">
      {/* Back nav */}
      <section className="section-padding container-editorial">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-body-md text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to jobs
        </button>
      </section>

      <Dialog open={coverLetterOpen} onOpenChange={setCoverLetterOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-title-lg">Generated cover letter</DialogTitle>
            <DialogDescription className="text-body-md text-muted-foreground">
              Edit the letter, then copy or download it for your application.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={coverLetterText}
            onChange={(e) => setCoverLetterText(e.target.value)}
            className="min-h-[260px] text-body-md"
          />
          <DialogFooter>
            <Button variant="outline" className="border-border">Copy text</Button>
            <Button className="bg-primary hover:bg-primary-active">Download .txt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero card */}
      <section className="section-padding container-editorial">
        <Card className="p-6 border border-border">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Company initial */}
            <div
              className="w-14 h-14 rounded-lg flex items-center justify-center text-white text-xl font-bold shrink-0 border border-border"
              style={{ backgroundColor: job.companyColor + "22", color: job.companyColor, borderColor: job.companyColor + "33" }}
            >
              {job.companyInitial}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <h2 className="text-display-md mb-1">{job.title}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-md text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" /> {job.company}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" /> {job.type}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" /> {job.salary}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> Deadline: {job.deadline}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {job.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="border border-border">{s}</Badge>
                ))}
                <span className="text-caption text-muted-foreground self-center ml-1">• Posted {job.posted}</span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Body grid */}
      <section className="section-padding container-editorial">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left – description + requirements */}
          <div className="lg:col-span-2 space-y-6">

            <Card className="p-6 border border-border">
              <h3 className="text-title-sm mb-4">Full job description</h3>
              <p className="text-body-md text-muted-foreground leading-relaxed">{job.description}</p>
            </Card>

            <Card className="p-6 border border-border">
              <h3 className="text-title-sm mb-4">Role requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-body-md text-muted-foreground">
                    <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {req}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 border border-border">
              <h3 className="text-title-sm mb-4">Required skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((s, i) => (
                  <Badge
                    key={i}
                    variant={s.have ? "forest" : "secondary"}
                    className="border"
                  >
                    {s.skill}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card className="p-6 border border-border">
              <h3 className="text-title-sm mb-4">Company info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-md">
                <div>
                  <p className="text-caption text-muted-foreground mb-1">Company</p>
                  <p className="font-medium">{job.company}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground mb-1">Location</p>
                  <p className="font-medium">{job.location}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground mb-1">Salary range</p>
                  <p className="font-medium">{job.salary}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground mb-1">Deadline</p>
                  <p className="font-medium">{job.deadline}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right – fit score + actions */}
          <div className="space-y-6 lg:sticky lg:top-6 h-fit">
            <Card className="p-6 border border-border">
              <h3 className="text-title-sm mb-6 text-center">Your fit score</h3>
              <div className="flex justify-center mb-4">
                <FitRing score={job.fitScore} />
              </div>
              <Separator className="my-4" />
              <div className="space-y-4">
                {breakdownItems.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-caption mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.value}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-title-sm">Skill match</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-caption text-muted-foreground mb-2">Matched skills</p>
                  <div className="flex flex-wrap gap-2">
                    {matchedSkills.map((s) => (
                      <Badge key={s.skill} variant="forest">{s.skill}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground mb-2">Missing skills</p>
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.map((s) => (
                      <Badge key={s.skill} variant="secondary" className="border border-border">{s.skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-border">
              <h3 className="text-title-sm mb-4">Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`justify-start border-border gap-2 ${saved ? "border-primary text-primary" : ""}`}
                  onClick={() => setSaved(!saved)}
                >
                  <Bookmark className={`w-4 h-4 ${saved ? "fill-primary" : ""}`} />
                  {saved ? "Saved" : "Save to board"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`justify-start border-border gap-2 ${applied ? "border-primary text-primary" : ""}`}
                  onClick={() => setApplied(!applied)}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {applied ? "Applied" : "Mark as applied"}
                </Button>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary-active gap-2 justify-start"
                  onClick={() => setCoverLetterOpen(true)}
                >
                  <FileText className="w-4 h-4" />
                  Generate cover letter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start border-border gap-2"
                  onClick={() => onNavigate("assistant")}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  Ask AI assistant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start border-border gap-2"
                  onClick={() => onNavigate("roadmap")}
                >
                  <Target className="w-4 h-4 text-primary" />
                  View learning roadmap
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start border-border gap-2"
                  onClick={() => window.open(job.link, "_blank", "noopener")}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open original posting
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}