# Obsidian GoLinks

This is a simple [Obsidian](https://obsidian.md) plugin for rendering plaintext [GoLinks](https://www.golinks.io/) (like go/links) so that they're clickable.

See [releases](https://github.com/xavdid/obsidian-golinks/releases) for the full changelog.

## Demo

![](https://cdn.zappy.app/42bbacbd01746e5e4e8f5118e2d85b11.png)

```markdown
This plugin renders plaintext go/links as clickable! It ignores links in `go/backticks` and links that have already been [go/linkified](http://go/linkified).

> It also works in go/blockquotes, and...

- it
- works
- in
- go/lists!
- neat, right?
```

## Installation

This plugin can be installed from the Obsidian Plugins directory!

Alternatively, for a manual install:

1. clone this repo into `path/to/your/vault/.obsidian/plugins/obsidian-golinks`
2. in that folder, run `yarn` (or `npm i`)
3. run `yarn build`
4. In Obsidian settings, enable the plugin like normal.

## Considerations

There is no risk of data loss when using this plugin. As it only acts on the markdown rendering process, the worst it can do is make your reading view not show some of your text (or show it incorrectly). If this happens, disable the extension and please file [an issue](https://github.com/xavdid/obsidian-golinks/issues).

No data is sent off your machine, so this plugin is perfectly safe to use in corporate contexts. It's basically just some regex.

## Releasing New Versions

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`
