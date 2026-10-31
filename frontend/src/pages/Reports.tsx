import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Download, CheckCircle2, 
  ArrowLeft, Printer 
} from 'lucide-react';
import { api } from '../api';
import type { Claim } from '../api';

const Reports: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claimId || '');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get<Claim[]>('/api/claims').then((res) => {
      setClaims(res || []);
      if (!selectedClaimId && res && res.length > 0) {
        setSelectedClaimId(res[0].id);
      }
    }).catch(console.error);
  }, []);

  const checkExistingReport = async (cid: string) => {
    if (!cid) return;
    try {
      const res: any = await api.get(`/api/claims/${cid}/report`);
      if (res.report_available) {
        setReportData(res);
      } else {
        setReportData(null);
      }
    } catch {
      setReportData(null);
    }
  };

  useEffect(() => {
    if (selectedClaimId) checkExistingReport(selectedClaimId);
  }, [selectedClaimId]);

  const handleGenerate = async () => {
    if (!selectedClaimId) return;
    setGenerating(true);
    setStatusMsg(null);

    try {
      const res: any = await api.post(`/api/claims/${selectedClaimId}/report`, {});
      setReportData(res);
      setStatusMsg(`PDF Report dossier successfully rendered: ${res.filename}`);
    } catch (err: any) {
      alert(`Report compilation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Report & Analytics Studio</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated ReportLab PDF compilation with grounded evidentiary citations and human audit signoff
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

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Action Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Comprehensive Investigation Dossier</h3>
          <p className="text-xs text-slate-500 mt-1">
            Exports verified facts, cross-modal image observations, policy interpretations, and settlement calculations into an enterprise PDF.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition disabled:opacity-50 flex items-center space-x-2"
          >
            <Printer size={15} />
            <span>{generating ? 'Compiling PDF...' : 'Compile PDF Dossier'}</span>
          </button>

          {reportData && (
            <a
              href={`/api/claims/${selectedClaimId}/report/download`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow transition flex items-center space-x-2"
            >
              <Download size={15} />
              <span>Download PDF</span>
            </a>
          )}
        </div>
      </div>

      {/* Report Structure Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400">Section 01</div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Executive Dossier</h4>
          <p className="text-xs text-slate-500">Claimant demographics, incident date, policy limits and category definition.</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400">Section 02</div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Evidence Inventory</h4>
          <p className="text-xs text-slate-500">Itemized list of photos, invoices, and statements with verified SHA-256 hashes.</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400">Section 03</div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Agent Observations</h4>
          <p className="text-xs text-slate-500">6-Agent LangGraph findings with confidence intervals and epistemological labels.</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400">Section 04</div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Synthesized Hypotheses</h4>
          <p className="text-xs text-slate-500">Probabilistic accident dynamics models with supporting and contradicting observations.</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400">Section 05</div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Provisional Settlement</h4>
          <p className="text-xs text-slate-500">Deterministic math: repair costs minus policy deductibles and itemized exclusions.</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400">Section 06</div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Human Review & Audit</h4>
          <p className="text-xs text-slate-500">Cryptographically signed review determinations, timestamps, and justifications.</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
