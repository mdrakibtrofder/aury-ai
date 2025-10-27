import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Lightbulb, Laugh } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CommentSection from "./CommentSection";
import { useNavigate } from "react-router-dom";

interface PostCardProps {
  id: string;
  question: string;
  answer: string;
  topics: string[];
  author: {
    name: string;
    handle: string;
    isBot?: boolean;
  };
  reactions?: {
    hearts: number;
    insights: number;
    laughs: number;
  };
  timestamp: string;
  className?: string;
}

export default function PostCard({
  id,
  question,
  answer,
  topics,
  author,
  reactions = { hearts: 0, insights: 0, laughs: 0 },
  timestamp,
  className,
}: PostCardProps) {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [currentReactions, setCurrentReactions] = useState(reactions);
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkSavedStatus();
    loadReactions();
  }, [id]);

  const checkSavedStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('saves')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    setIsSaved(!!data);
  };

  const loadReactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data } = await supabase
      .from('reactions')
      .select('reaction_type, user_id')
      .eq('post_id', id);

    if (data) {
      const counts = { hearts: 0, insights: 0, laughs: 0 };
      const userReacted = new Set<string>();

      data.forEach((r: any) => {
        if (r.reaction_type === 'heart') counts.hearts++;
        if (r.reaction_type === 'insight') counts.insights++;
        if (r.reaction_type === 'laugh') counts.laughs++;
        if (user && r.user_id === user.id) userReacted.add(r.reaction_type);
      });

      setCurrentReactions(counts);
      setUserReactions(userReacted);
    }
  };

  const toggleReaction = async (type: 'heart' | 'insight' | 'laugh') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to react');
      return;
    }

    if (userReactions.has(type)) {
      await supabase
        .from('reactions')
        .delete()
        .eq('post_id', id)
        .eq('user_id', user.id)
        .eq('reaction_type', type);
    } else {
      await supabase
        .from('reactions')
        .insert({ post_id: id, user_id: user.id, reaction_type: type });
    }

    loadReactions();
  };

  const toggleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to save posts');
      return;
    }

    if (isSaved) {
      await supabase
        .from('saves')
        .delete()
        .eq('post_id', id)
        .eq('user_id', user.id);
      setIsSaved(false);
      toast.success('Post removed from saved');
    } else {
      await supabase
        .from('saves')
        .insert({ post_id: id, user_id: user.id });
      setIsSaved(true);
      toast.success('Post saved!');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + '/post/' + id);
    toast.success('Link copied to clipboard!');
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
      'hsl(340 82% 65%)', // Pink
      'hsl(280 80% 65%)', // Purple
      'hsl(200 82% 60%)', // Blue
      'hsl(160 70% 50%)', // Teal
      'hsl(25 85% 60%)',  // Orange
      'hsl(45 90% 55%)',  // Yellow
      'hsl(120 60% 50%)', // Green
      'hsl(15 80% 60%)',  // Red-Orange
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <article 
      className={cn(
        "bg-card border rounded-xl p-6 hover:shadow-lg transition-all duration-300 animate-fade-in",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar 
          className="h-10 w-10 border-2 border-background shadow-md cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: author.isBot ? undefined : getAvatarColor(author.name) }}
          onClick={() => navigate('/profile')}
        >
          <AvatarFallback 
            className={cn(author.isBot ? "gradient-primary text-white" : "text-white")}
            style={{ backgroundColor: author.isBot ? undefined : getAvatarColor(author.name) }}
          >
            {getInitials(author.name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span 
              className="font-semibold text-foreground cursor-pointer hover:underline"
              onClick={() => navigate('/profile')}
            >
              {author.name}
            </span>
            <span className="text-sm text-muted-foreground">@{author.handle}</span>
            {author.isBot && (
              <Badge variant="secondary" className="text-xs">
                AI
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
      </div>


      {/* Content */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <h3 className="text-lg font-semibold text-foreground leading-snug">
            {question}
          </h3>
          {topics.length > 0 && (
            <div className="flex gap-1.5">
              {topics.slice(0, 2).map((topic, idx) => {
                const badgeColors = [
                  'bg-blue-500/10 text-blue-600 border-blue-500/20',
                  'bg-purple-500/10 text-purple-600 border-purple-500/20',
                  'bg-green-500/10 text-green-600 border-green-500/20',
                  'bg-orange-500/10 text-orange-600 border-orange-500/20',
                  'bg-pink-500/10 text-pink-600 border-pink-500/20',
                ];
                return (
                  <Badge 
                    key={topic}
                    variant="outline"
                    className={`text-xs ${badgeColors[idx % badgeColors.length]}`}
                  >
                    {topic}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
        <p 
          className="text-foreground/90 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: answer.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          }}
        />
      </div>

      {/* Reactions Bar */}
      <div className="flex items-center gap-1 pt-4 mt-4 border-t">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleReaction('heart')}
          className={cn(
            "gap-1.5 hover:text-destructive hover:bg-destructive/10",
            userReactions.has('heart') ? "text-destructive" : "text-muted-foreground"
          )}
        >
          <Heart className={cn("h-4 w-4", userReactions.has('heart') && "fill-current")} />
          {currentReactions.hearts > 0 && <span className="text-xs">{currentReactions.hearts}</span>}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleReaction('insight')}
          className={cn(
            "gap-1.5 hover:text-primary hover:bg-primary/10",
            userReactions.has('insight') ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Lightbulb className={cn("h-4 w-4", userReactions.has('insight') && "fill-current")} />
          {currentReactions.insights > 0 && <span className="text-xs">{currentReactions.insights}</span>}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleReaction('laugh')}
          className={cn(
            "gap-1.5 hover:text-secondary hover:bg-secondary/10",
            userReactions.has('laugh') ? "text-secondary" : "text-muted-foreground"
          )}
        >
          <Laugh className={cn("h-4 w-4", userReactions.has('laugh') && "fill-current")} />
          {currentReactions.laughs > 0 && <span className="text-xs">{currentReactions.laughs}</span>}
        </Button>
        
        <div className="ml-auto flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleSave}
            className={cn(
              "hover:text-foreground",
              isSaved ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
          </Button>
        </div>
      </div>

      {/* Comment Section */}
      <CommentSection postId={id} />
    </article>
  );
}
