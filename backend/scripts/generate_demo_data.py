"""
NexusClaim -- STEP 2: Generate Synthetic Demo Files
====================================================
Creates PDF documents in storage/demo/ and data files in backend/app/data/.
ALL DATA IS SYNTHETIC DEMO DATA -- fictional names, vehicles, addresses only.

Run from project root:
    backend\\venv\\Scripts\\python.exe -m backend.scripts.generate_demo_data
"""

import os
import sys
import json
import random
import csv
from datetime import datetime, timedelta
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable
)
from reportlab.lib import colors

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent  # d:\...\TCS AI FINAL
STORAGE_DEMO = PROJECT_ROOT / "storage" / "demo"
DATA_DIR = PROJECT_ROOT / "backend" / "app" / "data"

STORAGE_DEMO.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Common constants (SYNTHETIC DEMO DATA)
# ---------------------------------------------------------------------------
DEMO_WATERMARK = "SYNTHETIC DEMO DATA"
POLICY_NUMBER = "MOT-2026-NC-004417"
VEHICLE_NUMBER = "TN-07-AX-3921"
CLAIMANT_NAME = "Arun Vijayan"
CLAIMANT_ADDRESS = "12, Lotus Avenue, Velachery, Chennai - 600042"
INCIDENT_DATE = datetime(2026, 10, 15, 8, 30)
REPORT_DATE = datetime(2026, 10, 16)
GARAGE_NAME = "Rajan Motors Service Centre"
GARAGE_ADDRESS = "45, Industrial Road, Guindy, Chennai - 600032"
CLAIM_NUMBER = "CLM-2026-00001"

# ---------------------------------------------------------------------------
# ReportLab helpers
# ---------------------------------------------------------------------------
styles = getSampleStyleSheet()

STYLE_TITLE = ParagraphStyle(
    "DocTitle", parent=styles["Title"], fontSize=16, spaceAfter=6
)
STYLE_SUBTITLE = ParagraphStyle(
    "DocSubtitle", parent=styles["Heading2"], fontSize=12, spaceAfter=4
)
STYLE_HEADING = ParagraphStyle(
    "SectionHead", parent=styles["Heading3"], fontSize=11,
    spaceBefore=10, spaceAfter=4
)
STYLE_BODY = ParagraphStyle(
    "BodyCustom", parent=styles["BodyText"], fontSize=10,
    leading=14, alignment=TA_JUSTIFY
)
STYLE_SMALL = ParagraphStyle(
    "SmallGrey", parent=styles["BodyText"], fontSize=8,
    textColor=colors.grey, alignment=TA_CENTER
)
STYLE_CLAUSE = ParagraphStyle(
    "Clause", parent=styles["BodyText"], fontSize=10,
    leading=14, leftIndent=20, alignment=TA_JUSTIFY
)


def _header(title, subtitle=None):
    """Return flowable elements for a document header."""
    elems = [
        Paragraph(DEMO_WATERMARK, STYLE_SMALL),
        Spacer(1, 4 * mm),
        Paragraph(title, STYLE_TITLE),
    ]
    if subtitle:
        elems.append(Paragraph(subtitle, STYLE_SUBTITLE))
    elems.append(HRFlowable(width="100%", thickness=1, color=colors.black))
    elems.append(Spacer(1, 4 * mm))
    return elems


def _footer():
    return [
        Spacer(1, 8 * mm),
        HRFlowable(width="100%", thickness=0.5, color=colors.grey),
        Paragraph(
            f"{DEMO_WATERMARK} | Generated {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            STYLE_SMALL,
        ),
    ]


