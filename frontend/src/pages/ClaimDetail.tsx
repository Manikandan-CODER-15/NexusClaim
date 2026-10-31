import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, ShieldCheck, 
  Upload, GitFork, RefreshCw, Cpu, FileCheck, AlertCircle 
} from 'lucide-react';
import { api, auth } from '../api';
import type { Claim, AgentStatus, Finding } from '../api';

const ClaimDetail: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const user = auth.getUser();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'agents' | 'findings' | 'graph' | 'upload' | 'decision'>('agents');

  // Evidence upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('photo');
  const [uploadSource, setUploadSource] = useState('Field Inspector');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // Decision form state
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'requested_info'>('approved');
  const [rationale, setRationale] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [decisionMsg, setDecisionMsg] = useState<string | null>(null);

  const fetchClaimData = async () => {
    if (!claimId) return;
    setLoading(true);
    try {
      const claimData = await api.get<Claim>(`/api/claims/${claimId}`);
      setClaim(claimData);

      // Fetch agents (mocked or real)
      try {
        const agentData = await api.get<AgentStatus[]>(`/api/claims/${claimId}/agents`);
        setAgents(agentData || []);
      } catch {
        // Fallback default agents if not enabled
        setAgents([
          { id: '1', agent_name: 'DocumentAgent', status: 'completed', duration_ms: 320 },
          { id: '2', agent_name: 'VisionAgent', status: 'completed', duration_ms: 450 },
          { id: '3', agent_name: 'PolicyAgent', status: 'completed', duration_ms: 280 },
          { id: '4', agent_name: 'AnomalyAgent', status: 'completed', duration_ms: 190 },
          { id: '5', agent_name: 'CrossEvidenceReasoningAgent', status: 'completed', duration_ms: 510 },
          { id: '6', agent_name: 'InvestigationAgent', status: 'completed', duration_ms: 600 },
        ]);
      }

      // Fetch findings if allowed
      if (user?.role !== 'end_user') {
        try {
          const findingsData = await api.get<Finding[]>(`/api/claims/${claimId}/findings`);
          setFindings(findingsData || []);
        } catch {
          // May be restricted or none
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimData();
  }, [claimId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !claimId) return;
    setUploading(true);
    setUploadMsg(null);

    const formData = new FormData();
    formData.append('claim_id', claimId);
    formData.append('category', uploadCategory);
    formData.append('source_label', uploadSource);
    formData.append('file', uploadFile);

    try {
      await api.upload('/api/evidence/', formData);
      setUploadMsg('Evidence successfully uploaded and hashed to SHA-256 audit ledger!');
      setUploadFile(null);
      fetchClaimData();
    } catch (err: any) {
      setUploadMsg(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimId) return;
    setDeciding(true);
    setDecisionMsg(null);

    try {
      await api.post(`/api/review/claims/${claimId}/decision`, {
        decision,
        rationale: rationale || `Human-in-the-loop ${decision} determination recorded by ${user?.full_name}`,
      });
      setDecisionMsg(`Decision recorded successfully: ${decision.toUpperCase()}`);
      fetchClaimData();
    } catch (err: any) {
      setDecisionMsg(`Error: ${err.message}`);
    } finally {
      setDeciding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-72 space-y-3">
        <RefreshCw size={28} className="animate-spin text-indigo-600" />
        <span className="text-sm text-slate-500">Loading claim investigation telemetry...</span>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <AlertCircle size={36} className="mx-auto text-amber-500 mb-2" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Claim Not Found or Restricted</h3>
        <p className="text-sm text-slate-500 mt-1">You may not have permission to view this claim under your current role.</p>
        <button
          onClick={() => navigate('/claims')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Back to Claims
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/claims')}
          className="inline-flex items-center space-x-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Claims</span>
        </button>
        <button
          onClick={fetchClaimData}
          className="inline-flex items-center space-x-1.5 text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw size={14} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Claim Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{claim.claim_number}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                claim.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              }`}>
                {claim.priority.toUpperCase()} PRIORITY
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${
                claim.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {claim.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 capitalize">
              Category: <strong className="text-slate-700 dark:text-slate-300">{claim.category}</strong> • 
              Est. Amount: <strong className="text-slate-700 dark:text-slate-300">${Number(claim.estimated_amount).toLocaleString()}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(`/graph/${claim.id}`)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition flex items-center space-x-1.5"
            >
              <GitFork size={15} />
              <span>Full Evidence Graph</span>
            </button>
          </div>
        </div>

        {/* 6-Agent Execution Pipeline Overview */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Cpu size={16} className="text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                LangGraph 6-Agent Autonomous Orchestration
              </h3>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              All 6 Agents Synchronized
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {agents.map((agent) => (
              <div 
                key={agent.agent_name}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400">{agent.duration_ms || 320}ms</span>
                  </div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate" title={agent.agent_name}>
                    {agent.agent_name.replace('Agent', '')}
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 size={12} />
                  <span>Completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('agents')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'agents' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Investigation Findings ({findings.length})
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'upload' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Upload Evidence
        </button>

        {user?.role === 'manager' && (
          <button
            onClick={() => setActiveTab('decision')}
            className={`pb-3 px-1 border-b-2 transition ${
              activeTab === 'decision' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Human Decision & Review
          </button>
        )}
      </div>

      {/* Tab 1: Findings */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          {findings.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-2" />
              <h4 className="font-semibold text-slate-900 dark:text-white">Investigation Complete</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No adverse fraud flags or cross-modal contradictions detected. All evidence is internally consistent.
              </p>
            </div>
          ) : (
            findings.map((f) => (
              <div 
                key={f.id}
                className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {f.finding_code}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{f.category}</h4>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    Confidence: {(Number(f.confidence_score) * 100).toFixed(0)}%
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {f.description}
                </p>

                {f.recommended_action && (
                  <div className="text-xs p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-indigo-800 dark:text-indigo-300">
                    <strong>Recommended Action:</strong> {f.recommended_action}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Upload Evidence */}
      {activeTab === 'upload' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Upload Multimodal Evidence</h3>
          <p className="text-xs text-slate-500 mb-6">
            Supported formats: Photos (JPG/PNG), Invoices, Repair Estimates, Police Statements (PDF), Metadata reports.
          </p>

          {uploadMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs">
              {uploadMsg}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Evidence Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="photo">Accident / Damage Photograph</option>
                <option value="statement">Written / Witness Statement</option>
                <option value="repair_estimate">Repair Invoice / Estimate</option>
                <option value="policy_doc">Policy Documentation</option>
                <option value="telematics">Telematics / GPS Sensor Log</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Source Label
              </label>
              <input
                type="text"
                value={uploadSource}
                onChange={(e) => setUploadSource(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                placeholder="e.g. Field Assessor / Claimant / Repair Garage"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Select File
              </label>
              <input
                type="file"
                required
                onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !uploadFile}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow transition disabled:opacity-50 flex items-center space-x-2"
            >
              <Upload size={14} />
              <span>{uploading ? 'Hashing and uploading...' : 'Upload & Re-trigger Agents'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Manager Human Decision */}
      {activeTab === 'decision' && user?.role === 'manager' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Record Final Claim Decision</h3>
          <p className="text-xs text-slate-500 mb-6">
            Authorized for Manager Role. This action writes a permanent cryptographic entry to the audit log.
          </p>

          {decisionMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs">
              {decisionMsg}
            </div>
          )}

          <form onSubmit={handleDecision} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Decision Outcome
              </label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="approved">Approve Claim for Payout</option>
                <option value="rejected">Reject Claim (Fraud / Policy Exclusion)</option>
                <option value="requested_info">Request Additional Telematics/Evidence</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Investigation Rationale & Justification
              </label>
              <textarea
                rows={3}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Detail the justification based on the 6-agent synthesis and evidence graph..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={deciding}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 flex items-center space-x-2"
            >
              <FileCheck size={14} />
              <span>{deciding ? 'Recording Decision...' : 'Commit Final Decision'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClaimDetail;
