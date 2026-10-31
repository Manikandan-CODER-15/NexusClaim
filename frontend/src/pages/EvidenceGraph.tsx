import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardHeader, CardContent, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';

type GraphResponse = {
  nodes: Array<{
    id: string;
    type: string;
    data: { label: string; [key: string]: any };
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    animated?: boolean;
    data?: any;
  }>;
};

const nodeColorMap: Record<string, string> = {
  claim: '#3B82F6', // primary
  photo: '#60A5FA',
  statement: '#22C55E',
  repair_estimate: '#F59E0B',
  policy_doc: '#EF4444',
  finding: '#64748B',
  hypothesis: '#A78BFA',
  default: '#94A3B8',
};

const nodeStyles = (type: string) => ({
  background: nodeColorMap[type] ?? nodeColorMap.default,
  color: '#fff',
  border: '1px solid #fff',
  borderRadius: '4px',
  padding: '8px',
});

const EvidenceGraph: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const { t } = useTranslation();
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const fetchGraph = useCallback(async () => {
    if (!claimId) return;
    const token = localStorage.getItem('access_token');
    const resp = await axios.get(`/api/claims/${claimId}/graph`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setGraph(resp.data);
  }, [claimId]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  useEffect(() => {
    if (!graph) return;
    // Transform backend nodes to React Flow nodes
    const rfNodes = graph.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      data: { label: n.data.label },
      position: n.position,
      style: nodeStyles(n.type),
    }));
    const rfEdges = graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.animated,
      style: { stroke: '#64748B' },
    }));
    setNodes(rfNodes);
    setEdges(rfEdges);
    setLoading(false);
  }, [graph, setNodes, setEdges]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  return (
    <Card className="bg-card">
      <CardHeader title={t('graph.title') ?? 'Evidence Graph'} />
      <CardContent className="h-[600px]">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="top-right"
          >
            <MiniMap />
            <Controls />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </ReactFlowProvider>
      </CardContent>
    </Card>
  );
};

export default EvidenceGraph;

