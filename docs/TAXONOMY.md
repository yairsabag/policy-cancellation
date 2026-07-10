# Taxonomy of Cancellation Outcomes
## Discovery document — no schema decisions here · v0.1 · July 2026

**Method:** three corpus rounds across domains — (1) hospitality, (2) event ticketing, (3) appointments/services/contractors (salons, medical, consultants, home services, fitness). Every pattern below carries real-world evidence. This document *catalogs*; it does not *design*. Representation decisions are deferred to a separate RFC round.

---

## Dimension A — Outcome types (what happens to the money)

| Type | Definition | Cross-domain evidence | Domains |
|---|---|---|---|
| **Percentage** | buyer keeps/loses % of amount | tiered %: hotels 50%-by-72h; contractors free>48h / 25% / 50% same-day; salons 50% late-cancel | ALL |
| **Flat fee** | fixed currency amount | $25–$100 standard across industries; $50 salon fee; $20 hotel fee | ALL |
| **Unit deduction** | penalty = N units of the purchase | hotels: one-night penalty (Marriott/Hilton standard); fitness/packages: "deducting a session for package holders" | hospitality, fitness/classes |
| **Deposit forfeiture** | a defined component is lost; remainder follows other rules | deposit kept as revenue protection; "deposit non-refundable, balance refundable" | ALL |
| **Full forfeit / Free** | 0% or 100% | non-refundable rates; free cancellation | ALL |

**Finding A1:** percentage, flat fee, and unit deduction each recur in ≥2 unrelated domains → they are *kinds of one thing* (an outcome), not domain quirks. Supports a single discriminated `outcome` primitive over separate fields.

**Finding A2 (direction):** percentage outcomes are naturally stated buyer-side ("50% refund"); unit and fee outcomes are naturally stated seller-side ("charged first night", "$50 fee"). Any representation must canonicalize one direction and document the conversion.

## Dimension B — Payout method (HOW the buyer gets value back)

- **Original rails** (cash/card refund) — default everywhere.
- **Credit/voucher** — hotels convert deposits to future-stay credit; consultants use credit-toward-reschedule; Ticketmaster organizer credits.
- **Critical finding B1:** credit is NOT merely a method — it changes the *amount*: Ticketmaster credits are "at least 100% … including any potential promotional amount"; StubHub offered coupons worth 20% more than the original order. Credit = method × multiplier (often ≥100%). So "voucher" straddles the outcome/payout layers; the taxonomy keeps them as two axes (amount, method) with an optional multiplier, and defers representation.

## Dimension C — Trigger taxonomy (WHAT event activates the outcome)

The biggest cross-domain discovery. Round 1 (hospitality) made buyer-cancel-at-time-T look like the whole story. Rounds 2–3 broke that:

| Trigger | Evidence | Notes |
|---|---|---|
| Buyer cancels at time t | everywhere | the current schema's only trigger |
| **No-show** | distinct and usually harsher: full price vs 50% for late cancel; "no call/no show charged 100%" | confirmed in ALL domains |
| **Reschedule** (vs cancel) | reschedule often free where cancel is penalized; "credit-toward-reschedule" | distinct buyer action |
| Late arrival | treated as late cancellation in salons/medical | edge trigger |
| **Seller cancels** | Ticketmaster: event canceled → automatic refund to original payment | the *dominant* trigger in ticketing |
| **Seller postpones/reschedules** | postponed → ticket stays valid, NO refund by default; Eventbrite: postponed >90 days without new date → refund on request for 45 days | a seller-side state machine, not a time function |
| Force majeure / emergency | overrides normal policy across industries | dispute territory |

**Finding C1:** in consumer ticketing, buyer-side tiered cancellation is often *absent entirely* ("All sales are final") — the whole policy lives in seller-status triggers. A cancellation-policy standard that models only buyer timing describes hospitality and services well, ticketing poorly.

## Dimension D — Refund base (WHAT amount the outcome applies to)

- Full amount paid (default)
- **Minus platform/ticketing fees:** Eventbrite refunds exclude Ticketing Fees by default — and the carve-out is *reason-conditional* (fees refunded only for cancellation/COVID/duplicate)
- Minus taxes / "plus tax" penalties (hotel one-night + tax)
- Deposit component only (via component targeting)
- **Layered policies:** platform layer + merchant layer stack (Choice Hotels: platform minimum one-night fee regardless of hotel policy)

## Dimension E — Time structure

- Single window (most services), multi-tier schedules (hotels groups, contractors, events) — both anchored to the service moment → the `anchor` + `tiers` core is validated cross-domain.
- Booking-relative windows also exist (grace period after purchase, e.g. "free within 24h of booking") → anchor direction may need a `from: purchase|service` notion. (Deferred.)

## Machine-readability boundary — policies that should NOT be standardized

These are failures of the *problem*, not of the schema — documented deliberately:

1. **Discretionary:** "case-by-case basis at the discretion of management"; StubHub's "as determined in [our] sole discretion". Ticketmaster's default is organizer discretion.
2. **History-dependent (progressive):** first offense → warning; second → fee; third → prepayment required. Outcome depends on the *client's record*, not the transaction — fundamentally outside a static per-transaction descriptor.
3. **Reason-conditional:** fee refund depends on the declared reason (COVID/duplicate/cancelled); emergencies waived "as determined by management".
4. **Legally bounded:** fees capped by reasonableness/state law (cannot exceed service price; jurisdiction-specific caps) — a floor the descriptor cannot see.

**Boundary rule (proposed):** the standard describes *deterministic, transaction-scoped* outcomes. A policy entry may declare `discretionary: true` zones honestly, but cannot encode them. Prevalence of discretionary clauses should be measured in future corpus rounds — if most real policies are discretionary at the edges, the descriptor's role is "the deterministic core + honest gaps," which is still exactly what an agent needs.

## Cross-domain coverage matrix

| Pattern | Hospitality | Ticketing | Services/Appointments |
|---|---|---|---|
| Tiered % by time | ✔ | rare | ✔ |
| Flat fee | ✔ | — | ✔✔ |
| Unit deduction | ✔ (night) | — | ✔ (session) |
| Credit/voucher (±multiplier) | ✔ | ✔✔ | ✔ |
| No-show distinct | ✔ | n/a | ✔✔ |
| Seller-status triggers | rare | ✔✔ (dominant) | ✔ (company cancels) |
| Fee carve-outs | ✔ (tax) | ✔✔ | — |
| Discretionary/progressive | ✔ | ✔ | ✔✔ |

## Design implications (DEFERRED — for the next document, not this one)

The evidence points to a small core and layered extensions: (1) keep `anchor`+`tiers` as the time spine; (2) replace bare `buyer_bps` with one discriminated `outcome`; (3) triggers beyond buyer-cancel (no-show, seller-cancel/postpone) as siblings, not tier mutations; (4) payout method and refund base as orthogonal optional axes; (5) discretionary/progressive/reason-conditional stay OUT, with an honesty flag. Whether all of this belongs in one extension or several is a design question this document deliberately does not answer.

## Open corpus gaps (round 4 candidates)
- SaaS/subscriptions (largely a partial-consumption domain — may confirm the scope boundary)
- Freight/manufacturing deposits (B2B: dead-freight, cancellation-for-convenience clauses)
- Hebrew/Israeli sources (cross-language and regulatory check) — DONE, see DESIGN-v0.2.md round-4 additions
- Prevalence counting: of N random policies, how many are fully deterministic vs partially discretionary
