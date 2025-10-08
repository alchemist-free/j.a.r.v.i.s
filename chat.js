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
            content: "Lumen AI PEO-1.0: 🔧 API ключ не настроен. Добавьте HUGGINGFACE_API_KEY в настройки Vercel." 
          }
        }]
      });
    }

    console.log('🔑 API Key found, using Gemma 2B...');

    // Gemma 2B модель
    const HF_API_URL = 'https://api-inference.huggingface.co/models/google/gemma-2-2b-it';
    
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
          max_new_tokens: 250,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false
        },
        options: {
          wait_for_model: true,
          use_cache: true
        }
      })
    });

    console.log('📡 Hugging Face response status:', hfResponse.status);

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('❌ Hugging Face API error:', errorText);
      
      // Если модель загружается
      if (hfResponse.status === 503) {
        return res.status(200).json({
          choices: [{
            message: { 
              content: "Lumen AI: 🕐 Модель Gemma 2B загружается. Это может занять 1-2 минуты при первом запросе. Пожалуйста, подождите и попробуйте снова через 30 секунд." 
            }
          }]
        });
      }
      
      // Если модель не найдена
      if (hfResponse.status === 404) {
        return res.status(200).json({
          choices: [{
            message: { 
              content: "Lumen AI: 🔧 Модель Gemma 2B не найдена или требует специального доступа. Попробуйте использовать другую модель." 
            }
          }]
        });
      }
      
      throw new Error(`Hugging Face API error: ${hfResponse.status} - ${errorText}`);
    }

    const data = await hfResponse.json();
    console.log('✅ Hugging Face response received:', data);

    // Извлекаем ответ
    let answer = data[0]?.generated_text || "Lumen AI PEO-1.0: Запрос принят. Чем еще могу помочь?";
    
    // Очищаем ответ от тегов и лишних символов
    answer = answer
      .replace(/<[^>]*>/g, '')
      .replace(/<start_of_turn>|<\/start_of_turn>/g, '')
      .replace(/model\s*/, '')
      .trim();
    
    // Убираем повторяющиеся префиксы
    if (answer.includes('Lumen AI')) {
      answer = answer.split('Lumen AI').pop().replace(/^[:\s]*/, '');
    }
    
    // Если ответ слишком короткий или пустой
    if (!answer || answer.length < 3) {
      answer = "Lumen AI PEO-1.0: Запрос обработан. Чем еще могу быть полезен?";
    } else {
      answer = `Lumen AI PEO-1.0: ${answer}`;
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
    
    res.status(200).json({
      choices: [{
        message: { 
          content: `Lumen AI: 🔧 Ошибка соединения - ${error.message}` 
        }
      }]
    });
  }
}
