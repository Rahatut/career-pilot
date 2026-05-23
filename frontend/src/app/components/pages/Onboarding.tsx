import * as React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import {
  Upload, CheckCircle2, Briefcase, MapPin, Clock,
  FileText, User, Code2, GraduationCap, ChevronRight, Sparkles
} from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const PARSED_SKILLS = ["Python", "PyTorch", "FastAPI", "React", "PostgreSQL", "Git", "Docker", "SQL"];
const PARSED_EXPERIENCE = [
  { role: "Software Engineering Intern", company: "Shohoz", period: "Jun–Aug 2025" },
  { role: "ML Research Assistant", company: "BUET AI Lab", period: "Jan–May 2025" },
];
const PARSED_EDUCATION = [{ degree: "BSc Computer Science & Engineering", institution: "BUET", gpa: "3.82/4.00" }];

const JOB_TYPES = ["Full-time", "Internship", "Part-time", "Remote only"];
const LOCATIONS = ["Remote", "Dhaka, Bangladesh", "Singapore", "USA", "UK", "Open to all"];
const TARGET_ROLES = [
  "Machine Learning Engineer", "Software Engineer", "Backend Engineer",
  "AI Research Intern", "Data Scientist", "Full Stack Developer",
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = React.useState(1);
  const [uploadState, setUploadState] = React.useState<"idle" | "uploading" | "parsing" | "done">("idle");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [targetRole, setTargetRole] = React.useState("Machine Learning Engineer");
  const [location, setLocation] = React.useState("Remote");
  const [jobType, setJobType] = React.useState("Internship");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const simulateUpload = () => {
    setUploadState("uploading");
    setUploadProgress(0);
    const iv = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(iv);
          setUploadState("parsing");
          setTimeout(() => setUploadState("done"), 1400);
          return 100;
        }
        return p + 8;
      });
    }, 120);
  };

  const steps = [
    { num: 1, label: "Upload CV" },
    { num: 2, label: "Confirm data" },
    { num: 3, label: "Set target" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Briefcase className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold">CareerPilot</span>
        </div>
        <button
          onClick={onComplete}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now →
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[600px]">
          {/* Step indicator */}
          <div className="flex items-center gap-0 mb-10">
            {steps.map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      step > s.num
                        ? "bg-primary text-white"
                        : step === s.num
                        ? "bg-primary text-white"
                        : "bg-muted border border-border text-muted-foreground"
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-sm hidden sm:block ${
                      step === s.num ? "font-medium text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-3 ${step > s.num ? "bg-primary/40" : "bg-border"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ── Step 1: Upload CV ─────────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-semibold mb-1.5">Upload your CV</h2>
              <p className="text-sm text-muted-foreground mb-6">
                We'll parse your skills, experience, and education automatically.
              </p>

              {uploadState === "idle" && (
                <Card
                  className={`border-2 border-dashed transition-all p-12 flex flex-col items-center justify-center gap-4 cursor-pointer ${
                    dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); simulateUpload(); }}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={simulateUpload} />
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium mb-1">Drop your CV here</p>
                    <p className="text-sm text-muted-foreground">PDF or DOCX · Max 5 MB</p>
                  </div>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">Browse files</Button>
                </Card>
              )}

              {uploadState === "uploading" && (
                <Card className="p-8 border border-border flex flex-col items-center gap-4">
                  <FileText className="w-10 h-10 text-primary" />
                  <div className="w-full">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Uploading Araf_Rahman_CV.pdf…</span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {uploadState === "parsing" && (
                <Card className="p-8 border border-border flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <div className="text-center">
                    <p className="font-medium mb-1">Parsing your CV…</p>
                    <p className="text-sm text-muted-foreground">Extracting skills, experience, and education</p>
                  </div>
                </Card>
              )}

              {uploadState === "done" && (
                <Card className="p-6 border border-blue-200 bg-blue-50">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">CV parsed successfully!</p>
                      <p className="text-sm text-muted-foreground">Araf_Rahman_CV.pdf · {PARSED_SKILLS.length} skills detected</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PARSED_SKILLS.map((s) => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700">{s}</span>
                    ))}
                  </div>
                </Card>
              )}

              <div className="flex justify-end mt-6">
                <Button
                  className="bg-primary hover:bg-primary/90 gap-2"
                  disabled={uploadState !== "done"}
                  onClick={() => setStep(2)}
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Confirm parsed data ───────────────────────────────── */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-semibold mb-1.5">Confirm your data</h2>
              <p className="text-sm text-muted-foreground mb-6">
                We extracted this from your CV. Correct anything that looks wrong.
              </p>

              <div className="space-y-4">
                {/* Skills */}
                <Card className="p-5 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Code2 className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Skills detected</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PARSED_SKILLS.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary cursor-pointer hover:bg-muted hover:border-border transition-colors"
                        title="Click to remove"
                      >
                        {s} ×
                      </span>
                    ))}
                    <button className="text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      + Add skill
                    </button>
                  </div>
                </Card>

                {/* Experience */}
                <Card className="p-5 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-sm">Experience</span>
                  </div>
                  <div className="space-y-3">
                    {PARSED_EXPERIENCE.map((exp, i) => (
                      <div key={i} className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{exp.role}</p>
                          <p className="text-xs text-muted-foreground">{exp.company}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{exp.period}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Education */}
                <Card className="p-5 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Education</span>
                  </div>
                  {PARSED_EDUCATION.map((edu, i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{edu.degree}</p>
                        <p className="text-xs text-muted-foreground">{edu.institution}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">GPA {edu.gpa}</span>
                    </div>
                  ))}
                </Card>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" className="border-border" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => setStep(3)}>
                  Looks good <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Set target ───────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-semibold mb-1.5">Set your target</h2>
              <p className="text-sm text-muted-foreground mb-6">
                This shapes your job matches, fit scores, and learning roadmap.
              </p>

              <div className="space-y-5">
                {/* Target role */}
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2 block">
                    <User className="w-4 h-4 text-muted-foreground" /> Desired role
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TARGET_ROLES.map((r) => (
                      <button
                        key={r}
                        onClick={() => setTargetRole(r)}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                          targetRole === r
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Or type a custom role…"
                    className="border-border mt-3"
                    value={!TARGET_ROLES.includes(targetRole) ? targetRole : ""}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2 block">
                    <MapPin className="w-4 h-4 text-muted-foreground" /> Preferred location
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LOCATIONS.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLocation(l)}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                          location === l
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Job type */}
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2 block">
                    <Clock className="w-4 h-4 text-muted-foreground" /> Job type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {JOB_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setJobType(t)}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                          jobType === t
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Card className="p-4 border border-primary/20 bg-primary/5 flex items-start gap-3 mt-6">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Based on <strong className="text-foreground">{targetRole}</strong> in{" "}
                  <strong className="text-foreground">{location}</strong>, we'll score every job result and generate a personalised learning roadmap for you.
                </p>
              </Card>

              <div className="flex justify-between mt-6">
                <Button variant="outline" className="border-border" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={onComplete}>
                  Go to dashboard <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
