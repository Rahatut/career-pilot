import * as React from "react";
import { UserProvider, useUser } from "./contexts";
import { Sidebar } from "./components/layout/Sidebar";
import { Dashboard } from "./components/pages/Dashboard";
import { FindJobs } from "./components/pages/FindJobs";
import { AIAssistant } from "./components/pages/AIAssistant";
import { KanbanBoard } from "./components/pages/KanbanBoard";
import { GoalsCalendar } from "./components/pages/GoalsCalendar";
import { CalendarPage } from "./components/pages/CalendarPage";
import { JobDetail } from "./components/pages/JobDetail";
import { CVProfile } from "./components/pages/CVProfile";
import { Roadmap } from "./components/pages/Roadmap";
import { AuthPage } from "./components/pages/AuthPage";
import { Onboarding } from "./components/pages/Onboarding";

function AppContent() {
  const [activePage, setActivePage] = React.useState("dashboard");
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);
  const { user } = useUser();

  const navigate = (page: string, jobId?: string) => {
    setActivePage(page);
    if (jobId) setSelectedJobId(jobId);
  };

  // Redirect to auth if not logged in
  if (!user) {
    return <AuthPage onAuth={() => setActivePage("onboarding")} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "onboarding":
        return <Onboarding onComplete={() => setActivePage("dashboard")} />;
      case "dashboard":
        return <Dashboard onNavigate={navigate} />;
      case "jobs":
        return <FindJobs onNavigate={navigate} />;
      case "job-detail":
        return selectedJobId ? (
          <JobDetail
            jobId={selectedJobId}
            onBack={() => setActivePage("jobs")}
            onNavigate={navigate}
          />
        ) : null;
      case "assistant":
        return <AIAssistant />;
      case "kanban":
        return <KanbanBoard />;
      case "goals":
        return <GoalsCalendar />;
      case "calendar":
        return <CalendarPage />;
      case "cv":
        return <CVProfile />;
      case "roadmap":
        return <Roadmap />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
              <p className="text-muted-foreground">This feature is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={navigate} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-[1400px] mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}