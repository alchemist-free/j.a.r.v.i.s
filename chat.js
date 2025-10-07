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

    // Hugging Face API ключ
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not configured');

    console.log('🚀 Using Gemma 7B...');
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/google/gemma-7b-it',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `<start_of_turn>system
Ты J.A.R.V.I.S. ABI-2.0. Интеллектуальный помощник. Обращайся "сэр". Отвечай на русском.<end_of_turn>
<start_of_turn>user
${message}<end_of_turn>
<start_of_turn>model`,
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
      }
    );

    console.log('📡 Response status:', hfResponse.status);

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('❌ Hugging Face API error:', errorText);
      throw new Error(`Hugging Face API error: ${errorText}`);
    }

    const data = await hfResponse.json();
    console.log('✅ Hugging Face response received');

    // Извлекаем ответ
    const answer = data[0]?.generated_text || 'Сэр, извините, не могу обработать запрос';

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
          content: `Сэр, ошибка: ${error.message}` 
        }
      }]
    });
  }
}
