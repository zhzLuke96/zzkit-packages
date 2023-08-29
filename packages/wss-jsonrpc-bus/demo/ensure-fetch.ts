import "esm-hook";
import fetch, { Headers } from "node-fetch";

if (!globalThis.fetch) {
  globalThis.fetch = globalThis.fetch || fetch;
  globalThis.Headers = globalThis.Headers || Headers;
}