# ===================================================================
# 1. motor_policy.pdf
# ===================================================================
def create_motor_policy():
    path = str(STORAGE_DEMO / "motor_policy.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4,
                            topMargin=20 * mm, bottomMargin=20 * mm)
    story = _header(
        "Comprehensive Motor Vehicle Insurance Policy",
        f"Policy No: {POLICY_NUMBER}"
    )

    story.append(Paragraph(
        f"<b>Policyholder:</b> {CLAIMANT_NAME}<br/>"
        f"<b>Address:</b> {CLAIMANT_ADDRESS}<br/>"
        f"<b>Vehicle Registration:</b> {VEHICLE_NUMBER}<br/>"
        f"<b>Policy Period:</b> 01-Jan-2026 to 31-Dec-2026",
        STYLE_BODY
    ))
    story.append(Spacer(1, 6 * mm))

    clauses = [
        ("1.1", "Coverage",
         "This policy covers accidental damage to the insured vehicle, "
         "third-party liability, personal accident cover for the owner-driver, "
         "and damage caused by fire, theft, natural calamity, or riot. "
         "Coverage extends to the vehicle body, engine, electrical and "
         "mechanical parts, and factory-fitted accessories."),
        ("2.1", "Exclusion -- Consequential Loss",
         "Any consequential loss, depreciation, wear and tear, mechanical "
         "or electrical breakdown, failures, or breakages shall not be "
         "covered under this policy."),
        ("2.2", "Exclusion -- Intoxication",
         "Loss or damage arising while the vehicle is driven by a person "
         "under the influence of intoxicating liquor or drugs is excluded."),
        ("2.3", "Exclusion -- Invalid Licence",
         "Loss or damage arising while the vehicle is driven by a person "
         "who does not hold a valid and effective driving licence is excluded."),
        ("2.4", "Exclusion -- Non-Disclosed Modifications",
         "Damage to any non-factory-fitted accessory, modification, or "
         "alteration that was not disclosed to the insurer at the time of "
         "policy inception is excluded."),
        ("3.1", "Deductible",
         "A mandatory deductible of Rs 5,000 (Rupees Five Thousand only) "
         "shall be borne by the policyholder for each and every claim."),
        ("3.2", "Coverage Limit",
         "The maximum liability of the insurer under this policy shall not "
         "exceed Rs 3,00,000 (Rupees Three Lakh only) per claim, inclusive "
         "of all repair costs, parts, and labour charges."),
        ("4.1", "Notification Period",
         "The policyholder must notify the insurer of any incident giving "
         "rise to a claim within 7 (seven) calendar days of the date of "
         "incident. Failure to notify within this period may result in "
         "denial or reduction of the claim."),
    ]

    for num, title, text in clauses:
        story.append(Paragraph(f"<b>Clause {num} -- {title}</b>", STYLE_HEADING))
        story.append(Paragraph(text, STYLE_CLAUSE))

    story.extend(_footer())
    doc.build(story)
    return path


# ===================================================================
# 2. claimant_statement.pdf
# ===================================================================
def create_claimant_statement():
    path = str(STORAGE_DEMO / "claimant_statement.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4,
                            topMargin=20 * mm, bottomMargin=20 * mm)
    story = _header("Claimant Statement", f"Claim Ref: {CLAIM_NUMBER}")

    story.append(Paragraph(
        f"<b>Name:</b> {CLAIMANT_NAME}<br/>"
        f"<b>Policy No:</b> {POLICY_NUMBER}<br/>"
        f"<b>Vehicle:</b> {VEHICLE_NUMBER}<br/>"
        f"<b>Date of Incident:</b> {INCIDENT_DATE.strftime('%d-%b-%Y, %I:%M %p')}<br/>"
        f"<b>Date of Statement:</b> {REPORT_DATE.strftime('%d-%b-%Y')}",
        STYLE_BODY
    ))
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph("<b>Statement of Events:</b>", STYLE_HEADING))
    story.append(Paragraph(
        f"On the morning of {INCIDENT_DATE.strftime('%d %B %Y')}, at approximately "
        f"{INCIDENT_DATE.strftime('%I:%M %p')}, I was driving my vehicle "
        f"({VEHICLE_NUMBER}) along Anna Salai towards Guindy. At the traffic "
        "signal near Saidapet junction, my vehicle was stopped behind other "
        "vehicles waiting for the green light.",
        STYLE_BODY
    ))
    story.append(Spacer(1, 3 * mm))
    # KEY CONTRADICTION: Statement says REAR-ENDED but photos/estimate show FRONT damage
    story.append(Paragraph(
        "While stationary, another vehicle travelling at considerable speed "
        "<b>REAR-ENDED</b> my car from behind. The impact was severe and I "
        "felt a strong jolt. I immediately stepped out and noticed damage "
        "to the <b>rear portion</b> of my vehicle. The other driver apologised "
        "and we exchanged details. I reported the incident to the nearest "
        "traffic police station the same day.",
        STYLE_BODY
    ))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        "I am submitting this claim for the repair of damage caused to my "
        "vehicle as a result of this rear-end collision. I request the "
        "insurance company to process my claim at the earliest.",
        STYLE_BODY
    ))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        f"Signed: {CLAIMANT_NAME}<br/>"
        f"Date: {REPORT_DATE.strftime('%d-%b-%Y')}",
        STYLE_BODY
    ))

    story.extend(_footer())
    doc.build(story)
    return path


