import "./App.css";
import { useEffect, useState } from "react";
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
        if (!tab.url) {
          throw new Error("Tab URL is undefined");
        }
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
          if (typeof tab.id === "number") {
            chrome.tabs.sendMessage(tab.id, { type: "GET_AMAZON_PRODUCT_DATA" }, (response: any) => {
              if (response?.productData) {
                setProductData(response.productData);
              }
              setLoading(false); // Stop loading after response
            });
          } else {
            console.error("Tab ID is undefined");
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching current tab URL:", error);
        setLoading(false);
      }
    };

    fetchTabInfo();
  }, []);

  return (
    <div className="flex flex-col border border-[#5DD17D] border-3 w-120 h-full bg-[#1E1E1E] px-6">
      <div className="text-7xl flex font-bold text-[#5DD17D] pt-6 items-center justify-center w-full text-center">EcoShelf</div>

      {!isSupported ? (
        // CASE A: Not on a supported site
        <div className="flex flex-col justify-center items-center w-full pb-10">
          <svg width="263" height="116" viewBox="0 0 263 116" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M44.8117 114.545C36.2535 114.545 28.8671 112.858 22.6526 109.484C16.4736 106.075 11.7151 101.228 8.37704 94.9425C5.07449 88.6214 3.42321 81.1108 3.42321 72.4105C3.42321 63.9588 5.09224 56.5724 8.43031 50.2514C11.7684 43.8949 16.4736 38.9588 22.5461 35.4432C28.6185 31.892 35.7741 30.1165 44.0127 30.1165C49.8366 30.1165 55.1633 31.022 59.9928 32.8331C64.8224 34.6442 68.9949 37.3253 72.5106 40.8764C76.0262 44.4276 78.7606 48.8132 80.7137 54.0334C82.6668 59.218 83.6434 65.1662 83.6434 71.8778V78.3764H12.5319V63.2486H59.4069C59.3714 60.4787 58.7144 58.0107 57.436 55.8445C56.1576 53.6783 54.3998 51.9915 52.1626 50.7841C49.9608 49.5412 47.4218 48.9197 44.5454 48.9197C41.6334 48.9197 39.0233 49.5767 36.7151 50.8906C34.4069 52.169 32.578 53.9268 31.2286 56.1641C29.8792 58.3658 29.1689 60.8693 29.0979 63.6747V79.0689C29.0979 82.407 29.7549 85.3366 31.0688 87.858C32.3827 90.3437 34.2471 92.2791 36.6618 93.6641C39.0766 95.049 41.953 95.7415 45.2911 95.7415C47.5993 95.7415 49.6945 95.4219 51.5766 94.7827C53.4587 94.1435 55.0745 93.2024 56.4239 91.9595C57.7734 90.7166 58.7854 89.1896 59.4601 87.3785L83.377 88.071C82.3827 93.4332 80.1988 98.103 76.8252 102.08C73.4871 106.022 69.1015 109.094 63.6682 111.295C58.235 113.462 51.9495 114.545 44.8117 114.545Z" fill="#5DD17D"/>
            <path d="M219.513 115.545C210.92 115.545 203.533 113.787 197.354 110.271C191.211 106.72 186.47 101.784 183.132 95.4631C179.829 89.1065 178.178 81.7379 178.178 73.3572C178.178 64.941 179.829 57.5724 183.132 51.2514C186.47 44.8949 191.211 39.9588 197.354 36.4432C203.533 32.892 210.92 31.1165 219.513 31.1165C228.107 31.1165 235.476 32.892 241.619 36.4432C247.798 39.9588 252.539 44.8949 255.841 51.2514C259.18 57.5724 260.849 64.941 260.849 73.3572C260.849 81.7379 259.18 89.1065 255.841 95.4631C252.539 101.784 247.798 106.72 241.619 110.271C235.476 113.787 228.107 115.545 219.513 115.545ZM219.673 95.8892C222.798 95.8892 225.444 94.9304 227.61 93.0128C229.776 91.0952 231.427 88.4318 232.564 85.0227C233.736 81.6136 234.322 77.6719 234.322 73.1974C234.322 68.652 233.736 64.6747 232.564 61.2656C231.427 57.8565 229.776 55.1932 227.61 53.2756C225.444 51.358 222.798 50.3991 219.673 50.3991C216.442 50.3991 213.707 51.358 211.47 53.2756C209.268 55.1932 207.581 57.8565 206.41 61.2656C205.273 64.6747 204.705 68.652 204.705 73.1974C204.705 77.6719 205.273 81.6136 206.41 85.0227C207.581 88.4318 209.268 91.0952 211.47 93.0128C213.707 94.9304 216.442 95.8892 219.673 95.8892Z" fill="#5DD17D"/>
            <path d="M132.5 29C124.869 29 117.373 31.0072 110.763 34.8202C104.154 38.6332 98.6632 44.1178 94.8432 50.7235C91.0232 57.3291 89.0081 64.8234 89 72.454C88.992 80.0847 90.9913 87.5832 94.7973 94.1969C98.6033 100.811 104.082 106.307 110.684 110.134C117.285 113.961 124.777 115.984 132.408 116C140.039 116.016 147.539 114.025 154.157 110.226C160.775 106.427 166.277 100.954 170.111 94.356L132.5 72.5L132.5 29Z" fill="#5DD17D"/>
          </svg>
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
            <span className="font-bold">Rating:</span>
            <p className="">
              {productData.rating || "Not Found"}{" "}
              {productData.reviewCount ? `(${productData.reviewCount} reviews)` : "No reviews found"}
            </p>
          </div>
          <div className="mt-2">
            <span className="font-bold">Delivering To:</span>
            <p className="">{productData.deliveringTo || "Not Found"}</p>
          </div>
          <div className="mt-2">
            <span className="font-bold">Package Volume:</span>
            <p className="">{productData.packageVolume || "Not Found"}</p>
          </div>
          <div className="mt-2">
            <span className="font-bold">Package Weight:</span>
            <p className="">{productData.packageWeight || "Not Found"}</p>
          </div>
          <div className="mt-2">
            <span className="font-bold">Product Volume:</span>
            <p className="">{productData.productVolume || "Not Found"}</p>
          </div>
          <div className="mt-2">
            <span className="font-bold">Product Weight:</span>
            <p className="">{productData.productWeight || "Not Found"}</p>
          </div>
          <div className="mt-2">
            <span className="font-bold">Ships From:</span>
            <p className="">{productData.shipsFrom || "Not Found"}</p>
          </div>
          <div className="mt-2">
            <span className="font-bold">Sold By:</span>
            <p className="">{productData.soldBy || "Not Found"}</p>
          </div>
          <div className="mt-2">
            <span className="font-bold">Delivery Date:</span>
            <p className="">{productData.deliveryDate || "Not Found"}</p>
          </div>
        </div>
      ) : (
        // CASE D: On a supported site but not an Amazon product page (or data still null)
        <div className="flex flex-col justify-center items-center w-full py-10">
          <h1 className="text-2xl font-bold text-[#5DD17D]">
            {hostname.includes("amazon.")
              ? "Loading Amazon data…"
              : "Shopping site detected, but not currently supported. Only Amazon product pages are supported."}
          </h1>
        </div>
      )}
    </div>
  );
}

export default App;