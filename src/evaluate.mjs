const DURATION_RE = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

export function durationToMilliseconds(value) {
  const match = DURATION_RE.exec(value);
  if (!match || !match.slice(1).some(Boolean)) {
    throw new TypeError(`Unsupported duration: ${value}`);
  }
  const [, days = "0", hours = "0", minutes = "0", seconds = "0"] = match;
  return (((Number(days) * 24 + Number(hours)) * 60 + Number(minutes)) * 60 + Number(seconds)) * 1000;
}

function defaultOutcomeFor(policy, trigger) {
  if (trigger === "seller_cancel") {
    return { kind: "percentage", buyer_bps: 10000 };
  }
  if (trigger === "no_show") {
    return policy.rules?.buyer_cancel?.after_last_tier ?? { kind: "percentage", buyer_bps: 0 };
  }
  return null;
}

export function evaluateCancellation(policy, options) {
  if (!policy || policy.type !== "io.github.yairsabag.policy.cancellation") {
    throw new TypeError("Expected an io.github.yairsabag.policy.cancellation policy");
  }

  const trigger = options?.trigger ?? "buyer_cancel";
  const at = Date.parse(options?.at);
  if (!Number.isFinite(at)) throw new TypeError("options.at must be an RFC 3339 timestamp");

  const payout = policy.payout ?? { method: "original", multiplier_bps: 10000 };
  if (trigger !== "buyer_cancel") {
    const outcome = policy.rules?.[trigger] ?? defaultOutcomeFor(policy, trigger);
    return outcome ? { trigger, outcome, payout } : null;
  }

  const schedule = policy.rules?.buyer_cancel;
  if (!schedule) return null;

  const anchor = Date.parse(policy.anchor);
  if (!Number.isFinite(anchor)) throw new TypeError("policy.anchor must be an RFC 3339 timestamp");

  const purchase = options?.purchasedAt == null ? null : Date.parse(options.purchasedAt);
  for (const tier of schedule.tiers) {
    const relativeTo = tier.relative_to ?? "anchor";
    let deadline;
    if (relativeTo === "anchor") {
      deadline = anchor - durationToMilliseconds(tier.until);
    } else if (relativeTo === "purchase") {
      if (!Number.isFinite(purchase)) {
        throw new TypeError("purchasedAt is required for purchase-relative tiers");
      }
      deadline = purchase + durationToMilliseconds(tier.until);
    } else {
      throw new TypeError(`Unsupported relative_to value: ${relativeTo}`);
    }

    if (at <= deadline) {
      return { trigger, outcome: tier.outcome, payout, matched_until: tier.until, relative_to: relativeTo };
    }
  }

  return {
    trigger,
    outcome: schedule.after_last_tier ?? { kind: "percentage", buyer_bps: 0 },
    payout
  };
}
