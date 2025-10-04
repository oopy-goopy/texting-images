import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import path from "path";

config({path: path.resolve(import.meta.dirname, "../.env")});

