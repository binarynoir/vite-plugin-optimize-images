# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `optimizeImagesPlugin(options?)` — Vite plugin that re-encodes PNG, JPEG,
  and WebP assets with [sharp](https://sharp.pixelplumbing.com) as they're
  written to the dist bundle, keeping the optimized version only when it's
  actually smaller. Never touches source files; only images that make it
  into the bundle are considered.
- Options: `minSize`, `minSavings`, `png`, `jpeg`, `webp`, `verbose`.
