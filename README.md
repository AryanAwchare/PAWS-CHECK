<div align="center">
  <img width="1200" height="475" alt="PawsCheck Ecosystem Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" style="border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);" />
  
  <br />
  
  # 🐾 PawsCheck Clinical Diagnostic & Veterinary Consultation Ecosystem
  
  **State-of-the-Art Dual-Portal Platform Orchestrating AI-Powered Patient Triage, Tele-Consultation Queueing, Dynamic SOAP Summaries, and Multi-Medication E-Prescriptions.**

  [![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white&style=for-the-badge)](https://react.dev)
  [![Vite](https://img-shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white&style=for-the-badge)](https://vite.dev)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white&style=for-the-badge)](https://tailwindcss.com)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white&style=for-the-badge)](https://supabase.com)
  [![Google Gemini AI](https://img.shields.io/badge/Gemini_2.0_Flash-AI_Engine-4285F4?logo=google&logoColor=white&style=for-the-badge)](https://ai.google.dev)
</div>

---

## 📖 Executive Summary

**PawsCheck** bridges the gap between pet owners seeking immediate clinical assessment and veterinary clinics requiring robust, professional workflow integration. Built as a fully decoupled **Dual-Interface Web Application**, PawsCheck features specialized views tailored precisely to individual stakeholders:
1. **Pet Owner Portal:** A premium, glassmorphism-enhanced consumer interface supporting multiple pet profile switcher management, active AI visual triage image scanning, localized clinical facility locators, appointment scheduling, and automated medication intake schedules.
2. **Doctor/Veterinarian Portal (`/doctor` route):** A high-contrast, clinical dark-themed B2B SaaS dashboard designed for zero-latency case evaluation. It provides full triage queue visibility, direct target consultation case selection, custom clinical SOAP reporting, and comprehensive prescription generation tools.

---

## 🚀 Key Features & Platform Capabilities

### 🧠 1. Visual AI Diagnostic Engine
* **Multimodal Intake Engine:** Pet owners upload clear images of physical conditions (e.g., cutaneous dermatological flare-ups, gingival erythema, ocular tracking).
* **Gemini 2.0 Flash Integration:** Images undergo deep assessment to output localized condition identification, clinical urgency classifications (`ROUTINE`, `MONITOR`, `URGENT`, `EMERGENCY`), estimated prevalence indices, and underlying physiological causes.
* **Persistent Cache Syncing:** Processed outputs automatically feed continuous local arrays to generate beautiful historical health timelines and progressive scatter metrics.

### 📅 2. Bidirectional Tele-Consultation Booking
* **Intelligent Intake Forms:** Clients can broadcast urgent checkup requests from the dashboard while optionally attaching their latest validated Visual AI score reports to optimize pre-visit context.
* **Live Status Mirroring:** Appointment approvals, rejections, and pending queue placements sync reactively directly inside the client's **Live Consultation Status Tracker**.

### 🩺 3. Advanced Doctor Workspace & SOAP Archiving
* **Target Patient Switcher Bar:** Clinicians select case files directly from active client intake queues. 
* **SOAP Note Builder:** Professional text fields capture **Subjective** background findings, **Objective** clinical metrics, **Assessment** summaries, and subsequent **Plan** directives.
* **Instant Consumer Syncing:** Completed consultation outputs transmit immediately back to the client interface under **Transmitted Veterinary Records**, alongside local file document downloads.

### 💊 4. Integrated E-Prescription System
* **Multi-Medication Dispatcher:** Built to handle intricate multi-drug regimens supporting variable dosages, tailored daily/weekly intake intervals, specific physiological administration routes (Oral, Topical, Ear drops, Inhalation), and explicit guidance notes.
* **Client Synchronization Loop:** Prescribed orders publish straight to the pet owner's active view pipeline, automatically configuring visual reminder indicators to maximize long-term client medication adherence.

### 🏥 5. Location-Aware Hospital Locator
* **Proximity Radius Filter:** Lets users input targeted addresses or custom operational areas to dynamically compute and list high-rated specialized trauma centers and clinical practices within immediate vehicular driving reach.

---

## 🛠️ Comprehensive Technology Stack

### **Frontend Architecture**
* **Core Framework:** [React 19](https://react.dev/) leveraged with custom Context API state providers (`PetContext`, `DoctorContext`).
* **Build System:** [Vite 6.0](https://vite.dev/) powered by SWC bindings for blazingly fast Hot Module Replacement (HMR).
* **Language & Typing:** TypeScript for uncompromising type safety across all database payloads, diagnostic models, and context scopes.
* **Styling System:** Tailwind CSS for hyper-responsive fluid container grids, tailored glassmorphism components, and customized dark-mode interfaces.
* **Animations:** `motion/react` (Framer Motion) delivering buttery-smooth modal lifecycle exits, dynamic layout transitions, and interactive notification alerts.
* **Vector Graphics:** `lucide-react` offering perfectly scaled SVG micro-icons across dashboard widgets.
* **Data Visualizations:** `recharts` driving visual timeline scatter plotting and health index tracking charts.

### **Backend & Storage Infrastructure**
* **Database Management Engine:** [Supabase](https://supabase.com/) configured with extensive tables mapped via explicit schemas (`pets`, `health_logs`, `pawscheck_custom_appointments`).
* **Authentication Simulation Layer:** Robust offline-first auth simulation preventing external Supabase `429 Too Many Requests` API locks while preserving perfect local route authorization access.
* **AI Compute Integration:** Directly interfacing with Google Gemini generative models to support image-based clinical assessments and intelligent diagnostic summaries.

---

## 🗂️ Project Directory Structure

```text
MINI/
├── src/
│   ├── components/
│   │   ├── auth/                 # Custom login workflows and rate-limit proof simulation modules
│   │   ├── dashboard/            # Dynamic consumer tracking analytics and scan summaries
│   │   ├── diagnostic/           # Visual AI triage processing pipeline and full detail review cards
│   │   ├── doctor/               # Comprehensive B2B clinical portals, SOAP editors, and Rx builders
│   │   ├── history/              # Timeline analytics plotting recent scan progression datasets
│   │   ├── prescription/         # Document scanning workflows mapping manual files into digital guides
│   │   ├── reminders/            # Care plan interfaces, live status trackers, and remote booking dialogs
│   │   └── vets/                 # Interactive map tools and specialized clinic location filters
│   ├── context/                  # Global Decoupled Providers (PetContext.tsx, DoctorContext.tsx)
│   ├── lib/                      # Supabase service endpoints, proxy variables, and Gemini integration
│   ├── App.tsx                   # Master routing framework switching public / doctor workspace portals
│   └── index.css                 # Advanced CSS styling directives, scrollbar overrides, and gradient tokens
├── supabase_rls_policies.sql     # Enterprise-grade Postgres Row Level Security access definitions
├── package.json                  # Managed dependency configuration and runtime script targets
└── README.md                     # Detailed ecosystem master configuration documentation
```

---

## 💻 Local Development & Installation Guide

Follow these sequential steps to boot the entire dual-portal system locally with zero proxy blockers:

### **1. Setup Workspace**
Clone the core repository and navigate directly into the root deployment package folder:
```bash
cd MINI
```

### **2. Install Dependencies**
Execute standard package resolution to extract all core UI, routing, state, and animation packages:
```bash
npm install
```

### **3. Environment Tokens**
Verify your `.env.local` contains standard development variable stubs:
```env
VITE_GEMINI_API_KEY="your_google_ai_studio_api_key_here"
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key-here"
```

### **4. Launch Client & Doctor Server**
Initiate the local development compile loop. Hot reloads are instantly fully functional:
```bash
npm run dev
```

Open your local browser to inspect the application workflows:
* **Consumer Gateway View:** navigate to [http://localhost:5173/](http://localhost:5173/)
* **Doctor Clinical Portal View:** click the top navigation bar link or visit [http://localhost:5173/doctor](http://localhost:5173/doctor)

---

## 🔒 Security Best Practices & RLS Schema Implementation

To ensure strict client-doctor confidentiality, the project includes comprehensive Postgres **Row Level Security (RLS)** policy files (`supabase_rls_policies.sql`).
* **Veterinarian Role Constraints:** Limits clinical queue update capabilities explicitly to authenticated users identified with vet custom metadata claims.
* **Consumer Scope Privacy:** Enforces secure UUID match queries ensuring pet profiles, medical triage documents, and consultation history entries are visible exclusively to verified parent accounts.

---

## 🤝 Contribution Guidelines

We maintain high design standards. Contributions targeting UI layouts must adhere strictly to established design tokens:
* Avoid unstyled, barebones HTML inputs. All buttons must leverage curated primary gradient classes (`bg-blue-600`, `bg-emerald-500`) paired with subtle drop shadows.
* Ensure container headers use small, uppercase tracking font definitions (`text-[10px] font-bold uppercase tracking-widest`) to maintain unified visual hierarchy across portals.

<div align="center">
  <br />
  <p className="text-xs font-mono text-slate-400">Designed & Engineered with ❤️ for Veterinary Excellence.</p>
</div>
