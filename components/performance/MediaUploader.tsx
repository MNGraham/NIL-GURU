'use client'

import { useRef, useState, useCallback } from 'react'

export interface PendingFile {
  id: string           // local temp id
  file: File
  previewUrl: string | null   // data-URL for images
  uploading: boolean
  storagePath: string | null  // set after upload succeeds
  error: string | null
}

interface Props {
  files: PendingFile[]
  onChange: (files: PendingFile[]) => void
  disabled?: boolean
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
const MAX_FILE_MB = 50

function uid() {
  return Math.random().toString(36).slice(2)
}

export default function MediaUploader({ files, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function addFiles(incoming: FileList | null) {
    if (!incoming) return
    const next: PendingFile[] = [...files]

    Array.from(incoming).forEach((file) => {
      if (!ACCEPTED.includes(file.type)) return
      if (file.size > MAX_FILE_MB * 1024 * 1024) return

      const isImage = file.type.startsWith('image/')
      const previewUrl = isImage ? URL.createObjectURL(file) : null

      next.push({
        id: uid(),
        file,
        previewUrl,
        uploading: false,
        storagePath: null,
        error: null,
      })
    })

    onChange(next)
  }

  function remove(id: string) {
    const target = files.find((f) => f.id === id)
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
    onChange(files.filter((f) => f.id !== id))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [files])   // eslint-disable-line react-hooks/exhaustive-deps

  function formatBytes(n: number) {
    if (n < 1024) return `${n} B`
    if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
    return `${(n / 1024 ** 2).toFixed(1)} MB`
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${dragging
            ? 'border-indigo-400 bg-indigo-950/40'
            : 'border-gray-700 hover:border-gray-500 bg-gray-900/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="hidden"
          disabled={disabled}
          onChange={(e) => addFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <UploadIcon />
          <p className="text-sm text-gray-300 font-medium">
            {dragging ? 'Drop files here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-gray-500">
            Images & videos up to {MAX_FILE_MB} MB each
          </p>
        </div>
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((f) => (
            <li
              key={f.id}
              className="relative group bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
            >
              {f.previewUrl ? (
                <img
                  src={f.previewUrl}
                  alt={f.file.name}
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="w-full h-24 flex items-center justify-center">
                  <VideoIcon />
                </div>
              )}

              {/* Overlay info */}
              <div className="px-2 py-1.5">
                <p className="text-xs text-gray-300 truncate">{f.file.name}</p>
                <p className="text-xs text-gray-500">{formatBytes(f.file.size)}</p>
              </div>

              {/* Status badges */}
              {f.uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-xs text-white">Uploading…</span>
                </div>
              )}
              {f.error && (
                <div className="absolute bottom-0 inset-x-0 bg-red-900/80 px-2 py-1">
                  <span className="text-xs text-red-300">{f.error}</span>
                </div>
              )}
              {f.storagePath && (
                <div className="absolute top-1.5 right-1.5 bg-green-600 rounded-full p-0.5">
                  <CheckIcon />
                </div>
              )}

              {/* Remove button */}
              {!f.uploading && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); remove(f.id) }}
                  className="absolute top-1.5 left-1.5 bg-black/60 hover:bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove file"
                >
                  <XIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function UploadIcon() {
  return (
    <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
