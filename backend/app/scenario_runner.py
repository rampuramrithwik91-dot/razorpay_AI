import asyncio
import json
import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal, AuditEvent, RiskCase, Transaction, Return, Dispute, RiskAssessment, EntityRelationship
from app.seed_data import seed_database
from app.risk_engine import update_entity_risk_version
from app.ai_investigator import generate_ai_investigation

async def run_unified_demo_scenario():
    """
    Executes the deterministic narrative hero scenario: UNIFIED MIXED-RISK INCIDENT.
    Yields JSON event dictionaries over SSE for real-time frontend visualization.
    """
    db: Session = SessionLocal()
    try:
        # Step 0: Reset state to deterministic seed 42
        seed_database(db, seed=42)
        yield {
            "step": 0,
            "title": "DEMO STATE RESET",
            "message": "System state reset to deterministic baseline (Seed 42). All metrics reconciled.",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "case_id": "RC-2048",
            "entity_id": "C-218"
        }
        await asyncio.sleep(0.8)

        # Step 1: Payment Event Arrival
        now = datetime.datetime.utcnow()
        db.add(AuditEvent(
            event_type="EVENT_RECEIVED",
            entity_id="C-218",
            case_id="RC-2048",
            description="[Step 1/9] Payment captured ₹84,500 via Razorpay gateway (TXN-8809)",
            metadata_json='{"amount": 84500, "razorpay_id": "pay_K9z9HERO845"}',
            timestamp=now
        ))
        db.commit()
        yield {
            "step": 1,
            "title": "PAYMENT CAPTURED",
            "message": "Payment captured: ₹84,500 (Razorpay ID: pay_K9z9HERO845) for Customer C-218.",
            "timestamp": now.isoformat(),
            "case_id": "RC-2048",
            "entity_id": "C-218"
        }
        await asyncio.sleep(1.0)

        # Step 2: Abnormal Pattern Detection
        db.add(AuditEvent(
            event_type="RISK_DETECTED",
            entity_id="C-218",
            case_id="RC-2048",
            description="[Step 2/9] Velocity spike flag: 3 high-value transactions within 48 hours",
            metadata_json='{"velocity": "3 txns / 48h"}',
            timestamp=datetime.datetime.utcnow()
        ))
        db.commit()
        yield {
            "step": 2,
            "title": "ABNORMAL PATTERN DETECTED",
            "message": "Transaction velocity spike detected: 3 high-value transactions within 48 hours.",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "case_id": "RC-2048",
            "entity_id": "C-218"
        }
        await asyncio.sleep(1.0)

        # Step 3: Entity Relationship Discovery
        db.add(AuditEvent(
            event_type="RISK_DETECTED",
            entity_id="C-218",
            case_id="RC-2048",
            description="[Step 3/9] Entity Graph link discovered: C-218 shares Device D-14 with C-104 and C-309",
            metadata_json='{"device_id": "D-14", "linked_entities": ["C-104", "C-309"]}',
            timestamp=datetime.datetime.utcnow()
        ))
        db.commit()
        yield {
            "step": 3,
            "title": "ENTITY LINK DISCOVERED",
            "message": "Graph engine identified shared device D-14 connecting Customer C-218 to C-104 and C-309.",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "case_id": "RC-2048",
            "entity_id": "C-218"
        }
        await asyncio.sleep(1.0)

        # Step 4: Return History Analysis
        db.add(AuditEvent(
            event_type="RISK_DETECTED",
            entity_id="C-218",
            case_id="RC-2048",
            description="[Step 4/9] Return abuse pattern: 7 of 9 previous orders returned (77.8% return rate)",
            metadata_json='{"return_rate": 0.778, "refunded_sum": 70999.0}',
            timestamp=datetime.datetime.utcnow()
        ))
        db.commit()
        yield {
            "step": 4,
            "title": "RETURN ABUSE ANALYZED",
            "message": "Historical return analysis: 7 of 9 orders returned (77.8% return rate, total ₹70,999 refunded).",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "case_id": "RC-2048",
            "entity_id": "C-218"
        }
        await asyncio.sleep(1.0)

        # Step 5: Chargeback Correlation
        db.add(AuditEvent(
            event_type="RISK_DETECTED",
            entity_id="C-218",
            case_id="RC-2048",
            description="[Step 5/9] Dispute correlation: Active friendly fraud chargeback DISP-901 on linked account",
            metadata_json='{"dispute_id": "DISP-901", "amount": 7400.0}',
            timestamp=datetime.datetime.utcnow()
        ))
        db.commit()
        yield {
            "step": 5,
            "title": "DISPUTE CONTEXT SURFACED",
            "message": "Dispute Intelligence correlated active friendly fraud chargeback DISP-901 on linked account.",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "case_id": "RC-2048",
            "entity_id": "C-218"
        }
        await asyncio.sleep(1.0)

        # Step 6: Unified Risk Escalation
        assessment = update_entity_risk_version(db, "C-218", fraud_score=0.88, return_score=0.82, dispute_score=0.74, case_id="RC-2048")
        db.add(AuditEvent(
            event_type="RISK_DETECTED",
            entity_id="C-218",
            case_id="RC-2048",
            description=f"[Step 6/9] Unified Risk score updated to v3 = {assessment.unified_score} ({assessment.unified_level})",
            metadata_json=f'{{"unified_score": {assessment.unified_score}, "level": "{assessment.unified_level}"}}',
            timestamp=datetime.datetime.utcnow()
        ))
        db.commit()
        yield {
            "step": 6,
            "title": "UNIFIED RISK ESCALATED",
            "message": f"Combined Risk Engine computed score v3 = {assessment.unified_score} ({assessment.unified_level}).",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "case_id": "RC-2048",
            "entity_id": "C-218"
        }
        await asyncio.sleep(1.0)

        # Step 7: Risk Case Creation
        case = db.query(RiskCase).filter(RiskCase.id == "RC-2048").first()
        if case:
            case.status = "OPEN"
            case.updated_at = datetime.datetime.utcnow()
            db.commit()
            
        db.add(AuditEvent(
            event_type="CASE_CREATED",
            entity_id="C-218",
            case_id="RC-2048",
            description="[Step 7/9] Risk Case RC-2048 updated & prioritized in Review Queue",
            metadata_json='{"case_id": "RC-2048", "exposure": 84500.0}',
            timestamp=datetime.datetime.utcnow()
        ))
        db.commit()
        yield {
            "step": 7,
            "title": "HERO CASE CREATED",
            "message": "Hero Risk Case RC-2048 flagged with ₹84,500 total exposure in review queue.",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "case_id": "RC-2048",
            "entity_id": "C-218"
        }
        await asyncio.sleep(1.0)

        # Step 8: AI Investigation & Policy Execution
        investigation = generate_ai_investigation(db, "RC-2048")
        db.add(AuditEvent(
            event_type="AI_INVESTIGATED",
            entity_id="C-218",
            case_id="RC-2048",
            description="[Step 8/9] Grounded AI Investigator executed multi-domain evidence analysis",
            metadata_json=f'{{"confidence": {investigation.confidence_score}, "policy": "{investigation.policy_result}"}}',
            timestamp=datetime.datetime.utcnow()
        ))
        db.commit()
        yield {
            "step": 8,
            "title": "AI INVESTIGATION & POLICY EXECUTION",
            "message": f"AI Investigation complete (Confidence {investigation.confidence_score*100:.0f}%). Policy {investigation.policy_result} executed.",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "case_id": "RC-2048",
            "entity_id": "C-218"
        }
        await asyncio.sleep(1.0)

        # Step 9: Review Queue Entry & Complete Audit Log
        db.add(AuditEvent(
            event_type="ACTION_RECOMMENDED",
            entity_id="C-218",
            case_id="RC-2048",
            description="[Step 9/9] Hero Scenario Complete: Case RC-2048 awaiting human review decision",
            metadata_json='{"status": "AWAITING_HUMAN_DECISION"}',
            timestamp=datetime.datetime.utcnow()
        ))
        db.commit()
        yield {
            "step": 9,
            "title": "SCENARIO COMPLETE — AWAITING REVIEW",
            "message": "Unified Mixed-Risk Incident scenario complete! Case RC-2048 ready for deep investigation.",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "case_id": "RC-2048",
            "entity_id": "C-218"
        }
    finally:
        db.close()
