# Contributing

Thank you for your interest in contributing to this project! I'm likely happy to accept your contribution assuming it doesn't compromise my high bar of UX for the project. When in doubt, feel free to open an issue first!

## Development

This project uses [just](https://github.com/casey/just) for development task. Ensure you've got it installed!

1. clone this repo into `path/to/your/vault/.obsidian/plugins/obsidian-golinks`
2. run `just dev` to start the dev server
3. enable the plugin in Obsidian like normal
4. after making changes, toggle the extension off and on in Obsidian

## Pull Requests

1. before opening a PR, `just ci` passes
2. add a section to the `unreleased` section of the `CHANGELOG`
3. **don't** bump the version; i'll handle that on release
4. open the PR!
