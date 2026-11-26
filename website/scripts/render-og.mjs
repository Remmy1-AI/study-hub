// Renders the OG cards to PNG files for review / the static homepage card.
//   node scripts/render-og.mjs home out.jpg
//   node scripts/render-og.mjs material out.jpg "PAST PAPER" "UM 101" "Mathematics for Engineers: 2023 Exam"
import { writeFileSync } from "node:fs";
import { homeCard, materialCard, renderJpeg } from "../api/_og/card.js";

const [kind, out, typeLabel, code, title] = process.argv.slice(2);
const el = kind === "home" ? homeCard() : materialCard({ typeLabel, code, title });
writeFileSync(out, await renderJpeg(el));
console.log("wrote", out);
