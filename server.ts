/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

// Lazily initialize Gemini AI to avoid crashing on startup if the key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY is missing or unconfigured. Please add your key under Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Thinker definitions (duplicated locally to ensure server and client operate independently of build bundler paths)
const SERVER_THINKERS: Record<string, { name: string; title: string; philosophy: string }> = {
  smith: { name: "Adam Smith", title: "Father of Classical Capitalism", philosophy: "Classical Economics, Division of Labor, Natural Liberty" },
  marx: { name: "Karl Marx", title: "Father of Revolutionary Socialism", philosophy: "Historical Materialism, Surplus Value, Class Struggle" },
  machiavelli: { name: "Niccolò Machiavelli", title: "Realist Political Strategist", philosophy: "Political Realism, Power Dynamics, Strategic Pragmatism" },
  aurelius: { name: "Marcus Aurelius", title: "The Stoic Emperor", philosophy: "Stoicism, Personal Virtue, Inner Citadel" },
  galileo: { name: "Galileo Galilei", title: "Pioneer of the Scientific Method", philosophy: "Empiricism, Mathematical Realism, Scientific Freedom" },
  oppenheimer: { name: "J. Robert Oppenheimer", title: "Father of the Atomic Bomb", philosophy: "Theoretical Physics, Moral Ambiguity, Ethics of Discovery" },
  gandhi: { name: "Mahatma Gandhi", title: "Apostle of Non-Violent Resistance", philosophy: "Satyagraha, Constructive Program, Gram Swaraj" },
  singh: { name: "Bhagat Singh", title: "Militant Socialist Revolutionary", philosophy: "Revolutionary Socialism, Direct Confrontation, Anti-Imperialism" },
  freud: { name: "Sigmund Freud", title: "Father of Psychoanalysis", philosophy: "The Unconscious, Id/Ego/Superego, Pleasure Principle" },
  jung: { name: "Carl Jung", title: "Founder of Analytical Psychology", philosophy: "Analytical Psychology, Collective Unconscious, Archetypes" }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Debate Generation Endpoint
  app.post("/api/debate", async (req, res) => {
    const { dilemma, thinkerAId, thinkerBId } = req.body;

    if (!dilemma || !thinkerAId || !thinkerBId) {
      return res.status(400).json({ error: "Bad Request", message: "Please provide dilemma, thinkerAId, and thinkerBId." });
    }

    const tA = SERVER_THINKERS[thinkerAId];
    const tB = SERVER_THINKERS[thinkerBId];

    if (!tA || !tB) {
      return res.status(404).json({ error: "Not Found", message: "One or both selected thinkers were not found." });
    }

    try {
      const ai = getGeminiClient();

      const systemInstruction = `You are a master of classical philosophy, historical rhetoric, and dialectics.
Your task is to simulate an intense, highly academic debate in "The Council Convenes" format between two historical thinkers on a modern-day dilemma.
Dilemma to debate: "${dilemma}"
Debater A: ${tA.name} (${tA.title}. Focus on: ${tA.philosophy})
Debater B: ${tB.name} (${tB.title}. Focus on: ${tB.philosophy})

You MUST speak in their precise historical voices, linguistic styles, specific vocabulary, and ideological frameworks.
For example:
- Adam Smith must talk about division of labor, Universal Opulence, the invisible hand, or market liberty. Use dignified, 18th-century Scottish Enlightenment English.
- Karl Marx must critique constant and variable capital, alienation, bourgeois ownership, surplus value, and class struggle. Use revolutionary, analytical, Hegelian socialist rhetoric.
- Niccolò Machiavelli must argue about realism, the fux and the lion, strategic power preservation, and control of perception. Use pragmatic, clinical political realism.
- Marcus Aurelius must discuss the inner citadel of the mind, Stoic justice, virtue, transparent duty, and remaining undisturbed. Use introspective, serene, cosmopolitan Stoicism.
- Galileo Galilei must highlight empirical observation, natural laws written in mathematics, and scientific freedom.
- J. Robert Oppenheimer must discuss the ethics of creation, the nuclear/atomic age, unleashing tremendous forces we cannot recall, and the moral weight of destruction.
- Mahatma Gandhi must focus on Satyagraha (soul-force), non-cooperation, Swadeshi (self-reliance), self-purification, and moral means.
- Bhagat Singh must advocate direct revolutionary disruption, dismantling oppressive systems of capital, and physical/digital acts of confrontational defense.
- Sigmund Freud must focus on the primitive Id, the pleasure principle, infantile validation, repressed urges, and repetition compulsion.
- Carl Jung must discuss the collective unconscious, shadow integration, archetypes, and the individuation process as a search for sacred meaning.

You must return a JSON response containing exactly these fields:
1. "title": A creative academic title for the debate.
2. "speechA": A deeply sophisticated and detailed opening argument for ${tA.name}. It must be historically authentic, stylistically pristine, and approximately 150-250 words.
3. "speechB": A deeply sophisticated and detailed opening argument for ${tB.name}. It must be historically authentic, stylistically pristine, and approximately 150-250 words.
4. "counterA": A sharp, devastating 1-2 sentence cross-examination or rebuttal by ${tA.name} directly challenging ${tB.name}'s opening speech.
5. "counterB": A sharp, devastating 1-2 sentence cross-examination or rebuttal by ${tB.name} directly challenging ${tA.name}'s opening speech.`;

      let response;
      let retries = 2;
      let delayMs = 1500;

      for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Debate "${dilemma}" between ${tA.name} and ${tB.name}.`,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.75,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Creative academic title of this debate panel" },
                  speechA: { type: Type.STRING, description: "Opening statement of Thinker A" },
                  speechB: { type: Type.STRING, description: "Opening statement of Thinker B" },
                  counterA: { type: Type.STRING, description: "Thinker A's 1-2 sentence rebuttal challenge to Thinker B" },
                  counterB: { type: Type.STRING, description: "Thinker B's 1-2 sentence rebuttal challenge to Thinker A" }
                },
                required: ["title", "speechA", "speechB", "counterA", "counterB"]
              }
            }
          });
          break; // successfully generated, break out of loop!
        } catch (genErr: any) {
          const errMsg = genErr.message || "";
          const is503 = genErr.status === 503 || errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("temporary") || errMsg.includes("UNAVAILABLE");
          if (is503 && attempt <= retries) {
            console.warn(`[Gemini API 503] High demand detected on attempt ${attempt}. Retrying in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs *= 2; // exponential backoff
            continue;
          }
          throw genErr; // throw original error if max retries exceeded or not a 503
        }
      }

      if (!response || !response.text) {
        throw new Error("Empty or invalid response received from Gemini.");
      }

      const text = response.text;
      let debateData;
      try {
        debateData = JSON.parse(text.trim());
      } catch (jsonErr) {
        // Robust cleanup fallback for markdown wrappers or extra characters
        const cleaned = text.replace(/```json/gi, "").replace(/```/gi, "").trim();
        debateData = JSON.parse(cleaned);
      }
      res.json({
        id: "custom_" + Date.now(),
        title: debateData.title,
        thinkerAId,
        thinkerBId,
        speechA: debateData.speechA,
        speechB: debateData.speechB,
        counterA: debateData.counterA,
        counterB: debateData.counterB,
        isCustom: true
      });

    } catch (err: any) {
      console.error("Gemini API Error:", err.message);
      
      // If the API key is missing or invalid, provide a fully-functional offline fallback
      // so the application doesn't completely break for the user.
      const isKeyError = err.message.includes("GEMINI_API_KEY") || err.message.includes("API key");
      
      res.status(isKeyError ? 401 : 500).json({
        error: isKeyError ? "API_KEY_UNCONFIGURED" : "GENERATE_ERROR",
        message: err.message,
        fallbackData: {
          id: "fallback_" + Date.now(),
          title: `Dialogue on "${dilemma.substring(0, 40)}..."`,
          thinkerAId,
          thinkerBId,
          speechA: `[Offline Simulation] ${tA.name} begins to examine: "${dilemma}". As a thinker of historical renown, they would analyze this dilemma through their classical framework, advocating for a robust solution based on their core philosophy. (Configure your GEMINI_API_KEY in the Secrets panel to unlock full, authentic, and dynamically generated debates!)`,
          speechB: `[Offline Simulation] ${tB.name} responds with a contrasting view on: "${dilemma}". Drawing from their historical insights, they would dispute ${tA.name}'s proposal, highlighting potential failures and proposing a counter-structural approach.`,
          counterA: `${tA.name} challenges: Your perspective overlooks the organic dynamics of human progress and incentive!`,
          counterB: `${tB.name} counters: And your model ignores the underlying power structures and systemic inequalities that oppress the people!`
        }
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Static production assets configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ChronoDialectic server active on port ${PORT}`);
  });
}

startServer();
