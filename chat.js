export default async function handler(req, res) {
  console.log('🎯 API called!');
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    console.log('📨 Received:', message);

    // Проверяем Gemini API ключ
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('🔑 Using Gemini API...');

    // Запрос к Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Ты J.A.R.V.I.S. ABI-2.0 - интеллектуальный помощник. 
Твой стиль: точный, профессиональный, обращайся "сэр", без эмоций.
Отвечай на русском языке.

Запрос пользователя: ${message}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    const answer = data.candidates[0].content.parts[0].text;

    console.log('✅ Gemini response:', answer);

    res.status(200).json({
      choices: [{
        message: { 
          content: answer 
        }
      }]
    });

  } catch (error) {
    console.error('❌ Error:', error);
    
    // Fallback ответ если API не работает
    const fallbackResponse = `Конечно, сэр. Ваш запрос получен. ${error.message}`;
    
    res.status(200).json({
      choices: [{
        message: { 
          content: fallbackResponse 
        }
      }]
    });
  }
}
