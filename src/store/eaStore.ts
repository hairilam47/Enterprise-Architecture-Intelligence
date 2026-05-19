import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  EAElement,
  EAElementType,
  EALayer,
  EAProject,
  EARelationship,
  EARelationshipType,
  EAView,
  EAViewType,
  LevelOfSpec,
  ProjectSnapshot,
} from './eaTypes'
import { ELEMENT_LAYER_MAP } from './eaTypes'

// ── Helpers ────────────────────────────────────────────────────────────────

function now() {
  return new Date().toISOString()
}

function uid() {
  return crypto.randomUUID()
}

function emptyProject(id = uid(), name = 'Untitled Project'): EAProject {
  const defaultView: EAView = {
    id: uid(),
    name: 'Architecture Overview',
    type: 'Canvas',
    loS: 1,
    elementIds: [],
    relationshipIds: [],
    layoutData: {},
    viewport: { x: 0, y: 0, zoom: 1 },
    createdAt: now(),
    updatedAt: now(),
  }
  return {
    id,
    name,
    elements: {},
    relationships: {},
    views: [defaultView],
    activeViewId: defaultView.id,
    selectedElementIds: [],
    selectedRelationshipId: null,
    highlightedElementIds: [],
    version: 1,
    createdAt: now(),
    updatedAt: now(),
  }
}

// ── Store shape ────────────────────────────────────────────────────────────

export type EAStore = {
  project: EAProject
  undoStack: ProjectSnapshot[]
  redoStack: ProjectSnapshot[]

  // ── Element actions ──────────────────────────────────────────────────────
  addElement: (
    type: EAElementType,
    name: string,
    opts?: {
      description?: string
      layer?: EALayer
      properties?: Record<string, unknown>
      viewId?: string
      position?: { x: number; y: number }
    },
  ) => EAElement

  removeElement: (id: string) => void
  updateElement: (id: string, patch: Partial<Pick<EAElement, 'name' | 'description' | 'status' | 'properties'>>) => void
  updateElementPosition: (elementId: string, viewId: string, position: { x: number; y: number }) => void
  updateElementSize: (elementId: string, viewId: string, size: { w: number; h: number }) => void

  // ── Relationship actions ─────────────────────────────────────────────────
  addRelationship: (
    type: EARelationshipType,
    sourceId: string,
    targetId: string,
    opts?: { name?: string; label?: string; properties?: Record<string, unknown> },
  ) => EARelationship

  removeRelationship: (id: string) => void
  updateRelationship: (id: string, patch: Partial<Pick<EARelationship, 'type' | 'name' | 'label' | 'properties'>>) => void

  // ── View actions ─────────────────────────────────────────────────────────
  addView: (name: string, type?: EAViewType, loS?: LevelOfSpec) => EAView
  removeView: (id: string) => void
  setActiveView: (id: string) => void
  addElementToView: (elementId: string, viewId: string) => void
  removeElementFromView: (elementId: string, viewId: string) => void
  updateViewport: (viewId: string, viewport: Partial<EAView['viewport']>) => void

  // ── Selection / highlight ────────────────────────────────────────────────
  setSelection: (elementIds: string[], relationshipId?: string | null) => void
  clearSelection: () => void
  setHighlighted: (elementIds: string[]) => void
  clearHighlighted: () => void

  // ── Project actions ──────────────────────────────────────────────────────
  loadProject: (project: EAProject) => void
  resetProject: () => void
  renameProject: (name: string) => void

  // ── Undo / Redo ──────────────────────────────────────────────────────────
  undo: () => void
  redo: () => void

  // ── Internal ─────────────────────────────────────────────────────────────
  _snapshot: (label: string) => void
}

// ── Store implementation ───────────────────────────────────────────────────

