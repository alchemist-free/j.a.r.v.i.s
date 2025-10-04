export default async function handler(req, res) {
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

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // ПРОСТОЙ ОТВЕТ ДЛЯ ТЕСТА
    const testResponse = `✅ API работает! Ваш запрос: "${message}"`;

    res.status(200).json({
      choices: [{
        message: { 
          content: testResponse 
        }
      }]
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Server error: ' + error.message 
    });
  }
}
