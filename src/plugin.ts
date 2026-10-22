import type { Plugin, ResolvedConfig } from "vite";
import sharp from "sharp";
import { optimize as optimizeSvg } from "svgo";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import type { OptimizeImagesOptions } from "./types.js";

const DEFAULT_MIN_SIZE = 10 * 1024;
const DEFAULT_MIN_SAVINGS = 1024;
const IMAGE_RE = /\.(jpg|jpeg|png|webp|svg)$/i;

/**
 * Vite plugin that optimizes images as they're written to the dist bundle.
 * - Never modifies source files
 * - Optimizes only images that actually make it to dist, including the
 *   copies of files from Vite's public directory
 */
export function optimizeImagesPlugin(options: OptimizeImagesOptions = {}): Plugin {
  const minSize = options.minSize ?? DEFAULT_MIN_SIZE;
  const minSavings = options.minSavings ?? DEFAULT_MIN_SAVINGS;
  const verbose = options.verbose ?? false;
  const includePublic = options.public ?? true;
  const pngOptions = { quality: 80, compressionLevel: 9, adaptiveFiltering: true, ...options.png };
  const jpegOptions = { quality: 85, progressive: true, mozjpeg: true, ...options.jpeg };
  const webpOptions = { quality: 85, ...options.webp };
  const svgOptions = { multipass: true, ...options.svg };

  let config: ResolvedConfig | undefined;
  let optimizedCount = 0;
  let totalSavings = 0;
  let totalOriginalSize = 0;

  // Re-encodes one image. Returns the smaller bytes, or null to keep the original.
  async function optimizeImage(fileName: string, original: Buffer): Promise<Buffer | null> {
    const originalSize = original.length;

    try {
      const ext = path.extname(fileName).toLowerCase();
      let optimizedBuffer: Buffer;

      if (ext === ".png") {
        optimizedBuffer = await sharp(original).png(pngOptions).toBuffer();
      } else if (ext === ".jpg" || ext === ".jpeg") {
        optimizedBuffer = await sharp(original).jpeg(jpegOptions).toBuffer();
      } else if (ext === ".webp") {
        optimizedBuffer = await sharp(original).webp(webpOptions).toBuffer();
      } else if (ext === ".svg") {
        optimizedBuffer = Buffer.from(optimizeSvg(original.toString("utf8"), svgOptions).data);
      } else {
        return null;
      }

      // Only use optimized version if it's actually smaller
      const optimizedSize = optimizedBuffer.length;
      const savings = originalSize - optimizedSize;
      if (savings <= minSavings) return null;

      optimizedCount++;
      totalSavings += savings;
      totalOriginalSize += originalSize;

      if (verbose) {
        const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
        const originalKB = (originalSize / 1024).toFixed(2);
        const optimizedKB = (optimizedSize / 1024).toFixed(2);
        console.log(
          `[vite-plugin-optimize-images] ✓ ${fileName}: ${originalKB} KB → ${optimizedKB} KB (-${savingsPercent}%)`,
        );
      }
      return optimizedBuffer;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[vite-plugin-optimize-images] Failed to optimize ${fileName}:`, errorMsg);
      return null;
    }
  }

  // Lists image files under dir, as paths relative to it.
  async function listImages(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { recursive: true, withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && IMAGE_RE.test(entry.name))
      .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)));
  }

  // The public directory to process, or undefined when this build doesn't copy one.
  function publicDirToProcess(): string | undefined {
    if (!includePublic || !config) return undefined;
    const { publicDir, build } = config;
    if (!publicDir || !build.copyPublicDir || !build.write || build.ssr) return undefined;
    return existsSync(publicDir) ? publicDir : undefined;
  }

  function logSummary() {
    if (optimizedCount > 0) {
      const totalOriginalMB = (totalOriginalSize / (1024 * 1024)).toFixed(2);
      const totalOptimizedSize = totalOriginalSize - totalSavings;
      const totalOptimizedMB = (totalOptimizedSize / (1024 * 1024)).toFixed(2);
      const totalSavingsMB = (totalSavings / (1024 * 1024)).toFixed(2);
      const savingsPercent = ((totalSavings / totalOriginalSize) * 100).toFixed(1);

      console.log(`[vite-plugin-optimize-images] Optimization complete:`);
      console.log(`  Optimized: ${optimizedCount} images`);
      console.log(`  Original size: ${totalOriginalMB} MB`);
      console.log(`  Optimized size: ${totalOptimizedMB} MB`);
      console.log(`  Total savings: ${totalSavingsMB} MB (-${savingsPercent}%)`);
    } else {
      console.log("[vite-plugin-optimize-images] No images required optimization");
    }
  }

  return {
    name: "vite-plugin-optimize-images",
    enforce: "post", // Run after other plugins

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    async generateBundle(_outputOptions, bundle) {
      optimizedCount = 0;
      totalSavings = 0;
      totalOriginalSize = 0;

      // Count image assets first to avoid premature "no images" message.
      // Raster images must be binary; an SVG may arrive as a string.
      const imageAssets = Object.entries(bundle).filter(
        ([fileName, asset]) =>
          asset &&
          asset.type === "asset" &&
          IMAGE_RE.test(fileName) &&
          (typeof asset.source !== "string" || /\.svg$/i.test(fileName)) &&
          asset.source.length >= minSize,
      );

      // Skip processing if no eligible images
      if (imageAssets.length === 0) {
        if (verbose) {
          console.log("[vite-plugin-optimize-images] No images found in bundle");
        }
        return;
      }

      if (verbose) {
        console.log(
          `[vite-plugin-optimize-images] Found ${imageAssets.length} images to process...`,
        );
      }

      // Process all eligible image assets
      for (const [fileName, asset] of imageAssets) {
        // Type guard: we already filtered for assets
        if (asset.type !== "asset") continue;

        const optimized = await optimizeImage(fileName, Buffer.from(asset.source));
        if (optimized) asset.source = optimized;
      }

      // Public files are counted in writeBundle; summarize there when it will run
      if (!publicDirToProcess()) logSummary();
    },

    // Vite copies the public directory into outDir before writing the bundle, so its
    // images never pass through generateBundle. Re-encode those copies here, reading
    // from publicDir so the source files are never touched.
    async writeBundle() {
      const publicDir = publicDirToProcess();
      if (!publicDir || !config) return;
      const outDir = path.resolve(config.root, config.build.outDir);

      for (const file of await listImages(publicDir)) {
        const original = await fs.readFile(path.join(publicDir, file));
        if (original.length < minSize) continue;

        const optimized = await optimizeImage(file, original);
        if (optimized) await fs.writeFile(path.join(outDir, file), optimized);
      }
      logSummary();
    },
  };
}
