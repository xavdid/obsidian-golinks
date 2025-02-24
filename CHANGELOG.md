# Changelog

This project uses [SemVer](https://semver.org/) for versioning. Its public APIs, runtime support, and documented file locations won't change incompatibly outside of major versions (once version 1.0.0 has been released). There may be breaking changes in minor releases before 1.0.0 and will be noted in these release notes.

## 0.1.5

_released `2025-02-24`_

- add support for golinks that already have protocols, like `https://go/some-link`.

## 0.1.4

_released `2024-02-06`_

- re-release of `0.1.2` with the correct release tag format

## 0.1.3

_released `2024-02-06`_

- re-release of `0.1.2` with the correct files included

## 0.1.2

_released `2024-01-30`_

- Rename plugin to no longer include the word "Obsidian" (fixes [#2](https://github.com/xavdid/obsidian-golinks/issues/2)). This is only a cosmetic change in the plugin directory and involves no functional changes

## 0.1.1

_released `2022-07-07`_

- use better browser API for node replacement, [per review](https://github.com/obsidianmd/obsidian-releases/pull/1035#issuecomment-1177017484)
- improve regex to no longer match links like `bongo/link`
- add some tests

## 0.1.0

_released `2022-07-02`_

- initial public release
