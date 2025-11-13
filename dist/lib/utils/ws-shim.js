"use strict";
/**
 * WebSocket shim for browser compatibility.
 *
 * This module provides a unified WebSocket interface that works in both
 * Node.js and browser environments. When bundled for the browser, it uses
 * the native browser WebSocket API instead of the 'ws' package.
 */
module.exports = typeof WebSocket !== 'undefined' ? WebSocket : require('ws');
//# sourceMappingURL=ws-shim.js.map