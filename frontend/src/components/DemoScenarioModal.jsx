import React from 'react';
import { Play, CheckCircle2, AlertTriangle, ShieldCheck, Activity, X, ArrowRight } from 'lucide-react';

export default function DemoScenarioModal({ isOpen, onClose, scenarioSteps, currentStep, isComplete, onViewHeroCase }) {
  if (!isOpen) return null;

  const totalSteps = 9;
  const progressPercent = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#141A26] border border-[#2B384E] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-[#242F42] bg-[#0F1522] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Narrative Demo Scenario</h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  UNIFIED MIXED-RISK INCIDENT
                </span>
              </div>
              <p className="text-xs text-slate-400">Step-by-step reproducible incident story streaming over real-time SSE</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-[#0B0F17] px-6 py-3 border-b border-[#242F42] flex items-center justify-between gap-4">
          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold">{progressPercent}%</span>
        </div>

        {/* Event Timeline Sequence List */}
        <div className="p-6 max-h-[420px] overflow-y-auto space-y-3 font-sans">
          {scenarioSteps.map((step, idx) => {
            const isFinished = idx <= currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div 
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : isFinished
                    ? 'bg-[#182030] border-[#253247] opacity-90'
                    : 'bg-[#101520] border-[#1C2536] opacity-40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                      isFinished ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{step.title}</span>
                        {step.case_id && (
                          <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                            {step.case_id}
                          </span>
                        )}
                        {step.entity_id && (
                          <span className="text-[10px] font-mono text-slate-300 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                            {step.entity_id}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{step.message}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{step.timestamp ? step.timestamp.split('T')[1]?.substring(0, 8) : ''}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#242F42] bg-[#0F1522] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {isComplete ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Scenario completed cleanly! State reconciled across all modules.
              </span>
            ) : (
              <span className="text-cyan-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 animate-spin" /> Step {currentStep + 1} of {totalSteps} executing...
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Close
            </button>

            {isComplete && (
              <button
                onClick={() => {
                  onClose();
                  onViewHeroCase();
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-500/20"
              >
                <span>View Hero Case RC-2048</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
