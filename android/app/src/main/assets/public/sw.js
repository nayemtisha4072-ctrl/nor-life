/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-5d155c7a'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "6b67c294e7ad4343fd2924186d86fae4"
  }, {
    "url": "pwa-512x512.png",
    "revision": "91cfa13ae8bf24cdcde7a759b1b36ffc"
  }, {
    "url": "pwa-192x192.png",
    "revision": "0eea56c7eb0a6da2d752a038929606fc"
  }, {
    "url": "index.html",
    "revision": "336f64f04341a4fc3024cf1029b42bad"
  }, {
    "url": "icon.svg",
    "revision": "2e7aa9517ab33c4fce636071a7ead9e9"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d2d9e6242a7ab7283013fd8c9b3af555"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/wallpaper_madinah_arch_1794572269157-BdYNi0N2.jpg",
    "revision": null
  }, {
    "url": "assets/wallpaper_kaaba_night_1794572269441-BX97zEJN.jpg",
    "revision": null
  }, {
    "url": "assets/wallpaper_geometric_noor_1794572269526-DXcG05nh.jpg",
    "revision": null
  }, {
    "url": "assets/wallpaper_crescent_mosque_1794572269557-iyQ5ELSe.jpg",
    "revision": null
  }, {
    "url": "assets/index-DKZrWcYg.js",
    "revision": null
  }, {
    "url": "assets/index-C4ZQhf57.css",
    "revision": null
  }, {
    "url": "assets/aistudio/file_0000000007a481fa9c9f1918a2ee7c16_192e84d1.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d2d9e6242a7ab7283013fd8c9b3af555"
  }, {
    "url": "icon.svg",
    "revision": "2e7aa9517ab33c4fce636071a7ead9e9"
  }, {
    "url": "pwa-192x192.png",
    "revision": "0eea56c7eb0a6da2d752a038929606fc"
  }, {
    "url": "pwa-512x512.png",
    "revision": "91cfa13ae8bf24cdcde7a759b1b36ffc"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "6b67c294e7ad4343fd2924186d86fae4"
  }, {
    "url": "manifest.webmanifest",
    "revision": "b791769e971bebfc8ebfb672716cb4b9"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 15,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/\/api\/quran\/.*/i, new workbox.NetworkFirst({
    "cacheName": "noorlife-quran-api",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 150,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
