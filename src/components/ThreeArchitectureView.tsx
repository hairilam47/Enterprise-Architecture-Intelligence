import { Html, Line, OrbitControls, PerspectiveCamera, Text } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { findImpactPath, traverseDownstream, traverseUpstream } from '../graph/traverseGraph'
import { buildThreeScene } from '../three/buildThreeScene'
import type { SpatialEdge, SpatialNode } from '../three/sceneTypes'
import { getCameraPreset, type ThreeCameraPreset } from '../three/threeCameraPresets'
import { describeThreeInteractionState } from '../three/threeInteractionState'
import { getThreePerformanceSummary } from '../three/threePerformance'
import type { VisualGraph } from '../visualization/visualGraph'
import type { TraceHighlightState } from '../traceability/traceabilityTypes'
import { GraphInspector } from './GraphInspector'
import { ThreeSceneLegend } from './ThreeSceneLegend'
import { ThreeViewToolbar } from './ThreeViewToolbar'
import { useInteractionSurface } from '../interaction/useInteractionSurface'

type ThreeArchitectureViewProps = {
  visualGraph: VisualGraph
  traceHighlight?: TraceHighlightState
}

function statusColor(status: SpatialNode['status']) {
  if (status === 'selected') return '#0f172a'
  if (status === 'warning') return '#f59e0b'
  if (status === 'bottleneck') return '#dc2626'
  return '#ffffff'
}

function edgeColor(status: SpatialEdge['status']) {
  if (status === 'highlighted') return '#0f172a'
  if (status === 'warning') return '#f59e0b'
  if (status === 'bottleneck') return '#dc2626'
  return '#94a3b8'
}

function CameraActions({
  selectedNode,
  focusSignal,
  cameraPreset,
  layerYPosition,
}: {
  selectedNode?: SpatialNode
  focusSignal: number
  cameraPreset: ThreeCameraPreset
  layerYPosition: number
}) {
  const controls = useRef<OrbitControlsImpl | null>(null)
  const animRef = useRef<number>()
  const { camera } = useThree()

  useEffect(() => {
    if (!controls.current) return
    const preset = getCameraPreset(cameraPreset, selectedNode, layerYPosition)
    const [px, py, pz] = preset.position
    const [tx, ty, tz] = preset.target

    const fromPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    const fromTarget = {
      x: controls.current.target.x,
      y: controls.current.target.y,
      z: controls.current.target.z,
    }

    const startTime = performance.now()
    const DURATION = 420

    function ease(t: number) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    }
    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t
    }

    function tick() {
      const raw = Math.min((performance.now() - startTime) / DURATION, 1)
      const e = ease(raw)
      camera.position.set(lerp(fromPos.x, px, e), lerp(fromPos.y, py, e), lerp(fromPos.z, pz, e))
      controls.current!.target.set(lerp(fromTarget.x, tx, e), lerp(fromTarget.y, ty, e), lerp(fromTarget.z, tz, e))
      controls.current!.update()
      if (raw < 1) animRef.current = requestAnimationFrame(tick)
    }

    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(tick)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [camera, cameraPreset, focusSignal, layerYPosition, selectedNode])

  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} />
}

function DragPlane({
  active,
  planeY,
  onMove,
  onUp,
}: {
  active: boolean
  planeY: number
  onMove: (x: number, z: number) => void
  onUp: () => void
}) {
  if (!active) return null
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, planeY, 0]}
      onPointerMove={(event) => { event.stopPropagation(); onMove(event.point.x, event.point.z) }}
      onPointerUp={(event) => { event.stopPropagation(); onUp() }}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  )
}

function SpatialNodeMesh({
  node,
  showLabels,
  isDependency,
  nodeScale,
  positionOverride,
  onSelect,
  onHover,
  onDragStart,
  onRef,
}: {
  node: SpatialNode
  showLabels: boolean
  isDependency: boolean
  nodeScale: number
  positionOverride?: { x: number; z: number }
  onSelect: (node: SpatialNode) => void
  onHover: (node?: SpatialNode) => void
  onDragStart: (id: string, planeY: number) => void
  onRef: (id: string, ref: THREE.Group | null) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const scaledSize = node.size * nodeScale
  const ringScale = node.status === 'selected' || isDependency ? 1.45 : 1.18
  const px = positionOverride?.x ?? node.position.x
  const pz = positionOverride?.z ?? node.position.z

  useEffect(() => {
    onRef(node.id, groupRef.current)
    return () => { onRef(node.id, null) }
  }, [node.id, onRef])

  return (
    <group ref={groupRef} position={[px, node.position.y, pz]}>
      <mesh
        onPointerDown={(event) => {
          event.stopPropagation()
          onDragStart(node.id, node.position.y)
        }}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(node)
        }}
        onPointerEnter={(event) => {
          event.stopPropagation()
          onHover(node)
        }}
        onPointerLeave={() => onHover(undefined)}
      >
        <sphereGeometry args={[scaledSize, 24, 16]} />
        <meshStandardMaterial color={node.color} roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh scale={ringScale}>
        <sphereGeometry args={[scaledSize, 24, 16]} />
        <meshBasicMaterial color={isDependency ? '#fef3c7' : statusColor(node.status)} wireframe transparent opacity={0.75} />
      </mesh>
      {(node.status === 'warning' || node.status === 'bottleneck') && (
        <Html position={[0, scaledSize + 0.18, 0]} center>
          <span className={`three-marker ${node.status}`}>{node.status === 'warning' ? '!' : 'B'}</span>
        </Html>
      )}
      {showLabels && (
        <Text position={[0, -scaledSize - 0.18, 0]} fontSize={0.13} color="#0f172a" anchorX="center" anchorY="middle" maxWidth={1.4}>
          {node.label}
        </Text>
      )}
    </group>
  )
}