# ===================================================================
# 3. repair_estimate.pdf  (FRONT damage -- contradicts statement)
# ===================================================================
def create_repair_estimate():
    path = str(STORAGE_DEMO / "repair_estimate.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4,
                            topMargin=20 * mm, bottomMargin=20 * mm)
    story = _header("Repair Estimate", f"Vehicle: {VEHICLE_NUMBER}")

    story.append(Paragraph(
        f"<b>Garage:</b> {GARAGE_NAME}<br/>"
        f"<b>Address:</b> {GARAGE_ADDRESS}<br/>"
        f"<b>Estimate Date:</b> {(INCIDENT_DATE + timedelta(days=2)).strftime('%d-%b-%Y')}<br/>"
        f"<b>Customer:</b> {CLAIMANT_NAME}<br/>"
        f"<b>Vehicle Reg:</b> {VEHICLE_NUMBER}",
        STYLE_BODY
    ))
    story.append(Spacer(1, 6 * mm))

    # KEY: Items are for FRONT damage -- contradicts rear-end statement
    data = [
        ["S.No", "Description", "Type", "Amount (Rs)"],
        ["1", "Front bumper -- replacement", "Part + Labour", "18,500"],
        ["2", "Front headlight assembly (RHS) -- replacement", "Part + Labour", "12,800"],
        ["3", "Bonnet panel -- dent repair and repaint", "Labour + Paint", "9,200"],
        ["4", "Radiator grille -- replacement", "Part", "4,500"],
        ["5", "Front fender (RHS) -- minor dent repair", "Labour", "3,500"],
        ["6", "Wheel alignment and balancing", "Service", "1,800"],
        ["7", "Painting -- front section (primer + topcoat)", "Paint", "6,500"],
        ["", "", "", ""],
        ["", "", "Sub-Total", "56,800"],
        ["", "", "GST (18%)", "10,224"],
        ["", "", "TOTAL", "67,024"],
    ]

    table = Table(data, colWidths=[40, 230, 120, 90])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (3, 0), (3, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -4), 0.5, colors.grey),
        ("LINEABOVE", (2, -3), (3, -3), 1, colors.black),
        ("LINEABOVE", (2, -1), (3, -1), 1.5, colors.black),
        ("FONTNAME", (2, -3), (3, -1), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(table)
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        f"Authorised by: K. Rajan, Service Manager, {GARAGE_NAME}",
        STYLE_BODY
    ))

    story.extend(_footer())
    doc.build(story)
    return path


