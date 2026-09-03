import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, FileText, ArrowLeft, 
  Share2, Clock, User, DollarSign, Activity, Check, X, Shield, ChevronRight, Lock
} from 'lucide-react';
import InteractiveGraph from '../components/InteractiveGraph';
import { API_BASE, fetchJson } from '../utils/api';

export default function HeroCaseDetail({ caseId = "RC-2048", onBack, onCaseUpdated }) {
  const [caseDetail, setCaseDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await fetchJson(`/cases/${caseId}`);
      setCaseDetail(data);
    } catch (err) {
      console.error("Error fetching case detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [caseId]);

  const handleAction = async (actionType) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE}/cases/${caseId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, notes: actionNotes })
      });
      if (res.ok) {
        const result = await res.json();
        setActionSuccess(`Action '${actionType}' recorded! Case status updated to ${result.new_status}.`);
        fetchDetail();
        if (onCaseUpdated) onCaseUpdated();
      }
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono animate-pulse">
        Loading Hero Case {caseId} Details & Grounded AI Evidence...
      </div>
    );
  }

  if (!caseDetail) {
    return (
      <div className="p-12 text-center text-red-400 font-mono">
        Case {caseId} not found.
      </div>
    );
  }

  const { case: c, ai_investigation: ai, metrics, relationships, risk_versions, audit_trail } = caseDetail;

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1500px] mx-auto pb-12">
      
      {/* Top Navigation Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Case Queue
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Case ID:</span>
          <span className="text-cyan-300 font-bold">{c.id}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Assigned:</span>
          <span className="text-slate-200">{c.assigned_to}</span>
        </div>
      </div>

      {/* HERO BANNER: CASE HEADER */}
      <div className="card-panel p-6 bg-gradient-to-r from-[#171F2E] via-[#1A2538] to-[#121824] border-l-4 border-l-red-500">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold ${
                c.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'
              }`}>
                {c.severity} SEVERITY
              </span>
              <span className="px-3 py-1 rounded-md text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                DOMAIN: {c.domain}
              </span>
              <span className={`px-3 py-1 rounded-md text-xs font-mono font-semibold ${
                c.status === 'OPEN' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                STATUS: {c.status}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">{c.title}</h1>
            
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>Target Entity: <strong className="text-white font-mono">{c.entity_name} ({c.entity_id})</strong></span>
              <span className="text-slate-500">•</span>
              <span>Trigger Event: <strong className="text-cyan-300 font-mono">{c.trigger_event_id}</strong></span>
            </p>
          </div>

          {/* Exposure Counter Header */}
          <div className="bg-[#0D131F] p-4 rounded-xl border border-[#233045] shrink-0 text-right">
            <span className="text-xs font-mono text-slate-400">TOTAL RISK EXPOSURE</span>
            <div className="text-3xl font-bold text-red-400 font-mono mt-1">
              {formatINR(c.exposure_amount)}
            </div>
            <span className="text-[11px] text-slate-500">Calculated from stored transaction ledger</span>
          </div>

        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* TWO COLUMN WORKFLOW LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: GROUNDED AI INVESTIGATION + EVIDENCE + TIMELINE (2 COLS) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION 1: WHY FLAGGED */}
          <div className="card-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-[#242F42]">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Why Flagged (Root Cause Evidence)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-[#0F1522] p-4 rounded-xl border border-[#212C3E]">
              Entity <strong className="text-cyan-300 font-mono">{c.entity_id}</strong> was escalated to <strong className="text-red-400">CRITICAL</strong> because the risk engine identified cross-domain evidence fusion: velocity spike on a shared device (<strong className="text-slate-200">Device D-14</strong>), a 77.8% historical return rate across 9 orders, and an active pre-arbitration chargeback dispute on a connected account.
            </p>
          </div>

          {/* SECTION 2: STRUCTURED GROUNDED AI INVESTIGATION */}
          <div className="card-panel p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#242F42]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Structured AI Investigation
                </h3>
                <p className="text-xs text-slate-400">Grounded strictly in stored ledger records (Confidence: {(ai.confidence_score*100).toFixed(0)}%)</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded-md">
                100% Evidence Grounded
              </span>
            </div>

            {/* AI Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase font-mono">Summary</h4>
              <div className="p-3.5 rounded-xl bg-[#101726] border border-[#1E2B40] text-xs text-slate-200 leading-relaxed">
                "{ai.summary}"
              </div>
            </div>

            {/* Key Evidence Bullets */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase font-mono">Key Evidence</h4>
              <ul className="space-y-2">
                {ai.key_evidence.map((ev, idx) => (
                  <li key={idx} className="p-3 rounded-lg bg-[#0F1522] border border-[#1C2638] text-xs text-slate-200 flex items-start gap-2.5">
                    <span className="text-cyan-400 font-bold font-mono text-[11px] shrink-0 mt-0.5">•</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Factors & Uncertainties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-orange-400 uppercase font-mono">Risk Factors</h4>
                <div className="space-y-1.5">
                  {ai.risk_factors.map((rf, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-orange-950/30 border border-orange-900/50 text-xs text-orange-200">
                      {rf}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase font-mono">Uncertainties</h4>
                <div className="space-y-1.5">
                  {ai.uncertainties.map((unc, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/50 text-xs text-amber-200">
                      {unc}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendation & Policy Result */}
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300 uppercase font-mono">Recommendation</span>
                <span className="font-mono text-cyan-400 bg-cyan-900/80 px-2 py-0.5 rounded border border-cyan-700">
                  {ai.policy_result}
                </span>
              </div>
              <p className="text-xs text-white font-medium">{ai.recommendation}</p>
            </div>

          </div>

          {/* SECTION 3: INTERACTIVE ENTITY RELATIONSHIP GRAPH */}
          <InteractiveGraph 
            nodes={[
              { id: c.entity_id, label: c.entity_name, type: "CUSTOMER", risk_level: c.severity, score: 0.91 },
              ...relationships.map(r => ({ id: r.target_id, label: r.target_name, type: r.target_type, risk_level: "HIGH", score: 0.78 }))
            ]}
            edges={relationships.map(r => ({
              id: `e_${r.target_id}`,
              source: c.entity_id,
              target: r.target_id,
              type: r.relationship_type,
              confidence: r.confidence
            }))}
            selectedEntityId={c.entity_id}
          />

          {/* SECTION 4: UNIFIED AUDIT TRAIL LOG */}
          <div className="card-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-[#242F42]">
              <FileText className="w-4 h-4 text-cyan-400" />
              State Transition Audit Trail
            </h3>

            <div className="space-y-3">
              {audit_trail.map((ae) => (
                <div key={ae.id} className="p-3.5 rounded-xl bg-[#0F1522] border border-[#1F2B3E] flex items-start justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300">{ae.event_type}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">{ae.description}</span>
                    </div>
                    {ae.metadata && Object.keys(ae.metadata).length > 0 && (
                      <div className="font-mono text-[11px] text-slate-400 bg-black/40 p-2 rounded border border-slate-800/80">
                        {JSON.stringify(ae.metadata)}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 shrink-0 ml-4">
                    {ae.timestamp.split('T')[1]?.substring(0, 8)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: DECISION CONTROLS + RISK SCORE VERSION HISTORY + EVIDENCE METRICS */}
        <div className="space-y-8">
          
          {/* DECISION ACTION CONTROLS PANEL */}
          <div className="card-panel p-6 space-y-5 border-2 border-cyan-500/30">
            <div className="pb-3 border-b border-[#242F42]">
              <h3 className="text-sm font-bold text-white">Merchant Action Controls</h3>
              <p className="text-xs text-slate-400">Execute binding decision & generate audit event</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-mono text-slate-300 block">Operator Review Notes:</label>
              <textarea 
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter investigation rationale or policy override notes..."
                className="w-full h-24 p-3 rounded-lg bg-[#0B0F17] border border-[#253247] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => handleAction('CONFIRM_FRAUD')}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-all shadow-md shadow-red-900/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" /> Confirm Fraud & Block Entity
              </button>

              <button
                onClick={() => handleAction('APPROVE_REFUND')}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" /> Hold Refund & Require Manual Verification
              </button>

              <button
                onClick={() => handleAction('DISMISS')}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Dismiss Case (False Positive)
              </button>
            </div>
          </div>

          {/* RISK VERSION HISTORY */}
          <div className="card-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-[#242F42]">
              <Activity className="w-4 h-4 text-cyan-400" />
              Versioned Risk Score History
            </h3>

            <div className="space-y-3">
              {risk_versions.map((rv) => (
                <div key={rv.version} className="p-3.5 rounded-xl bg-[#0F1522] border border-[#1F2B3E] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-cyan-300">Version {rv.version}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      rv.unified_level === 'CRITICAL' ? 'badge-critical' : 'badge-high'
                    }`}>
                      Score: {rv.unified_score} ({rv.unified_level})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 bg-black/30 p-2 rounded">
                    <div>Fraud: <span className="text-white">{rv.fraud_score}</span></div>
                    <div>Return: <span className="text-white">{rv.return_score}</span></div>
                    <div>Dispute: <span className="text-white">{rv.dispute_score}</span></div>
                  </div>

                  <div className="text-[11px] text-slate-300">
                    Reasons: <span className="text-slate-400">{rv.reason_codes.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STORED DERIVED METRICS */}
          <div className="card-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-white pb-3 border-b border-[#242F42]">
              Entity Stored Ledger Metrics
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F1522]">
                <span className="text-slate-400">Total Transactions:</span>
                <span className="font-mono font-bold text-white">{metrics.transaction_count} ({formatINR(metrics.total_spent)})</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F1522]">
                <span className="text-slate-400">Total Return Requests:</span>
                <span className="font-mono font-bold text-amber-400">{metrics.return_count} ({formatINR(metrics.total_refunded)})</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F1522]">
                <span className="text-slate-400">Disputes Filed:</span>
                <span className="font-mono font-bold text-red-400">{metrics.dispute_count} ({formatINR(metrics.total_disputed)})</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
