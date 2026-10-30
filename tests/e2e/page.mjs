// Shared helper for opening the built page in a browser: used by every e2e check and by reviewers' screenshots.
//
//   import { chromium } from "playwright";
//   import { openPage, settle } from "./tests/e2e/page.mjs";
//   const browser = await chromium.launch();
//   const { page, close } = await openPage(browser, { width: 375, colorScheme: "dark" });
//   await page.click("#add-partner");
//   await settle(page); // after every interaction, before reading the page or taking a screenshot
//   await page.screenshot({ path: "375-dark.png", fullPage: true });
//   await close();
//
// The page is served from a fake origin (PAGE_URL) by request interception, so nothing touches the disk or a local
// server, and every other request the page makes is seen here. Requests to ALLOWED_HOSTS go out to the network;
// anything else is aborted and recorded in `blocked` (the single-file check fails on it).
//
// The page loads its fonts from Google Fonts, and text measures differently until they arrive, so the helper waits
// for document.fonts.ready after loading and `settle` waits again after each interaction. `fontsLoaded` says
// whether the web fonts actually arrived (false when offline: the page then renders in fallback fonts).
import fs from "node:fs";

export const BUILT_HTML = fs.readFileSync(new URL("../../dist/index.html", import.meta.url), "utf8");
export const PAGE_URL = "https://page.test/";

// External hosts the page may load from. Only Google Fonts, for the two web fonts; #44 would inline them, and then
// this list should become empty.
export const ALLOWED_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

/**
 * Opens `html` (the built page by default) in a new browser context with the given viewport width and colour
 * scheme, reduced motion, and empty storage, and waits until its fonts have loaded.
 * @param {import("playwright").Browser} browser
 * @param {{ width: number, height?: number, colorScheme?: "light" | "dark", html?: string }} options
 */
export async function openPage(browser, { width, height = 1000, colorScheme = "light", html = BUILT_HTML }) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme, reducedMotion: "reduce" });
  const errors = [];
  const blocked = [];
  await context.route("**/*", route => {
    const url = route.request().url();
    if (url === PAGE_URL) return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
    if (ALLOWED_HOSTS.includes(new URL(url).hostname)) return route.continue();
    blocked.push(url);
    return route.abort("blockedbyclient");
  });
  const page = await context.newPage();
  page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(() => localStorage.clear());
  await page.goto(PAGE_URL);
  await settle(page);
  const fontsLoaded = await page.evaluate(() => [...document.fonts].some(f => f.status === "loaded"));
  return { page, errors, blocked, fontsLoaded, close: () => context.close() };
}

/** Waits for the page to finish re-rendering and for any fonts the new text needs (call after each interaction). */
export async function settle(page) {
  await page.waitForTimeout(50);
  await page.evaluate(async () => {
    document.body.getBoundingClientRect(); // force layout, so font loads for new text have started
    await document.fonts.ready;
  });
}
