import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, topics } = await req.json();
    console.log('Generate post request:', { question, topics });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !supabaseUrl || !supabaseKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User profile:', profile);

    // Generate primary answer using AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are Aury, an AI assistant that creates engaging, informative social media posts. Keep answers concise (maximum 100 words), insightful, and conversation-starting. Focus on providing value and sparking discussion.'
          },
          {
            role: 'user',
            content: question
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const primaryAnswer = aiData.choices[0].message.content;
    console.log('Primary answer generated');

    // Create user's post
    const { data: userPost, error: postError } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        title: question,
        content: primaryAnswer,
        topics: topics || [],
        is_bot: false,
      })
      .select()
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      return new Response(JSON.stringify({ error: 'Failed to create post' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User post created:', userPost.id);

    // Generate bot posts (2-4 related posts)
    const botPersonas = ['tech', 'health', 'business', 'culture'];
    const selectedPersonas = botPersonas.slice(0, 2 + Math.floor(Math.random() * 3)); // 2-4 bots
    const botPosts = [];

    for (const persona of selectedPersonas) {
      // Create or get bot for this user and persona
      const botHandle = `${profile.handle}_aury_${persona}`;
      
      let { data: bot } = await supabase
        .from('bots')
        .select('*')
        .eq('handle', botHandle)
        .maybeSingle();

      if (!bot) {
        const { data: newBot, error: botError } = await supabase
          .from('bots')
          .insert({
            name: `Aury ${persona.charAt(0).toUpperCase() + persona.slice(1)}`,
            handle: botHandle,
            persona_type: persona,
            created_by_user_id: user.id,
          })
          .select()
          .single();

        if (botError) {
          console.error('Bot creation error:', botError);
          continue;
        }
        bot = newBot;
      }

      // Generate related question and answer
      const botPromptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a ${persona}-focused content specialist. Generate a related but different question about ${question}. Return ONLY the question, nothing else.`
            },
            {
              role: 'user',
              content: `Generate a related question about: ${question}`
            }
          ],
        }),
      });

      if (!botPromptResponse.ok) continue;

      const botPromptData = await botPromptResponse.json();
      const relatedQuestion = botPromptData.choices[0].message.content.trim();

      // Generate answer for the related question
      const botAnswerResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are Aury, a ${persona}-focused AI. Provide an insightful, engaging answer. Keep it maximum 100 words.`
            },
            {
              role: 'user',
              content: relatedQuestion
            }
          ],
        }),
      });

      if (!botAnswerResponse.ok) continue;

      const botAnswerData = await botAnswerResponse.json();
      const botAnswer = botAnswerData.choices[0].message.content;

      // Create bot post
      const { data: botPost, error: botPostError } = await supabase
        .from('posts')
        .insert({
          bot_id: bot.id,
          title: relatedQuestion,
          content: botAnswer,
          topics: topics || [],
          is_bot: true,
          metadata: { triggered_by_user: user.id, original_question: question },
        })
        .select()
        .single();

      if (!botPostError) {
        botPosts.push(botPost);
        console.log(`Bot post created by ${bot.handle}:`, botPost.id);
      }
    }

    console.log(`Generated ${botPosts.length} bot posts`);

    return new Response(
      JSON.stringify({
        success: true,
        userPost,
        botPosts,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-post:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
