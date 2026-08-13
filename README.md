# policy.cancellation — a UCP policy extension
**[Live demo →](https://yairsabag.github.io/policy-cancellation/demo/)** — why a machine-readable policy changes which offer is cheaper.

**Status:** v0.2 — corpus-validated design · **Namespace:** `io.github.yairsabag.policy.cancellation` (will change if standardized as a shared extension)

A machine-readable **cancellation and disruption policy** for [UCP](https://github.com/Universal-Commerce-Protocol/ucp)'s `policies[]` container — covering the class of merchant policies standard in services and bookings commerce:

> *Free cancellation until 7 days before the event; 70% back until 72 hours; 30% until 24 hours; nothing after. No-shows charged the first night. Full refund if the seller cancels.*

## Why

Cancellation terms influence purchasing decisions before payment, yet today they are typically published only as human-readable text. Purchasing agents can compare price and shipping but cannot weigh that one hotel offer is fully refundable until check-in and another is not.

Origin: the design discussion in [Universal-Commerce-Protocol/ucp#572](https://github.com/Universal-Commerce-Protocol/ucp/pull/572). Related: Return Extension ([#257](https://github.com/Universal-Commerce-Protocol/ucp/pull/257)) for physical goods; Services Vertical ([#303](https://github.com/Universal-Commerce-Protocol/ucp/issues/303)).

## What changed in v0.2

v0.1 was validated against **~40 real cancellation policies** across hospitality, event ticketing, appointments/services, and Israeli consumer-law sources ([docs/TAXONOMY.md](docs/TAXONOMY.md)). The anchor+tiers core held; the corpus exposed two recurring generalizations, now in the design ([docs/DESIGN-v0.2.md](docs/DESIGN-v0.2.md)):

1. **Outcomes are not always percentages.** Flat fees ($50 late-cancel) and unit deductions (one night, one session) are equally standard → a small discriminated `outcome` union: `percentage` | `fixed_fee` | `unit_deduction`.
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
- Platforms that negotiated the extension reason over `rules`; others can still render `description`.

Schema: [`schema/policy.cancellation.schema.json`](schema/policy.cancellation.schema.json) — all five [`examples/`](examples/) validate against it (event tiers, hotel one-night penalty, salon flat fee, cooling-off window, credit payout).

## Deliberately out of scope (documented backlog)

Composite outcomes (e.g. the Israeli statutory "lesser of 5% or ₪100"), refund-base fee carve-outs, `reschedule` trigger, business-day calendars, partial consumption, discretionary/history-dependent zones (~30% of real policies contain such zones — a machine-readability boundary, measured in the corpus), and any execution/verification binding.

Feedback and real-world policy examples that this shape *cannot* express are especially welcome — please open an issue.

## License

Apache 2.0


