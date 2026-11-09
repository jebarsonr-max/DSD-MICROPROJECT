# AeroSort AI
## Smart Airport Luggage Sorting and Weight Analyzer System
> **Intelligent Baggage. Accurate Weighing. Automated Sorting.**

A full-stack Digital System Design (DSD) college micro project demonstrating how digital logic, weight comparison, baggage identification, and automated decision-making are applied to modern airport baggage logistics.

---

## 1. System Architecture & Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript & Vite
- **Styling:** Tailwind CSS with Clean Minimal Aviation Theme
- **Data Visualization:** Recharts (Baggage volume timeline, destination distribution bar charts, safety load donut charts)
- **Icons:** Lucide React (Industrial iconography, zero emojis)
- **API Client:** Type-safe fetch client (`src/services/api.ts` & `src/hooks/useAeroSortApi.ts`)

### Backend
- **Framework:** Python FastAPI (Modular REST architecture)
- **Database:** SQLite with SQLAlchemy ORM
- **Validation:** Pydantic v2 schemas
- **Logic Engine:** Discrete Boolean logic implementation (AND, OR, NOT, Digital Comparator)
- **CORS:** Enabled for local cross-origin frontend communication

---

## 2. Project Directory Structure

```text
AeroSort-AI/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # Badge, Card, Modal, StatCard
│   │   │   └── layout/        # Header, Sidebar, MainLayout
│   │   ├── context/           # AppContext (synchronized with SQLite REST API)
│   │   ├── data/              # Demo dataset fallback
│   │   ├── hooks/             # Custom React API hooks (useAeroSortApi)
│   │   ├── pages/             # 10 dedicated operational pages
│   │   ├── services/          # api.ts (REST client) & sortingEngine.ts
│   │   └── types/             # TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── index.html
├── backend/
│   ├── app/
│   │   ├── models/            # SQLAlchemy ORM models (Baggage, Flight, SortingRecord, Notification, Settings)
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── routes/            # 9 Modular API routers
│   │   │   ├── baggage.py     # Check-in CRUD & unique ID validator
│   │   │   ├── weight.py      # Load-cell comparator & sensor simulation
│   │   │   ├── sorting.py     # Automated Boolean sorting engine
│   │   │   ├── logic.py       # DSD Boolean logic gate simulator
│   │   │   ├── flights.py     # Flight manifest & gate allocation
│   │   │   ├── conveyor.py    # 8-stage conveyor lifecycle & tracking
│   │   │   ├── reports.py     # Analytics aggregation & CSV download
│   │   │   ├── notifications.py # Real-time alerts log
│   │   │   └── settings.py    # System thresholds & SQLite demo reset
│   │   ├── services/          # Decoupled business logic services
│   │   │   ├── logic_service.py
│   │   │   ├── sorting_service.py
│   │   │   └── conveyor_service.py
│   │   ├── database.py        # SQLite engine & session management
│   │   └── main.py            # FastAPI entry point, CORS & startup seeder
│   ├── aerosort.db            # SQLite database file
│   └── requirements.txt       # Python dependencies
└── README.md
```

---

## 3. Setup & Running Instructions

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)

### A. Start the Backend API (FastAPI)

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the FastAPI server on port 8000
python -m uvicorn backend.app.main:app --reload --port 8000
```

The backend interactive API documentation (Swagger UI) is available at:
`http://localhost:8000/docs`

### B. Start the Frontend Application (React + Vite)

In a separate terminal:

```bash
# 1. Install frontend packages
npm install

# 2. Start the development server
npm run dev
```

The frontend application will open at:
`http://localhost:5173/` (or `http://localhost:5174/`)

---

## 4. SQLite Database Schema

The backend uses SQLite (`backend/aerosort.db`) with 5 relational tables:

1. **`baggage`**
   - `id` (Primary Key, e.g. `BAG-1011`)
   - `passenger_name`, `passenger_id`, `flight_number`, `destination`, `airline`
   - `weight` (Float, measured in kilograms)
   - `registration_time`, `status`, `weight_status` (`ACCEPTED`, `NEAR_LIMIT`, `OVERWEIGHT`)
   - `assigned_lane`, `processing_stage`, `rejection_reason`, `is_demo`

2. **`flights`**
   - `id`, `flight_number` (Unique, e.g. `AI 101`), `airline`, `destination`
   - `departure_time`, `gate_number`, `assigned_lane`, `status` (`Scheduled`, `Boarding`, `Departed`, `Delayed`, `Cancelled`)

