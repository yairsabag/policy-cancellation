# policy.cancellation — a UCP policy extension

**Status:** prototype / validation phase · **Namespace:** `io.github.yairsabag.policy.cancellation` (will change if standardized as a shared extension)

A machine-readable, **time-tiered, anchor-relative cancellation policy** for [UCP](https://github.com/Universal-Commerce-Protocol/ucp)'s `policies[]` container — for the class of merchant policies standard in services and bookings commerce:

> *Free cancellation until 7 days before the event; 70% back until 72 hours; 30% until 24 hours; nothing after.*

## Why

Cancellation terms influence purchasing decisions before payment, yet today they are typically published only as human-readable text. Purchasing agents can compare price and shipping but cannot weigh that one hotel offer is fully refundable until check-in and another is not. The base `refund` policy sketch (single `window`) covers goods-style returns; this extension covers the services side: entitlements that **step down at deadlines**, measured **backwards from an anchor** (check-in, event start), with **partial** outcomes.

Origin: the design discussion in [Universal-Commerce-Protocol/ucp#572](https://github.com/Universal-Commerce-Protocol/ucp/pull/572), where the composition pattern used here was sketched by the UCP maintainers. Related: Return Extension ([#257](https://github.com/Universal-Commerce-Protocol/ucp/pull/257)) for physical goods; Services Vertical ([#303](https://github.com/Universal-Commerce-Protocol/ucp/issues/303)).

## Shape

On the wire, it is just another entry in `policies[]` — riding `applies_to` targeting, `messages[]` disclosure and the `links[]` fallback, with no new machinery:

```json
{
  "type": "io.github.yairsabag.policy.cancellation",
  "description": { "plain": "Free cancellation until Aug 13; 70% back until Aug 17; 30% until Aug 19; none after." },
  "applies_to": ["$.line_items[0]"],
  "anchor": "2026-08-20T15:00:00Z",
  "tiers": [
    { "until": "P7D",   "buyer_bps": 10000 },
    { "until": "PT72H", "buyer_bps": 7000 },
    { "until": "PT24H", "buyer_bps": 3000 }
  ],
  "after_last_tier_bps": 0
}
```

Semantics:

- **`anchor`** — the reference moment (check-in, event start). Intrinsic to the policy; the entry is self-contained.
- **`tiers[]`** — `until` is an ISO 8601 duration *before* the anchor. Tiers are ordered farthest → nearest; `until` strictly decreasing in proximity, `buyer_bps` strictly decreasing (a later deadline never refunds more).
- **`after_last_tier_bps`** — buyer entitlement once the last deadline passes (default 0).
- Everything not returned to the buyer belongs to the seller.
- Platforms that negotiated the extension validate and reason over `tiers`; platforms that didn't can still render `description`.

Schema: [`schema/policy.cancellation.schema.json`](schema/policy.cancellation.schema.json) · Examples: [`examples/`](examples/) (event ticket, hotel booking, venue deposit).

## Status & roadmap

This is a prototype being validated against real services/bookings scenarios. Deliberately out of scope for now: partial consumption (introduces domain-specific settlement semantics), seller-initiated cancellation outcomes, dispute/arbiter pointers, and any execution/verification binding. If the shape proves broadly shared in practice, the goal is to bring implementation experience back to the UCP community to inform a possible shared extension.

Feedback and real-world policy examples that this shape *cannot* express are especially welcome — please open an issue.

## License

Apache 2.0
