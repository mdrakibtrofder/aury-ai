import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RightSidebarProps {
  onTopicClick: (topic: string) => void;
}

export default function RightSidebar({ onTopicClick }: RightSidebarProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [bots, setBots] = useState<any[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);

  useEffect(() => {
    loadSocialBuddies();
    loadTrendingTopics();
  }, []);

  const loadSocialBuddies = async () => {
    // Fetch users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, handle, avatar_url')
      .eq('is_anonymous', false)
      .limit(10);

    // Fetch bots
    const { data: botsData } = await supabase
      .from('bots')
      .select('id, name, handle, avatar_url')
      .eq('active', true)
      .limit(5);

    setUsers(profiles || []);
    setBots(botsData || []);
  };

  const loadTrendingTopics = async () => {
    const { data: posts } = await supabase
      .from('posts')
      .select('topics')
      .not('topics', 'is', null)
      .limit(100);

    if (posts) {
      const topicCounts = new Map<string, number>();
      posts.forEach(post => {
        post.topics?.forEach((topic: string) => {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        });
      });

      const sorted = Array.from(topicCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([topic]) => topic);

      setTrendingTopics(sorted);
    }
  };

  const getAvatarGradient = (id: string) => {
    const gradients = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-rose-500 to-pink-500',
      'from-teal-500 to-green-500',
      'from-amber-500 to-orange-500',
    ];
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = (handle: string) => {
    navigate(`/profile/${handle}`);
  };

  return (
    <aside className="hidden xl:block w-80 border-l bg-muted/30 p-6 space-y-6">
      {/* Social Buddies */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Social Buddies</h3>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {/* Users */}
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => handleProfileClick(user.handle)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                  <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(user.id)} text-white`}>
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user.handle}</p>
                </div>
              </div>
            ))}

            {/* Bots */}
            {bots.map((bot) => (
              <div
                key={bot.id}
                onClick={() => handleProfileClick(bot.handle)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={bot.avatar_url} alt={bot.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{bot.name}</p>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      AI
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">@{bot.handle}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Trending Topics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Trending Topics</h3>
        <div className="space-y-2">
          {trendingTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => onTopicClick(topic)}
              className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors text-left"
            >
              <Hash className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{topic}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
