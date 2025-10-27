import { useState, useEffect } from "react";
import { MessageCircle, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  is_bot: boolean;
  author?: {
    username: string;
    handle: string;
  } | null;
  bot?: {
    name: string;
    handle: string;
  } | null;
}

interface CommentSectionProps {
  postId: string;
  className?: string;
}

export default function CommentSection({ postId, className }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [postId, isOpen]);

  const loadComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        is_bot,
        author:profiles(username, handle),
        bot:bots(name, handle)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading comments:', error);
      return;
    }

    setComments(data as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Please log in to comment');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content: newComment.trim(),
        is_bot: false,
      });

    if (error) {
      toast.error('Failed to post comment');
      console.error(error);
    } else {
      setNewComment("");
      toast.success('Comment posted!');
      loadComments();
    }

    setIsLoading(false);
  };

  const handleRefineComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please write a comment first");
      return;
    }

    setIsRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-post', {
        body: { 
          question: `Refine this comment to be more clear and concise (max 75 words): ${newComment}`,
          topics: []
        }
      });

      if (error) throw error;

      const refinedText = data?.posts?.[0]?.content || data?.content || newComment;
      setNewComment(refinedText.substring(0, 300));
      toast.success('Comment refined!');
    } catch (error: any) {
      console.error('Error refining comment:', error);
      toast.error('Failed to refine comment');
    } finally {
      setIsRefining(false);
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={cn("border-t pt-4", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 text-muted-foreground hover:text-foreground mb-3"
      >
        <MessageCircle className="h-4 w-4" />
        {comments.length > 0 && <span className="text-xs">{comments.length}</span>}
        {isOpen ? 'Hide Comments' : 'View Comments'}
      </Button>

      {isOpen && (
        <div className="space-y-4">
          {/* Comment List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {comments.map((comment) => {
              const author = comment.is_bot ? comment.bot : comment.author;
              return (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className={cn(
                    "h-8 w-8 border-2",
                    comment.is_bot ? "gradient-primary" : "border-primary/20"
                  )}>
                    <AvatarFallback className={cn(
                      comment.is_bot && "text-white text-xs"
                    )}>
                      {author ? getInitials((author as any).username || (author as any).name || 'A') : '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {(author as any)?.username || (author as any)?.name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">@{author?.handle}</span>
                        {comment.is_bot && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">AI</span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/90">{comment.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-3 mt-1 inline-block">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefineComment}
                disabled={isRefining || !newComment.trim()}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {isRefining ? "Refining..." : "Refine with AI"}
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={isLoading || !newComment.trim()}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Post
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
