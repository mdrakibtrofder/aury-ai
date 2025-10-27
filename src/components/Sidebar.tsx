import { Home, TrendingUp, Compass, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

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
      <nav className="space-y-2">
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
    </aside>
  );
}
