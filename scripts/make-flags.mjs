// Makes the waving provincial flag icons in src/ui/flags/ from the flat public-domain SVGs in assets/flags/source/.
// Each flag is drawn in a headless browser, then warped with a sine wave and shaded so it looks like cloth,
// in the style of emoji flags. Run after changing a source flag or the style below:  node scripts/make-flags.mjs
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const SRC = path.join(root, "assets/flags/source"),
  OUT = path.join(root, "src/ui/flags");
const STYLE = {
  width: 72,
  height: 54, // output PNG (displayed at half size or smaller for sharp edges on high-DPI screens)
  flagAspect: 3 / 2, // every flag is fitted to the same shape, as emoji flags are
  amplitude: 0.055, // wave height as a share of the flag height
  waves: 0.85, // wave cycles across the flag
  shade: 0.16, // light and shadow across the folds
  radius: 0.07, // corner rounding as a share of the flag height
  outline: "rgba(0,0,0,0.28)", // thin edge so white flags stand out on light backgrounds
  supersample: 4,
};

const browser = await chromium.launch();
const page = await browser.newPage();
fs.mkdirSync(OUT, { recursive: true });
for (const file of fs
  .readdirSync(SRC)
  .filter(f => f.endsWith(".svg"))
  .sort()) {
  const svg = fs.readFileSync(path.join(SRC, file), "utf8");
  const png = await page.evaluate(
    async ({ svg, S }) => {
      const img = new Image();
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
      await img.decode();
      const k = S.supersample,
        W = S.width * k,
        H = S.height * k;
      // Flag area inside the canvas, leaving room for the wave
      const amp = S.amplitude * H;
      const fh = H - 2 * amp - 2 * k,
        fw = Math.min(W - 4 * k, fh * S.flagAspect);
      const x0 = (W - fw) / 2,
        y0 = amp + k;
      // Flat flag at full working size
      const src = document.createElement("canvas");
      src.width = Math.round(fw);
      src.height = Math.round(fh);
      const sc = src.getContext("2d");
      sc.imageSmoothingQuality = "high";
      sc.drawImage(img, 0, 0, src.width, src.height);
      const sd = sc.getImageData(0, 0, src.width, src.height).data;
      const out = document.createElement("canvas");
      out.width = W;
      out.height = H;
      const oc = out.getContext("2d"),
        od = oc.createImageData(W, H);
      const r = S.radius * fh,
        edge = 1.6 * k;
      const phase = 0.35,
        w = 2 * Math.PI * S.waves;
      for (let x = 0; x < W; x++) {
        const u = (x - x0) / fw;
        if (u < 0 || u > 1) continue;
        // The wave grows away from the hoist (the pole side), like cloth fixed at one edge
        const grow = 0.45 + 0.55 * u;
        const dy = amp * Math.sin(w * u + phase) * grow;
        const light = 1 + S.shade * Math.cos(w * u + phase) * grow;
        for (let y = 0; y < H; y++) {
          const fy = y - y0 - dy;
          if (fy < 0 || fy >= fh) continue;
          const fx = u * fw;
          // Rounded corners
          const cx = Math.max(r - fx, 0, fx - (fw - r)),
            cy = Math.max(r - fy, 0, fy - (fh - r));
          if (cx * cx + cy * cy > r * r) continue;
          const si =
            (Math.min(src.height - 1, Math.floor(fy)) * src.width + Math.min(src.width - 1, Math.floor(fx))) * 4;
          const o = (y * W + x) * 4;
          let R = sd[si] * light,
            G = sd[si + 1] * light,
            B = sd[si + 2] * light;
          // Thin outline along the edge
          const d = Math.min(fx, fw - fx, fy, fh - fy, r - Math.hypot(cx, cy) + (cx || cy ? 0 : r));
          if (d < edge) {
            R *= 0.72;
            G *= 0.72;
            B *= 0.72;
          }
          od.data[o] = Math.min(255, R);
          od.data[o + 1] = Math.min(255, G);
          od.data[o + 2] = Math.min(255, B);
          od.data[o + 3] = sd[si + 3];
        }
      }
      oc.putImageData(od, 0, 0);
      // Downsample for smooth edges
      const fin = document.createElement("canvas");
      fin.width = S.width;
      fin.height = S.height;
      const fc = fin.getContext("2d");
      fc.imageSmoothingQuality = "high";
      fc.drawImage(out, 0, 0, S.width, S.height);
      return fin.toDataURL("image/png");
    },
    { svg, S: STYLE },
  );
  const name = file.replace(".svg", ".png");
  fs.writeFileSync(path.join(OUT, name), Buffer.from(png.split(",")[1], "base64"));
  console.log(name);
}
await browser.close();
