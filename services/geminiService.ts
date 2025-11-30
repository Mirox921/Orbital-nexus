import { GoogleGenAI } from "@google/genai";
import { GameEvent } from "../types";

// Initialize Gemini
// NOTE: We wrap this in a try-catch or check to ensure the app doesn't crash if API key is missing,
// although the prompt says to assume it's valid.
const apiKey = process.env.API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateEventNarrative = async (
  eventType: string,
  context: string
): Promise<{ title: string; description: string }> => {
  // If AI is not initialized, use fallback immediately
  if (!ai) {
    return getFallbackNarrative(eventType);
  }

  try {
    const model = ai.models;
    const prompt = `
      You are the AI computer of a futuristic space station.
      Generate a short, urgent, sci-fi alert title and a 1-sentence description for a random event.
      Event Type: ${eventType}
      Context: ${context}
      
      Format: JSON
      { "title": "...", "description": "..." }
    `;

    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response text");
    
    return JSON.parse(text);
  } catch (error: any) {
    // Gracefully handle quota limits without cluttering console with errors
    if (error?.status === 429 || error?.message?.includes('429')) {
      console.warn("Gemini API Quota limit reached. Switching to offline narrative protocols.");
    } else {
      console.error("Gemini API Error:", error);
    }
    
    return getFallbackNarrative(eventType);
  }
};

export const generateCrewChatter = async (role: string, morale: number): Promise<string> => {
  if (!ai) return getRandomFallbackChatter(role);

  try {
    const model = ai.models;
    const tone = morale > 70 ? "optimistic" : morale > 30 ? "neutral" : "panicked";
    const prompt = `Generate a very short (max 10 words) bark/chatter from a space station ${role}. Tone: ${tone}.`;

    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || getRandomFallbackChatter(role);
  } catch (error: any) {
    // Silent fail for chatter on quota limit to avoid interrupting gameplay flow
    if (error?.status !== 429 && !error?.message?.includes('429')) {
       console.error("Gemini Crew Chatter Error:", error);
    }
    return getRandomFallbackChatter(role);
  }
};

// --- Fallback Generators (Offline Mode) ---

const getFallbackNarrative = (eventType: string) => {
    const fallbacks: Record<string, {title: string, description: string}> = {
        'Meteor Shower': { 
            title: "Meteor Alert", 
            description: "Dense debris field detected on collision vector. Impact imminent." 
        },
        'System Malfunction': { 
            title: "System Failure", 
            description: "Critical component malfunction detected. Maintenance required immediately." 
        },
        'Solar Flare': { 
            title: "Solar Warning", 
            description: "High energy radiation wave incoming from local star. Shield systems stressed." 
        },
        'Space Debris': { 
            title: "Collision Warning", 
            description: "Space junk approaching station perimeter at high velocity." 
        },
        'Alien Scan': { 
            title: "Unknown Signal", 
            description: "High frequency scan detected from unidentified source in deep space." 
        },
        'generic': {
            title: "Station Alert",
            description: `Anomaly detected: ${eventType}. Check station status.`
        }
    };
    return fallbacks[eventType] || fallbacks['generic'];
};

const getRandomFallbackChatter = (role: string) => {
    const common = [
        "Systems nominal.",
        "Did you hear that noise?",
        "Coffee machine is broken again.",
        "Just another rotation.",
        "Hull integrity at 98%.",
        "I need a vacation.",
        "Reading some strange interference.",
        "All decks secure."
    ];
    
    const roleSpecific: Record<string, string[]> = {
        'Commander': [
            "Maintain discipline people.", 
            "Watch those monitors.", 
            "Status report?",
            "Keep the station in one piece."
        ],
        'Engineer': [
            "Checking the power couplings.", 
            "Fixing a leak in module 3.", 
            "I can reroute the power.",
            "That shouldn't be making that sound."
        ],
        'Scientist': [
            "Fascinating readings.", 
            "Analyzing the samples.", 
            "The data is inconclusive.",
            "I need more power for the lab."
        ],
        'Medic': [
            "Vitals look stable.", 
            "Don't forget your daily exercise.", 
            "Medical bay is clean.",
            "Stay hydrated."
        ],
    };
    
    // Combine common lines with role-specific ones
    const pool = [...common, ...(roleSpecific[role] || [])];
    return pool[Math.floor(Math.random() * pool.length)];
};