export const useEAStore = create<EAStore>()(
  subscribeWithSelector(
    immer((set, get) => {
      function _snapshot(label: string) {
        set((s) => {
          s.undoStack.push({
            id: uid(),
            label,
            projectState: JSON.parse(JSON.stringify(s.project)) as EAProject,
            createdAt: now(),
          })
          // Keep undo stack bounded
          if (s.undoStack.length > 50) s.undoStack.splice(0, s.undoStack.length - 50)
          s.redoStack = []
        })
      }

      return {
        project: emptyProject(),
        undoStack: [],
        redoStack: [],

        // ── Elements ───────────────────────────────────────────────────────
        addElement(type, name, opts = {}) {
          _snapshot('add element')
          const id = uid()
          const layer = opts.layer ?? ELEMENT_LAYER_MAP[type] ?? 'Business'
          const viewId = opts.viewId ?? get().project.activeViewId
          const element: EAElement = {
            id,
            type,
            name,
            description: opts.description,
            layer,
            status: 'Active',
            properties: opts.properties ?? {},
            positions: opts.position && viewId ? { [viewId]: opts.position } : {},
            sizes: {},
            viewIds: viewId ? [viewId] : [],
            createdAt: now(),
            updatedAt: now(),
          }
          set((s) => {
            s.project.elements[id] = element
            if (viewId) {
              const view = s.project.views.find((v) => v.id === viewId)
              if (view && !view.elementIds.includes(id)) {
                view.elementIds.push(id)
                view.updatedAt = now()
              }
            }
            s.project.updatedAt = now()
            s.project.version += 1
          })
          return get().project.elements[id]
        },

        removeElement(id) {
          _snapshot('remove element')
          set((s) => {
            delete s.project.elements[id]
            // Remove all relationships referencing this element
            for (const rid of Object.keys(s.project.relationships)) {
              const rel = s.project.relationships[rid]
              if (rel.sourceId === id || rel.targetId === id) {
                delete s.project.relationships[rid]
              }
            }
            // Remove from all views
            for (const view of s.project.views) {
              view.elementIds = view.elementIds.filter((eid) => eid !== id)
              view.updatedAt = now()
            }
            s.project.selectedElementIds = s.project.selectedElementIds.filter((eid) => eid !== id)
            s.project.highlightedElementIds = s.project.highlightedElementIds.filter((eid) => eid !== id)
            s.project.updatedAt = now()
            s.project.version += 1
          })
        },

        updateElement(id, patch) {
          set((s) => {
            const el = s.project.elements[id]
            if (!el) return
            Object.assign(el, patch, { updatedAt: now() })
            s.project.updatedAt = now()
            s.project.version += 1
          })
        },

        updateElementPosition(elementId, viewId, position) {
          set((s) => {
            const el = s.project.elements[elementId]
            if (!el) return
            el.positions[viewId] = position
            el.updatedAt = now()
          })
        },

        updateElementSize(elementId, viewId, size) {
          set((s) => {
            const el = s.project.elements[elementId]
            if (!el) return
            el.sizes[viewId] = size
            el.updatedAt = now()
          })
        },

        // ── Relationships ──────────────────────────────────────────────────
        addRelationship(type, sourceId, targetId, opts = {}) {
          _snapshot('add relationship')
          const id = uid()
          const viewId = get().project.activeViewId
          const rel: EARelationship = {
            id,
            type,
            sourceId,
            targetId,
            name: opts.name,
            label: opts.label,
            properties: opts.properties ?? {},
            createdAt: now(),
          }
          set((s) => {
            s.project.relationships[id] = rel
            if (viewId) {
              const view = s.project.views.find((v) => v.id === viewId)
              if (view && !view.relationshipIds.includes(id)) {
                view.relationshipIds.push(id)
                view.updatedAt = now()
              }
            }
            s.project.updatedAt = now()
            s.project.version += 1
          })
          return get().project.relationships[id]
        },

        removeRelationship(id) {
          _snapshot('remove relationship')
          set((s) => {
            delete s.project.relationships[id]
            for (const view of s.project.views) {
              view.relationshipIds = view.relationshipIds.filter((rid) => rid !== id)
              view.updatedAt = now()
            }
            if (s.project.selectedRelationshipId === id) {
              s.project.selectedRelationshipId = null
            }
            s.project.updatedAt = now()
            s.project.version += 1
          })
        },

        updateRelationship(id, patch) {
          set((s) => {
            const rel = s.project.relationships[id]
            if (!rel) return
            Object.assign(rel, patch)
            s.project.updatedAt = now()
            s.project.version += 1
          })
        },

        // ── Views ──────────────────────────────────────────────────────────
        addView(name, type = 'Canvas', loS = 1) {
          const id = uid()
          const view: EAView = {
            id,
            name,
            type,
            loS,
            elementIds: [],
            relationshipIds: [],
            layoutData: {},
            viewport: { x: 0, y: 0, zoom: 1 },
            createdAt: now(),
            updatedAt: now(),
          }
          set((s) => {
            s.project.views.push(view)
            s.project.updatedAt = now()
          })
          return view
        },

        removeView(id) {
          set((s) => {
            const idx = s.project.views.findIndex((v) => v.id === id)
            if (idx === -1) return
            s.project.views.splice(idx, 1)
            if (s.project.activeViewId === id) {
              s.project.activeViewId = s.project.views[0]?.id ?? null
            }
            s.project.updatedAt = now()
          })
        },

        setActiveView(id) {
          set((s) => {
            if (s.project.views.some((v) => v.id === id)) {
              s.project.activeViewId = id
            }
          })
        },

        addElementToView(elementId, viewId) {
          set((s) => {
            const view = s.project.views.find((v) => v.id === viewId)
            const el = s.project.elements[elementId]
            if (!view || !el) return
            if (!view.elementIds.includes(elementId)) {
              view.elementIds.push(elementId)
              view.updatedAt = now()
            }
            if (!el.viewIds.includes(viewId)) {
              el.viewIds.push(viewId)
            }
          })
        },

        removeElementFromView(elementId, viewId) {
          set((s) => {
            const view = s.project.views.find((v) => v.id === viewId)
            if (view) {
              view.elementIds = view.elementIds.filter((id) => id !== elementId)
              view.updatedAt = now()
            }
            const el = s.project.elements[elementId]
            if (el) {
              el.viewIds = el.viewIds.filter((id) => id !== viewId)
            }
          })
        },

        updateViewport(viewId, viewport) {
          set((s) => {
            const view = s.project.views.find((v) => v.id === viewId)
            if (view) {
              Object.assign(view.viewport, viewport)
            }
          })
        },

        // ── Selection ──────────────────────────────────────────────────────
        setSelection(elementIds, relationshipId = null) {
          set((s) => {
            s.project.selectedElementIds = elementIds
            s.project.selectedRelationshipId = relationshipId ?? null
          })
        },

        clearSelection() {
          set((s) => {
            s.project.selectedElementIds = []
            s.project.selectedRelationshipId = null
          })
        },

        setHighlighted(elementIds) {
          set((s) => {
            s.project.highlightedElementIds = elementIds
          })
        },

        clearHighlighted() {
          set((s) => {
            s.project.highlightedElementIds = []
          })
        },

        // ── Project ────────────────────────────────────────────────────────
        loadProject(project) {
          set((s) => {
            s.project = project
            s.undoStack = []
            s.redoStack = []
          })
        },

        resetProject() {
          set((s) => {
            s.project = emptyProject()
            s.undoStack = []
            s.redoStack = []
          })
        },

        renameProject(name) {
          set((s) => {
            s.project.name = name
            s.project.updatedAt = now()
          })
        },

        // ── Undo / Redo ────────────────────────────────────────────────────
        undo() {
          set((s) => {
            const snapshot = s.undoStack.pop()
            if (!snapshot) return
            s.redoStack.push({
              id: uid(),
              label: snapshot.label,
              projectState: JSON.parse(JSON.stringify(s.project)) as EAProject,
              createdAt: now(),
            })
            s.project = snapshot.projectState
          })
        },

        redo() {
          set((s) => {
            const snapshot = s.redoStack.pop()
            if (!snapshot) return
            s.undoStack.push({
              id: uid(),
              label: snapshot.label,
              projectState: JSON.parse(JSON.stringify(s.project)) as EAProject,
              createdAt: now(),
            })
            s.project = snapshot.projectState
          })
        },

        _snapshot,
      }
    }),
  ),
)

