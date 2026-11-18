# Space Cubics Documentation UI

Antora UI for Space Cubics documentation.

## Usage

1. Open [Releases](https://github.com/spacecubics/sc-docs-ui/releases) and copy the link to `ui-bundle.zip` for the version you want.
2. Set that URL in your Antora playbook, replacing `<tag>` below with the release tag:

   ```yaml
   ui:
     bundle:
       url: https://github.com/spacecubics/sc-docs-ui/releases/download/<tag>/ui-bundle.zip
   ```

3. Build your documentation site with Antora. The bundle is downloaded automatically.

To enable switching between individual pages and the full document, install and configure the optional [MEGA extension](extensions/mega/README.md).
The mode switch stays hidden when the extension is not enabled or the page has no full-document export.

## Development

Requires Nix with flakes enabled. Run these commands from the repository root:

```sh
nix develop
pnpm install --frozen-lockfile
pnpm run preview
```

Open http://localhost:5252. Changes trigger a rebuild; refresh the browser to view them.

To create `build/ui-bundle.zip`, stop the preview with `Ctrl+C`, then run:

```sh
pnpm run build
```

## Copyright and License

Derived from [Antora Default UI](https://gitlab.com/antora/antora-ui-default), under [MPL-2.0](LICENSE).
Copyright (C) 2017-present OpenDevise Inc. and the Antora Project.
Space Cubics modifications: Copyright (C) 2026 Space Cubics Inc.
Third-party notices are retained in the CSS and SVG assets.
