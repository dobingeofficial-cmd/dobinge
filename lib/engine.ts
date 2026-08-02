import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchTMDBMetadata } from "./tmdb";

// Initialize the Gemini SDK safely
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateDoBingeCurations(moods: string[], type: 'movie' | 'tv') {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // The Master Prompt
  const prompt = `
    You are the DoBinge AI, the world's most elite and cinematic entertainment curator.
    A user is asking for ${type} recommendations.
    Their current mood/vibes: ${moods.join(", ")}.
    
    Task: Curate a list of 6 highly specific, premium ${type}s that perfectly match this exact emotional state. Include a mix of hidden gems and critically acclaimed masterpieces.
    
    CRITICAL INSTRUCTION: You MUST output ONLY a valid JSON array of objects. Do not include markdown formatting, backticks, or conversational text.
    
    Format:
    [
      { "title": "Exact Title", "year": "YYYY" }
    ]
  `;

  try {
    // 1. Get the intelligent curation from Gemini
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean the response to ensure strict JSON parsing
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const curatedTitles = JSON.parse(cleanJson);

    // 2. Map the AI's titles to real TMDB visual data
    const richRecommendations = await Promise.all(
      curatedTitles.map(async (item: { title: string, year: string }) => {
        return await searchTMDBMetadata(item.title, item.year, type);
      })
    );

    // Filter out any titles TMDB couldn't find cleanly
    return richRecommendations.filter(item => item !== null);

  } catch (error) {
    console.error("DoBinge Neural Engine Fault:", error);
    throw new Error("Failed to synthesize recommendations.");
  }
}