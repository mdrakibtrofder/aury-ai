import { useEffect, useState } from "react";
import { X, User, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ posts: 0, saved: 0 });

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id);

    const { count: savedCount } = await supabase
      .from('saves')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setProfile(profileData);
    setStats({ posts: postsCount || 0, saved: savedCount || 0 });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={`
        fixed top-0 right-0 h-full w-80 bg-background border-l z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Profile</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {profile && (
            <>
              {/* Profile Info */}
              <div className="text-center space-y-4">
                <Avatar className="h-20 w-20 mx-auto border-4 border-primary/20">
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile.username)}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-bold text-lg">{profile.username}</h3>
                  <p className="text-muted-foreground text-sm">@{profile.handle}</p>
                </div>

                {profile.bio && (
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                )}

                {profile.is_anonymous && (
                  <Badge variant="secondary" className="text-xs">
                    Anonymous User
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.posts}</div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.saved}</div>
                  <div className="text-xs text-muted-foreground">Saved</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}