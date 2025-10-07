export default async function handler(req, res) {
  // ... CORS и проверки ...

  try {
    const { message } = req.body;

    // Hugging Face API ключ
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not configured');

    // Hugging Face API - Microsoft DialoGPT (бесплатная)
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            text: `Ты J.A.R.V.I.S. ABI-2.0. Отвечай как интеллектуальный помощник. Обращайся "сэр". Будь точным и профессиональным. Отвечай на русском. Вопрос: ${message}`
          },
          parameters: {
            max_new_tokens: 200,
            temperature: 0.7,
            return_full_text: false
          }
        })
      }
    );

    if (!hfResponse.ok) {
      const error = await hfResponse.text();
      throw new Error(`Hugging Face API error: ${error}`);
    }

    const data = await hfResponse.json();
    const answer = data[0]?.generated_text || 'Извините, не могу ответить';

    res.status(200).json({
      choices: [{ message: { content: answer } }]
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({
      choices: [{ message: { content: `Сэр, ошибка: ${error.message}` } }]
    });
  }
}
