// App.tsx
import "./App.css";
import { useEffect, useState } from "react";

declare const chrome: any;

interface ProductData {
  title: string;
  price: string;
  volume: string;
  weight: string;
  country?: string;
}

function App() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [hostname, setHostname] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // <-- Add loading state

  const SUPPORTED_KEYWORDS = [
    "amazon",
    "ebay",
    "walmart",
    "target",
    "bestbuy",
    "newegg",
    "etsy",
    "wayfair",
    "aliexpress",
    "overstock",
    "costco",
    "samsclub",
    "homedepot",
    "lowes",
    "macys",
    "kohls",
    "nordstrom",
    "flipkart",
    "jd",
    "rakuten",
  ];

  useEffect(() => {
    const fetchTabInfo = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const urlObj = new URL(tab.url);
        const host = urlObj.hostname.toLowerCase();
        const path = urlObj.pathname.toLowerCase();

        setHostname(host);

        // 1) Is it a “supported” site at all?
        const supported = SUPPORTED_KEYWORDS.some((kw) => host.includes(kw));
        setIsSupported(supported);

        // 2) If it’s an Amazon product page (path contains "/dp/" or "/gp/")
        if (host.includes("amazon.") && (path.includes("/dp/") || path.includes("/gp/"))) {
          setLoading(true); // Start loading
          chrome.tabs.sendMessage(tab.id, { type: "GET_AMAZON_PRODUCT_DATA" }, (response: any) => {
            if (response?.productData) {
              setProductData(response.productData);
            }
            setLoading(false); // Stop loading after response
          });
        }
      } catch (error) {
        console.error("Error fetching current tab URL:", error);
        setLoading(false);
      }
    };

    fetchTabInfo();
  }, []);

  return (
    <div className="flex flex-col border border-green-400 border-3 w-120 h-full bg-[#1E1E1E] px-6">
      <div className="text-lg font-bold text-white pt-2 items-start w-full text-left">EcoShelf</div>

      {!isSupported ? (
        // CASE A: Not on a supported site
        <div className="flex flex-col justify-center items-center w-full py-10">
          <h1 className="text-2xl font-bold text-green-400">Not a supported site!</h1>
        </div>
      ) : hostname.includes("amazon.") && loading ? (
        // CASE B: On Amazon product page and loading
        <div className="flex flex-col justify-center items-center w-full py-10">
          <h1 className="text-2xl font-bold text-green-400">Loading Amazon data…</h1>
        </div>
      ) : hostname.includes("amazon.") && productData ? (
        // CASE C: On Amazon product page and we have data
        <div className="my-4 text-white">
          <h2 className="text-xl font-semibold text-green-400">Amazon Product Info</h2>
          <div className="mt-3">
            <span className="font-bold">Name:</span>
            <p className="">{productData.title || "Not Found"}</p>
          </div>
          <div className="mt-2">
            <span className="font-bold">Price:</span>
            <p className="">{productData.price || "Not Found"}</p>
          </div>
          <div className="mt-2">
            <span className="font-bold">Package Volume:</span>
            <p className="">{productData.volume || "Not Found"}</p>
          </div>
          <div className="mt-2">
            <span className="font-bold">Package Weight:</span>
            <p className="">{productData.weight || "Not Found"}</p>
          </div>
          <div className="mt-2">
            <span className="font-bold">Country of Origin:</span>
            <p className="">{productData.country || "Not Found"}</p>
          </div>
        </div>
      ) : (
        // CASE D: On a supported site but not an Amazon product page (or data still null)
        <div className="flex flex-col justify-center items-center w-full py-10">
          <h1 className="text-2xl font-bold text-green-400">
            {hostname.includes("amazon.")
              ? "Loading Amazon data…"
              : "Supported site, but not a product page."}
          </h1>
        </div>
      )}
    </div>
  );
}

export default App;