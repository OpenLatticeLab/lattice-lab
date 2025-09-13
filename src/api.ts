import type { SceneResponse } from './types'

const API_URL: string = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

export async function uploadCif(file: File): Promise<SceneResponse> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${API_URL}/api/scene`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const msg = await safeError(res)
    throw new Error(msg || `Upload failed (${res.status})`)
  }

  const data = (await res.json()) as SceneResponse
  return data
}

export async function generateFromPrompt(prompt: string): Promise<SceneResponse> {
  const res = await fetch(`${API_URL}/api/prompt-structure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })

  if (res.status === 404 || res.status === 501) {
    throw new Error('Prompt generation not available yet')
  }

  if (!res.ok) {
    const msg = await safeError(res)
    throw new Error(msg || `Generation failed (${res.status})`)
  }

  const data = (await res.json()) as SceneResponse
  return data
}

async function safeError(res: Response): Promise<string | undefined> {
  try {
    const t = await res.text()
    if (!t) return undefined
    try {
      const j = JSON.parse(t)
      return j?.message || j?.detail || j?.error || t
    } catch {
      return t
    }
  } catch {
    return undefined
  }
}