# ===================================================================
# 4. police_report.pdf
# ===================================================================
def create_police_report():
    path = str(STORAGE_DEMO / "police_report.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4,
                            topMargin=20 * mm, bottomMargin=20 * mm)
    story = _header("Traffic Incident Report", "Saidapet Traffic Police Station")

    story.append(Paragraph(
        f"<b>FIR No:</b> TP/SAI/2026/1087<br/>"
        f"<b>Date of Report:</b> {INCIDENT_DATE.strftime('%d-%b-%Y')}<br/>"
        f"<b>Time of Incident:</b> Approx. {INCIDENT_DATE.strftime('%I:%M %p')}<br/>"
        f"<b>Location:</b> Anna Salai, near Saidapet Junction, Chennai<br/>"
        f"<b>Reporting Officer:</b> SI Venkatesh R.",
        STYLE_BODY
    ))
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph("<b>Vehicles Involved:</b>", STYLE_HEADING))
    story.append(Paragraph(
        f"1. Vehicle A: {VEHICLE_NUMBER} (Sedan, Silver) -- "
        f"Owner/Driver: {CLAIMANT_NAME}<br/>"
        "2. Vehicle B: TN-09-BZ-5543 (SUV, White) -- "
        "Driver: Karthik Sundar, 28, of 7 Park Street, T. Nagar, Chennai",
        STYLE_BODY
    ))
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("<b>Description of Incident:</b>", STYLE_HEADING))
    story.append(Paragraph(
        "Vehicle A was stationary at the Saidapet traffic signal (red phase). "
        "Vehicle B approached from behind at an estimated speed and collided "
        "with Vehicle A. The driver of Vehicle B stated that brakes were "
        "applied but the vehicle skidded on the wet road surface. "
        "No injuries reported. Both drivers were cooperative at the scene. "
        "Breathalyser tests were not administered as no signs of intoxication "
        "were observed.",
        STYLE_BODY
    ))
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("<b>Damage Observed:</b>", STYLE_HEADING))
    story.append(Paragraph(
        "Vehicle A: Visible damage to rear bumper area and boot lid. "
        "Vehicle B: Minor scratches on front bumper. "
        "No damage to public property.",
        STYLE_BODY
    ))
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph(
        "Case referred for insurance processing. No criminal charges filed.",
        STYLE_BODY
    ))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        "SI Venkatesh R.<br/>Saidapet Traffic Police Station, Chennai",
        STYLE_BODY
    ))

    story.extend(_footer())
    doc.build(story)
    return path


# ===================================================================
# 5. corrected_statement.pdf (for adaptive re-evaluation / injection)
# ===================================================================
def create_corrected_statement():
    path = str(STORAGE_DEMO / "corrected_statement.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4,
                            topMargin=20 * mm, bottomMargin=20 * mm)
    story = _header("Revised Claimant Statement", f"Claim Ref: {CLAIM_NUMBER}")

    story.append(Paragraph(
        f"<b>Name:</b> {CLAIMANT_NAME}<br/>"
        f"<b>Policy No:</b> {POLICY_NUMBER}<br/>"
        f"<b>Date:</b> {(REPORT_DATE + timedelta(days=5)).strftime('%d-%b-%Y')}<br/>"
        "<b>Reason for Revision:</b> Clarification of damage details after "
        "further inspection.",
        STYLE_BODY
    ))
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph("<b>Revised Statement:</b>", STYLE_HEADING))
    story.append(Paragraph(
        "Upon further reflection and re-inspection at the service centre, "
        "I wish to clarify my earlier statement. While the initial impact "
        "was indeed from the rear, the collision also caused my vehicle to "
        "lurch forward into the vehicle ahead, resulting in <b>additional "
        "damage to the front portion</b> of my car. I apologise for the "
        "incomplete description in my original statement.",
        STYLE_BODY
    ))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        "The damage therefore includes both rear and front sections of the "
        "vehicle. I also noticed <b>damage on the rear-right side panel</b> "
        "which was not immediately apparent.",
        STYLE_BODY
    ))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        f"Signed: {CLAIMANT_NAME}<br/>"
        f"Date: {(REPORT_DATE + timedelta(days=5)).strftime('%d-%b-%Y')}",
        STYLE_BODY
    ))

    story.extend(_footer())
    doc.build(story)
    return path


