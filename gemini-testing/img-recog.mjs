import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import path from "path";
import * as fs from "node:fs";

config({path: path.resolve(import.meta.dirname, "../.env")});

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API});

export async function imagecribe(filepath) {
  const base64ImageFile = fs.readFileSync(filepath, {
    encoding: "base64",
  });

  const contents = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64ImageFile,
      },
    },
    { text: "describe the image in a single word. only give a single word response." },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
  });
  return response.text;
}