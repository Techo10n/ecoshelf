import { test as base, expect, chromium, type BrowserContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

// Loads the built extension (npm run build) into Chromium. Amazon is served from a saved fixture
// and the backend is mocked, so this runs offline.
const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  context: async ({}, use) => {
    const ext = path.resolve("wxt-build/chrome-mv3");
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const page = await context.newPage();
    await page.goto("chrome://extensions");
    const id = await page.evaluate(async () => (await (globalThis as any).chrome.management.getAll())[0].id);
    await page.close();
    await use(id);
  },
});

// A real popup reads the tab it was opened over. Opened as its own tab, it would read itself, so
// point "the active tab" at the most recently opened other tab instead.
async function openPopup(context: BrowserContext, extensionId: string) {
  const popup = await context.newPage();
  await popup.addInitScript(() => {
    const tabs = (globalThis as any).chrome.tabs;
    const query = tabs.query.bind(tabs);
    tabs.query = async (info: { active?: boolean }) =>
      info.active ? (await query({})).filter((t: { url?: string }) => !t.url?.startsWith("chrome-extension://")).slice(-1) : query(info);
  });
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  return popup;
}

test("shows the product's shipping details on an Amazon product page", async ({ context, extensionId }) => {
  await context.route("https://www.amazon.com/dp/B0D2P1HSCV", (route) =>
    route.fulfill({ contentType: "text/html", body: readFileSync("tests/fixtures/cutting-board.html", "utf8") }),
  );
  await context.route("http://localhost:8000/api/trim-title", (route) => route.fulfill({ json: { trimmedTitle: "bamboo cutting board set" } }));
  const amazon = await context.newPage();
  await amazon.goto("https://www.amazon.com/dp/B0D2P1HSCV");

  const popup = await openPopup(context, extensionId);
  await expect(popup.getByRole("heading", { level: 1 })).toContainText("ROYAL CRAFT WOOD Wooden Cutting Boards");
  await expect(popup.getByText("bamboo cutting board set")).toBeVisible();
  await expect(popup.locator("dl")).toContainText("Ships fromAmazon");
  await expect(popup.locator("dl")).toContainText("Sold byROYAL CRAFT WOOD");
  await expect(popup.locator("dl")).toContainText("Weight4.1 pounds");
});

test("says so when the backend can't shorten the title", async ({ context, extensionId }) => {
  await context.route("https://www.amazon.com/dp/B0BZYCJK89", (route) =>
    route.fulfill({ contentType: "text/html", body: readFileSync("tests/fixtures/owala-bottle.html", "utf8") }),
  );
  await context.route("http://localhost:8000/api/trim-title", (route) => route.fulfill({ status: 502, json: {} }));
  await (await context.newPage()).goto("https://www.amazon.com/dp/B0BZYCJK89");

  const popup = await openPopup(context, extensionId);
  await expect(popup.getByText("Search term unavailable")).toBeVisible();
});

test("asks for an Amazon product off Amazon", async ({ context, extensionId }) => {
  await context.route("https://example.com/", (route) => route.fulfill({ contentType: "text/html", body: "<h1>Hi</h1>" }));
  await (await context.newPage()).goto("https://example.com/");
  const popup = await openPopup(context, extensionId);
  await expect(popup.getByRole("heading", { name: "Open a product on Amazon" })).toBeVisible();
});

test("asks for a product page on a non-product Amazon page", async ({ context, extensionId }) => {
  await context.route("https://www.amazon.com/", (route) => route.fulfill({ contentType: "text/html", body: "<h1>Amazon</h1>" }));
  await (await context.newPage()).goto("https://www.amazon.com/");
  const popup = await openPopup(context, extensionId);
  await expect(popup.getByRole("heading", { name: "Open a product page" })).toBeVisible();
});
