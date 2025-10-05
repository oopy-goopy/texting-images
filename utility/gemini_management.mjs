import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import path from "path";

config({path: path.resolve(import.meta.dirname, "../.env")});

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API});

export async function describe(user, arr, lang) {
    const prompt = `
    Out of the following array ${arr}, form a sentence trying to assume what ${user} is trying to say.
    Output only the sentence and nothing else.
    Note: The words in the array does not need to be in the sentence.
    Language: ${lang}`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt
    });
    return response.text;
}