import datetime
import json
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = "sqlite:///./sentinel_risk.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Merchant(Base):
    __tablename__ = "merchants"
    id = Column(String, primary_key=True, default="mch_razorpay_demo")
    name = Column(String, default="Apex Fashion & Tech Ltd")
    mode = Column(String, default="RAZORPAY_TEST_MODE")  # RAZORPAY_TEST_MODE or SYNTHETIC_DEMO_DATA
    status = Column(String, default="SYSTEM_HEALTHY")    # SYSTEM_HEALTHY, DEGRADED, AI_UNAVAILABLE
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Entity(Base):
    __tablename__ = "entities"
    id = Column(String, primary_key=True)  # e.g., C-218, D-14, CARD-9841
    entity_type = Column(String, nullable=False)  # CUSTOMER, DEVICE, CARD, IP
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    risk_level = Column(String, default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    score = Column(Float, default=0.15)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class EntityRelationship(Base):
    __tablename__ = "entity_relationships"
    id = Column(Integer, primary_key=True, autoincrement=True)
    source_entity_id = Column(String, ForeignKey("entities.id"), nullable=False)
    target_entity_id = Column(String, ForeignKey("entities.id"), nullable=False)
    relationship_type = Column(String, nullable=False)  # SHARED_DEVICE, SHARED_CARD, SAME_IP, SAME_ADDRESS
    confidence = Column(Float, default=0.95)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True)  # e.g. TXN-8801
    customer_id = Column(String, ForeignKey("entities.id"), nullable=False)
    device_id = Column(String, nullable=True)
    card_id = Column(String, nullable=True)
    amount = Column(Float, nullable=False)  # INR
    status = Column(String, default="CAPTURED")  # CAPTURED, PENDING, FLAGGED, REJECTED
    risk_score = Column(Float, default=0.12)
    risk_domain = Column(String, default="FRAUD_ABUSE")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    razorpay_payment_id = Column(String, nullable=True)

class Return(Base):
    __tablename__ = "returns"
    id = Column(String, primary_key=True)  # e.g. RET-401
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=False)
    customer_id = Column(String, ForeignKey("entities.id"), nullable=False)
    refund_amount = Column(Float, nullable=False)
    status = Column(String, default="APPROVED")  # APPROVED, UNDER_REVIEW, REJECTED
    reason = Column(String, default="DEFECTIVE") # WARDROBING_SUSPECTED, DEFECTIVE, SIZE_FIT
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Dispute(Base):
    __tablename__ = "disputes"
    id = Column(String, primary_key=True)  # e.g. DISP-902
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=False)
    customer_id = Column(String, ForeignKey("entities.id"), nullable=False)
    amount = Column(Float, nullable=False)
    dispute_type = Column(String, default="FRIENDLY_FRAUD")  # FRIENDLY_FRAUD, UNAUTHORIZED, NON_DELIVERY
    status = Column(String, default="OPEN")  # OPEN, WON, LOST, UNDER_REVIEW
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(String, ForeignKey("entities.id"), nullable=False)
    case_id = Column(String, nullable=True)
    version = Column(Integer, default=1)  # v1, v2, v3
    fraud_score = Column(Float, default=0.1)
    return_score = Column(Float, default=0.1)
    dispute_score = Column(Float, default=0.1)
    unified_score = Column(Float, default=0.1)
    unified_level = Column(String, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    reason_codes = Column(Text, default="[]")  # JSON string
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class RiskCase(Base):
    __tablename__ = "risk_cases"
    id = Column(String, primary_key=True)  # e.g. RC-2048
    title = Column(String, nullable=False)
    status = Column(String, default="OPEN")  # OPEN, IN_REVIEW, RESOLVED, DISMISSED
    severity = Column(String, default="MEDIUM")  # CRITICAL, HIGH, MEDIUM, LOW
    domain = Column(String, default="UNIFIED")  # UNIFIED, FRAUD_ABUSE, RETURN_REFUND, DISPUTE_INTEL
    exposure_amount = Column(Float, default=0.0)  # INR
    entity_id = Column(String, ForeignKey("entities.id"), nullable=False)
    trigger_event_id = Column(String, nullable=True)
    assigned_to = Column(String, default="Risk Ops Team")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class AIInvestigation(Base):
    __tablename__ = "ai_investigations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String, ForeignKey("risk_cases.id"), nullable=False)
    summary = Column(Text, nullable=False)
    key_evidence = Column(Text, nullable=False)  # JSON list
    risk_factors = Column(Text, nullable=False)  # JSON list
    uncertainties = Column(Text, nullable=False) # JSON list
    recommendation = Column(String, nullable=False)
    confidence_score = Column(Float, default=0.92)
    policy_result = Column(String, default="TRIGGER_MANUAL_REVIEW")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Policy(Base):
    __tablename__ = "policies"
    id = Column(String, primary_key=True)  # POL-101
    name = Column(String, nullable=False)
    domain = Column(String, nullable=False)  # FRAUD_ABUSE, RETURN_REFUND, DISPUTE_INTEL, UNIFIED
    trigger_condition = Column(String, nullable=False)
    action = Column(String, nullable=False)  # BLOCK, FLAG_REVIEW, REQUIRE_2FA, WARN
    is_active = Column(Boolean, default=True)
    execute_count = Column(Integer, default=0)
    last_triggered_at = Column(DateTime, nullable=True)

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String, nullable=False) # EVENT_RECEIVED, RISK_DETECTED, CASE_CREATED, AI_INVESTIGATED, POLICY_EVALUATED, ACTION_RECOMMENDED, HUMAN_REVIEWED, CASE_RESOLVED
    entity_id = Column(String, nullable=True)
    case_id = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    metadata_json = Column(Text, default="{}")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_name = Column(String, default="Razorpay Risk Held-out Benchmark v2.4")
    test_count = Column(Integer, default=1250)
    ground_truth_positives = Column(Integer, default=180)
    precision = Column(Float, default=0.942)
    recall = Column(Float, default=0.916)
    f1_score = Column(Float, default=0.929)
    false_positive_rate = Column(Float, default=0.012)
    false_positive_cost_inr = Column(Float, default=14250.0)  # INR saved/cost
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
