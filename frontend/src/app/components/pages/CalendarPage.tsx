import * as React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar,
  Briefcase, Target, CheckCircle2, Clock
} from "lucide-react";
import {
  format, getDaysInMonth, getDay, startOfMonth, addMonths, subMonths,
  isSameDay, isToday, addDays, startOfWeek, parseISO
} from "date-fns";
import { getGoals, createGoal, getTasks, createTask, getApplications, type Goal, type Task, type Application } from "../../../lib/api";

// ── Event types ─────────────────────────────────────────────────────────────
type EventType = "interview" | "goal" | "task" | "job";

interface CalEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: EventType;
  label: string;
  time?: string;
  detail?: string;
}

const TYPE_CONFIG: Record<EventType, { bg: string; border: string; text: string; label: string; icon: React.ReactNode }> = {
  interview: { bg: "#eff6ff", border: "#1d4ed8", text: "#1d4ed8", label: "Interview", icon: <Briefcase className="w-3 h-3" /> },
  goal:      { bg: "#eff6ff", border: "#2563eb", text: "#2563eb", label: "Goal deadline", icon: <Target className="w-3 h-3" /> },
  task:      { bg: "#eff6ff", border: "#3b82f6", text: "#3b82f6", label: "Task due", icon: <CheckCircle2 className="w-3 h-3" /> },
  job:       { bg: "#eff6ff", border: "#60a5fa", text: "#60a5fa", label: "Job deadline", icon: <Clock className="w-3 h-3" /> },
};

const MOCK_EVENTS: CalEvent[] = [
  { id: "e1",  date: "2026-05-23", type: "task",      label: "Update portfolio README",       time: "9:00 AM" },
  { id: "e2",  date: "2026-05-26", type: "interview", label: "Interview – Linear SWE",         time: "2:00 PM", detail: "Video call via Zoom. Prepare system design questions." },
  { id: "e3",  date: "2026-05-28", type: "task",      label: "Submit Stripe application",     time: "11:59 PM" },
  { id: "e4",  date: "2026-05-29", type: "goal",      label: "CV update deadline",            detail: "Goal: Update CV with latest internship and projects." },
  { id: "e5",  date: "2026-05-31", type: "job",       label: "Google ML Intern deadline",     time: "11:59 PM" },
  { id: "e6",  date: "2026-06-03", type: "task",      label: "Mock interview session",        time: "4:00 PM" },
  { id: "e7",  date: "2026-06-05", type: "goal",      label: "LeetCode 30 problems goal",    detail: "Complete 30 medium/hard problems." },
  { id: "e8",  date: "2026-06-10", type: "interview", label: "Interview – OpenAI Research",  time: "10:00 AM", detail: "Technical + research presentation round." },
  { id: "e9",  date: "2026-06-15", type: "job",       label: "Microsoft SWE deadline",       time: "11:59 PM" },
  { id: "e10", date: "2026-06-20", type: "goal",      label: "System Design mastery goal",   detail: "Complete Grokking System Design + 3 practice designs." },
  { id: "e11", date: "2026-06-22", type: "interview", label: "Interview – Figma PM role",   time: "1:00 PM" },
  { id: "e12", date: "2026-06-28", type: "task",      label: "Renew LinkedIn Premium trial", time: "Before midnight" },
];

