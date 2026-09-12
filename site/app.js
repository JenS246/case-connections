import { CASES } from "./cases.js";
import {
  availableCombinations,
  createCaseNavigator,
  essentialProgress,
  findCombination
} from "./game-core.js";

const elements = {
  roundLabel: document.querySelector("#round-label"),
  tray: document.querySelector("#word-tray"),
  feedback: document.querySelector("#feedback"),
  firstSelection: document.querySelector("#first-selection"),
  secondSelection: document.querySelector("#second-selection"),
  clearButton: document.querySelector("#clear-button"),
  discoveryList: document.querySelector("#discovery-list"),
  progressStitches: document.querySelector("#progress-stitches"),
  hintButton: document.querySelector("#hint-button"),
  restartButton: document.querySelector("#restart-button"),
  previousCaseButton: document.querySelector("#previous-case-button"),
  nextCaseButton: document.querySelector("#next-case-button"),
  viewResultsButton: document.querySelector("#view-results-button"),
  howButton: document.querySelector("#how-button"),
  howDialog: document.querySelector("#how-dialog"),
  revealDialog: document.querySelector("#reveal-dialog"),
  revealName: document.querySelector("#reveal-case-name"),
  revealCitation: document.querySelector("#reveal-citation"),
  revealOrigin: document.querySelector("#reveal-origin"),
  revealSummary: document.querySelector("#reveal-summary"),
  revealIssue: document.querySelector("#reveal-issue"),
  opinionLink: document.querySelector("#opinion-link"),
  revealNextButton: document.querySelector("#reveal-next-button")
};

const caseNavigator = createCaseNavigator(CASES.length, 0);

const state = {
  caseIndex: 0,
  roundNumber: 1,
  discovered: [],
  discoveries: [],
  selected: [],
  newest: null,
  revealShown: false
};

function currentCase() {
  return CASES[state.caseIndex];
}

function navigateCase(direction) {
  const caseIndex = direction === "previous" ? caseNavigator.previous() : caseNavigator.next();
  startRound(caseIndex);
}

function updateCaseNavigation() {
  elements.previousCaseButton.disabled = !caseNavigator.canGoBack();
}

function startRound(caseIndex) {
  state.caseIndex = caseIndex;
  state.roundNumber = caseNavigator.position() + 1;
  state.discovered = [...currentCase().startingWords];
  state.discoveries = [];
  state.selected = [];
  state.newest = null;
  state.revealShown = false;
  elements.viewResultsButton.hidden = true;
  elements.roundLabel.textContent = `Case file ${String(state.roundNumber).padStart(2, "0")}`;
  setFeedback("Start with any two notes.", "neutral");
  updateCaseNavigation();
  render();
}

function restartRound() {
  state.discovered = [...currentCase().startingWords];
  state.discoveries = [];
  state.selected = [];
  state.newest = null;
  state.revealShown = false;
  elements.viewResultsButton.hidden = true;
  setFeedback("The file is clean. Build your theory again.", "neutral");
  render();
}

function setFeedback(message, tone = "neutral") {
  elements.feedback.textContent = message;
  elements.feedback.dataset.tone = tone;
}

function updateSelection(word) {
  if (state.selected.includes(word)) {
    state.selected = state.selected.filter((item) => item !== word);
    setFeedback(`${word} returned to the tray.`, "neutral");
    render();
    return;
  }

  if (state.selected.length === 0) {
    state.selected = [word];
    setFeedback("", "neutral");
    render();
    return;
  }

  state.selected.push(word);
  renderSelection();
  window.setTimeout(resolveSelection, prefersReducedMotion() ? 0 : 180);
}

function resolveSelection() {
  const [first, second] = state.selected;
  const combination = findCombination(currentCase(), first, second);

  if (!combination) {
    setFeedback("No identified connection. Test a new theory", "miss");
    elements.tray.classList.remove("tray-miss");
    void elements.tray.offsetWidth;
    elements.tray.classList.add("tray-miss");
    state.selected = [];
    render();
    return;
  }

  const alreadyKnown = state.discovered.includes(combination.result);
  if (!alreadyKnown) {
    state.discovered.push(combination.result);
    state.discoveries.push({
      first: combination.items[0],
      second: combination.items[1],
      result: combination.result
    });
    state.newest = combination.result;
    setFeedback("", "success");
  } else {
    setFeedback(`${combination.result} is already in your notes.`, "neutral");
  }

  state.selected = [];
  render();
  window.setTimeout(() => {
    state.newest = null;
    const newestCard = elements.tray.querySelector(".word-card.is-new");
    newestCard?.classList.remove("is-new");
  }, 720);
  maybeRevealCase();
}

