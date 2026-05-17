import axios, { type AxiosError } from "axios";
import { env } from "../config/env";
import { AppError } from "../utils/httpError";

const delay = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const shouldRetry = (error: unknown): boolean => {
  const axiosError = error as AxiosError | undefined;
  const status = axiosError?.response?.status;
  return status === 429 || (status !== undefined && status >= 500);
};

const extractGeminiText = (payload: unknown): string | null => {
  const data = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" && text.trim() ? text.trim() : null;
};

const generateWithGemini = async (prompt: string): Promise<string> => {
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === "your_gemini_api_key") {
    throw new AppError("Gemini API key is missing. Set GEMINI_API_KEY in backend/.env", 500, "AI_NOT_CONFIGURED");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`;
  const response = await axios.post(
    url,
    {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY
      },
      timeout: 15_000
    }
  );

  const text = extractGeminiText(response.data);
  if (!text) {
    throw new AppError("Gemini returned an empty response.", 502, "AI_EMPTY_RESPONSE");
  }

  return text;
};

const generateWithGroq = async (prompt: string): Promise<string> => {
  if (!env.GROQ_API_KEY || env.GROQ_API_KEY === "your_groq_api_key") {
    throw new AppError("Groq API key is missing. Set GROQ_API_KEY in backend/.env", 500, "AI_NOT_CONFIGURED");
  }

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: env.GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.GROQ_API_KEY}`
      },
      timeout: 15_000
    }
  );

  const text = response.data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new AppError("Groq returned an empty response.", 502, "AI_EMPTY_RESPONSE");
  }

  return text.trim();
};

export const buildInsightPrompt = (summary: unknown, maxWords: number): string => {
  return [
    "You are a business analyst for DataInsights Corp.",
    "Analyze this Titanic passenger analytics summary:",
    JSON.stringify(summary, null, 2),
    "Return exactly:",
    "1) Key trend",
    "2) Top driver",
    "3) Potential anomaly",
    "4) Two actionable recommendations",
    `Keep the answer concise and under ${maxWords} words.`
  ].join("\n");
};

export const generateAiInsight = async (summary: unknown, maxWords: number): Promise<{ insight: string; fallbackUsed: boolean }> => {
  const prompt = buildInsightPrompt(summary, maxWords);

  try {
    const generate = env.AI_PROVIDER === "groq" ? generateWithGroq : generateWithGemini;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const insight = await generate(prompt);
        return { insight, fallbackUsed: false };
      } catch (error) {
        if (attempt === 0 && shouldRetry(error)) {
          await delay(700);
          continue;
        }

        throw error;
      }
    }

    throw new AppError("AI service failed unexpectedly.", 500, "AI_ERROR");
  } catch (error) {
    console.error("AI generation failed:", error);
    return {
      insight: "AI insight temporarily unavailable. Please retry.",
      fallbackUsed: true
    };
  }
};

