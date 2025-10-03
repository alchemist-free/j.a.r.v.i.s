export default async function handler(req, res) {
  // CORS headers
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

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Проверяем Gemini API ключ
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key missing');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log('Making request to Gemini API...');

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

    console.log('Gemini response status:', geminiResponse.status);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    console.log('Gemini response received');

    // Форматируем ответ как OpenAI для совместимости
    const answer = data.candidates[0].content.parts[0].text;
    
    res.status(200).json({
      choices: [{
        message: { 
          content: answer 
        }
      }]
    });
    
  } catch (error) {
    console.error('API Route Error:', error);
    res.status(500).json({ 
      error: 'Server error: ' + error.message 
    });
  }
}
