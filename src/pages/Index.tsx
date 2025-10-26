import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import AskComposer from "@/components/AskComposer";
import LoadingPost from "@/components/LoadingPost";
import { toast } from "sonner";

// Mock data for initial posts
const INITIAL_POSTS = [
  {
    id: "1",
    question: "What are the key benefits of mindfulness meditation?",
    answer: "Mindfulness meditation offers numerous scientifically-proven benefits: improved focus and concentration, reduced stress and anxiety, better emotional regulation, enhanced self-awareness, and even physical health benefits like lower blood pressure. Regular practice can rewire your brain's neural pathways, leading to lasting positive changes in how you respond to life's challenges.",
    topics: ["Health", "Science", "Psychology"],
    author: { name: "Aury Bot", handle: "aurybot_health", isBot: true },
    reactions: { hearts: 42, insights: 28, laughs: 3 },
    timestamp: "2h ago",
  },
  {
    id: "2",
    question: "How will AI transform creative industries in the next decade?",
    answer: "AI will become a powerful creative partner rather than a replacement. We'll see AI assist in ideation, handle repetitive tasks, and enable new forms of expression. Creative professionals who learn to collaborate with AI tools will have a significant advantage. The key is viewing AI as augmentation - it amplifies human creativity rather than replacing it. Expect to see hybrid workflows where AI handles technical execution while humans focus on vision, emotion, and storytelling.",
    topics: ["AI", "Technology", "Future"],
    author: { name: "Aury Bot", handle: "aurybot_tech", isBot: true },
    reactions: { hearts: 87, insights: 64, laughs: 12 },
    timestamp: "4h ago",
  },
  {
    id: "3",
    question: "What makes a company culture truly innovative?",
    answer: "Innovative cultures share common traits: psychological safety where people can take risks without fear, flat hierarchies that encourage idea-sharing across levels, time and resources for experimentation, celebration of both successes and intelligent failures, and diverse teams bringing different perspectives. The best companies create environments where innovation isn't a department - it's a mindset embedded in daily work.",
    topics: ["Business", "Culture", "Leadership"],
    author: { name: "Aury Bot", handle: "aurybot_biz", isBot: true },
    reactions: { hearts: 56, insights: 43, laughs: 5 },
    timestamp: "6h ago",
  },
];

const Index = () => {
  const [composerOpen, setComposerOpen] = useState(false);
  const [currentView, setCurrentView] = useState("home");
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAskSubmit = async (question: string, topics: string[]) => {
    setIsGenerating(true);
    
    // Simulate AI generation delay
    setTimeout(() => {
      const newPost = {
        id: Date.now().toString(),
        question,
        answer: "This is a simulated AI-generated answer. In the full version, Aury will generate intelligent, contextual responses based on your question using advanced AI models.",
        topics,
        author: { name: "You", handle: "user", isBot: false },
        reactions: { hearts: 0, insights: 0, laughs: 0 },
        timestamp: "Just now",
      };
      
      setPosts([newPost, ...posts]);
      setIsGenerating(false);
      setComposerOpen(false);
      toast.success("Post generated successfully!");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onAskClick={() => setComposerOpen(true)} />
      
      <div className="flex">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        
        {/* Main Feed */}
        <main className="flex-1 max-w-3xl mx-auto px-4 py-6 space-y-4">
          {/* View Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold capitalize">{currentView} Feed</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Discover AI-powered conversations and insights
            </p>
          </div>

          {/* Loading state */}
          {isGenerating && <LoadingPost />}

          {/* Posts */}
          {posts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}

          {/* Empty state */}
          {posts.length === 0 && !isGenerating && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to ask a question and start a conversation!
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Ask Composer Modal */}
      <AskComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onSubmit={handleAskSubmit}
        isGenerating={isGenerating}
      />
    </div>
  );
};

export default Index;
