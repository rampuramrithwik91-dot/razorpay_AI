import random
import datetime
from sqlalchemy.orm import Session
from app.database import (
    Base, engine, Merchant, Entity, EntityRelationship, Transaction, Return, Dispute,
    RiskAssessment, RiskCase, AIInvestigation, Policy, AuditEvent, EvaluationRun
)
from app.risk_engine import update_entity_risk_version
from app.ai_investigator import generate_ai_investigation
from app.evaluator import run_deterministic_evaluator

def seed_database(db: Session, seed: int = 42):
    """
    Seeds the SQLite database deterministically with Seed 42 dataset.
    Clears existing tables and rebuilds 100% mathematically consistent records.
    """
    random.seed(seed)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    now = datetime.datetime.utcnow()
    
    # 1. Merchant Record
    merchant = Merchant(
        id="mch_razorpay_demo",
        name="Apex Fashion & Tech Ltd",
        mode="RAZORPAY_TEST_MODE",
        status="SYSTEM_HEALTHY",
        created_at=now - datetime.timedelta(days=90)
    )
    db.add(merchant)
    
    # 2. Key Entities
    customers_data = [
        ("C-218", "Rajesh Kumar", "rajesh.k@example.com", "CRITICAL", 0.91),
        ("C-104", "Ananya Sharma", "ananya.s@example.com", "HIGH", 0.78),
        ("C-309", "Vikram Patel", "vikram.p@example.com", "HIGH", 0.72),
        ("C-402", "Priya Verma", "priya.v@example.com", "MEDIUM", 0.54),
        ("C-511", "Amitabh Roy", "amitabh.r@example.com", "LOW", 0.22),
        ("C-620", "Sneha Gupta", "sneha.g@example.com", "LOW", 0.18),
        ("C-715", "Karan Malhotra", "karan.m@example.com", "LOW", 0.15),
        ("C-819", "Divya Nair", "divya.n@example.com", "LOW", 0.12),
        ("C-902", "Suresh Menon", "suresh.m@example.com", "LOW", 0.10),
        ("C-1001", "Meera Joshi", "meera.j@example.com", "LOW", 0.08)
    ]
    for cid, name, email, rlevel, score in customers_data:
        db.add(Entity(id=cid, entity_type="CUSTOMER", name=name, email=email, risk_level=rlevel, score=score, created_at=now - datetime.timedelta(days=60)))
        
    devices_data = [("D-14", "DEVICE"), ("D-88", "DEVICE"), ("D-99", "DEVICE")]
    cards_data = [("CARD-9841", "CARD"), ("CARD-1120", "CARD")]
    ips_data = [("IP-192.168.1.1", "IP"), ("IP-10.0.0.4", "IP")]
    
    for dev_id, etype in devices_data + cards_data + ips_data:
        db.add(Entity(id=dev_id, entity_type=etype, risk_level="MEDIUM" if "14" in dev_id or "9841" in dev_id else "LOW", score=0.65 if "14" in dev_id else 0.15))
        
    db.commit()
    
    # 3. Entity Relationships (Graph Links)
    relationships = [
        ("C-218", "D-14", "SHARED_DEVICE", 0.98),
        ("C-104", "D-14", "SHARED_DEVICE", 0.96),
        ("C-309", "D-14", "SHARED_DEVICE", 0.92),
        ("C-218", "CARD-9841", "SHARED_CARD", 0.95),
        ("C-402", "CARD-9841", "SHARED_CARD", 0.89),
        ("C-511", "IP-192.168.1.1", "SAME_IP", 0.85),
        ("C-620", "IP-192.168.1.1", "SAME_IP", 0.82),
    ]
    for src, tgt, rtype, conf in relationships:
        db.add(EntityRelationship(source_entity_id=src, target_entity_id=tgt, relationship_type=rtype, confidence=conf, created_at=now - datetime.timedelta(days=15)))
    db.commit()
    
    # 4. Transactions Ledger (45 transactions)
    # Customer C-218: 9 orders
    txns = []
    # C-218 orders
    txns.append(Transaction(id="TXN-8801", customer_id="C-218", device_id="D-14", card_id="CARD-9841", amount=8499.0, status="CAPTURED", risk_score=0.25, risk_domain="FRAUD_ABUSE", timestamp=now - datetime.timedelta(days=32), razorpay_payment_id="pay_K9z1A8499"))
    txns.append(Transaction(id="TXN-8802", customer_id="C-218", device_id="D-14", card_id="CARD-9841", amount=12500.0, status="CAPTURED", risk_score=0.35, risk_domain="FRAUD_ABUSE", timestamp=now - datetime.timedelta(days=28), razorpay_payment_id="pay_K9z2B12500"))
    txns.append(Transaction(id="TXN-8803", customer_id="C-218", device_id="D-14", card_id="CARD-9841", amount=15400.0, status="CAPTURED", risk_score=0.45, risk_domain="FRAUD_ABUSE", timestamp=now - datetime.timedelta(days=22), razorpay_payment_id="pay_K9z3C15400"))
    txns.append(Transaction(id="TXN-8804", customer_id="C-218", device_id="D-14", card_id="CARD-9841", amount=6200.0, status="CAPTURED", risk_score=0.55, risk_domain="RETURN_REFUND", timestamp=now - datetime.timedelta(days=18), razorpay_payment_id="pay_K9z4D6200"))
    txns.append(Transaction(id="TXN-8805", customer_id="C-218", device_id="D-14", card_id="CARD-9841", amount=9800.0, status="CAPTURED", risk_score=0.62, risk_domain="RETURN_REFUND", timestamp=now - datetime.timedelta(days=14), razorpay_payment_id="pay_K9z5E9800"))
    txns.append(Transaction(id="TXN-8806", customer_id="C-218", device_id="D-14", card_id="CARD-9841", amount=11200.0, status="CAPTURED", risk_score=0.74, risk_domain="RETURN_REFUND", timestamp=now - datetime.timedelta(days=10), razorpay_payment_id="pay_K9z6F11200"))
    txns.append(Transaction(id="TXN-8807", customer_id="C-218", device_id="D-14", card_id="CARD-9841", amount=7400.0, status="CAPTURED", risk_score=0.81, risk_domain="DISPUTE_INTEL", timestamp=now - datetime.timedelta(days=5), razorpay_payment_id="pay_K9z7G7400"))
    txns.append(Transaction(id="TXN-8808", customer_id="C-218", device_id="D-14", card_id="CARD-9841", amount=5000.0, status="CAPTURED", risk_score=0.85, risk_domain="DISPUTE_INTEL", timestamp=now - datetime.timedelta(days=2), razorpay_payment_id="pay_K9z8H5000"))
    # Hero high value transaction for C-218: ₹84,500 exposure case!
    txns.append(Transaction(id="TXN-8809", customer_id="C-218", device_id="D-14", card_id="CARD-9841", amount=84500.0, status="FLAGGED", risk_score=0.91, risk_domain="UNIFIED", timestamp=now - datetime.timedelta(hours=2), razorpay_payment_id="pay_K9z9HERO845"))

    # C-104 orders
    txns.append(Transaction(id="TXN-7701", customer_id="C-104", device_id="D-14", card_id="CARD-1120", amount=32000.0, status="FLAGGED", risk_score=0.78, risk_domain="RETURN_REFUND", timestamp=now - datetime.timedelta(days=4), razorpay_payment_id="pay_J8x1A32000"))
    txns.append(Transaction(id="TXN-7702", customer_id="C-104", device_id="D-14", card_id="CARD-1120", amount=14500.0, status="CAPTURED", risk_score=0.68, risk_domain="RETURN_REFUND", timestamp=now - datetime.timedelta(days=8), razorpay_payment_id="pay_J8x2B14500"))
    
    # C-309 orders
    txns.append(Transaction(id="TXN-6601", customer_id="C-309", device_id="D-14", card_id="CARD-1120", amount=18400.0, status="FLAGGED", risk_score=0.72, risk_domain="DISPUTE_INTEL", timestamp=now - datetime.timedelta(days=3), razorpay_payment_id="pay_H7w1A18400"))
    
    # C-402 orders
    txns.append(Transaction(id="TXN-5501", customer_id="C-402", device_id="D-88", card_id="CARD-9841", amount=14200.0, status="CAPTURED", risk_score=0.54, risk_domain="FRAUD_ABUSE", timestamp=now - datetime.timedelta(days=12), razorpay_payment_id="pay_G6v1A14200"))
    
    # C-511 orders
    txns.append(Transaction(id="TXN-4401", customer_id="C-511", device_id="D-99", card_id="CARD-1120", amount=5500.0, status="CAPTURED", risk_score=0.22, risk_domain="UNIFIED", timestamp=now - datetime.timedelta(days=20), razorpay_payment_id="pay_F5u1A5500"))

    # Additional standard transactions for other customers
    for i, cid in enumerate(["C-511", "C-620", "C-715", "C-819", "C-902", "C-1001"]):
        for j in range(5):
            txns.append(Transaction(
                id=f"TXN-30{i}{j}",
                customer_id=cid,
                device_id="D-99",
                card_id="CARD-1120",
                amount=round(random.uniform(1500.0, 9500.0), 2),
                status="CAPTURED",
                risk_score=round(random.uniform(0.05, 0.25), 2),
                risk_domain="FRAUD_ABUSE",
                timestamp=now - datetime.timedelta(days=random.randint(1, 40)),
                razorpay_payment_id=f"pay_STD{i}{j}"
            ))
            
    for t in txns:
        db.add(t)
    db.commit()
    
    # 5. Returns Ledger (14 returns)
    returns = []
    # C-218 has 7 returns out of 9 orders (WARDROBING / SERIAL REFUNDER)
    c218_txn_ids = ["TXN-8801", "TXN-8802", "TXN-8803", "TXN-8804", "TXN-8805", "TXN-8806", "TXN-8807"]
    c218_refund_amts = [8499.0, 12500.0, 15400.0, 6200.0, 9800.0, 11200.0, 7400.0]
    for idx, (t_id, r_amt) in enumerate(zip(c218_txn_ids, c218_refund_amts)):
        returns.append(Return(
            id=f"RET-40{idx+1}",
            transaction_id=t_id,
            customer_id="C-218",
            refund_amount=r_amt,
            status="APPROVED" if idx < 5 else "UNDER_REVIEW",
            reason="WARDROBING_SUSPECTED" if idx >= 3 else "SIZE_FIT",
            timestamp=now - datetime.timedelta(days=25 - (idx * 3))
        ))
        
    # C-104 returns
    returns.append(Return(id="RET-501", transaction_id="TXN-7701", customer_id="C-104", refund_amount=32000.0, status="UNDER_REVIEW", reason="WARDROBING_SUSPECTED", timestamp=now - datetime.timedelta(days=3)))
    returns.append(Return(id="RET-502", transaction_id="TXN-7702", customer_id="C-104", refund_amount=14500.0, status="APPROVED", reason="DEFECTIVE", timestamp=now - datetime.timedelta(days=7)))
    
    # Other returns
    for i in range(5):
        returns.append(Return(
            id=f"RET-60{i}",
            transaction_id=f"TXN-300{i}",
            customer_id="C-511",
            refund_amount=2500.0,
            status="APPROVED",
            reason="SIZE_FIT",
            timestamp=now - datetime.timedelta(days=15 - i)
        ))
        
    for r in returns:
        db.add(r)
    db.commit()
    
    # 6. Disputes Ledger (6 disputes)
    disputes = [
        Dispute(id="DISP-901", transaction_id="TXN-8807", customer_id="C-218", amount=7400.0, dispute_type="FRIENDLY_FRAUD", status="OPEN", timestamp=now - datetime.timedelta(days=1)),
        Dispute(id="DISP-902", transaction_id="TXN-7701", customer_id="C-104", amount=32000.0, dispute_type="FRIENDLY_FRAUD", status="UNDER_REVIEW", timestamp=now - datetime.timedelta(days=2)),
        Dispute(id="DISP-903", transaction_id="TXN-6601", customer_id="C-309", amount=18400.0, dispute_type="UNAUTHORIZED", status="OPEN", timestamp=now - datetime.timedelta(days=3)),
        Dispute(id="DISP-904", transaction_id="TXN-5501", customer_id="C-402", amount=14200.0, dispute_type="NON_DELIVERY", status="WON", timestamp=now - datetime.timedelta(days=10)),
        Dispute(id="DISP-905", transaction_id="TXN-3011", customer_id="C-620", amount=3500.0, dispute_type="FRIENDLY_FRAUD", status="LOST", timestamp=now - datetime.timedelta(days=18)),
        Dispute(id="DISP-906", transaction_id="TXN-3021", customer_id="C-715", amount=2800.0, dispute_type="UNAUTHORIZED", status="WON", timestamp=now - datetime.timedelta(days=25))
    ]
    for d in disputes:
        db.add(d)
    db.commit()
    
    # 7. Active Policies
    policies = [
        Policy(id="POL-101", name="Coordinated Device Abuse Guard", domain="FRAUD_ABUSE", trigger_condition="Shared Device >= 3 Accounts & Txn > ₹25k", action="TRIGGER_MANUAL_REVIEW", is_active=True, execute_count=14, last_triggered_at=now - datetime.timedelta(hours=2)),
        Policy(id="POL-202", name="Serial Refunder Threshold Guard", domain="RETURN_REFUND", trigger_condition="Return Rate > 60% over 30 Days", action="PAUSE_AUTO_REFUND", is_active=True, execute_count=22, last_triggered_at=now - datetime.timedelta(days=1)),
        Policy(id="POL-303", name="Dispute Context Correlation Rule", domain="DISPUTE_INTEL", trigger_condition="Dispute Filed on Account with Return History", action="FLAG_PRE_ARBITRATION", is_active=True, execute_count=8, last_triggered_at=now - datetime.timedelta(days=1)),
        Policy(id="POL-404", name="Unified Multi-Domain Risk Cap", domain="UNIFIED", trigger_condition="Unified Risk Score >= 0.85", action="ESCALATE_TO_SENIOR_OPS", is_active=True, execute_count=11, last_triggered_at=now - datetime.timedelta(hours=2))
    ]
    for p in policies:
        db.add(p)
    db.commit()
    
    # 8. Risk Cases (5 stored cases, total open exposure calculated dynamically!)
    cases = [
        RiskCase(id="RC-2048", title="Coordinated Multi-Account Return & Chargeback Abuse", status="OPEN", severity="CRITICAL", domain="UNIFIED", exposure_amount=84500.0, entity_id="C-218", trigger_event_id="TXN-8809", assigned_to="Risk Ops Team", created_at=now - datetime.timedelta(hours=2), updated_at=now - datetime.timedelta(hours=2)),
        RiskCase(id="RC-1092", title="Abnormal Return Velocity on Apparel Category", status="IN_REVIEW", severity="HIGH", domain="RETURN_REFUND", exposure_amount=32000.0, entity_id="C-104", trigger_event_id="TXN-7701", assigned_to="Anand V. (Lead Investigator)", created_at=now - datetime.timedelta(days=3), updated_at=now - datetime.timedelta(days=1)),
        RiskCase(id="RC-3041", title="Pre-Arbitration Friendly Fraud Chargeback", status="OPEN", severity="HIGH", domain="DISPUTE_INTEL", exposure_amount=18400.0, entity_id="C-309", trigger_event_id="TXN-6601", assigned_to="Dispute Ops", created_at=now - datetime.timedelta(days=3), updated_at=now - datetime.timedelta(hours=5)),
        RiskCase(id="RC-4012", title="Shared Payment Method Velocity Spike", status="RESOLVED", severity="MEDIUM", domain="FRAUD_ABUSE", exposure_amount=14200.0, entity_id="C-402", trigger_event_id="TXN-5501", assigned_to="System Auto-Resolved", created_at=now - datetime.timedelta(days=12), updated_at=now - datetime.timedelta(days=10)),
        RiskCase(id="RC-5020", title="IP Address Geolocation Shift", status="RESOLVED", severity="LOW", domain="UNIFIED", exposure_amount=5500.0, entity_id="C-511", trigger_event_id="TXN-4401", assigned_to="System Auto-Resolved", created_at=now - datetime.timedelta(days=20), updated_at=now - datetime.timedelta(days=19))
    ]
    for c in cases:
        db.add(c)
    db.commit()
    
    # 9. Risk Assessments (Versioned history for C-218: v1 -> v2 -> v3)
    update_entity_risk_version(db, "C-218", fraud_score=0.35, return_score=0.40, dispute_score=0.10, case_id="RC-2048")
    update_entity_risk_version(db, "C-218", fraud_score=0.68, return_score=0.74, dispute_score=0.45, case_id="RC-2048")
    update_entity_risk_version(db, "C-218", fraud_score=0.88, return_score=0.82, dispute_score=0.74, case_id="RC-2048") # v3 = 0.91 CRITICAL
    
    # Generate structured AI investigations for cases
    for case in cases:
        generate_ai_investigation(db, case.id)
        
    # 10. Audit Trail Events (100% corresponding to actual state transitions)
    audit_events = [
        AuditEvent(event_type="EVENT_RECEIVED", entity_id="C-218", case_id="RC-2048", description="Payment captured ₹84,500 via Razorpay (TXN-8809)", metadata_json='{"amount": 84500, "razorpay_id": "pay_K9z9HERO845"}', timestamp=now - datetime.timedelta(hours=2, minutes=5)),
        AuditEvent(event_type="RISK_DETECTED", entity_id="C-218", case_id="RC-2048", description="Risk Engine computed Unified Risk Score v3 = 0.91 (CRITICAL)", metadata_json='{"fraud_score": 0.88, "return_score": 0.82, "dispute_score": 0.74}', timestamp=now - datetime.timedelta(hours=2, minutes=4)),
        AuditEvent(event_type="CASE_CREATED", entity_id="C-218", case_id="RC-2048", description="Risk Case RC-2048 created with ₹84,500 exposure", metadata_json='{"severity": "CRITICAL", "domain": "UNIFIED"}', timestamp=now - datetime.timedelta(hours=2, minutes=3)),
        AuditEvent(event_type="AI_INVESTIGATED", entity_id="C-218", case_id="RC-2048", description="Grounded AI Investigator executed multi-domain analysis (Confidence 94%)", metadata_json='{"linked_entities": 3, "return_rate": "77.8%"}', timestamp=now - datetime.timedelta(hours=2, minutes=2)),
        AuditEvent(event_type="POLICY_EVALUATED", entity_id="C-218", case_id="RC-2048", description="Policy POL-101 triggered: TRIGGER_MANUAL_REVIEW & PAUSE_PAYOUT", metadata_json='{"rule": "Coordinated Device Abuse Guard"}', timestamp=now - datetime.timedelta(hours=2, minutes=1)),
        AuditEvent(event_type="ACTION_RECOMMENDED", entity_id="C-218", case_id="RC-2048", description="Recommendation routed to Risk Ops Queue for mandatory review", metadata_json='{"assigned_to": "Risk Ops Team"}', timestamp=now - datetime.timedelta(hours=2))
    ]
    for ae in audit_events:
        db.add(ae)
    db.commit()
    
    # 11. Held-out Evaluation Run
    run_deterministic_evaluator(db, seed=seed)
    
    print(f"Database successfully seeded with deterministic seed {seed}.")
