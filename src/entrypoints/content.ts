// Shape of the product data we’ll send back
interface ProductData {
  title: string;
  price: string;
  volume: string;
  weight: string;
  country?: string;
}

// 1) Module‐level cache & promise for “one‐time” scraping
let cachedProductData: ProductData | null = null;
const productDataPromise: Promise<ProductData> = collectProductData()
  .then((data) => {
    cachedProductData = data;
    return data;
  })
  .catch((_) => {
    // In case scraping fails, leave cachedProductData as null and let the listener handle it
    return { title: "", price: "", volume: "", weight: "" };
  });

// Helper: wait until an element matching `selector` appears in the DOM (or timeout)
function waitForElement(selector: string, timeout = 3000): Promise<Element | null> {
  return new Promise((resolve) => {
    const interval = 100;
    let elapsed = 0;
    const timer = window.setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(timer);
        resolve(el);
      } else if (elapsed >= timeout) {
        clearInterval(timer);
        resolve(null);
      }
      elapsed += interval;
    }, interval);
  });
}

// Extract product title from Amazon’s #productTitle
function getTitle(): string {
  const titleEl = document.getElementById("productTitle");
  return titleEl?.innerText.trim() ?? "";
}

// Improved price extraction: checks more selectors and parses numbers
function getPrice(): string {
  const priceSelectors = [
    "#priceblock_ourprice",
    "#priceblock_dealprice",
    "#priceblock_saleprice",
    ".a-price .a-offscreen",
    "[data-a-color='price'] .a-offscreen",
    ".apexPriceToPay .a-offscreen"
  ];
  for (const sel of priceSelectors) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement && el.innerText.trim()) {
      return el.innerText.trim();
    }
  }
  return "Not Found";
}

// Improved volume extraction: prioritize "Package Dimensions" over "Item Dimensions"
function getVolume(): string {
  // Try to find "Package Dimensions" in product details table
  const rows = Array.from(document.querySelectorAll("#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr"));
  for (const row of rows) {
    const th = row.querySelector("th");
    if (th && /package\s*dimensions/i.test(th.textContent || "")) {
      const td = row.querySelector("td");
      if (td) return td.textContent?.trim() || "";
    }
  }
  // Fallback: regex search for "Package Dimensions"
  const regex = /package\s*dimensions\s*[:\-]?\s*([^\n;]+)/i;
  const bodyText = document.body.innerText;
  const match = bodyText.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  // If not found, do NOT return "Item Dimensions"
  return "Not Found";
}

// Improved weight extraction: prioritize "Package Weight" over "Item Weight"
function getWeight(): string {
  const rows = Array.from(document.querySelectorAll("#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr"));
  for (const row of rows) {
    const th = row.querySelector("th");
    if (th && /package\s*weight/i.test(th.textContent || "")) {
      const td = row.querySelector("td");
      if (td) return td.textContent?.trim() || "";
    }
  }
  // Fallback: regex search for "Package Weight"
  const regex = /package\s*weight\s*[:\-]?\s*([^\n;]+)/i;
  const bodyText = document.body.innerText;
  const match = bodyText.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  // If not found, do NOT return "Item Weight"
  return "Not Found";
}

function getCountryOfOrigin(): string {
  // 1) Check the “Product details” tables first:
  //    - Desktop uses id="#productDetails_detailBullets_sections1" or "#productDetails_techSpec_section_1"
  //    - Older layouts use class=".prodDetTable"
  const tableSelectors = [
    "#productDetails_techSpec_section_1 tr",
    "#productDetails_detailBullets_sections1 tr",
    ".prodDetTable tr"
  ];
  for (const selector of tableSelectors) {
    const rows = document.querySelectorAll<HTMLTableRowElement>(selector);
    for (const row of Array.from(rows)) {
      // In these tables, the label lives in <th> or a <td class="label">, and the value is in <td>
      const headerEl = row.querySelector("th") ?? row.querySelector("td.label");
      if (headerEl && /country\s*of\s*origin/i.test(headerEl.textContent || "")) {
        // Some rows put the value in the next <td>, some wrap both label+value in the same <td>
        const valueEl =
          row.querySelector("td:not(.label)") ||
          (headerEl.nextElementSibling as HTMLElement);
        if (valueEl && valueEl.textContent) {
          return valueEl.textContent.trim();
        }
      }
    }
  }

  // 2) Next, check the “Detail Bullets” list (mobile/responsive layout):
  //    These appear under "#detailBullets_feature_div li". Each <li> contains two spans:
  //      <span class="a-text-bold">Country of Origin</span>
  //      <span class="a-text">China</span>
  const bulletLis = document.querySelectorAll<HTMLLIElement>(
    "#detailBullets_feature_div li"
  );
  for (const li of Array.from(bulletLis)) {
    const labelSpan = li.querySelector<HTMLSpanElement>("span.a-text-bold");
    if (labelSpan && /country\s*of\s*origin/i.test(labelSpan.textContent || "")) {
      // Find the text in the sibling span
      const valueSpan = li.querySelector<HTMLSpanElement>("span.a-text:not(.a-text-bold)");
      if (valueSpan && valueSpan.textContent) {
        // Some pages embed a colon in the same text node, so strip that if present:
        return valueSpan.textContent.trim().replace(/^[:\s]+/, "");
      }
    }
  }

  // 3) Fallback: do a regex search of the entire visible text for “Country of Origin : VALUE”
  const bodyText = document.body.innerText;
  const regex = /country\s*of\s*origin\s*[:\-]?\s*([^\n;]+)/i;
  const match = bodyText.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }

  return "Not Found";
}

// Update collectProductData to include country of origin
async function collectProductData(): Promise<ProductData> {
  await waitForElement("#productTitle", 3000);

  const title = getTitle();
  const price = getPrice();
  const volume = getVolume();
  const weight = getWeight();
  const country = getCountryOfOrigin();

  return { title, price, volume, weight, country };
}

// 2) The actual content script definition
export default defineContentScript({
  // Broad Amazon match: any TLD and any path
  matches: ["*://*.amazon.com/*", "*://*.amazon.co.uk/*", "*://*.amazon.ca/*", "*://*.amazon.de/*", "*://*.amazon.fr/*", "*://*.amazon.it/*", "*://*.amazon.es/*", "*://*.amazon.co.jp/*", "*://*.amazon.in/*"],

  async main() {
    // Automatically open the popup when on an Amazon product page
    if (
      window.location.hostname.includes("amazon.") &&
      (window.location.pathname.includes("/dp/") || window.location.pathname.includes("/gp/"))
    ) {
      chrome.runtime.sendMessage({ type: "OPEN_POPUP" });
    }

    // Listen for messages from popup (App.tsx)
    chrome.runtime.onMessage.addListener(
      (
        message: { type: string },
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: { productData: ProductData | null }) => void
      ) => {
        if (message.type === "GET_AMAZON_PRODUCT_DATA") {
          if (cachedProductData) {
            // If we've already scraped, return it immediately
            sendResponse({ productData: cachedProductData });
          } else {
            // If scraping is still in progress, wait for it to finish
            productDataPromise.then((data) => {
              sendResponse({ productData: data });
            });
          }
          return true; // indicate async sendResponse
        }
      }
    );
  },
});