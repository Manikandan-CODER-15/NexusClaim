import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Zap, ArrowLeft, CheckCircle2, 
  GitFork, Layers, ArrowRight 
} from 'lucide-react';
import { api } from '../api';
import type { Claim } from '../api';

const AdaptiveSimulator: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claimId || '');
  const [simCategory, setSimCategory] = useState('photo');
  const [description, setDescription] = useState('Secondary photographic evidence of rear bumper dent and frame transfer marks.');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    api.get<Claim[]>('/api/claims').then((res) => {
      setClaims(res || []);
      if (!selectedClaimId && res && res.length > 0) {
        setSelectedClaimId(res[0].id);
      }
    }).catch(console.error);
  }, []);

  const handleInject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimId) return;
    setSimulating(true);
    setResult(null);

    try {
      const res = await api.post(`/api/claims/${selectedClaimId}/inject-evidence`, {
        category: simCategory,
        description,
        source_label: 'Claimant Secondary Submission (Simulation)'
      });
      setResult(res);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Adaptive Investigation Simulator</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate mid-flight evidentiary injection, targeted LangGraph re-evaluation & hypothesis updating
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Injection Controls */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Zap size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Inject New Evidence Item</h3>
          </div>

          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            In standard systems, new evidence breaks static logic or triggers false fraud flags. 
            NexusClaim isolates affected reasoning nodes and preserves prior evidentiary audit trails.
          </p>

          <form onSubmit={handleInject} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Artifact Category to Inject
              </label>
              <select
                value={simCategory}
                onChange={(e) => setSimCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="photo">Secondary Photograph (Rear Impact)</option>
                <option value="statement">Corrected Statement (Multi-vehicle)</option>
                <option value="telematics">Telematics CSV (Sudden Deceleration)</option>
                <option value="police_report">Amended Police Collision Report</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Evidence Observation Details
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Zap size={14} />
              <span>{simulating ? 'Re-evaluating affected nodes...' : 'Inject & Re-orchestrate'}</span>
            </button>
          </form>
        </div>

        {/* Right: Adaptive Synthesis Outcome */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Layers size={16} className="text-indigo-600" />
              <span>Adaptive Telemetry Feedback</span>
            </h3>

            {result ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs">
                  <div className="font-bold mb-1 flex items-center space-x-1.5">
                    <CheckCircle2 size={16} />
                    <span>Targeted LangGraph Re-evaluation Succeeded</span>
                  </div>
                  <div>{result.message}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Updated Hypothesis Formulated
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {result.new_hypothesis}
                  </div>
                  <div className="text-xs text-slate-500">
                    Probability updated to: <strong className="text-slate-800 dark:text-slate-200">{(result.probability_score * 100).toFixed(0)}%</strong>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl text-xs text-indigo-900 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                  <strong>Preservation Rule Maintained:</strong> Original statement and front photo preserved. 
                  Contradiction marked RESOLVED without false fraud accusation.
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 text-xs">
                Select an evidence scenario and click "Inject & Re-orchestrate" to observe real-time graph adaptation.
              </div>
            )}
          </div>

          {result && (
            <button
              onClick={() => navigate(`/graph/${selectedClaimId}`)}
              className="mt-6 w-full py-2.5 px-4 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs rounded-xl hover:bg-indigo-100 transition flex items-center justify-center space-x-1.5"
            >
              <GitFork size={14} />
              <span>Inspect Updated Evidence Graph</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdaptiveSimulator;
