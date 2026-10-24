import { GoogleGenAI } from "@google/genai";
import { writeFile } from "node:fs/promises";
const ai = new GoogleGenAI({
  apiKey: process.env.NETLIFY_AI_GATEWAY_KEY,
  httpOptions: {
    baseUrl: process.env.NETLIFY_AI_GATEWAY_URL?.replace(/\/$/, ""),
  },
});
const subjects = {
  brainrot:
    "A fierce yet funny blue shark wearing blue sneakers and a small golden crown, emerging from stormy ocean waves. Italian brainrot meme collectible. Blue silver palette.",
  royal:
    "A majestic ornate golden crown floating above a ruby red velvet cushion, dramatic rich burgundy and gold palette, medieval royal treasury.",
  vault:
    "An ancient ornate golden locked vault with a lion head in an emerald temple, glowing green light and gold coins, emerald and gold palette.",
  apex: "A divine bright golden royal crown surrounded by golden lightning and luminous golden shards in an obsidian palace, black and molten gold palette.",
};
await Promise.all(
  Object.entries(subjects).map(async ([name, subject]) => {
    try {
      const r = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: `Create a premium collectible trading card pack artwork, vertical 3:4 portrait composition. ${subject} Hyper-detailed cinematic 3D illustration, sophisticated dramatic lighting, high contrast, slightly gritty engraved fantasy illustration. Centered subject filling frame. Dark background. No text, no letters, no typography, no card border. Image only.`,
      });
      const p = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      if (p) {
        await writeFile(
          `public/img/${name}.png`,
          Buffer.from(p.inlineData.data, "base64"),
        );
        console.log(`Saved ${name} artwork`);
      } else console.log(`No art returned for ${name}`);
    } catch {
      console.log(`Artwork unavailable: ${name}`);
    }
  }),
);
