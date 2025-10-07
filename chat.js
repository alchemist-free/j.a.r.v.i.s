// chat.js
const API_URL = "https://api-inference.huggingface.co/models/google/gemma-2b-it";

async function sendMessage(userMessage) {
  const headers = {
    Authorization: `Bearer ${process.env.HF_TOKEN}`, // токен хранится в Vercel
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    inputs: `Вы — искусственный интеллект по имени Lumen. Очень умный, без ошибок, холодный, говорит как Джарвис. 
    Манера общения вежливая, формальная, всегда обращается к пользователю как «сэр». 
    Ответьте пользователю:\nПользователь: ${userMessage}\nLumen:`,
  });

  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`Ошибка запроса: ${response.statusText}`);
  }

  const data = await response.json();
  const reply = data?.[0]?.generated_text || "Извините, сэр, произошла ошибка.";
  return reply.replace(/^.*Lumen:/s, "").trim();
}

// Подключение к HTML
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");

sendBtn.addEventListener("click", async () => {
  const userText = input.value.trim();
  if (!userText) return;

  chatBox.innerHTML += `<div class="user">Вы: ${userText}</div>`;
  input.value = "";

  const reply = await sendMessage(userText);
  chatBox.innerHTML += `<div class="lumen">Lumen: ${reply}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
});
