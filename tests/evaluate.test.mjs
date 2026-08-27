import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateCancellation } from "../src/evaluate.mjs";

const fixture = JSON.parse(fs.readFileSync(new URL("../test-vectors/evaluation.json", import.meta.url), "utf8"));

for (const vector of fixture.vectors) {
  test(vector.name, () => {
    const result = evaluateCancellation(fixture.policies[vector.policy], {
      at: vector.at,
      purchasedAt: vector.purchased_at,
      trigger: vector.trigger
    });
    if (vector.expected_buyer_bps != null) {
      assert.equal(result.outcome.buyer_bps, vector.expected_buyer_bps);
    }
    if (vector.expected_kind != null) {
      assert.equal(result.outcome.kind, vector.expected_kind);
    }
  });
}
