import * as React from "react";
import { Card, SignatureCard } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import {
  Upload, FileText, Sparkles, CheckCircle2, Briefcase,
  GraduationCap, Code2, FolderGit2, User, Pencil, Download,
  Plus, Star, Loader2
} from "lucide-react";
import { useUser } from "../../contexts";
import { uploadCv, getUserProfile, getSkills } from "../../../lib/api";

// Backend types
interface ParsedSkill {
  name: string;
  level: number;
  category: string;
}

interface ParsedExperience {
  role: string;
  company: string;
  period: string;
  bullets: string[];
}

interface ParsedEducation {
  degree: string;
  institution: string;
  period: string;
  gpa: string;
}

interface ParsedProject {
  name: string;
  stack: string;
  description: string;
  link: string;
}

interface ParsedProfile {
  name: string;
  title: string;
  targetRole: string;
  experienceYears: number;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: ParsedSkill[];
  experience: ParsedExperience[];
  education: ParsedEducation[];
  projects: ParsedProject[];
}

const EMPTY_PROFILE: ParsedProfile = {
  name: "", title: "", targetRole: "", experienceYears: 0, email: "",
  phone: "", location: "", linkedin: "", github: "", summary: "",
  skills: [], experience: [], education: [], projects: [],
};

const SKILL_CAT_LABEL: Record<string, string> = {
  lang: "Languages",
  ml: "Machine Learning",
  backend: "Backend",
  frontend: "Frontend",
  devops: "DevOps & Tools",
};

const SKILL_CAT_COLOR: Record<string, string> = {
  lang: "var(--color-primary)",
  ml: "var(--color-chart-2)",
  backend: "var(--color-chart-1)",
  frontend: "var(--color-chart-4)",
  devops: "var(--color-chart-7)",
};

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// Map backend skills to our internal format
function mapBackendSkills(skills: string[]): ParsedSkill[] {
  return skills.map((name) => ({ name, level: 75, category: "lang" }));
}

