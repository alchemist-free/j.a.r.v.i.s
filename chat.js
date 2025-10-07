export default async function handler(req, res) {
  console.log('🎯 API called!');

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message } = req.body;
    console.log('📨 Received:', message);

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not configured');

    // 🔹 Используем актуальное имя модели
    const modelUrl = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

    const hfResponse = await fetch(modelUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: `[INST] Ты SpeekerAI, интеллектуальный ассистент. Отвечай как умный и вежливый помощник. Всегда по-русски. Вопрос: ${message} [/INST]`,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false
        },
        options: {
          wait_for_model: true
        }
      })
    });

    console.log("📡 Status:", hfResponse.status);
    const text = await hfResponse.text();

    if (!hfResponse.ok) {
      console.error("❌ Hugging Face API error:", text);
      throw new Error(text);
    }

    const data = JSON.parse(text);
    const answer = data[0]?.generated_text || "Сэр, извините, я не смог ответить.";

    res.status(200).json({
      choices: [
        {
          message: {
            content: answer
          }
        }
      ]
    });

  } catch (error) {
    console.error("💥 Final error:", error);
    res.status(200).json({
      choices: [
        {
          message: {
            content: `Сэр, ошибка: ${error.message}`
          }
        }
      ]
    });
  }
}
