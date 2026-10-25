import { writeFile } from "node:fs/promises";

const endpoint =
  "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2024&per_page=400";
const response = await fetch(endpoint, {
  signal: AbortSignal.timeout(30000),
});
if (!response.ok)
  throw new Error(`World Bank GDP request failed: ${response.status}`);

const [metadata, rows] = await response.json();
if (!Array.isArray(rows))
  throw new Error("World Bank GDP response did not contain country data");

const countries = Object.fromEntries(
  rows
    .filter(
      (row) =>
        row.value !== null &&
        row.country?.region?.value !== "Aggregates" &&
        /^[A-Z]{2}$/.test(row.country?.id || ""),
    )
    .map((row) => [row.country.id.toLowerCase(), row.value]),
);

await writeFile(
  new URL("../shared/country-gdp.json", import.meta.url),
  JSON.stringify(
    {
      source: endpoint,
      indicator: "GDP (current US$)",
      year: 2024,
      retrieved: metadata.lastupdated,
      countries,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Saved GDP ratings for ${Object.keys(countries).length} countries.`,
);
