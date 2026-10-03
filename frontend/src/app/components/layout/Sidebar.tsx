import * as React from "react";
import { Home, Briefcase, MessageSquare, Kanban, FileText, Target, CalendarDays, Map, Menu, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { useUser } from "../../contexts";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  id: string;
  badge?: number;
}

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems: NavItem[] = [
  { icon: <Home className="w-4 h-4" />, label: "Dashboard", id: "dashboard" },
  { icon: <Briefcase className="w-4 h-4" />, label: "Find Jobs", id: "jobs" },
  { icon: <MessageSquare className="w-4 h-4" />, label: "AI Assistant", id: "assistant" },
  { icon: <Kanban className="w-4 h-4" />, label: "Applications", id: "kanban" },
  { icon: <FileText className="w-4 h-4" />, label: "My CV", id: "cv" },
];

const trackItems: NavItem[] = [
  { icon: <Target className="w-4 h-4" />, label: "Goals", id: "goals" },
  { icon: <CalendarDays className="w-4 h-4" />, label: "Calendar", id: "calendar" },
  { icon: <Map className="w-4 h-4" />, label: "Roadmap", id: "roadmap" },
];

function SidebarContent({ activePage, onNavigate }: SidebarProps) {
  const { user, signOut } = useUser();

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Top Nav - 64px height per DESIGN.md */}
      <div className="flex items-center h-16 px-6 border-b border-sidebar-border bg-sidebar">
        <h1 className="text-lg font-medium text-primary">CareerPilot</h1>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        <div>
          <p className="text-xs font-medium text-muted-foreground px-3 mb-2 uppercase tracking-wide">MAIN</p>
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activePage === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <Separator className="my-2" />

        <div>
          <p className="text-xs font-medium text-muted-foreground px-3 mb-2 uppercase tracking-wide">TRACK</p>
          <div className="space-y-1">
            {trackItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activePage === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="w-10 h-10 border border-border">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
          </div>
        </div>
        <Separator className="my-3" />
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[220px] flex-col h-screen sticky top-0">
        <SidebarContent activePage={activePage} onNavigate={onNavigate} />
      </aside>

      {/* Mobile Menu - Sheet from left */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-lg font-medium text-primary">CareerPilot</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="border-border">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] h-full">
              <SidebarContent activePage={activePage} onNavigate={onNavigate} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}