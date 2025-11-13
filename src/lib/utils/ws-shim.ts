/**
 * WebSocket shim for browser compatibility.
 *
 * This module provides a unified WebSocket interface that works in both
 * Node.js and browser environments. When bundled for the browser, it uses
 * the native browser WebSocket API instead of the 'ws' package.
 */

// In browser environments, use the native WebSocket
// In Node.js environments, this will be replaced by the 'ws' package via package.json browser field
export = typeof WebSocket !== 'undefined' ? WebSocket : require('ws');
