# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2020-07-19
### Added
- Added `CachedInterpreter`, which caches the parsed AST tree for faster
  processing.
- Provide single-file bundles in UMD and ESM formats.
- Provide TypeScript type definitions (*.d.ts).

### Changed
- Rewritten to use ECMAScript modules. d2calc can still be imported from Node.js
  in CommonJS mode.
- Can now be installed on Node.js 10.x, though no guarantees are made on whether
  d2calc actually works on this version. **Use at your own risk.**

## [0.0.1] - 2020-07-17
### Added
- Initial release

[Unreleased]: https://github.com/pastelmind/d2calc/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/pastelmind/d2calc/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/pastelmind/d2calc/releases/tag/v0.0.1