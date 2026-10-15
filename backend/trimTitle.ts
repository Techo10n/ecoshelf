import OpenAI from "openai";
import express from "express";
import type { Request, Response } from "express";

const router = express.Router();

router.post("/api/trim-title", async (req: Request, res: Response) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY");
    return res.status(500).json({ error: "Missing API key configuration" });
  }

  const title = req.body?.title;
  if (typeof title !== "string" || !title.trim() || title.length > 500) {
    return res.status(400).json({ error: "title must be a non-empty string of at most 500 characters" });
  }

  try {
    const response = await new OpenAI({ apiKey }).chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content:
            "You turn a store's product title into a short, generic search term for finding the same kind of product elsewhere. " +
            "Answer with the search term only: about five words or fewer, no brand, no quotes.",
        },
        { role: "user", content: title },
      ],
    });
    const trimmedTitle = response.choices[0]?.message.content?.trim();
    if (!trimmedTitle) throw new Error("Empty response");
    res.json({ trimmedTitle });
  } catch (error) {
    console.error("OpenAI request failed:", error instanceof Error ? error.message : error);
    res.status(502).json({ error: "Couldn't shorten the title" });
  }
});

export default router;
