import { mkdir, writeFile } from "node:fs/promises";
import { catalog } from "../shared/catalog.mjs";

const output = new URL("../public/img/flags/", import.meta.url);
await mkdir(output, { recursive: true });

const cards = catalog.filter((card) => card.role === "National flag");
for (const card of cards) {
  const code = [...card.flag]
    .map((character) =>
      String.fromCharCode(character.codePointAt(0) - 0x1f1e6 + 97),
    )
    .join("");
  if (!/^[a-z]{2}$/.test(code))
    throw new Error(`Could not determine a flag code for ${card.country}`);

  const response = await fetch(`https://flagcdn.com/w320/${code}.png`, {
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new Error(
      `Could not download ${card.country}'s flag: ${response.status}`,
    );
  const image = Buffer.from(await response.arrayBuffer());
  if (!response.headers.get("content-type")?.startsWith("image/png"))
    throw new Error(`Flag source returned a non-PNG image for ${card.country}`);
  await writeFile(new URL(`${code}.png`, output), image);
}

console.log(`Saved ${cards.length} country flag images to public/img/flags.`);
