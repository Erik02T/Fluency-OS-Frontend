"use client"

import * as React from "react"
import { Pause, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function resolveAudioSource(value?: string | null) {
  const source = value?.trim()
  if (!source) return null

  try {
    if (source.startsWith("/") && !source.startsWith("//")) {
      const base = "https://local.invalid"
      const url = new URL(source, base)
      return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : null
    }
    const url = new URL(source)
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}

export function CatalogAudio({ src, subject }: { src?: string | null; subject: string }) {
  const source = resolveAudioSource(src)
  return source ? <AudioPlayer key={source} source={source} subject={subject} /> : null
}

function AudioPlayer({ source, subject }: { source: string; subject: string }) {
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const starting = React.useRef(false)
  const [isStarting, setIsStarting] = React.useState(false)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    const audio = audioRef.current
    return () => audio?.pause()
  }, [])

  async function togglePlayback() {
    const audio = audioRef.current
    if (!audio || starting.current) return
    if (!audio.paused && !audio.ended) {
      audio.pause()
      return
    }

    starting.current = true
    setIsStarting(true)
    setHasError(false)
    try {
      if (audio.error) audio.load()
      await audio.play()
    } catch {
      setHasError(true)
    } finally {
      starting.current = false
      setIsStarting(false)
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <audio
        ref={audioRef}
        src={source}
        preload="none"
        aria-hidden="true"
        onPlaying={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false)
          setHasError(true)
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`${isPlaying ? "Pausar áudio de" : "Ouvir áudio de"} ${subject}`}
        aria-busy={isStarting}
        onClick={() => void togglePlayback()}
      >
        {isPlaying ? <Pause aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
        {isStarting ? "Carregando áudio…" : isPlaying ? "Pausar" : "Ouvir"}
      </Button>
      {hasError && <p role="alert" className="text-sm text-muted-foreground">Não foi possível reproduzir o áudio. Tente ouvir novamente.</p>}
    </div>
  )
}
