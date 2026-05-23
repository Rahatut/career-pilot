import * as React from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "../ui/sheet";
import { MapPin, Building2, Calendar, Plus, Sparkles, FileText, Pencil, Check } from "lucide-react";
import {
  getApplications, createApplication, updateApplication, deleteApplication,
  generateCoverLetter, type Application,
} from "../../../lib/api";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  fitScore: number;
  appliedDate?: string;
  interviewDate?: string;
  notes?: string;
  coverLetter?: string;
  history: string[];
}

interface Column {
  id: string;
  title: string;
  accentColor?: string;
  jobs: Job[];
}

const STATUS_COLUMNS: { id: Application["status"]; title: string; accentColor?: string }[] = [
  { id: "saved", title: "Saved" },
  { id: "applied", title: "Applied" },
  { id: "interview", title: "Interviewing", accentColor: "#1d4ed8" },
  { id: "offer", title: "Offer", accentColor: "#3b82f6" },
  { id: "rejected", title: "Rejected", accentColor: "#94a3b8" },
];

function mapApp(app: Application): Job {
  return {
    id: app.id ?? "",
    title: app.job_title,
    company: app.company,
    location: app.deadline ?? "",
    fitScore: 0,
    appliedDate: app.applied_date,
    notes: app.notes,
    history: [],
  };
}

function buildColumns(apps: Application[]): Column[] {
  return STATUS_COLUMNS.map((col) => ({
    ...col,
    jobs: apps.filter((a) => a.status === col.id).map(mapApp),
  }));
}

export function KanbanBoard() {
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [columns, setColumns] = React.useState<Column[]>(() => buildColumns([]));
  const [activeJob, setActiveJob] = React.useState<Job | null>(null);
  const [activeStatus, setActiveStatus] = React.useState<string>("");
  const [notesDraft, setNotesDraft] = React.useState("");
  const [editingNotes, setEditingNotes] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [newJob, setNewJob] = React.useState({ title: "", company: "", location: "" });

  React.useEffect(() => {
    getApplications()
      .then((apps) => { setApplications(apps); setColumns(buildColumns(apps)); })
      .catch(() => {});
  }, []);

  const refresh = () =>
    getApplications().then((apps) => { setApplications(apps); setColumns(buildColumns(apps)); }).catch(() => {});

  const openJob = (job: Job, status: string) => {
    setActiveJob(job);
    setActiveStatus(status);
    setNotesDraft(job.notes ?? "");
    setEditingNotes(false);
  };

  const saveNotes = () => {
    if (!activeJob?.id) return;
    updateApplication(activeJob.id, { notes: notesDraft })
      .then(() => {
        setActiveJob({ ...activeJob, notes: notesDraft });
        setEditingNotes(false);
        refresh();
      })
      .catch(() => {});
  };

  const addJob = () => {
    if (!newJob.title.trim()) return;
    createApplication({ job_title: newJob.title, company: newJob.company, status: "saved", notes: newJob.location })
      .then(() => { setNewJob({ title: "", company: "", location: "" }); setAddOpen(false); refresh(); })
      .catch(() => {});
  };

  const updateStatus = (jobId: string, status: Application["status"]) => {
    updateApplication(jobId, { status })
      .then(() => { setActiveJob(null); refresh(); })
      .catch(() => {});
  };

  const addCardToColumn = (status: Application["status"]) => {
    createApplication({ job_title: "Untitled", company: "", status, notes: "" })
      .then(() => refresh())
      .catch(() => {});
  };

  return (
    <div className="space-y-6">
      <Sheet open={!!activeJob} onOpenChange={(open) => !open && setActiveJob(null)}>
        <SheetContent side="right" className="p-0 sm:max-w-lg">
          {activeJob && (
            <div className="flex flex-col h-full">
              <SheetHeader className="border-b border-border">
                <SheetTitle>{activeJob.title}</SheetTitle>
                <p className="text-sm text-muted-foreground">{activeJob.company} · {activeStatus}</p>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <Card className="p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Fit score</p>
                    <Badge className="border border-border">{activeJob.fitScore}%</Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" /> {activeJob.company}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> {activeJob.location}
                    </div>
                    {(activeJob.appliedDate || activeJob.interviewDate) && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {activeJob.interviewDate
                          ? `Interview: ${activeJob.interviewDate}`
                          : `Applied: ${activeJob.appliedDate}`}
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Notes</p>
                    {!editingNotes && (
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        onClick={() => setEditingNotes(true)}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        className="min-h-[120px]"
                      />
                      <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={saveNotes}>
                        <Check className="w-3.5 h-3.5 mr-1" /> Save notes
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {activeJob.notes || "No notes yet. Add key details, follow-ups, or interview prep."}
                    </p>
                  )}
                </Card>

                <Card className="p-4 border border-border">
                  <p className="text-sm font-medium mb-2">Status history</p>
                  <div className="space-y-2">
                    {activeJob.history.map((entry, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                        {entry}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium">Cover letter</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeJob.coverLetter
                      ? activeJob.coverLetter
                      : "Generate a tailored cover letter once you mark this role as applied."}
                  </p>
                </Card>
              </div>

              <SheetFooter className="border-t border-border">
                <Button variant="outline" className="border-border w-full sm:w-auto">
                  <FileText className="w-4 h-4 mr-2" /> View cover letter
                </Button>
                <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto" onClick={() => { if (activeJob?.id) updateStatus(activeJob.id, "applied"); }}>
                  Update status
                </Button>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Application tracker</h2>
          <p className="text-sm text-muted-foreground">
            Drag cards to update status, or open a card to add notes and updates
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Job
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{column.title}</h3>
              <Badge variant="secondary" className="border border-border">
                {column.jobs.length}
              </Badge>
            </div>

            <div className="space-y-3 flex-1">
              {column.jobs.map((job) => (
                <Card
                  key={job.id}
                  className={`p-4 border bg-card hover:border-primary/30 transition-all cursor-pointer ${
                    column.accentColor ? "border-l-2" : "border-border"
                  }`}
                  style={column.accentColor ? { borderLeftColor: column.accentColor } : {}}
                  onClick={() => openJob(job, column.title)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium mb-1">{job.title}</h4>
                    <Badge className="border border-border text-xs">{job.fitScore}%</Badge>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" />
                      <span>{job.company}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      <span>{job.location}</span>
                    </div>
                    {(job.appliedDate || job.interviewDate) && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {job.interviewDate
                            ? `Interview: ${job.interviewDate}`
                            : `Applied: ${job.appliedDate}`}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              <Button
                variant="outline"
                className="w-full border-dashed border-border hover:border-primary/50 text-muted-foreground"
                size="sm"
                onClick={() => addCardToColumn(column.id as Application["status"])}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add card
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={addOpen} onOpenChange={(open) => { if (!open) setAddOpen(false); }}>
        <SheetContent side="right" className="p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle>Add Job</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Job Title</label>
              <Input placeholder="e.g. ML Engineer Intern" value={newJob.title} onChange={(e) => setNewJob((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Company</label>
              <Input placeholder="e.g. Google" value={newJob.company} onChange={(e) => setNewJob((p) => ({ ...p, company: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes</label>
              <Input placeholder="Optional notes or location" value={newJob.location} onChange={(e) => setNewJob((p) => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <SheetFooter className="border-t border-border p-4">
            <Button variant="outline" className="border-border w-full" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 w-full" onClick={addJob}>Add Job</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
