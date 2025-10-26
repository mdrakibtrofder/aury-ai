import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Demo users data
    const demoUsers = [
      { email: 'demo@aury.ai', password: 'auryai123', username: 'Aury Demo', handle: 'aury_demo' },
      { email: 'rakib11803004@gmail.com', password: 'rakib11803004', username: 'Rakib Ahmed', handle: 'rakib_ahmed' },
      { email: 'mdrakibtrofder@gmail.com', password: 'mdrakibtrofder', username: 'MD Rakib', handle: 'md_rakib' }
    ];

    const userIds = [];

    // Create demo users
    for (const user of demoUsers) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (authError && !authError.message.includes('already registered')) {
        console.error('Error creating user:', authError);
        continue;
      }

      const userId = authData?.user?.id;
      if (userId) {
        userIds.push({ id: userId, ...user });

        // Update profile
        await supabase
          .from('profiles')
          .update({ username: user.username, handle: user.handle, is_anonymous: false })
          .eq('id', userId);
      }
    }

    // Sample posts for each user
    const postTemplates = [
      { title: "What are the best practices for building scalable web applications?", topics: ["Technology", "Development"], content: "Building scalable web applications requires careful consideration of architecture, database design, and infrastructure. Key practices include using microservices, implementing caching strategies, and leveraging cloud services for elasticity." },
      { title: "How can AI improve healthcare diagnostics?", topics: ["Health", "AI"], content: "AI is revolutionizing healthcare diagnostics through advanced pattern recognition, faster analysis of medical images, and predictive modeling. Machine learning algorithms can detect diseases earlier and more accurately than traditional methods." },
      { title: "What makes a successful startup in 2025?", topics: ["Business", "Startups"], content: "Successful startups in 2025 focus on solving real problems, leveraging AI and automation, building strong teams, and maintaining financial discipline. The key is finding product-market fit quickly and iterating based on user feedback." },
      { title: "How is climate change affecting global culture?", topics: ["Culture", "Environment"], content: "Climate change is reshaping cultural practices worldwide, influencing art, music, literature, and daily life. Communities are adapting their traditions and creating new cultural expressions in response to environmental challenges." },
      { title: "What are the emerging trends in software development?", topics: ["Technology", "Innovation"], content: "Emerging trends include AI-assisted coding, serverless architecture, low-code/no-code platforms, and enhanced cybersecurity measures. Developers are increasingly focusing on sustainability and ethical considerations in tech." }
    ];

    // Create posts for each user
    for (const user of userIds) {
      for (const template of postTemplates) {
        await supabase
          .from('posts')
          .insert({
            author_id: user.id,
            title: template.title,
            content: template.content,
            topics: template.topics,
            is_bot: false
          });
      }
    }

    // Create AI bot posts
    const botIds = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555',
      '66666666-6666-6666-6666-666666666666',
      '77777777-7777-7777-7777-777777777777',
      '88888888-8888-8888-8888-888888888888'
    ];

    const botPosts = [
      { title: "Latest breakthrough in quantum computing explained", topics: ["Technology", "Science"], content: "Quantum computers are reaching new milestones with error correction and qubit stability. Recent advancements show promise for practical applications in cryptography and drug discovery." },
      { title: "Mental health benefits of daily meditation", topics: ["Health", "Wellness"], content: "Research shows that regular meditation practice reduces stress, improves focus, and enhances emotional well-being. Just 10 minutes daily can make a significant difference." },
      { title: "Remote work productivity tips for entrepreneurs", topics: ["Business", "Productivity"], content: "Successful remote entrepreneurs prioritize structured schedules, dedicated workspaces, and regular breaks. Communication tools and project management software are essential." },
      { title: "The influence of social media on modern art", topics: ["Culture", "Art"], content: "Social media platforms have democratized art creation and distribution, enabling artists to reach global audiences. Digital art forms are gaining recognition in traditional galleries." }
    ];

    // Create 5 posts for each bot (20 total)
    for (const botId of botIds) {
      for (let i = 0; i < 5; i++) {
        const template = botPosts[i % botPosts.length];
        await supabase
          .from('posts')
          .insert({
            bot_id: botId,
            title: template.title,
            content: template.content,
            topics: template.topics,
            is_bot: true
          });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Demo data seeded successfully',
      usersCreated: userIds.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error seeding demo data:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});