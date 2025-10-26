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
      { email: 'demo@aury.ai', password: 'auryai123', username: 'Aury Demo', handle: 'aury_demo' }
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

    // Sample posts for each user (75 words max)
    const postTemplates = [
      { title: "What are the best practices for building scalable web applications?", topics: ["Technology"], content: "Building scalable applications requires thoughtful architecture and infrastructure planning. Focus on microservices for modularity, implement robust caching strategies, and leverage cloud services for dynamic scaling. Prioritize database optimization and API design for performance." },
      { title: "How can AI improve healthcare diagnostics?", topics: ["Health"], content: "AI transforms healthcare through pattern recognition and predictive modeling. Machine learning analyzes medical images faster and detects diseases earlier than traditional methods. This technology enhances diagnostic accuracy while reducing time to treatment, ultimately improving patient outcomes." },
      { title: "What makes a successful startup in 2025?", topics: ["Business"], content: "Success requires solving genuine problems with innovative solutions. Focus on rapid product-market fit discovery, build diverse teams, and maintain financial discipline. Leverage AI automation while staying adaptable to market feedback and emerging opportunities." },
      { title: "How is climate change affecting global culture?", topics: ["Culture"], content: "Climate change reshapes cultural practices worldwide. Communities adapt traditions while creating new expressions addressing environmental challenges. Art, music, and literature increasingly reflect ecological concerns, fostering global awareness and inspiring sustainable cultural evolution." },
      { title: "What are the emerging trends in software development?", topics: ["Technology"], content: "Key trends include AI-assisted coding, serverless architecture, and enhanced cybersecurity. Developers embrace low-code platforms while prioritizing sustainability and ethical tech practices. The focus shifts toward accessible, secure, and environmentally responsible software solutions." }
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
      { title: "Latest breakthrough in quantum computing explained", topics: ["Technology"], content: "Quantum computers achieve new milestones in error correction and qubit stability. Recent breakthroughs enable practical applications in cryptography and drug discovery, bringing quantum advantage closer to reality for solving complex computational problems." },
      { title: "Mental health benefits of daily meditation", topics: ["Health"], content: "Regular meditation reduces stress, improves focus, and enhances emotional well-being. Research confirms that just 10 minutes daily significantly impacts mental health, helping manage anxiety and build resilience through mindfulness practice." },
      { title: "Remote work productivity tips for entrepreneurs", topics: ["Business"], content: "Successful remote work requires structured schedules, dedicated workspaces, and regular breaks. Essential tools include communication platforms and project management software. Maintain work-life boundaries while staying connected with your team for optimal productivity." },
      { title: "The influence of social media on modern art", topics: ["Culture"], content: "Social media democratizes art creation and distribution, connecting artists with global audiences instantly. Digital art gains traditional gallery recognition while platforms enable new creative expressions, transforming how we create and consume contemporary art." }
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