export default async function handler(req, res) {
  console.log('🎯 Lumen AI API called');
  
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
    console.log('📨 Received message:', message);

    // Проверяем Hugging Face API ключ
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.error('❌ HUGGINGFACE_API_KEY not configured');
      return res.status(200).json({
        choices: [{
          message: { 
            content: "Lumen AI PEO-1.0: API ключ не настроен. Пожалуйста, добавьте HUGGINGFACE_API_KEY в настройки Vercel." 
          }
        }]
      });
    }

    console.log('🔑 API Key found, using Gemma 2B model...');

    // Hugging Face API для Gemma 2B
    const HF_API_URL = 'https://api-inference.huggingface.co/models/google/gemma-2b-it';
    
    const hfResponse = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `<start_of_turn>system
Ты Lumen AI - Personal Engine Operator версии 1.0. Ты интеллектуальный помощник. Отвечай профессионально и полезно. Отвечай на русском языке.<end_of_turn>
<start_of_turn>user
${message}<end_of_turn>
<start_of_turn>model`,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      })
    });

    console.log('📡 Hugging Face response status:', hfResponse.status);

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('❌ Hugging Face API error:', errorText);
      
      // Если модель загружается, возвращаем информационное сообщение
      if (hfResponse.status === 503) {
        return res.status(200).json({
          choices: [{
            message: { 
              content: "Lumen AI: Модель в настоящее время загружается. Пожалуйста, попробуйте again через 20-30 секунд." 
            }
          }]
        });
      }
      
      throw new Error(`Hugging Face API error: ${hfResponse.status}`);
    }

    const data = await hfResponse.json();
    console.log('✅ Hugging Face response received:', data);

    // Извлекаем ответ
    let answer = data[0]?.generated_text || "Lumen AI: Не удалось обработать запрос.";
    
    // Очищаем ответ от лишних тегов
    answer = answer.replace(/<[^>]*>/g, '').trim();
    
    // Если ответ пустой, возвращаем стандартное сообщение
    if (!answer || answer.length < 5) {
      answer = "Lumen AI PEO-1.0: Запрос принят. Чем еще могу помочь?";
    }

    console.log('🤖 Final answer:', answer);

    res.status(200).json({
      choices: [{
        message: { 
          content: answer 
        }
      }]
    });

  } catch (error) {
    console.error('💥 Final error:', error);
    
    // Возвращаем пользователю понятное сообщение об ошибке
    res.status(200).json({
      choices: [{
        message: { 
          content: `Lumen AI: Произошла ошибка - ${error.message}. Проверьте настройки API ключа.` 
        }
      }]
    });
  }
}
