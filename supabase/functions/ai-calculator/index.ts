import { GoogleGenAI, Type } from "npm:@google/genai@1.37.0";

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
    const { config } = await req.json();

    if (!config) {
      return new Response(
        JSON.stringify({ error: 'Missing configuration' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      As a Solar Energy Expert, design a system for:
      Object: ${config.objectType}, Monthly Usage: ${config.monthlyUsage},
      Primary Goal: ${config.purpose}, Budget Level: ${config.budget}.

      IMPORTANT: Return the "title" and "description" in UKRAINIAN language.
      Components names should remain in English technical terms.

      Available stock items: Inverters, Batteries, Solar Panels.
      Return a valid JSON object matching the requested schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "System name in Ukrainian" },
            description: { type: Type.STRING, description: "Brief explanation of benefits in Ukrainian" },
            components: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER, description: "Estimated price in EUR" },
                  quantity: { type: Type.NUMBER }
                },
                required: ["name", "price", "quantity"]
              }
            }
          },
          required: ["title", "description", "components"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");

    const data = JSON.parse(text);

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('AI Calculator Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
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
