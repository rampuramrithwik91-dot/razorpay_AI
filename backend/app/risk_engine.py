import json
import datetime
from sqlalchemy.orm import Session
from app.database import Entity, RiskAssessment, AuditEvent, RiskCase, Transaction, Return, Dispute, EntityRelationship

def calculate_unified_risk(fraud_score: float, return_score: float, dispute_score: float, relationship_count: int = 0) -> tuple[float, str, list[str]]:
    """
    Deterministic Unified Risk Composition Strategy.
    Formula:
      Base = max(Fraud, Return, Dispute) * 0.55 + average(Fraud, Return, Dispute) * 0.35
      Domain Overlap Bonus = 0.10 if at least 2 domains exceed 0.5
      Network Risk Bonus = 0.05 per linked entity (cap at 0.15)
    Returns: (unified_score, unified_level, reason_codes)
    """
    fraud_score = max(0.0, min(1.0, fraud_score))
    return_score = max(0.0, min(1.0, return_score))
    dispute_score = max(0.0, min(1.0, dispute_score))
    
    max_domain = max(fraud_score, return_score, dispute_score)
    avg_domain = (fraud_score + return_score + dispute_score) / 3.0
    
    base_score = (max_domain * 0.55) + (avg_domain * 0.35)
    
    high_domains = sum(1 for s in [fraud_score, return_score, dispute_score] if s > 0.5)
    domain_overlap_bonus = 0.10 if high_domains >= 2 else 0.0
    
    network_bonus = min(0.15, relationship_count * 0.05)
    
    raw_unified = base_score + domain_overlap_bonus + network_bonus
    unified_score = round(min(0.99, max(0.05, raw_unified)), 2)
    
    if unified_score >= 0.85:
        unified_level = "CRITICAL"
    elif unified_score >= 0.70:
        unified_level = "HIGH"
    elif unified_score >= 0.45:
        unified_level = "MEDIUM"
    else:
        unified_level = "LOW"
        
    reason_codes = []
    if fraud_score > 0.6:
        reason_codes.append(f"FRAUD_HIGH_VELOCITY (Fraud Score: {fraud_score:.2f})")
    if return_score > 0.6:
        reason_codes.append(f"SERIAL_REFUNDER_PATTERN (Return Score: {return_score:.2f})")
    if dispute_score > 0.6:
        reason_codes.append(f"CHARGEBACK_HISTORY (Dispute Score: {dispute_score:.2f})")
    if high_domains >= 2:
        reason_codes.append("MULTI_DOMAIN_CROSS_ESCALATION")
    if relationship_count > 0:
        reason_codes.append(f"CONNECTED_ENTITY_CLUSTER ({relationship_count} linked entities)")
        
    if not reason_codes:
        reason_codes.append("NORMAL_TRANSACTION_PATTERN")
        
    return unified_score, unified_level, reason_codes

def update_entity_risk_version(
    db: Session,
    entity_id: str,
    fraud_score: float,
    return_score: float,
    dispute_score: float,
    case_id: str = None
) -> RiskAssessment:
    """
    Creates a new versioned RiskAssessment record (v1, v2, v3...) instead of overwriting history.
    """
    existing_assessments = db.query(RiskAssessment).filter(RiskAssessment.entity_id == entity_id).order_by(RiskAssessment.version.desc()).all()
    next_version = (existing_assessments[0].version + 1) if existing_assessments else 1
    
    # Calculate connected entities count
    rel_count = db.query(EntityRelationship).filter(
        (EntityRelationship.source_entity_id == entity_id) | (EntityRelationship.target_entity_id == entity_id)
    ).count()
    
    unified_score, unified_level, reason_codes = calculate_unified_risk(
        fraud_score, return_score, dispute_score, relationship_count=rel_count
    )
    
    new_assessment = RiskAssessment(
        entity_id=entity_id,
        case_id=case_id,
        version=next_version,
        fraud_score=fraud_score,
        return_score=return_score,
        dispute_score=dispute_score,
        unified_score=unified_score,
        unified_level=unified_level,
        reason_codes=json.dumps(reason_codes),
        timestamp=datetime.datetime.utcnow()
    )
    db.add(new_assessment)
    
    # Update entity risk level & score
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if entity:
        entity.risk_level = unified_level
        entity.score = unified_score
        
    db.commit()
    db.refresh(new_assessment)
    return new_assessment
