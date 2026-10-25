import { describe, test, expect, beforeEach } from "vitest";
import api from "../api/axios";

// Run the request interceptor directly — no network involved.
const runInterceptors = (config) =>
  api.interceptors.request.handlers.reduce(
    (cfg, h) => (h ? h.fulfilled(cfg) : cfg),
    config,
  );

describe("axios client", () => {
  beforeEach(() => localStorage.clear());

  test("attaches the stored JWT as a Bearer token", () => {
    localStorage.setItem("token", "abc.def.ghi");
    const cfg = runInterceptors({ headers: {} });
    expect(cfg.headers.Authorization).toBe("Bearer abc.def.ghi");
  });

  test("sends no Authorization header when logged out", () => {
    const cfg = runInterceptors({ headers: {} });
    expect(cfg.headers.Authorization).toBeUndefined();
  });

  test("points at the /api base path", () => {
    expect(api.defaults.baseURL).toMatch(/\/api$/);
  });
});