// ── Convenience selectors (used with useEAStore) ───────────────────────────

export const selectActiveView = (s: EAStore) =>
  s.project.views.find((v) => v.id === s.project.activeViewId) ?? null

export const selectActiveViewElements = (s: EAStore) => {
  const view = selectActiveView(s)
  if (!view) return []
  return view.elementIds.map((id) => s.project.elements[id]).filter(Boolean)
}

export const selectActiveViewRelationships = (s: EAStore) => {
  const view = selectActiveView(s)
  if (!view) return []
  return view.relationshipIds.map((id) => s.project.relationships[id]).filter(Boolean)
}

export const selectSelectedElements = (s: EAStore) =>
  s.project.selectedElementIds.map((id) => s.project.elements[id]).filter(Boolean)

export const selectPrimarySelection = (s: EAStore) =>
  s.project.elements[s.project.selectedElementIds[0]] ?? null

export const selectElementsByLayer = (layer: EALayer) => (s: EAStore) =>
  Object.values(s.project.elements).filter((el) => el.layer === layer)

export const selectLayerSummary = (s: EAStore): Record<EALayer, number> => {
  const counts: Record<string, number> = {}
  for (const el of Object.values(s.project.elements)) {
    counts[el.layer] = (counts[el.layer] ?? 0) + 1
  }
  return counts as Record<EALayer, number>
}

export const selectCanUndo = (s: EAStore) => s.undoStack.length > 0
export const selectCanRedo = (s: EAStore) => s.redoStack.length > 0
