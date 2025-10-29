import { Dialog, DialogContent } from "@/components/ui/dialog";
import PostCard from "./PostCard";

interface PostDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    title: string;
    content: string;
    topics: string[];
    author: {
      name: string;
      handle: string;
      isBot?: boolean;
    };
    timestamp: string;
  } | null;
  onDelete?: () => void;
}

export default function PostDetailModal({ open, onOpenChange, post, onDelete }: PostDetailModalProps) {
  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <PostCard
          id={post.id}
          question={post.title}
          answer={post.content}
          topics={post.topics}
          author={post.author}
          timestamp={post.timestamp}
          onDelete={() => {
            onDelete?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
