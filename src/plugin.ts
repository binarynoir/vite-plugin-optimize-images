import type { Plugin } from "vite";
import sharp from "sharp";
import path from "node:path";
import type { OptimizeImagesOptions } from "./types.js";

const DEFAULT_MIN_SIZE = 10 * 1024;
const DEFAULT_MIN_SAVINGS = 1024;

/**
 * Vite plugin that optimizes images as they're written to the dist bundle.
 * - Never modifies source files
 * - Optimizes only images that actually make it to dist
 */
export function optimizeImagesPlugin(options: OptimizeImagesOptions = {}): Plugin {
  const minSize = options.minSize ?? DEFAULT_MIN_SIZE;
  const minSavings = options.minSavings ?? DEFAULT_MIN_SAVINGS;
  const verbose = options.verbose ?? false;
  const pngOptions = { quality: 80, compressionLevel: 9, adaptiveFiltering: true, ...options.png };
  const jpegOptions = { quality: 85, progressive: true, mozjpeg: true, ...options.jpeg };
  const webpOptions = { quality: 85, ...options.webp };

  return {
    name: "vite-plugin-optimize-images",
    enforce: "post", // Run after other plugins

    async generateBundle(_outputOptions, bundle) {
      let optimizedCount = 0;
      let totalSavings = 0;
      let totalOriginalSize = 0;

      // Count image assets first to avoid premature "no images" message
      const imageAssets = Object.entries(bundle).filter(
        ([fileName, asset]) =>
          asset &&
          asset.type === "asset" &&
          typeof asset.source !== "string" &&
          fileName.match(/\.(jpg|jpeg|png|webp)$/i) &&
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
      for (const [fileName, bundleAsset] of imageAssets) {
        // Type guard: we already filtered for assets with source
        if (bundleAsset.type !== "asset" || typeof bundleAsset.source === "string") {
          continue;
        }

        const asset = bundleAsset;
        const originalSize = asset.source.length;
        const originalBuffer = Buffer.from(asset.source);

        try {
          // Optimize based on file type
          const ext = path.extname(fileName).toLowerCase();
          let optimizedBuffer: Buffer;

          if (ext === ".png") {
            optimizedBuffer = await sharp(originalBuffer).png(pngOptions).toBuffer();
          } else if (ext === ".jpg" || ext === ".jpeg") {
            optimizedBuffer = await sharp(originalBuffer).jpeg(jpegOptions).toBuffer();
          } else if (ext === ".webp") {
            optimizedBuffer = await sharp(originalBuffer).webp(webpOptions).toBuffer();
          } else {
            continue;
          }

          // Only use optimized version if it's actually smaller
          const optimizedSize = optimizedBuffer.length;
          const savings = originalSize - optimizedSize;
          const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

          if (savings > minSavings) {
            asset.source = optimizedBuffer;
            optimizedCount++;
            totalSavings += savings;
            totalOriginalSize += originalSize;

            if (verbose) {
              const originalKB = (originalSize / 1024).toFixed(2);
              const optimizedKB = (optimizedSize / 1024).toFixed(2);
              console.log(
                `[vite-plugin-optimize-images] ✓ ${fileName}: ${originalKB} KB → ${optimizedKB} KB (-${savingsPercent}%)`,
              );
            }
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.warn(`[vite-plugin-optimize-images] Failed to optimize ${fileName}:`, errorMsg);
        }
      }

      // Show final summary after processing all images
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
    },
  };
}
