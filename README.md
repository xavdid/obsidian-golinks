# Obsidian GoLinks

This is a simple [Obsidian](https://obsidian.md) plugin for rendering plaintext [GoLinks](https://www.golinks.io/) (like go/links) so that they're clickable.

## Features

- Makes go/links clickable in all Obsidian modes:
  - Reading mode
  - Source editor mode
  - Live Preview mode
- Ignores go/links in code blocks and backticks
- Handles links with or without protocols (go/link or https://go/link)

## Demo

![](https://cdn.zappy.app/23089211a24fdb8588cb0353366521e6.png)

```markdown
This plugin renders plaintext go/links as clickable! It ignores links in `go/backticks` and links that have already been [go/linkified](http://go/linkified).

> It also works in go/blockquotes, and...

- it
- works
- in
- go/lists!
- neat, right?

Lastly, you can paste https://go/full-links that get handled too!
```

## Installation

### Easiest: Plugin Directory

This plugin can be installed from the [Obsidian Plugins directory](https://obsidian.md/plugins?search=golinks)!

You can also click this link to open the page directly in Obsidian: https://obsidian.md/plugins?id=obsidian-golinks

### Medium: From Releases

1. create the `path/to/your/vault/.obsidian/plugins/obsidian-golinks` folder
1. go to the latest [GitHub release](https://github.com/xavdid/obsidian-golinks/releases)
1. download the `main.js` and `manifest.json`
1. move both of those files to the folder created in step 1
1. in Obsidian settings, enable the plugin like normal

### Most Involved: Build From Source

1. clone this repo into `path/to/your/vault/.obsidian/plugins/obsidian-golinks`
2. in that folder install dependencies by running `yarn`
3. build w/ `yarn build`
4. in Obsidian settings, enable the plugin like normal

## Considerations

There is no risk of data loss when using this plugin. As it only acts on the markdown rendering process, the worst it can do is make your reading view not show some of your text (or show it incorrectly). If this happens, disable the extension and please file [an issue](https://github.com/xavdid/obsidian-golinks/issues).

No data is sent off your machine, so this plugin is perfectly safe to use in corporate contexts. It's basically just some regex.

## Releasing New Versions

Run `just release` to make it all happen.

Under the hood, it:

- runs the build
- updates manifest files
- generates a github release with those files

## Contributors

- [David Brownman (@xavdid)](https://xavd.id) - Original author
- [Alex Mittell (@amittell)](https://github.com/amittell) - Added support for go/links in editor mode