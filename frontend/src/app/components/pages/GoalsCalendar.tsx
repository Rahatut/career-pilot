import * as React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Target, Plus, CheckCircle2, Circle, Flame, Briefcase,
  BookOpen, FileText, Trophy, Pencil, X, Check
} from "lucide-react";

function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 5,
  color = "#2563eb",
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  const cx = size / 2;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

interface Goal {
  id: string;
  label: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  color: string;
  icon: React.ReactNode;
  category: "jobs" | "study" | "cv" | "interview";
}

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  category: "jobs" | "study" | "cv" | "interview";
  goalId: string;
  due: string; // YYYY-MM-DD
}

const CATEGORY_COLOR: Record<string, string> = {
  jobs: "#1d4ed8",
  study: "#3b82f6",
  cv: "#60a5fa",
  interview: "#94a3b8",
};

const CATEGORY_BG: Record<string, string> = {
  jobs: "bg-slate-50 border-slate-200",
  study: "bg-slate-50 border-slate-200",
  cv: "bg-slate-50 border-slate-200",
  interview: "bg-slate-50 border-slate-200",
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  jobs: <Briefcase className="w-4 h-4" />,
  study: <BookOpen className="w-4 h-4" />,
  cv: <FileText className="w-4 h-4" />,
  interview: <Target className="w-4 h-4" />,
};

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function GoalsCalendar() {
  const today = React.useMemo(() => new Date(), []);
  const overdueDate = formatDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2));
  const todayDate = formatDateInput(today);
  const futureDate = formatDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3));

  const [goals, setGoals] = React.useState<Goal[]>([
    {
      id: "g1",
      label: "Apply to jobs this week",
      target: 5,
      current: 3,
      unit: "applications",
      deadline: "May 31",
      color: CATEGORY_COLOR.jobs,
      icon: <Briefcase className="w-4 h-4" />,
      category: "jobs",
    },
    {
      id: "g2",
      label: "LeetCode problems",
      target: 30,
      current: 12,
      unit: "problems",
      deadline: "May 31",
      color: CATEGORY_COLOR.study,
      icon: <BookOpen className="w-4 h-4" />,
      category: "study",
    },
    {
      id: "g3",
      label: "Update CV",
      target: 1,
      current: 0,
      unit: "CV update",
      deadline: "May 29",
      color: CATEGORY_COLOR.cv,
      icon: <FileText className="w-4 h-4" />,
      category: "cv",
    },
    {
      id: "g4",
      label: "Mock interview sessions",
      target: 3,
      current: 1,
      unit: "sessions",
      deadline: "May 31",
      color: CATEGORY_COLOR.interview,
      icon: <Target className="w-4 h-4" />,
      category: "interview",
    },
  ]);

  const [todos, setTodos] = React.useState<TodoItem[]>([
    { id: "t1", text: "Apply to Notion ML internship", done: true, category: "jobs", goalId: "g1", due: overdueDate },
    { id: "t2", text: "Apply to Figma SWE role", done: true, category: "jobs", goalId: "g1", due: todayDate },
    { id: "t3", text: "Apply to Vercel backend role", done: false, category: "jobs", goalId: "g1", due: futureDate },
    { id: "t4", text: "Solve 5 LeetCode easy problems", done: false, category: "study", goalId: "g2", due: futureDate },
    { id: "t5", text: "Complete mock interview with peer", done: false, category: "interview", goalId: "g4", due: todayDate },
    { id: "t6", text: "Add portfolio projects to CV", done: false, category: "cv", goalId: "g3", due: overdueDate },
  ]);

  const [showGoalForm, setShowGoalForm] = React.useState(false);
  const [showTaskForm, setShowTaskForm] = React.useState(false);
  const [newGoal, setNewGoal] = React.useState({
    label: "",
    target: 5,
    unit: "tasks",
    deadline: "May 31",
    category: "jobs" as Goal["category"],
  });
  const [newTask, setNewTask] = React.useState({
    text: "",
    due: todayDate,
    goalId: "g1",
  });
  const [editingTodoId, setEditingTodoId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState("");
  const [editingDue, setEditingDue] = React.useState("");

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const startEdit = (todo: TodoItem) => {
    setEditingTodoId(todo.id);
    setEditingText(todo.text);
    setEditingDue(todo.due);
  };

  const saveEdit = () => {
    if (!editingTodoId) return;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === editingTodoId
          ? { ...t, text: editingText.trim() || t.text, due: editingDue || t.due }
          : t
      )
    );
    setEditingTodoId(null);
    setEditingText("");
    setEditingDue("");
  };

  const cancelEdit = () => {
    setEditingTodoId(null);
    setEditingText("");
    setEditingDue("");
  };

  const addGoal = () => {
    if (!newGoal.label.trim()) return;
    const id = `g${Date.now()}`;
    setGoals((prev) => [
      ...prev,
      {
        id,
        label: newGoal.label,
        target: newGoal.target,
        current: 0,
        unit: newGoal.unit,
        deadline: newGoal.deadline,
        color: CATEGORY_COLOR[newGoal.category],
        icon: CATEGORY_ICON[newGoal.category],
        category: newGoal.category,
      },
    ]);
    setNewGoal({ label: "", target: 5, unit: "tasks", deadline: "May 31", category: "jobs" });
    setShowGoalForm(false);
  };

  const addTask = () => {
    if (!newTask.text.trim()) return;
    const goal = goals.find((g) => g.id === newTask.goalId);
    const category = goal?.category ?? "jobs";
    setTodos((prev) => [
      ...prev,
      {
        id: `t${Date.now()}`,
        text: newTask.text,
        done: false,
        category,
        goalId: newTask.goalId,
        due: newTask.due,
      },
    ]);
    setNewTask({ text: "", due: todayDate, goalId: newTask.goalId });
    setShowTaskForm(false);
  };

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const classifyDue = (due: string) => {
    const dueDate = parseDateInput(due);
    if (dueDate < todayMidnight) return "overdue" as const;
    if (dueDate.getTime() === todayMidnight.getTime()) return "today" as const;
    return "future" as const;
  };

  const sortedTodos = [...todos].sort((a, b) => {
    const order = { overdue: 0, today: 1, future: 2 } as const;
    const aRank = order[classifyDue(a.due)];
    const bRank = order[classifyDue(b.due)];
    if (aRank !== bRank) return aRank - bRank;
    return parseDateInput(a.due).getTime() - parseDateInput(b.due).getTime();
  });

  const completedCount = sortedTodos.filter((t) => t.done).length;
  const streak = 7;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Goals & to-do</h2>
          <p className="text-sm text-muted-foreground">Set weekly goals and track daily tasks in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-primary border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-md">
            <Flame className="w-4 h-4" />
            <span className="font-medium">{streak} day streak</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" /> Weekly goals
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="border-border gap-1"
              onClick={() => setShowGoalForm((prev) => !prev)}
            >
              <Plus className="w-3.5 h-3.5" /> New goal
            </Button>
          </div>

          {showGoalForm && (
            <Card className="p-4 border border-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground">Goal title</label>
                  <Input
                    value={newGoal.label}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, label: e.target.value }))}
                    className="border-border mt-1"
                    placeholder="Apply to 5 jobs this week"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Target count</label>
                  <Input
                    type="number"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, target: Number(e.target.value) }))}
                    className="border-border mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Unit</label>
                  <Input
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, unit: e.target.value }))}
                    className="border-border mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Deadline</label>
                  <Input
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="border-border mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(["jobs", "study", "cv", "interview"] as const).map((cat) => (
                      <button
                        key={cat}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          newGoal.category === cat
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                        onClick={() => setNewGoal((prev) => ({ ...prev, category: cat }))}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="border-border" onClick={() => setShowGoalForm(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={addGoal}>
                  Add goal
                </Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goals.map((goal) => {
              const pct = Math.round((goal.current / goal.target) * 100);
              return (
                <Card key={goal.id} className={`p-4 border ${CATEGORY_BG[goal.category]}`}>
                  <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center shrink-0">
                      <ProgressRing progress={pct} size={64} color={goal.color} />
                      <span className="absolute text-xs font-semibold" style={{ color: goal.color }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1" style={{ color: goal.color }}>
                        {goal.icon}
                        <span className="text-xs font-medium uppercase tracking-wide">{goal.category}</span>
                      </div>
                      <p className="text-sm font-medium leading-snug mb-1">{goal.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.current} / {goal.target} {goal.unit}
                        <span className="mx-1.5">·</span>Due {goal.deadline}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              Today's tasks
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                {completedCount}/{sortedTodos.length} done
              </span>
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="border-border gap-1"
              onClick={() => setShowTaskForm((prev) => !prev)}
            >
              <Plus className="w-3.5 h-3.5" /> Add task
            </Button>
          </div>

          {showTaskForm && (
            <Card className="p-4 border border-border">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Task</label>
                  <Input
                    value={newTask.text}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, text: e.target.value }))}
                    className="border-border mt-1"
                    placeholder="Apply to Google ML intern"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Due date</label>
                    <Input
                      type="date"
                      value={newTask.due}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, due: e.target.value }))}
                      className="border-border mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Goal</label>
                    <select
                      value={newTask.goalId}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, goalId: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-border bg-input-background px-3 py-2 text-sm"
                    >
                      {goals.map((goal) => (
                        <option key={goal.id} value={goal.id}>{goal.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="border-border" onClick={() => setShowTaskForm(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={addTask}>
                  Add task
                </Button>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            {sortedTodos.map((todo) => {
              const dueClass = classifyDue(todo.due);
              const isEditing = editingTodoId === todo.id;
              return (
                <div
                  key={todo.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    todo.done ? "bg-muted/40 border-border" : "bg-card border-border hover:border-primary/30"
                  }`}
                >
                  <button
                    className="mt-0.5"
                    onClick={() => toggleTodo(todo.id)}
                    aria-label="Toggle task"
                  >
                    {todo.done ? (
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="border-border" />
                        <Input type="date" value={editingDue} onChange={(e) => setEditingDue(e.target.value)} className="border-border" />
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={saveEdit}>
                            <Check className="w-3.5 h-3.5 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="outline" className="border-border" onClick={cancelEdit}>
                            <X className="w-3.5 h-3.5 mr-1" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-sm ${todo.done ? "line-through text-muted-foreground" : ""}`}>
                            {todo.text}
                          </span>
                          <button className="text-muted-foreground hover:text-foreground" onClick={() => startEdit(todo)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              dueClass === "overdue"
                                ? "border-slate-200 bg-slate-100 text-slate-600"
                                : dueClass === "today"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                            }`}
                          >
                            {dueClass === "overdue" ? "Overdue" : dueClass === "today" ? "Due today" : "Upcoming"}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full border"
                            style={{
                              color: CATEGORY_COLOR[todo.category],
                              borderColor: CATEGORY_COLOR[todo.category] + "40",
                              backgroundColor: CATEGORY_COLOR[todo.category] + "10",
                            }}
                          >
                            {todo.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Due {todo.due}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
