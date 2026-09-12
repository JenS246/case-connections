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
  const discoveredResults = caseRecord.combinations
    .map((combination) => combination.result)
    .filter((result) => known.has(result));
  return new Set(discoveredResults).size;
}

export function createCaseDeck(caseCount, excludedIndex, random = Math.random) {
  const deck = Array.from({ length: caseCount }, (_, index) => index).filter(
    (index) => index !== excludedIndex
  );

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

export function createCaseNavigator(caseCount, initialIndex = 0, random = Math.random) {
  let history = [initialIndex];
  let position = 0;
  let deck = createCaseDeck(caseCount, initialIndex, random);

  return {
    current: () => history[position],
    position: () => position,
    canGoBack: () => position > 0,
    previous: () => {
      if (position > 0) position -= 1;
      return history[position];
    },
    next: () => {
      if (position < history.length - 1) {
        position += 1;
        return history[position];
      }

      if (deck.length === 0) {
        deck = createCaseDeck(caseCount, history[position], random);
      }

      const nextIndex = deck.shift() ?? history[position];
      history.push(nextIndex);
      position += 1;
      return nextIndex;
    }
  };
}
