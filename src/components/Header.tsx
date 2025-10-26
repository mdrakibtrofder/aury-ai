import { Sparkles, Search, PenSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface HeaderProps {
  onAskClick: () => void;
}

export default function Header({ onAskClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="h-7 w-7 text-primary" />
            <div className="absolute inset-0 animate-pulse-glow">
              <Sparkles className="h-7 w-7 text-secondary opacity-50" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gradient">Aury</h1>
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search questions, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border/50 focus:bg-background transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={onAskClick}
            className="gradient-primary hover:opacity-90 transition-opacity shadow-md hover:shadow-glow"
          >
            <PenSquare className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Ask Question</span>
            <span className="sm:hidden">Ask</span>
          </Button>
          
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
