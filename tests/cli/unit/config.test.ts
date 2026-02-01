import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";

// config.ts resolves CONFIG_PATH from process.cwd(), so we use a temp dir
const origCwd = process.cwd;
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "qotd-cfg-"));
  process.cwd = () => tmpDir;

  // Clear the module cache so config.ts re-evaluates CONFIG_PATH
  vi.resetModules();
});

afterEach(() => {
  process.cwd = origCwd;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function importConfig() {
  return import("../../../cli/lib/config") as Promise<
    typeof import("../../../cli/lib/config")
  >;
}

describe("loadConfig", () => {
  it("returns empty object when no .qotdrc exists", async () => {
    const { loadConfig } = await importConfig();
    expect(loadConfig()).toEqual({});
  });

  it("parses valid JSON config", async () => {
    fs.writeFileSync(
      path.join(tmpDir, ".qotdrc"),
      JSON.stringify({ apiUrl: "http://localhost:3000", apiKey: "key123" }),
    );
    const { loadConfig } = await importConfig();
    expect(loadConfig()).toEqual({
      apiUrl: "http://localhost:3000",
      apiKey: "key123",
    });
  });

  it("returns empty object for invalid JSON", async () => {
    fs.writeFileSync(path.join(tmpDir, ".qotdrc"), "not json{{{");
    const { loadConfig } = await importConfig();
    expect(loadConfig()).toEqual({});
  });
});

describe("saveConfig", () => {
  it("writes config to .qotdrc", async () => {
    const { saveConfig, loadConfig } = await importConfig();
    saveConfig({ apiUrl: "http://example.com", apiKey: "abc" });
    expect(loadConfig()).toEqual({
      apiUrl: "http://example.com",
      apiKey: "abc",
    });

    // Verify the file is valid JSON with trailing newline
    const raw = fs.readFileSync(path.join(tmpDir, ".qotdrc"), "utf-8");
    expect(raw.endsWith("\n")).toBe(true);
    expect(JSON.parse(raw)).toEqual({
      apiUrl: "http://example.com",
      apiKey: "abc",
    });
  });
});

describe("clearConfig", () => {
  it("removes .qotdrc file", async () => {
    const { saveConfig, clearConfig, loadConfig } = await importConfig();
    saveConfig({ apiUrl: "http://example.com", apiKey: "abc" });
    clearConfig();
    expect(fs.existsSync(path.join(tmpDir, ".qotdrc"))).toBe(false);
    expect(loadConfig()).toEqual({});
  });

  it("does not throw when .qotdrc does not exist", async () => {
    const { clearConfig } = await importConfig();
    expect(() => clearConfig()).not.toThrow();
  });
});

describe("getRemoteConfig", () => {
  it("returns null when no config or env vars", async () => {
    const { getRemoteConfig } = await importConfig();
    expect(getRemoteConfig()).toBeNull();
  });

  it("returns config from .qotdrc when both apiUrl and apiKey present", async () => {
    fs.writeFileSync(
      path.join(tmpDir, ".qotdrc"),
      JSON.stringify({ apiUrl: "http://remote:3000", apiKey: "secret" }),
    );
    const { getRemoteConfig } = await importConfig();
    expect(getRemoteConfig()).toEqual({
      apiUrl: "http://remote:3000",
      apiKey: "secret",
    });
  });

  it("returns null when .qotdrc has only apiUrl", async () => {
    fs.writeFileSync(
      path.join(tmpDir, ".qotdrc"),
      JSON.stringify({ apiUrl: "http://remote:3000" }),
    );
    const { getRemoteConfig } = await importConfig();
    expect(getRemoteConfig()).toBeNull();
  });

  it("falls back to env vars when no file config", async () => {
    const origUrl = process.env.QOTD_API_URL;
    const origKey = process.env.QOTD_API_KEY;
    process.env.QOTD_API_URL = "http://env-remote:3000";
    process.env.QOTD_API_KEY = "env-secret";

    try {
      const { getRemoteConfig } = await importConfig();
      expect(getRemoteConfig()).toEqual({
        apiUrl: "http://env-remote:3000",
        apiKey: "env-secret",
      });
    } finally {
      if (origUrl !== undefined) process.env.QOTD_API_URL = origUrl;
      else delete process.env.QOTD_API_URL;
      if (origKey !== undefined) process.env.QOTD_API_KEY = origKey;
      else delete process.env.QOTD_API_KEY;
    }
  });

  it("returns null when env has only QOTD_API_URL", async () => {
    const origUrl = process.env.QOTD_API_URL;
    const origKey = process.env.QOTD_API_KEY;
    process.env.QOTD_API_URL = "http://env-remote:3000";
    delete process.env.QOTD_API_KEY;

    try {
      const { getRemoteConfig } = await importConfig();
      expect(getRemoteConfig()).toBeNull();
    } finally {
      if (origUrl !== undefined) process.env.QOTD_API_URL = origUrl;
      else delete process.env.QOTD_API_URL;
      if (origKey !== undefined) process.env.QOTD_API_KEY = origKey;
      else delete process.env.QOTD_API_KEY;
    }
  });

  it("prefers .qotdrc over env vars", async () => {
    fs.writeFileSync(
      path.join(tmpDir, ".qotdrc"),
      JSON.stringify({ apiUrl: "http://file:3000", apiKey: "file-key" }),
    );
    const origUrl = process.env.QOTD_API_URL;
    const origKey = process.env.QOTD_API_KEY;
    process.env.QOTD_API_URL = "http://env:3000";
    process.env.QOTD_API_KEY = "env-key";

    try {
      const { getRemoteConfig } = await importConfig();
      expect(getRemoteConfig()).toEqual({
        apiUrl: "http://file:3000",
        apiKey: "file-key",
      });
    } finally {
      if (origUrl !== undefined) process.env.QOTD_API_URL = origUrl;
      else delete process.env.QOTD_API_URL;
      if (origKey !== undefined) process.env.QOTD_API_KEY = origKey;
      else delete process.env.QOTD_API_KEY;
    }
  });
});
