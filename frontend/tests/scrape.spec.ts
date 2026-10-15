import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { scrapeProduct } from "../src/utils/scrape";

// Real Amazon product pages, saved 2026-10-15 with scripts stripped. When Amazon changes its
// layout, re-save one and see which field broke.
const scrape = async (page: import("@playwright/test").Page, fixture: string) => {
  await page.setContent(readFileSync(`tests/fixtures/${fixture}.html`, "utf8"), { waitUntil: "commit" });
  return page.evaluate(scrapeProduct);
};

test("combined Shipper / Seller, details table", async ({ page }) => {
  expect(await scrape(page, "owala-bottle")).toMatchObject({
    title: "Owala FreeSip Stainless Steel Water Bottle 24 oz Denim",
    price: "$29.99",
    rating: "4.6",
    reviewCount: "141581",
    deliveringTo: "Seattle 98109",
    deliveryDate: "Tuesday, October 20",
    shipsFrom: "Amazon.com",
    soldBy: "Amazon.com",
    dimensions: '3.24"W x 10.68"H',
    weight: "0.4 kg",
    image: expect.stringMatching(/^https:\/\/m\.media-amazon\.com\//),
  });
});

test("separate Ships from and Sold by", async ({ page }) => {
  expect(await scrape(page, "cutting-board")).toMatchObject({
    shipsFrom: "Amazon",
    soldBy: "ROYAL CRAFT WOOD",
    dimensions: '15"L x 10"W x 0.6"Th',
    weight: "4.1 pounds",
  });
});

test("produce bags", async ({ page }) => {
  expect(await scrape(page, "produce-bags")).toMatchObject({
    soldBy: "WINGRACE DECOR",
    dimensions: '10"L x 1.5"W x 9"H',
    weight: "0.2 kg",
  });
});

test("unavailable product has no price or seller", async ({ page }) => {
  expect(await scrape(page, "echo-dot-unavailable")).toMatchObject({
    title: "Echo Dot (3rd Gen, 2018 release) - Smart speaker with Alexa - Charcoal",
    price: "",
    soldBy: "",
  });
});

test("not a product page", async ({ page }) => {
  await page.setContent("<h1>Amazon</h1>");
  expect(await page.evaluate(scrapeProduct)).toBeNull();
});
