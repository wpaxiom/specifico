# Specifico – Product Specification for WooCommerce

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

## Development

```bash
npm start             # wp-scripts watch (rebuilds React on change)
npm run tailwind      # watch Tailwind utilities → assets/dist/css/admin.css
composer run phpcs    # WordPress Coding Standards lint
```

## Structure

- `specifico.php` — plugin bootstrap (constants, autoload, init).
- `includes/` — PHP (PSR-4 `WpAxiom\Specifico\`): admin, frontend, REST, mapping.
- `src/` — React admin SPAs (Specifications, Groups, Mapping, Settings, product metabox).
- `assets/` — SCSS/CSS/JS sources and compiled `dist/`.
- `build/` — compiled React bundles.

## Links

- Plugin home: https://wpaxiom.com/plugins/specifico
- Part of the [WPaxiom](https://wpaxiom.com) plugin line (Specifico, Axiom Blocks, Cartick).
