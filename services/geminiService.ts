import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

// Initialize Gemini Client
// IMPORTANT: The API key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getChatResponse = async (
  history: Message[],
  newMessage: string,
  systemInstruction: string = "You are a helpful assistant."
): Promise<AsyncGenerator<string, void, unknown>> => {

  const model = "gemini-2.5-flash"; // Using the fast, efficient model for chat

  // Transform internal message format to Gemini format
  // We take the last few messages to maintain context but avoid token limits
  const recentHistory = history.slice(-20).map(msg => {
    // If text is empty (e.g. sticker only), provide a fallback text for context
    let textContent = msg.text;
    if ((!textContent || textContent.trim() === "") && msg.attachment) {
        textContent = `[User sent a ${msg.attachment.type}]`;
    }
    
    // Default fallback if still empty (shouldn't happen with above logic but safe guard)
    if (!textContent || textContent.trim() === "") {
        textContent = "[Non-text message]";
    }

    return {
        role: msg.sender === 'me' ? 'user' : 'model',
        parts: [{ text: textContent }]
    };
  });

  try {
    const chat: Chat = ai.chats.create({
      model: model,
      history: recentHistory,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const resultStream = await chat.sendMessageStream({ message: newMessage });

    return (async function* () {
      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          yield c.text;
        }
      }
    })();

  } catch (error) {
    console.error("Error connecting to Gemini:", error);
    // Fallback generator in case of error
    return (async function* () {
      yield "Извините, сейчас я не могу ответить. Проверьте соединение или API ключ.";
    })();
  }
};