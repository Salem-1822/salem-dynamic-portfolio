'use client'

import { useState, useActionState } from 'react'
import { createSkillAction, updateSkillAction, deleteSkillAction } from './actions'
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Cpu,
} from 'lucide-react'
import { Skill, SkillCategory } from '@prisma/client'

const CATEGORIES: SkillCategory[] = [
  'FRONTEND',
  'BACKEND',
  'DATABASE',
  'DEVOPS_TOOLS',
  'SECURITY',
]

interface SkillManagerProps {
  skills: Skill[]
}

export default function SkillManager({ skills }: SkillManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const [createState, createAction, isCreatePending] = useActionState(createSkillAction, null)
  const [updateState, updateAction, isUpdatePending] = useActionState(updateSkillAction, null)
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteSkillAction, null)

  const filteredSkills =
    selectedCategory === 'ALL'
      ? skills
      : skills.filter((s) => s.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Global Alerts */}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded transition ${
              selectedCategory === 'ALL'
                ? 'bg-white text-black font-semibold'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            ALL ({skills.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded transition ${
                selectedCategory === cat
                  ? 'bg-white text-black font-semibold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {cat} ({skills.filter((s) => s.category === cat).length})
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setIsCreating(!isCreating)
            setEditingSkill(null)
          }}
          className="px-4 py-2 rounded bg-white text-black font-mono text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          {isCreating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isCreating ? 'Cancel' : 'Add New Skill'}</span>
        </button>
      </div>

      {/* Create Modal / Form Card */}
      {isCreating && (
        <div className="p-6 rounded-lg border border-neutral-800 bg-neutral-900/90 font-mono text-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
            <span className="font-bold uppercase tracking-wider text-white">Create New Skill</span>
            <button
              onClick={() => setIsCreating(false)}
              className="text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form action={createAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1">Skill Name *</label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. Next.js"
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Category *</label>
              <select
                name="category"
                required
                defaultValue="FRONTEND"
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Proficiency Level (1 - 100)</label>
              <input
                name="level"
                type="number"
                min={1}
                max={100}
                defaultValue={90}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Icon Identifier</label>
              <input
                name="icon"
                type="text"
                placeholder="e.g. nextjs, typescript, docker"
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

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isCreatePending}
                className="w-full py-2 px-4 rounded bg-white text-black font-semibold uppercase tracking-wider hover:bg-neutral-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCreatePending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm & Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form Card */}
      {editingSkill && (
        <div className="p-6 rounded-lg border border-neutral-700 bg-neutral-900/90 font-mono text-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
            <span className="font-bold uppercase tracking-wider text-white">
              Edit Skill: {editingSkill.name}
            </span>
            <button
              onClick={() => setEditingSkill(null)}
              className="text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form action={updateAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="hidden" name="id" value={editingSkill.id} />

            <div>
              <label className="block text-neutral-400 mb-1">Skill Name *</label>
              <input
                name="name"
                type="text"
                required
                defaultValue={editingSkill.name}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Category *</label>
              <select
                name="category"
                required
                defaultValue={editingSkill.category}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Proficiency Level (1 - 100)</label>
              <input
                name="level"
                type="number"
                min={1}
                max={100}
                defaultValue={editingSkill.level ?? ''}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Icon Identifier</label>
              <input
                name="icon"
                type="text"
                defaultValue={editingSkill.icon ?? ''}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Display Order</label>
              <input
                name="displayOrder"
                type="number"
                defaultValue={editingSkill.displayOrder}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSkill(null)}
                className="py-2 px-4 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatePending}
                className="flex-1 py-2 px-4 rounded bg-white text-black font-semibold uppercase tracking-wider hover:bg-neutral-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdatePending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update Skill'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Skills Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
        {filteredSkills.length === 0 ? (
          <div className="col-span-full py-12 text-center text-neutral-600 border border-neutral-800/80 rounded-lg">
            No skills found for this category.
          </div>
        ) : (
          filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="p-4 rounded-lg border border-neutral-800/80 bg-neutral-900/40 flex flex-col justify-between gap-3 hover:border-neutral-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-bold text-white text-sm">{skill.name}</span>
                  </div>
                  <span className="inline-block mt-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                    {skill.category}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingSkill(skill)
                      setIsCreating(false)
                    }}
                    className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={skill.id} />
                    <button
                      type="submit"
                      disabled={isDeletePending}
                      className="p-1.5 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition disabled:opacity-50"
                      title="Delete"
                      onClick={(e) => {
                        if (!confirm(`Delete skill "${skill.name}"?`)) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Level Progress Bar */}
              {skill.level !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>Proficiency</span>
                    <span>{skill.level}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-300"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-2 border-t border-neutral-800/60">
                <span>Icon: {skill.icon || 'default'}</span>
                <span>Order: #{skill.displayOrder}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
