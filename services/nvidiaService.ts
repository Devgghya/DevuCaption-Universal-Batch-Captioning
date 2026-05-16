import { CaptionLength } from "../types";

const NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = "meta/llama-3.2-90b-vision-instruct";

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
            throw new Error("No API Key configured. Please enter your Nvidia API Key in the settings.");
        }
        const systemPrompt = getSystemInstruction(length);
        const userPrompt = `Generate an expert ${length.toLowerCase().replace('_', ' ')} annotation for this image. Strictly follow the single-sentence rule and structural guidelines.`;

        const imageDataUrl = `data:${mimeType};base64,${base64Data}`;

        const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: NVIDIA_MODEL,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: userPrompt
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageDataUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 256,
            }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Nvidia API Error (${response.status}): ${errBody}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
            throw new Error("Invalid response format from Nvidia");
        }

        return content.trim();

    } catch (error) {
        console.error("Nvidia Annotation Error:", error);
        throw error;
    }
}
