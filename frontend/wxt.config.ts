import { defineConfig } from "wxt";

// WXT generates the background, action and content_scripts keys from src/entrypoints.
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: "src",
  outDir: "wxt-build",
  manifest: {
    name: "EcoShelf",
    description:
      "Calculate emissions from products when online shopping. Recommends more sustainable, similarly priced alternatives.",
    icons: { 16: "logo16.png", 32: "logo32.png", 48: "logo48.png", 96: "logo96.png", 128: "logo128.png" },
    permissions: ["scripting"],
    host_permissions: [
      "http://localhost:8000/*",
      "https://*.amazon.com/*",
      "https://*.amazon.co.uk/*",
      "https://*.amazon.ca/*",
      "https://*.amazon.de/*",
      "https://*.amazon.fr/*",
      "https://*.amazon.it/*",
      "https://*.amazon.es/*",
      "https://*.amazon.co.jp/*",
      "https://*.amazon.in/*",
    ],
  },
});
