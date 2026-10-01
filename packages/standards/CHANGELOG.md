# Changelog

## [0.7.0](https://github.com/Genoux/ib-toolkit/compare/standards-v0.6.1...standards-v0.7.0) (2026-10-01)


### ⚠ BREAKING CHANGES

* consumers must drop the @inbeat registry line from .npmrc/bunfig and the NODE_AUTH_TOKEN setup.

### Features

* publish [@inbeat](https://github.com/inbeat) packages publicly on npm ([#27](https://github.com/Genoux/ib-toolkit/issues/27)) ([2bd9f53](https://github.com/Genoux/ib-toolkit/commit/2bd9f53c2d4dd030bdee037b8b1dce1e1bb828b5))

## [0.6.1](https://github.com/Genoux/ib-toolkit/compare/standards-v0.6.0...standards-v0.6.1) (2026-10-01)


### Bug Fixes

* **standards:** ship template changes in standards releases ([#25](https://github.com/Genoux/ib-toolkit/issues/25)) ([176a543](https://github.com/Genoux/ib-toolkit/commit/176a543499eac56cc131595bb9c011c6664f06cc))

## [0.6.0](https://github.com/Genoux/ib-toolkit/compare/standards-v0.5.0...standards-v0.6.0) (2026-10-01)


### ⚠ BREAKING CHANGES

* remove app logic and finish the toolkit ([#21](https://github.com/Genoux/ib-toolkit/issues/21))

### Bug Fixes

* **config:** require biome 2.5 and accept biome.jsonc ([#19](https://github.com/Genoux/ib-toolkit/issues/19)) ([178dc95](https://github.com/Genoux/ib-toolkit/commit/178dc95b4c9a041970458526c3985f5a225a7caf))


### Code Refactoring

* remove app logic and finish the toolkit ([#21](https://github.com/Genoux/ib-toolkit/issues/21)) ([cecf25a](https://github.com/Genoux/ib-toolkit/commit/cecf25a670b2177f8b1e8cc3645023a1219a2626))

## [0.5.0](https://github.com/Genoux/ib-toolkit/compare/standards-v0.4.0...standards-v0.5.0) (2026-10-01)


### ⚠ BREAKING CHANGES

* **standards:** `ib add` is removed (use the vendor init CLIs); `ib check` now requires the shared config presets.

### Features

* **standards:** drop add-ons, add ib mcp, enforce shared presets ([#17](https://github.com/Genoux/ib-toolkit/issues/17)) ([9eb8410](https://github.com/Genoux/ib-toolkit/commit/9eb84108432dda5e2a2da312a7bc70299e09c0c9))

## [0.4.0](https://github.com/Genoux/ib-toolkit/compare/standards-v0.3.0...standards-v0.4.0) (2026-09-30)


### ⚠ BREAKING CHANGES

* **standards:** sync skills to .agents/skills only ([#15](https://github.com/Genoux/ib-toolkit/issues/15))

### Features

* **standards:** sync skills to .agents/skills only ([#15](https://github.com/Genoux/ib-toolkit/issues/15)) ([cd3e8a2](https://github.com/Genoux/ib-toolkit/commit/cd3e8a21f028790ad84c26dc1cc832475885c461))

## [0.3.0](https://github.com/Genoux/ib-toolkit/compare/standards-v0.2.0...standards-v0.3.0) (2026-09-30)


### ⚠ BREAKING CHANGES

* **standards:** create always makes the base app, add-ons only via ib add ([#13](https://github.com/Genoux/ib-toolkit/issues/13))

### Features

* **standards:** create always makes the base app, add-ons only via ib add ([#13](https://github.com/Genoux/ib-toolkit/issues/13)) ([5f7e0c3](https://github.com/Genoux/ib-toolkit/commit/5f7e0c38a49b0f5dafd3dd9ae6472df03067f830))
* **standards:** point any ai tool at the guides and the brief ([#12](https://github.com/Genoux/ib-toolkit/issues/12)) ([b419b4a](https://github.com/Genoux/ib-toolkit/commit/b419b4ad8e11a60ee704b4435add702fd9bd78b2))

## [0.2.0](https://github.com/Genoux/ib-toolkit/compare/standards-v0.1.2...standards-v0.2.0) (2026-09-30)


### ⚠ BREAKING CHANGES

* **ui,next:** harden ui peers, csp and rate-limit ip ([#8](https://github.com/Genoux/ib-toolkit/issues/8))

### Features

* add ib create and ib add ([#9](https://github.com/Genoux/ib-toolkit/issues/9)) ([aef8b6e](https://github.com/Genoux/ib-toolkit/commit/aef8b6e161ac66167b69d67ae279983976b17b09))


### Bug Fixes

* **standards:** keep the version out of the managed block ([#11](https://github.com/Genoux/ib-toolkit/issues/11)) ([43efd08](https://github.com/Genoux/ib-toolkit/commit/43efd081446d8cd836b1de68f0049ecacf45d872))
* **ui,next:** harden ui peers, csp and rate-limit ip ([#8](https://github.com/Genoux/ib-toolkit/issues/8)) ([4ad992c](https://github.com/Genoux/ib-toolkit/commit/4ad992c96181a21c3dbee0bb542d9afe32163deb))

## [0.1.2](https://github.com/Genoux/ib-toolkit/compare/standards-v0.1.1...standards-v0.1.2) (2026-09-30)


### Bug Fixes

* resolve workspace ranges from manifests on publish ([#5](https://github.com/Genoux/ib-toolkit/issues/5)) ([0f4328e](https://github.com/Genoux/ib-toolkit/commit/0f4328eb0897501380880f429a952d9d228563a2))

## [0.1.1](https://github.com/Genoux/ib-toolkit/compare/standards-v0.1.0...standards-v0.1.1) (2026-09-30)


### Bug Fixes

* ship compiled js from core and next ([#3](https://github.com/Genoux/ib-toolkit/issues/3)) ([8fef50a](https://github.com/Genoux/ib-toolkit/commit/8fef50aa87679bcf3c328fe4ca11a351434e2dda))
