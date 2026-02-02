
import { GoogleGenAI } from "@google/genai";
import { TimeEntry, Category } from "../types";

const getClient = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateDailyInsight = async (
    entries: TimeEntry[],
    categories: Category[]
): Promise<string> => {
    const ai = getClient();
    
    // Calculate total duration
    const totalMinutes = entries.reduce((acc, curr) => acc + curr.durationMinutes, 0);

    // Prepare detailed analysis: Actual vs Goal for each category
    const analysis = categories.map(cat => {
        const spent = entries
            .filter(e => e.categoryId === cat.id)
            .reduce((acc, e) => acc + e.durationMinutes, 0);
        
        return {
            category: cat.name,
            spentMinutes: spent,
            goalMinutes: cat.dailyGoalMinutes,
            difference: spent - cat.dailyGoalMinutes,
            metGoal: spent >= cat.dailyGoalMinutes
        };
    });

    const prompt = `
        You are an elite productivity and behavioral scientist coaching the user of the "Take Your Time" app.
        
        DATA FOR TODAY (Total: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m):
        ${JSON.stringify(analysis, null, 2)}

        INSTRUCTIONS:
        1. Analyze the specific balance. Identify the biggest win (goal met) or the biggest deficit (neglected category).
        2. DO NOT be generic (e.g., don't say "Good job tracking").
        3. Use the ACTUAL category names in your response.
        4. If they have 0 minutes in a key category (like Study or Work), gently call them out.
        5. If they worked too much (way over goal), suggest rest.
        6. Provide ONE specific, actionable recommendation for tomorrow based on this data.
        7. Keep it under 2 sentences. Be witty but professional.
        
        Example Output: "You smashed your Study goal by 1 hour, but completely ignored Wellness. Tomorrow, try a 15-minute walk before opening your books."
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });
        return response.text || "Keep tracking to see your progress!";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "You're doing great! Keep tracking to unlock more insights.";
    }
};
