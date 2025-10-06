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

    console.log('🔑 API Key exists, first chars:', apiKey.substring(0, 10) + '...');

    // ПРАВИЛЬНЫЙ URL - пробуем разные варианты
    const geminiURL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;
    console.log('🌐 Request URL:', geminiURL);

    const geminiResponse = await fetch(geminiURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Ты J.A.R.V.I.S. ABI-2.0. Отвечай как интеллектуальный помощник. Обращайся "сэр". Будь точным и профессиональным. Отвечай на русском.

Вопрос: ${message}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7
        }
      })
    });

    console.log('📡 Response status:', geminiResponse.status);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Full error response:', errorText);
      throw new Error(`Gemini API error ${geminiResponse.status}: ${errorText}`);
    }

    const data = await geminiResponse.json();
    console.log('✅ Response received');

    const answer = data.candidates[0].content.parts[0].text;
    console.log('🤖 Answer:', answer);

    res.status(200).json({
      choices: [{
        message: { 
          content: answer 
        }
      }]
    });

  } catch (error) {
    console.error('💥 Final error:', error);
    
    res.status(200).json({
      choices: [{
        message: { 
          content: `Сэр, техническая ошибка: ${error.message}` 
        }
      }]
    });
  }
}
