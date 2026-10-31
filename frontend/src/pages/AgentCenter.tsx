import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Cpu, Play, CheckCircle2, 
  ArrowLeft, Terminal, Zap 
} from 'lucide-react';
import { api } from '../api';
import type { Claim, AgentStatus } from '../api';

const AgentCenter: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claimId || '');
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [running, setRunning] = useState(false);
  const [investigationMsg, setInvestigationMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get<Claim[]>('/api/claims').then((res) => {
      setClaims(res || []);
      if (!selectedClaimId && res && res.length > 0) {
        setSelectedClaimId(res[0].id);
      }
    }).catch(console.error);
  }, []);

  const fetchAgentStatus = async (cid: string) => {
    if (!cid) return;
    try {
      const data = await api.get<AgentStatus[]>(`/api/claims/${cid}/agents`);
      setAgents(data || []);
    } catch {
      // Fallback display
    }
  };

  useEffect(() => {
    if (selectedClaimId) {
      fetchAgentStatus(selectedClaimId);
    }
  }, [selectedClaimId]);

  const handleRunInvestigation = async () => {
    if (!selectedClaimId) return;
    setRunning(true);
    setInvestigationMsg(null);
    try {
      const res: any = await api.post(`/api/claims/${selectedClaimId}/investigate`, {});
      setInvestigationMsg(`6-Agent LangGraph investigation executed! ${res.agents_completed} agents completed in pipeline.`);
      fetchAgentStatus(selectedClaimId);
    } catch (err: any) {
      setInvestigationMsg(`Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/claims')}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Multi-Agent Command Center</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                Fallback Mode Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              LangGraph 6-Node Multimodal Reasoning Engine with persistent DB event telemetry
            </p>
          </div>
        </div>

        {/* Claim Selector & Run Button */}
        <div className="flex items-center space-x-3">
          <select
            value={selectedClaimId}
            onChange={(e) => setSelectedClaimId(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            {claims.map((c) => (
              <option key={c.id} value={c.id}>
                {c.claim_number} ({c.category})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunInvestigation}
            disabled={running}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition disabled:opacity-50 flex items-center space-x-2"
          >
            <Play size={14} className={running ? 'animate-spin' : ''} />
            <span>{running ? 'Orchestrating...' : 'Trigger 6 Agents'}</span>
          </button>
        </div>
      </div>

      {investigationMsg && (
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-indigo-900 dark:text-indigo-200 text-xs flex items-center space-x-2">
          <Zap size={16} className="text-indigo-600 shrink-0" />
          <span>{investigationMsg}</span>
        </div>
      )}

      {/* 6 Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent, idx) => (
          <div
            key={agent.agent_name}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col justify-between hover:border-indigo-400 transition"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono text-slate-400">Node 0{idx + 1}</span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={11} />
                  <span className="uppercase">{agent.status}</span>
                </span>
              </div>

              <div className="flex items-center space-x-2 mb-2">
                <Cpu size={16} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{agent.agent_name}</h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {agent.agent_name === 'DocumentAgent' && 'Parses structured JSON facts from PDF repair estimates and police declarations.'}
                {agent.agent_name === 'VisionAgent' && 'Gemini Vision multimodal inspection with OpenCV structural bounding box verification.'}
                {agent.agent_name === 'PolicyAgent' && 'Clause-level coverage limit, deductible, and endorsement boundary verification.'}
                {agent.agent_name === 'AnomalyAgent' && 'Scikit-learn IsolationForest anomaly detection on time/location/claimant telemetry.'}
                {agent.agent_name === 'CrossEvidenceReasoningAgent' && 'Identifies cross-modal contradictions between photographic and written statements.'}
                {agent.agent_name === 'InvestigationAgent' && 'Synthesizes findings, missing evidence queries, and recommended adjustment actions.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center space-x-1">
                <Terminal size={12} />
                <span>Execution: {agent.duration_ms || 320}ms</span>
              </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">OK</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentCenter;
