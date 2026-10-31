import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, Image, CheckCircle2, ShieldCheck, 
  AlertCircle, ArrowLeft, RefreshCw, Layers 
} from 'lucide-react';
import { api } from '../api';
import type { Claim } from '../api';

interface EvidenceItem {
  id: string;
  file_name: string;
  file_hash: string;
  file_size: number;
  category: string;
  source_label?: string;
  created_at: string;
}

const EvidenceUpload: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claimId || '');
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('photo');
  const [sourceLabel, setSourceLabel] = useState('Field Inspector');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch claims list
  useEffect(() => {
    api.get<Claim[]>('/api/claims').then((res) => {
      setClaims(res || []);
      if (!selectedClaimId && res && res.length > 0) {
        setSelectedClaimId(res[0].id);
      }
    }).catch(console.error);
  }, []);

  const fetchEvidence = async (cid: string) => {
    if (!cid) return;
    setLoading(true);
    try {
      const data = await api.get<EvidenceItem[]>(`/api/evidence/claims/${cid}`);
      setEvidenceList(data || []);
    } catch {
      setEvidenceList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClaimId) {
      fetchEvidence(selectedClaimId);
    }
  }, [selectedClaimId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedClaimId) return;

    setUploading(true);
    setUploadSuccess(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append('claim_id', selectedClaimId);
    formData.append('category', category);
    formData.append('source_label', sourceLabel);
    formData.append('file', file);

    try {
      await api.upload('/api/evidence/', formData);
      setUploadSuccess(`"${file.name}" uploaded. SHA-256 cryptographic fingerprint calculated & logged.`);
      setFile(null);
      fetchEvidence(selectedClaimId);
    } catch (err: any) {
      setUploadError(err.message || 'Evidence upload failed');
    } finally {
      setUploading(false);
    }
  };

  const categoriesPresent = new Set(evidenceList.map(e => e.category));
  const completeness = Math.min(100, Math.round((categoriesPresent.size / 4) * 100));

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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Multimodal Evidence Intake</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure cryptographic ingestion with SHA-256 duplicate validation and metadata classification
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
        </div>
      </div>

      {/* Completeness Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Layers size={22} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Evidence Completeness Index: {completeness}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Requires photos, written statements, repair estimates, and policy documentation.
            </div>
          </div>
        </div>

        <div className="w-full sm:w-48 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              completeness >= 75 ? 'bg-emerald-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form (1 Col) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
            <Upload size={16} className="text-indigo-600" />
            <span>Upload New Evidence</span>
          </h3>

          {uploadSuccess && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {uploadError && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Evidence Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="photo">Damage Photograph (JPG/PNG)</option>
                <option value="statement">Written / Witness Statement</option>
                <option value="repair_estimate">Garage Repair Estimate (PDF)</option>
                <option value="policy_doc">Policy Contract / Endorsement</option>
                <option value="police_report">Official Police Incident Report</option>
                <option value="telematics">Telematics / Speed Sensor CSV</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Source Attribution
              </label>
              <input
                type="text"
                value={sourceLabel}
                onChange={(e) => setSourceLabel(e.target.value)}
                placeholder="e.g. Authorized Field Adjuster"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Dropzone Box */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-indigo-500 transition cursor-pointer relative bg-slate-50/50 dark:bg-slate-900/30">
              <input
                type="file"
                required
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload size={24} className="mx-auto text-slate-400 mb-2" />
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {file ? file.name : 'Drag & drop file here, or click to browse'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">PNG, JPG, PDF up to 25MB</div>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{uploading ? 'Hashing and Ingesting...' : 'Submit Evidence File'}</span>
            </button>
          </form>
        </div>

        {/* Existing Evidence Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ingested Evidence Artifacts ({evidenceList.length})
            </h3>
            <button
              onClick={() => fetchEvidence(selectedClaimId)}
              className="p-1.5 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              title="Refresh List"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {evidenceList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No evidence artifacts uploaded yet for this claim dossier.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {evidenceList.map((ev) => (
                <div key={ev.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {ev.category === 'photo' ? <Image size={18} /> : <FileText size={18} />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {ev.file_name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="capitalize">{ev.category}</span>
                        <span>•</span>
                        <span>{(ev.file_size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 px-1 rounded">
                          SHA-256: {ev.file_hash.slice(0, 12)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck size={12} />
                    <span>Verified</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvidenceUpload;

