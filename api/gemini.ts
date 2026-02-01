// api/gemini.ts
export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY відсутній у змінних середовища' }),
        { status: 500 }
      );
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json

    return new Response(JSON.stringify({ data: JSON.parse(text) }), { status: 200 });
  } catch (err: any) {
    console.error('[Server /api/gemini]', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Помилка сервера' }),
      { status: 500 }
    );
  }
}