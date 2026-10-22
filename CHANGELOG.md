# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-10-22

### Added

- Optimize SVG files with [SVGO](https://svgo.dev), with a new `svg` option for SVGO settings
- Optimize the copies of images from Vite's public directory in the build output, which never pass through the bundle; on by default, turn off with `public: false`

### Changed

- README: replace the plugin list with a generated More from BinaryNoir section, and use a BinaryNoir logo that shows on light and dark backgrounds

## [0.1.10] - 2026-10-15

### Changed

- README: add Sidebar Accordion to the list of BinaryNoir plugins

## [0.1.9] - 2026-10-14

### Changed

- README: list the Exclude, README Index and Broken Links plugins under More from BinaryNoir, and point documentation and website links to binarynoir.tech

## [0.1.8] - 2026-10-13

### Changed

- README: remove the binarynoir.github.io badge; the binarynoir.tech website badge remains

## [0.1.7] - 2026-10-13

### Changed

- README: add a Feedback and support section with links to report a bug, request a feature, or browse open issues
- README: add a More from BinaryNoir section with the BinaryNoir logo and links to the other plugins and command-line tools on [binarynoir.github.io](https://binarynoir.github.io)
- README: add a binarynoir.github.io badge

## [0.1.6] - 2026-10-08

### Changed

- Add a link to the documentation site in README

## [0.1.5] - 2026-10-06

### Changed

- Add support, author, and acknowledgments sections to README

## [0.1.4] - 2026-10-06

### Changed

- Add support and website badges to README

## [0.1.3] - 2026-09-21

### Changed

- Rewrote the README's introduction and feature summary for clarity.

## [0.1.2] - 2026-09-21

### Changed

- Updated dev dependencies to their latest compatible versions.

## [0.1.1] - 2026-09-21

### Changed

- **Breaking:** raised the minimum supported Node.js version from `>=20` to `>=22`. CI now tests against Node 22, 24, and 26, and releases publish on Node 26.

## [0.1.0] - 2026-09-18

### Added

- `optimizeImagesPlugin(options?)` — Vite plugin that re-encodes PNG, JPEG,
  and WebP assets with [sharp](https://sharp.pixelplumbing.com) as they're
  written to the dist bundle, keeping the optimized version only when it's
  actually smaller. Never touches source files; only images that make it
  into the bundle are considered.
- Options: `minSize`, `minSavings`, `png`, `jpeg`, `webp`, `verbose`.