function render() {
  renderSelection();
  renderTray();
  renderDiscoveries();
  renderProgress();
}

function renderSelection() {
  elements.firstSelection.textContent = state.selected[0] ?? "";
  elements.secondSelection.textContent = state.selected[1] ?? "";
  elements.firstSelection.classList.toggle("has-value", Boolean(state.selected[0]));
  elements.secondSelection.classList.toggle("has-value", Boolean(state.selected[1]));
  elements.clearButton.disabled = state.selected.length === 0;
}

function renderTray() {
  elements.tray.replaceChildren();
  state.discovered.forEach((word, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "word-card";
    button.textContent = word;
    button.dataset.word = word;
    button.style.setProperty("--tilt", `${[-1.1, 0.6, -0.35, 0.9, -0.65][index % 5]}deg`);
    button.classList.toggle("is-selected", state.selected.includes(word));
    button.classList.toggle("is-new", state.newest === word);
    button.setAttribute("aria-pressed", String(state.selected.includes(word)));
    button.setAttribute("aria-label", `${word}${state.selected.includes(word) ? ", selected" : ""}`);
    button.addEventListener("click", () => updateSelection(word));
    elements.tray.append(button);
  });
}

function renderDiscoveries() {
  elements.discoveryList.replaceChildren();

  if (state.discoveries.length === 0) {
    return;
  }

  [...state.discoveries].reverse().forEach((entry) => {
    const item = document.createElement("li");
    const equation = document.createElement("span");
    equation.className = "discovery-equation";
    equation.textContent = `${entry.first} + ${entry.second}`;
    const result = document.createElement("strong");
    result.textContent = entry.result;
    item.append(equation, result);
    elements.discoveryList.append(item);
  });
}

function renderProgress() {
  const progress = essentialProgress(currentCase(), state.discovered);
  const total = currentCase().revealThreshold;
  elements.progressStitches.setAttribute("aria-valuemax", String(total));
  elements.progressStitches.setAttribute("aria-valuenow", String(Math.min(progress, total)));
  elements.progressStitches.replaceChildren();

  for (let index = 0; index < total; index += 1) {
    const stitch = document.createElement("span");
    stitch.className = "progress-stitch";
    stitch.classList.toggle("is-complete", index < progress);
    elements.progressStitches.append(stitch);
  }
}

function showHint() {
  const options = availableCombinations(currentCase(), state.discovered);
  if (options.length === 0) {
    setFeedback("You have found every connection in this file.", "success");
    return;
  }

  const option = options[Math.floor(Math.random() * options.length)];
  setFeedback(`Think: ${option.result}.`, "hint");
}

function populateReveal() {
  const record = currentCase();
  elements.revealName.textContent = record.caseName;
  elements.revealCitation.textContent = `${record.court}, ${record.year} | ${record.citation}`;
  elements.revealOrigin.textContent = record.everydayOrigin;
  elements.revealSummary.textContent = record.caseSummary;
  elements.revealIssue.textContent = record.legalIssue;
  elements.opinionLink.href = record.opinionUrl;
}

function openReveal(delay = 0) {
  populateReveal();
  window.setTimeout(() => {
    if (!elements.revealDialog.open) {
      elements.revealDialog.showModal();
      elements.revealName.focus({ preventScroll: true });
      elements.revealDialog.scrollTop = 0;
    }
  }, delay);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function maybeRevealCase() {
  if (state.revealShown) return;
  const progress = essentialProgress(currentCase(), state.discovered);
  if (progress < currentCase().revealThreshold) return;

  state.revealShown = true;
  elements.viewResultsButton.hidden = false;
  openReveal(prefersReducedMotion() ? 0 : 450);
}

elements.clearButton.addEventListener("click", () => {
  state.selected = [];
  setFeedback("Selection cleared.", "neutral");
  render();
});

elements.hintButton.addEventListener("click", showHint);
elements.restartButton.addEventListener("click", restartRound);
elements.previousCaseButton.addEventListener("click", () => navigateCase("previous"));
elements.nextCaseButton.addEventListener("click", () => navigateCase("next"));
elements.viewResultsButton.addEventListener("click", () => openReveal());
elements.revealNextButton.addEventListener("click", () => {
  elements.revealDialog.close();
  navigateCase("next");
});
elements.howButton.addEventListener("click", () => elements.howDialog.showModal());

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.closeDialog}`)?.close());
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;
    if (!inside) dialog.close();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !document.querySelector("dialog[open]") && state.selected.length) {
    state.selected = [];
    setFeedback("Selection cleared.", "neutral");
    render();
  }
});

startRound(caseNavigator.current());
