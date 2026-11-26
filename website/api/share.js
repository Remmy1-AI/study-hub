import {
  BRAND,
  PLAY_URL,
  SITE,
  cardFields,
  escapeHtml as e,
  fetchMaterial,
  parseShareId,
  shareUrl,
  typeLabel,
} from "./_og/materials.js";

const HOME_IMAGE = `${SITE}/og/home.jpg`;
const HOME_ALT = "Mr. Yeboah, Docket UMAT Study";

const CSS = `
:root{--paper:#F3F0E6;--card:#FFFCF4;--red:#7A1F1F;--deep:#4A1212;--soft:#EEDFDF;--ochre:#C9A227;--ink:#1A1A1A;--muted:#5C5656}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"DM Sans",system-ui,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
header{padding:20px 24px}
.wordmark{font-family:"Libre Baskerville",Georgia,serif;font-weight:700;font-size:20px;color:var(--ink);text-decoration:none}
main{max-width:640px;margin:0 auto;padding:24px 20px 64px}
.card{background:var(--card);border:1px solid rgba(122,31,31,.14);border-radius:20px;padding:32px 28px}
.kicker{font-size:13px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--red);margin:0}
.rule{width:44px;height:4px;border-radius:2px;background:var(--ochre);margin:12px 0 20px}
h1{font-family:"Libre Baskerville",Georgia,serif;font-size:clamp(28px,6vw,40px);line-height:1.15;margin:0 0 8px}
.sub{font-size:18px;color:var(--muted);margin:0 0 16px}
.desc{color:var(--muted);margin:0 0 20px}
.meta{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 24px;padding:0;list-style:none}
.meta li{background:var(--soft);color:var(--deep);border-radius:999px;padding:4px 12px;font-size:13px;font-weight:500}
.btns{display:flex;flex-wrap:wrap;gap:12px}
.btn{display:inline-block;border-radius:999px;padding:12px 22px;font-weight:700;text-decoration:none;font-size:15px}
.btn-primary{background:var(--red);color:var(--card)}
.btn-ghost{border:1.5px solid var(--red);color:var(--red)}
.note{margin-top:20px;font-size:14px;color:var(--muted)}
footer{text-align:center;color:var(--muted);font-size:13px;padding:0 20px 40px}
footer a{color:var(--muted)}
`;

function page({ title, ogTitle, imageType = "image/jpeg", description, canonical, image, imageAlt, noindex, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(title)}</title>
  <meta name="description" content="${e(description)}">
  ${noindex ? '<meta name="robots" content="noindex">' : ""}
  <meta name="theme-color" content="#7A1F1F">
  <link rel="canonical" href="${e(canonical)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${e(BRAND)}">
  <meta property="og:title" content="${e(ogTitle || title)}">
  <meta property="og:description" content="${e(description)}">
  <meta property="og:url" content="${e(canonical)}">
  <meta property="og:image" content="${e(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="${e(imageType)}">
  <meta property="og:image:alt" content="${e(imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${e(ogTitle || title)}">
  <meta name="twitter:description" content="${e(description)}">
  <meta name="twitter:image" content="${e(image)}">
  <meta name="twitter:image:alt" content="${e(imageAlt)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Libre+Baskerville:wght@700&display=swap" rel="stylesheet">
  <style>${CSS}</style>
</head>
<body>
  <header><a class="wordmark" href="/">Mr. Yeboah</a></header>
  <main>${body}</main>
  <footer><a href="/privacy">Privacy</a> &middot; ${e(BRAND)}</footer>
</body>
</html>`;
}

function send(res, status, html, cache) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", cache);
  res.end(html);
}

export default async function handler(req, res) {
  const url = new URL(req.url, SITE);
  const id = parseShareId(url.searchParams.get("slug"), url.searchParams.get("course"), url.searchParams.get("m"));
  const material = id ? await fetchMaterial(id) : null;

  if (!material) {
    const html = page({
      title: "Mr. Yeboah · Docket UMAT Study",
      description: "Docket by Mr. Yeboah: UMAT notes, past papers and slides. Read and study offline.",
      canonical: SITE,
      image: HOME_IMAGE,
      imageAlt: HOME_ALT,
      noindex: true,
      body: `<div class="card">
        <p class="kicker">Docket</p><div class="rule"></div>
        <h1>This link is not available</h1>
        <p class="desc">The material may have been removed or unpublished. You can still browse everything in Docket.</p>
        <div class="btns"><a class="btn btn-primary" href="${PLAY_URL}">Get Docket on Google Play</a><a class="btn btn-ghost" href="/">Visit mryeboah.study</a></div>
      </div>`,
    });
    return send(res, 200, html, "public, s-maxage=60, stale-while-revalidate=300");
  }

  const f = cardFields(material);
  const canonical = shareUrl(material);
  const v = Date.parse(material.updated_at) || 0;
  const image = `${SITE}/api/og?m=${material.id.replace(/-/g, "").slice(0, 8)}&v=${v}`;
  const label = typeLabel(material.material_type);
  const heading = f.code ? f.code : f.title;
  const title = f.code ? `${f.code} · ${f.title}` : f.title;
  const description =
    (material.description || "").trim().slice(0, 200) ||
    `${label}${f.code ? ` for ${f.code}` : ""} on Docket. Read and study offline.`;
  const chips = [label, material.level ? `Level ${material.level}` : ""]
    .filter(Boolean)
    .map((c) => `<li>${e(c)}</li>`)
    .join("");

  const html = page({
    title: `${title} | ${BRAND}`,
    ogTitle: title,
    description,
    canonical,
    image,
    imageAlt: `${label}: ${title}. ${BRAND}`,
    noindex: false,
    body: `<article class="card">
      <p class="kicker">${e(label)}</p><div class="rule"></div>
      <h1>${e(heading)}</h1>
      ${f.code ? `<p class="sub">${e(f.title)}</p>` : ""}
      ${material.description ? `<p class="desc">${e(material.description.trim().slice(0, 400))}</p>` : ""}
      <ul class="meta">${chips}</ul>
      <div class="btns"><a class="btn btn-primary" href="${PLAY_URL}">Open in Docket</a><a class="btn btn-ghost" href="/">Visit mryeboah.study</a></div>
      <p class="note">Docket is a free Android app with UMAT notes, past papers and slides you can read offline.</p>
    </article>`,
  });
  return send(res, 200, html, "public, s-maxage=300, stale-while-revalidate=86400");
}
