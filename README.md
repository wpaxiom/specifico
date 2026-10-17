# Specifico - Product Specification for WooCommerce

Display structured product specification tables on WooCommerce product pages,
with grouped attributes, category/tag mapping rules, and per-product overrides.

- **Requires:** WordPress 5.8+, WooCommerce 6.3+, PHP 7.4+
- **License:** GPLv2 or later

## Build from source

```bash
composer install      # PHP dependencies (generates vendor/autoload.php)
npm install           # JS/build dependencies
npm run build         # compile src/ → build/ and assets, generate POT
```

For a wp.org-style distribution zip:

```bash
npm run make-zip      # produces specifico-<version>.zip (respects .distignore)
```

## Releases

Releases are published on GitHub with the plugin zip attached. To publish one,
push the version tag (for example `1.0.9`), then run the **Release** workflow
from the Actions tab and enter the tag. The workflow checks that the tag matches
the version in `specifico.php` and `readme.txt`, compiles `build/` and
`assets/dist/`, builds the zip from the files `.distignore` allows, and uses that
version's `readme.txt` changelog entry as the release notes. For a release
published after the fact, the optional date input adds the original release date
to the notes.

## Development

```bash
npm start             # wp-scripts watch (rebuilds React on change)
npm run tailwind      # watch Tailwind utilities → assets/dist/css/admin.css
composer run phpcs    # WordPress Coding Standards lint
```

## Structure

- `specifico.php`: plugin bootstrap (constants, autoload, init).
- `includes/`: PHP under the PSR-4 namespace `WpAxiom\Specifico\` (admin, frontend, REST, mapping).
- `src/`: React admin SPAs (Specifications, Groups, Mapping, Settings, product metabox).
- `assets/`: SCSS/CSS/JS sources and compiled `dist/`.
- `build/`: compiled React bundles.

## Links

- Plugin home: https://wpaxiom.com/plugins/specifico
- Part of the [WPaxiom](https://wpaxiom.com) plugin line (Specifico, Axiom Blocks, Cartick).
