# Build steps

## To build dist/debugAdapter.js

npx webpack

## To release the vscode extension

- Increase version in package.json
- Update CHANGELOG.md
- Run `vsce package` to get the vsix
- To test it use 'Install from VSIX' in VS Code command palette (distribute this)
- To publish `vsce publish` (don't do this since it is an internal extension)
