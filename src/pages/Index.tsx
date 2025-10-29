import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import AskComposer from "@/components/AskComposer";
import LoadingPost from "@/components/LoadingPost";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [composerOpen, setComposerOpen] = useState(false);
  const [currentView, setCurrentView] = useState("home");
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    filterPostsByView();
  }, [currentView, posts]);

  const filterPostsByView = () => {
    if (currentView === "recent") {
      const sorted = [...posts].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setFilteredPosts(sorted);
    } else if (currentView === "trending") {
      // Show posts with most reactions
      setFilteredPosts([...posts]);
    } else {
      setFilteredPosts(posts);
    }
  };

  const loadPosts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        topics,
        created_at,
        is_bot,
        author_id,
        bot_id
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
      setIsLoading(false);
      return;
    }

    // Fetch author profiles
    const authorIds = data?.filter(p => p.author_id).map(p => p.author_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, handle')
      .in('id', authorIds);

    // Fetch bots
    const botIds = data?.filter(p => p.bot_id).map(p => p.bot_id) || [];
    const { data: bots } = await supabase
      .from('bots')
      .select('id, name, handle')
      .in('id', botIds);

    // Map profiles and bots to posts
    const postsWithAuthors = data?.map(post => ({
      ...post,
      author: profiles?.find(p => p.id === post.author_id),
      bot: bots?.find(b => b.id === post.bot_id)
    }));

    setPosts(postsWithAuthors || []);
    setFilteredPosts(postsWithAuthors || []);
    setIsLoading(false);
  };

  const handleAskSubmit = async (question: string, topics: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Please log in to create posts');
      return;
    }

    setIsGenerating(true);
    setComposerOpen(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-post', {
        body: { question, topics }
      });

      if (error) throw error;

      toast.success('Posts generated successfully!');
      loadPosts();
    } catch (error: any) {
      console.error('Error generating post:', error);
      toast.error(error.message || 'Failed to generate posts');
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onAskClick={() => setComposerOpen(true)} />
      
      <div className="flex">
        <Sidebar 
          currentView={currentView} 
          onViewChange={setCurrentView}
        />
        
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
          {isLoading ? (
            <LoadingPost />
          ) : (
            filteredPosts.map((post) => {
              const author = post.is_bot ? post.bot : post.author;
              const timestamp = new Date(post.created_at).toLocaleString();
              
              return (
                <PostCard 
                  key={post.id}
                  id={post.id}
                  question={post.title}
                  answer={post.content}
                  topics={post.topics || []}
                  author={{
                    name: author?.username || author?.name || 'Anonymous',
                    handle: author?.handle || 'anonymous',
                    isBot: post.is_bot
                  }}
                  timestamp={timestamp}
                  onDelete={loadPosts}
                />
              );
            })
          )}

          {/* Empty state */}
          {filteredPosts.length === 0 && !isGenerating && !isLoading && (
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
