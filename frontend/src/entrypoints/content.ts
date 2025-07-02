interface ProductData {
  title: string;
  price: string;
  rating: string;
  reviewCount: string;
  deliveringTo: string;
  packageVolume?: string;
  packageWeight?: string;
  productVolume?: string;
  productWeight?: string;
  shipsFrom?: string;
  soldBy?: string;
  deliveryDate?: string;
}

let cachedProductData: ProductData | null = null;
const productDataPromise: Promise<ProductData> = collectProductData()
  .then((data) => {
    cachedProductData = data;
    return data;
  })
  .catch((_) => {
    return {
      title: "",
      price: "",
      rating: "",
      reviewCount: "",
      deliveringTo: "",
      packageVolume: "",
      packageWeight: "",
      productVolume: "",
      productWeight: "",
      shipsFrom: "",
      soldBy: "",
      deliveryDate: ""
    };
  });

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

async function getTitle(): Promise<string> {
  const titleEl = document.getElementById("productTitle");
  const titleText = titleEl?.textContent?.trim() ?? "";
  
  // Add debugging
  console.log("Original title:", titleText);
  console.log("Sending message to background script...");
  
  try {
    const trimmedTitle = await new Promise<string>((resolve, reject) => {
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.log("Message timeout - using original title");
        resolve(titleText);
      }, 5000); // 5 second timeout
      
      chrome.runtime.sendMessage(
        {
          type: "TRIM_TITLE_WITH_OPENAI",
          title: titleText,
        },
        (response) => {
          clearTimeout(timeout);
          
          // Check for chrome runtime errors
          if (chrome.runtime.lastError) {
            console.error("Chrome runtime error:", chrome.runtime.lastError);
            resolve(titleText); // fallback instead of reject
            return;
          }
          
          console.log("Received response:", response);
          
          if (response && response.trimmedTitle) {
            resolve(response.trimmedTitle);
          } else {
            console.log("No trimmed title in response, using original");
            resolve(titleText);
          }
        }
      );
    });
    
    console.log("Final trimmed title:", trimmedTitle);
    return trimmedTitle;
  } catch (error) {
    console.error("Error in getTitle:", error);
    return titleText; // fallback
  }
}

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

function getRating(): string {
  // Try common selectors for Amazon rating
  const ratingSelectors = [
    "span[data-asin][data-attr='averageRating']",
    "span[data-asin][data-attr='starRating']",
    "span.a-icon-alt",
    "#acrPopover .a-icon-alt"
  ];
  for (const sel of ratingSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent) {
      // Usually like "4.5 out of 5 stars"
      const match = el.textContent.match(/([\d.]+)\s*out of\s*5/);
      if (match) return match[1];
      return el.textContent.trim();
    }
  }
  return "";
}

function getReviewCount(): string {
  // Try common selectors for Amazon review count
  const reviewSelectors = [
    "#acrCustomerReviewText",
    "#acrCustomerWriteReviewText",
    "span[data-asin][data-attr='reviewCount']",
    "#reviewSummary .a-size-base"
  ];
  for (const sel of reviewSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent) {
      // Usually like "1,234 ratings"
      const match = el.textContent.replace(/[^\d,]/g, "").replace(/,/g, "");
      if (match) return match;
      return el.textContent.trim();
    }
  }
  return "";
}

function getDeliveringTo(): string {
  // Try to get the "Deliver to" location
  const deliverSelectors = [
    "#contextualIngressPtLabel_deliveryShortLine",
    "#contextualIngressPtLabel",
    "#glow-ingress-line2",
    "#deliveryMessageMirId"
  ];
  for (const sel of deliverSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent) {
      return el.textContent.trim();
    }
  }
  return "";
}

function getVolume(): string {
  const tableSelectors = [
    "#productDetails_techSpec_section_1 tr",
    "#productDetails_detailBullets_sections1 tr",
    ".prodDetTable tr"
  ];
  for (const selector of tableSelectors) {
    const rows = document.querySelectorAll(selector);
    for (const row of Array.from(rows)) {
      const th = row.querySelector("th");
      if (th && /package\s*dimensions/i.test(th.textContent || "")) {
        const td = row.querySelector("td");
        if (td) return td.textContent?.trim().replace(/\u00A0/g, " ") || "";
      }
    }
  }

  const bulletLis = document.querySelectorAll<HTMLLIElement>(
    "#detailBullets_feature_div li"
  );
  for (const li of Array.from(bulletLis)) {
    const labelSpan = li.querySelector<HTMLSpanElement>("span.a-text-bold");
    if (labelSpan && /package\s*dimensions/i.test(labelSpan.textContent || "")) {
      const valueSpan = li.querySelector<HTMLSpanElement>("span.a-text:not(.a-text-bold)");
      if (valueSpan && valueSpan.textContent) {
        return valueSpan.textContent.trim().replace(/^[:\s]+/, "").replace(/\u00A0/g, " ");
      }
    }
  }

  const infoSection = document.getElementById("prodDetails");
  if (infoSection) {
    const regex = /package\s*dimensions\s*[:\-]?\s*([^\n;]+)/i;
    const match = infoSection.innerText.match(regex);
    if (match && match[1]) {
      return match[1].trim().replace(/\u00A0/g, " ");
    }
  }

  // New layout (e.g., responsive view)
  const detailDivs = document.querySelectorAll("#prodDetails .a-section");
  for (const div of detailDivs) {
    if (/package\s*dimensions/i.test(div.textContent || "")) {
      const match = div.textContent?.match(/package\s*dimensions\s*[:\-]?\s*([^\n]+)/i);
      if (match && match[1]) return match[1].trim().replace(/\u00A0/g, " ");
    }
  }

  const bodyText = document.body.innerText;
  const regex = /package\s*dimensions\s*[:\-]?\s*([^\n;]+)/i;
  const match = bodyText.match(regex);
  if (match && match[1]) {
    return match[1].trim().replace(/\u00A0/g, " ");
  }

  return "Not Found";
}

