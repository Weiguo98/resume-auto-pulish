import puppeteer, { type Browser } from "puppeteer-core";
import { config } from "./config.ts";

let browser: Promise<Browser> | null = null;

// ponytail: one shared Chrome for all requests; move PDF rendering to its own worker if it starts to slow down the API.
function chrome(): Promise<Browser> {
  if (!browser) {
    browser = puppeteer
      .launch({ executablePath: config.chromePath, args: ["--no-sandbox", "--disable-dev-shm-usage"], handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false })
      .catch((err) => {
        browser = null;
        throw err;
      });
    for (const signal of ["SIGINT", "SIGTERM"] as const) {
      process.once(signal, () => browser?.then((b) => b.close()).finally(() => process.exit(0)));
    }
  }
  return browser;
}

export async function htmlToPdf(html: string): Promise<Uint8Array<ArrayBuffer>> {
  const page = await (await chrome()).newPage();
  try {
    page.setDefaultTimeout(20_000);
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    return new Uint8Array(await page.pdf({ format: "A4", printBackground: true, margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" } }));
  } finally {
    await page.close();
  }
}
