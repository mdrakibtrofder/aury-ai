import { Heart, MessageCircle, Share2, Bookmark, Lightbulb, Laugh } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PostCardProps {
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
  question,
  answer,
  topics,
  author,
  reactions = { hearts: 0, insights: 0, laughs: 0 },
  timestamp,
  className,
}: PostCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
        <Avatar className={cn(
          "h-10 w-10 border-2",
          author.isBot ? "gradient-primary" : "border-primary/20"
        )}>
          <AvatarFallback className={cn(
            author.isBot && "text-white"
          )}>
            {getInitials(author.name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{author.name}</span>
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
        <h3 className="text-lg font-semibold text-foreground leading-snug">
          {question}
        </h3>
        <p className="text-foreground/90 leading-relaxed">
          {answer}
        </p>

        {/* Topics */}
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {topics.map((topic) => (
              <Badge 
                key={topic} 
                variant="outline" 
                className="text-xs hover:bg-accent cursor-pointer transition-colors"
              >
                #{topic}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Reactions Bar */}
      <div className="flex items-center gap-1 pt-4 mt-4 border-t">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Heart className="h-4 w-4" />
          {reactions.hearts > 0 && <span className="text-xs">{reactions.hearts}</span>}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <Lightbulb className="h-4 w-4" />
          {reactions.insights > 0 && <span className="text-xs">{reactions.insights}</span>}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1.5 text-muted-foreground hover:text-secondary hover:bg-secondary/10"
        >
          <Laugh className="h-4 w-4" />
          {reactions.laughs > 0 && <span className="text-xs">{reactions.laughs}</span>}
        </Button>
        
        <div className="ml-auto flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
