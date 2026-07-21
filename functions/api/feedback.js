// Cloudflare Pages Function: /api/feedback
// Provides real-time cross-device sync for in-app user feedback across mobile, desktop, and incognito sessions.

let globalFeedbackStore = [];

export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // GET /api/feedback - Retrieve all feedback submissions across devices
  if (request.method === 'GET') {
    let items = [...globalFeedbackStore];
    if (env && env.HITEC_FEEDBACK_KV) {
      try {
        const kvData = await env.HITEC_FEEDBACK_KV.get('feedback_list', { type: 'json' });
        if (Array.isArray(kvData) && kvData.length > 0) {
          items = kvData;
        }
      } catch (e) {}
    }
    return new Response(JSON.stringify(items), { headers: corsHeaders });
  }

  // POST /api/feedback - Submit new feedback item from any browser/device/incognito
  if (request.method === 'POST') {
    try {
      const item = await request.json();
      if (item && (item.userEmail || item.userId)) {
        const id = item.id || ('fb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
        item.id = id;
        
        globalFeedbackStore = globalFeedbackStore.filter(i => i.id !== id);
        globalFeedbackStore.unshift(item);

        if (env && env.HITEC_FEEDBACK_KV) {
          try {
            await env.HITEC_FEEDBACK_KV.put('feedback_list', JSON.stringify(globalFeedbackStore));
          } catch (e) {}
        }

        return new Response(JSON.stringify({ success: true, count: globalFeedbackStore.length, item }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Invalid feedback item payload' }), { status: 400, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
}