# ===================================================================
# 6. repair_estimate_2.pdf (adds rear-side items for injection)
# ===================================================================
def create_repair_estimate_2():
    path = str(STORAGE_DEMO / "repair_estimate_2.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4,
                            topMargin=20 * mm, bottomMargin=20 * mm)
    story = _header("Supplementary Repair Estimate", f"Vehicle: {VEHICLE_NUMBER}")

    story.append(Paragraph(
        f"<b>Garage:</b> {GARAGE_NAME}<br/>"
        f"<b>Estimate Date:</b> {(INCIDENT_DATE + timedelta(days=7)).strftime('%d-%b-%Y')}<br/>"
        f"<b>Customer:</b> {CLAIMANT_NAME}<br/>"
        f"<b>Ref:</b> Supplementary to original estimate dated "
        f"{(INCIDENT_DATE + timedelta(days=2)).strftime('%d-%b-%Y')}",
        STYLE_BODY
    ))
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph(
        "Additional damage discovered during disassembly -- rear and side items:",
        STYLE_BODY
    ))
    story.append(Spacer(1, 3 * mm))

    data = [
        ["S.No", "Description", "Type", "Amount (Rs)"],
        ["1", "Rear bumper -- removal, repair and repaint", "Labour + Paint", "14,200"],
        ["2", "Rear-right side panel -- dent pulling and repaint", "Labour + Paint", "11,500"],
        ["3", "Tail-light assembly (RHS) -- replacement", "Part + Labour", "8,900"],
        ["4", "Boot lid -- realignment", "Labour", "3,000"],
        ["5", "Rear parking sensor recalibration", "Service", "2,200"],
        ["", "", "", ""],
        ["", "", "Sub-Total", "39,800"],
        ["", "", "GST (18%)", "7,164"],
        ["", "", "TOTAL", "46,964"],
    ]

    table = Table(data, colWidths=[40, 230, 120, 90])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (3, 0), (3, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -4), 0.5, colors.grey),
        ("LINEABOVE", (2, -3), (3, -3), 1, colors.black),
        ("LINEABOVE", (2, -1), (3, -1), 1.5, colors.black),
        ("FONTNAME", (2, -3), (3, -1), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(table)
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        "<b>Combined Total (Original + Supplementary):</b> Rs 67,024 + Rs 46,964 = "
        "<b>Rs 1,13,988</b>",
        STYLE_BODY
    ))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        f"Authorised by: K. Rajan, Service Manager, {GARAGE_NAME}",
        STYLE_BODY
    ))

    story.extend(_footer())
    doc.build(story)
    return path


