import { Home, TrendingUp, Compass, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const TRENDING_TOPICS = [
  { name: "AI", count: 234 },
  { name: "Technology", count: 189 },
  { name: "Health", count: 156 },
  { name: "Science", count: 143 },
  { name: "Philosophy", count: 128 },
];

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "explore", label: "Explore", icon: Compass },
    { id: "recent", label: "Recent", icon: Clock },
  ];

  return (
    <aside className="hidden lg:block w-72 border-r bg-muted/30 p-6">
      {/* Navigation */}
      <nav className="space-y-2 mb-8">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              currentView === item.id && "bg-primary/10 text-primary hover:bg-primary/20"
            )}
            onClick={() => onViewChange(item.id)}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Trending Topics */}
      <div>
        <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">
          Trending Topics
        </h3>
        <div className="space-y-3">
          {TRENDING_TOPICS.map((topic) => (
            <button
              key={topic.name}
              className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium group-hover:text-primary transition-colors">
                  #{topic.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {topic.count}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
