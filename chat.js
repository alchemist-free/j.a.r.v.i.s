export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message } = req.body;
    if (!message) throw new Error("Нет входного сообщения, сэр");

    const hfResponse = await fetch("https://api-inference.huggingface.co/models/google/gemma-2b-it", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `<s>[INST] Ты — Lumen. Интеллектуальный помощник, холодный и точный как Джарвис. Обращайся "сэр". Вопрос: ${message} [/INST]`,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false,
        },
        options: { wait_for_model: true }
      }),
    });

    const data = await hfResponse.json();
    const reply = data[0]?.generated_text || "Сэр, ответ не получен.";

    res.status(200).json({
      choices: [{ message: { content: reply } }]
    });

  } catch (err) {
    res.status(500).json({
      choices: [{ message: { content: `Сэр, произошла ошибка: ${err.message}` } }]
    });
  }
}
