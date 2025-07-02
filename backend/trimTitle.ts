import OpenAI from "openai";
import express from "express";
import type { Request, Response } from "express";

const router = express.Router();

// Changed from "/server/trim-title" to "/api/trim-title" to match background.ts
router.post("/api/trim-title", async (req: Request, res: Response) => {
  console.log("🟢 API: Received trim-title request:", req.body);
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error("🔴 API: Missing OPENAI_API_KEY environment variable");
    return res.status(500).json({ error: "Missing API key configuration" });
  }
  
  const openai = new OpenAI({ apiKey });
  
  const { title } = req.body;
  if (!title) {
    console.error("🔴 API: Missing title in request body");
    return res.status(400).json({ error: "Missing title" });
  }
  
  try {
    console.log("🟡 API: Calling OpenAI with title:", title.substring(0, 50) + "...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that trims product titles to be concise and relevant for immediate user understanding.",
        },
        {
          role: "user",
          content: `Please trim the following product title to be concise and relevant for immediate user understanding. Keep it to around 5 words or less. It should just broadly define the product without too much detail: "${title}"`,
        },
      ],
    });
    
    const trimmedTitle = response.choices[0].message.content?.trim() ?? title;
    console.log("🟢 API: OpenAI response:", trimmedTitle);
    
    res.json({ trimmedTitle });
  } catch (error) {
    console.error("🔴 API: OpenAI error:", error);
    // Return original title as fallback
    res.json({ trimmedTitle: title });
  }
});

export default router;