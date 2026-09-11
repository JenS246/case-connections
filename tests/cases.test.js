import test from "node:test";
import assert from "node:assert/strict";
import { CASES } from "../site/cases.js";
import { availableCombinations, essentialProgress, findCombination, pairKey } from "../site/game-core.js";

test("the launch collection contains twelve distinct, sourced cases", () => {
  assert.equal(CASES.length, 12);
  assert.equal(new Set(CASES.map((record) => record.id)).size, 12);
  assert.ok(CASES.every((record) => record.opinionUrl.startsWith("https://")));
  assert.ok(CASES.every((record) => record.citation && record.court && record.year));
});

test("combination lookup is order independent", () => {
  const record = CASES[0];
  assert.equal(pairKey("train", "platform"), pairKey("platform", "train"));
  assert.equal(findCombination(record, "train", "platform")?.result, "rail station");
  assert.equal(findCombination(record, "platform", "train")?.result, "rail station");
});

test("every combination graph and reveal target is reachable", () => {
  for (const record of CASES) {
    const discovered = new Set(record.startingWords);
    let changed = true;

    while (changed) {
      changed = false;
      for (const combination of record.combinations) {
        if (
          discovered.has(combination.items[0]) &&
          discovered.has(combination.items[1]) &&
          !discovered.has(combination.result)
        ) {
          discovered.add(combination.result);
          changed = true;
        }
      }
    }

    for (const combination of record.combinations) {
      assert.ok(discovered.has(combination.result), `${record.id}: unreachable ${combination.result}`);
    }
    for (const required of record.requiredDiscoveries) {
      assert.ok(discovered.has(required), `${record.id}: required discovery is unreachable: ${required}`);
    }
    assert.ok(record.revealThreshold > 0);
    assert.ok(record.revealThreshold <= record.requiredDiscoveries.length);
    assert.ok(essentialProgress(record, discovered) >= record.revealThreshold);
  }
});

test("hints expose only combinations currently possible and not already known", () => {
  const record = CASES[0];
  const discovered = new Set(record.startingWords);
  const options = availableCombinations(record, discovered);
  assert.ok(options.length > 0);
  assert.ok(options.every((entry) => entry.items.every((item) => discovered.has(item))));
  assert.ok(options.every((entry) => !discovered.has(entry.result)));
});

test("case records include concise reveal copy and touch-sized starting sets", () => {
  for (const record of CASES) {
    assert.ok(record.startingWords.length >= 4 && record.startingWords.length <= 6);
    assert.ok(record.everydayOrigin.length >= 40);
    assert.ok(record.caseSummary.length >= 80);
    assert.ok(record.legalIssue.length >= 35);
  }
});
