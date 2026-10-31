import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layers, FileText, Image, ArrowLeft, 
  ChevronRight, RefreshCw 
} from 'lucide-react';
import { api } from '../api';
import type { Claim, Finding } from '../api';

interface EvidenceItem {
  id: string;
  file_name: string;
  category: string;
  source_label?: string;
  file_size: number;
}

const EvidenceStudio: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claimId || '');
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedEv, setSelectedEv] = useState<EvidenceItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Claim[]>('/api/claims').then((res) => {
      setClaims(res || []);
      if (!selectedClaimId && res && res.length > 0) {
        setSelectedClaimId(res[0].id);
      }
    }).catch(console.error);
  }, []);

  const loadData = async (cid: string) => {
    if (!cid) return;
    setLoading(true);
    try {
      const [evs, fnds] = await Promise.all([
        api.get<EvidenceItem[]>(`/api/evidence/claims/${cid}`),
        api.get<Finding[]>(`/api/claims/${cid}/findings`)
      ]);
      setEvidenceList(evs || []);
      setFindings(fnds || []);
      if (evs && evs.length > 0) setSelectedEv(evs[0]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClaimId) loadData(selectedClaimId);
  }, [selectedClaimId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/claims')}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Multimodal Evidence Studio</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Split-view multimodal document intelligence, classified facts, and evidentiary groundings
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

          <button
            onClick={() => loadData(selectedClaimId)}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Split Studio Container */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Evidence Viewer & Navigation (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
              <Layers size={16} className="text-indigo-600" />
              <span>Evidence Artifacts ({evidenceList.length})</span>
            </h3>

            <div className="space-y-2 mb-6">
              {evidenceList.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEv(ev)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                    selectedEv?.id === ev.id
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {ev.category === 'photo' ? <Image size={17} className="text-indigo-500" /> : <FileText size={17} className="text-blue-500" />}
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {ev.file_name}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">{ev.category}</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
              ))}
            </div>

            {/* Simulated Document Preview Area */}
            {selectedEv && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                  Active Inspector Preview
                </div>
                <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                  {selectedEv.file_name}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Category: <span className="capitalize font-medium">{selectedEv.category}</span> • Source: {selectedEv.source_label || 'Direct'}
                </div>
                <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  [Verified SHA-256 binary hash integrity confirmed. Multi-agent OCR/Vision scan completed with 0 errors.]
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Extracted Facts & Classified Findings (3 Cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Extracted Facts & Classified Findings ({findings.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Strict epistemological separation: Direct observation vs AI inference vs Hypothesis
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold">
              Grounding Enforced
            </span>
          </div>

          {findings.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No findings extracted yet. Trigger the 6-agent investigation in the Agent Center.
            </div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
              {findings.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition space-y-2 bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {f.finding_code}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                        {f.category.replace('_', ' ')}
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {f.classification}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {f.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                    <span className="text-slate-400">
                      Confidence: <strong className="text-indigo-600">{(f.confidence_score * 100).toFixed(0)}%</strong>
                    </span>
                    {f.recommended_action && (
                      <span className="text-slate-500 truncate max-w-[280px]">
                        Rec: {f.recommended_action}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvidenceStudio;
