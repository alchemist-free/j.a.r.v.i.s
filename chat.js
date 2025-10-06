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

    // Проверяем DeepSeek API ключ
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    console.log('🔑 API Key exists, first chars:', apiKey.substring(0, 10) + '...');

    // DeepSeek API
    console.log('🚀 Using DeepSeek API...');
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'system',
          content: 'Ты J.A.R.V.I.S. ABI-2.0. Искусственный интеллект и интеллектуальный помощник. Отвечай как Джарвис из фильмов Marvel. Обращайся "сэр". Будь точным, профессиональным, немного формальным, но полезным. Отвечай на русском языке.'
        }, {
          role: 'user', 
          content: message
        }],
        max_tokens: 500,
        temperature: 0.7,
        stream: false
      })
    });

    console.log('📡 Response status:', deepseekResponse.status);

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('❌ DeepSeek API error:', errorText);
      throw new Error(`DeepSeek API error ${deepseekResponse.status}: ${errorText}`);
    }

    const data = await deepseekResponse.json();
    console.log('✅ DeepSeek response received');

    const answer = data.choices[0].message.content;
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
