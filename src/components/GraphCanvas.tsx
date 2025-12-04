import { useCallback, useEffect } from 'react';
import * as React from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './GraphCanvas.css';
import * as d3 from 'd3-force';
import { Sun, Moon } from 'lucide-react';

interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (node: Node) => void;
  selectedNodeId: string | null;
  colorMode: 'light' | 'dark';
  setColorMode: (mode: 'light' | 'dark') => void;
}

// Force-directed layout using D3
function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  // Convert edges to D3 format with source/target references
  const d3Edges = edges.map(edge => ({
    source: edge.source,
    target: edge.target,
  }));

  const simulation = d3.forceSimulation(nodes as any)
    .force('charge', d3.forceManyBody().strength(-1500))
    .force('center', d3.forceCenter(800, 400))
    .force('collision', d3.forceCollide().radius(150))
    .force('link', d3.forceLink(d3Edges)
      .id((d: any) => d.id)
      .distance(350)
      .strength(0.5)
    )
    .stop();

  // Run simulation synchronously
  for (let i = 0; i < 300; i++) {
    simulation.tick();
  }

  const layoutedNodes = nodes.map((node: any) => ({
    ...node,
    position: {
      x: node.x || 0,
      y: node.y || 0,
    },
  }));

  return { nodes: layoutedNodes, edges };
}

export function GraphCanvas({ nodes, edges, onNodeClick, selectedNodeId, colorMode, setColorMode }: GraphCanvasProps) {
  const [nodesState, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [layoutedNodes, setLayoutedNodes] = React.useState<Node[]>([]);

  // Run layout only when nodes/edges change, not when selection changes
  useEffect(() => {
    const { nodes: lNodes, edges: lEdges } = getLayoutedElements(nodes, edges);
    setLayoutedNodes(lNodes);
    setEdges(lEdges);
  }, [nodes, edges, setEdges]);

  // Find connected node IDs for the selected node
  const connectedNodeIds = React.useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const connected = new Set<string>();
    edges.forEach(edge => {
      if (edge.source === selectedNodeId) connected.add(edge.target);
      if (edge.target === selectedNodeId) connected.add(edge.source);
    });
    return connected;
  }, [selectedNodeId, edges]);

  // Apply selection styling and theme colors separately without re-running layout
  useEffect(() => {
    if (layoutedNodes.length === 0) return;

    const applyNodeStyles = (node: Node) => {
      const isSelected = node.id === selectedNodeId;
      const isConnected = connectedNodeIds.has(node.id);
      const nodeType = node.data?.type;

      let borderColor = '#10b981'; // default emerald
      let textColor = '#10b981';
      if (nodeType === 'tag') {
        borderColor = '#f87171';
        textColor = '#f87171';
      }
      if (nodeType === 'variable') {
        borderColor = '#3b82f6';
        textColor = '#3b82f6';
      }

      const backgroundColor = colorMode === 'dark' ? '#1a2332' : '#ffffff';
      
      // Different glow intensities: selected (big), connected (medium), default (subtle)
      let boxShadow: string;
      if (colorMode === 'dark') {
        if (isSelected) {
          boxShadow = `0 0 30px ${borderColor}, 0 0 60px ${borderColor}88`;
        } else if (isConnected) {
          boxShadow = `0 0 15px ${borderColor}aa, 0 0 30px ${borderColor}55`;
        } else {
          boxShadow = `0 0 20px ${borderColor}66`;
        }
      } else {
        if (isSelected) {
          boxShadow = `0 0 20px ${borderColor}88, 0 4px 6px -1px rgba(0, 0, 0, 0.1)`;
        } else if (isConnected) {
          boxShadow = `0 0 12px ${borderColor}66, 0 4px 6px -1px rgba(0, 0, 0, 0.1)`;
        } else {
          boxShadow = `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`;
        }
      }

      let className = '';
      if (isSelected) className = 'selected-node';
      else if (isConnected) className = 'connected-node';

      return {
        ...node,
        style: {
          ...node.style,
          backgroundColor,
          color: textColor,
          border: isSelected ? `5px solid ${borderColor}` : isConnected ? `4px solid ${borderColor}` : `3px solid ${borderColor}`,
          boxShadow,
        },
        selected: isSelected,
        className
      };
    };

    setNodes((currentNodes) => {
      // If no current nodes, use layoutedNodes
      if (currentNodes.length === 0) {
        return layoutedNodes.map(applyNodeStyles);
      }
      // Otherwise, preserve current positions and only update styling
      return currentNodes.map(applyNodeStyles);
    });
  }, [layoutedNodes, selectedNodeId, connectedNodeIds, setNodes, colorMode]);

  // Update edge styling based on selection
  useEffect(() => {
    if (!edges.length) return;
    
    setEdges(currentEdges => 
      currentEdges.map(edge => {
        const isConnectedEdge = selectedNodeId && 
          (edge.source === selectedNodeId || edge.target === selectedNodeId);
        
        return {
          ...edge,
          className: isConnectedEdge ? 'connected-edge' : '',
          animated: isConnectedEdge ? true : false,
        };
      })
    );
  }, [selectedNodeId, edges, setEdges]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick(node);
    },
    [onNodeClick]
  );

  return (
    <div className={`w-full h-screen ${colorMode === 'dark' ? 'bg-[#0f1419]' : 'bg-slate-50'}`} data-theme={colorMode}>
      {/* Light/Dark Mode Toggle */}
      <button
        onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
        className={`absolute top-4 right-4 z-10 p-3 rounded-lg transition-colors shadow-lg ${
          colorMode === 'dark'
            ? 'bg-[#1a2332] border border-slate-700 hover:border-emerald-500'
            : 'bg-white border border-slate-300 hover:border-emerald-500'
        }`}
        aria-label="Toggle theme"
      >
        {colorMode === 'dark' ? (
          <Sun className="w-5 h-5 text-emerald-500" />
        ) : (
          <Moon className="w-5 h-5 text-slate-700" />
        )}
      </button>

      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.25}
        maxZoom={2}
        colorMode={colorMode}
      >
        <Background color={colorMode === 'dark' ? '#1a2332' : '#e2e8f0'} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.type === 'tag') return '#f87171';
            if (node.data.type === 'trigger') return '#10b981';
            if (node.data.type === 'variable') return '#3b82f6';
            return '#4b5563';
          }}
          style={{
            background: colorMode === 'dark' ? '#0f1419' : '#ffffff',
            border: colorMode === 'dark' ? '1px solid #1e293b' : '1px solid #cbd5e1'
          }}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