function getProductVolume(): string {
  // Try to find "Product Dimensions" in tables or bullets
  const tableSelectors = [
    "#productDetails_techSpec_section_1 tr",
    "#productDetails_detailBullets_sections1 tr",
    ".prodDetTable tr"
  ];
  for (const selector of tableSelectors) {
    const rows = document.querySelectorAll(selector);
    for (const row of Array.from(rows)) {
      const th = row.querySelector("th");
      if (th && /product\s*dimensions/i.test(th.textContent || "")) {
        const td = row.querySelector("td");
        if (td) return td.textContent?.trim().replace(/\u00A0/g, " ") || "";
      }
    }
  }

  const bulletLis = document.querySelectorAll<HTMLLIElement>(
    "#detailBullets_feature_div li"
  );
  for (const li of Array.from(bulletLis)) {
    const labelSpan = li.querySelector<HTMLSpanElement>("span.a-text-bold");
    if (labelSpan && /product\s*dimensions/i.test(labelSpan.textContent || "")) {
      const valueSpan = li.querySelector<HTMLSpanElement>("span.a-text:not(.a-text-bold)");
      if (valueSpan && valueSpan.textContent) {
        return valueSpan.textContent.trim().replace(/^[:\s]+/, "").replace(/\u00A0/g, " ");
      }
    }
  }

  const infoSection = document.getElementById("prodDetails");
  if (infoSection) {
    const regex = /product\s*dimensions\s*[:\-]?\s*([^\n;]+)/i;
    const match = infoSection.innerText.match(regex);
    if (match && match[1]) {
      return match[1].trim().replace(/\u00A0/g, " ");
    }
  }

  // New layout (e.g., responsive view)
  const detailDivs = document.querySelectorAll("#prodDetails .a-section");
  for (const div of detailDivs) {
    if (/product\s*dimensions/i.test(div.textContent || "")) {
      const match = div.textContent?.match(/product\s*dimensions\s*[:\-]?\s*([^\n]+)/i);
      if (match && match[1]) return match[1].trim().replace(/\u00A0/g, " ");
    }
  }

  const bodyText = document.body.innerText;
  const regex = /product\s*dimensions\s*[:\-]?\s*([^\n;]+)/i;
  const match = bodyText.match(regex);
  if (match && match[1]) {
    return match[1].trim().replace(/\u00A0/g, " ");
  }

  return "";
}

function getWeight(): string {
  const rows = Array.from(document.querySelectorAll("#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr"));
  for (const row of rows) {
    const th = row.querySelector("th");
    if (th && /package\s*weight/i.test(th.textContent || "")) {
      const td = row.querySelector("td");
      if (td) return td.textContent?.trim().replace(/\u00A0/g, " ") || "";
    }
  }

  const bodyText = document.body.innerText;

  const match1 = bodyText.match(/package\s*weight\s*[:\-]?\s*([^\n;]+)/i);
  if (match1 && match1[1]) return match1[1].trim().replace(/\u00A0/g, " ");

  // Fallback: check for "Shipping Weight"
  const match2 = bodyText.match(/shipping\s*weight\s*[:\-]?\s*([^\n;]+)/i);
  if (match2 && match2[1]) return match2[1].trim().replace(/\u00A0/g, " ");

  return "Not Found";
}

function getProductWeight(): string {
  // Try to find "Item Weight" in tables or bullets
  const tableSelectors = [
    "#productDetails_techSpec_section_1 tr",
    "#productDetails_detailBullets_sections1 tr",
    ".prodDetTable tr"
  ];
  for (const selector of tableSelectors) {
    const rows = document.querySelectorAll(selector);
    for (const row of Array.from(rows)) {
      const th = row.querySelector("th");
      if (th && /item\s*weight/i.test(th.textContent || "")) {
        const td = row.querySelector("td");
        if (td) return td.textContent?.trim().replace(/\u00A0/g, " ") || "";
      }
    }
  }

  const bulletLis = document.querySelectorAll<HTMLLIElement>(
    "#detailBullets_feature_div li"
  );
  for (const li of Array.from(bulletLis)) {
    const labelSpan = li.querySelector<HTMLSpanElement>("span.a-text-bold");
    if (labelSpan && /item\s*weight/i.test(labelSpan.textContent || "")) {
      const valueSpan = li.querySelector<HTMLSpanElement>("span.a-text:not(.a-text-bold)");
      if (valueSpan && valueSpan.textContent) {
        return valueSpan.textContent.trim().replace(/^[:\s]+/, "").replace(/\u00A0/g, " ");
      }
    }
  }

  const bodyText = document.body.innerText;
  const regex = /item\s*weight\s*[:\-]?\s*([^\n;]+)/i;
  const match = bodyText.match(regex);
  if (match && match[1]) {
    return match[1].trim().replace(/\u00A0/g, " ");
  }

  return "";
}

