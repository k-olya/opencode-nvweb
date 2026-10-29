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

## Install (global)

This plugin installs **globally**, so it shows in every opencode session, in any directory.

1. Clone this repo into your global plugin directory:

   ```sh
   git clone git@github.com:k-olya/opencode-nvweb.git ~/.config/opencode/plugins/opencode-nvweb
   ```

2. Register it in your **global** TUI config at `~/.config/opencode/tui.json`. Create the file if it doesn't exist; if it already has plugins, just add this entry to the existing `plugin` array:

   ```json
   {
     "$schema": "https://opencode.ai/tui.json",
     "plugin": [
       [ "./plugins/opencode-nvweb/.opencode/plugins/llama-status.tsx", { "url": "http://localhost:8090" } ]
     ]
   }
   ```

   The path is resolved relative to `~/.config/opencode/`, i.e. it points at the clone from step 1.

3. **Restart opencode.** The status line now appears on the right of the chat input in every session.

### For contributors

If you develop this repo, skip the clone and symlink your checkout into the global plugin dir instead:

   ```sh
   ln -s /absolute/path/to/your/opencode-nvweb ~/.config/opencode/plugins/opencode-nvweb
   ```

The same `tui.json` entry works. Edits to your checkout are picked up on the next opencode start.

## Configuration

| Setting | Where | Default |
| --- | --- | --- |
| Server URL | `url` option in the `tui.json` entry, else `NVWEB_URL` env | `http://localhost:8090` |
| Poll interval (ms) | `INTERVAL_MS` in `.opencode/plugins/llama-status.tsx` | `500` |
| Placement | slot name passed to `api.slots.register(...)` | `session_prompt_right` |

URL precedence: the `tui.json` `url` option wins, then `NVWEB_URL`, then the default. The URL can be a full endpoint (must contain `/api/`) or a base URL — the plugin appends `/api/gpus` if it isn't already present.

## Files

- `.opencode/plugins/llama-status.tsx` — the plugin (polls the API, renders the slot).
- `opencode.json` — project config (schema only; no server plugins).
