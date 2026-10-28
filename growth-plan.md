# NxtWave Growth Challenge — 500 Registrations in 7 Days
**Campaign:** "Build Your First AI Project in 60 Minutes" | **Target:** 500 Registrations | **Budget:** ₹2,000 | **Duration:** 7 Days  
*Document Status: Proposed Operational Strategy & Working Asset Specification (Not a report of completed campaign results)*

---

# Page 1: Strategy and Acquisition Plan

## 1. Executive Summary
- **Challenge Objective:** Attract, validate, and register 500 final-year engineering students for a free, 60-minute live online workshop titled *"Build Your First AI Project in 60 Minutes"* within a 7-day sprint.
- **Budget Constraint:** Maximum ₹2,000 total expenditure, prioritizing permission-based organic distribution and preserving capital unless measurable micro-tests justify spending.
- **Target Audience:** 7th and 8th-semester engineering students (Classes of 2026 and 2027) across Computer Science, Information Technology, Electronics & Communication, and allied branches preparing for campus placements and off-campus recruitment.
- **Growth Approach:** A high-trust, permission-driven campus community outreach strategy supported by a peer referral viral loop, frictionless registration UX, and an attribution-tracking web application prototype.

---

## 2. Student Understanding & Behavioral Hypotheses
*(Note: These represent strategic hypotheses to be validated through engagement data, not findings from completed research.)*

| Dimension | Working Hypothesis | Proposed Countermeasure in Campaign & Landing Page |
|---|---|---|
| **Primary Motivation** | Final-year students urgently seek tangible resume projects and portfolio proof to discuss during upcoming campus and off-campus technical interviews. | Workshop headline and syllabus emphasize shipping a concrete, working prototype (*"AI-Powered Text Summarizer"*) rather than abstract theory. |
| **Friction: Difficulty** | Students fear AI requires advanced mathematics, deep learning theory, or heavy GPU hardware they do not possess. | Explicit copy highlights: *"No prior AI experience required; if you can write basic code in any language, you can build this."* |
| **Friction: Timebox** | Final-year schedules are heavily constrained by academics, semester exams, and placement prep; long webinar formats face steep drop-offs. | Strict 60-minute timebox guarantee prominently communicated in the hero section and CTAs. |
| **Friction: Trust & Upsell** | Students are skeptical of "free webinars" that turn into aggressive paid course sales pitches. | Clear public disclosures: 100% free, zero hidden charges, transparent learning outcomes, and no unsolicited communications. |

---

## 3. Prioritized Acquisition Strategy (500 Target Hypothesis)
All channels operate on a strict **permission-first policy**: student leaders and community administrators must grant authorization prior to posting promotional collateral.

| Channel | Target Regs | Share | Strategic Rationale | Concrete Execution | Measurement Method | Key Dependency / Risk |
|---|:---:|:---:|---|---|---|---|
| **College WhatsApp / Class Groups** | **180** | 36% | Direct access to active final-year batch cohorts with high notification read rates. | Request permission from group admins; provide a concise forwardable announcement card and project screenshot. | Custom tracking link: `?utm_source=whatsapp&utm_campaign=ai_workshop` | Group admin rejection; group spam policies; forward fatigue. |
| **Class Representatives (CRs) / Direct Outreach** | **120** | 24% | CR recommendations carry peer trust and official academic authority within departmental sections. | Direct 1:1 briefing with CRs across 25 target colleges; share a ready-to-forward departmental notice template. | Departmental tracking links: `?utm_source=classrep&utm_campaign=ai_workshop` | Inconsistent CR follow-through; delayed message relay. |
| **Technical Clubs & Coding Communities** | **90** | 18% | Pre-qualified audience with existing coding aptitude and high intent to build software projects. | Partner with college IEEE/ACM student branches, GDSC chapters, and coding clubs for approved newsletter/Discord posts. | Community tracking links: `?utm_source=techclub&utm_campaign=ai_workshop` | Lengthy club approval cycles; competing club event schedules. |
| **Student Peer Referrals** | **70** | 14% | Organic peer-to-peer viral loop; engineering students prefer learning alongside study partners and project teammates. | Automated generation of unique referral links (`?ref=CODE`) on registration confirmation screen with 1-click WhatsApp copy. | Dedicated referral tracking in SQLite (`referral_code_used` attribute). | Low initial viral coefficient ($k < 0.2$); self-referral attempts (blocked by system). |
| **Organic Posts & Email Lists** | **40** | 8% | Captures intent-driven students across technical Reddit communities, LinkedIn student networks, and campus alumni lists. | High-value, educational post: *"How to connect your first LLM API in Python,"* directing interested students to the free workshop. | Educational tracking links: `?utm_source=organic&utm_campaign=ai_workshop` | Low algorithmic reach; strict sub-community moderation filters. |
| **Total Planned Target** | **500** | **100%** | Reconciled 7-day acquisition hypothesis across all 5 distinct distribution channels. | | | |

