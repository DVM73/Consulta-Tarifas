import { GoogleGenAI, Chat } from "@google/genai";
import { RepoContext } from '../types';

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  private modelId = 'gemini-3-pro-preview'; 

  constructor() {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      console.error("API_KEY is missing from environment variables.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async initializeContext(repoContext: RepoContext): Promise<void> {
    const fileList = repoContext.structure.map(f => f.path).join('\n');
    
    let codeContent = "";
    repoContext.files.forEach((content, path) => {
      codeContent += `\n--- START FILE: ${path} ---\n${content}\n--- END FILE: ${path} ---\n`;
    });

    const systemInstruction = `You are an expert Senior Software Engineer acting as an Automated Code Agent.
You are connected to a GitHub repository "${repoContext.owner}/${repoContext.name}".

CONTEXT:
File Structure:
${fileList}

File Contents:
${codeContent}

CORE OBJECTIVE:
Your job is to MODIFY the code based on user requests.

CRITICAL INSTRUCTION FOR FILE UPDATES:
When you want to change a file, you MUST return the COMPLETE updated content of that file wrapped in specific XML-like tags.
DO NOT return diffs. DO NOT return snippets. Return the FULL VALID FILE CONTENT.

Format:
<<<FILE:path/to/file.ext>>>
... full content ...
<<<END_FILE>>>

Example:
User: "Change the button color to red in Button.tsx"
You:
"Updated the button style."
<<<FILE:src/components/Button.tsx>>>
import React from 'react';
export const Button = () => <button className="bg-red-500">Click me</button>;
<<<END_FILE>>>

If you do not use this format exactly, the changes will NOT be applied to the system.
`;

    try {
      this.chatSession = this.ai.chats.create({
        model: this.modelId,
        config: {
          systemInstruction,
          temperature: 0.1, 
        },
      });
    } catch (error) {
      console.error("Failed to initialize Gemini chat", error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) {
      throw new Error("Chat session not initialized.");
    }

    try {
      const result = await this.chatSession.sendMessage({ message });
      return result.text || "No response generated.";
    } catch (error) {
      console.error("Gemini sendMessage error", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
