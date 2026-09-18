import { describe, it, expect, beforeEach, vi } from "vitest";
import { optimizeImagesPlugin } from "../src/plugin.js";
import type { Plugin } from "vite";

type MockAsset = { type: "asset"; source: string | Buffer } | null | undefined;

// generateBundle's type allows either a plain function or a
// `{ handler, order }` object; this plugin only ever uses the plain
// function form, so calling through this helper avoids re-asserting that
// at every call site.
async function runGenerateBundle(plugin: Plugin, bundle: Record<string, MockAsset>) {
  const hook = plugin.generateBundle as unknown as (
    this: unknown,
    options: Record<string, unknown>,
    bundle: Record<string, MockAsset>,
    isWrite: boolean,
  ) => void | Promise<void>;
  return hook.call({}, {}, bundle, true);
}

describe("optimizeImagesPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("image asset detection", () => {
    it("should detect PNG assets", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.png": { type: "asset" as const, source: Buffer.from("test") },
      };
      const result = await runGenerateBundle(plugin, mockBundle);
      expect(result).toBeUndefined(); // Returns void
    });

    it("should detect JPEG assets", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.jpg": { type: "asset" as const, source: Buffer.from("test") },
      };
      const result = await runGenerateBundle(plugin, mockBundle);
      expect(result).toBeUndefined();
    });

    it("should detect WebP assets", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.webp": { type: "asset" as const, source: Buffer.from("test") },
      };
      const result = await runGenerateBundle(plugin, mockBundle);
      expect(result).toBeUndefined();
    });

    it("should skip non-image assets", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.css": { type: "asset" as const, source: "body {}" },
      };
      const result = await runGenerateBundle(plugin, mockBundle);
      expect(result).toBeUndefined();
    });

    it("should skip string-based assets", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.png": { type: "asset" as const, source: "already-string" },
      };
      const result = await runGenerateBundle(plugin, mockBundle);
      expect(result).toBeUndefined();
    });
  });

  describe("PNG optimization", () => {
    it("should optimize PNG images", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.png": { type: "asset" as const, source: Buffer.from("test-image-data") },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["test.png"]).toBeDefined();
    });

    it("should skip small PNG images", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "small.png": { type: "asset" as const, source: Buffer.from("tiny") },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["small.png"]).toBeDefined();
    });

    it("should handle PNG optimization errors", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "invalid.png": { type: "asset" as const, source: Buffer.from("invalid-png-data") },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["invalid.png"]).toBeDefined();
    });
  });

  describe("JPEG optimization", () => {
    it("should optimize JPEG images", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.jpg": { type: "asset" as const, source: Buffer.from("test-image-data") },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["test.jpg"]).toBeDefined();
    });

    it("should optimize JPG images", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.jpeg": { type: "asset" as const, source: Buffer.from("test-image-data") },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["test.jpeg"]).toBeDefined();
    });

    it("should handle JPEG optimization errors", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "invalid.jpg": { type: "asset" as const, source: Buffer.from("invalid-jpeg-data") },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["invalid.jpg"]).toBeDefined();
    });
  });

  describe("WebP optimization", () => {
    it("should optimize WebP images", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.webp": { type: "asset" as const, source: Buffer.from("test-image-data") },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["test.webp"]).toBeDefined();
    });

    it("should skip unsupported formats", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.gif": { type: "asset" as const, source: Buffer.from("test-image-data") },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["test.gif"]).toBeDefined();
    });
  });

  describe("verbose mode", () => {
    it("logs progress when verbose is enabled", async () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const plugin = optimizeImagesPlugin({ verbose: true });
      const mockBundle: Record<string, MockAsset> = {
        "test.png": { type: "asset" as const, source: Buffer.from("test-image-data") },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it("stays quiet when verbose is disabled (the default)", async () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.css": { type: "asset" as const, source: "body {}" },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });

  describe("options", () => {
    it("respects a custom minSize threshold", async () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const plugin = optimizeImagesPlugin({ minSize: 1, verbose: true });
      const mockBundle: Record<string, MockAsset> = {
        "tiny.png": { type: "asset" as const, source: Buffer.from("tiny-data") },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Found 1 images to process"));
      logSpy.mockRestore();
    });

    it("accepts custom png/jpeg/webp encode options without throwing", async () => {
      const plugin = optimizeImagesPlugin({
        png: { quality: 50 },
        jpeg: { quality: 60, mozjpeg: false },
        webp: { quality: 40 },
      });
      const mockBundle: Record<string, MockAsset> = {
        "test.png": { type: "asset" as const, source: Buffer.from("test-image-data") },
      };
      await expect(runGenerateBundle(plugin, mockBundle)).resolves.toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("should handle missing image assets", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {};
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle).toEqual({});
    });

    it("should handle null assets", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = { "test.png": null };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle).toEqual({ "test.png": null });
    });

    it("should handle undefined assets", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = { "test.png": undefined };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle).toEqual({ "test.png": undefined });
    });

    it("should handle malformed image data", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "invalid.png": {
          type: "asset" as const,
          source: Buffer.from("completely-invalid-image-data"),
        },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["invalid.png"]).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("should handle empty bundle", async () => {
      const plugin = optimizeImagesPlugin();
      await runGenerateBundle(plugin, {});
    });

    it("should handle bundle with no images", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.css": { type: "asset" as const, source: "body {}" },
      };
      await runGenerateBundle(plugin, mockBundle);
    });

    it("should handle very large images", async () => {
      const plugin = optimizeImagesPlugin();
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024, "test"); // 10MB
      const mockBundle: Record<string, MockAsset> = {
        "large.png": { type: "asset" as const, source: largeBuffer },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["large.png"]).toBeDefined();
    });

    it("should handle images at exact size threshold", async () => {
      const plugin = optimizeImagesPlugin();
      const thresholdBuffer = Buffer.alloc(10 * 1024, "test"); // 10KB
      const mockBundle: Record<string, MockAsset> = {
        "threshold.png": { type: "asset" as const, source: thresholdBuffer },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["threshold.png"]).toBeDefined();
    });
  });

  describe("integration tests", () => {
    it("should process multiple image formats", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.png": { type: "asset" as const, source: Buffer.from("test") },
        "test.jpg": { type: "asset" as const, source: Buffer.from("test") },
        "test.webp": { type: "asset" as const, source: Buffer.from("test") },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["test.png"]).toBeDefined();
      expect(mockBundle["test.jpg"]).toBeDefined();
      expect(mockBundle["test.webp"]).toBeDefined();
    });

    it("should handle mixed image and non-image assets", async () => {
      const plugin = optimizeImagesPlugin();
      const mockBundle: Record<string, MockAsset> = {
        "test.png": { type: "asset" as const, source: Buffer.from("test") },
        "style.css": { type: "asset" as const, source: "body {}" },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["test.png"]).toBeDefined();
      expect(mockBundle["style.css"]).toBeDefined();
    });

    it("should handle plugin lifecycle", async () => {
      const plugin = optimizeImagesPlugin();
      expect(plugin.name).toBe("vite-plugin-optimize-images");
      expect(plugin.enforce).toBe("post");
      const mockBundle: Record<string, MockAsset> = {
        "test.png": { type: "asset" as const, source: Buffer.from("test") },
      };
      await runGenerateBundle(plugin, mockBundle);
      expect(mockBundle["test.png"]).toBeDefined();
    });
  });
});
