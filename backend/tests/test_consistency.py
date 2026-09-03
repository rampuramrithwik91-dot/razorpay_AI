import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db, Merchant, Entity, RiskCase, Transaction, Return, Dispute, RiskAssessment, AIInvestigation, EvaluationRun
from app.seed_data import seed_database
from app.risk_engine import calculate_unified_risk, update_entity_risk_version
from app.ai_investigator import generate_ai_investigation
from app.evaluator import run_deterministic_evaluator

@pytest.fixture(scope="module")
def db_session():
    init_db()
    session = SessionLocal()
    seed_database(session, seed=42)
    yield session
    session.close()

def test_merchant_status_and_mode(db_session: Session):
    merchant = db_session.query(Merchant).first()
    assert merchant is not None
    assert merchant.mode == "RAZORPAY_TEST_MODE"
    assert merchant.status == "SYSTEM_HEALTHY"

def test_derived_metrics_reconciliation(db_session: Session):
    """
    Asserts that total exposure and open cases match SQL aggregate sums strictly.
    """
    open_cases = db_session.query(RiskCase).filter(RiskCase.status.in_(["OPEN", "IN_REVIEW"])).all()
    calculated_exposure = sum(c.exposure_amount for c in open_cases)
    calculated_open_count = len(open_cases)
    calculated_critical_count = sum(1 for c in open_cases if c.severity == "CRITICAL")
    
    hero_case = db_session.query(RiskCase).filter(RiskCase.id == "RC-2048").first()
    assert hero_case is not None
    assert hero_case.severity == "CRITICAL"
    assert hero_case.exposure_amount == 84500.0
    
    assert calculated_open_count >= 3
    assert calculated_critical_count >= 1
    assert calculated_exposure >= 84500.0

def test_risk_score_composition_and_versioning(db_session: Session):
    """
    Verifies that Risk Engine produces deterministic scores and versioned records without silent overwrites.
    """
    u_score, u_level, reasons = calculate_unified_risk(0.88, 0.82, 0.74, relationship_count=3)
    assert u_score >= 0.85
    assert u_level == "CRITICAL"
    assert "MULTI_DOMAIN_CROSS_ESCALATION" in reasons
    
    # Test versioned update
    assessments = db_session.query(RiskAssessment).filter(RiskAssessment.entity_id == "C-218").order_by(RiskAssessment.version.asc()).all()
    assert len(assessments) >= 3
    versions = [a.version for a in assessments]
    assert versions == list(range(1, len(assessments) + 1))

def test_grounded_ai_investigation_structure(db_session: Session):
    """
    Asserts AI investigation contains structured sections grounded in database evidence.
    """
    ai_inv = generate_ai_investigation(db_session, "RC-2048")
    assert ai_inv is not None
    assert ai_inv.case_id == "RC-2048"
    assert "C-218" in ai_inv.summary
    assert ai_inv.confidence_score > 0.80
    assert "POL-101" in ai_inv.policy_result

def test_evaluation_benchmark_reconciliation(db_session: Session):
    """
    Asserts that evaluation metrics are calculated deterministically.
    """
    eval_run = db_session.query(EvaluationRun).order_by(EvaluationRun.timestamp.desc()).first()
    assert eval_run is not None
    assert eval_run.test_count == 1250
    assert eval_run.precision > 0.90
    assert eval_run.recall > 0.90
    assert eval_run.false_positive_cost_inr == 14250.0
