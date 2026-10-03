import * as React from "react";
import { Card, SignatureCard } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Send, Sparkles, Plus, MessageSquareText } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tool?: string;
}

export function AIAssistant() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);
  const [activeSessionId, setActiveSessionId] = React.useState("s1");

  const sessions = [
    { id: "s1", title: "Fit check: Data engineer", updated: "Today" },
    { id: "s2", title: "3-month ML roadmap", updated: "Yesterday" },
    { id: "s3", title: "Cover letter for OpenAI", updated: "May 18" },
    { id: "s4", title: "Skill gaps: Backend", updated: "May 12" },
  ];

  const suggestions = [
    "Am I ready for a data engineer role?",
    "What skills am I missing?",
    "Build me a 3-month roadmap",
    "Draft a cover letter",
  ];

  const pickTool = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("roadmap")) return "Roadmap generator";
    if (lower.includes("cover letter")) return "Cover letter writer";
    if (lower.includes("ready") || lower.includes("fit")) return "Fit engine";
    if (lower.includes("skills")) return "Skill gap analyzer";
    return undefined;
  };

  const startNewChat = () => {
    setMessages([]);
    setInput("");
    setIsThinking(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    const tool = pickTool(userMessage.content);
    window.setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        tool,
        content:
          "Got it. I'll ground this in your CV and give a clear, actionable response. Here's a concise plan and the next steps I recommend based on your profile.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsThinking(false);
    }, 650);
  };

  return (
    <div className="space-y-section h-full flex flex-col">
      {/* Header */}
      <section className="section-padding container-editorial">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-display-lg mb-1">AI assistant</h2>
            <p className="text-body-md text-muted-foreground">
              Grounded guidance from your CV, goals, and job targets
            </p>
          </div>
          <Button size="sm" className="bg-primary hover:bg-primary-active gap-1" onClick={startNewChat}>
            <Plus className="w-3.5 h-3.5" /> New
          </Button>
        </div>
      </section>

      {/* Main chat area */}
      <section className="section-padding container-editorial pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 flex-1 min-h-0">
          {/* Sessions */}
          <Card className="border border-border p-4 h-fit">
            <div className="flex items-center justify-between mb-4">
              <p className="text-caption text-muted-foreground uppercase tracking-wide">Sessions</p>
            </div>
            <div className="space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                    activeSessionId === session.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquareText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-body-md font-medium truncate">{session.title}</p>
                      <p className="text-caption text-muted-foreground">{session.updated}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Chat */}
          <div className="flex flex-col min-h-0">
            <Card className="flex-1 border border-border p-4 overflow-y-auto">
              {messages.length === 0 && !isThinking ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-muted-foreground">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-title-sm text-foreground">Start a new conversation</p>
                    <p className="text-body-md">Try one of the quick prompts below.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <Avatar className="w-8 h-8 border border-border shrink-0">
                        <AvatarFallback
                          className={
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/10 text-primary"
                          }
                        >
                          {message.role === "user" ? "AR" : <Sparkles className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`flex-1 p-3 rounded-lg border ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border"
                        }`}
                      >
                        {message.tool && (
                          <Badge className="mb-2 bg-primary/10 text-primary border border-primary/20">
                            {message.tool}
                          </Badge>
                        )}
                        <p className="text-body-md">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isThinking && (
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8 border border-border shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Sparkles className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 p-3 rounded-lg border bg-card border-border">
                        <div className="flex items-center gap-2 text-body-md text-muted-foreground">
                          <span className="animate-pulse">Thinking</span>
                          <span className="tracking-widest">...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {messages.length === 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="justify-start border-border hover:border-primary/50 h-auto py-3 px-4"
                    onClick={() => setInput(suggestion)}
                  >
                    <span className="text-body-md">{suggestion}</span>
                  </Button>
                ))}
              </div>
            )}

            <Card className="p-4 border border-border mt-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Ask about readiness, skill gaps, or a roadmap..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="border-input-border"
                />
                <Button onClick={handleSend} className="bg-primary hover:bg-primary-active">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}