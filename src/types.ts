import type { Config as SvgoConfig } from "svgo";

export type { SvgoConfig };

export interface PngEncodeOptions {
  quality?: number;
  compressionLevel?: number;
  adaptiveFiltering?: boolean;
}

export interface JpegEncodeOptions {
  quality?: number;
  progressive?: boolean;
  mozjpeg?: boolean;
}

export interface WebpEncodeOptions {
  quality?: number;
}

export interface OptimizeImagesOptions {
  /**
   * Minimum source size (bytes) before an image is considered for
   * optimization.
   * @default 10240 (10 KiB)
   */
  minSize?: number;

  /**
   * Minimum bytes an optimization must save before it's applied — a
   * re-encode that doesn't clear this bar is discarded and the original
   * bytes are kept.
   * @default 1024 (1 KiB)
   */
  minSavings?: number;

  /** sharp PNG encode options. */
  png?: PngEncodeOptions;

  /** sharp JPEG encode options. */
  jpeg?: JpegEncodeOptions;

  /** sharp WebP encode options. */
  webp?: WebpEncodeOptions;

  /**
   * SVGO options, merged over `{ multipass: true }` (which keeps SVGO's
   * default plugin preset).
   */
  svg?: SvgoConfig;

  /**
   * Also optimize the copies of images from Vite's public directory that
   * end up in the build output. Files in the public directory itself are
   * never changed.
   * @default true
   */
  public?: boolean;

  /**
   * Log progress and per-file savings to the console.
   * @default false
   */
  verbose?: boolean;
}
