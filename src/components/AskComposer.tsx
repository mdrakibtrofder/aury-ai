import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AskComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (question: string, topics: string[]) => void;
  isGenerating?: boolean;
}

const SUGGESTED_TOPICS = [
  "Technology", "AI", "Science", "Philosophy", "Health", 
  "Business", "Culture", "Environment", "Education"
];

export default function AskComposer({ 
  open, 
  onOpenChange, 
  onSubmit,
  isGenerating = false 
}: AskComposerProps) {
  const [question, setQuestion] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const handleSubmit = () => {
    if (question.trim()) {
      onSubmit(question, selectedTopics);
      setQuestion("");
      setSelectedTopics([]);
    }
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ask Aury
          </DialogTitle>
          <DialogDescription>
            Ask a question and Aury will generate an engaging post for you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Question Input */}
          <div>
            <Textarea
              placeholder="What would you like to know? (e.g., 'What are the benefits of meditation?')"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Topics */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Topics (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TOPICS.map((topic) => (
                <Badge
                  key={topic}
                  variant={selectedTopics.includes(topic) ? "default" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => !isGenerating && toggleTopic(topic)}
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!question.trim() || isGenerating}
              className="gradient-primary hover:opacity-90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Post
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
