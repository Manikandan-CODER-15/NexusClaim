# NexusClaim – Autonomous Multimodal Insurance Claims Intelligence Platform

NexusClaim is an enterprise-grade autonomous claims intelligence platform featuring a 6-agent LangGraph orchestration pipeline, multimodal evidence verification, interactive evidence graphs, adaptive investigation re-evaluation, human-in-the-loop review, and automated PDF intelligence report generation.

---

## 1. Architecture Overview

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, React Flow (@xyflow/react), Framer Motion, react-i18next (English, Tamil தமிழ், Hindi हिन्दी).
- **Backend**: Python 3.12+, FastAPI, SQLAlchemy, SQLite (WAL mode + FK enforcement), Pydantic v2, Python-Jose (JWT), BCrypt.
- **AI & Analytics**: Google Gemini (Multimodal Vision & Document Intelligence), LangGraph Orchestrator (6 logical agents), OpenCV, Scikit-Learn (IsolationForest anomaly detection), ReportLab.
- **Storage**: Real evidence binaries in `storage/evidence`, generated reports in `storage/reports`.

---

## 2. Demo User Accounts (Seeded)

| Role | Role Name (EN / TA / HI) | Email | Password |
|---|---|---|---|
| **Admin** | Admin / நிர்வாகி / एडमिन | `admin@nexusclaim.demo` | `Admin@123` |
| **End User** | End User / இறுதிப் பயனர் / अंतिम उपयोगकर्ता | `enduser@nexusclaim.demo` | `User@123` |
| **Investigator** | Investigator / புலனாய்வாளர் / जाँचकर्ता | `investigator@nexusclaim.demo` | `Invest@123` |
| **Manager** | Manager / மேலாளர் / प्रबंधक | `manager@nexusclaim.demo` | `Manager@123` |
| **Fraud & Risk** | Fraud & Risk Analyst / மோசடி மற்றும் இடர் ஆய்வாளர் / धोखाधड़ी और जोखिम विश्लेषक | `risk@nexusclaim.demo` | `Risk@123` |

### Extra Accounts for Ownership & Assignment Isolation
- `user2@nexusclaim.demo` / `User2@123` (End User 2 – Claimant)
- `user3@nexusclaim.demo` / `User3@123` (End User 3 – Claimant)
- `investigator2@nexusclaim.demo` / `Invest2@123` (Investigator 2 – Detective)

---

## 3. Quickstart & Verification (Phase 1)

### Terminal 1: Backend API
```powershell
# Navigate to project root
cd "d:\Downloads\TCS AI FINAL"

# Activate Python Virtual Environment
.\backend\venv\Scripts\Activate.ps1

# Run the FastAPI server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation & Interactive Swagger UI:
- Open browser: **`http://127.0.0.1:8000/docs`**
- Health status check: **`http://127.0.0.1:8000/health`**

### Running Automated Permission & Isolation Tests
```powershell
cd "d:\Downloads\TCS AI FINAL"
.\backend\venv\Scripts\python -m pytest backend/tests/test_permissions.py -v
```

Tests verify:
1. End User cannot read another user's claim (`403 Forbidden`)
2. End User cannot access internal AI findings or reasoning graph (`403 Forbidden`)
3. Fraud & Risk Analyst cannot record final decisions (`403 Forbidden`)
4. Manager can record final decisions (`200 OK`)
5. Only Admin can access user management endpoints (`403 Forbidden` for other roles)

---

## 4. Project Structure

```
TCS AI FINAL/
├── backend/
│   ├── app/
│   │   ├── api/             # API routers (auth, claims, reasoning, review, admin, health)
│   │   ├── agents/          # LangGraph agents
│   │   ├── orchestration/   # Investigation graph engine
│   │   ├── models/          # SQLAlchemy SQLite entity models
│   │   ├── schemas/         # Pydantic v2 schemas
│   │   ├── services/        # Business logic services
│   │   ├── database/        # Session and seed scripts
│   │   ├── storage/         # File management
│   │   └── utils/           # Security, JWT, hashing
│   ├── tests/               # Pytest automated test suite
│   ├── requirements.txt     # Python backend dependencies
│   ├── .env.example         # Environment template
│   └── .env                 # Local configuration
├── frontend/                # Vite + React 19 + TypeScript + Tailwind CSS
├── storage/                 # Local evidence & PDF report storage
├── docs/                    # Architecture diagrams & specifications
└── README.md                # Documentation
```