# ===================================================================
# 7. historical_claims.csv (300 rows, ~5% anomalous)
# ===================================================================
def create_historical_claims_csv():
    path = str(DATA_DIR / "historical_claims.csv")
    random.seed(42)  # reproducible

    categories = ["Motor", "Health", "Home", "Travel"]
    cat_weights = [0.55, 0.25, 0.12, 0.08]
    rows = []

    base_date = datetime(2025, 1, 1)

    for i in range(300):
        claim_id = f"HIST-{i+1:04d}"
        cat = random.choices(categories, weights=cat_weights, k=1)[0]

        # Random incident date spread over 18 months
        incident_date = base_date + timedelta(days=random.randint(0, 540))

        # Normal: 0-7 days to report;  Anomalous (~5%): 30-120 days
        is_anomalous = random.random() < 0.05
        if is_anomalous:
            days_to_report = random.randint(30, 120)
        else:
            days_to_report = random.randint(0, 7)

        report_date = incident_date + timedelta(days=days_to_report)

        # Estimate amounts
        if cat == "Motor":
            base_amt = random.gauss(55000, 20000)
        elif cat == "Health":
            base_amt = random.gauss(120000, 50000)
        elif cat == "Home":
            base_amt = random.gauss(80000, 30000)
        else:  # Travel
            base_amt = random.gauss(25000, 10000)

        # ~5% extreme estimates (3x-5x normal)
        if random.random() < 0.05:
            base_amt *= random.uniform(3.0, 5.0)

        estimate_amount = max(round(base_amt, 2), 1000.0)

        policy_age_days = random.randint(30, 1800)
        prior_claims_count = random.choices(
            [0, 1, 2, 3, 4, 5],
            weights=[0.40, 0.30, 0.15, 0.08, 0.05, 0.02],
            k=1
        )[0]

        rows.append({
            "claim_id": claim_id,
            "incident_date": incident_date.strftime("%Y-%m-%d"),
            "report_date": report_date.strftime("%Y-%m-%d"),
            "days_to_report": days_to_report,
            "estimate_amount": estimate_amount,
            "policy_age_days": policy_age_days,
            "claim_category": cat,
            "prior_claims_count": prior_claims_count,
        })

    # Inject ONE specific anomaly for the Anomaly Agent to find:
    # a Motor claim with 45-day reporting gap and very high estimate
    rows[42] = {
        "claim_id": "HIST-0043",
        "incident_date": "2025-06-10",
        "report_date": "2025-07-25",
        "days_to_report": 45,
        "estimate_amount": 278500.00,
        "policy_age_days": 62,
        "claim_category": "Motor",
        "prior_claims_count": 3,
    }

    fieldnames = [
        "claim_id", "incident_date", "report_date", "days_to_report",
        "estimate_amount", "policy_age_days", "claim_category",
        "prior_claims_count"
    ]

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # Count anomalies for reporting
    late = sum(1 for r in rows if r["days_to_report"] > 14)
    extreme = sum(1 for r in rows if r["estimate_amount"] > 200000)

    return path, len(rows), late, extreme


# ===================================================================
# 8. policy_clauses.json (matches motor_policy.pdf)
# ===================================================================
def create_policy_clauses_json():
    path = str(DATA_DIR / "policy_clauses.json")

    clauses = [
        {
            "clause_id": "1.1",
            "section": "Coverage",
            "title": "Coverage",
            "text": (
                "This policy covers accidental damage to the insured vehicle, "
                "third-party liability, personal accident cover for the owner-driver, "
                "and damage caused by fire, theft, natural calamity, or riot. "
                "Coverage extends to the vehicle body, engine, electrical and "
                "mechanical parts, and factory-fitted accessories."
            )
        },
        {
            "clause_id": "2.1",
            "section": "Exclusions",
            "title": "Exclusion -- Consequential Loss",
            "text": (
                "Any consequential loss, depreciation, wear and tear, mechanical "
                "or electrical breakdown, failures, or breakages shall not be "
                "covered under this policy."
            )
        },
        {
            "clause_id": "2.2",
            "section": "Exclusions",
            "title": "Exclusion -- Intoxication",
            "text": (
                "Loss or damage arising while the vehicle is driven by a person "
                "under the influence of intoxicating liquor or drugs is excluded."
            )
        },
        {
            "clause_id": "2.3",
            "section": "Exclusions",
            "title": "Exclusion -- Invalid Licence",
            "text": (
                "Loss or damage arising while the vehicle is driven by a person "
                "who does not hold a valid and effective driving licence is excluded."
            )
        },
        {
            "clause_id": "2.4",
            "section": "Exclusions",
            "title": "Exclusion -- Non-Disclosed Modifications",
            "text": (
                "Damage to any non-factory-fitted accessory, modification, or "
                "alteration that was not disclosed to the insurer at the time of "
                "policy inception is excluded."
            )
        },
        {
            "clause_id": "3.1",
            "section": "Financial Terms",
            "title": "Deductible",
            "text": (
                "A mandatory deductible of Rs 5,000 (Rupees Five Thousand only) "
                "shall be borne by the policyholder for each and every claim."
            )
        },
        {
            "clause_id": "3.2",
            "section": "Financial Terms",
            "title": "Coverage Limit",
            "text": (
                "The maximum liability of the insurer under this policy shall not "
                "exceed Rs 3,00,000 (Rupees Three Lakh only) per claim, inclusive "
                "of all repair costs, parts, and labour charges."
            )
        },
        {
            "clause_id": "4.1",
            "section": "Claims Procedure",
            "title": "Notification Period",
            "text": (
                "The policyholder must notify the insurer of any incident giving "
                "rise to a claim within 7 (seven) calendar days of the date of "
                "incident. Failure to notify within this period may result in "
                "denial or reduction of the claim."
            )
        },
    ]

    with open(path, "w", encoding="utf-8") as f:
        json.dump(clauses, f, indent=2, ensure_ascii=False)

    return path, len(clauses)