3. **`sorting_records`**
   - `id`, `timestamp`, `baggage_id`, `passenger_name`, `flight_number`, `destination`, `weight`
   - `decision` (`ACCEPTED`, `DIVERTED_OVERWEIGHT`, `DIVERTED_INVALID`), `assigned_lane`, `reason`
   - `logic_i`, `logic_w`, `logic_f` (Boolean input flags)
   - `logic_sort` (`SORT = I · W · F`), `logic_alert` (`ALERT = I' + W' + F'`)

4. **`notifications`**
   - `id`, `title`, `description`, `timestamp`, `severity` (`high`, `warning`, `info`, `success`), `read`, `category`

5. **`system_settings`**
   - `airport_name`, `airport_code` (`MAA`), `terminal_name`
   - `max_baggage_weight` (Default: `15.0 kg`), `near_limit_threshold` (`14.0 kg`)
   - `conveyor_speed_multiplier`, `sound_alerts_enabled`, `auto_process_queue`
   - `lanes_config_json` (Destination chutes mapping)

---

## 5. REST API Endpoints Summary

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Baggage** | `GET` | `/api/baggage` | List all registered baggage with search & filters |
| **Baggage** | `POST` | `/api/baggage` | Register baggage with unique ID & positive weight check |
| **Baggage** | `PUT` | `/api/baggage/{id}` | Update baggage details or measured scale weight |
| **Baggage** | `DELETE` | `/api/baggage/{id}` | Remove baggage record |
| **Baggage** | `GET` | `/api/baggage/check-id/{id}` | Check if baggage ID is unique |
| **Weight** | `POST` | `/api/weight/analyze` | Calculate allowance, excess, status, and comparator signal |
| **Weight** | `POST` | `/api/weight/simulate-sensor` | Emulate piezoelectric strain-gauge load-cell |
| **Weight** | `PUT` | `/api/weight/apply/{id}` | Write scale measurement to passenger record |
| **Sorting** | `POST` | `/api/sorting/evaluate/{id}` | Run rule-based Boolean sorting and assign chute |
| **Sorting** | `POST` | `/api/sorting/batch` | Sequentially evaluate all queued bags |
| **Sorting** | `GET` | `/api/sorting/history` | Audit log of all sorting decisions |
| **Sorting** | `GET` | `/api/sorting/lanes` | Live baggage counts for Lanes 01–06 |
| **Digital Logic** | `POST` | `/api/logic/simulate` | Evaluate 3-input AND gate & OR fault detector |
| **Digital Logic** | `POST` | `/api/logic/comparator` | Compare A (Measured) vs B (Limit) |
| **Digital Logic** | `GET` | `/api/logic/truth-table` | Complete 8-row combinatorial truth table |
| **Flights** | `GET` | `/api/flights` | Retrieve scheduled flights |
| **Flights** | `POST` | `/api/flights` | Add new flight and gate assignment |
| **Flights** | `PUT` | `/api/flights/{id}` | Update flight departure, gate, or status |
| **Flights** | `DELETE` | `/api/flights/{id}` | Delete flight from manifest |
| **Conveyor** | `GET` | `/api/conveyor/status` | Current belt telemetry & active bag state |
| **Conveyor** | `POST` | `/api/conveyor/start` | Load baggage and initiate belt traversal |
| **Conveyor** | `POST` | `/api/conveyor/pause` | Pause belt motion |
| **Conveyor** | `POST` | `/api/conveyor/resume` | Resume belt motion |
| **Conveyor** | `POST` | `/api/conveyor/reset` | Reset simulation state |
| **Conveyor** | `POST` | `/api/conveyor/step` | Advance conveyor stage (1–8) |
| **Reports** | `GET` | `/api/reports/statistics` | Aggregated metrics, accuracy, and distributions |
| **Reports** | `GET` | `/api/reports/export-csv` | Download full baggage manifest as CSV |
| **Notifications**| `GET` | `/api/notifications` | Alert center notifications |
| **Settings** | `GET` | `/api/settings` | Operating thresholds & airport configuration |
| **Settings** | `PUT` | `/api/settings` | Update weight limits & conveyor velocity |
| **Settings** | `POST` | `/api/settings/reset-demo` | Restore clean SQLite demo environment |

---

## 6. Digital System Design (DSD) Academic Viva Voce Guide

