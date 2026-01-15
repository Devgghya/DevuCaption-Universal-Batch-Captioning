
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { CaptionLength } from "../types";

const getSystemInstruction = (length: CaptionLength) => {
  let lengthInstruction = "";
  
  switch (length) {
    case CaptionLength.ONE_LINE:
      lengthInstruction = "STRICTLY LIMIT to 5-8 words. Pure essence. Subject + primary action/attribute only. No fluff.";
      break;
    case CaptionLength.VERY_SHORT:
      lengthInstruction = "STRICTLY LIMIT to 10-15 words. Focus only on the core subject and its most defining feature. Minimalist approach.";
      break;
    case CaptionLength.SHORT:
      lengthInstruction = "LIMIT to 20-30 words. Describe the main subject, its primary color/texture, and the immediate environment.";
      break;
    case CaptionLength.LONG:
      lengthInstruction = "Keep between 40-60 words. Detailed description of the subject, textures, secondary objects, specific poses/actions, and atmospheric lighting.";
      break;
    case CaptionLength.VERY_LONG:
      lengthInstruction = "EXTENSIVE detail, 80-100 words. Exhaustively describe every visual element: intricate patterns, material properties, lighting sources, depth of field, and complex background details.";
      break;
  }

  return `You are a world-class image annotator for AI model training (LoRa/Stable Diffusion). Your task is to analyze the input image and generate a SINGLE, detailed, and descriptive caption line.

GUIDELINES:
1. STRUCTURE: Start with the subject, then its specific attributes (clothing, material, texture), then its pose or state, and finally the background and lighting context.
2. SCOPE: You must handle ALL image types (portraits, landscapes, objects, architecture, animals). 
3. CULTURAL EXPERTISE: If the image features Indian attire or jewelry, use precise terminology:
   - Garments: "Sherwani", "Saree", "Lehenga", "Anarkali", "Kurta", "Dhoti", "Angrakha", "Dupatta".
   - Jewelry: "Kundan", "Polki", "Maang Tikka", "Nath", "Jhumkas", "Temple jewelry".
   - Headwear: "Turban", "Pagri", "Safa".
   For all other contexts, use standard, high-quality descriptive English.
4. STYLE: Be objective and visual. Avoid subjective or flowery language (e.g., avoid "majestic", "beautiful", "stunning"). State only what is visually verifiable.
5. FORMAT: ${lengthInstruction} Output MUST be exactly one sentence.

OUTPUT FORMAT:
[Subject description] [attributes/clothing] [pose/action], [background/lighting context].`;
};

export async function annotateImage(base64Data: string, mimeType: string, length: CaptionLength, apiKey: string): Promise<string> {
  try {
    if (!apiKey) {
        throw new Error("No API Key configured. Please enter your Google Gemini API Key in the settings.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Generate an expert ${length.toLowerCase().replace('_', ' ')} annotation for this image. Strictly follow the single-sentence rule and structural guidelines.`
          }
        ]
      },
      config: {
        systemInstruction: getSystemInstruction(length),
        temperature: 0.4,
        topP: 0.9,
      }
    });

    if (!response.text) {
      throw new Error("No caption was generated.");
    }

    return response.text.trim();
  } catch (error: any) {
    // Pass along the raw error message if it exists, otherwise stringify
    const errorMessage = error.message || JSON.stringify(error);
    throw new Error(errorMessage);
  }
}