export function ThreeArchitectureView({ visualGraph, traceHighlight }: ThreeArchitectureViewProps) {
  const { onEnter, onLeave } = useInteractionSurface('three-view')
  const [showLabels, setShowLabels] = useState(true)
  const [showWarnings, setShowWarnings] = useState(true)
  const [showBottlenecks, setShowBottlenecks] = useState(true)
  const [showDependencies, setShowDependencies] = useState(true)
  const [layerFocus, setLayerFocus] = useState('')
  const [viewMode, setViewMode] = useState<'stack' | 'topology'>('stack')
  const [cameraPreset, setCameraPreset] = useState<ThreeCameraPreset>('default')
  const [lineOpacity, setLineOpacity] = useState(0.55)
  const [nodeScale, setNodeScale] = useState(1)
  const [selectedNodeId, setSelectedNodeId] = useState(visualGraph.nodes[0]?.id)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | undefined>()
  const [focusSignal, setFocusSignal] = useState(0)
  const [dragging, setDragging] = useState<{ nodeId: string; planeY: number } | null>(null)
  const spatialPositions = useRef<Map<string, { x: number; z: number }>>(new Map())
  const nodeGroupRefs = useRef<Map<string, THREE.Group | null>>(new Map())
  const [spatialPosVersion, setSpatialPosVersion] = useState(0)
  const selectedVisualNode = visualGraph.nodes.find((node) => node.id === selectedNodeId)
  const hoverPath = useMemo(() => {
    const enterpriseNodeId = hoveredNodeId?.replace('visual:', '')
    if (!enterpriseNodeId) return undefined
    const upstream = traverseUpstream(visualGraph.sourceGraph, enterpriseNodeId)
    const downstream = traverseDownstream(visualGraph.sourceGraph, enterpriseNodeId)
    return new Set([...upstream.nodeIds, ...downstream.nodeIds].map((id) => `spatial:visual:${id}`))
  }, [hoveredNodeId, visualGraph.sourceGraph])
  const selectedPath = useMemo(() => {
    if (!selectedVisualNode) return undefined
    const lastNode = visualGraph.sourceGraph.nodes.at(-1)?.id ?? selectedVisualNode.enterpriseNodeId
    return findImpactPath(visualGraph.sourceGraph, selectedVisualNode.enterpriseNodeId, lastNode)
  }, [selectedVisualNode, visualGraph.sourceGraph])
  const highlightedEdgeIds = useMemo(
    () => new Set((traceHighlight?.selectedTracePath?.edgeIds ?? selectedPath?.edgeIds ?? []).map((id) => `visual:${id}`)),
    [selectedPath, traceHighlight?.selectedTracePath?.edgeIds],
  )
  const scene = useMemo(
    () =>
      buildThreeScene(visualGraph, {
        selectedNodeId,
        highlightedEdgeIds,
        showWarnings,
        showBottlenecks,
        layerFocus,
        viewMode,
      }),
    [highlightedEdgeIds, layerFocus, selectedNodeId, showBottlenecks, showWarnings, viewMode, visualGraph],
  )
  const selectedSpatialNode = scene.nodes.find((node) => node.id === `spatial:${selectedNodeId}`)
  const hoveredSpatialNode = scene.nodes.find((node) => node.id === `spatial:${hoveredNodeId}`)
  const focusedLayerY = scene.layers.find((layer) => layer.layer === layerFocus)?.yPosition ?? 3.8
  const performance = useMemo(() => getThreePerformanceSummary(scene), [scene])
  const effectiveShowLabels = showLabels && !performance.shouldHideLabels
  const interactionState = useMemo(
    () =>
      describeThreeInteractionState({
        hoveredNodeLabel: hoveredSpatialNode?.label,
        selectedNodeLabel: selectedSpatialNode?.label,
        highlightedDependencyCount: hoverPath?.size ?? 0,
        focusedLayer: layerFocus,
        activeCameraPreset: cameraPreset,
      }),
    [cameraPreset, hoverPath?.size, hoveredSpatialNode?.label, layerFocus, selectedSpatialNode?.label],
  )

  return (
    <section className="three-view-panel panel" aria-label="Three spatial architecture view" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className="comparison-panel__header">
        <div>
          <p className="eyebrow">Three.js Spatial View</p>
          <h2>Layer topology and risk space</h2>
        </div>
        <div className="graph-telemetry">
          <span>{scene.layers.length} planes</span>
          <span>{scene.nodes.length} spatial nodes</span>
          <span>{scene.edges.length} dependency lines</span>
        </div>
      </div>

      <ThreeViewToolbar
        showLabels={showLabels}
        showWarnings={showWarnings}
        showBottlenecks={showBottlenecks}
        showDependencies={showDependencies}
        layerFocus={layerFocus}
        viewMode={viewMode}
        cameraPreset={cameraPreset}
        lineOpacity={lineOpacity}
        nodeScale={nodeScale}
        onShowLabelsChange={setShowLabels}
        onShowWarningsChange={setShowWarnings}
        onShowBottlenecksChange={setShowBottlenecks}
        onShowDependenciesChange={setShowDependencies}
        onLayerFocusChange={setLayerFocus}
        onViewModeChange={setViewMode}
        onCameraPresetChange={setCameraPreset}
        onLineOpacityChange={setLineOpacity}
        onNodeScaleChange={setNodeScale}
        onResetCamera={() => {
          setCameraPreset('default')
          setFocusSignal((value) => value + 1)
        }}
        onFocusSelected={() => {
          setCameraPreset('selected_node_focus')
          setFocusSignal((value) => value + 1)
        }}
      />

      <div className="three-view-layout">
        <div className="three-canvas-shell">
          <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
            <PerspectiveCamera makeDefault position={[3.8, 7.2, 7.8]} fov={46} />
            <CameraActions
              selectedNode={selectedSpatialNode}
              focusSignal={focusSignal}
              cameraPreset={cameraPreset}
              layerYPosition={focusedLayerY}
            />
            <ambientLight intensity={0.72} />
            <directionalLight position={[4, 8, 6]} intensity={1.1} />
            <gridHelper args={[12, 12, '#cbd5e1', '#e2e8f0']} position={[0, -1.6, 0]} />

            {scene.layers.map((layer) => (
              <group key={layer.id} position={[0, layer.yPosition, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[8.8, 4.8]} />
                  <meshStandardMaterial color={layer.color} transparent opacity={layer.opacity} />
                </mesh>
                <Text position={[-4.65, 0.03, -2.15]} fontSize={0.18} color={layer.color} anchorX="left">
                  {layer.name}
                </Text>
              </group>
            ))}

            {showDependencies &&
              scene.edges.map((edge) => (
                <Line
                  key={edge.id}
                  points={edge.points.map((point) => [point.x, point.y, point.z])}
                  color={edgeColor(edge.status)}
                  lineWidth={edge.status === 'highlighted' ? 3 : 1.4}
                  transparent
                  opacity={edge.status === 'normal' ? lineOpacity : Math.min(1, lineOpacity + 0.35)}
                />
              ))}

            <DragPlane
              active={!!dragging}
              planeY={dragging?.planeY ?? 0}
              onMove={(x, z) => {
                if (!dragging) return
                const group = nodeGroupRefs.current.get(dragging.nodeId)
                if (group) { group.position.x = x; group.position.z = z }
              }}
              onUp={() => {
                if (!dragging) return
                const group = nodeGroupRefs.current.get(dragging.nodeId)
                if (group) {
                  spatialPositions.current.set(dragging.nodeId, { x: group.position.x, z: group.position.z })
                }
                setDragging(null)
                setSpatialPosVersion((v) => v + 1)
              }}
            />

            {scene.nodes.map((node) => (
              <SpatialNodeMesh
                key={node.id}
                node={node}
                showLabels={effectiveShowLabels}
                isDependency={hoverPath?.has(node.id) ?? false}
                nodeScale={nodeScale}
                positionOverride={spatialPosVersion >= 0 ? spatialPositions.current.get(node.id) : undefined}
                onSelect={(nextNode) => { if (!dragging) setSelectedNodeId(nextNode.id.replace('spatial:', '')) }}
                onHover={(nextNode) => setHoveredNodeId(nextNode?.id.replace('spatial:', ''))}
                onDragStart={(id, planeY) => setDragging({ nodeId: id, planeY })}
                onRef={(id, ref) => nodeGroupRefs.current.set(id, ref)}
              />
            ))}
          </Canvas>
        </div>
        <div className="graph-side">
          <GraphInspector selectedNode={selectedVisualNode} />
          <aside className="panel three-state-panel" aria-label="Three interaction state">
            <div className="panel__header">
              <p className="eyebrow">Interaction State</p>
              <h2>Current focus</h2>
            </div>
            <ul className="assistant-notes">
              {interactionState.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
          <ThreeSceneLegend performance={performance} />
          <aside className="panel overlay-panel">
            <div className="panel__header">
              <p className="eyebrow">Spatial Reading</p>
              <h2>How to use it</h2>
            </div>
            <ul className="assistant-notes">
              <li>Layer planes show where enterprise capabilities live.</li>
              <li>Vertical dependency lines reveal cross-layer coupling.</li>
              <li>Warning and bottleneck markers make risk visible in context.</li>
              <li>D3 remains the analytical relationship view; this view is spatial understanding.</li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
