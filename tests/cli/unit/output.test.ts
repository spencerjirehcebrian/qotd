import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { success, error, info, warn } from "../../../cli/lib/output";

describe("output helpers", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("success() calls console.log with the message", () => {
    success("it worked");
    expect(logSpy).toHaveBeenCalledTimes(1);
    const arg = logSpy.mock.calls[0][0] as string;
    expect(arg).toContain("it worked");
  });

  it("error() calls console.error with Error: prefix", () => {
    error("something broke");
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const arg = errorSpy.mock.calls[0][0] as string;
    expect(arg).toContain("Error:");
    expect(arg).toContain("something broke");
  });

  it("info() calls console.log with the message", () => {
    info("some info");
    expect(logSpy).toHaveBeenCalledTimes(1);
    const arg = logSpy.mock.calls[0][0] as string;
    expect(arg).toContain("some info");
  });

  it("warn() calls console.log with the message", () => {
    warn("be careful");
    expect(logSpy).toHaveBeenCalledTimes(1);
    const arg = logSpy.mock.calls[0][0] as string;
    expect(arg).toContain("be careful");
  });
});
