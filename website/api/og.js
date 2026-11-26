import { materialCard, renderJpeg } from "./_og/card.js";
import { cardFields, fetchMaterial, parseShareId } from "./_og/materials.js";

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "https://mryeboah.study");
    const id = parseShareId(`~${url.searchParams.get("m") || ""}`);
    const material = id ? await fetchMaterial(id) : null;

    if (!material) {
      res.statusCode = 302;
      res.setHeader("Location", "/og/home.jpg");
      res.setHeader("Cache-Control", "public, s-maxage=300");
      res.end();
      return;
    }

    const png = await renderJpeg(materialCard(cardFields(material)));
    res.statusCode = 200;
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
    res.end(png);
  } catch (err) {
    console.error("og render failed", err);
    res.statusCode = 302;
    res.setHeader("Location", "/og/home.jpg");
    res.setHeader("Cache-Control", "public, s-maxage=60");
    res.end();
  }
}
