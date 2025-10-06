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

    // Проверяем OpenAI API ключ
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('🔑 API Key exists, first chars:', apiKey.substring(0, 10) + '...');

    // OpenAI API
    console.log('🚀 Using OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: 'Ты J.A.R.V.I.S. ABI-2.0. Искусственный интеллект и интеллектуальный помощник. Отвечай как Джарвис из фильмов Marvel. Обращайся "сэр". Будь точным, профессиональным, немного формальным, но полезным. Отвечай на русском языке.'
        }, {
          role: 'user', 
          content: message
        }],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    console.log('📡 Response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API error ${openaiResponse.status}: ${errorText}`);
    }

    const data = await openaiResponse.json();
    console.log('✅ OpenAI response received');

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