# ===================================================================
# Main
# ===================================================================
def main():
    print("=" * 60)
    print("  NexusClaim -- STEP 2: Generate Synthetic Demo Files")
    print("  ALL DATA IS SYNTHETIC DEMO DATA")
    print("=" * 60)
    print()

    results = []

    print("[1/6] Creating motor_policy.pdf ...")
    p = create_motor_policy()
    results.append(("storage/demo/motor_policy.pdf", p))
    print(f"      -> {p}")

    print("[2/6] Creating claimant_statement.pdf ...")
    p = create_claimant_statement()
    results.append(("storage/demo/claimant_statement.pdf", p))
    print(f"      -> {p}")

    print("[3/6] Creating repair_estimate.pdf ...")
    p = create_repair_estimate()
    results.append(("storage/demo/repair_estimate.pdf", p))
    print(f"      -> {p}")

    print("[4/6] Creating police_report.pdf ...")
    p = create_police_report()
    results.append(("storage/demo/police_report.pdf", p))
    print(f"      -> {p}")

    print("[5/6] Creating corrected_statement.pdf ...")
    p = create_corrected_statement()
    results.append(("storage/demo/corrected_statement.pdf", p))
    print(f"      -> {p}")

    print("[6/6] Creating repair_estimate_2.pdf ...")
    p = create_repair_estimate_2()
    results.append(("storage/demo/repair_estimate_2.pdf", p))
    print(f"      -> {p}")

    print()
    print("[7/8] Creating historical_claims.csv ...")
    p, n_rows, n_late, n_extreme = create_historical_claims_csv()
    results.append(("backend/app/data/historical_claims.csv", p))
    print(f"      -> {p}")
    print(f"      -> {n_rows} rows, {n_late} late-reporters, {n_extreme} extreme estimates")

    print()
    print("[8/8] Creating policy_clauses.json ...")
    p, n_clauses = create_policy_clauses_json()
    results.append(("backend/app/data/policy_clauses.json", p))
    print(f"      -> {p}")
    print(f"      -> {n_clauses} clauses")

    print()
    print("=" * 60)
    print("  CHECKLIST -- Files Created")
    print("=" * 60)
    for label, filepath in results:
        size = os.path.getsize(filepath)
        print(f"  [OK] {label:<45} ({size:,} bytes)")

    print()
    print("  PHOTOS (you must add these manually):")
    print(f"  [ ] storage/demo/01_front_damage.jpg")
    print(f"  [ ] storage/demo/02_rear_side_damage.jpg")
    print(f"  [ ] storage/demo/03_front_damage_duplicate.jpg")
    print(f"  [ ] storage/demo/04_spare.jpg")
    print()
    print("  NOTE: 01 and 03 should be the SAME image (duplicate detection test).")
    print("        02 shows rear-side damage (matches corrected statement).")
    print("        04 is an unrelated spare photo for testing extra uploads.")
    print()
    print("=" * 60)
    print("  STEP 2 COMPLETE -- Synthetic files generated.")
    print("=" * 60)


if __name__ == "__main__":
    main()

