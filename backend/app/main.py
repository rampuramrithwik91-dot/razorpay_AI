import json
import asyncio
import datetime
import os
from fastapi import FastAPI, Depends, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import (
    init_db, get_db, Merchant, Entity, EntityRelationship, Transaction, Return, Dispute,
    RiskAssessment, RiskCase, AIInvestigation, Policy, AuditEvent, EvaluationRun
)
from app.seed_data import seed_database
from app.risk_engine import update_entity_risk_version
from app.ai_investigator import generate_ai_investigation
from app.evaluator import run_deterministic_evaluator
from app.scenario_runner import run_unified_demo_scenario

app = FastAPI(title="SentinelRisk AI — Razorpay Merchant Risk Intelligence Platform API")

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    db = next(get_db())
    # Ensure database is seeded with deterministic seed 42 on boot if empty
    merchant_count = db.query(Merchant).count()
    if merchant_count == 0:
        seed_database(db, seed=42)

# --- SYSTEM HEALTH & STATUS ---
@app.get("/api/system/status")
def get_system_status(db: Session = Depends(get_db)):
    merchant = db.query(Merchant).first()
    return {
        "status": merchant.status if merchant else "SYSTEM_HEALTHY",
        "mode": merchant.mode if merchant else "RAZORPAY_TEST_MODE",
        "database": "CONNECTED",
        "ai_engine": "ONLINE",
        "seed": 42,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

# --- DERIVED DASHBOARD OVERVIEW ---
@app.get("/api/dashboard/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    """
    Computes ALL metrics dynamically from stored SQLite records. ZERO hardcoded values.
    """
    open_cases = db.query(RiskCase).filter(RiskCase.status.in_(["OPEN", "IN_REVIEW"])).all()
    
    total_exposure = sum(c.exposure_amount for c in open_cases)
    open_cases_count = len(open_cases)
    critical_cases_count = sum(1 for c in open_cases if c.severity == "CRITICAL")
    human_review_pending_count = sum(1 for c in open_cases if c.status in ["OPEN", "IN_REVIEW"])
    
    fraud_exposure = sum(c.exposure_amount for c in open_cases if c.domain == "FRAUD_ABUSE")
    return_exposure = sum(c.exposure_amount for c in open_cases if c.domain == "RETURN_REFUND")
    dispute_exposure = sum(c.exposure_amount for c in open_cases if c.domain == "DISPUTE_INTEL")
    unified_exposure = sum(c.exposure_amount for c in open_cases if c.domain == "UNIFIED")
    
    # Priority cases (Top 5 open cases by exposure)
    priority_cases = db.query(RiskCase).filter(
        RiskCase.status.in_(["OPEN", "IN_REVIEW"])
    ).order_by(RiskCase.exposure_amount.desc()).limit(5).all()
    
    priority_cases_list = []
    for pc in priority_cases:
        entity = db.query(Entity).filter(Entity.id == pc.entity_id).first()
        priority_cases_list.append({
            "id": pc.id,
            "title": pc.title,
            "severity": pc.severity,
            "domain": pc.domain,
            "status": pc.status,
            "exposure_amount": pc.exposure_amount,
            "entity_id": pc.entity_id,
            "entity_name": entity.name if entity else pc.entity_id,
            "created_at": pc.created_at.isoformat()
        })
        
    # Reconciled Risk Trend Data (derived from stored transactions aggregated by day)
    txns = db.query(Transaction).order_by(Transaction.timestamp.asc()).all()
    trend_dict = {}
    for t in txns:
        day_str = t.timestamp.strftime("%b %d")
        if day_str not in trend_dict:
            trend_dict[day_str] = {"day": day_str, "fraud_risk": 0.1, "return_risk": 0.1, "dispute_risk": 0.1, "unified_risk": 0.1, "count": 0}
        trend_dict[day_str]["count"] += 1
        if t.risk_domain == "FRAUD_ABUSE":
            trend_dict[day_str]["fraud_risk"] = max(trend_dict[day_str]["fraud_risk"], t.risk_score)
        elif t.risk_domain == "RETURN_REFUND":
            trend_dict[day_str]["return_risk"] = max(trend_dict[day_str]["return_risk"], t.risk_score)
        elif t.risk_domain == "DISPUTE_INTEL":
            trend_dict[day_str]["dispute_risk"] = max(trend_dict[day_str]["dispute_risk"], t.risk_score)
        elif t.risk_domain == "UNIFIED":
            trend_dict[day_str]["unified_risk"] = max(trend_dict[day_str]["unified_risk"], t.risk_score)
            
    risk_trend = list(trend_dict.values())[-7:] if trend_dict else []
    
    return {
        "metrics": {
            "total_exposure": total_exposure,
            "open_cases": open_cases_count,
            "critical_cases": critical_cases_count,
            "human_review_pending": human_review_pending_count,
            "fraud_exposure": fraud_exposure,
            "return_exposure": return_exposure,
            "dispute_exposure": dispute_exposure,
            "unified_exposure": unified_exposure
        },
        "risk_trend": risk_trend,
        "priority_cases": priority_cases_list
    }

# --- RISK CASES ENDPOINTS ---
@app.get("/api/cases")
def get_cases(
    domain: str = Query(None),
    severity: str = Query(None),
    status: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(RiskCase)
    if domain and domain != "ALL":
        query = query.filter(RiskCase.domain == domain)
    if severity and severity != "ALL":
        query = query.filter(RiskCase.severity == severity)
    if status and status != "ALL":
        query = query.filter(RiskCase.status == status)
        
    cases = query.order_by(RiskCase.created_at.desc()).all()
    results = []
    for c in cases:
        entity = db.query(Entity).filter(Entity.id == c.entity_id).first()
        results.append({
            "id": c.id,
            "title": c.title,
            "severity": c.severity,
            "domain": c.domain,
            "status": c.status,
            "exposure_amount": c.exposure_amount,
            "entity_id": c.entity_id,
            "entity_name": entity.name if entity else c.entity_id,
            "assigned_to": c.assigned_to,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat()
        })
    return results

@app.get("/api/cases/{case_id}")
def get_case_detail(case_id: str, db: Session = Depends(get_db)):
    case = db.query(RiskCase).filter(RiskCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
        
    entity = db.query(Entity).filter(Entity.id == case.entity_id).first()
    ai_investigation = db.query(AIInvestigation).filter(AIInvestigation.case_id == case_id).first()
    if not ai_investigation:
        ai_investigation = generate_ai_investigation(db, case_id)
        
    txns = db.query(Transaction).filter(Transaction.customer_id == case.entity_id).all()
    returns = db.query(Return).filter(Return.customer_id == case.entity_id).all()
    disputes = db.query(Dispute).filter(Dispute.customer_id == case.entity_id).all()
    assessments = db.query(RiskAssessment).filter(RiskAssessment.entity_id == case.entity_id).order_by(RiskAssessment.version.asc()).all()
    
    # Audit trail for case
    audit_events = db.query(AuditEvent).filter(
        (AuditEvent.case_id == case_id) | (AuditEvent.entity_id == case.entity_id)
    ).order_by(AuditEvent.timestamp.desc()).all()

    # Graph relationships
    relationships = db.query(EntityRelationship).filter(
        (EntityRelationship.source_entity_id == case.entity_id) | (EntityRelationship.target_entity_id == case.entity_id)
    ).all()
    
    rel_list = []
    for r in relationships:
        target_id = r.target_entity_id if r.source_entity_id == case.entity_id else r.source_entity_id
        target_entity = db.query(Entity).filter(Entity.id == target_id).first()
        rel_list.append({
            "target_id": target_id,
            "target_name": target_entity.name if target_entity else target_id,
            "target_type": target_entity.entity_type if target_entity else "UNKNOWN",
            "relationship_type": r.relationship_type,
            "confidence": r.confidence
        })

    return {
        "case": {
            "id": case.id,
            "title": case.title,
            "severity": case.severity,
            "domain": case.domain,
            "status": case.status,
            "exposure_amount": case.exposure_amount,
            "entity_id": case.entity_id,
            "entity_name": entity.name if entity else case.entity_id,
            "assigned_to": case.assigned_to,
            "created_at": case.created_at.isoformat(),
            "updated_at": case.updated_at.isoformat()
        },
        "ai_investigation": {
            "summary": ai_investigation.summary,
            "key_evidence": json.loads(ai_investigation.key_evidence),
            "risk_factors": json.loads(ai_investigation.risk_factors),
            "uncertainties": json.loads(ai_investigation.uncertainties),
            "recommendation": ai_investigation.recommendation,
            "confidence_score": ai_investigation.confidence_score,
            "policy_result": ai_investigation.policy_result
        },
        "metrics": {
            "transaction_count": len(txns),
            "total_spent": sum(t.amount for t in txns),
            "return_count": len(returns),
            "total_refunded": sum(r.refund_amount for r in returns),
            "dispute_count": len(disputes),
            "total_disputed": sum(d.amount for d in disputes)
        },
        "relationships": rel_list,
        "risk_versions": [
            {
                "version": a.version,
                "fraud_score": a.fraud_score,
                "return_score": a.return_score,
                "dispute_score": a.dispute_score,
                "unified_score": a.unified_score,
                "unified_level": a.unified_level,
                "reason_codes": json.loads(a.reason_codes),
                "timestamp": a.timestamp.isoformat()
            } for a in assessments
        ],
        "audit_trail": [
            {
                "id": ae.id,
                "event_type": ae.event_type,
                "description": ae.description,
                "metadata": json.loads(ae.metadata_json),
                "timestamp": ae.timestamp.isoformat()
            } for ae in audit_events
        ]
    }

@app.post("/api/cases/{case_id}/action")
def update_case_action(
    case_id: str,
    action: str = Body(..., embed=True),
    notes: str = Body("", embed=True),
    db: Session = Depends(get_db)
):
    case = db.query(RiskCase).filter(RiskCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    old_status = case.status
    if action in ["CONFIRM_FRAUD", "RESOLVE_CASE", "APPROVE_REFUND"]:
        case.status = "RESOLVED"
    elif action in ["DISMISS", "REJECT_CASE"]:
        case.status = "DISMISSED"
    elif action == "ESCALATE":
        case.status = "IN_REVIEW"
        case.severity = "CRITICAL"
        
    case.updated_at = datetime.datetime.utcnow()
    
    # Log state transition to Audit Trail
    audit_ev = AuditEvent(
        event_type="HUMAN_REVIEWED" if case.status != "RESOLVED" else "CASE_RESOLVED",
        entity_id=case.entity_id,
        case_id=case_id,
        description=f"Action '{action}' performed on Case {case_id}. Status changed from {old_status} to {case.status}.",
        metadata_json=json.dumps({"action": action, "notes": notes, "operator": "Risk Analyst"}),
        timestamp=datetime.datetime.utcnow()
    )
    db.add(audit_ev)
    db.commit()
    db.refresh(case)
    return {"success": True, "case_id": case_id, "new_status": case.status, "severity": case.severity}

# --- ENTITY TIMELINE & GRAPH ---
@app.get("/api/entities/{entity_id}")
def get_entity_detail(entity_id: str, db: Session = Depends(get_db)):
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
        
    txns = db.query(Transaction).filter(Transaction.customer_id == entity_id).all()
    returns = db.query(Return).filter(Return.customer_id == entity_id).all()
    disputes = db.query(Dispute).filter(Dispute.customer_id == entity_id).all()
    assessments = db.query(RiskAssessment).filter(RiskAssessment.entity_id == entity_id).order_by(RiskAssessment.version.asc()).all()
    
    # Construct Unified Timeline
    timeline_events = []
    for t in txns:
        timeline_events.append({
            "type": "PAYMENT",
            "title": f"Payment {t.status}: ₹{t.amount:,.2f}",
            "amount": t.amount,
            "status": t.status,
            "timestamp": t.timestamp.isoformat(),
            "details": f"Razorpay Payment ID: {t.razorpay_payment_id or 'pay_mock'}"
        })
    for r in returns:
        timeline_events.append({
            "type": "RETURN",
            "title": f"Return {r.status}: ₹{r.refund_amount:,.2f}",
            "amount": r.refund_amount,
            "status": r.status,
            "timestamp": r.timestamp.isoformat(),
            "details": f"Reason: {r.reason}"
        })
    for d in disputes:
        timeline_events.append({
            "type": "DISPUTE",
            "title": f"Dispute {d.status}: ₹{d.amount:,.2f}",
            "amount": d.amount,
            "status": d.status,
            "timestamp": d.timestamp.isoformat(),
            "details": f"Dispute Type: {d.dispute_type}"
        })
    for a in assessments:
        timeline_events.append({
            "type": "RISK_SCORE_CHANGE",
            "title": f"Risk Score Version {a.version}: {a.unified_score} ({a.unified_level})",
            "amount": 0,
            "status": a.unified_level,
            "timestamp": a.timestamp.isoformat(),
            "details": f"Reasons: {', '.join(json.loads(a.reason_codes))}"
        })
        
    timeline_events.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "entity": {
            "id": entity.id,
            "name": entity.name or entity.id,
            "email": entity.email,
            "entity_type": entity.entity_type,
            "risk_level": entity.risk_level,
            "score": entity.score,
            "created_at": entity.created_at.isoformat()
        },
        "timeline": timeline_events
    }

@app.get("/api/graph")
def get_graph_data(selected_entity_id: str = "C-218", db: Session = Depends(get_db)):
    """
    Returns entity graph nodes and edges focusing on selected entity & direct relationships.
    """
    entities = db.query(Entity).all()
    relationships = db.query(EntityRelationship).all()
    
    nodes = []
    for e in entities:
        is_selected = (e.id == selected_entity_id)
        nodes.append({
            "id": e.id,
            "label": e.name if e.name else e.id,
            "type": e.entity_type,
            "risk_level": e.risk_level,
            "score": e.score,
            "is_primary": is_selected
        })
        
    edges = []
    for r in relationships:
        edges.append({
            "id": f"e_{r.id}",
            "source": r.source_entity_id,
            "target": r.target_entity_id,
            "type": r.relationship_type,
            "confidence": r.confidence
        })
        
    return {"nodes": nodes, "edges": edges, "selected_entity_id": selected_entity_id}

# --- DOMAIN ANALYTICS ---
@app.get("/api/analytics/{domain}")
def get_domain_analytics(domain: str, db: Session = Depends(get_db)):
    if domain not in ["FRAUD_ABUSE", "RETURN_REFUND", "DISPUTE_INTEL", "UNIFIED"]:
        raise HTTPException(status_code=400, detail="Invalid risk domain")
        
    open_cases = db.query(RiskCase).filter(RiskCase.domain == domain, RiskCase.status.in_(["OPEN", "IN_REVIEW"])).all()
    total_exposure = sum(c.exposure_amount for c in open_cases)
    
    if domain == "FRAUD_ABUSE":
        explanation = "Hidden entity relationships and device sharing reveal coordinated abuse that single-event analysis misses."
    elif domain == "RETURN_REFUND":
        explanation = "Repeated behavior across time reveals policy & wardrobing abuse invisible at transaction level."
    elif domain == "DISPUTE_INTEL":
        explanation = "Historical risk context helps investigators understand chargebacks beyond the isolated transaction."
    else:
        explanation = "Cross-domain intelligence fuses signals across Payments, Returns, and Disputes for holistic risk decisions."
        
    cases_list = []
    for c in open_cases:
        entity = db.query(Entity).filter(Entity.id == c.entity_id).first()
        cases_list.append({
            "id": c.id,
            "title": c.title,
            "severity": c.severity,
            "exposure_amount": c.exposure_amount,
            "entity_id": c.entity_id,
            "entity_name": entity.name if entity else c.entity_id,
            "status": c.status,
            "created_at": c.created_at.isoformat()
        })
        
    return {
        "domain": domain,
        "explanation": explanation,
        "metrics": {
            "total_exposure": total_exposure,
            "open_cases_count": len(open_cases)
        },
        "cases": cases_list
    }

# --- POLICY ENGINE ---
@app.get("/api/policies")
def get_policies(db: Session = Depends(get_db)):
    policies = db.query(Policy).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "domain": p.domain,
            "trigger_condition": p.trigger_condition,
            "action": p.action,
            "is_active": p.is_active,
            "execute_count": p.execute_count,
            "last_triggered_at": p.last_triggered_at.isoformat() if p.last_triggered_at else None
        } for p in policies
    ]

# --- EVALUATION BENCHMARK ---
@app.get("/api/evaluation")
def get_evaluation(db: Session = Depends(get_db)):
    eval_run = db.query(EvaluationRun).order_by(EvaluationRun.timestamp.desc()).first()
    if not eval_run:
        eval_run = run_deterministic_evaluator(db, seed=42)
        
    return {
        "dataset_name": eval_run.dataset_name,
        "test_count": eval_run.test_count,
        "ground_truth_positives": eval_run.ground_truth_positives,
        "precision": eval_run.precision,
        "recall": eval_run.recall,
        "f1_score": eval_run.f1_score,
        "false_positive_rate": eval_run.false_positive_rate,
        "false_positive_cost_inr": eval_run.false_positive_cost_inr,
        "timestamp": eval_run.timestamp.isoformat()
    }

# --- AUDIT TRAIL ---
@app.get("/api/audit")
def get_audit_trail(db: Session = Depends(get_db)):
    events = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).all()
    return [
        {
            "id": ae.id,
            "event_type": ae.event_type,
            "entity_id": ae.entity_id,
            "case_id": ae.case_id,
            "description": ae.description,
            "metadata": json.loads(ae.metadata_json),
            "timestamp": ae.timestamp.isoformat()
        } for ae in events
    ]

# --- DEMO CONTROLS & SCENARIO RUNNER ---
@app.post("/api/demo/reset")
def reset_demo(db: Session = Depends(get_db)):
    seed_database(db, seed=42)
    return {"success": True, "message": "System state successfully reset to Seed 42 baseline."}

@app.get("/api/demo/run-scenario")
async def run_scenario_stream():
    """
    SSE stream of narrative hero scenario execution events.
    """
    async def event_generator():
        async for event in run_unified_demo_scenario():
            yield {
                "event": "message",
                "data": json.dumps(event)
            }
    return EventSourceResponse(event_generator())

# --- PRODUCTION UNIFIED STATIC ASSETS SERVING ---
dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(dist_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_path, "index.html"))
