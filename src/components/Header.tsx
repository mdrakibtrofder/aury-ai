import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  onAskClick: () => void;
}

export default function Header({ onAskClick }: HeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'hsl(340 82% 65%)',
      'hsl(280 80% 65%)',
      'hsl(200 82% 60%)',
      'hsl(160 70% 50%)',
      'hsl(25 85% 60%)',
      'hsl(45 90% 55%)',
      'hsl(120 60% 50%)',
      'hsl(15 80% 60%)',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

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
          {user ? (
            <>
              <Button 
                onClick={onAskClick}
                className="gradient-primary hover:opacity-90 transition-opacity shadow-md hover:shadow-glow"
              >
                <PenSquare className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Ask Question</span>
                <span className="sm:hidden">Ask</span>
              </Button>
              
              <Avatar 
                className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity border-2 border-background shadow-md"
                style={{ backgroundColor: getAvatarColor(profile?.username || "User") }}
                onClick={() => navigate("/profile")}
              >
                <AvatarFallback 
                  className="text-white text-sm"
                  style={{ backgroundColor: getAvatarColor(profile?.username || "User") }}
                >
                  {getInitials(profile?.username || "User")}
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <Button 
              onClick={() => navigate('/auth')}
              variant="outline"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
