/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi } from "@opencode-ai/plugin/tui"
import { createSignal, Show } from "solid-js"

const ID = "llama-status"
const INTERVAL_MS = 500

type Llama = { state: string; progress?: number; tps?: number; tg3s?: number }
type Snapshot = { llama: Llama | undefined; error: string | null; loaded: boolean }

function View(props: { api: TuiPluginApi; snap: () => Snapshot }) {
  const theme = () => props.api.theme.current

  function dot(s: Snapshot) {
    const t = theme()
    if (s.error) return t.error
    switch (s.llama?.state) {
      case "gen":
        return t.success
      case "prompt":
        return t.info
      case "loading":
        return t.warning
      default:
        return t.textMuted
    }
  }

  function label(s: Snapshot) {
    if (s.error) return "nvtop-web offline"
    const l = s.llama
    if (!l) return ""
    switch (l.state) {
      case "off":
        return "stopped"
      case "loading":
        return "loading model"
      case "idle":
        return "idle"
      case "prompt": {
        const bits: string[] = []
        if (l.progress != null) bits.push(`${Math.round(l.progress * 100)}%`)
        if (l.tps != null) bits.push(`${l.tps.toFixed(1)} t/s`)
        return bits.length ? `prompt ${bits.join(" · ")}` : "prompt"
      }
      case "gen":
        return l.tg3s != null ? `gen ${l.tg3s.toFixed(1)} t/s` : "gen"
      default:
        return l.state
    }
  }

  const visible = () => {
    const s = props.snap()
    return s.loaded && (s.llama != null || s.error != null)
  }

  return (
    <Show when={visible()}>
      <box flexDirection="row" gap={1}>
        <text style={{ fg: dot(props.snap()) }}>&#8226;</text>
        <text fg={theme().text}>{label(props.snap())}</text>
      </box>
    </Show>
  )
}

const tui: TuiPlugin = async (api, options) => {
  const raw =
    (options && typeof options.url === "string" ? options.url : undefined) ??
    process.env.NVWEB_URL ??
    "http://localhost:8090"
  const base = raw.replace(/\/+$/, "")
  const endpoint = base.includes("/api/") ? base : `${base}/api/gpus`

  const [snap, setSnap] = createSignal<Snapshot>({ llama: undefined, error: null, loaded: false })

  const tick = async () => {
    try {
      const res = await fetch(endpoint, { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { llama?: Llama; error?: string | null }
      setSnap({ llama: json.llama, error: json.error ?? null, loaded: true })
    } catch (e) {
      setSnap({ llama: undefined, error: e instanceof Error ? e.message : String(e), loaded: true })
    }
  }

  void tick()
  const timer = setInterval(tick, INTERVAL_MS)

  api.slots.register({
    order: 600,
    slots: {
      session_prompt_right() {
        return <View api={api} snap={snap} />
      },
    },
  })

  api.lifecycle.onDispose(() => clearInterval(timer))
}

export default { id: ID, tui }
