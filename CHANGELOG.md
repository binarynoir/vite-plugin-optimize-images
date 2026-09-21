# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
