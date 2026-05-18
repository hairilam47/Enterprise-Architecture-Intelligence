# Enterprise Architecture Intelligence — System Documentation

> **Branch:** `claude/plan-patch-updates-gheHm`  
> **Stack:** React 19 · TypeScript 5 · D3 v7 · Three.js r184 · Express 4 · Vite 7  
> **Last updated:** 2026-05-18

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Philosophy](#2-architecture-philosophy)
3. [Repository Structure](#3-repository-structure)
4. [Technology Stack](#4-technology-stack)
5. [Domain Model & Core Types](#5-domain-model--core-types)
6. [Graph Engine](#6-graph-engine)
7. [Composition Canvas](#7-composition-canvas)
8. [Visualization Layer](#8-visualization-layer)
9. [Intelligence & Health Analysis](#9-intelligence--health-analysis)
10. [Traceability System](#10-traceability-system)
11. [Editor & Command System](#11-editor--command-system)
12. [Workspace Persistence](#12-workspace-persistence)
13. [Collaboration](#13-collaboration)
14. [Backend API](#14-backend-api)
15. [Services & Repository Pattern](#15-services--repository-pattern)
16. [Simulation Engine](#16-simulation-engine)
17. [Plugin System](#17-plugin-system)
18. [Workflow & Onboarding](#18-workflow--onboarding)
19. [UI Shell & Design System](#19-ui-shell--design-system)
20. [Organisation & Identity](#20-organisation--identity)
21. [Configuration](#21-configuration)
22. [Sprint Delivery Log](#22-sprint-delivery-log)
23. [Running the Project](#23-running-the-project)

---

## 1. System Overview

**Enterprise Architecture Intelligence (EAI)** is a browser-based operating system for enterprise architects. It combines three capabilities that no single existing tool provides together:

| Capability | What it gives you |
|---|---|
| **Figma-grade authoring canvas** | Drag-drop, free-form composition of architecture nodes and relationships with undo/redo, duplicate, inline rename, context menus, and port-based connection drawing |
| **D3 analytical graph** | Force-directed graph with 7 focus modes, impact traversal, critical path detection, bottleneck highlighting, minimap navigation, and SVG export |
| **Three.js spatial view** | 3D layer-plane visualisation of where capabilities live in the architectural stack, with animated camera transitions and node drag |

Beyond authoring, EAI provides an **intelligence layer** that continuously analyses the workspace and surfaces:

- **Health signals** — connectivity gaps, traceability holes, replay integrity failures
- **Bottleneck detection** — simulation-driven identification of constrained layers  
- **Traceability matrix** — bidirectional coverage from Requirements → APIs → Data → Tests
- **Impact analysis** — upstream/downstream traversal when a node changes
- **Recommendations** — actionable guidance derived from detected signals

The system is local-first (localStorage) with an optional Express back-end for multi-user persistence, replay, and checkpoint management.

---

## 2. Architecture Philosophy

### 2.1 Intelligence-First Design

Unlike Figma, Visio, or Lucidchart, nodes in EAI are **semantically typed** — a `requirement`, `api`, `database`, `service`, `infrastructure`, `incident`, or `testcase`. Relationships carry meaning (`depends_on`, `calls`, `stores`, `validated_by`, `deployed_on`, `causes`). This semantic richness enables:

- **Connection validation** — the system enforces which node types can connect to which
- **Automatic impact traversal** — selecting any node immediately highlights its full dependency tree
- **Traceability enforcement** — the system warns when a requirement has no linked test, or an API has no data store

### 2.2 Command-Based Mutations

Every state change in the system flows through an `EditorCommand`. Commands carry a complete `before`/`after` snapshot, making the history log a **deterministic replay ledger** — the system can reconstruct any historical workspace state purely from the command stream.

### 2.3 Bidirectional Canvas ↔ Graph

The composition canvas and the enterprise graph are kept in sync via two pure-function converters:

```
EnterpriseGraph  ──graphToCanvas()──→  CompositionState
CompositionState ──canvasToGraph()──→  EnterpriseGraph
```

All views (D3, Three.js, Traceability, Simulation) derive their data from the same `EnterpriseGraph` root — there is no divergent state.

### 2.4 Local-First Persistence

The persistence stack is layered:

```
In-memory React state
        ↓ on change
localStorage snapshot (every 10 commands)
        ↓ optional
Named checkpoint (manual / on milestone)
        ↓ optional
HTTP API → Express → JSON file store
```

The application is fully functional offline. The backend is opt-in.

---

## 3. Repository Structure

```
Enterprise-Architecture-Intelligence/
│
├── src/                          # Frontend (React + TypeScript)
│   ├── App.tsx                   # Root component — dark mode toggle, ToastContainer
│   ├── main.tsx                  # React DOM mount
│   ├── index.css                 # Global CSS vars (light + dark mode tokens)
│   ├── App.css                   # All component styles (~4900 lines)
│   │
│   ├── types/                    # Foundation type definitions
│   ├── graph/                    # Enterprise graph build & traversal
│   ├── composition/              # Canvas state & mutations
│   ├── domain/                   # Domain entity registry
│   ├── editor/                   # Command system & replay engine
│   ├── workspace/                # Document, snapshots, persistence
│   ├── intelligence/             # Health scoring & recommendations
│   ├── traceability/             # Cross-domain coverage analysis
│   ├── collaboration/            # Conflict detection & WebSocket service
│   ├── visualization/            # D3 layout & visual graph adapters
│   ├── three/                    # Three.js scene building
│   ├── simulation/               # Architecture simulation engine
│   ├── plugins/                  # Plugin registry (20+ plugins)
│   ├── services/                 # Repository pattern & API clients
│   ├── commands/                 # Command palette & shortcut registry
│   ├── workflow/                 # Onboarding workflows
│   ├── interaction/              # Camera controller & interaction authority
│   ├── canvas/                   # Stadium workspace & zone layer
│   ├── layout/                   # Shell layout system
│   ├── org/                      # Organisation & identity
│   ├── design/                   # Design tokens (TS)
│   ├── design-system/            # Compiled token exports
│   ├── theme/                    # Theme CSS custom properties
│   ├── toast/                    # Toast notification singleton
│   ├── utils/                    # Debounce, canvas export
│   ├── templates/                # Workspace starter templates
│   ├── audit/                    # Audit event creation
│   └── components/               # All React UI components
│       ├── LayeredWorkspace.tsx  # Primary workspace container
│       ├── D3EnterpriseGraph.tsx # D3 force-directed graph
│       ├── ThreeArchitectureView.tsx # 3D view
│       ├── GraphToolbar.tsx / GraphMiniMap.tsx / GraphInspector.tsx
│       ├── Toast.tsx             # Toast renderer
│       ├── composition/          # Canvas editor components
│       ├── domain/               # Domain workspace panels
│       ├── history/              # Timeline, replay, diff, recovery
│       ├── intelligence/         # Health panels, signal cards
│       ├── traceability/         # Traceability matrix & impact UI
│       ├── collaboration/        # Cursor layers (simulated + WS)
│       ├── workflow/             # Starter wizard, progress tracker
│       ├── guidance/             # Empty-state, hints, next-step cards
│       └── workspace/            # Workspace manager, status bar
│
├── server/                       # Express backend
│   └── src/
│       ├── index.ts              # Express app entry
│       ├── routes/workspaces.ts  # 20+ REST endpoints
│       ├── services/workspaceStore.ts # File-based JSON persistence
│       └── types/ validation/    # Server-side types & validation
│
├── public/                       # Static assets
├── package.json                  # Frontend deps & scripts
├── vite.config.ts                # Vite build config (manual chunks)
├── tsconfig.json / tsconfig.app.json
└── eslint.config.js
```

---

## 4. Technology Stack

### 4.1 Frontend

| Library | Version | Purpose |
|---|---|---|
| React | ^19.2.6 | UI framework |
| TypeScript | ^5.9.3 | Type safety |
| Vite | ^7.2.7 | Build tool & dev server |
| D3 | ^7.9.0 | Force-directed graph, zoom, drag |
| Three.js | ^0.184.0 | 3D spatial architecture view |
| @react-three/fiber | ^9.6.1 | React renderer for Three.js |
| @react-three/drei | ^10.7.7 | Three.js helpers (OrbitControls, Text, Html, Line) |

### 4.2 Backend

| Library | Version | Purpose |
|---|---|---|
| Express | ^4.19.2 | HTTP server |
| CORS | ^2.8.5 | Cross-origin requests |
| tsx | ^4.16.2 | TypeScript execution (dev) |
| Node.js `fs`/`path` | native | File-based JSON storage |

### 4.3 Build & Dev Scripts

```bash
# Frontend
npm run dev        # Vite dev server (port 5173)
npm run build      # Production bundle
npm run typecheck  # tsc --noEmit

# Backend
npm run dev        # tsx watch src/index.ts (port 8787)
npm run build      # esbuild → dist/index.cjs
npm start          # node dist/index.cjs
```

### 4.4 Vite Build Configuration

```typescript
// vite.config.ts — manual chunk splitting
manualChunks: {
  'three-vendor': ['@react-three/fiber', '@react-three/drei', 'three', 'three-stdlib'],
  'd3-vendor':    ['d3'],
}
// Chunk size warning threshold: 900KB
```

---

## 5. Domain Model & Core Types

### 5.1 Architecture Layers (7)

```typescript
// src/types/architecture.ts
type ArchitectureLayer =
  | 'Business'
  | 'Application'
  | 'Integration'
  | 'Data'
  | 'Infrastructure'
  | 'Hardware'
  | 'Operations'
```

Each layer hosts specific node types and is rendered as a horizontal plane in the Three.js spatial view.

### 5.2 Enterprise Node Types (7)

```typescript
// src/graph/enterpriseGraph.ts
type EnterpriseNodeType =
  | 'requirement'    // Business layer — requirements & user stories
  | 'api'            // Application / Integration — service endpoints
  | 'database'       // Data layer — data stores
  | 'service'        // Application layer — microservices
  | 'infrastructure' // Infrastructure / Hardware — hosting, networking
  | 'incident'       // Operations — production incidents
  | 'testcase'       // Quality — automated & manual tests
```

### 5.3 Enterprise Relationship Types (6)

```typescript
type EnterpriseRelationshipType =
  | 'depends_on'    // Generic dependency
  | 'calls'         // API call / service invocation
  | 'stores'        // Service writes to data store
  | 'validated_by'  // Requirement covered by test
  | 'deployed_on'   // Service runs on infrastructure
  | 'causes'        // Incident caused by component
```

**Force distances by relationship type** (used in D3 force simulation):

| Relationship | Distance |
|---|---|
| `depends_on` | 145px |
| `calls` | 125px |
| `stores` | 155px |
| `validated_by` | 130px |
| `deployed_on` | 160px |
| `causes` | 180px |

### 5.4 Core Graph Types

```typescript
type EnterpriseNode = {
  id: string
  type: EnterpriseNodeType
  label: string
  layer: ArchitectureLayer
  metadata: Record<string, unknown>
  status: 'normal' | 'warning' | 'bottleneck' | 'selected'
  metrics?: { latency?: number; throughput?: number; successRate?: number }
}

type EnterpriseEdge = {
  id: string
  sourceId: string
  targetId: string
  relationship: EnterpriseRelationshipType
  weight: number
  metadata: Record<string, unknown>
}

type EnterpriseGraph = {
  nodes: EnterpriseNode[]
  edges: EnterpriseEdge[]
}
```

### 5.5 Domain Entity Types

```typescript
// src/domain/domainTypes.ts
type DomainEntityKind =
  | 'requirement' | 'api' | 'databaseTable'
  | 'testCase' | 'incident' | 'service' | 'infrastructureComponent'

type DomainEntity = {
  id: string
  kind: DomainEntityKind
  name: string
  description: string
  status: DomainEntityStatus
  layer: ArchitectureLayer
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
```

### 5.6 Workspace Document (top-level snapshot)

```typescript
// src/workspace/workspaceDocument.ts
type WorkspaceDocument = {
  workspaceId: string
  version: number
  name: string
  description: string
  owner: WorkspaceOwner
  organizationContext: WorkspaceOrganizationContext
  layers: LayerState[]             // 7 architecture layers with plugins
  domainRegistry: DomainRegistryState  // entities + relationships
  compositionCanvasState: CompositionState  // canvas nodes/edges/groups
  auditEvents: AuditEvent[]
  snapshots: WorkspaceSnapshot[]
  checkpoints: WorkspaceCheckpoint[]
  traceHighlight?: TraceHighlightState
  validationState?: ValidationResult
  visualPreferences: WorkspaceVisualPreferences
  commandHistory?: SerializedEditorCommand[]
  editorEvents?: string[]
  createdAt: string
  updatedAt: string
}
```

---

## 6. Graph Engine

**Location:** `src/graph/`

### 6.1 Graph Building

`buildEnterpriseGraph(workspace, simulationResult?, validationResult?)` converts a `WorkspaceDocument` into an `EnterpriseGraph`:

1. Converts each `DomainEntity` into an `EnterpriseNode`
2. Converts each `DomainRelationship` into an `EnterpriseEdge`
3. Overlays simulation metrics (latency, throughput) onto nodes
4. Overlays validation status (warning, bottleneck) onto nodes
5. Assigns semantic colours by layer

### 6.2 Graph Traversal Algorithms

`src/graph/traverseGraph.ts` implements BFS-based traversal:

```typescript
// Find all nodes that this node depends on (upstream)
traverseUpstream(graph, nodeId): GraphTraversalResult

// Find all nodes that depend on this node (downstream)
traverseDownstream(graph, nodeId): GraphTraversalResult

// Find all direct and transitive dependencies
findDependencies(graph, nodeId): GraphTraversalResult

// Dijkstra-style shortest path between two nodes
findImpactPath(graph, sourceId, targetId): GraphTraversalResult

// Critical path: top N edges by weight, traversed depth-first
findCriticalPath(graph): GraphTraversalResult
```

`GraphTraversalResult` carries both `nodeIds` and `edgeIds` so D3 and Three.js can highlight the full path (nodes + connecting edges).

### 6.3 Impact Analysis

`src/graph/impactAnalysis.ts` extends traversal to produce business-readable impact summaries — affected capability count, risk score, recovery priority.

---

## 7. Composition Canvas

**Location:** `src/composition/` · `src/components/composition/`

### 7.1 Canvas Node Kinds (10)

```typescript
// src/composition/compositionTypes.ts
type CanvasNodeKind =
  | 'requirement' | 'api' | 'database' | 'service'
  | 'infrastructure' | 'testcase' | 'incident'
  | 'group' | 'environment' | 'zone'  // semantic groupings
```

### 7.2 Composition State Shape

```typescript
type CompositionState = {
  nodes: CompositionCanvasNode[]
  edges: CompositionCanvasEdge[]
  groups: CompositionCanvasGroup[]
  selection: CompositionSelectionState   // selectedNodeIds, selectedEdgeId
  viewport: CompositionViewport          // zoom, pan x/y
  layout: CompositionLayoutState         // snapToGrid, layoutMode
}
```

### 7.3 Pure State Mutations

`src/composition/compositionState.ts` exports pure functions only — no side effects:

| Function | Purpose |
|---|---|
| `selectNode(state, nodeId)` | Set selection |
| `addCanvasNode(state, node)` | Add node at position |
| `updateCanvasNodePosition(state, id, x, y)` | Move node |
| `removeNode(state, id)` | Delete node + its edges + remove from groups |
| `removeEdge(state, id)` | Delete edge |
| `removeSelectedItems(state)` | Bulk delete selected |
| `duplicateNodes(state, ids)` | Copy at +24,+24 offset with fresh IDs |
| `updateNodeLabel(state, id, label)` | Rename node |
| `selectNodesInRect(state, rect)` | Marquee selection |

### 7.4 Layout Engine

`src/composition/layoutEngine.ts`:

- **`snapPoint(x, y, gridSize)`** — snaps coordinates to nearest grid intersection
- **`autoLayoutByLayer(state)`** — groups nodes by `layer` property, arranges each group in a 4-column grid with vertical layer bands
- **`autoLayoutByRelationship(state)`** — sorts nodes by incoming-edge count (most connected first), arranges in a dependency-ordered grid
- **`moveNode(state, id, dx, dy)`** — moves node and all its group children together, applies grid snap if enabled
- **`fitGroupBounds(state, groupId)`** — recomputes a group's bounding rect to contain all member nodes

### 7.5 Connection Validation

`src/composition/connectionRules.ts` — `validateConnection(sourceKind, targetKind)` returns `{ allowed: boolean, reason?: string }`. Enforces rules such as:

- `requirement` may connect to: `api`, `service`, `testcase`
- `api` may connect to: `database`, `service`, `infrastructure`
- `incident` may connect to: `service`, `infrastructure`, `database`
- Cross-layer connections are flagged with a warning but not blocked

### 7.6 Canvas Keyboard Shortcuts

Handled in `EnterpriseCompositionCanvas.tsx` via `onKeyDown` on the `<section tabIndex={0}>` root:

| Key | Action |
|---|---|
| `Del` / `Backspace` | Delete selected nodes/edges |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Ctrl+D` | Duplicate selected nodes |
| `Escape` | Clear selection |

### 7.7 Undo/Redo (useCanvasHistory)

`src/composition/useCanvasHistory.ts` — ref-based history stack that **never triggers re-renders**:

- `MAX_HISTORY = 30` snapshots
- `push(state)` — prepend to past stack, clear future
- `undo()` → move top of past to future, return previous state
- `redo()` → move top of future to past, return next state
- `canUndo` / `canRedo` computed from stack lengths

### 7.8 Visual Features

- **Marquee selection** — rubber-band rect drawn as `<rect class="composition-marquee">` on pointer-drag over empty canvas; intersects node bounding boxes on pointer-up
- **Port drag-to-connect** — invisible `<circle r="8">` port handles appear on node hover; pointer-down starts a live `ConnectionPreview` bezier curve; pointer-up over target port opens `RelationshipDrawer`
- **Inline rename** — double-click on node label renders a `<foreignObject><input>` overlay; blur/Enter commits
- **Node context menu** — right-click opens a `composition-context-menu` at cursor: Delete, Duplicate, Inspect, Start Connection, Set as Focus
- **PNG export** — `downloadSvgAsPng(svgRef.current)` serialises the canvas SVG, draws to `<canvas>` at 2× scale with white background, triggers blob download

---

## 8. Visualization Layer

### 8.1 D3 Enterprise Graph

**File:** `src/components/D3EnterpriseGraph.tsx`

The D3 view is the primary analytical surface. It renders an SVG force-directed graph with full interaction support.

#### Force Simulation Parameters

```typescript
// src/visualization/d3ForceLayout.ts
forceCharge:     strength -520
forceCollision:  radius dynamic (based on node radius + latency)
forceLink:       distance per relationship type (125–180px), strength 0.42
forceCenter:     centering at (width/2, height/2)
forceX/Y:        strength 0.06 (drift prevention)
```

#### Focus Modes (7)

| Mode | Behaviour |
|---|---|
| `full_graph` | Show all nodes and edges |
| `selected_neighborhood` | Show selected node + its immediate neighbors |
| `impact_path` | Show shortest path from selected to last node |
| `critical_path` | Highlight top-weighted edges across the graph |
| `bottlenecks_only` | Show only nodes flagged as bottlenecks |
| `warnings_only` | Show only nodes flagged with warnings |
| `layer_view` | Filter to a single architecture layer |

#### Node Position Persistence

Drag-end positions are saved to `nodePositions: useRef<Map<string, {x, y}>>`. On graph re-render, saved positions are restored as D3 `node.fx` / `node.fy` (pinned fixed positions), so nodes stay where they were dropped even after data changes. "Reset positions" clears the map and increments a signal to trigger D3 re-init.

#### Minimap Navigation

`GraphMiniMap` renders a 240×80px interactive SVG. Clicking anywhere pans the main graph (`zoom.translateTo`) to the corresponding graph-space coordinate. A dashed blue viewport indicator rect shows the currently visible area, derived from the tracked `zoomTransform: {x, y, k}`.

#### SVG Export

`handleExportSvg()` calls `downloadSvg(svgRef.current, 'enterprise-graph.svg')`, which serialises the live SVG element including computed styles, and triggers a file download.

#### Hover Peek

Mouse-over a node for any duration shows a floating `.d3-hover-peek` card at cursor position displaying: node label, type, connected node count.

### 8.2 Three.js Spatial View

**File:** `src/components/ThreeArchitectureView.tsx`

The 3D view renders the architecture as horizontal layer planes with spherical node meshes.

#### Scene Structure

```
Canvas (react-three-fiber)
  ├── PerspectiveCamera (fov 46, initial position [3.8, 7.2, 7.8])
  ├── CameraActions (OrbitControls + RAF lerp animation)
  ├── DragPlane (invisible horizontal mesh, active only during node drag)
  ├── AmbientLight + DirectionalLight
  ├── GridHelper (floor reference grid)
  ├── Layer planes (7 × horizontal mesh with layer colour)
  └── SpatialNodeMesh × N (spheres with ring + label + markers)
```

#### Camera Animation

`CameraActions` uses a `requestAnimationFrame` loop with **ease-in-out quadratic** interpolation over 420ms. Camera position and `OrbitControls` target are both lerped simultaneously, so transitions between presets feel cinematic rather than instant.

#### Camera Presets (6)

| Preset | Use case |
|---|---|
| `default` | Isometric overview |
| `front` | Front-facing orthographic-like |
| `top` | Bird's-eye view |
| `angled` | 45° presentation angle |
| `layer_focus` | Zoom to a specific layer plane |
| `selected_node_focus` | Zoom to the selected node |

#### 3D Node Drag

A `DragPlane` component (invisible `THREE.DoubleSide` plane at the dragged node's Y position) provides ray-plane intersection for accurate drag. The flow:

1. `onPointerDown` on a node mesh → set `dragging: {nodeId, planeY}` in parent state
2. `DragPlane.onPointerMove` fires → `event.point` gives world-space coordinates → move node group imperatively via `nodeGroupRefs`
3. `DragPlane.onPointerUp` → save final `{x, z}` to `spatialPositions` ref → increment `spatialPosVersion` to trigger re-render with persisted position

---

## 9. Intelligence & Health Analysis

**Location:** `src/intelligence/`

### 9.1 Analysis Pipeline

```
WorkspaceDocument
        ↓
analyzeWorkspaceHealth()
        ↓
architectureSignals.ts  →  signals[]
healthScoring.ts        →  dimensions[]
recommendationEngine.ts →  recommendations[]
        ↓
WorkspaceHealthSummary + WorkspaceIntelligenceReport
```

### 9.2 Health Dimensions (5)

| Dimension | What is measured |
|---|---|
| **Connectivity** | Graph density, isolated nodes, disconnected components |
| **Traceability** | Cross-domain links, requirement-test coverage ratio |
| **ReplayIntegrity** | Checksum consistency in command history |
| **DependencyBalance** | Centrality distribution — whether load is spread or concentrated |
| **DomainCoverage** | Whether all 7 architecture layers have nodes |

Each dimension returns a status: `healthy` | `attention` | `risk`.

### 9.3 Signal Types

| Signal | Source |
|---|---|
| Isolated node detected | Topology analysis |
| Circular dependency | Topology analysis |
| Requirement without test | Traceability health |
| High-centrality bottleneck | Dependency analysis |
| Replay integrity failure | Replay integrity check |
| Missing governance coverage | Governance analysis |
| Layer imbalance | Topology analysis |

### 9.4 Dependency Heat Overlay

`DependencyHeatOverlay` renders a floating panel over the stadium workspace showing the top-N nodes by incoming edge count, coloured by risk level (normal / warning / critical).

---

## 10. Traceability System

**Location:** `src/traceability/`

### 10.1 Trace Domains (6)

```typescript
const traceDomains = ['requirements', 'apis', 'data', 'tests', 'infrastructure', 'incidents']
```

### 10.2 Traceability Matrix

A 6×6 matrix where cell `[i][j]` shows how many edges cross from domain `i` to domain `j`. Cells with zero cross-references where there should be links are flagged as gaps.

### 10.3 Impact Analysis

`analyzeImpact(graph, entityId)` performs BFS in both directions:

- **Upstream** — what this entity depends on
- **Downstream** — what depends on this entity
- **Affected entities** — the combined set, used to colour `is-impacted` nodes in D3

### 10.4 Missing Link Detection

`detectMissingLinks(graph)` identifies:

- Requirements with no `validated_by` edge to a test case
- APIs with no `stores` edge to a database
- Services with no `deployed_on` edge to infrastructure

Missing links are surfaced as `MissingLinkWarning` objects and highlighted as `is-missing-link` nodes in D3 (orange dashed ring).

### 10.5 Trace Highlight State

```typescript
type TraceHighlightState = {
  selectedTracePath?: { nodeIds: string[]; edgeIds: string[] }
  impactedEntityIds: string[]    // → purple dashed ring in D3
  missingLinkNodeIds: string[]   // → orange dashed ring in D3
}
```

---

## 11. Editor & Command System

**Location:** `src/editor/`

### 11.1 Command Types (18)

```typescript
type EditorCommandType =
  | 'workspace.rename' | 'workspace.reset'
  | 'workspace.import' | 'workspace.restore'
  | 'layer.plugin.swap'
  | 'domain.entity.create' | 'domain.entity.delete'
  | 'domain.relationship.create'
  | 'composition.state.replace' | 'composition.node.create'
  | 'composition.node.delete' | 'composition.node.move'
  | 'composition.node.resize' | 'composition.node.rename'
  | 'composition.edge.connect' | 'composition.edge.remove'
  | 'composition.metadata.update'
  | 'viewport.change' | 'selection.change' | 'transaction.batch'
```

### 11.2 Command Structure

```typescript
type SerializedEditorCommand = {
  id: string
  type: EditorCommandType
  label: string
  timestamp: string
  operationId: string
  sessionId: string
  authorId: string
  logicalClock: number
  parentOperationId?: string
  before: WorkspaceDocument   // full snapshot before
  after: WorkspaceDocument    // full snapshot after
  operation: { payload: unknown; simulated?: boolean }
}
```

The `before`/`after` snapshots make every command a complete standalone restore point.

### 11.3 History Stack

`src/editor/commandHistory.ts` manages:

- `past: SerializedEditorCommand[]` — undo stack
- `future: SerializedEditorCommand[]` — redo stack
- `pushCommand(command)` — prepend to past, clear future
- `undoCommand()` → move top of past to future, return `before` document
- `redoCommand()` → move top of future to past, return `after` document

### 11.4 Replay Engine

The replay system can reconstruct any historical workspace state from the command log:

```typescript
// src/editor/replayRuntime.ts
replayCommands(commands[], targetIndex) → WorkspaceDocument

// src/editor/replayHydration.ts
hydrateEditorState(commands[]) → EditorState

// src/editor/replaySandbox.ts
executeSandboxReplay(commands[], options) → ReplaySandboxResult
```

Replay integrity is validated by checksumming `before`/`after` documents and detecting breaks in the logical clock sequence.

---

## 12. Workspace Persistence

**Location:** `src/workspace/`

### 12.1 Persistence Hierarchy

| Layer | Trigger | Location |
|---|---|---|
| In-memory React state | Every mutation | Component state |
| localStorage snapshot | Every 10 commands | Browser localStorage |
| Named checkpoint | Manual / on milestone | localStorage + optional API |
| API save | On explicit save or sync | `server/data/workspaces/` |

### 12.2 Snapshots

`createWorkspaceSnapshot()` produces a `WorkspaceSnapshot` with:
- Full `WorkspaceDocument` serialised as JSON
- SHA-256 checksum of the document
- Command index at time of snapshot
- Timestamp

`shouldCreateCommandSnapshot(history)` returns `true` every 10 commands.

### 12.3 Checkpoints

Named checkpoints (`WorkspaceCheckpoint`) extend snapshots with:
- User-defined label and description
- Tags (e.g., `["pre-migration", "v2.3-baseline"]`)
- Whether it was auto-generated or manual

### 12.4 Recovery

`workspaceRecovery.ts` implements a recovery pipeline:

1. Detect corruption (failed checksum, schema mismatch)
2. Find the most recent valid snapshot
3. Offer the user a list of recovery points
4. Restore document from chosen snapshot
5. Re-apply any commands since that snapshot (if available)

### 12.5 Workspace Migration

`workspaceMigration.ts` handles schema version upgrades. Each migration is a pure function `migrate(doc: WorkspaceDocument, fromVersion: number): WorkspaceDocument`.

---

## 13. Collaboration

**Location:** `src/collaboration/`

### 13.1 Operation-Based Model

All collaborative mutations are represented as `CollaborationOperation` objects:

```typescript
type CollaborationOperation = {
  operationId: string
  sessionId: string
  authorId: string
  logicalClock: number
  timestamp: string
  type: EditorCommandType
  path: string          // entity ID or layer path being modified
  payload: unknown
}
```

### 13.2 Conflict Detection

`detectOperationConflicts(pending, incoming)` detects:

| Conflict Type | Condition |
|---|---|
| `overlapping_mutation` | Both operations modify the same `path` |
| `invalid_logical_clock` | Incoming clock is negative or non-monotonic |

### 13.3 WebSocket Service

`src/collaboration/wsCollaborationService.ts` — singleton WebSocket client:

- Connects to `ws://localhost:3001/collab`
- Auto-reconnects with exponential back-off (cap 8s)
- Silently degrades when WS server is unavailable — the app is fully functional offline
- `broadcast(event)` — sends cursor/presence events when WS is open
- `subscribe(handler)` — returns an unsubscribe function

### 13.4 useWsCollaboration Hook

`src/collaboration/useWsCollaboration.ts`:

- Manages WS lifecycle (connect on mount, disconnect on unmount)
- Receives remote cursor events → maintains `remoteCursors: Map<string, RemoteWsCursor>`
- Prunes cursors not seen in 4 seconds
- `broadcastCursor(x, y)` throttled to 50ms intervals
- `isConnected` polled every 1 second

### 13.5 Cursor Layers

Two cursor layers run in parallel:

| Layer | Source | Component |
|---|---|---|
| Simulated | Static mock sessions (User A, B, C) | `RemoteCursorLayer.tsx` |
| Live WS | Real remote cursors from WS | `WsCursorLayer.tsx` |

---

## 14. Backend API

**Location:** `server/src/`

### 14.1 Server Configuration

```typescript
// server/src/index.ts
Port:       process.env.PORT ?? 8787
CORS:       enabled for all origins (dev)
Body limit: 10MB JSON
Logging:    method, URL, status, duration on every request
```

### 14.2 REST Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| GET | `/api/workspaces` | List all workspace summaries |
| POST | `/api/workspaces` | Create a new workspace |
| POST | `/api/workspaces/import` | Import workspace from JSON |
| GET | `/api/workspaces/:id` | Load full workspace document |
| PUT | `/api/workspaces/:id` | Save workspace (version-checked) |
| DELETE | `/api/workspaces/:id` | Delete workspace |
| GET | `/api/workspaces/:id/export` | Export full document as JSON |
| GET | `/api/workspaces/:id/version` | Get current version number |
| GET | `/api/workspaces/:id/history` | Load full history |
| GET | `/api/workspaces/:id/commands` | List commands (paginated) |
| GET | `/api/workspaces/:id/commands/range` | Commands between indices |
| POST | `/api/workspaces/:id/operations` | Append a collaboration operation |
| GET | `/api/workspaces/:id/operations` | List all operations |
| GET | `/api/workspaces/:id/operations/session/:sid` | Operations by session |
| GET | `/api/workspaces/:id/operations/author/:aid` | Operations by author |
| GET | `/api/workspaces/:id/replay` | Create a replay window |
| GET | `/api/workspaces/:id/checkpoints` | List named checkpoints |
| POST | `/api/workspaces/:id/checkpoints` | Create checkpoint |
| DELETE | `/api/workspaces/:id/checkpoints/:cid` | Delete checkpoint |
| POST | `/api/workspaces/:id/restore` | Restore from snapshot or checkpoint |

### 14.3 Version Conflict Guard

`PUT /api/workspaces/:id` validates that `body.workspaceId === params.id` and that the incoming `version` matches the stored version. Stale writes return **409 Conflict** with the current server version, allowing the client to merge or retry.

### 14.4 File Storage

```
server/data/workspaces/
  {workspaceId}.json        # Full WorkspaceDocument
  {workspaceId}.history.json # Command log + operations
```

Writes use a **temp file → atomic rename** pattern to prevent partial writes.

### 14.5 Error Response Shape

```json
{
  "error": {
    "type": "VALIDATION_ERROR | NOT_FOUND | VERSION_CONFLICT | STORAGE_ERROR",
    "message": "Human-readable message",
    "details": []
  }
}
```

---

## 15. Services & Repository Pattern

**Location:** `src/services/`

### 15.1 WorkspaceRepository Interface

```typescript
interface WorkspaceRepository {
  create(doc: WorkspaceDocument): Promise<string>
  save(doc: WorkspaceDocument): Promise<void>
  load(id: string): Promise<WorkspaceDocument>
  list(): Promise<WorkspaceDocumentMetadata[]>
  delete(id: string): Promise<void>
  duplicate(id: string, name: string): Promise<string>
  export(id: string): Promise<string>   // JSON string
  import(json: string): Promise<string> // new workspace ID
}
```

### 15.2 Implementations

| Class | Backend | Use case |
|---|---|---|
| `LocalWorkspaceRepository` | localStorage | Default offline mode |
| `ApiWorkspaceRepository` | HTTP → Express | Multi-user / persistence |
| `MockApiWorkspaceRepository` | In-memory | Testing |

### 15.3 WorkspaceService Factory

`createWorkspaceService(repository)` wraps a repository with:
- Schema validation before write
- Migration before read
- Error normalisation via `ServiceError`
- Retry logic (via `retryFetch`) for network operations

### 15.4 WorkspaceServiceProvider

React context (`src/components/workspace/WorkspaceServiceProvider.tsx`) injects the service into the component tree. Components call `useWorkspaceService()` to get the current service instance.

---

## 16. Simulation Engine

**File:** `src/simulation/simulateWorkspace.ts`

`simulateWorkspace(workspace)` computes architecture-wide performance metrics:

### Per-Layer Metrics

| Metric | Algorithm |
|---|---|
| **Latency** | Sum of plugin latency values across the layer |
| **Throughput** | Min of plugin throughput values (bottleneck) |
| **Success Rate** | Product of all plugin success rates |

### System-Wide Metrics

- **Total Latency** — sum across all 7 layers
- **System Throughput** — min across all layers (weakest link)
- **Overall Success Rate** — product across all layers

### Bottleneck Score

```
score = latency / 2
      + (1000 - throughput) / 20
      + (0.985 - successRate) * 1000
```

Layers with a score above threshold are marked as bottlenecks in the graph.

### Compatibility Validation

Each plugin declares `compatibleWith: string[]` — a list of plugin IDs it works with. The simulation checks cross-layer plugin compatibility and emits `ValidationIssue` warnings for incompatible pairings.

---

## 17. Plugin System

**File:** `src/plugins/pluginRegistry.ts`

The plugin registry contains 20+ plugins distributed across all 7 architecture layers.

### Plugin Schema

```typescript
type Plugin = {
  id: string
  name: string
  layer: ArchitectureLayer
  description: string
  metrics: {
    latency: number       // ms
    throughput: number    // requests/sec
    successRate: number   // 0.0–1.0
  }
  compatibleWith: string[]  // plugin IDs
  tags: string[]
  visual: {
    color: string
    icon: string
  }
}
```

### Example Plugins by Layer

| Layer | Example Plugins |
|---|---|
| Business | Requirements Management, Governance Framework |
| Application | API Gateway, Microservice Mesh, Event Bus |
| Integration | Message Queue, ESB, GraphQL Federation |
| Data | PostgreSQL, Redis Cache, Data Warehouse |
| Infrastructure | Kubernetes, AWS ECS, Load Balancer |
| Hardware | Bare Metal, VM Cluster, Edge Node |
| Operations | CI/CD Pipeline, Monitoring, Incident Management |

### Plugin Swap

`src/engine/swapPlugin.ts` — `swapPlugin(workspace, layer, newPluginId)` replaces the active plugin for a layer, emits a `layer.plugin.swap` command, and recalculates simulation metrics.

---

## 18. Workflow & Onboarding

**Location:** `src/workflow/`

### 18.1 Workflow Modes

```typescript
type WorkflowMode = 'build' | 'analyze' | 'replay'
```

Each mode has a defined workflow with sequential steps (`WorkflowStep[]`) and completion criteria (`WorkflowCriteria`).

### 18.2 Starter Workflows

`src/workflow/workflowDefinitions.ts` defines:

- **Build workflow** — 7 steps: create workspace → add layers → define entities → connect relationships → add to canvas → validate → checkpoint
- **Analyze workflow** — 5 steps: open graph → select focus mode → explore impact → review health → export
- **Replay workflow** — 4 steps: open timeline → step through commands → compare states → restore

### 18.3 Progression Tracker

`progressionTracker.ts` — `trackProgress(workflow, workspaceState)`:

- Evaluates `WorkflowCriteria` against current workspace state
- Returns `WorkflowProgress` (completed steps, next step, completion %)
- Drives the `WorkflowProgressTracker` UI bar

### 18.4 Starter Workspace Wizard

A 4-step modal wizard (`StarterWorkspaceWizard.tsx`):

1. **Choose template** — pre-built architecture templates (microservices, event-driven, layered monolith, etc.)
2. **Set goals** — select the workspace purpose
3. **Configure** — name, description, initial layer selection
4. **Preview** — generated node/edge count, layer breakdown

`starterWorkspaceFactory.ts` seeds a `WorkspaceDocument` from the selected template with realistic demo data.

---

## 19. UI Shell & Design System

### 19.1 Shell Layout

`WorkspaceShell.tsx` implements a fixed 5-zone CSS grid:

```
┌─────────────────────────────────────┐
│              TOP BAR                 │  64px — TopCommandBar
├──────────┬──────────────┬───────────┤
│          │              │           │
│  LEFT    │    STAGE     │   RIGHT   │  remaining height
│  272px   │  (flexible)  │   340px   │
│          │              │           │
├──────────┴──────────────┴───────────┤
│              BOTTOM                  │  240px — Timeline / History
└─────────────────────────────────────┘
```

Panels are collapsible with CSS grid column/row transitions at `var(--ds-motion-base)` (180ms).

### 19.2 Design Tokens

All tokens are defined in `src/design-system/tokens.ts` and exported as CSS custom properties in `src/theme/theme.css`:

```css
/* Spacing */
--ds-space-1: 4px   --ds-space-2: 8px   --ds-space-3: 12px
--ds-space-4: 16px  --ds-space-6: 24px  --ds-space-8: 32px

/* Typography */
--ds-type-metadata: 11px   --ds-type-secondary: 13px
--ds-type-body: 14px       --ds-type-h3: 16px

/* Radius */
--ds-radius-sm: 7px   --ds-radius-md: 9px
--ds-radius-lg: 12px  --ds-radius-pill: 999px

/* Shadows */
--ds-shadow-panel:    0 14px 40px rgba(15, 23, 42, 0.07)
--ds-shadow-floating: 0 18px 60px rgba(15, 23, 42, 0.12)

/* Motion */
--ds-motion-fast: 120ms   --ds-motion-base: 180ms
--ds-motion-slow: 260ms   --ds-motion-ease: cubic-bezier(0.2, 0, 0, 1)

/* Mode accents */
--studio-accent: (blue/cyan/purple depending on mode)
```

### 19.3 Dark Mode

Dark mode is toggled via `document.documentElement.setAttribute('data-theme', 'dark')` (persisted in `localStorage`). The `[data-theme="dark"]` selector in `index.css` overrides all `--bg`, `--surface`, `--text*`, `--border*` variables. Component-specific dark overrides (canvas backgrounds, context menus, toasts) are in `App.css`.

Auto-detection: `window.matchMedia('(prefers-color-scheme: dark)')` is checked on first load if no preference is stored.

### 19.4 Toast Notifications

`src/toast/toastService.ts` — module-level singleton, no React context required:

```typescript
// Fire from any component or service
showToast('Node deleted', 'success')   // success | info | warning | error
showToast('Save failed', 'error', 5000) // custom duration ms
```

`ToastContainer` (`src/components/Toast.tsx`) subscribes and renders a bottom-right stack with `aria-live="polite"`, `@keyframes toast-in` slide-up animation.

### 19.5 Interaction Authority

`src/interaction/InteractionAuthority.ts` — module-level singleton managing which surface owns wheel and pointer events at any time:

```typescript
interactionAuthority.claimWheel('d3-graph')      // D3 gets scroll
interactionAuthority.releaseWheel('d3-graph')     // Stadium reclaims scroll
interactionAuthority.isWheelOwner('d3-graph')     // → true/false
```

`useInteractionSurface(id)` hook wires `onMouseEnter` / `onMouseLeave` to claim/release automatically.

### 19.6 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` | Open command palette |
| `CC` | Composition canvas view |
| `LA` | Layered architecture view |
| `DW` | Domain workspace |
| `GV` | Graph view |
| `TR` | Traceability workspace |
| `TL` | Timeline / replay |
| `RC` | Recovery panel |

### 19.7 Print Layout

`@media print` rules in `App.css`:
- Hides all chrome (toolbars, sidebars, guidance panels, cursors)
- Resets shell to static block layout
- Graph canvases fill 100% width with white backgrounds
- `panel { break-inside: avoid }` for clean page breaks
- Prints workspace name via CSS `::before` `content: attr(data-workspace-name)`

---

## 20. Organisation & Identity

**Location:** `src/org/`

### 20.1 Types

```typescript
type OrganizationRole = 'viewer' | 'editor' | 'admin' | 'owner'

type IdentityContext = {
  userId: string
  displayName: string
  email: string
  role: OrganizationRole
  organizationId: string
  organizationName: string
  departmentId?: string
  teamId?: string
}
```

### 20.2 Permission Guards

`src/org/permissionHelpers.ts`:

```typescript
canRead(identity)          // viewer and above
canWrite(identity)         // editor and above
canAdmin(identity)         // admin and above
canEditWorkspace(identity) // editor or above within org
```

### 20.3 Mock Identity

`MOCK_IDENTITY` — "Local Architect" at "Northstar Enterprise" with `admin` role — used when no authentication provider is connected.

---

## 21. Configuration

### 21.1 Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_WORKSPACE_API_BASE_URL` | (unset) | If set, uses API repository instead of localStorage |
| `PORT` (server) | `8787` | Express server port |

### 21.2 TypeScript Configuration

**Frontend (`tsconfig.app.json`):**
```json
{
  "target": "ES2023",
  "lib": ["ES2023", "DOM"],
  "module": "esnext",
  "moduleResolution": "bundler",
  "jsx": "react-jsx",
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**Backend (`server/tsconfig.json`):**
```json
{
  "target": "ES2022",
  "module": "NodeNext",
  "moduleResolution": "NodeNext",
  "strict": true,
  "outDir": "dist/",
  "rootDir": "src/"
}
```

### 21.3 Vite Configuration

```typescript
// vite.config.ts
plugins: [react()]
build: {
  chunkSizeWarningLimit: 900,
  rollupOptions: {
    output: {
      manualChunks: {
        'three-vendor': ['@react-three/fiber', '@react-three/drei', 'three', 'three-stdlib'],
        'd3-vendor': ['d3'],
      }
    }
  }
}
```

---

## 22. Sprint Delivery Log

| Sprint | What was built | Key files |
|---|---|---|
| **12** | Org & permission foundation; backend validation (PUT mismatch guard); typed workspace document structs | `src/org/`, `server/src/routes/workspaces.ts`, `server/src/types/workspaceDocument.ts` |
| **13** | TraceHighlightState D3 wiring — `is-impacted` (purple) and `is-missing-link` (orange) CSS classes applied in D3 render | `D3EnterpriseGraph.tsx`, `App.css` |
| **14** | Canvas authoring hardening — `removeNode`, `removeEdge`, `duplicateNodes` pure state functions; `useCanvasHistory` undo/redo hook; Del/Ctrl+Z/Ctrl+D keyboard shortcuts; hover ✕ delete button on nodes | `compositionState.ts`, `useCanvasHistory.ts`, `EnterpriseCompositionCanvas.tsx`, `CompositionToolbar.tsx`, `CanvasNodeCard.tsx` |
| **22A.2** | Interaction authority system — `SurfaceId` union, `claimWheel`/`releaseWheel`; RAF-based `CameraController`; all three visualization surfaces wired | `InteractionAuthority.ts`, `useInteractionSurface.ts`, `CameraController.ts`, `StadiumWorkspace.tsx` |
| **15** | Canvas interaction polish — marquee rubber-band selection; drag-to-connect port handles; inline node rename (foreignObject input); node right-click context menu | `EnterpriseCompositionCanvas.tsx`, `CanvasNodeCard.tsx`, `ConnectionPreview.tsx` |
| **16** | Visual export & dark mode — `downloadSvg`/`downloadSvgAsPng` utilities; D3 SVG export; composition PNG export; dark mode CSS vars; theme toggle button | `exportCanvas.ts`, `GraphToolbar.tsx`, `CompositionToolbar.tsx`, `index.css`, `App.tsx` |
| **17** | Intelligence view polish — D3 node position persistence (drag-end saves `fx`/`fy`); Three.js RAF camera lerp animation (420ms ease-in-out); D3 hover peek card | `D3EnterpriseGraph.tsx`, `ThreeArchitectureView.tsx`, `GraphToolbar.tsx` |
| **18** | UX feedback — toast singleton service; `ToastContainer`; `showToast()` calls on delete/undo/redo/duplicate/rename/export | `toastService.ts`, `Toast.tsx`, `App.tsx`, `EnterpriseCompositionCanvas.tsx` |
| **19** | Three.js 3D node drag — `DragPlane` component; `SpatialNodeMesh` drag lifecycle; `nodeGroupRefs` imperative position updates | `ThreeArchitectureView.tsx` |
| **20** | D3 minimap navigation — interactive SVG minimap with click-to-pan and viewport indicator rect; `zoomTransform` state tracked and passed down | `GraphMiniMap.tsx`, `D3EnterpriseGraph.tsx` |
| **21** | WebSocket collaboration — `wsCollaborationService` singleton; `useWsCollaboration` hook; `WsCursorLayer`; cursor broadcast on `onCanvasPointerMove` | `wsCollaborationService.ts`, `useWsCollaboration.ts`, `WsCursorLayer.tsx`, `LayeredWorkspace.tsx`, `StadiumWorkspace.tsx` |
| **22** | Print layout — `@media print` CSS; studio shell collapses to static block; canvas areas fill full width; `break-inside: avoid` on panels | `App.css` |

---

## 23. Running the Project

### 23.1 Prerequisites

- Node.js ≥ 22
- npm ≥ 10

### 23.2 Frontend (dev)

```bash
# From repo root
npm install
npm run dev
# → http://localhost:5173
```

### 23.3 Backend (optional)

```bash
cd server
npm install
npm run dev
# → http://localhost:8787
```

To connect the frontend to the backend, set:

```bash
# .env.local
VITE_WORKSPACE_API_BASE_URL=http://localhost:8787
```

### 23.4 Type Check

```bash
npx tsc --noEmit   # must return zero errors
```

### 23.5 Production Build

```bash
npm run build
# Output: dist/
# Three.js and D3 are split into separate vendor chunks
```

### 23.6 WebSocket Collaboration (optional)

The WS collaboration service connects to `ws://localhost:3001/collab`. The frontend degrades gracefully when this endpoint is unavailable — all authoring features work offline. To enable live cursors, a WebSocket server implementing the `WsCursorEvent` and `WsPresenceEvent` message schema must be running at that address.

---

## Appendix A — File Count Summary

| Area | Files | Approx. Lines |
|---|---|---|
| Core types | 3 | 156 |
| Graph engine | 4 | ~300 |
| Composition canvas | 10 | ~480 |
| Domain entities | 4 | ~180 |
| Editor & commands | 14 | ~650 |
| Workspace persistence | 11 | ~740 |
| Intelligence & health | 11 | ~300 |
| Traceability | 6 | ~200 |
| Collaboration | 9 | ~280 |
| Visualization (D3) | 9 | ~300 |
| Three.js scene | 6 | ~200 |
| Services & API clients | 10 | ~350 |
| Simulation & plugins | 2 | ~240 |
| Workflow & onboarding | 8 | ~360 |
| Design system & theme | 10 | ~200 |
| React components | 70+ | ~4500 |
| **Total (src/)** | **~264** | **~14 000** |

---

## Appendix B — CSS Custom Properties Reference

```css
/* Surfaces */
--bg              Background (page)
--surface         Panel / card background
--surface-subtle  Muted section background
--border          Default border
--border-strong   Emphasis border
--text            Body text
--text-strong     Heading / emphasis text
--muted           Subdued text / labels
--shadow          Default shadow

/* Studio shell */
--studio-panel           Panel surface
--studio-panel-strong    Topbar / bottom bar surface
--studio-line            Panel border colour
--studio-grid            Grid dot colour
--studio-accent          Mode-specific accent (blue / cyan / purple)
--studio-accent-soft     Accent border
--studio-accent-muted    Accent fill (low-opacity)
--canvas                 Stage background

/* Design scale */
--ds-space-*      Spacing (1–16)
--ds-type-*       Font sizes
--ds-radius-*     Border radii
--ds-shadow-*     Shadow levels
--ds-motion-*     Durations & easings
```

---

*Documentation generated from live codebase scan — 2026-05-18*