---

## 4. Planned Budget Allocation (Strict ₹2,000 Ceiling)
Organic distribution is the primary operational driver. Capital is preserved as a defensive reserve rather than expended unnecessarily.

```
Total Budget Cap: ₹2,000 (100%)
├── ₹1,000 (50%) — Optional Micro-Paid / Channel Pilot (Meta / Campus Placement Ad Test)
├──   ₹500 (25%) — Creative Asset Production & Contingency Collateral
└──   ₹500 (25%) — Defensive Growth Reserve (Held strictly unspent unless validated)
```

- **₹1,000 — Optional Paid Test:** Allocated exclusively for a controlled 48-hour pilot on Meta/Instagram targeting final-year engineering students within 25 km of key technical hubs. Condition: only deployed if organic traction by Day 3 shows high landing page conversion ($\ge 20\%$) and CAC remains below ₹15/registration.
- **₹500 — Creative Assets & Copy Testing:** Reserved for producing standardized image banners, ASCII formatted forwarding cards, and mobile-optimized project preview clips.
- **₹500 — Defensive Reserve:** Strictly held in reserve. If organic community channels hit daily run-rates, this capital remains unspent. *Unspent funds are prioritized over unmeasured spend.*

---

# Page 2: Execution, Measurement, and Working Asset

## 5. Seven-Day Operational Execution Calendar

```
DAY 1: Infrastructure Readiness & Asset Verification
- Audit and launch registration landing page, SQLite schema, UTM logging, and referral tracking.
- Draft standardized admin permission requests and forwardable announcement cards.

DAY 2: Directory Compilation & Permission Outreach
- Build target directory of 30 engineering colleges across Telangana, Karnataka, Tamil Nadu, and Maharashtra.
- Contact Class Representatives and Club Leads; secure explicit permission before distributing workshop notices.

DAY 3: Authorized Channel Distribution Launch
- Deploy tracked messages (`?utm_source=whatsapp`, `classrep`, `techclub`) across approved channels.
- Monitor real-time server health and rate-limiting thresholds on registration endpoints.

DAY 4: Mid-Point Velocity & Channel Attribution Review
- Audit channel registrations against planned targets in the Growth Dashboard.
- Reallocate outreach effort: pause underperforming college cohorts; double down on responsive departments.

DAY 5: Referral Engine & Practical Outcome Showcase
- Trigger referral encouragement push to registered students highlighting study-buddy collaboration.
- Release project teaser: *"Step-by-step preview of the 45-minute AI Text Summarizer."*

DAY 6: Objection Clearing & Authorized Follow-Up
- Deploy permitted reminders addressing common doubts (prerequisites, laptop setup, Python basics).
- Final direct check-in with Class Representatives to confirm department coverage.

DAY 7: Final Sprint & Workshop Operations Handoff
- Final 6-hour registration reminder through authorized broadcast channels.
- Close registration intake; export sanitized CSV registration ledger for operational workshop onboarding.
```

---

## 6. Measurement Framework & Decision Governance
All metrics are derived directly from SQLite persistence without decorative counters or fabricated denominators.

- **Primary Success KPI:** Total verified registrations logged against the 500-seat ceiling.
- **Attribution & Velocity:** Channel contribution breakdown (`bySource`), daily registration run-rate, and target attainment percentage per channel.
- **Referral Loop Metrics:** Unique referral clicks, total referral registrations, click-to-registration conversion rate, and top student referrers.
- **Metrics Governance & Disclosures:**
  - *Conversion Rate (CR%):* Calculated strictly when validated landing page impression logs exist.
  - *Cost Per Acquisition (CAC):* Calculated strictly against verified ad spend disbursements ($CAC = \text{Actual Paid Spend} / \text{Attributed Registrations}$).
  - *Daily Review Protocol:* At 18:00 IST daily, channel velocity is compared against benchmark pace (72 registrations/day). Channels lagging by $>30\%$ undergo message revision or representative replacement.

