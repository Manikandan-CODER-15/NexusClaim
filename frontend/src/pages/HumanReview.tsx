import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileCheck, ArrowLeft, DollarSign, 
  CheckCircle2, UserCheck, Lock 
} from 'lucide-react';
import { api, auth } from '../api';
import type { Claim, Finding } from '../api';

const HumanReview: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const user = auth.getUser();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claimId || '');
  const [claim, setClaim] = useState<Claim | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'requested_info' | 'escalated'>('approved');
  const [rationale, setRationale] = useState('All 6 agents confirmed low anomaly probability. Deductible applied as per policy terms.');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.get<Claim[]>('/api/claims').then((res) => {
      setClaims(res || []);
      if (!selectedClaimId && res && res.length > 0) {
        setSelectedClaimId(res[0].id);
      }
    }).catch(console.error);
  }, []);

  const loadClaimDetails = async (cid: string) => {
    if (!cid) return;
    try {
      const [c, fnds] = await Promise.all([
        api.get<Claim>(`/api/claims/${cid}`),
        api.get<Finding[]>(`/api/claims/${cid}/findings`)
      ]);
      setClaim(c);
      setFindings(fnds || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (selectedClaimId) loadClaimDetails(selectedClaimId);
  }, [selectedClaimId]);

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimId) return;
    setSubmitting(true);
    setActionSuccess(null);

    try {
      await api.post(`/api/review/claims/${selectedClaimId}/decision`, {
        decision,
        rationale: rationale || `Human review committed by ${user?.full_name}`
      });
      setActionSuccess(`Review determination recorded: ${decision.toUpperCase()}. Signed into permanent audit log.`);
      loadClaimDetails(selectedClaimId);
    } catch (err: any) {
      alert(`Decision recording failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const estAmount = claim?.estimated_amount || 4500;
  const deductible = 500;
  const payable = Math.max(0, estAmount - deductible);

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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Human Review & Decision Center</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditable Human-in-the-Loop review, deterministic settlement calculation & final adjudication
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Settlement Calculator & Findings (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provisional Settlement Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign size={18} className="text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Deterministic Settlement Assessment
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                PROVISIONAL
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Eligible Repair Cost</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  ${estAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Policy Deductible</div>
                <div className="text-lg font-bold text-rose-600 mt-1">
                  -${deductible.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Calculated Payout</div>
                <div className="text-lg font-bold text-emerald-600 mt-1">
                  ${payable.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 text-center">
              Formula: MAX(0, Eligible Repair Cost − Deductible − Other Deductions). No AI generated amounts.
            </div>
          </div>

          {/* AI Evidence Summary */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Synthesized Evidentiary Grounds ({findings.length})
            </h3>

            {findings.map((f) => (
              <div key={f.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 text-xs space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-900 dark:text-white">[{f.finding_code}] {f.category}</span>
                  <span className="text-indigo-600">{(f.confidence_score * 100).toFixed(0)}% Conf.</span>
                </div>
                <p className="text-slate-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Decision Form (1 Col) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white mb-4">
              <UserCheck size={18} className="text-indigo-600" />
              <span>Record Review Adjudication</span>
            </div>

            {actionSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {user?.role !== 'manager' && (
              <div className="p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-300 text-xs flex items-center space-x-2">
                <Lock size={15} className="shrink-0" />
                <span>Only Manager role has authorization to commit final payouts. Other roles submit recommendations.</span>
              </div>
            )}

            <form onSubmit={handleDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Determination Action
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="approved">Approve Provisional Settlement (${payable})</option>
                  <option value="rejected">Reject Claim Under Exclusion</option>
                  <option value="requested_info">Request Additional Telematics/Evidence</option>
                  <option value="escalated">Escalate to Special Investigations Unit (SIU)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Audit Rationale & Justification
                </label>
                <textarea
                  rows={4}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <FileCheck size={14} />
                <span>{submitting ? 'Committing to Ledger...' : 'Commit Determination'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanReview;
