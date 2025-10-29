import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type FilterType = "all" | "user" | "ai";

export default function Profile() {
  const navigate = useNavigate();
  const { handle } = useParams<{ handle: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [handle]);

  useEffect(() => {
    filterPosts();
  }, [filter, posts]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    let profileData;
    let targetUserId;

    if (handle) {
      // Viewing another user's profile or bot profile
      // Check if it's a bot
      const { data: botData } = await supabase
        .from("bots")
        .select("*")
        .eq("handle", handle)
        .maybeSingle();

      if (botData) {
        // It's a bot profile
        profileData = {
          username: botData.name,
          handle: botData.handle,
          bio: `AI Agent - ${botData.persona_type}`,
          id: botData.id,
          isBot: true
        };
        targetUserId = botData.created_by_user_id;
      } else {
        // It's a user profile
        const { data: userData } = await supabase
          .from("profiles")
          .select("*")
          .eq("handle", handle)
          .maybeSingle();

        if (!userData) {
          toast.error("Profile not found");
          navigate("/");
          return;
        }
        profileData = userData;
        targetUserId = userData.id;
      }
      setIsOwnProfile(user?.id === targetUserId);
    } else {
      // Viewing own profile
      if (!user) {
        toast.error("Please log in to view profile");
        navigate("/auth");
        return;
      }

      const { data: userData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      profileData = userData;
      targetUserId = user.id;
      setIsOwnProfile(true);
    }

    setProfile(profileData);

    if (profileData.isBot) {
      // Load bot's posts
      const { data: botPosts } = await supabase
        .from("posts")
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
        .eq("bot_id", profileData.id)
        .order("created_at", { ascending: false });

      const { data: bots } = await supabase
        .from("bots")
        .select("id, name, handle")
        .eq("id", profileData.id);

      const postsWithAuthors = botPosts?.map(post => ({
        ...post,
        bot: bots?.[0]
      })) || [];

      setPosts(postsWithAuthors);
    } else {
      // Load user's posts and AI posts created by user's bots
      const { data: userPosts } = await supabase
        .from("posts")
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
        .eq("author_id", targetUserId)
        .order("created_at", { ascending: false });

      // Also fetch AI posts from user's bots (handle pattern: username_*)
      const userHandle = profileData?.handle;
      const { data: botPosts } = await supabase
        .from("posts")
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
        .eq("is_bot", true)
        .order("created_at", { ascending: false });

      // Fetch all bots
      const allBotIds = [...(userPosts?.filter(p => p.bot_id).map(p => p.bot_id) || []), ...(botPosts?.filter(p => p.bot_id).map(p => p.bot_id) || [])];
      const { data: bots } = await supabase
        .from("bots")
        .select("id, name, handle")
        .in("id", allBotIds);

      // Filter bot posts that belong to this user
      const userBotPosts = botPosts?.filter(p => {
        const bot = bots?.find(b => b.id === p.bot_id);
        return bot?.handle?.startsWith(`${userHandle}_`);
      }) || [];

      // Combine user posts and user's bot posts
      const allPosts = [...(userPosts || []), ...userBotPosts];
      
      const postsWithAuthors = allPosts.map(post => ({
        ...post,
        author: profileData,
        bot: bots?.find(b => b.id === post.bot_id)
      }));

      setPosts(postsWithAuthors);
    }
    
    setIsLoading(false);
  };

  const filterPosts = () => {
    if (profile?.isBot) {
      // For bot profiles, show all posts from that bot
      setFilteredPosts(posts);
    } else if (filter === "all") {
      setFilteredPosts(posts);
    } else if (filter === "user") {
      setFilteredPosts(posts.filter(p => !p.is_bot));
    } else if (filter === "ai") {
      // Filter AI posts created by user's bots (handle pattern: username_*)
      const userHandle = profile?.handle;
      setFilteredPosts(posts.filter(p => 
        p.is_bot && p.bot?.handle?.startsWith(`${userHandle}_`)
      ));
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header onAskClick={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onAskClick={() => {}} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feed
        </Button>

        {/* Profile Header */}
        <div className="bg-card border rounded-xl p-8 mb-6">
          <div className="flex items-start gap-6">
            <Avatar 
              className="h-24 w-24 border-4 border-background shadow-lg"
              style={{ backgroundColor: getAvatarColor(profile?.username || "User") }}
            >
              <AvatarFallback 
                className="text-2xl text-white"
                style={{ backgroundColor: getAvatarColor(profile?.username || "User") }}
              >
                {getInitials(profile?.username || "User")}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">{profile?.username}</h1>
              <p className="text-muted-foreground mb-4">@{profile?.handle}</p>
              {profile?.bio && (
                <p className="text-foreground/90">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        {!profile?.isBot && (
          <div className="flex gap-2 mb-6 border-b">
            <Button
              variant="ghost"
              onClick={() => setFilter("all")}
              className={filter === "all" ? "border-b-2 border-primary rounded-none" : "rounded-none"}
            >
              All Posts ({posts.length})
            </Button>
            <Button
              variant="ghost"
              onClick={() => setFilter("user")}
              className={filter === "user" ? "border-b-2 border-primary rounded-none" : "rounded-none"}
            >
              {isOwnProfile ? "My Posts" : "Posts"} ({posts.filter(p => !p.is_bot).length})
            </Button>
            <Button
              variant="ghost"
              onClick={() => setFilter("ai")}
              className={filter === "ai" ? "border-b-2 border-primary rounded-none" : "rounded-none"}
            >
              AI Agent Posts ({posts.filter(p => p.is_bot).length})
            </Button>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 px-4 bg-card border rounded-xl">
              <p className="text-muted-foreground">No posts found</p>
            </div>
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
                />
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
