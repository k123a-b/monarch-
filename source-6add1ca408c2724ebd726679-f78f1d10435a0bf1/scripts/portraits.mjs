import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { catalog } from "../shared/catalog.mjs";
const ai = new GoogleGenAI({
  apiKey: process.env.NETLIFY_AI_GATEWAY_KEY,
  httpOptions: {
    baseUrl: process.env.NETLIFY_AI_GATEWAY_URL?.replace(/\/$/, ""),
  },
});
const list = catalog.filter((c) => c.set === "brainrot");
const mapping = {};
await mkdir("public/img/portraits", { recursive: true });
await Promise.all(
  [0, 1, 2].map(async (batch) => {
    const cards = list.slice(batch * 25, (batch + 1) * 25);
    if (!cards.length) return;
    const rows = Math.ceil(cards.length / 5);
    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: `A contact sheet containing exactly 5 columns and ${rows} rows of individual Italian brainrot meme character portraits in equal-sized square cells. NO borders, NO spacing, NO text, NO labels, NO typography. Each portrait is a detailed whimsical 3D rendered Italian brainrot character in a royal fantasy setting, dramatic lighting, colorful, expressive, dark textured background. Characters in reading order (left to right, top to bottom): ${cards.map((c, i) => `${i + 1}: ${c.name}, emblem ${c.emoji}${c.name === "Tralalero Tralala" ? ", the famous blue shark with blue sneakers" : c.name === "Tung Tung Tung Sahur" ? ", the famous wooden humanoid log with large eyes and a bat" : c.name === "Bombardiro Crocodilo" ? ", the famous crocodile bomber airplane hybrid" : c.name === "Lirilì Larilà" ? ", cactus elephant wearing sandals" : c.name === "Brr Brr Patapim" ? ", furry forest monkey with tree roots" : c.name === "Cappuccino Assassino" ? ", ninja assassin espresso cup" : c.name === "Ballerina Cappuccina" ? ", ballerina in a pink tutu with a cappuccino cup head" : ""}`).join("; ")}. Fill any remaining cells with decorative golden crowns. Equal rectangular grid cells, every cell filled edge to edge with its character portrait.`,
      });
      const part = result.candidates?.[0]?.content?.parts?.find(
        (p) => p.inlineData,
      );
      if (!part) return;
      const buffer = Buffer.from(part.inlineData.data, "base64");
      const meta = await sharp(buffer).metadata();
      const w = Math.floor(meta.width / 5),
        h = Math.floor(meta.height / rows);
      for (let i = 0; i < cards.length; i++) {
        const file = `/img/portraits/${cards[i].id}.webp`;
        await sharp(buffer)
          .extract({
            left: (i % 5) * w,
            top: Math.floor(i / 5) * h,
            width: w,
            height: h,
          })
          .resize(400, 400, { fit: "cover" })
          .webp({ quality: 85 })
          .toFile("public" + file);
        mapping[cards[i].id] = file;
      }
      console.log(`Saved ${cards.length} meme portraits`);
    } catch {
      console.log(`Portrait sheet ${batch + 1} unavailable`);
    }
  }),
);
await writeFile("shared/portraits.json", JSON.stringify(mapping, null, 2));