function buildEvents(goals: Goal[], tasks: Task[], applications: Application[]): CalEvent[] {
  const goalEvents: CalEvent[] = goals.filter((g) => g.target_date).map((g) => ({
    id: `goal-${g.id}`, date: g.target_date!, type: "goal" as EventType,
    label: g.title, detail: g.description,
  }));
  const taskEvents: CalEvent[] = tasks.filter((t) => t.due_date).map((t) => ({
    id: `task-${t.id}`, date: t.due_date!, type: "task" as EventType,
    label: t.title,
  }));
  const jobEvents: CalEvent[] = applications.filter((a) => a.deadline).map((a) => ({
    id: `job-${a.id}`, date: a.deadline!, type: "job" as EventType,
    label: `${a.job_title} @ ${a.company}`,
  }));
  return [...MOCK_EVENTS, ...goalEvents, ...taskEvents, ...jobEvents];
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function eventsOnDate(date: Date, events: CalEvent[]) {
  return events.filter((e) => isSameDay(parseISO(e.date), date));
}

function eventsOnWeekDay(weekStart: Date, dayIndex: number, events: CalEvent[]) {
  return eventsOnDate(addDays(weekStart, dayIndex), events);
}

// ── Add event modal ──────────────────────────────────────────────────────────
function AddEventModal({ onClose, onAdd }: { onClose: () => void; onAdd: (e: CalEvent) => void }) {
  const [label, setLabel] = React.useState("");
  const [date, setDate] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [type, setType] = React.useState<EventType>("task");
  const [time, setTime] = React.useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    const id = Date.now().toString();
    if (type === "goal") {
      createGoal({ title: label, description: time, target_date: date })
        .then((g) => onAdd({ id: `goal-${g.id}`, date, type, label, time }))
        .catch(() => onAdd({ id, date, type, label, time }));
    } else if (type === "task") {
      createTask({ title: label, due_date: date })
        .then((t) => onAdd({ id: `task-${t.id}`, date, type, label, time }))
        .catch(() => onAdd({ id, date, type, label, time }));
    } else {
      onAdd({ id, date, type, label, time: time || undefined });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <Card className="w-full max-w-md p-6 border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold">Add event</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Event name</label>
            <Input placeholder="e.g. Interview at Google" value={label} onChange={(e) => setLabel(e.target.value)} className="border-border" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-border" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Time (optional)</label>
              <Input placeholder="2:00 PM" value={time} onChange={(e) => setTime(e.target.value)} className="border-border" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(TYPE_CONFIG) as [EventType, typeof TYPE_CONFIG[EventType]][]).map(([t, cfg]) => (
                <button
                  key={t} type="button" onClick={() => setType(t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={type === t
                    ? { backgroundColor: cfg.border, color: "#fff", borderColor: cfg.border }
                    : { backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border + "60" }
                  }
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 border-border" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">Add event</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ── Event pill ───────────────────────────────────────────────────────────────
function EventPill({ event, onClick }: { event: CalEvent; onClick: (e: React.MouseEvent, ev: CalEvent) => void }) {
  const cfg = TYPE_CONFIG[event.type];
  return (
    <button
      className="w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-opacity hover:opacity-80 mb-0.5"
      style={{ backgroundColor: cfg.bg, color: cfg.text, borderLeft: `2px solid ${cfg.border}` }}
      onClick={(e) => onClick(e, event)}
    >
      {event.label}
    </button>
  );
}

// ── Event popover ────────────────────────────────────────────────────────────
function EventPopover({ event, rect, onClose }: { event: CalEvent; rect: DOMRect; onClose: () => void }) {
  const cfg = TYPE_CONFIG[event.type];
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const top = Math.min(rect.bottom + 8, window.innerHeight - 200);
  const left = Math.min(rect.left, window.innerWidth - 260);

  return (
    <div
      ref={ref}
      className="fixed z-50 w-60 bg-white border border-border rounded-xl shadow-xl p-4"
      style={{ top, left }}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: cfg.border }} />
        <div>
          <p className="font-medium text-sm leading-tight">{event.label}</p>
          <p className="text-xs mt-0.5" style={{ color: cfg.text }}>{cfg.label}</p>
        </div>
      </div>
      <div className="text-xs text-muted-foreground space-y-1 mt-2 pt-2 border-t border-border">
        <p>📅 {format(parseISO(event.date), "EEEE, MMM d, yyyy")}</p>
        {event.time && <p>🕐 {event.time}</p>}
        {event.detail && <p className="leading-relaxed mt-1">{event.detail}</p>}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function CalendarPage() {
  const [viewDate, setViewDate] = React.useState(new Date(2026, 4, 1)); // May 2026
  const [viewMode, setViewMode] = React.useState<"month" | "week">("month");
  const [events, setEvents] = React.useState<CalEvent[]>(MOCK_EVENTS);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [activeEvent, setActiveEvent] = React.useState<{ event: CalEvent; rect: DOMRect } | null>(null);
  const [selectedFilter, setSelectedFilter] = React.useState<EventType | "all">("all");

  React.useEffect(() => {
    Promise.all([getGoals(), getTasks(), getApplications()])
      .then(([goals, tasks, applications]) => setEvents(buildEvents(goals, tasks, applications)))
      .catch(() => {});
  }, []);

  const filteredEvents = selectedFilter === "all" ? events : events.filter((e) => e.type === selectedFilter);

  // Month grid
  const firstOfMonth = startOfMonth(viewDate);
  const daysInMonth = getDaysInMonth(viewDate);
  const startDay = getDay(firstOfMonth); // 0=Sun
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;

  // Week grid
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am–8pm

  const handleEventClick = (e: React.MouseEvent, event: CalEvent) => {
    e.stopPropagation();
    setActiveEvent({ event, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() });
  };

  const addEvent = (ev: CalEvent) => setEvents((prev) => [...prev, ev]);

  const upcomingEvents = [...filteredEvents]
    .filter((e) => parseISO(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  return (
    <div className="space-y-5 h-full">
      {showAddModal && <AddEventModal onClose={() => setShowAddModal(false)} onAdd={addEvent} />}
      {activeEvent && (
        <EventPopover event={activeEvent.event} rect={activeEvent.rect} onClose={() => setActiveEvent(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Calendar</h2>
          <p className="text-sm text-muted-foreground">Interviews, deadlines, and tasks — all in one place</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> Add event
        </Button>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Nav */}
        <div className="flex items-center gap-1 border border-border rounded-lg p-1">
          <button
            className="p-1.5 rounded hover:bg-muted transition-colors"
            onClick={() => setViewDate(subMonths(viewDate, 1))}
          ><ChevronLeft className="w-4 h-4 text-muted-foreground" /></button>
          <span className="text-sm font-medium px-3 min-w-[130px] text-center">
            {format(viewDate, "MMMM yyyy")}
          </span>
          <button
            className="p-1.5 rounded hover:bg-muted transition-colors"
            onClick={() => setViewDate(addMonths(viewDate, 1))}
          ><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        {/* Today */}
        <Button variant="outline" size="sm" className="border-border" onClick={() => setViewDate(new Date())}>
          Today
        </Button>

        {/* View toggle */}
        <div className="flex border border-border rounded-lg overflow-hidden">
          {(["month", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === v ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Filter by type */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              selectedFilter === "all" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"
            }`}
          >All</button>
          {(Object.entries(TYPE_CONFIG) as [EventType, typeof TYPE_CONFIG[EventType]][]).map(([t, cfg]) => (
            <button
              key={t}
              onClick={() => setSelectedFilter(t === selectedFilter ? "all" : t)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all"
              style={selectedFilter === t
                ? { backgroundColor: cfg.border, color: "#fff", borderColor: cfg.border }
                : { backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border + "60" }
              }
            >
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* ── Calendar grid ─────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <Card className="border border-border overflow-hidden">
            {viewMode === "month" && (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-border">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2.5">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {Array.from({ length: totalCells }).map((_, idx) => {
                    const dayNum = idx - startDay + 1;
                    const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                    const cellDate = isValid ? new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNum) : null;
                    const dayEvents = cellDate ? eventsOnDate(cellDate, filteredEvents) : [];
                    const today = cellDate && isToday(cellDate);
                    const isLast = idx >= totalCells - 7;
                    return (
                      <div
                        key={idx}
                        className={`min-h-[90px] p-1.5 border-b border-r border-border ${isLast ? "border-b-0" : ""} ${idx % 7 === 6 ? "border-r-0" : ""} ${!isValid ? "bg-muted/20" : "hover:bg-muted/30 transition-colors"}`}
                      >
                        {isValid && (
                          <>
                            <div className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full mb-1 ${today ? "bg-primary text-white" : "text-foreground"}`}>
                              {dayNum}
                            </div>
                            <div className="space-y-0.5">
                              {dayEvents.slice(0, 3).map((ev) => (
                                <EventPill key={ev.id} event={ev} onClick={handleEventClick} />
                              ))}
                              {dayEvents.length > 3 && (
                                <span className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} more</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {viewMode === "week" && (
              <div className="overflow-x-auto">
                {/* Week header */}
                <div className="grid grid-cols-8 border-b border-border sticky top-0 bg-white z-10">
                  <div className="py-2.5 text-xs text-muted-foreground text-center" />
                  {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d) => (
                    <div key={d.toISOString()} className="py-2.5 text-center border-l border-border">
                      <p className="text-xs text-muted-foreground">{format(d, "EEE")}</p>
                      <p className={`text-sm font-medium mt-0.5 w-7 h-7 flex items-center justify-center rounded-full mx-auto ${isToday(d) ? "bg-primary text-white" : ""}`}>
                        {format(d, "d")}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Time slots */}
                {HOURS.map((hour) => (
                  <div key={hour} className="grid grid-cols-8 border-b border-border min-h-[52px]">
                    <div className="text-[10px] text-muted-foreground text-right pr-3 pt-1.5 leading-none">
                      {hour === 12 ? "12 PM" : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
                    </div>
                    {Array.from({ length: 7 }, (_, di) => {
                      const dayEvs = eventsOnWeekDay(weekStart, di, filteredEvents).filter((ev) => {
                        if (!ev.time) return hour === 9;
                        const h = parseInt(ev.time.split(":")[0]);
                        const isPM = ev.time.toLowerCase().includes("pm");
                        const h24 = isPM && h !== 12 ? h + 12 : (!isPM && h === 12 ? 0 : h);
                        return h24 === hour;
                      });
                      return (
                        <div key={di} className="border-l border-border p-0.5 relative">
                          {dayEvs.map((ev) => (
                            <EventPill key={ev.id} event={ev} onClick={handleEventClick} />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Upcoming sidebar ──────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Legend */}
          <Card className="p-4 border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Event types</p>
            <div className="space-y-2">
              {(Object.entries(TYPE_CONFIG) as [EventType, typeof TYPE_CONFIG[EventType]][]).map(([t, cfg]) => (
                <div key={t} className="flex items-center gap-2.5 text-sm">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: cfg.border }} />
                  <span className="text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming events */}
          <Card className="p-4 border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Upcoming
            </p>
            <div className="space-y-2">
              {upcomingEvents.map((ev) => {
                const cfg = TYPE_CONFIG[ev.type];
                return (
                  <button
                    key={ev.id}
                    className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={(e) => handleEventClick(e, ev)}
                  >
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: cfg.border }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug truncate">{ev.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(parseISO(ev.date), "MMM d")}
                        {ev.time && ` · ${ev.time}`}
                      </p>
                    </div>
                  </button>
                );
              })}
              {upcomingEvents.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No upcoming events</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
