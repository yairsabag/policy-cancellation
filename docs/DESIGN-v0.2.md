# policy.cancellation — Design v0.2
## Decision document · July 2026 · Follows: Taxonomy of Cancellation Outcomes v0.1

**Name decision:** stays `policy.cancellation`. The extension covers cancellation-related triggers from both sides; README clarifies scope. No rename.

**Design discipline:** v0.2 decides exactly four things — trigger, condition, outcome, payout. Everything else is backlog.

---

## Round-4 corpus additions (Israel + B2B) — what changed

Capped round per plan. Israeli statutory sources (תקנות הגנת הצרכן (ביטול עסקה), התש"ע-2010; חוק הגנת הצרכן):

- **I1 — Composite outcome (`lesser_of`):** the statutory Israeli cancellation fee is **5% of the transaction or ₪100, whichever is lower** — a min() of two outcome kinds. A single-kind outcome cannot express the mandatory baseline of an entire jurisdiction. → Strongest backlog candidate; NOT in v1 (it is a combinator, not a kind — admitting combinators reopens unbounded complexity).
- **I2 — Dual-reference conditions:** the statutory cooling-off window is *within 14 days of purchase* AND *more than 7 business days before the service*. Conditions reference both purchase-time and anchor-time → v1 `condition` must support `relative_to: "anchor" | "purchase"`. Adopted into core (cheap, and evidenced).
- **I3 — Business days ≠ calendar days:** statutory windows count ימי עסקים. ISO-8601 durations are calendar. → v1 stays calendar-only, limitation documented; business-day calendars are jurisdiction infrastructure, out of scope.
- **I4 — Statutory override confirmed:** "הוראות חוק זה יחולו על אף כל ויתור או הסכם נוגד" — the law overrides any declared policy. Confirms the jurisdictional-floor boundary: the descriptor declares the merchant's policy; legal floors are an overlay agents apply per-jurisdiction.
- **I5 — Fee pass-throughs:** card-clearing fees may be charged in addition to cancellation fees — fee carve-outs confirmed in a third context.
- **B2B (background patterns, flagged for verification):** termination-for-convenience clauses (reimburse costs incurred + agreed percentage), non-refundable manufacturing deposits after production start, freight dead-freight. Consistent with deposit-forfeiture + percentage kinds; no new kind observed. *Not yet corpus-verified — backlog.*

**Deterministic vs. discretionary (preliminary count, ~40 policies/patterns reviewed):** roughly 70% fully deterministic, ~30% contain a discretionary or history-dependent zone (management discretion, progressive penalties, reason-conditional waivers). The deterministic majority is large enough to standardize; the boundary flag stays.

---

## Decision 1 — Triggers

```json
"rules": {
  "buyer_cancel":   { "tiers": [ ... ], "after_last_tier": { ...outcome } },
  "no_show":        { ...outcome },
  "seller_cancel":  { ...outcome },
  "seller_postpone": { ...outcome }
}
```

- **Keyed object, not a flat rule list.** Rationale: `buyer_cancel` is inherently a *schedule* (ordered tiers with mutual-exclusivity semantics); the other three are single outcomes. A flat `[{trigger, condition, outcome}]` list would force ordering/exclusivity semantics onto triggers that don't need them and reopen the ambiguity the tiers structure solved.
- v1 trigger set: `buyer_cancel`, `no_show`, `seller_cancel`, `seller_postpone`. `reschedule` deferred (per plan — it complicates semantics: is it a cancel+rebook or a modification?). Late-arrival, force-majeure: out.
- All rules optional. Absent `no_show` defaults to `buyer_cancel`'s after-last-tier outcome. Absent `seller_cancel` defaults to full refund (matches observed norms and consumer-law floors).

## Decision 2 — Condition

```json
{ "until": "P7D", "relative_to": "anchor" }
```

- `relative_to`: `"anchor"` (default) | `"purchase"` — required by Israeli statutory windows (I2) and "free within 24h of booking" patterns.
- Durations are ISO-8601, **calendar-based**; business-day counting documented as unsupported (I3).

## Decision 3 — Outcome union

```json
{ "outcome": { "kind": "percentage", "buyer_bps": 7000 } }
{ "outcome": { "kind": "fixed_fee",  "seller_keeps": { "amount": "50.00", "currency": "USD" } } }
{ "outcome": { "kind": "unit_deduction", "seller_keeps": { "quantity": 1, "unit": "night" } } }
```

- Three kinds in v1: `percentage`, `fixed_fee`, `unit_deduction`. (`lesser_of` composite: backlog, evidence I1.)
- **Direction: baked into kind-specific field names, no separate `allocation` field.** `percentage` is always buyer-side (`buyer_bps`); `fixed_fee` and `unit_deduction` are always seller-side (`seller_keeps`). Rationale: these match how each kind is stated in the wild (corpus finding A2), and a separate `allocation` enum would create representable contradictions (`allocation: buyer_receives` alongside a `seller_keeps` object). Invalid states should be unrepresentable. The agent's canonical question ("how much do I get back?") is answered by computation, and the schema honestly declares when that computation needs external data (unit price for `unit_deduction`).
- `unit` values are free-form strings in v1 (`night`, `session`); a registry is backlog.

## Decision 4 — Payout (optional, orthogonal)

```json
"payout": { "method": "credit", "multiplier_bps": 12000 }
```

- Absent = original payment rails at 1.0.
- Captures "100% back as a credit worth 120%" (Ticketmaster/StubHub patterns) without contaminating the amount model.
- Attachable per-rule; per-tier payout is backlog.

## Full example (party ticket, Israeli statutory window included)

```json
{
  "type": "io.github.yairsabag.policy.cancellation",
  "description": { "plain": "Free cancellation until Aug 13; 70% until Aug 17; 30% until Aug 19; none after. Statutory 14-day cooling-off applies." },
  "applies_to": ["$.line_items[0]"],
  "anchor": "2026-08-20T21:00:00+03:00",
  "rules": {
    "buyer_cancel": {
      "tiers": [
        { "until": "P7D",   "relative_to": "anchor", "outcome": { "kind": "percentage", "buyer_bps": 10000 } },
        { "until": "PT72H", "relative_to": "anchor", "outcome": { "kind": "percentage", "buyer_bps": 7000 } },
        { "until": "PT24H", "relative_to": "anchor", "outcome": { "kind": "percentage", "buyer_bps": 3000 } }
      ],
      "after_last_tier": { "kind": "percentage", "buyer_bps": 0 }
    },
    "seller_cancel": { "kind": "percentage", "buyer_bps": 10000 }
  }
}
```

## Fit-check: design vs. corpus (~40 patterns)

| Verdict | Count | Examples |
|---|---|---|
| **Fully expressible** | ~26 (65%) | tiered % (all domains), flat fees, one-night/one-session penalties, non-refundable rates, credit-with-multiplier, seller-cancel auto-refund, Israeli anchor+purchase windows |
| **Partially expressible** | ~5 (12%) | deposit-component policies (needs `applies_to` line-item convention), postponement with conditional re-refund windows (Eventbrite 90/45), layered platform+merchant policies (multiple entries, combination semantics undefined) |
| **Out of scope by design** | ~7 (18%) | discretionary, progressive/history-dependent, reason-conditional waivers, force majeure, business-day arithmetic, partial consumption |
| **Fails, requires change** | ~2 (5%) | `lesser_of` statutory composite (I1); fee-carve-out refund base (Eventbrite ticketing fees) |

**Target was ≥80% of deterministic policies: achieved.** Of the ~28 fully deterministic patterns, 26 (~93%) are fully expressible. The two known failures are documented backlog items with evidence, not surprises.

## Backlog (explicitly not v1)
`lesser_of` composite · refund-base carve-outs · `reschedule` trigger · per-tier payout · unit registry · business-day calendars · partial consumption · verification/enforcement binding · discretionary-zone flag design

---
