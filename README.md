# vite-plugin-optimize-images

[![npm version](https://img.shields.io/npm/v/@binarynoir/vite-plugin-optimize-images.svg)](https://www.npmjs.com/package/@binarynoir/vite-plugin-optimize-images)
[![CI](https://github.com/binarynoir/vite-plugin-optimize-images/actions/workflows/ci.yml/badge.svg)](https://github.com/binarynoir/vite-plugin-optimize-images/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@binarynoir/vite-plugin-optimize-images.svg)](LICENSE)

A [Vite](https://vite.dev) plugin that makes your build's images smaller,
automatically. No config required to get started, no changes to your source
files, and no separate compression step to remember before every commit.

## What this does

When Vite builds your site, it copies your images into the `dist` folder as
they are. This plugin re-compresses those copies on the way out using
[sharp](https://sharp.pixelplumbing.com), so the images you actually ship end
up smaller than the ones you started with.

A few things this plugin is careful about, so it's safe to just turn on:

- **Your original files are never touched.** Only the copies written to
  `dist/` get re-encoded. Nothing in your project or Git history changes.
- **Only images that actually ship get processed.** If an image never makes
  it into your build output, this plugin never looks at it.
- **You never end up with a bigger file.** If re-compressing an image
  wouldn't save meaningful space, the original is kept instead (see
  `minSavings` below).

Add the plugin, build your site the way you normally would, and your images
come out smaller. That's the whole idea.

## Install

```sh
npm install --save-dev @binarynoir/vite-plugin-optimize-images
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { optimizeImagesPlugin } from "@binarynoir/vite-plugin-optimize-images";

export default defineConfig({
  plugins: [optimizeImagesPlugin()],
});
```

That's it — `.png`, `.jpg`/`.jpeg`, and `.webp` assets in your build output
get re-encoded automatically. Run a build with `VITE_OPTIMIZE_VERBOSE`-style
visibility by passing `verbose: true` (see below) to see what was optimized
and by how much.

## Options

| Option       | Default | Description                                                                            |
| ------------ | ------- | -------------------------------------------------------------------------------------- |
| `minSize`    | `10240` | Minimum source size (bytes) before an image is considered for optimization (10 KiB).   |
| `minSavings` | `1024`  | Minimum bytes an optimization must save before it's applied (1 KiB).                   |
| `png`        | —       | sharp [PNG encode options](https://sharp.pixelplumbing.com/api-output#png) override.   |
| `jpeg`       | —       | sharp [JPEG encode options](https://sharp.pixelplumbing.com/api-output#jpeg) override. |
| `webp`       | —       | sharp [WebP encode options](https://sharp.pixelplumbing.com/api-output#webp) override. |
| `verbose`    | `false` | Log progress and per-file savings to the console.                                      |

Defaults, before any override:

```ts
{
  png: { quality: 80, compressionLevel: 9, adaptiveFiltering: true },
  jpeg: { quality: 85, progressive: true, mozjpeg: true },
  webp: { quality: 85 },
}
```

```ts
optimizeImagesPlugin({
  minSize: 5 * 1024,
  minSavings: 512,
  jpeg: { quality: 75 },
  verbose: true,
});
```

## Why not `vite-plugin-imagemin` / `vite-imagetools` / etc.?

Those are great, more general options if you want format conversion, resizing,
or a wider codec set. This plugin is intentionally small: it re-encodes the
three formats sharp handles fastest, only ever operates on what's already in
the output bundle (so it composes cleanly with any other asset pipeline you
have), and never risks producing a _larger_ file than it started with.

## Releasing

Releases are tag-triggered. To ship a new version, from a clean `main` that's
in sync with `origin/main`:

```sh
npm run release:patch   # or release:minor / release:major
```

This runs typecheck/lint/test/build locally, then `npm version <bump>`
(bumps `package.json`, commits, and creates a matching `vX.Y.Z` tag) and
`git push --follow-tags`. Pushing that tag triggers
[`.github/workflows/release.yml`](.github/workflows/release.yml), which
re-runs the checks, publishes to npm (with
[provenance](https://docs.npmjs.com/generating-provenance-statements)), and
creates a GitHub release with auto-generated notes.

For a prerelease or an explicit version, use `npm run release -- <arg>`
(e.g. `npm run release -- 1.2.3` or `npm run release -- prerelease`) — see
[`npm version`](https://docs.npmjs.com/cli/v10/commands/npm-version) for the
full list of accepted values.

This requires an `NPM_TOKEN` repository secret (an npm
[automation token](https://docs.npmjs.com/creating-and-viewing-access-tokens)
with publish access) — set it under Settings → Secrets and variables →
Actions. First time publishing this package? See [PUBLISHING.md](PUBLISHING.md).

## License

[MIT](LICENSE)
