'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Sparkles, Loader2 } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  // Equipment/context passed to the AI cleanup endpoint so the summary
  // is written like an HVAC tech's report, not generic dictation.
  cleanupContext?: string
}

// Uses the browser's built-in Web Speech API for dictation — free,
// works offline-ish (device does the recognition), no API key needed.
// Gloves-friendly: one big tap-to-talk button instead of typing.
export default function VoiceTextarea({ value, onChange, placeholder, rows = 4, cleanupContext }: Props) {
  const [recording, setRecording] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + ' '
      }
      onChange((value ? value + ' ' : '') + transcript.trim())
    }
    recognition.onend = () => setRecording(false)
    recognitionRef.current = recognition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function toggleRecording() {
    if (!recognitionRef.current) return
    if (recording) {
      recognitionRef.current.stop()
      setRecording(false)
    } else {
      recognitionRef.current.start()
      setRecording(true)
    }
  }

  async function cleanUpWithAI() {
    if (!value.trim()) return
    setCleaning(true)
    try {
      const res = await fetch('/api/notes/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: value, context: cleanupContext }),
      })
      const data = await res.json()
      if (data.cleaned) onChange(data.cleaned)
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140] resize-none"
      />
      <div className="flex gap-2 mt-2">
        {supported && (
          <button
            type="button"
            onClick={toggleRecording}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium min-h-[44px] ${
              recording ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {recording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {recording ? 'Stop' : 'Talk to app'}
          </button>
        )}
        <button
          type="button"
          onClick={cleanUpWithAI}
          disabled={cleaning || !value.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 disabled:opacity-50 min-h-[44px]"
        >
          {cleaning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Clean up into report language
        </button>
      </div>
    </div>
  )
}
