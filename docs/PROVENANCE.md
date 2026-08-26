# Provenance and standardization status

This repository defines an independent, vendor-namespaced extension for UCP's `policies[]` primitive. The public record below documents where the design came from and what UCP has—and has not—standardized.

## Public timeline

- **July 9, 2026 — requirement and initial shape.** Yair Sabag posted the tiered, anchor-relative, partial-outcome cancellation use case in [UCP PR #572](https://github.com/Universal-Commerce-Protocol/ucp/pull/572#issuecomment-4925373430), covering hotels, events, and service deposits.
- **July 9, 2026 — maintainer design response.** UCP maintainer Ilya Grigorik called it a ["great stress test and case study" and a "textbook" extension](https://github.com/Universal-Commerce-Protocol/ucp/pull/572#issuecomment-4930352387), supplied the composition pattern, and recommended keeping the anchor on the policy.
- **July 10, 2026 — corpus validation.** Sabag reported validation against approximately 40 real cancellation policies, including flat fees, unit deductions, no-shows, seller cancellation, and postponement, and published the [schema and corpus findings](https://github.com/Universal-Commerce-Protocol/ucp/pull/572#issuecomment-4934015786).
- **July 23, 2026 — core primitive merged.** UCP merged [PR #572](https://github.com/Universal-Commerce-Protocol/ucp/pull/572), adding the generic `policies[]` envelope across Catalog, Cart, Checkout, and Order.
- **August 25, 2026 — stable release.** [UCP v2026-08-25](https://github.com/Universal-Commerce-Protocol/ucp/releases/tag/v2026-08-25) became the first stable release to ship `policies[]`; its release notes list #572 under Shopping Enhancements.

## What the stable release means

The stable release standardizes the generic `policies[]` container that this project extends. It does **not** adopt `io.github.yairsabag.policy.cancellation` as a UCP shared type. The extension remains independently versioned and published under a namespace controlled by this repository owner.

If the design is later adopted into the `dev.ucp.*` namespace, that would be a separate standardization event and may require a namespace migration.
