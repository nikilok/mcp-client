import { google } from "@ai-sdk/google";

export class LLMService {
  private model = google("models/gemini-2.0-flash-exp");

  async extractCompanyName(message: string): Promise<string | null> {
    try {
      const response = await this.model.doGenerate({
        inputFormat: "messages",
        mode: { type: "regular" },
        prompt: [{
          role: "user",
          content: [{
            type: "text",
            text: `Extract just the company name from this question. Respond with ONLY the company name, nothing else:
Question: "${message}"

For example:
"Is Google on the sponsorship list?" -> "Google"
"Where is Microsoft based?" -> "Microsoft"
"Tell me about Apple's location" -> "Apple"`
          }]
        }]
      });

      return response.text?.trim() || null;
    } catch (error) {
      console.error("Error extracting company name:", error);
      return null;
    }
  }

  async generateResponse(message: string, mcpData?: any): Promise<string> {
    let promptText = message;
    
    if (mcpData && !mcpData.error) {
      promptText = `User question: ${message}

Based on the following data:
${JSON.stringify(mcpData, null, 2)}

Please provide a helpful response incorporating this data.`;
    }

    try {
      const response = await this.model.doGenerate({
        inputFormat: "messages",
        mode: { type: "regular" },
        prompt: [{
          role: "user",
          content: [{ type: "text", text: promptText }]
        }]
      });

      return response.text || "No response generated";
    } catch (error) {
      console.error("Error generating response:", error);
      return "Sorry, I encountered an error while generating a response.";
    }
  }
}
