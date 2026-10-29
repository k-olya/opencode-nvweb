# opencode-nvweb

An [opencode](https://opencode.ai) **TUI plugin** that shows the live **llama.cpp** status from a running [nvtop-web](https://github.com/k-olya/nvtop-web) server. It renders as a single line on the right side of the chat input (the `session_prompt_right` slot), so it only appears while you're in a session.

## What it shows

A colored dot + status, e.g.

- `• gen 29.3 t/s`
- `• prompt 45% · 12.0 t/s`
- `• idle`
- `• stopped`

Dot color follows the state: green = generating, blue = prompting, amber = loading model, muted = idle/off, red = server unreachable (renders `• nvtop-web offline`).

## Requirements

- **opencode** (TUI) — the plugin is loaded by the TUI runtime.
- A **running nvtop-web server** exposing `GET /api/gpus` that includes a `llama` field (default target here: `http://localhost:8090`).

The server keeps its own collection rate; the plugin polls it independently (default every **500 ms**) to keep UI lag low.

## Setup

The plugin is already wired up in this repo:

- `.opencode/tui.json` — registers the plugin and its options.
- `.opencode/plugins/llama-status.tsx` — the widget source.

Just run `opencode` from this directory. On first launch, opencode auto-installs its plugin SDK (`@opencode-ai/plugin`) into `.opencode/` (it creates `package.json`, `node_modules/`, `bun.lock`, and a `.gitignore` there). **Restart opencode** after any change to pick it up.

## Configuration

| Setting | Where | Default |
| --- | --- | --- |
| Server URL | `url` option in `.opencode/tui.json`, else `NVWEB_URL` env | `http://localhost:8090` |
| Poll interval (ms) | `INTERVAL_MS` in `.opencode/plugins/llama-status.tsx` | `500` |
| Placement | slot name passed to `api.slots.register(...)` | `session_prompt_right` |

URL precedence: the `tui.json` `url` option wins, then `NVWEB_URL`, then the default. The URL can be a full endpoint (must contain `/api/`) or a base URL — the plugin appends `/api/gpus` if it isn't already present.

Example `.opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    [ "./plugins/llama-status.tsx", { "url": "http://localhost:8090" } ]
  ]
}
```

## Files

- `.opencode/tui.json` — TUI plugin config.
- `.opencode/plugins/llama-status.tsx` — the plugin (polls the API, renders the slot).
- `opencode.json` — project config (schema only; no server plugins).
