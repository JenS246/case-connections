# Case Connections

Case Connections is a responsive legal word-combination game for law and paralegal studies students. Players connect ordinary facts, objects, and actions until the doctrinal thread reveals a real United States judicial opinion.

The visual language is a courtroom sketchbook: warm paper, irregular ink borders, handwritten short labels, marginal arrows, and faint CSS line drawings of a judge's bench, witness box, jury box, counsel table, and public gallery. The doodles stay behind the play surface and become quieter on narrow screens.

## How it works

- Every round begins with four to six ordinary word cards.
- Selecting two cards checks an order-independent, curated combination map.
- Successful results remain in the tray and can be combined again.
- Three successful discoveries unseal the case, keeping each round quick.
- Once the reveal threshold is reached, the game shows the case name, court, citation, plain-language explanation, legal issue, and a direct link to the published opinion or a reliable reproduction.
- New Round chooses a different case. Restart Round clears the current case. Hint suggests a possible discovery without naming the cards.
- After a player continues exploring a completed case, View Case Results reopens the full reveal.

The launch collection contains 12 researched opinions. Case facts and links live in `site/cases.js`; the interface never asks an AI model to invent legal content.

## Architecture

This is a dependency-free static site:

- `site/index.html` contains the semantic game, instruction dialog, and case-reveal panel.
- `site/styles.css` contains the responsive sketchbook design and courtroom doodles.
- `site/app.js` manages round state, selection, hints, sound, and dialogs.
- `site/game-core.js` contains order-independent combination and progress helpers.
- `site/cases.js` is the standalone case collection.
- `tests/cases.test.js` checks data quality, graph reachability, reveal targets, and combination behavior.

There is no backend, account, database, analytics service, cookie, runtime API, or secret. All state is temporary and remains in the browser.

## Run locally

Requires Node.js 22.13 or newer and Python 3.

```bash
npm install
npm run dev
```

Then open <http://127.0.0.1:4176>.

## Test

```bash
npm test
npm run build
```

## Add a new case

Add one object to the exported `CASES` array in `site/cases.js`. No game-interface code needs to change.

1. Read the actual opinion from a court, CourtListener, Justia full opinions, LII, or another reliable reproduction.
2. Record the exact case name, court, year, citation, and opinion URL.
3. Add four to six `startingWords`.
4. Add order-independent `combinations`. Each item used in a later combination must be a starting word or the result of an earlier reachable combination.
5. Choose the essential results in `requiredDiscoveries` and set a `revealThreshold` no higher than the number of required results.
6. Write the everyday origin, summary, and legal issue from the opinion without unverified details or quotations.
7. Run `npm test`. The graph test reports unreachable results or reveal targets. Open the opinion link in a browser before publishing any changed record.
8. Open the round locally and confirm that at least one complete path feels natural.

Example shape:

```js
{
  id: "case-slug",
  caseName: "Full Case Name",
  court: "Court Name",
  year: 2000,
  citation: "Reporter citation",
  opinionUrl: "https://reliable-opinion-source.example/opinion",
  startingWords: ["ordinary word", "another word"],
  combinations: [
    { items: ["ordinary word", "another word"], result: "new fact" }
  ],
  requiredDiscoveries: ["new fact"],
  revealThreshold: 1,
  everydayOrigin: "Verified everyday event.",
  caseSummary: "Verified plain-language summary.",
  legalIssue: "Verified issue or doctrine."
}
```

## Publishing

Pushes to `main` run the test suite and publish the `site/` directory with GitHub Pages.

- Production site: https://jens246.github.io/case-connections/
- Source repository: https://github.com/JenS246/case-connections
- Hosting: GitHub Pages
- Backend services: none
- Persistent data: none
- Backup and restore: clone the Git repository and redeploy the `main` branch

## Source policy

Every case includes a direct link to the published opinion or a reliable full-text reproduction. The game contains paraphrases for education and does not provide legal advice. Source links should be rechecked whenever case content changes.

## License

MIT