---

## 7. Working Asset: Growth Prototype Specification
The strategy is powered by an operational, full-stack application built specifically for this selection assignment:

- **Public Landing Page (`/`):** Conversion-optimized, responsive layout communicating the 60-minute value proposition, curriculum milestones, sample project blueprint, and FAQ.
- **Registration Engine (`/register`):** Client-side validation via React Hook Form & Zod; server-side deduplication enforcing normalized email uniqueness; UTM and referral capture.
- **Attribution & Referral Hub (`/success`):** Instant registration confirmation, unique Registration ID (`WS-XXXXXX`), personal referral code generation, and 1-click clipboard link builder.
- **Growth Dashboard (`/dashboard`):** Real-time analytics workspace featuring KPI summaries, target progress bar, Recharts registration velocity and channel distribution charts, editable channel targets, referral leaderboard, and RFC 4180 CSV export with formula injection mitigation.
- **Data Integrity & Demo Mode:** Transparent dual-mode system cleanly isolating live database records (`is_demo = 0`) from synthetic test data (`is_demo = 1`). *The prototype serves as an operational workflow demonstration, not proof of achieved registrations.*

---

## 8. Strategic Risks and Mitigations

| Risk Factor | Potential Impact | Operational Mitigation Strategy |
|---|---|---|
| **Community Gatekeeping** | Group admins refuse or ignore broadcast requests, limiting organic top-of-funnel reach. | Pitch the workshop as a free academic upskilling initiative; offer exclusive club recognition or custom referral tags for co-hosting clubs. |
| **Landing Page Drop-Off** | High visit traffic but low form completion due to student skepticism or form friction. | Keep registration strictly to 5 essential fields; provide immediate confirmation without email verification barriers. |
| **Attribution Leakage** | Students copy raw URLs without UTM tags, distorting channel performance data. | Shorten and brand links with distinct pre-set source tags; utilize unique referral codes as a secondary attribution layer. |
| **Data Privacy Concerns** | Students hesitant to submit personal contact details to unverified portals. | Prominent data disclaimer on form: local prototype storage, zero commercial sharing, and strict educational usage. |

---

## 9. Pre-Registered Growth Experiments (Planned)

1. **EXP-01: Headline Framing (Project Outcome vs. Abstract Skill)**
   - *Hypothesis:* An outcome-led headline (*"Build a Working AI Text Summarizer in 60 Minutes"*) will generate higher registration conversion than a skill-led headline (*"Learn Generative AI Fundamentals"*) because final-year students prioritize portfolio artifacts.
   - *Metric:* Landing Page Conversion Rate ($CR = \text{Registrations} / \text{Unique Visits}$).
   - *Decision Rule:* If outcome variant achieves $\ge 15\%$ relative lift with $p < 0.05$ (min. 150 visits/variant), adopt across all promotional channels.
2. **EXP-02: WhatsApp Announcement Format (Project Preview Card vs. Topic Bullets)**
   - *Hypothesis:* Visual messaging showing a finished application card drives higher link CTR than syllabus bullet points.
   - *Metric:* UTM click-through rate and completed registrations per group broadcast.
   - *Decision Rule:* If visual format yields $\ge 25\%$ higher registrations across 10 sample groups by Day 4, mandate it for all remaining outreach.
3. **EXP-03: Viral Loop Incentive (Partner Collaboration vs. Solo Registration)**
   - *Hypothesis:* Framing the referral link as *"Invite a Project Partner to Build Together"* drives higher viral sharing than a generic *"Invite Friends"* CTA.
   - *Metric:* Viral referral coefficient ($k\text{-factor} = \text{Referral Registrations} / \text{Initial Registrations}$).
   - *Decision Rule:* If partner messaging achieves $k > 0.20$, elevate the referral module to the primary post-registration follow-up communication.

---
*NxtWave Growth Challenge — Proposed Operational Strategy & Prototype Asset Specification. Prepared for Intern Selection.*
