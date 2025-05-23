import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  outDir: 'wxt-build',

  manifest: {
    "manifest_version": 3,
    "name": "EcoShelf",
    "description": "A Chrome Extension for online shopping that calculates the emissions produced from shipping a product, recommending more sustainable alternatives with similar price points.",
    "version": "0.0.0",
    "icons": {
      "16": "icon/16.png",
      "32": "icon/32.png",
      "48": "icon/48.png",
      "96": "icon/96.png",
      "128": "icon/128.png"
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
      "default_title": "Default Popup Title",
      "default_popup": "popup.html"
    },
    "host_permissions": [
      "*://*.google.com/*",
      "http://localhost/*"
    ],
    "content_security_policy": {
      "extension_pages": "script-src 'self' 'wasm-unsafe-eval' http://localhost:3000; object-src 'self';",
      "sandbox": "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000; sandbox allow-scripts allow-forms allow-popups allow-modals; child-src 'self';"
    },
    "permissions": [
      "tabs",
      "scripting"
    ]
  },
});
