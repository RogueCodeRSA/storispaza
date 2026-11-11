import { expect, it } from "vitest";
import { requireLocalOrigin } from "@/server/capture-service";
it("accepts matching loopback Host/Origin after framework URL canonicalization", () => {
  expect(() => requireLocalOrigin(new Request("http://localhost:3100/api/illustrations/session", { headers: { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100" } }))).not.toThrow();
  const hostile: Record<string, string>[] = [{ host: "evil.example", origin: "http://evil.example" }, { host: "127.0.0.1:3100", origin: "http://evil.example" }, { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100", "sec-fetch-site": "cross-site" }];
  for (const headers of hostile) {
    expect(() => requireLocalOrigin(new Request("http://localhost:3100/api/illustrations", { headers }))).toThrow();
  }
});
