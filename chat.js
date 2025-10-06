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

    // Проверяем Groq API ключ
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    console.log('🔑 API Key exists, first chars:', apiKey.substring(0, 10) + '...');

    // Groq API
    console.log('🚀 Using Groq API...');
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
  model: 'llama-3.2-3b-preview',
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

    console.log('📡 Response status:', groqResponse.status);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('❌ Groq API error:', errorText);
      throw new Error(`Groq API error ${groqResponse.status}: ${errorText}`);
    }

    const data = await groqResponse.json();
    console.log('✅ Groq response received');

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
