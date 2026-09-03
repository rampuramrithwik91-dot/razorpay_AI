import React from 'react';
import { 
  ShieldAlert, AlertTriangle, RefreshCw, Scale, DollarSign, 
  ChevronRight, ArrowUpRight, TrendingUp, CheckCircle, Info, ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Overview({ overviewData, onSelectCase, onNavigateDomain }) {
  if (!overviewData) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono animate-pulse">
        Loading Derived Dashboard Metrics...
      </div>
    );
  }

  const { metrics, risk_trend, priority_cases } = overviewData;

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. PAGE TITLE & ONE-SENTENCE PURPOSE BANNER */}
      <div className="card-panel p-6 bg-gradient-to-r from-[#141C2B] via-[#162238] to-[#121824] border-l-4 border-l-cyan-400">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Merchant Risk Intelligence Overview</h1>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                RECONCILED DATA LAYER
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              Unified real-time risk orchestration across payment fraud, return abuse, and chargeback dispute intelligence.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800 shrink-0">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>All metrics mathematically derived from stored SQLite ledger</span>
          </div>
        </div>
      </div>

      {/* 2. KEY DERIVED METRICS GRID */}
      <div className="grid grid-[#121824] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Total Exposure */}
        <div className="card-panel p-5 card-panel-hover border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>TOTAL RISK EXPOSURE</span>
            <DollarSign className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {formatINR(metrics.total_exposure)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Sum of applicable open risk exposure</p>
          </div>
        </div>

        {/* Metric 2: Open Cases */}
        <div className="card-panel p-5 card-panel-hover border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>OPEN RISK CASES</span>
            <AlertTriangle className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {metrics.open_cases}
            </div>
            <p className="text-xs text-slate-400 mt-1">Active cases in review queue</p>
          </div>
        </div>

        {/* Metric 3: Critical Cases */}
        <div className="card-panel p-5 card-panel-hover border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>CRITICAL SEVERITY</span>
            <ShieldAlert className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {metrics.critical_cases}
            </div>
            <p className="text-xs text-slate-400 mt-1">High priority cases requiring instant action</p>
          </div>
        </div>

        {/* Metric 4: Human Review Pending */}
        <div className="card-panel p-5 card-panel-hover border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>HUMAN REVIEW PENDING</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {metrics.human_review_pending}
            </div>
            <p className="text-xs text-slate-400 mt-1">Awaiting merchant operator decision</p>
          </div>
        </div>
      </div>

      {/* 3. RISK TREND CHART & DOMAIN BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Trend Chart */}
        <div className="card-panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#242F42]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Cross-Domain Risk Score Trend
              </h3>
              <p className="text-xs text-slate-400">Reconciled daily maximum risk scores across transactions</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-1 rounded">
              7-Day Ledger Window
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={risk_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUnified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00F2FE" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="unified_risk" name="Unified Risk" stroke="#00F2FE" strokeWidth={2} fillOpacity={1} fill="url(#colorUnified)" />
                <Area type="monotone" dataKey="fraud_risk" name="Fraud Score" stroke="#EF4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorFraud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Three Distinct Risk Domains Cards */}
        <div className="card-panel p-5 flex flex-col justify-between space-y-4">
          <div className="pb-3 border-b border-[#242F42]">
            <h3 className="text-sm font-bold text-white">Risk Domains Overview</h3>
            <p className="text-xs text-slate-400">Derived exposure breakdown by risk vertical</p>
          </div>

          <div className="space-y-3">
            {/* Domain 1: Fraud */}
            <div 
              onClick={() => onNavigateDomain('fraud')}
              className="p-3.5 rounded-xl bg-[#182030] border border-[#26344B] hover:border-cyan-500 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-950/60 text-red-400 border border-red-800/50">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">Fraud & Abuse</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Exposure: {formatINR(metrics.fraud_exposure)}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>

            {/* Domain 2: Returns */}
            <div 
              onClick={() => onNavigateDomain('returns')}
              className="p-3.5 rounded-xl bg-[#182030] border border-[#26344B] hover:border-cyan-500 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/50">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">Returns & Refunds</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Exposure: {formatINR(metrics.return_exposure)}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>

            {/* Domain 3: Disputes */}
            <div 
              onClick={() => onNavigateDomain('disputes')}
              className="p-3.5 rounded-xl bg-[#182030] border border-[#26344B] hover:border-cyan-500 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/50">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">Dispute Intelligence</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Exposure: {formatINR(metrics.dispute_exposure)}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. TOP PRIORITY CASES TABLE */}
      <div className="card-panel p-5">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#242F42]">
          <div>
            <h3 className="text-sm font-bold text-white">Top Priority Risk Cases</h3>
            <p className="text-xs text-slate-400">Click any row to open the complete investigation drawer</p>
          </div>
          <button 
            onClick={() => onNavigateDomain('cases')}
            className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            View All Cases ({metrics.open_cases}) <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F1522] text-slate-400 font-mono uppercase text-[11px] border-b border-[#242F42]">
              <tr>
                <th className="p-3">Case ID</th>
                <th className="p-3">Title & Summary</th>
                <th className="p-3">Domain</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-right">Exposure</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]">
              {priority_cases.map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => onSelectCase(c.id)}
                  className="hover:bg-[#1A2334] cursor-pointer transition-colors"
                >
                  <td className="p-3 font-mono font-bold text-cyan-300">{c.id}</td>
                  <td className="p-3 font-medium text-white max-w-xs truncate">{c.title}</td>
                  <td className="p-3 font-mono text-slate-300">{c.domain}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      c.severity === 'CRITICAL' ? 'badge-critical' : c.severity === 'HIGH' ? 'badge-high' : 'badge-medium'
                    }`}>
                      {c.severity}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 font-mono">{c.entity_name} ({c.entity_id})</td>
                  <td className="p-3 text-right font-mono font-bold text-white">{formatINR(c.exposure_amount)}</td>
                  <td className="p-3 text-center">
                    <button className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[11px] font-mono border border-cyan-800 transition-colors">
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. SUBTLE "WHY THIS MATTERS" CALLOUT */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-semibold text-white">Why This Matters:</span> Cross-domain intelligence fuses signals across payments, return abuse, and chargebacks. Isolated analysis sees 7 individual returns as routine refunds; SentinelRisk AI identifies the underlying multi-account cluster and prevents coordinated ₹84,500 fraud exposure.
        </div>
      </div>

    </div>
  );
}
