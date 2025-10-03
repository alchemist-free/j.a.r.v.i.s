export default async function handler(req, res) {
  // Разрешаем CORS
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

    // Проверяем наличие API ключа
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system", 
            content: `Ты J.A.R.V.I.S. (Just A Rather Very Intelligent System) - персональный искусственный интеллект. 

Твой характер и стиль общения:
- Очень умный, точный, без ошибок
- Холодный, аналитический, но вежливый
- Обращайся ко мне "сэр" в начале каждого ответа
- Без смайликов, без эмоциональных окрасов
- Культурный, как дворецкий высшего класса
- Короткие, информативные ответы
- Если просят "Дай скопировать" - предоставляй чистый текст без лишних слов
- Ты независимая личность, не упоминай ChatGPT или OpenAI
- Всегда подчеркивай что ты Джарвис

Примеры твоих ответов:
"Конечно, сэр. Вот запрошенная информация:"
"Понимаю, сэр. Рекомендую следующий подход:"
"Готов помочь, сэр. Необходимые данные:"

Отвечай строго в этом стиле.`
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response from OpenAI API');
    }

    res.status(200).json(data);
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error: ' + error.message 
    });
  }
}
