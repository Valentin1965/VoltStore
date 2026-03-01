import { GoogleGenAI } from "npm:@google/genai@1.37.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { prompt, type = 'assistant', language = 'en' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const ai = new GoogleGenAI({ apiKey });

    let systemInstruction = '';
    let model = 'gemini-3-flash-preview';

    if (type === 'assistant') {
      systemInstruction = `You are VoltStore Technical Support Specialist. You MUST speak and respond in UKRAINIAN language only. Answer technical questions about solar energy, batteries, and inverters professionally and helpfully.`;
    } else if (type === 'translate') {
      systemInstruction = `Translate to ${language}. Preserve technical terms if standard. Return ONLY translation.`;
      model = 'gemini-3-flash-preview';
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined
    });

    const text = response.text || "Error processing request";

    return new Response(
      JSON.stringify({ text }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('AI Assistant Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
