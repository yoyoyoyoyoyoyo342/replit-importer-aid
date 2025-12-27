import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    const { data: scheduledPosts, error: fetchError } = await supabase
      .from("blog_posts")
      .select("id, title, excerpt, slug")
      .eq("is_published", false)
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", now);

    if (fetchError) {
      console.error("Error fetching scheduled posts:", fetchError);
      throw fetchError;
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      console.log("No scheduled posts to publish");
      return new Response(JSON.stringify({ published: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${scheduledPosts.length} posts to publish`);

    for (const post of scheduledPosts) {
      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({ is_published: true, published_at: now })
        .eq("id", post.id);

      if (updateError) {
        console.error(`Error publishing post ${post.id}:`, updateError);
        continue;
      }

      console.log(`Published post: ${post.title}`);

      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("user_id");

      if (usersError) {
        console.error("Error fetching users:", usersError);
        continue;
      }

      if (users && users.length > 0) {
        const notifications = users.map((user) => ({
          user_id: user.user_id,
          title: `New Article: ${post.title}`,
          message: `${post.excerpt || "Check out our latest article!"}\n\nRead the full article at https://rainz.net/articles/${post.slug}`,
          type: "blog_post",
          metadata: { post_id: post.id, slug: post.slug },
        }));

        const { error: notifyError } = await supabase
          .from("user_notifications")
          .insert(notifications);

        if (notifyError) {
          console.error("Error sending notifications:", notifyError);
        } else {
          console.log(`Notified ${users.length} users about post: ${post.title}`);
        }
      }
    }

    return new Response(JSON.stringify({ published: scheduledPosts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in publish-scheduled-posts:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
