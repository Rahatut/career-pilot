import * as React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Briefcase, Sparkles, Target, TrendingUp, ArrowRight, AlertCircle } from "lucide-react";
import { useUser } from "../../contexts/UserContext";

interface AuthPageProps {
  onAuth: () => void;
}

const FEATURES = [
  {
    icon: <Briefcase className="w-5 h-5" />,
    title: "AI job hunting",
    desc: "Natural language search. Fit-scored results. Applied in one click.",
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "CV intelligence",
    desc: "Upload once. Get personalized cover letters and skill gap analysis.",
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "Productivity tracker",
    desc: "Goals, kanban board, streak counter. Stay consistent.",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Learning roadmap",
    desc: "AI-generated weekly plan to close your skill gaps.",
  },
];

export function AuthPage({ onAuth }: AuthPageProps) {
  const [mode, setMode] = React.useState<"sign-in" | "sign-up">("sign-up");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const { signIn, signUp, isLoading, error } = useUser();
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      if (mode === "sign-up") {
        if (!name.trim()) {
          setLocalError("Please enter your name");
          return;
        }
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
      onAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setLocalError(message);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[58%] flex-col bg-[#0a0e1a] text-white relative overflow-hidden">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow */}
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">CareerPilot</span>
          </div>

          {/* Hero text */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <h1 className="text-4xl font-semibold leading-tight mb-4">
              Your AI career<br />co-pilot.
            </h1>
            <p className="text-white/50 text-lg mb-12 leading-relaxed">
              Find the right jobs, track every application, and build the skills that get you hired — all in one place.
            </p>

            <div className="space-y-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-blue-400">
                    {f.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white/90 mb-0.5">{f.title}</p>
                    <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="flex gap-8 pt-8 border-t border-white/10">
            {[["2.4k+", "Active users"], ["89%", "Interview rate"], ["4.8★", "Rating"]].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-xl font-semibold text-white/90">{val}</p>
                <p className="text-xs text-white/40 mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold">CareerPilot</span>
          </div>

          <h2 className="text-2xl font-semibold mb-1">
            {mode === "sign-up" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {mode === "sign-up"
              ? "Start your AI-powered job search today."
              : "Sign in to continue where you left off."}
          </p>

          {(localError || error) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{localError || error}</p>
            </div>
          )}

          {/* Google OAuth */}
          <Button
            variant="outline"
            className="w-full border-border gap-3 mb-4 h-11"
            onClick={onAuth}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "sign-up" && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full name</label>
                <Input
                  placeholder="Araf Rahman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-border h-11"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="araf@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-border h-11"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Password</label>
                {mode === "sign-in" && (
                  <button type="button" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border h-11"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 h-11 gap-2 mt-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>
                  {mode === "sign-up" ? "Create account" : "Sign in"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            {mode === "sign-up" ? (
              <>Already have an account?{" "}
                <button onClick={() => setMode("sign-in")} className="text-primary hover:underline font-medium">Sign in</button>
              </>
            ) : (
              <>Don't have an account?{" "}
                <button onClick={() => setMode("sign-up")} className="text-primary hover:underline font-medium">Sign up</button>
              </>
            )}
          </p>

          <p className="text-xs text-center text-muted-foreground mt-6">
            By continuing, you agree to our{" "}
            <span className="underline cursor-pointer">Terms of Service</span>{" "}
            and{" "}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
