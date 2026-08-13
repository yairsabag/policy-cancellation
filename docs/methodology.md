# Methodology

## Corpus

The corpus was built from ~40 publicly available cancellation
policies across service verticals: hotels & lodging, events & venues,
tours & activities, transportation, and rentals & other services.
Israeli consumer-law provisions were included as a jurisdictional
reference point.

## Coverage computation (v0.2)

The ~93% figure: 37 of 40 corpus policies are fully representable
by the v0.2 schema; 3 are partially representable. Per category:

| Category | Policies | Fully | Partially | Notes on partial |
|---|---|---|---|---|
| Hotels & lodging | 12 | 11 | 1 | lesser-of statutory cap (IL consumer law) not expressible |
| Events & venues | 9 | 8 | 1 | fee carve-out (deposit excluded from % base) approximated only |
| Tours & activities | 8 | 8 | 0 | — |
| Transportation | 6 | 6 | 0 | — |
| Rentals & other services | 5 | 4 | 1 | reschedule-fee ladder (postpone ≠ cancel) not modeled |
| **Total** | **40** | **37** | **3** | **37/40 ≈ 93%** |

Known gaps (tracked in the design backlog): lesser_of caps,
fee carve-outs, reschedule ladders, jurisdiction floors / policy
composition.

## Scope note

The ~93% figure refers to this research corpus only — it is a
schema-expressiveness measure, not a market-adoption claim.
No company names or details from private interviews are included
in this repository.