export function CVProfile() {
  const { user } = useUser();
  const [profile, setProfile] = React.useState<ParsedProfile>(EMPTY_PROFILE);
  const [uploaded, setUploaded] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const [cvFileName, setCvFileName] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Load profile from backend on mount
  React.useEffect(() => {
    if (!user) return;
    getUserProfile()
      .then((p) => {
        setProfile({
          name: p.user_id ?? "User",
          title: "",
          targetRole: "",
          experienceYears: 0,
          email: "",
          phone: "",
          location: "",
          linkedin: "",
          github: "",
          summary: "",
          skills: (p.skills ?? []).map((s: string) => ({ name: s, level: 75, category: "lang" })),
          experience: (p.experience ?? []).map((e) => ({
            role: e.position ?? "",
            company: e.institution ?? "",
            period: [e.start_date, e.end_date].filter(Boolean).join(" – "),
            bullets: e.content ? [e.content] : [],
          })),
          education: (p.education ?? []).map((e) => ({
            degree: e.content ?? "",
            institution: e.institution ?? "",
            period: [e.start_date, e.end_date].filter(Boolean).join(" – "),
            gpa: "",
          })),
          projects: [],
        });
        setUploaded(true);
      })
      .catch(() => {
        setUploaded(false);
      });
  }, [user]);

  const skillGroups = groupBy(profile.skills, "category");
  const overallScore = Math.round(
    profile.skills.reduce((s, sk) => s + sk.level, 0) / Math.max(profile.skills.length, 1)
  );
  const topSkills = [...profile.skills]
    .sort((a, b) => b.level - a.level)
    .slice(0, 4)
    .map((sk) => sk.name);

  const handleFile = async (file: File) => {
    setUploadError("");
    setUploading(true);
    try {
      const result = await uploadCv(file);
      setCvFileName(file.name);
      console.log("CV uploaded successfully:", result);
      
      try {
        const p = await getUserProfile();
        setProfile({
          name: p.user_id ?? "User",
          title: "",
          targetRole: "",
          experienceYears: 0,
          email: "",
          phone: "",
          location: "",
          linkedin: "",
          github: "",
          summary: "",
          skills: (p.skills ?? []).map((s: string) => ({ name: s, level: 75, category: "lang" })),
          experience: (p.experience ?? []).map((e) => ({
            role: e.position ?? "",
            company: e.institution ?? "",
            period: [e.start_date, e.end_date].filter(Boolean).join(" – "),
            bullets: e.content ? [e.content] : [],
          })),
          education: (p.education ?? []).map((e) => ({
            degree: e.content ?? "",
            institution: e.institution ?? "",
            period: [e.start_date, e.end_date].filter(Boolean).join(" – "),
            gpa: "",
          })),
          projects: [],
        });
        setUploaded(true);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setProfile(EMPTY_PROFILE);
        setUploaded(true);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (!uploaded) {
    return (
      <div className="space-y-section">
        <section className="section-padding container-editorial">
          <h2 className="text-display-lg mb-2">My CV</h2>
          <p className="text-body-md text-muted-foreground">Upload your CV to unlock AI-powered job matching and personalized recommendations</p>
        </section>

        <section className="section-padding container-editorial">
          {/* Upload zone */}
          <Card
            className={`border-2 border-dashed transition-colors p-16 flex flex-col items-center justify-center gap-6 cursor-pointer rounded-lg ${
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="text-center">
              <p className="text-title-sm mb-1">{uploading ? "Uploading..." : "Drop your CV here"}</p>
              <p className="text-body-md text-muted-foreground">Supports PDF, DOC, DOCX · Max 5MB</p>
            </div>
            <Button disabled={uploading}>
              {uploading ? "Uploading..." : "Browse files"}
            </Button>
          </Card>

          {uploadError && (
            <Card className="p-4 border border-destructive/50 bg-destructive/5 rounded-lg">
              <p className="text-body-md text-destructive">{uploadError}</p>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Sparkles className="w-5 h-5 text-primary" />, title: "AI fit scoring", desc: "Every job card shows how well it matches your CV" },
              { icon: <FileText className="w-5 h-5 text-primary" />, title: "Cover letters", desc: "Generate tailored cover letters in one click" },
              { icon: <Star className="w-5 h-5 text-primary" />, title: "Skill roadmap", desc: "Get a personalised learning plan based on your gaps" },
            ].map((f) => (
              <Card key={f.title} className="p-6 border border-border">
                <div className="mb-2">{f.icon}</div>
                <p className="text-label-md mb-1">{f.title}</p>
                <p className="text-body-md text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-section">
      {/* Header */}
      <section className="section-padding container-editorial">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-display-lg mb-2">My CV</h2>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-body-md font-medium text-primary">CV parsed successfully</span>
              {cvFileName && <span className="text-body-md text-muted-foreground">· {cvFileName}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-border gap-1.5">
              <Download className="w-4 h-4" /> Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-border gap-1.5"
              onClick={() => setUploaded(false)}
            >
              <Upload className="w-4 h-4" /> Replace
            </Button>
          </div>
        </div>
      </section>

      <section className="section-padding container-editorial">
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8">
          <div className="space-y-6">
            {/* Personal info */}
            <Card className="p-6 border border-border">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">{profile.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="text-label-md">{profile.name}</h3>
                    <p className="text-body-md text-muted-foreground">{profile.title}</p>
                    <p className="text-caption text-muted-foreground mt-0.5">{profile.location}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-body-md text-muted-foreground leading-relaxed">{profile.summary || "No summary available"}</p>
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-4 text-caption text-muted-foreground">
                <span>{profile.email}</span>
                <span>{profile.phone}</span>
                <span>{profile.linkedin}</span>
                <span>{profile.github}</span>
              </div>
            </Card>

            <Tabs defaultValue="skills" className="space-y-4">
              <TabsList className="w-full">
                <TabsTrigger value="skills" className="flex-1">Skills</TabsTrigger>
                <TabsTrigger value="experience" className="flex-1">Experience</TabsTrigger>
                <TabsTrigger value="education" className="flex-1">Education</TabsTrigger>
                <TabsTrigger value="projects" className="flex-1">Projects</TabsTrigger>
              </TabsList>

              <TabsContent value="skills">
                <Card className="p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-label-md flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-muted-foreground" /> Skills
                    </h3>
                    <Button variant="ghost" size="sm" className="text-muted-foreground gap-1">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                  </div>
                  <div className="space-y-6">
                    {Object.entries(skillGroups).map(([cat, skills]) => (
                      <div key={cat}>
                        <p
                          className="text-caption mb-3"
                          style={{ color: SKILL_CAT_COLOR[cat] }}
                        >
                          {SKILL_CAT_LABEL[cat]}
                        </p>
                        <div className="space-y-3">
                          {skills.map((sk) => (
                            <div key={sk.name}>
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-muted-foreground">{sk.name}</span>
                                <span className="font-medium">{sk.level}%</span>
                              </div>
                              <div className="h-1 bg-border rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${sk.level}%`, backgroundColor: SKILL_CAT_COLOR[cat] }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="experience">
                <Card className="p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-label-md flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" /> Experience
                    </h3>
                    <Button variant="ghost" size="sm" className="text-muted-foreground gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </Button>
                  </div>
                  <div className="space-y-6">
                    {profile.experience.map((exp, i) => (
                      <div key={i} className={i > 0 ? "pt-6 border-t border-border" : ""}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-label-md">{exp.role}</p>
                            <p className="text-body-md text-muted-foreground">{exp.company}</p>
                          </div>
                          <span className="text-caption text-muted-foreground shrink-0 ml-4">{exp.period}</span>
                        </div>
                        <ul className="space-y-1.5">
                          {exp.bullets.map((b, j) => (
                            <li key={j} className="text-body-md text-muted-foreground flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-border mt-1.5 shrink-0" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="education">
                <Card className="p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-label-md flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-primary" /> Education
                    </h3>
                    <Button variant="ghost" size="sm" className="text-muted-foreground gap-1">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                  </div>
                  {profile.education.map((edu, i) => (
                    <div key={i} className={i > 0 ? "pt-4 border-t border-border" : ""}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-label-md">{edu.degree}</p>
                          <p className="text-body-md text-muted-foreground">{edu.institution}</p>
                          <p className="text-caption text-muted-foreground mt-0.5">GPA: {edu.gpa}</p>
                        </div>
                        <span className="text-caption text-muted-foreground shrink-0 ml-4">{edu.period}</span>
                      </div>
                    </div>
                  ))}
                </Card>
              </TabsContent>

              <TabsContent value="projects">
                <Card className="p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-label-md flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-primary" /> Projects
                    </h3>
                    <Button variant="ghost" size="sm" className="text-muted-foreground gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </Button>
                  </div>
                  <div className="space-y-5">
                    {profile.projects.map((proj, i) => (
                      <div key={i} className={i > 0 ? "pt-5 border-t border-border" : ""}>
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-label-md">{proj.name}</p>
                          <span className="text-caption text-muted-foreground truncate ml-4">{proj.link}</span>
                        </div>
                        <p className="text-caption text-muted-foreground mb-2">{proj.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {proj.stack.split(", ").map((s: string) => (
                            <Badge key={s} variant="secondary" size="sm" className="border border-border">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-label-md flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" /> CV health
                </h3>
                <span className="text-label-md font-medium text-primary">{overallScore}%</span>
              </div>
              <Progress value={overallScore} className="h-1.5 mb-6" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-caption text-muted-foreground">Experience</p>
                  <p className="font-medium">{profile.experienceYears} years</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Target role</p>
                  <p className="font-medium">{profile.targetRole}</p>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-caption text-muted-foreground mb-3">Top skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {topSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" size="sm" className="border border-border">{skill}</Badge>
                  ))}
                </div>
              </div>
            </Card>

            <SignatureCard variant="coral">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">AI suggestion</p>
                  <p className="text-body-md text-muted-foreground">
                    Adding AWS and Kubernetes to your CV would unlock 12 more high-fit roles in your target companies.
                  </p>
                </div>
              </div>
            </SignatureCard>
          </div>
        </div>
      </section>
    </div>
  );
}