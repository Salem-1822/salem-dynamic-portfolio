'use client'

import { useState, useEffect, useActionState } from 'react'
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  type ProjectActionResult,
} from './actions'
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  FolderGit2,
  ExternalLink,
  GitBranch,
  Star,
  Tag,
  Image as ImageIcon,
  Upload,
} from 'lucide-react'
import { Project, ProjectSkill, ProjectStatus, Skill } from '@prisma/client'

type ProjectWithSkills = Project & {
  skills: (ProjectSkill & { skill: Skill })[]
}

interface ProjectManagerProps {
  projects: ProjectWithSkills[]
  allSkills: Skill[]
}

const STATUSES: ProjectStatus[] = ['COMPLETED', 'IN_PROGRESS', 'ARCHIVED']

function slugifyClient(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function statusBadgeClass(status: ProjectStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
    case 'IN_PROGRESS':
      return 'bg-amber-950/70 text-amber-300 border-amber-800/80'
    case 'ARCHIVED':
      return 'bg-neutral-900 text-neutral-400 border-neutral-700/80'
  }
}

export default function ProjectManager({
  projects,
  allSkills,
}: ProjectManagerProps) {
  const [mode, setMode] = useState<'idle' | 'create' | 'edit'>('idle')
  const [editingItem, setEditingItem] = useState<ProjectWithSkills | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Controlled form fields so create/edit transitions never show stale values
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [featured, setFeatured] = useState(false)
  const [status, setStatus] = useState<ProjectStatus>('COMPLETED')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])
  const [filePreviewName, setFilePreviewName] = useState<string | null>(null)

  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  const [createState, createAction, isCreatePending] = useActionState(
    createProjectAction,
    null
  )
  const [updateState, updateAction, isUpdatePending] = useActionState(
    updateProjectAction,
    null
  )
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteProjectAction,
    null
  )

  const applyActionFeedback = (state: ProjectActionResult | null, closeOnSuccess: boolean) => {
    if (!state) return
    if (state.success && state.message) {
      setBanner({ type: 'success', text: state.message })
      if (closeOnSuccess) {
        setMode('idle')
        setEditingItem(null)
      }
    } else if (!state.success && state.error) {
      setBanner({ type: 'error', text: state.error })
    }
  }

  useEffect(() => {
    applyActionFeedback(createState, true)
  }, [createState])

  useEffect(() => {
    applyActionFeedback(updateState, true)
  }, [updateState])

  useEffect(() => {
    applyActionFeedback(deleteState, false)
  }, [deleteState])

  const openCreateForm = () => {
    if (mode === 'create') {
      setMode('idle')
      return
    }
    setBanner(null)
    setEditingItem(null)
    setTitle('')
    setSlug('')
    setSlugManuallyEdited(false)
    setDescription('')
    setImageUrl('')
    setGithubUrl('')
    setLiveUrl('')
    setFeatured(false)
    setStatus('COMPLETED')
    setDisplayOrder(0)
    setSelectedSkillIds([])
    setFilePreviewName(null)
    setMode('create')
  }

  const openEditForm = (project: ProjectWithSkills) => {
    setBanner(null)
    setEditingItem(project)
    setTitle(project.title)
    setSlug(project.slug)
    setSlugManuallyEdited(true)
    setDescription(project.description)
    setImageUrl(project.imageUrl || '')
    setGithubUrl(project.githubUrl || '')
    setLiveUrl(project.liveUrl || '')
    setFeatured(project.featured)
    setStatus(project.status)
    setDisplayOrder(project.displayOrder)
    setSelectedSkillIds(project.skills.map((s) => s.skillId))
    setFilePreviewName(null)
    setMode('edit')
  }

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!slugManuallyEdited) {
      setSlug(slugifyClient(val))
    }
  }

  const handleSlugChange = (val: string) => {
    setSlugManuallyEdited(true)
    setSlug(val)
  }

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const filteredProjects =
    statusFilter === 'ALL'
      ? projects
      : projects.filter((p) => p.status === statusFilter)

  const isPending = isCreatePending || isUpdatePending

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {banner && (
        <div
          className={`p-4 rounded-md text-xs font-mono flex items-center justify-between gap-2 border ${
            banner.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
              : 'bg-red-950/60 border-red-800/80 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{banner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white text-black font-semibold'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            ALL ({projects.length})
          </button>
          {STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-black font-semibold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {st} ({projects.filter((p) => p.status === st).length})
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="px-4 py-2 rounded bg-white text-black font-mono text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          {mode === 'create' ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{mode === 'create' ? 'Cancel' : 'Add Project'}</span>
        </button>
      </div>

      {/* Create / Edit Form Card */}
      {mode !== 'idle' && (
        <div className="p-6 rounded-lg border border-neutral-700 bg-neutral-900/90 font-mono text-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
            <span className="font-bold uppercase tracking-wider text-white">
              {mode === 'create'
                ? 'Create New Project'
                : `Edit Project: ${editingItem?.title}`}
            </span>
            <button
              type="button"
              onClick={() => {
                setMode('idle')
                setEditingItem(null)
              }}
              className="text-neutral-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            action={mode === 'create' ? createAction : updateAction}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {mode === 'edit' && editingItem && (
              <input type="hidden" name="id" value={editingItem.id} />
            )}

            <div>
              <label className="block text-neutral-400 mb-1">Project Title *</label>
              <input
                name="title"
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. HotelBooking Platform"
                disabled={isPending}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">
                URL Slug * <span className="text-[10px] text-neutral-500">(auto-slugified, editable)</span>
              </label>
              <input
                name="slug"
                type="text"
                required
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="hotelbooking-platform"
                disabled={isPending}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Project Status *</label>
              <select
                name="status"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                disabled={isPending}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Display Order</label>
              <input
                name="displayOrder"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                disabled={isPending}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">GitHub Repository URL</label>
              <input
                name="githubUrl"
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/Salem-1822/..."
                disabled={isPending}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Live Deployment URL</label>
              <input
                name="liveUrl"
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={isPending}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            </div>

            {/* Cover Image Upload or Direct URL */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded bg-neutral-950/70 border border-neutral-800">
              <div>
                <label className="block text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Cover Image (Cloudinary)</span>
                </label>
                <input
                  name="coverImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  disabled={isPending}
                  onChange={(e) =>
                    setFilePreviewName(e.target.files?.[0]?.name ?? null)
                  }
                  className="w-full text-[11px] text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-neutral-700 file:text-[11px] file:font-mono file:bg-neutral-900 file:text-neutral-200 hover:file:bg-neutral-800 cursor-pointer"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  {filePreviewName
                    ? `Selected: ${filePreviewName} (overrides URL below)`
                    : 'Optional. Max 5MB (JPEG, PNG, WebP, GIF, AVIF).'}
                </p>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1.5">
                  Or Direct Cover Image URL
                </label>
                <input
                  name="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  disabled={isPending}
                  className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="projectFeatured"
                name="featured"
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-white focus:ring-0"
              />
              <label htmlFor="projectFeatured" className="text-neutral-300 select-none cursor-pointer">
                Featured Project (prioritized on public portfolio homepage)
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1">Description *</label>
              <textarea
                name="description"
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Architecture overview, key features, security implementation..."
                disabled={isPending}
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 font-sans text-xs"
              />
            </div>

            {/* Multi-Select Skills */}
            <div className="md:col-span-2 border-t border-neutral-800 pt-3">
              <label className="block text-neutral-400 mb-2 uppercase tracking-wider text-[11px]">
                Link Technical Stack ({selectedSkillIds.length} selected)
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

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('idle')
                  setEditingItem(null)
                }}
                className="py-2 px-4 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="py-2 px-5 rounded bg-white text-black font-semibold uppercase tracking-wider hover:bg-neutral-200 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : mode === 'create' ? (
                  'Create Project'
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full p-12 text-center text-neutral-600 border border-neutral-800/80 rounded-lg">
            No projects found matching this filter.
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 overflow-hidden flex flex-col justify-between hover:border-neutral-700 transition-colors"
            >
              <div>
                {/* Cover Preview Header */}
                <div className="relative h-40 bg-neutral-950 border-b border-neutral-800/80 overflow-hidden flex items-center justify-center">
                  {project.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover opacity-85"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-neutral-700">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-[10px] uppercase tracking-widest">No Cover Image</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border backdrop-blur-sm ${statusBadgeClass(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                    {project.featured && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-black flex items-center gap-1">
                        <Star className="w-3 h-3 fill-black" />
                        FEATURED
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/75 backdrop-blur-sm p-1 rounded border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => openEditForm(project)}
                      className="p-1.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                      title="Edit Project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={project.id} />
                      <button
                        type="submit"
                        disabled={isDeletePending}
                        className="p-1.5 rounded text-neutral-300 hover:text-red-400 hover:bg-neutral-800 transition disabled:opacity-50 cursor-pointer"
                        title="Delete Project"
                        onClick={(e) => {
                          if (!confirm(`Delete project "${project.title}"?`)) {
                            e.preventDefault()
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-5 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-neutral-400 shrink-0" />
                      <h3 className="font-bold text-white text-sm truncate">
                        {project.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">/{project.slug}</p>
                  </div>

                  <p className="text-neutral-300 font-sans text-xs leading-relaxed line-clamp-3">
                    {project.description}
                  </p>

                  {project.skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Tag className="w-3 h-3 text-neutral-500 mr-0.5" />
                      {project.skills.map(({ skill }) => (
                        <span
                          key={skill.id}
                          className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 border border-neutral-700/60 text-neutral-300"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Links & Order */}
              <div className="px-5 py-3 border-t border-neutral-800/60 bg-neutral-950/40 flex items-center justify-between text-[11px] text-neutral-400">
                <div className="flex items-center gap-3">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>Source</span>
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Live</span>
                    </a>
                  )}
                  {!project.githubUrl && !project.liveUrl && (
                    <span className="text-neutral-600">No external links</span>
                  )}
                </div>

                <span className="text-neutral-500">Order: #{project.displayOrder}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
