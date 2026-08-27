# policy.cancellation — a UCP third-party policy type

[![UCP v2026-08-25](https://img.shields.io/badge/UCP-v2026--08--25-1f6feb)](https://github.com/Universal-Commerce-Protocol/ucp/releases/tag/v2026-08-25)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
**[Live demo →](https://yairsabag.github.io/policy-cancellation/demo/)** — why a machine-readable policy changes which offer is cheaper.

**Status:** v0.3.0 — corpus-validated independent policy type · **Compatibility:** [UCP v2026-08-25](https://github.com/Universal-Commerce-Protocol/ucp/releases/tag/v2026-08-25) · **Namespace:** `io.github.yairsabag.policy.cancellation`

**Standardization status:** the base `policies[]` primitive is part of stable UCP; this cancellation type is an independent, vendor-namespaced policy type and is **not** an adopted UCP shared policy type.

A machine-readable **cancellation and disruption policy** for [UCP](https://github.com/Universal-Commerce-Protocol/ucp)'s `policies[]` container — covering the class of merchant policies standard in services and bookings commerce:

> *Free cancellation until 7 days before the event; 70% back until 72 hours; 30% until 24 hours; nothing after. No-shows charged the first night. Full refund if the seller cancels.*

## Why

Cancellation terms influence purchasing decisions before payment, yet today they are typically published only as human-readable text. Purchasing agents can compare price and shipping but cannot weigh that one hotel offer is fully refundable until check-in and another is not.

The base primitive is now shipped in the stable [UCP v2026-08-25 release](https://github.com/Universal-Commerce-Protocol/ucp/releases/tag/v2026-08-25), whose release notes explicitly list [`policies[]` (#572)](https://github.com/Universal-Commerce-Protocol/ucp/pull/572). This policy type grew from the [tiered, anchor-relative cancellation proposal](https://github.com/Universal-Commerce-Protocol/ucp/pull/572#issuecomment-4925373430); UCP maintainer Ilya Grigorik described the use case as a ["textbook" extension over the primitive](https://github.com/Universal-Commerce-Protocol/ucp/pull/572#issuecomment-4930352387).

See [docs/PROVENANCE.md](docs/PROVENANCE.md) for the timestamped design and validation history and the precise boundary between stable UCP and this independent policy type. See [docs/UCP-2026-08-25.md](docs/UCP-2026-08-25.md) for the compatibility matrix. Related: Return Extension ([#634](https://github.com/Universal-Commerce-Protocol/ucp/pull/634)) for physical goods; Services Vertical ([#303](https://github.com/Universal-Commerce-Protocol/ucp/issues/303)).

## What changed in v0.3

v0.3 aligns the schema with UCP's forward-compatibility guidance: outcome kinds, trigger keys, reference points, and payout methods are open vocabularies with validation for the known values. It also adds an executable reference evaluator, seven test vectors, four surface-placement fixtures, and automated schema/test checks.

```sh
npm install
npm run validate
npm test
```

## What changed in v0.2.1

v0.2.1 pins the integration contract to the first stable UCP release containing `policies[]`, makes the standardization boundary explicit, and validates complete policy entries against the UCP base envelope plus the cancellation fields. The cancellation model itself is unchanged from v0.2.

## What changed in v0.2

v0.1 was validated against **~40 real cancellation policies** across hospitality, event ticketing, appointments/services, and Israeli consumer-law sources ([docs/TAXONOMY.md](docs/TAXONOMY.md)). The anchor+tiers core held; the corpus exposed two recurring generalizations, now in the design ([docs/DESIGN-v0.2.md](docs/DESIGN-v0.2.md)):

1. **Outcomes are not always percentages.** Flat fees ($50 late-cancel) and unit deductions (one night, one session) are equally standard → an open discriminated `outcome` model with three well-known kinds: `percentage` | `fixed_fee` | `unit_deduction`.
2. **More triggers than buyer cancellation.** No-show, seller cancellation and postponement carry distinct outcomes in every domain → `rules` keyed by trigger.

Fit-check: ~93% of the fully deterministic corpus is expressible in v0.2. Known gaps are documented backlog, not surprises.

See [docs/methodology.md](docs/methodology.md) for how the corpus was built and how the coverage figure is computed.

## Shape

```json
{
  "type": "io.github.yairsabag.policy.cancellation",
  "description": { "plain": "Free cancellation until 48h before check-in. Later cancellations and no-shows charged the first night." },
  "applies_to": ["$.line_items[0]"],
  "anchor": "2026-11-15T15:00:00+02:00",
  "rules": {
    "buyer_cancel": {
      "tiers": [
        { "until": "PT48H", "outcome": { "kind": "percentage", "buyer_bps": 10000 } }
      ],
      "after_last_tier": { "kind": "unit_deduction", "seller_keeps": { "quantity": 1, "unit": "night" } }
    },
    "no_show": { "kind": "unit_deduction", "seller_keeps": { "quantity": 1, "unit": "night" } },
    "seller_cancel": { "kind": "percentage", "buyer_bps": 10000 }
  }
}
```

Key semantics:

- **`anchor`** — the reference moment (check-in, event start). Tier deadlines default to counting backwards from it; `relative_to: "purchase"` supports cooling-off windows counted from booking time.
- **`rules`** — keyed by trigger: `buyer_cancel` (a tier schedule), `no_show`, `seller_cancel`, `seller_postpone` (single outcomes). Absent `no_show` follows `buyer_cancel`'s after-last-tier outcome; absent `seller_cancel` means full refund.
- **`outcome`** — direction is baked into each kind's field name: `percentage` is buyer-side (`buyer_bps`), `fixed_fee`/`unit_deduction` are seller-side (`seller_keeps`), matching how each is stated in real policies and making contradictory states unrepresentable.
- **`payout`** *(optional)* — how value is delivered: original rails (default) or `credit` with a `multiplier_bps` ("credit worth 120%").
- Platforms that recognize the policy type can reason over `rules`; others can still render `description`.

Schema: [`schema/policy.cancellation.schema.json`](schema/policy.cancellation.schema.json) — every policy entry in [`examples/`](examples/) validates against it. [`src/evaluate.mjs`](src/evaluate.mjs) and [`test-vectors/evaluation.json`](test-vectors/evaluation.json) provide executable semantics for deterministic time-based outcomes.

## Deliberately out of scope (documented backlog)

Composite outcomes (e.g. the Israeli statutory "lesser of 5% or ₪100"), refund-base fee carve-outs, `reschedule` trigger, business-day calendars, partial consumption, discretionary/history-dependent zones (~30% of real policies contain such zones — a machine-readability boundary, measured in the corpus), and any execution/verification binding.

Feedback and real-world policy examples that this shape *cannot* express are especially welcome — please open an issue.

## License

Apache 2.0


