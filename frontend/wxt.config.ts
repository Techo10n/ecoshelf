import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  outDir: 'wxt-build',

  manifest: {
    "manifest_version": 3,
    "name": "EcoShelf",
    "description": "Calculate emissions from products when online shopping. Recommends more sustainable, similarly priced alternatives.",
    "version": "0.0.0",
    "icons": {
      "16": "logo16.png",
      "32": "logo32.png",
      "48": "logo48.png",
      "96": "logo96.png",
      "128": "logo128.png"
    },
    "commands": {
      "wxt:reload-extension": {
        "description": "Reload the extension during development",
        "suggested_key": {
          "default": "Alt+R"
        }
      }
    },
    "background": {
      "service_worker": "background.js"
    },
    "action": {
      "default_title": "EcoShelf",
      "default_popup": "popup.html"
    },
    "permissions": [
      "activeTab",
      "storage",
      "tabs",
      "scripting"
    ],
    "host_permissions": [
      "http://localhost:8000/*",
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
    "content_scripts": [
      {
        "matches": [
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
        "js": [
          "content-scripts/content.js"
        ]
      }
    ]
  },
});
