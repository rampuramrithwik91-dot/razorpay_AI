import React from 'react';
import { 
  ShieldAlert, LayoutDashboard, AlertTriangle, RefreshCw, Scale, 
  Share2, Settings, BarChart2, FileText, Play, RotateCcw, Activity, CheckCircle2
} from 'lucide-react';

export default function Navigation({ currentTab, setTab, onRunDemo, onResetDemo, isRunningScenario }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'cases', label: 'Risk Cases', icon: AlertTriangle, badge: 'Hero RC-2048' },
    { id: 'fraud', label: 'Fraud & Abuse', icon: ShieldAlert },
    { id: 'returns', label: 'Returns & Refunds', icon: RefreshCw },
    { id: 'disputes', label: 'Disputes Intel', icon: Scale },
    { id: 'explorer', label: 'Entity Explorer', icon: Share2 },
    { id: 'policies', label: 'Policy Engine', icon: Settings },
    { id: 'evaluation', label: 'Evaluation Benchmark', icon: BarChart2 },
    { id: 'audit', label: 'Audit Trail', icon: FileText },
  ];

  return (
    <header className="bg-[#0F1522] border-b border-[#242F42] sticky top-0 z-40">
      {/* Top Utility Header Bar */}
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* Brand & System Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">SentinelRisk AI</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  RAZORPAY TEST MODE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40">
                  SYNTHETIC DEMO DATA
                </span>
              </div>
              <p className="text-xs text-slate-400">Merchant Risk Intelligence Platform • Unified Cross-Domain Engine</p>
            </div>
          </div>
        </div>

        {/* Status Indicators & Demo Controls */}
        <div className="flex items-center gap-3">
          {/* Health Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A2333] border border-[#2B384E] text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-emerald-400">SYSTEM HEALTHY</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[11px]">Seed 42</span>
          </div>

          {/* Reset State Button */}
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all"
            title="Reset system to deterministic Seed 42 baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset State
          </button>

          {/* RUN DEMO SCENARIO PRIMARY BUTTON */}
          <button
            onClick={onRunDemo}
            disabled={isRunningScenario}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all shadow-lg ${
              isRunningScenario
                ? 'bg-cyan-900 text-cyan-300 cursor-not-allowed opacity-80'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25 active:scale-[0.98]'
            }`}
          >
            {isRunningScenario ? (
              <>
                <Activity className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Executing Narrative Scenario...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Demo Scenario</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="max-w-[1600px] mx-auto px-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
