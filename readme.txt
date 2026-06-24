=== Specifico – Product Specification for WooCommerce ===
Contributors: wpaxiom
Tags: woocommerce, product specification, specifications table, Product Information, ecommerce
Requires at least: 5.8
Tested up to: 7.0
WC requires at least: 6.3
WC tested up to: 10.7
Requires PHP: 7.4
Stable tag: 1.0.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Display product specification tables on WooCommerce product pages with grouped attributes, category mapping, and per-product overrides.

== Description ==
Specifico is a powerful WordPress plugin designed to showcase product specifications for WooCommerce products. It allows you to display a structured specification table for each product, enhancing the user experience and providing detailed product information at a glance.

Instead of re-entering the same specs for every product, you build reusable attribute groups and specification tables once, then map them to categories, tags, or individual products. Each product can inherit those values automatically or override them when it needs something different.

= Key Features =
* Structured specification tables shown in a dedicated "Specifications" tab on the product page.
* Reusable attribute groups so common specs (Dimensions, Materials, Connectivity, etc.) are defined once and reused everywhere.
* Category, tag, and per-product mapping rules to decide which table each product uses — no manual assignment needed.
* Per-product overrides: inherit values from the mapped table, or customize values for a single product while labels stay locked to the mapping.
* Show/Hide toggle for inherited fields so the table stays tidy in the product editor.
* Customizable table styles via the Settings page.
* Built for WooCommerce and compatible with HPOS (High-Performance Order Storage).

= How to Use =
After activating the plugin (WooCommerce must be active), you'll find Specifico under its own admin menu. The typical workflow:

1. **Create attribute groups** — Go to *Specifico → Groups* and add a group (for example, "Dimensions"). Add the attributes that belong to it, such as Height, Width, and Weight.
2. **Build a specification table** — Go to *Specifico → Specifications* and create a table. Add one or more groups to it to assemble the full set of specs for a type of product.
3. **Map tables to products** — Go to *Specifico → Mapping* and create rules that assign a specification table to products by category, tag, or specific product ID. Products matching a rule automatically use that table.
4. **Adjust a single product (optional)** — On the WooCommerce product edit screen, open the *Specification Settings* panel. Enable the Specifications tab, then either inherit the mapped values or switch to "Customize" to set per-product values.
5. **Style the table** — Go to *Specifico → Settings* to choose the table style that best matches your theme.

The specification table then appears automatically in the "Specifications" tab on the front-end product page.

== Installation ==
1. Upload the plugin files to the `/wp-content/plugins/specifico` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Make sure WooCommerce is installed and activated for the plugin to work.

== Frequently Asked Questions ==

= Does this plugin require WooCommerce? =
Yes, Specifico is designed exclusively for WooCommerce product pages.

= Can I customize the specification table? =
Yes, you can customize the look and content of the product specification table via plugin settings and templates.

= Is Specifico compatible with the latest version of WooCommerce? =
Yes, Specifico has been tested with WooCommerce up to latest version.

== Screenshots ==
1. Specification Table List
2. Groups List
3. Add Group Page
4. Specification Mapping Page
5. Specification Settings Page
6. Specification add/edit panel

== Source Code ==

Specifico's admin interface is built with React and compiled with webpack via @wordpress/scripts. The minified bundles shipped in `build/` and `assets/dist/` are generated from the human-readable source code in `src/` (React) and `assets/src/` (SCSS/JS). The complete, unminified source is publicly available at:

https://github.com/wpaxiom/specifico

To build the plugin from source:

1. `composer install` — install PHP dependencies.
2. `npm install` — install the JavaScript build dependencies.
3. `npm run build` — compile `src/` and `assets/src/` into `build/` and `assets/dist/`.

== Changelog ==

= 1.0.2 =
* New: Theme template override support — copy `templates/specification-table.php` into your theme (`yourtheme/specifico/`) to fully customize the specification table markup.
* New: Developer hooks for the specification table — `specifico_table_groups`, `specifico_tab_title`, `specifico_show_table`, `specifico_table_classes`, `specifico_row_label`, `specifico_row_value`, and `specifico_before_table`/`specifico_after_table`.
* New: `[specifico]` shortcode to display a product's specification table anywhere, including the block editor (use `[specifico id="123"]` for a specific product).
* New: Setting to customize the Specifications tab title.
* New: Setting to keep, always remove, or remove-only-when-specs-exist for WooCommerce's default "Additional information" tab.
* New: Documentation link on the Plugins screen.
* Fix: Mapping screen no longer locks the Values field — existing mappings are editable, and changing the Type refreshes the available values.
* Improve: Consistent field and button heights, dashed section separators, and focus styles across all admin screens.
* Improve: Expanded readme with a feature overview and a step-by-step usage guide.

= 1.0.1 =
* New: Per-product value overrides in "Inherit from mapping" mode — labels stay locked to the mapping while values are editable for each product.
* New: Show/Hide toggle for inherited fields in the product metabox so the table stays collapsed by default.
* New: "Start over" link in Customize mode to swap between starting blank or copying an existing table after a choice has been made.
* Improve: Replaced the Add/Edit Specification modal with an inline panel matching the Groups screen for a consistent admin experience.
* Improve: Cancel button on Add/Edit forms; Save is disabled until the title is filled.
* Improve: Row action menu now has pencil/trash icons, closes on outside click, and auto-closes after picking an action.
* Improve: Themed MultiSelect chips, dropdown options, and focus states to match the plugin palette; dropped the redundant clear-all X (per-chip X kept).
* Improve: Pagination simplified to "1-10 of N" with chevron prev/next controls.
* Improve: Mapping page rows now have placeholder hints, larger fields, and a properly sized delete button.
* Improve: Semibold table headers and dashed separators between Add/Edit form sections.
* Fix: Plugin styles no longer leak into the WordPress dashboard — buttons no longer briefly show an unexpected border on first load of unrelated admin pages.
* Fix: Add/Edit form fields no longer carry the previously edited title when switching from Edit to Add.
* Fix: Row action dropdown now closes after clicking Edit (no more lingering menu behind the form).
* Fix: Dashed row separators on Mapping and Add Group screens render correctly.
* Fix: Toggle switch knob now visually slides when toggled.
* Dev: Upgraded @wordpress/scripts to v32.2 (clears 36 of 55 dependency alerts including the critical), dropped the unused `tailwind` and `react-modal` packages, scoped Tailwind utilities to a `.specifico-app` wrapper, and added `npm run make-zip` for release packaging

= 1.0.0 =
* Initial release.

== License ==
This plugin is licensed under the GPLv2 or later.