function getShipsFrom(): string {
  // Try to find "Ships from" in buybox or bullets
  const shipsFromSelectors = [
    "#tabular-buybox-truncate-1 span.tabular-buybox-text",
    "#shipsFromSoldBy_feature_div .tabular-buybox-text",
    "#merchant-info"
  ];
  for (const sel of shipsFromSelectors) {
    const el = document.querySelector(sel);
    if (el && /ships from/i.test(el.textContent || "")) {
      return (el.textContent ?? "").replace(/Ships from:/i, "").trim();
    }
  }

  // Try in detail bullets
  const bulletLis = document.querySelectorAll<HTMLLIElement>(
    "#detailBullets_feature_div li"
  );
  for (const li of Array.from(bulletLis)) {
    if (/ships from/i.test(li.textContent || "")) {
      return (li.textContent ?? "").replace(/Ships from:/i, "").trim();
    }
  }

  return "";
}

function getSoldBy(): string {
  // Try to find "Sold by" in buybox or bullets
  const soldBySelectors = [
    "#tabular-buybox-truncate-2 span.tabular-buybox-text",
    "#shipsFromSoldBy_feature_div .tabular-buybox-text",
    "#merchant-info"
  ];
  for (const sel of soldBySelectors) {
    const el = document.querySelector(sel);
    if (el && /sold by/i.test(el.textContent || "")) {
      return (el.textContent ?? "").replace(/Sold by:/i, "").trim();
    }
  }

  // Try in detail bullets
  const bulletLis = document.querySelectorAll<HTMLLIElement>(
    "#detailBullets_feature_div li"
  );
  for (const li of Array.from(bulletLis)) {
    if (/sold by/i.test(li.textContent || "")) {
      return (li.textContent ?? "").replace(/Sold by:/i, "").trim();
    }
  }

  return "";
}

function getDeliveryDate(): string {
  // Try to find delivery date in buybox or shipping message
  const deliverySelectors = [
    "#deliveryMessageMirId span.a-text-bold",
    "#deliveryMessageMirId",
    "#ddmDeliveryMessage",
    "#mir-layout-DELIVERY_BLOCK span"
  ];
  const dateRegex = /\b(?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)[\s,.-]+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s.,-]*(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*\d{4})?/i;
  for (const sel of deliverySelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent) {
      const match = el.textContent.match(dateRegex);
      if (match) return match[0].trim();
    }
  }
  return "";
}

async function collectProductData(): Promise<ProductData> {
  await waitForElement("#productTitle", 3000);
  const title = await getTitle();
  const price = getPrice();
  const rating = getRating();
  const reviewCount = getReviewCount();
  const deliveringTo = getDeliveringTo();
  const packageVolume = getVolume();
  const packageWeight = getWeight();
  const productVolume = getProductVolume();
  const productWeight = getProductWeight();
  const shipsFrom = getShipsFrom();
  const soldBy = getSoldBy();
  const deliveryDate = getDeliveryDate();
  return {
    title,
    price,
    rating,
    reviewCount,
    deliveringTo,
    packageVolume,
    packageWeight,
    productVolume,
    productWeight,
    shipsFrom,
    soldBy,
    deliveryDate
  };
}

export default defineContentScript({
  matches: [
    "*://*.amazon.com/*",
    "*://*.amazon.co.uk/*",
    "*://*.amazon.ca/*",
    "*://*.amazon.de/*",
    "*://*.amazon.fr/*",
    "*://*.amazon.it/*",
    "*://*.amazon.es/*",
    "*://*.amazon.co.jp/*",
    "*://*.amazon.in/*"
  ],

  async main() {
    if (
      window.location.hostname.includes("amazon.") &&
      (window.location.pathname.includes("/dp/") || window.location.pathname.includes("/gp/"))
    ) {
      chrome.runtime.sendMessage({ type: "OPEN_POPUP" });
    }

    chrome.runtime.onMessage.addListener(
      (
        message: { type: string },
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: { productData: ProductData | null }) => void
      ) => {
        if (message.type === "GET_AMAZON_PRODUCT_DATA") {
          if (cachedProductData) {
            sendResponse({ productData: cachedProductData });
          } else {
            productDataPromise.then((data) => {
              sendResponse({ productData: data });
            });
          }
          return true;
        }
      }
    );
  },
});