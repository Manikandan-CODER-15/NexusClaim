import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RefreshCw, 
  Info, ChevronRight, Activity 
} from 'lucide-react';
import { api } from '../api';
import type { Claim } from '../api';

interface GraphNode {
  id: string;
  type: string;
  data: {
    label: string;
    subtitle?: string;
    description?: string;
    category?: string;
    confidence?: number;
    probability?: number;
    is_contradiction?: boolean;
    [key: string]: any;
  };
  position: { x: number; y: number };
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  animated?: boolean;
  data?: any;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: {
    total_nodes: number;
    total_edges: number;
    contradiction_count: number;
    active_hypotheses: number;
  };
}

const EvidenceGraph: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claimId || '');
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load claims dropdown if none selected
  useEffect(() => {
    api.get<Claim[]>('/api/claims').then((res) => {
      setClaims(res || []);
      if (!selectedClaimId && res && res.length > 0) {
        setSelectedClaimId(res[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (claimId) setSelectedClaimId(claimId);
  }, [claimId]);

  const fetchGraph = async (cid: string) => {
    if (!cid) return;
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    try {
      const data = await api.get<GraphData>(`/api/claims/${cid}/graph`);
      setGraph(data);
      if (data.nodes && data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve evidence graph for this claim');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClaimId) {
      fetchGraph(selectedClaimId);
    }
  }, [selectedClaimId]);

  const getNodeColor = (type: string, isContradiction?: boolean) => {
    if (isContradiction) return { bg: 'bg-rose-500', border: 'border-rose-400', badge: 'bg-rose-100 text-rose-800' };
    switch (type) {
      case 'claim':
        return { bg: 'bg-indigo-600', border: 'border-indigo-400', badge: 'bg-indigo-100 text-indigo-800' };
      case 'photo':
      case 'statement':
      case 'repair_estimate':
      case 'policy_doc':
        return { bg: 'bg-amber-500', border: 'border-amber-400', badge: 'bg-amber-100 text-amber-800' };
      case 'finding':
        return { bg: 'bg-blue-600', border: 'border-blue-400', badge: 'bg-blue-100 text-blue-800' };
      case 'hypothesis':
        return { bg: 'bg-purple-600', border: 'border-purple-400', badge: 'bg-purple-100 text-purple-800' };
      default:
        return { bg: 'bg-slate-600', border: 'border-slate-400', badge: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/claims')}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Evidence Reasoning Graph</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multimodal cross-evidence corroboration, contradiction detection & hypotheses
            </p>
          </div>
        </div>

        {/* Claim Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Claim:</span>
          <select
            value={selectedClaimId}
            onChange={(e) => setSelectedClaimId(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            {claims.map((c) => (
              <option key={c.id} value={c.id}>
                {c.claim_number} ({c.category})
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchGraph(selectedClaimId)}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Refresh Graph"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {graph && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Entities</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{graph.summary.total_nodes}</div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400">Reasoning Links</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{graph.summary.total_edges}</div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400">Contradictions</div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{graph.summary.contradiction_count}</div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400">Hypotheses Evaluated</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{graph.summary.active_hypotheses}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Main Interactive Graph Canvas & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Canvas (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6 min-h-[500px] flex flex-col justify-between relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between mb-4 z-10">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Activity size={14} className="text-emerald-400" />
              <span>Interactive Knowledge Graph</span>
            </div>
            <div className="flex items-center space-x-3 text-[10px] text-slate-300">
              <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span><span>Claim</span></span>
              <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span><span>Evidence</span></span>
              <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span>Finding</span></span>
              <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span><span>Hypothesis</span></span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-72 space-x-2 text-slate-400 text-sm">
              <RefreshCw size={20} className="animate-spin text-indigo-400" />
              <span>Assembling Multimodal Graph Nodes...</span>
            </div>
          ) : !graph || graph.nodes.length === 0 ? (
            <div className="flex items-center justify-center h-72 text-slate-500 text-sm">
              No reasoning graph nodes generated yet for this claim.
            </div>
          ) : (
            <div className="relative flex-1 py-8 flex flex-col items-center justify-center space-y-8">
              {/* Nodes Display by Tier */}
              <div className="w-full flex flex-wrap gap-4 justify-center items-center">
                {graph.nodes.map((node) => {
                  const style = getNodeColor(node.type, node.data.is_contradiction);
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3 rounded-xl text-left transition-all max-w-[200px] ${style.bg} text-white shadow-lg border-2 ${
                        isSelected ? 'border-white scale-105 ring-4 ring-indigo-500/50' : 'border-transparent hover:scale-102 opacity-90'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-0.5">
                        {node.type}
                      </div>
                      <div className="text-xs font-semibold truncate" title={node.data.label}>
                        {node.data.label}
                      </div>
                      {node.data.subtitle && (
                        <div className="text-[10px] opacity-75 truncate">{node.data.subtitle}</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Connected Relationships List */}
              {graph.edges && graph.edges.length > 0 && (
                <div className="w-full pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    Active Verified Links ({graph.edges.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {graph.edges.map((e) => (
                      <span
                        key={e.id}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                          e.animated ? 'bg-rose-950/60 text-rose-300 border-rose-800 animate-pulse' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {e.label || e.type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inspector Sidebar (1 Column) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
              <Info size={16} className="text-indigo-600" />
              <span>Node Inspector</span>
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Type: {selectedNode.type}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedNode.data.label}
                  </h3>
                </div>

                {selectedNode.data.description && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 leading-relaxed">
                    {selectedNode.data.description}
                  </div>
                )}

                {selectedNode.data.confidence !== undefined && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Confidence Score</span>
                      <span className="font-semibold text-indigo-600">
                        {(Number(selectedNode.data.confidence) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full" 
                        style={{ width: `${Number(selectedNode.data.confidence) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {selectedNode.data.probability !== undefined && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Hypothesis Probability</span>
                      <span className="font-semibold text-purple-600">
                        {(Number(selectedNode.data.probability) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full" 
                        style={{ width: `${Number(selectedNode.data.probability) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-12 text-center">
                Select any node on the graph canvas to inspect its multimodal telemetry, bounding boxes, and cross-evidence links.
              </div>
            )}
          </div>

          <button
            onClick={() => navigate(`/claims/${selectedClaimId}`)}
            className="w-full mt-6 py-2.5 px-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold text-xs rounded-xl hover:bg-indigo-100 transition flex items-center justify-center space-x-1.5"
          >
            <span>Open Claim Investigation Dossier</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvidenceGraph;
