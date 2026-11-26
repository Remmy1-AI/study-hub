import { readFileSync } from "node:fs";
import { ImageResponse } from "@vercel/og";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";

export const WIDTH = 1200;
export const HEIGHT = 630;

const C = {
  paper: "#F3F0E6",
  card: "#FFFCF4",
  red: "#7A1F1F",
  redSoft: "#EEDFDF",
  ochre: "#C9A227",
  ink: "#1A1A1A",
  muted: "#5C5656",
};

const asset = (p) => readFileSync(new URL(p, import.meta.url));

let cache;
function assets() {
  if (cache) return cache;
  const art = asset("./assets/art.svg").toString("base64");
  const cutout = asset("./assets/yeboah-cutout.png").toString("base64");
  cache = {
    art: `data:image/svg+xml;base64,${art}`,
    cutout: `data:image/png;base64,${cutout}`,
    fonts: [
      { name: "Libre Baskerville", data: asset("./fonts/LibreBaskerville-Bold.ttf"), weight: 700, style: "normal" },
      { name: "Libre Baskerville", data: asset("./fonts/LibreBaskerville-Regular.ttf"), weight: 400, style: "normal" },
      { name: "DM Sans", data: asset("./fonts/DMSans-Regular.ttf"), weight: 400, style: "normal" },
      { name: "DM Sans", data: asset("./fonts/DMSans-Medium.ttf"), weight: 500, style: "normal" },
      { name: "DM Sans", data: asset("./fonts/DMSans-Bold.ttf"), weight: 700, style: "normal" },
    ],
  };
  return cache;
}

function h(type, style, ...children) {
  const kids = children.flat().filter((c) => c !== null && c !== undefined && c !== false);
  const props = { style: { display: "flex", ...style } };
  if (kids.length === 1) props.children = kids[0];
  else if (kids.length > 1) props.children = kids;
  return { type, props };
}

function img(src, width, height, style) {
  return { type: "img", props: { src, width, height, style } };
}

const PANEL = 540;

function leftPanel(a) {
  const photoH = 548;
  const photoW = Math.round((371 / 532) * photoH);
  return h(
    "div",
    { width: PANEL, height: HEIGHT, position: "relative", background: C.paper, overflow: "hidden" },
    img(a.art, PANEL, HEIGHT, { position: "absolute", left: 0, top: 0 }),
    h("div", {
      position: "absolute",
      left: (PANEL - 400) / 2,
      top: 150,
      width: 400,
      height: 400,
      borderRadius: 200,
      background: C.redSoft,
    }),
    img(a.cutout, photoW, photoH, {
      position: "absolute",
      left: Math.round((PANEL - photoW) / 2),
      bottom: 0,
    }),
  );
}

function divider() {
  return h("div", { width: 2, height: 470, marginTop: 80, background: "rgba(122,31,31,0.22)" });
}

function frame(right) {
  const a = assets();
  return h(
    "div",
    { width: WIDTH, height: HEIGHT, background: C.card, fontFamily: "DM Sans" },
    leftPanel(a),
    divider(),
    right,
  );
}

function clip(s, max) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

export function homeCard() {
  const right = h(
    "div",
    {
      flex: 1,
      position: "relative",
      flexDirection: "column",
      justifyContent: "center",
      paddingLeft: 64,
      paddingRight: 40,
    },
    h(
      "div",
      { flexDirection: "column", alignSelf: "flex-start" },
      h(
        "div",
        { fontFamily: "Libre Baskerville", fontWeight: 700, fontSize: 88, color: C.ink, lineHeight: 1.1, whiteSpace: "nowrap" },
        "Mr. Yeboah",
      ),
      h("div", { height: 8, marginTop: 14, background: C.ochre, borderRadius: 4 }),
    ),
    h(
      "div",
      { marginTop: 30, fontSize: 38, fontWeight: 500, color: C.muted, letterSpacing: 1 },
      "Docket · UMAT Study",
    ),
    h(
      "div",
      { position: "absolute", right: 48, bottom: 40, fontSize: 24, fontWeight: 500, color: C.muted, letterSpacing: 1 },
      "mryeboah.study",
    ),
  );
  return frame(right);
}

export function materialCard({ typeLabel, code, title }) {
  const bigText = code || clip(title, 44);
  const sub = code ? clip(title, 74) : "";
  const bigSize = code ? (code.length > 9 ? 78 : code.length > 6 ? 96 : 118) : bigText.length > 28 ? 52 : 64;
  const ghost = code
    ? h(
        "div",
        {
          position: "absolute",
          left: 24,
          top: 130,
          fontFamily: "Libre Baskerville",
          fontWeight: 700,
          fontSize: Math.max(90, Math.min(250, Math.floor(640 / (code.length * 0.62)))),
          color: "rgba(122,31,31,0.065)",
          whiteSpace: "nowrap",
        },
        code,
      )
    : null;

  const right = h(
    "div",
    { flex: 1, position: "relative", flexDirection: "column", paddingLeft: 64, paddingRight: 48, overflow: "hidden" },
    ghost,
    h(
      "div",
      { flexDirection: "column", marginTop: 150 },
      h("div", { fontSize: 26, fontWeight: 700, letterSpacing: 5, color: C.red }, typeLabel.toUpperCase()),
      h("div", { width: 72, height: 5, marginTop: 14, background: C.ochre, borderRadius: 3 }),
    ),
    h(
      "div",
      {
        marginTop: 26,
        fontFamily: "Libre Baskerville",
        fontWeight: 700,
        fontSize: bigSize,
        lineHeight: 1.12,
        color: C.ink,
        maxWidth: 560,
      },
      bigText,
    ),
    sub
      ? h("div", { marginTop: 18, fontSize: 34, fontWeight: 400, lineHeight: 1.3, color: C.muted, maxWidth: 560 }, sub)
      : null,
    h(
      "div",
      { position: "absolute", left: 64, bottom: 44, fontSize: 30, fontWeight: 700, color: C.red, letterSpacing: 0.5 },
      "Docket by Mr. Yeboah",
    ),
  );
  return frame(right);
}

export async function renderPng(element) {
  const res = new ImageResponse(element, { width: WIDTH, height: HEIGHT, fonts: assets().fonts });
  return Buffer.from(await res.arrayBuffer());
}

// JPEG keeps the card well under WhatsApp's ~300 KB preview limit.
export async function renderJpeg(element, quality = 90) {
  const { data, width, height } = PNG.sync.read(await renderPng(element));
  return jpeg.encode({ data, width, height }, quality).data;
}
