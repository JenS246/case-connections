export function pairKey(first, second) {
  return [first, second]
    .map((item) => item.trim().toLocaleLowerCase())
    .sort((a, b) => a.localeCompare(b))
    .join("::");
}

export function createCombinationIndex(caseRecord) {
  return new Map(
    caseRecord.combinations.map((combination) => [
      pairKey(combination.items[0], combination.items[1]),
      combination
    ])
  );
}

export function findCombination(caseRecord, first, second) {
  return createCombinationIndex(caseRecord).get(pairKey(first, second)) ?? null;
}

export function availableCombinations(caseRecord, discovered) {
  const known = new Set(discovered);
  return caseRecord.combinations.filter(
    (combination) =>
      known.has(combination.items[0]) &&
      known.has(combination.items[1]) &&
      !known.has(combination.result)
  );
}

export function essentialProgress(caseRecord, discovered) {
  const known = new Set(discovered);
  return caseRecord.requiredDiscoveries.filter((item) => known.has(item)).length;
}
