/* Legacy polyfills for Android 8-era Chrome / Android System WebView.
 * MUST stay ES5: this file loads before anything else and is parsed by the
 * oldest engine that can still reach the app. */
(function () {
  var g = typeof globalThis !== "undefined" ? globalThis : window;

  if (!Array.prototype.at) {
    Object.defineProperty(Array.prototype, "at", {
      value: function (n) {
        n = Math.trunc(n) || 0;
        if (n < 0) n += this.length;
        if (n < 0 || n >= this.length) return undefined;
        return this[n];
      },
      writable: true,
      configurable: true
    });
  }

  if (!String.prototype.at) {
    Object.defineProperty(String.prototype, "at", {
      value: function (n) {
        n = Math.trunc(n) || 0;
        if (n < 0) n += this.length;
        if (n < 0 || n >= this.length) return undefined;
        return this.charAt(n);
      },
      writable: true,
      configurable: true
    });
  }

  if (!Object.hasOwn) {
    Object.hasOwn = function (o, k) {
      return Object.prototype.hasOwnProperty.call(o, k);
    };
  }

  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (find, rep) {
      if (find instanceof RegExp) return this.replace(find, rep);
      return this.split(find).join(rep);
    };
  }

  if (!Element.prototype.replaceChildren) {
    Element.prototype.replaceChildren = function () {
      while (this.firstChild) this.removeChild(this.firstChild);
      for (var i = 0; i < arguments.length; i++) {
        this.appendChild(arguments[i]);
      }
    };
  }

  if (!g.queueMicrotask) {
    g.queueMicrotask = function (cb) {
      Promise.resolve().then(cb);
    };
  }

  if (!g.requestIdleCallback) {
    g.requestIdleCallback = function (cb) {
      return setTimeout(function () {
        cb({ didTimeout: false, timeRemaining: function () { return 0; } });
      }, 1);
    };
    g.cancelIdleCallback = function (id) {
      clearTimeout(id);
    };
  }

  if (!g.structuredClone) {
    g.structuredClone = function (value) {
      return JSON.parse(JSON.stringify(value));
    };
  }

  if (g.crypto && !g.crypto.randomUUID) {
    g.crypto.randomUUID = function () {
      var b = new Uint8Array(16);
      if (g.crypto.getRandomValues) g.crypto.getRandomValues(b);
      else for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
      b[6] = (b[6] & 15) | 64;
      b[8] = (b[8] & 63) | 128;
      var h = [];
      for (var j = 0; j < 16; j++) h.push((b[j] + 256).toString(16).slice(1));
      return (
        h[0] + h[1] + h[2] + h[3] + "-" +
        h[4] + h[5] + "-" +
        h[6] + h[7] + "-" +
        h[8] + h[9] + "-" +
        h[10] + h[11] + h[12] + h[13] + h[14] + h[15]
      );
    };
  }

  // Chrome < 80 has no Intl.RelativeTimeFormat; date-fns guards for it, but a
  // few call sites assume it exists.
  if (!g.Intl) g.Intl = {};
  if (!g.Intl.RelativeTimeFormat) {
    g.Intl.RelativeTimeFormat = function () {
      return {
        format: function (value, unit) {
          return value + " " + unit + (Math.abs(value) === 1 ? "" : "s");
        }
      };
    };
  }
})();
