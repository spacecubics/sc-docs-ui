# Full-document extension

Generate one HTML document per Antora component version, with a toolbar switch between individual pages and the full document.
Requires Node.js 24 and Antora 3.2 or newer.

## Use

1. Install the extension in your documentation repository. Replace `<tag>` with the UI release tag:

   ```sh
   pnpm add -D https://github.com/spacecubics/sc-docs-ui/releases/download/<tag>/sc-docs-mega.tgz
   ```

2. Enable it in the Antora playbook, alongside the UI bundle from the same release:

   ```yaml
   antora:
     extensions:
       - require: '@spacecubics/antora-mega'
   ```

3. Build the site with Antora. The toolbar switch appears only on pages included in a generated full document.

By default, all component versions except `top` are included. Navigation order is preserved, with other published pages appended as supplementary chapters.
Images, attachments, and cross-references are resolved by Antora Assembler.
The document title and top-level navigation groups use `h1` headings in the full document;
headings within each group start at `h2` and follow the navigation and section hierarchy.
Without JavaScript, the full document and mode links remain usable.

Optional playbook settings:

```yaml
antora:
  extensions:
    - require: '@spacecubics/antora-mega'
      components: ['**@my-product']
      build_dir: ./build/mega
```

`components` accepts Assembler component-version patterns. `build_dir` contains the assembled AsciiDoc retained for inspection.

## Development

From the repository root, inside `nix develop`:

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm run bundle:mega
```

The release artifacts are `build/ui-bundle.zip` and `build/sc-docs-mega.tgz`.
Build the UI first: its clean step removes `build/`.
