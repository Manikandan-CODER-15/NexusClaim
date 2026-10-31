import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.entities import Claim, Evidence
from backend.app.schemas.admin import OverviewResponse
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # Only manager and admin can view analytics (demo rule)
    if current_user.role not in ("manager", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    total_claims = db.query(Claim).count()
    active_investigations = db.query(Claim).filter(Claim.status == "investigating").count()
    pending_reviews = db.query(Claim).filter(Claim.status == "pending_review").count()
    completed = db.query(Claim).filter(Claim.status == "completed").count()

    # Category distribution (demo static data if none)
    categories = (
        db.query(Claim.category, func.count(Claim.id))
        .group_by(Claim.category)
        .all()
    )
    category_data = [{"name": cat or "Other", "value": cnt} for cat, cnt in categories]

    # Investigation trend – last 7 days claim counts (demo static if empty)
    from datetime import datetime, timedelta
    trend = []
    for i in range(7, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        count = (
            db.query(Claim)
            .filter(Claim.created_at >= datetime.combine(day, datetime.min.time()))
            .filter(Claim.created_at < datetime.combine(day + timedelta(days=1), datetime.min.time()))
            .count()
        )
        trend.append({"date": day.isoformat(), "count": count})

    return OverviewResponse(
        total_claims=total_claims,
        active_investigations=active_investigations,
        pending_reviews=pending_reviews,
        completed=completed,
        category_distribution=category_data,
        investigation_trend=trend,
    )

