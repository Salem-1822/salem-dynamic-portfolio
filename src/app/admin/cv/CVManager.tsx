'use client'

import { useState, useEffect, useRef, useActionState } from 'react'
import {
  uploadCVAction,
  activateCVAction,
  deleteCVAction,
  type CVActionResult,
} from './actions'
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Trash2,
  Eye,
  Download,
  ExternalLink,
  Check,
  ShieldCheck,
} from 'lucide-react'
import type { CV } from '@prisma/client'

type CVWithAdmin = CV & {
  admin: {
    email: string
  }
}

interface CVManagerProps {
  cvs: CVWithAdmin[]
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

export default function CVManager({ cvs }: CVManagerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<{
    name: string
    size: number
  } | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [showInlinePreview, setShowInlinePreview] = useState(false)
  const [banner, setBanner] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [uploadState, uploadAction, isUploadPending] = useActionState(
    uploadCVAction,
    null
  )
  const [activateState, activateAction, isActivatePending] = useActionState(
    activateCVAction,
    null
  )
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteCVAction,
    null
  )

  const applyFeedback = (state: CVActionResult | null, resetFile = false) => {
    if (!state) return
    if (state.success && state.message) {
      setBanner({ type: 'success', text: state.message })
      if (resetFile) {
        setSelectedFile(null)
        setClientError(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } else if (!state.success && state.error) {
      setBanner({ type: 'error', text: state.error })
    }
  }

  useEffect(() => {
    applyFeedback(uploadState, true)
  }, [uploadState])

  useEffect(() => {
    applyFeedback(activateState)
  }, [activateState])

  useEffect(() => {
    applyFeedback(deleteState)
  }, [deleteState])

  const activeCV = cvs.find((cv) => cv.isActive) ?? null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientError(null)
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    if (file.type !== 'application/pdf') {
      setClientError('Only PDF files (application/pdf) are permitted.')
      setSelectedFile(null)
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setClientError('Maximum file size is 5MB.')
      setSelectedFile(null)
      e.target.value = ''
      return
    }

    setSelectedFile({ name: file.name, size: file.size })
  }

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Feedback Banner */}
      {(banner || clientError) && (
        <div
          className={`p-4 rounded-md flex items-center justify-between gap-2 border ${
            clientError || banner?.type === 'error'
              ? 'bg-red-950/60 border-red-800/80 text-red-300'
              : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {clientError || banner?.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{clientError || banner?.text}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setBanner(null)
              setClientError(null)
            }}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active CV Spotlight */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] uppercase tracking-wider text-neutral-400">
                Active Public Curriculum Vitae
              </span>
            </div>

            {activeCV ? (
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{activeCV.fileName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 border border-emerald-700/70 text-emerald-300">
                    LIVE
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Size: {formatBytes(activeCV.fileSize)} &bull; Uploaded:{' '}
                  {new Date(activeCV.uploadedAt).toLocaleString()} &bull; By:{' '}
                  {activeCV.admin.email}
                </p>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                No active CV selected. Upload a PDF or activate an existing version below.
              </p>
            )}
          </div>

          {activeCV && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowInlinePreview(!showInlinePreview)}
                className="px-3.5 py-2 rounded border border-neutral-700 bg-neutral-950 text-neutral-200 hover:bg-neutral-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showInlinePreview ? 'Hide Preview' : 'Preview PDF'}</span>
              </button>

              <a
                href={activeCV.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded border border-neutral-700 bg-neutral-950 text-neutral-200 hover:bg-neutral-800 transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open</span>
              </a>

              <a
                href={activeCV.fileUrl}
                download={activeCV.fileName}
                className="px-3.5 py-2 rounded bg-white text-black font-semibold hover:bg-neutral-200 transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          )}
        </div>

        {activeCV && showInlinePreview && (
          <div className="pt-4 border-t border-neutral-800">
            <div className="rounded overflow-hidden border border-neutral-800 bg-neutral-950 h-[560px]">
              <iframe
                src={activeCV.fileUrl}
                title={`Preview ${activeCV.fileName}`}
                className="w-full h-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Upload New CV Card */}
      <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-6 space-y-4">
        <div className="border-b border-neutral-800/80 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-neutral-400" />
            <span>Upload New PDF Document</span>
          </h3>
          <p className="text-[11px] text-neutral-500 mt-1">
            Files are streamed to Cloudinary (<code className="text-neutral-300">portfolio/cv</code>). Strict limit: PDF only, max 5MB.
          </p>
        </div>

        <form action={uploadAction} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-neutral-400 mb-1.5">
              Select Resume / CV File (.pdf) *
            </label>
            <input
              ref={fileInputRef}
              name="cvFile"
              type="file"
              accept="application/pdf,.pdf"
              required
              disabled={isUploadPending}
              onChange={handleFileChange}
              className="w-full p-2.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border file:border-neutral-700 file:text-xs file:font-mono file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 cursor-pointer disabled:opacity-50"
            />
            {selectedFile && (
              <p className="text-[11px] text-emerald-400 mt-1.5">
                Ready: {selectedFile.name} ({formatBytes(selectedFile.size)})
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isUploadPending || !!clientError}
            className="px-5 py-3 rounded bg-white text-black font-semibold uppercase tracking-wider hover:bg-neutral-200 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isUploadPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CV</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Uploaded CVs Inventory */}
      <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 overflow-hidden">
        <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            Stored CV Versions ({cvs.length})
          </h3>
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
            Cloudinary Vault
          </span>
        </div>

        <div className="divide-y divide-neutral-800/60">
          {cvs.length === 0 ? (
            <div className="p-10 text-center text-neutral-600">
              No CV files uploaded yet.
            </div>
          ) : (
            cvs.map((cv) => (
              <div
                key={cv.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-900/50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white truncate max-w-xs">
                        {cv.fileName}
                      </span>
                      {cv.isActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-semibold">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 border border-neutral-700 text-neutral-400">
                          ARCHIVED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      {formatBytes(cv.fileSize)} &bull; Uploaded{' '}
                      {new Date(cv.uploadedAt).toLocaleString()} &bull; {cv.admin.email}
                    </p>
                    <p className="text-[10px] text-neutral-600 truncate mt-0.5">
                      publicId: {cv.publicId}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {!cv.isActive && (
                    <form action={activateAction}>
                      <input type="hidden" name="id" value={cv.id} />
                      <button
                        type="submit"
                        disabled={isActivatePending}
                        className="px-3 py-1.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-white hover:text-black transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Set Active</span>
                      </button>
                    </form>
                  )}

                  <a
                    href={cv.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:border-neutral-700 transition flex items-center gap-1.5"
                    title="Preview PDF"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View</span>
                  </a>

                  <a
                    href={cv.fileUrl}
                    download={cv.fileName}
                    className="px-3 py-1.5 rounded border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:border-neutral-700 transition flex items-center gap-1.5"
                    title="Download PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>

                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={cv.id} />
                    <button
                      type="submit"
                      disabled={isDeletePending}
                      className="p-2 rounded border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-red-400 hover:border-red-900/60 transition disabled:opacity-50 cursor-pointer"
                      title="Delete CV"
                      onClick={(e) => {
                        if (
                          !confirm(
                            `Delete "${cv.fileName}" permanently from Cloudinary and database?`
                          )
                        ) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
