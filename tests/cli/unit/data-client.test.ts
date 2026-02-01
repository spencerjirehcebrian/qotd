import { describe, it, expect, beforeEach, vi } from "vitest";

const mockGetRemoteConfig = vi.fn();

vi.mock("../../../cli/lib/config", () => ({
  getRemoteConfig: (...args: unknown[]) => mockGetRemoteConfig(...args),
}));

vi.mock("../../../cli/lib/data-client-http", () => {
  const cls = vi.fn(function (this: Record<string, unknown>, url: string, key: string) {
    this._type = "http";
    this.apiUrl = url;
    this.apiKey = key;
  });
  return { HttpDataClient: cls };
});

vi.mock("../../../cli/lib/data-client-prisma", () => {
  const cls = vi.fn(function (this: Record<string, unknown>) {
    this._type = "prisma";
  });
  return { PrismaDataClient: cls };
});

vi.mock("../../../cli/lib/db", () => ({
  prisma: {},
}));

describe("createDataClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  async function getCreateDataClient() {
    const mod = await import("../../../cli/lib/data-client");
    return mod.createDataClient;
  }

  it("returns PrismaDataClient when no remote config", async () => {
    mockGetRemoteConfig.mockReturnValue(null);
    const createDataClient = await getCreateDataClient();
    const client = createDataClient() as unknown as { _type: string };
    expect(client._type).toBe("prisma");
  });

  it("returns HttpDataClient when remote config exists", async () => {
    mockGetRemoteConfig.mockReturnValue({
      apiUrl: "http://remote:3000",
      apiKey: "secret",
    });
    const createDataClient = await getCreateDataClient();
    const client = createDataClient() as unknown as {
      _type: string;
      apiUrl: string;
      apiKey: string;
    };
    expect(client._type).toBe("http");
    expect(client.apiUrl).toBe("http://remote:3000");
    expect(client.apiKey).toBe("secret");
  });

  it("caches the client on subsequent calls", async () => {
    mockGetRemoteConfig.mockReturnValue(null);
    const createDataClient = await getCreateDataClient();
    const client1 = createDataClient();
    const client2 = createDataClient();
    expect(client1).toBe(client2);
  });
});
