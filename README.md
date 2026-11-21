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
- `includes/Abilities.php`: the AI agent tools, registered as WordPress Abilities (see below).
- `src/`: React admin SPAs (Specifications, Groups, Mapping, Settings, product metabox).
- `assets/`: SCSS/CSS/JS sources and compiled `dist/`.
- `build/`: compiled React bundles.

## AI agent tools (MCP)

Since 1.0.10, Specifico registers 21 tools (`specifico/*`) through the WordPress
Abilities API (WordPress 6.9+). The official
[MCP Adapter](https://wordpress.org/plugins/mcp-adapter/) plugin serves them to
MCP clients on `/wp-json/mcp/specifico`, and also on its default server at
`/wp-json/mcp/mcp-adapter-default-server`. Specifico doesn't bundle the adapter
or run its own server. The tools are off by default: nothing is registered until
**Allow AI agents** is turned on in Specifico → Settings, and the
`specifico_ai_agents_enabled` filter can force it either way. Each tool checks
the same capability as the matching `specifico/v1` REST route, and every write
accepts `dry_run`.

To configure a client:

1. Install and activate the MCP Adapter plugin.
2. Turn on **Allow AI agents** in Specifico → Settings and save.
3. Create an application password for a user who can manage Specifico.
4. Build the sign-in header from `username:application-password`:

   ```bash
   # macOS / Linux
   printf '%s' 'username:xxxx xxxx xxxx xxxx xxxx xxxx' | base64
   ```

   ```powershell
   # Windows PowerShell
   [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('username:xxxx xxxx xxxx xxxx xxxx xxxx'))
   ```

5. Add the server to your client. Claude Code:

   ```bash
   claude mcp add --transport http --scope user specifico https://example.com/wp-json/mcp/specifico --header "Authorization: Basic BASE64_TOKEN"
   ```

   Codex (`~/.codex/config.toml`):

   ```toml
   [mcp_servers.specifico]
   url = "https://example.com/wp-json/mcp/specifico"
   http_headers = { Authorization = "Basic BASE64_TOKEN" }
   ```

   Cursor (`.cursor/mcp.json`) and VS Code (`.vscode/mcp.json`, with
   `"servers"` and `"type": "http"`) take the same URL and an
   `Authorization` entry under `headers`.

A 401 almost always means the raw application password or a `Bearer` token was
sent instead of `Basic` plus the Base64 string. Full setup, the tool list and
troubleshooting are in the
[AI agents docs](https://www.wpaxiom.com/docs/specifico/ai-agents).

## Links

- Plugin home: https://wpaxiom.com/plugins/specifico
- Part of the [WPaxiom](https://wpaxiom.com) plugin line (Specifico, Axiom Blocks, Cartick).