### 1. Three-Input AND Gate Formulation
$$\text{SORT} = I \cdot W \cdot F$$
- **$I$ (Identification):** Logic $1$ if baggage RFID tag and passenger ticket match.
- **$W$ (Weight Compliance):** Logic $1$ if Measured Weight $\le \text{Max Limit}$ ($15.0\text{ kg}$).
- **$F$ (Flight Validity):** Logic $1$ if flight is active and not cancelled.

Automatic destination sorting is authorized **if and only if** all three signals are simultaneously active ($1$).

### 2. De Morgan's Fault Detector (OR Gate)
$$\text{ALERT} = (I \cdot W \cdot F)' = I' + W' + F'$$
Any single fault ($I'=1$, $W'=1$, or $F'=1$) immediately drives the $\text{ALERT}$ signal to Logic $1$, actuating the mechanical diverter to send the suitcase to **Lane 06 (Manual Inspection)**.

### 3. Complete 8-Row Truth Table

| Row | $I$ (ID) | $W$ (Weight) | $F$ (Flight) | $\text{SORT}$ (AND) | $\text{ALERT}$ (OR) | Physical Diverter Action |
|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 0 | 0 | 0 | 0 | **0** | **1** | Divert to Lane 06 (Multiple Faults) |
| 1 | 0 | 0 | 1 | **0** | **1** | Divert to Lane 06 (Unreadable Tag & Overweight) |
| 2 | 0 | 1 | 0 | **0** | **1** | Divert to Lane 06 (Unreadable Tag & Invalid Flight) |
| 3 | 0 | 1 | 1 | **0** | **1** | Divert to Lane 06 (Unreadable Tag) |
| 4 | 1 | 0 | 0 | **0** | **1** | Divert to Lane 06 (Overweight & Cancelled Flight) |
| 5 | 1 | 0 | 1 | **0** | **1** | Divert to Lane 06 (Overweight Safety Limit Exceeded) |
| 6 | 1 | 1 | 0 | **0** | **1** | Divert to Lane 06 (Flight Not Found / Cancelled) |
| 7 | 1 | 1 | 1 | **1** | **0** | **PASS → Automated Destination Chute (Lanes 01–05)** |

### 4. Digital Magnitude Comparator
The analog load cell connects to an ADC producing digital binary word $A$ (Measured Weight), which is compared against reference register $B$ (Maximum Limit, $15.0\text{ kg}$):
- $A < B \implies \text{Accepted Safe Payload}$ ($W = 1$)
- $A = B \implies \text{Boundary Limit}$ ($W = 1$)
- $A > B \implies \text{Overweight Condition}$ ($W = 0$)

---

## 7. Faculty Demonstration Walkthrough (Without Refreshing)

1. **Dashboard:** Observe the 6 dynamic KPI cards and destination charts dynamically loaded from SQLite.
2. **Luggage Registration:** Click **"Near-Limit (14.7 kg)"** or **"Overweight (18.8 kg)"** quick-fill button, click **"Register & Print Luggage Tag"**. Notice the record is immediately saved to the SQLite database.
3. **Weight Analyzer:** Load the newly registered suitcase onto the digital scale. View the digital LED display, calculated remaining allowance, and comparator $A > B$ output. Click **"Activate Load-Cell"** to run a simulated piezoelectric sensor reading.
4. **Digital Logic Control:** Toggle input switches $I$, $W$, and $F$. Watch the real-time LED lamps switch between Green ($1$) and Red ($0$). Observe the active truth table row highlight dynamically.
5. **Interactive Conveyor Simulation:** Select the new bag in the conveyor dropdown and click **"Start Conveyor"**.
   - Watch the bag move across the 8 physical stations:
     1. Baggage Entry $\rightarrow$
     2. RFID Scanning $\rightarrow$
     3. Load-Cell Weighing $\rightarrow$
     4. Flight Identification $\rightarrow$
     5. Digital Logic Controller $\rightarrow$
     6. Sorting Diverter Junction $\rightarrow$
     7. Destination Chutes (Lanes 01–05) or Lane 06 (Manual Security).
   - If overweight ($> 15\text{ kg}$), watch the diverter route the bag to **Lane 06** with an amber/red warning indicator.
6. **Smart Sorting:** Inspect the authoritative decision matrix table showing the exact Boolean flags ($I$, $W$, $F$) and the explanation reason for the routing decision.
7. **Reports & Analytics:** Filter by destination or flight. Download the full CSV report of the SQLite database.

---

## 8. License

Designed and developed for academic demonstration and Digital System Design (DSD) coursework.
All sensor measurements and RFID tag scanners are high-fidelity software simulations.

