'use client'

import { useState, useActionState } from 'react'
import {
  createExperienceAction,
  updateExperienceAction,
  deleteExperienceAction,
} from './actions'
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Briefcase,
  Calendar,
  MapPin,
  Tag,
} from 'lucide-react'
import { Experience, Skill, ExperienceSkill } from '@prisma/client'

type ExperienceWithSkills = Experience & {
  skills: (ExperienceSkill & { skill: Skill })[]
}

interface ExperienceManagerProps {
  experiences: ExperienceWithSkills[]
  allSkills: Skill[]
}

function formatDateForInput(date: Date | string | null): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export default function ExperienceManager({
  experiences,
  allSkills,
}: ExperienceManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingItem, setEditingItem] = useState<ExperienceWithSkills | null>(null)
  const [isCurrentActive, setIsCurrentActive] = useState(false)
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])

  const [createState, createAction, isCreatePending] = useActionState(createExperienceAction, null)
  const [updateState, updateAction, isUpdatePending] = useActionState(updateExperienceAction, null)
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteExperienceAction, null)

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const startEditing = (exp: ExperienceWithSkills) => {
    setEditingItem(exp)
    setIsCreating(false)
    setIsCurrentActive(exp.isCurrent)
    setSelectedSkillIds(exp.skills.map((s) => s.skillId))
  }

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
          {experiences.length} Career Role(s)
        </span>
        <button
          onClick={() => {
            setIsCreating(!isCreating)
            setEditingItem(null)
            setIsCurrentActive(false)
            setSelectedSkillIds([])
          }}
          className="px-4 py-2 rounded bg-white text-black font-mono text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition flex items-center gap-2 cursor-pointer"
        >
          {isCreating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isCreating ? 'Cancel' : 'Add Experience'}</span>
        </button>
      </div>

      {/* Create Card */}
      {isCreating && (
        <div className="p-6 rounded-lg border border-neutral-800 bg-neutral-900/90 font-mono text-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
            <span className="font-bold uppercase tracking-wider text-white">Add Career Experience</span>
            <button onClick={() => setIsCreating(false)} className="text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form action={createAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1">Company / Organization *</label>
              <input
                name="company"
                type="text"
                required
                placeholder="e.g. Freelance / Tech Solutions"
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Position / Role *</label>
              <input
                name="position"
                type="text"
                required
                placeholder="e.g. Full-Stack Developer & Software Engineer"
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Location</label>
              <input
                name="location"
                type="text"
                placeholder="e.g. Marrakech, Morocco"
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
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

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="isCurrentExpNew"
                name="isCurrent"
                type="checkbox"
                checked={isCurrentActive}
                onChange={(e) => setIsCurrentActive(e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-white focus:ring-0"
              />
              <label htmlFor="isCurrentExpNew" className="text-neutral-400 select-none">
                Present Role (Currently Working Here)
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1">Role Description & Architectural Achievements *</label>
              <textarea
                name="description"
                rows={4}
                required
                placeholder="Architecture engineered, backend APIs developed, security hardening implemented..."
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 font-sans text-xs"
              />
            </div>

            {/* Multi-Select Skills */}
            <div className="md:col-span-2 border-t border-neutral-800 pt-3">
              <label className="block text-neutral-400 mb-2 uppercase tracking-wider text-[11px]">
                Link Technical Skills
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 rounded bg-neutral-950 border border-neutral-800">
                {allSkills.map((skill) => {
                  const isSelected = selectedSkillIds.includes(skill.id)
                  return (
                    <label
                      key={skill.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition select-none text-[11px] ${
                        isSelected
                          ? 'bg-neutral-800 text-white font-semibold'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="skillIds"
                        value={skill.id}
                        checked={isSelected}
                        onChange={() => toggleSkill(skill.id)}
                        className="rounded border-neutral-700 bg-neutral-900 text-white focus:ring-0"
                      />
                      <span className="truncate">{skill.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isCreatePending}
                className="py-2 px-5 rounded bg-white text-black font-semibold uppercase tracking-wider hover:bg-neutral-200 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isCreatePending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Role'}
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
              Edit Experience: {editingItem.position} @ {editingItem.company}
            </span>
            <button onClick={() => setEditingItem(null)} className="text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form action={updateAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="hidden" name="id" value={editingItem.id} />

            <div>
              <label className="block text-neutral-400 mb-1">Company / Organization *</label>
              <input
                name="company"
                type="text"
                required
                defaultValue={editingItem.company}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Position / Role *</label>
              <input
                name="position"
                type="text"
                required
                defaultValue={editingItem.position}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Location</label>
              <input
                name="location"
                type="text"
                defaultValue={editingItem.location || ''}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
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
                disabled={isCurrentActive}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500 disabled:opacity-40"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="isCurrentExpEdit"
                name="isCurrent"
                type="checkbox"
                checked={isCurrentActive}
                onChange={(e) => setIsCurrentActive(e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-white focus:ring-0"
              />
              <label htmlFor="isCurrentExpEdit" className="text-neutral-400 select-none">
                Present Role (Currently Working Here)
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1">Role Description & Architectural Achievements *</label>
              <textarea
                name="description"
                rows={4}
                required
                defaultValue={editingItem.description}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500 font-sans text-xs"
              />
            </div>

            {/* Multi-Select Skills */}
            <div className="md:col-span-2 border-t border-neutral-800 pt-3">
              <label className="block text-neutral-400 mb-2 uppercase tracking-wider text-[11px]">
                Link Technical Skills
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 rounded bg-neutral-950 border border-neutral-800">
                {allSkills.map((skill) => {
                  const isSelected = selectedSkillIds.includes(skill.id)
                  return (
                    <label
                      key={skill.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition select-none text-[11px] ${
                        isSelected
                          ? 'bg-neutral-800 text-white font-semibold'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="skillIds"
                        value={skill.id}
                        checked={isSelected}
                        onChange={() => toggleSkill(skill.id)}
                        className="rounded border-neutral-700 bg-neutral-900 text-white focus:ring-0"
                      />
                      <span className="truncate">{skill.name}</span>
                    </label>
                  )
                })}
              </div>
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
        {experiences.length === 0 ? (
          <div className="p-12 text-center text-neutral-600 border border-neutral-800/80 rounded-lg">
            No career experience entries found.
          </div>
        ) : (
          experiences.map((exp) => (
            <div
              key={exp.id}
              className="p-5 rounded-lg border border-neutral-800/80 bg-neutral-900/40 space-y-3 hover:border-neutral-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-neutral-400" />
                  <div>
                    <h3 className="font-bold text-white text-sm">{exp.position}</h3>
                    <p className="text-neutral-400 font-semibold">{exp.company}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditing(exp)}
                    className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={exp.id} />
                    <button
                      type="submit"
                      disabled={isDeletePending}
                      className="p-1.5 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition disabled:opacity-50"
                      title="Delete"
                      onClick={(e) => {
                        if (!confirm(`Delete role "${exp.position}" at ${exp.company}?`)) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>

              <p className="text-neutral-300 font-sans text-xs leading-relaxed whitespace-pre-line">
                {exp.description}
              </p>

              {/* Linked Skills Badges */}
              {exp.skills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Tag className="w-3 h-3 text-neutral-500 mr-1" />
                  {exp.skills.map(({ skill }) => (
                    <span
                      key={skill.id}
                      className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 border border-neutral-700/60 text-neutral-300"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/60 text-[11px] text-neutral-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-neutral-600" />
                    <span>
                      {new Date(exp.startDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                      })}{' '}
                      -{' '}
                      {exp.isCurrent
                        ? 'Present'
                        : exp.endDate
                        ? new Date(exp.endDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                          })
                        : 'Present'}
                    </span>
                  </div>

                  {exp.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-neutral-600" />
                      <span>{exp.location}</span>
                    </div>
                  )}
                </div>

                <span>Order: #{exp.displayOrder}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
