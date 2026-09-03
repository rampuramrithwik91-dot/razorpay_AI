import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import DemoScenarioModal from './components/DemoScenarioModal';

import Overview from './views/Overview';
import RiskCasesView from './views/RiskCasesView';
import HeroCaseDetail from './views/HeroCaseDetail';
import DomainView from './views/DomainView';
import EntityExplorer from './views/EntityExplorer';
import PolicyEngine from './views/PolicyEngine';
import EvaluationBenchmark from './views/EvaluationBenchmark';
import AuditTrail from './views/AuditTrail';
import { API_BASE, fetchJson } from './utils/api';

export default function App() {
  const [currentTab, setTab] = useState('overview');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  
  // Overview Dashboard State
  const [overviewData, setOverviewData] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Scenario Runner State
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [scenarioSteps, setScenarioSteps] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isRunningScenario, setIsRunningScenario] = useState(false);
  const [isScenarioComplete, setIsScenarioComplete] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const data = await fetchJson('/dashboard/overview');
      setOverviewData(data);
    } catch (err) {
      console.error("Error fetching overview data:", err);
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Handle Scenario Replay / SSE Stream
  const handleRunDemoScenario = () => {
    setIsScenarioModalOpen(true);
    setIsRunningScenario(true);
    setIsScenarioComplete(false);
    setScenarioSteps([]);
    setCurrentStepIdx(0);

    const sseUrl = `${API_BASE}/demo/run-scenario`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setScenarioSteps((prev) => [...prev, data]);
        setCurrentStepIdx(data.step);

        if (data.step === 9) {
          setIsRunningScenario(false);
          setIsScenarioComplete(true);
          eventSource.close();
          fetchOverview(); // Refresh overview derived stats!
        }
      } catch (err) {
        console.error("Error parsing SSE event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      eventSource.close();
      setIsRunningScenario(false);
    };
  };

  // Handle Reset State
  const handleResetDemoState = async () => {
    try {
      const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
      if (res.ok) {
        await fetchOverview();
        alert("System state reset to Seed 42 baseline successfully!");
      }
    } catch (err) {
      console.error("Error resetting demo state:", err);
    }
  };

  const handleSelectCase = (caseId) => {
    setSelectedCaseId(caseId);
    setTab('case_detail');
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
      
      {/* Top Header Navigation */}
      <Navigation 
        currentTab={currentTab}
        setTab={(tabId) => {
          setSelectedCaseId(null);
          setTab(tabId);
        }}
        onRunDemo={handleRunDemoScenario}
        onResetDemo={handleResetDemoState}
        isRunningScenario={isRunningScenario}
      />

      {/* Real-time Narrative Demo Scenario Modal */}
      <DemoScenarioModal 
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        scenarioSteps={scenarioSteps}
        currentStep={currentStepIdx}
        isComplete={isScenarioComplete}
        onViewHeroCase={() => {
          setSelectedCaseId("RC-2048");
          setTab('case_detail');
        }}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6">
        {currentTab === 'overview' && (
          <Overview 
            overviewData={overviewData}
            onSelectCase={handleSelectCase}
            onNavigateDomain={(dKey) => setTab(dKey)}
          />
        )}

        {currentTab === 'cases' && (
          <RiskCasesView onSelectCase={handleSelectCase} />
        )}

        {currentTab === 'case_detail' && (
          <HeroCaseDetail 
            caseId={selectedCaseId || "RC-2048"}
            onBack={() => setTab('cases')}
            onCaseUpdated={fetchOverview}
          />
        )}

        {currentTab === 'fraud' && (
          <DomainView domainKey="FRAUD_ABUSE" onSelectCase={handleSelectCase} />
        )}

        {currentTab === 'returns' && (
          <DomainView domainKey="RETURN_REFUND" onSelectCase={handleSelectCase} />
        )}

        {currentTab === 'disputes' && (
          <DomainView domainKey="DISPUTE_INTEL" onSelectCase={handleSelectCase} />
        )}

        {currentTab === 'explorer' && (
          <EntityExplorer />
        )}

        {currentTab === 'policies' && (
          <PolicyEngine />
        )}

        {currentTab === 'evaluation' && (
          <EvaluationBenchmark />
        )}

        {currentTab === 'audit' && (
          <AuditTrail />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1C2638] bg-[#0A0E17] py-4 text-center text-xs text-slate-500 font-mono">
        SentinelRisk AI • Razorpay Merchant Risk Intelligence Platform • Hackathon Demo Readiness Quality Pass Passed
      </footer>

    </div>
  );
}
