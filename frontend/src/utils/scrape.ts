export interface ProductData {
  title: string;
  image: string;
  price: string;
  rating: string;
  reviewCount: string;
  deliveringTo: string;
  deliveryDate: string;
  shipsFrom: string;
  soldBy: string;
  dimensions: string;
  weight: string;
}

// Runs inside the Amazon tab via chrome.scripting.executeScript, which serializes the function.
// Everything it uses has to be defined inside it.
export function scrapeProduct(): ProductData | null {
  const clean = (s: string | null | undefined) =>
    (s ?? "").replace(/[\u200b-\u200f\u00a0\ufeff]/g, " ").replace(/\s+/g, " ").trim();
  const text = (selector: string) => clean(document.querySelector(selector)?.textContent);
  const first = (selectors: string[]) => {
    for (const s of selectors) {
      const value = text(s);
      if (value) return value;
    }
    return "";
  };

  const title = text("#productTitle");
  if (!title) return null;

  // Amazon's offer box: "Ships from" and "Sold by" each, or one combined "Shipper / Seller".
  const offer = (name: string) =>
    text(`.offer-display-feature-text[offer-display-feature-name="${name}"] .offer-display-feature-text-message`);
  const soldBy = offer("desktop-merchant-info") || first(["#sellerProfileTriggerId", "#merchant-info a"]);
  const shipsFrom = offer("desktop-fulfiller-info") || soldBy;

  // Product details appear as table rows or as "Label : value" bullets, depending on category.
  const details = new Map<string, string>();
  document
    .querySelectorAll("#prodDetails tr, #productDetails_feature_div tr, #detailBullets_feature_div li")
    .forEach((row) => {
      const label = row.querySelector("th, .a-text-bold");
      const value = row.querySelector("td, .a-text-bold + span");
      const key = clean(label?.textContent).replace(/\s*:$/, "").toLowerCase();
      if (key && value && !details.has(key)) details.set(key, clean(value.textContent));
    });
  // "Item Dimensions L x W x H" → the label carries the axis names, so match on prefix.
  const detail = (...labels: string[]) => {
    for (const label of labels) {
      for (const [key, value] of details) if (key.startsWith(label)) return value;
    }
    return "";
  };
  const dimensions = detail("package dimensions", "product dimensions", "item dimensions");

  const deliveryEl = document.querySelector<HTMLElement>(
    "#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE [data-csa-c-delivery-time], #mir-layout-DELIVERY_BLOCK [data-csa-c-delivery-time]",
  );

  return {
    title,
    image: document.querySelector<HTMLImageElement>("#landingImage, #imgBlkFront")?.src ?? "",
    price: first([
      "#corePrice_feature_div .a-offscreen",
      "#corePriceDisplay_desktop_feature_div .priceToPay .a-offscreen",
      ".apexPriceToPay .a-offscreen",
      "#price_inside_buybox",
    ]),
    rating: document.querySelector("#acrPopover")?.getAttribute("title")?.match(/[\d.]+/)?.[0] ?? "",
    reviewCount: text("#acrCustomerReviewText").replace(/\D/g, ""),
    deliveringTo: text("#contextualIngressPtLabel_deliveryShortLine")
      .replace(/^Deliver(ing)? to\s*/i, "")
      .replace(/\s*-?\s*Update location$/i, ""),
    deliveryDate: clean(deliveryEl?.dataset.csaCDeliveryTime),
    shipsFrom,
    soldBy,
    // The shipped box when listed ("Package…"), otherwise the product itself.
    dimensions: dimensions.split(";")[0]!.trim(),
    weight: detail("package weight", "shipping weight", "item weight") || dimensions.split(";")[1]?.trim() || "",
  };
}
