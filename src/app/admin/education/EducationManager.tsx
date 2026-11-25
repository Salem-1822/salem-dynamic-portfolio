'use client'

import { useState, useActionState } from 'react'
import {
  createEducationAction,
  updateEducationAction,
  deleteEducationAction,
} from './actions'
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  GraduationCap,
  Calendar,
} from 'lucide-react'
import { Education } from '@prisma/client'

interface EducationManagerProps {
  educations: Education[]
}

function formatDateForInput(date: Date | string | null): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export default function EducationManager({ educations }: EducationManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingItem, setEditingItem] = useState<Education | null>(null)
  const [isCurrentActive, setIsCurrentActive] = useState(false)

  const [createState, createAction, isCreatePending] = useActionState(createEducationAction, null)
  const [updateState, updateAction, isUpdatePending] = useActionState(updateEducationAction, null)
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteEducationAction, null)

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(createState?.message || updateState?.message || deleteState?.message) && (
        <div className="p-4 rounded-md bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{createState?.message || updateState?.message || deleteState?.message}</span>
        </div>
      )}

      {(createState?.error || updateState?.error || deleteState?.error) && (
        <div className="p-4 rounded-md bg-red-950/60 border border-red-800/80 text-red-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{createState?.error || updateState?.error || deleteState?.error}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
          {educations.length} Academic Milestone(s)
        </span>
        <button
          onClick={() => {
            setIsCreating(!isCreating)
            setEditingItem(null)
            setIsCurrentActive(false)
          }}
          className="px-4 py-2 rounded bg-white text-black font-mono text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition flex items-center gap-2 cursor-pointer"
        >
          {isCreating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isCreating ? 'Cancel' : 'Add Education'}</span>
        </button>
      </div>

      {/* Create Card */}
      {isCreating && (
        <div className="p-6 rounded-lg border border-neutral-800 bg-neutral-900/90 font-mono text-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
            <span className="font-bold uppercase tracking-wider text-white">Add Education History</span>
            <button onClick={() => setIsCreating(false)} className="text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form action={createAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1">Institution *</label>
              <input
                name="institution"
                type="text"
                required
                placeholder="e.g. OFPPT Marrakech"
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Degree Title *</label>
              <input
                name="degree"
                type="text"
                required
                placeholder="e.g. Diplôme de Technicien Spécialisé"
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1">Field of Study *</label>
              <input
                name="fieldOfStudy"
                type="text"
                required
                placeholder="e.g. Digital Development - Web Full Stack"
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Start Date *</label>
              <input
                name="startDate"
                type="date"
                required
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">End Date</label>
              <input
                name="endDate"
                type="date"
                disabled={isCurrentActive}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500 disabled:opacity-40"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isCurrentNew"
                name="isCurrent"
                type="checkbox"
                checked={isCurrentActive}
                onChange={(e) => setIsCurrentActive(e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-white focus:ring-0"
              />
              <label htmlFor="isCurrentNew" className="text-neutral-400 select-none">
                Currently Enrolled / In Progress
              </label>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Display Order</label>
              <input
                name="displayOrder"
                type="number"
                defaultValue={0}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1">Program Details & Achievements</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Key competencies, software architectures studied, major coursework..."
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 font-sans text-xs"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isCreatePending}
                className="py-2 px-5 rounded bg-white text-black font-semibold uppercase tracking-wider hover:bg-neutral-200 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isCreatePending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Milestone'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Card */}
      {editingItem && (
        <div className="p-6 rounded-lg border border-neutral-700 bg-neutral-900/90 font-mono text-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
            <span className="font-bold uppercase tracking-wider text-white">
              Edit Education: {editingItem.institution}
            </span>
            <button onClick={() => setEditingItem(null)} className="text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form action={updateAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="hidden" name="id" value={editingItem.id} />

            <div>
              <label className="block text-neutral-400 mb-1">Institution *</label>
              <input
                name="institution"
                type="text"
                required
                defaultValue={editingItem.institution}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Degree Title *</label>
              <input
                name="degree"
                type="text"
                required
                defaultValue={editingItem.degree}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1">Field of Study *</label>
              <input
                name="fieldOfStudy"
                type="text"
                required
                defaultValue={editingItem.fieldOfStudy}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Start Date *</label>
              <input
                name="startDate"
                type="date"
                required
                defaultValue={formatDateForInput(editingItem.startDate)}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">End Date</label>
              <input
                name="endDate"
                type="date"
                defaultValue={formatDateForInput(editingItem.endDate)}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isCurrentEdit"
                name="isCurrent"
                type="checkbox"
                defaultChecked={editingItem.isCurrent}
                className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-white focus:ring-0"
              />
              <label htmlFor="isCurrentEdit" className="text-neutral-400 select-none">
                Currently Enrolled / In Progress
              </label>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Display Order</label>
              <input
                name="displayOrder"
                type="number"
                defaultValue={editingItem.displayOrder}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1">Program Details & Achievements</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={editingItem.description || ''}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500 font-sans text-xs"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="py-2 px-4 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatePending}
                className="py-2 px-5 rounded bg-white text-black font-semibold uppercase tracking-wider hover:bg-neutral-200 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isUpdatePending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="space-y-4 font-mono text-xs">
        {educations.length === 0 ? (
          <div className="p-12 text-center text-neutral-600 border border-neutral-800/80 rounded-lg">
            No academic qualifications recorded yet.
          </div>
        ) : (
          educations.map((edu) => (
            <div
              key={edu.id}
              className="p-5 rounded-lg border border-neutral-800/80 bg-neutral-900/40 space-y-3 hover:border-neutral-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-neutral-400" />
                  <div>
                    <h3 className="font-bold text-white text-sm">{edu.degree}</h3>
                    <p className="text-neutral-400">{edu.institution} &bull; {edu.fieldOfStudy}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(edu)
                      setIsCreating(false)
                    }}
                    className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={edu.id} />
                    <button
                      type="submit"
                      disabled={isDeletePending}
                      className="p-1.5 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition disabled:opacity-50"
                      title="Delete"
                      onClick={(e) => {
                        if (!confirm(`Delete "${edu.degree}" at ${edu.institution}?`)) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>

              {edu.description && (
                <p className="text-neutral-300 font-sans text-xs leading-relaxed">
                  {edu.description}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/60 text-[11px] text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-neutral-600" />
                  <span>
                    {new Date(edu.startDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                    })}{' '}
                    -{' '}
                    {edu.isCurrent
                      ? 'Present (Enrolled)'
                      : edu.endDate
                      ? new Date(edu.endDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                        })
                      : 'Completed'}
                  </span>
                </div>
                <span>Order: #{edu.displayOrder}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
