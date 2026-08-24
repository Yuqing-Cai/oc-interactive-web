import "./styles.css";

import {
  EMPTY_DEFAULT_EXPERIENCE_CONFIG,
  bindTransientKeyLifecycle,
  createTransientKeyHolder,
  providerRegistry,
  resolveDefaultExperience,
} from "./api";
import {
  AXES,
  deriveCausality,
  getAxis,
  type Axis,
  type AxisId,
  type CausalityResult,
  type FateSelection,
  type Locale,
  type OptionId,
} from "./domain";
import {
  CHAPTERS,
  CHAPTER_BY_ID,
  UI_COPY,
  createInitialState,
  generateLocalPreview,
  hasNarrativeAnchors,
  interpolate,
  persistSafeDraft,
  selectedCount,
  selectedStructureCount,
  type AppState,
  type ChapterId,
  type SelectionState,
  type UiCopy,
} from "./app";

const appRoot = document.querySelector<HTMLDivElement>("#app");
if (!appRoot) throw new Error("Application root was not found.");
const root: HTMLDivElement = appRoot;

const state: AppState = createInitialState();
const transientKey = createTransientKeyHolder();
const disposeKeyLifecycle = bindTransientKeyLifecycle(transientKey);
const defaultExperience = resolveDefaultExperience(
  EMPTY_DEFAULT_EXPERIENCE_CONFIG,
);
const isPreviewBuild =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_GENERATION === "true";

type Child = Node | string | null | undefined | false;

function append(parent: ParentNode, ...children: readonly Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(
      typeof child === "string" ? document.createTextNode(child) : child,
    );
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function makeButton(
  label: string,
  className: string,
  onClick: (event: MouseEvent) => void,
): HTMLButtonElement {
  const button = el("button", className, label);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

function currentCopy(): UiCopy {
  return UI_COPY[state.locale];
}

function readTransientKey(): string {
  if (!transientKey.has()) return "";
  return transientKey.withKey((value) => value);
}

function clearKeyInput(): void {
  transientKey.clear();
  const input = document.querySelector<HTMLInputElement>("[data-key-input]");
  if (input) input.value = "";
}

function commit(
  change: () => void,
  persist = true,
  focusKey?: string,
): void {
  const active = document.activeElement;
  const restoreKey =
    focusKey ??
    (active instanceof HTMLElement ? active.dataset.focusKey : undefined);
  change();
  if (persist) persistSafeDraft(state);
  render();
  if (restoreKey) {
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-focus-key="${restoreKey}"]`)
        ?.focus({ preventScroll: true });
    });
  }
}

function closeFateDrawer(): void {
  document.querySelector<HTMLDialogElement>("dialog.drawer[open]")?.close();
}

function scrollToElement(selector: string, block: ScrollLogicalPosition): void {
  requestAnimationFrame(() => {
    document.querySelector(selector)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block,
    });
  });
}

function switchChapter(chapterId: ChapterId): void {
  commit(() => {
    state.activeChapter = chapterId;
    state.notice = "";
  }, true, `chapter-${chapterId}`);
  scrollToElement(`#chapter-${chapterId}`, "start");
}

function stripOptionCode(label: string): string {
  return label.replace(/^[A-Z]+\d*\s+/, "").trim();
}

function axisDisplayName(axis: Axis, locale: Locale): string {
  const label = axis.copy[locale].label;
  return label.replace(new RegExp(`^${axis.code}\\s*=\\s*`), "");
}

function selectedLabel(axisId: AxisId): string | null {
  const axis = getAxis(axisId);
  const optionId = state.selections[axisId];
  const option = optionId
    ? axis.options.find((entry) => entry.id === optionId)
    : undefined;
  return option ? stripOptionCode(option.copy[state.locale].label) : null;
}

function currentCausality(): CausalityResult {
  const selections = AXES.flatMap((axis) => {
    const optionId = state.selections[axis.id];
    return optionId ? [{ axisId: axis.id, optionId } satisfies FateSelection] : [];
  });
  return deriveCausality(selections, state.locale);
}

function setSelection(axisId: AxisId, optionId: OptionId): void {
  commit(() => {
    state.selections = { ...state.selections, [axisId]: optionId };
    state.undoSelections = null;
    state.notice = "";
  });
}

function clearSelection(axisId: AxisId): void {
  commit(() => {
    const next = { ...state.selections };
    delete next[axisId];
    state.selections = next;
    state.undoSelections = null;
  }, true, `axis-help-${axisId}`);
}

function randomOption(axisId: AxisId): OptionId {
  const axis = getAxis(axisId);
  const index = Math.floor(Math.random() * axis.options.length);
  return axis.options[index]!.id;
}

function giveStarter(): void {
  commit(() => {
    const next = { ...state.selections };
    for (const axisId of ["world", "motive", "heroine"] as const) {
      if (!next[axisId]) next[axisId] = randomOption(axisId);
    }
    state.selections = next;
    state.activeChapter = "context";
    state.notice = "";
  }, true, "chapter-context");
  scrollToElement("#chapter-context", "start");
}

const GAP_PRIORITY: readonly Readonly<{
  target: AxisId;
  when: readonly AxisId[];
}>[] = [
  { target: "choice", when: ["world", "motive"] },
  { target: "exchange", when: ["choice", "power", "motive"] },
  { target: "time", when: ["body"] },
  { target: "finale", when: ["exchange", "time"] },
  { target: "dynamic", when: ["role", "heroine"] },
  { target: "love", when: ["heroine", "achilles"] },
  { target: "expression", when: ["sanity", "judgment"] },
  { target: "judgment", when: ["sanity", "expression"] },
];

function fillOneGap(): void {
  closeFateDrawer();
  const engineSuggestion = currentCausality().gaps[0]?.missingAxisIds[0];
  const suggestion = GAP_PRIORITY.find(
    ({ target, when }) =>
      !state.selections[target] && when.some((source) => state.selections[source]),
  );
  const fallback = AXES.find(
    (axis) => axis.kind === "structure" && !state.selections[axis.id],
  );
  const target = engineSuggestion ?? suggestion?.target ?? fallback?.id;
  if (!target) return;
  const optionId = randomOption(target);

  commit(() => {
    state.selections = {
      ...state.selections,
      [target]: optionId,
    };
    const chapter = CHAPTERS.find((entry) => entry.axisIds.includes(target));
    if (chapter) state.activeChapter = chapter.id;
    state.notice = "";
  }, true, `axis-${target}-${optionId}`);
  scrollToElement(`[data-axis-id="${target}"]`, "center");
}

function rerollEverything(): void {
  commit(() => {
    state.undoSelections = { ...state.selections };
    state.selections = Object.fromEntries(
      AXES.map((axis) => [axis.id, randomOption(axis.id)]),
    ) as SelectionState;
    state.notice = "";
  });
}

function undoReroll(): void {
  if (!state.undoSelections) return;
  commit(() => {
    state.selections = { ...state.undoSelections! };
    state.undoSelections = null;
  }, true, "reroll-all");
}

function goToAxis(axisId: AxisId): void {
  closeFateDrawer();
  const chapter = CHAPTERS.find((entry) => entry.axisIds.includes(axisId));
  if (!chapter) return;
  commit(() => {
    state.activeChapter = chapter.id;
  }, true, `axis-help-${axisId}`);
  scrollToElement(`[data-axis-id="${axisId}"]`, "center");
}

function renderTopbar(): HTMLElement {
  const copy = currentCopy();
  const bar = el("header", "topbar");
  const brand = el("div", "brand");
  append(
    brand,
    el("span", "brand-mark", "W→F"),
    el("span", "brand-name", copy.brand),
  );

  const actions = el("div", "topbar-actions");
  const help = makeButton(copy.help, "text-button", () => showGlobalHelp());
  const language = makeButton(
    state.locale === "zh" ? "EN" : "中",
    "icon-button",
    () => {
      commit(() => {
        state.locale = state.locale === "zh" ? "en" : "zh";
        if (isPreviewBuild && state.result) {
          state.result = generateLocalPreview(state);
        }
        state.notice = "";
      });
    },
  );
  language.dataset.focusKey = "language-switch";
  language.setAttribute("aria-label", copy.switchLanguage);
  append(actions, help, language);
  append(bar, brand, actions);
  return bar;
}

function renderScopePicker(): HTMLFieldSetElement {
  const copy = currentCopy();
  const fieldset = el("fieldset", "scope-picker");
  const legend = el("legend", "", copy.generationGoal);
  const options = el("div", "scope-options");
  const definitions = [
    {
      value: "opening" as const,
      title: copy.openingMode,
      description: copy.openingModeDesc,
    },
    {
      value: "timeline" as const,
      title: copy.timelineMode,
      description: copy.timelineModeDesc,
    },
  ];

  for (const definition of definitions) {
    const label = el("label", "scope-option");
    if (state.outputMode === definition.value) label.classList.add("is-selected");
    const input = el("input");
    input.type = "radio";
    input.name = "output-mode";
    input.value = definition.value;
    input.dataset.focusKey = `scope-${definition.value}`;
    input.checked = state.outputMode === definition.value;
    input.addEventListener("change", () => {
      commit(() => {
        state.outputMode = definition.value;
        state.notice = "";
      });
    });
    append(
      label,
      input,
      el("span", "scope-title", definition.title),
      el("span", "scope-desc", definition.description),
    );
    options.append(label);
  }

  append(fieldset, legend, options);
  return fieldset;
}

function renderIntro(): HTMLElement {
  const copy = currentCopy();
  const intro = el("section", "workspace-intro");
  const statement = el("div");
  append(
    statement,
    el("p", "eyebrow", copy.eyebrow),
    el("h1", "workspace-title", copy.title),
    el("p", "workspace-lede", copy.lede),
  );
  append(intro, statement, renderScopePicker());
  return intro;
}

function chapterSelectionCount(chapterId: ChapterId): number {
  const chapter = CHAPTER_BY_ID.get(chapterId)!;
  return chapter.axisIds.filter((axisId) => state.selections[axisId]).length;
}

function renderChapterNav(): HTMLElement {
  const wrap = el("div", "chapter-nav-wrap");
  const nav = el("nav", "chapter-nav");
  nav.setAttribute("aria-label", state.locale === "zh" ? "命运轴章节" : "Fate axis chapters");

  for (const chapter of CHAPTERS) {
    const tab = el("button", "chapter-tab");
    tab.type = "button";
    if (state.activeChapter === chapter.id) {
      tab.setAttribute("aria-current", "step");
    }
    tab.dataset.focusKey = `chapter-${chapter.id}`;
    tab.addEventListener("click", () => {
      switchChapter(chapter.id);
    });
    append(
      tab,
      document.createTextNode(chapter.title[state.locale]),
      el("span", "chapter-count", String(chapterSelectionCount(chapter.id))),
    );
    nav.append(tab);
  }

  wrap.append(nav);
  return wrap;
}

function renderAxisCard(axis: Axis): HTMLFieldSetElement {
  const copy = currentCopy();
  const axisCopy = axis.copy[state.locale];
  const selected = state.selections[axis.id];
  const fieldset = el("fieldset", "axis-card");
  fieldset.dataset.axisId = axis.id;
  if (selected) fieldset.classList.add("is-active");

  const legend = el("legend", "sr-only", axisCopy.label);
  const header = el("div", "axis-header");
  const badge = el(
    "span",
    "axis-code",
    axis.code === "Palette" ? "TXT" : axis.code,
  );
  const heading = el("div");
  append(
    heading,
    el("h3", "axis-name", axisDisplayName(axis, state.locale)),
    el("p", "axis-question", axisCopy.description),
  );
  const help = makeButton("?", "axis-help", () => showAxisHelp(axis));
  help.dataset.focusKey = `axis-help-${axis.id}`;
  help.setAttribute(
    "aria-label",
    `${copy.learnAxis}: ${axisDisplayName(axis, state.locale)}`,
  );
  append(header, badge, heading, help);

  const options = el("div", "axis-options");
  for (const option of axis.options) {
    const optionCopy = option.copy[state.locale];
    const label = el("label", "option-card");
    if (selected === option.id) label.classList.add("is-selected");
    const input = el("input");
    input.type = "radio";
    input.name = `axis-${axis.id}`;
    input.value = option.id;
    input.dataset.focusKey = `axis-${axis.id}-${option.id}`;
    input.checked = selected === option.id;
    input.addEventListener("change", () => setSelection(axis.id, option.id));
    const text = el("span");
    append(
      text,
      el("span", "option-title", optionCopy.label),
      el("span", "option-desc", optionCopy.summary),
    );
    append(label, input, el("span", "option-indicator"), text);
    options.append(label);
  }

  append(fieldset, legend, header, options);
  if (selected) {
    const clear = makeButton(copy.clearAxis, "clear-axis", () =>
      clearSelection(axis.id),
    );
    clear.dataset.focusKey = `clear-${axis.id}`;
    fieldset.append(clear);
  }
  return fieldset;
}

function renderChapterPanel(): HTMLElement {
  const copy = currentCopy();
  const chapter = CHAPTER_BY_ID.get(state.activeChapter)!;
  const panel = el("section", "chapter-panel");
  panel.id = `chapter-${chapter.id}`;

  const heading = el("div", "chapter-heading");
  const titleGroup = el("div");
  const chapterTitle = el("h2", "chapter-title", chapter.title[state.locale]);
  chapterTitle.id = `chapter-title-${chapter.id}`;
  panel.setAttribute("aria-labelledby", chapterTitle.id);
  append(
    titleGroup,
    el("p", "chapter-kicker", `${chapter.index} / ${CHAPTERS.length}`),
    chapterTitle,
    el("p", "chapter-summary", chapter.summary[state.locale]),
  );
  heading.append(titleGroup);

  const grid = el("div", "axis-grid");
  for (const axisId of chapter.axisIds) {
    grid.append(renderAxisCard(getAxis(axisId)));
  }

  const footer = el("div", "chapter-footer");
  const actions = el("div", "chapter-actions");
  const starter = makeButton(copy.getStarter, "secondary-button", giveStarter);
  starter.dataset.focusKey = "starter";
  const gap = makeButton(copy.fillGap, "secondary-button", fillOneGap);
  gap.dataset.focusKey = "fill-gap";
  const reroll = makeButton(copy.reroll, "quiet-button", rerollEverything);
  reroll.dataset.focusKey = "reroll-all";
  const undo = state.undoSelections
    ? makeButton(copy.undo, "quiet-button", undoReroll)
    : null;
  if (undo) undo.dataset.focusKey = "undo-reroll";
  append(actions, starter, gap, reroll, undo);

  const chapterIndex = CHAPTERS.findIndex((entry) => entry.id === chapter.id);
  const navigation = el("div", "chapter-actions");
  const previous = CHAPTERS[chapterIndex - 1];
  const next = CHAPTERS[chapterIndex + 1];
  if (previous) {
    navigation.append(
      makeButton(copy.previous, "quiet-button", () => {
        switchChapter(previous.id);
      }),
    );
  }
  if (next) {
    navigation.append(
      makeButton(copy.next, "secondary-button", () => {
        switchChapter(next.id);
      }),
    );
  }

  append(footer, actions, navigation);
  append(panel, heading, grid, footer);
  return panel;
}

interface RelationDisplay {
  readonly type: "cause" | "co-create" | "tension";
  readonly text: string;
}

function relations(result: CausalityResult): readonly RelationDisplay[] {
  return result.branches.map((relation) => ({
    type:
      relation.kind === "constraint" || relation.kind === "reciprocal"
        ? "tension"
        : relation.kind === "co-created" || relation.kind === "convergent"
          ? "co-create"
          : "cause",
    text: relation.text,
  }));
}

function linkageCount(): number {
  const result = currentCausality();
  return result.trunk.length + result.branches.length;
}

function renderFateBody(): HTMLElement {
  const copy = currentCopy();
  const body = el("div", "fate-body");
  const result = currentCausality();
  if (result.status === "empty") {
    const empty = el("div", "fate-empty");
    append(
      empty,
      el("span", "fate-empty-glyph", "· — ·"),
      el("p", "", copy.emptyFate),
    );
    body.append(empty);
    return body;
  }

  if (result.trunk.length > 0) {
    const chainHeading = el("div", "relation-heading");
    append(
      chainHeading,
      document.createTextNode(copy.causalSpine),
      el("span", "", `${result.trunk.length}`),
    );
    body.append(chainHeading);

    const chain = el("ol", "fate-chain");
    for (const relation of result.trunk) {
      const item = el("li", "fate-step");
      const content = el("div", "fate-step-content");
      const sourceCodes = relation.sources
        .map((node) => node.axisCode)
        .join(" + ");
      const targetCodes = relation.targets
        .map((node) => node.axisCode)
        .join(" + ");
      append(
        content,
        el("span", "fate-step-role", `${sourceCodes} → ${targetCodes}`),
        el("span", "fate-step-value", relation.text),
      );
      append(item, el("span", "fate-knot"), content);
      chain.append(item);
    }
    body.append(chain);
  } else {
    const selectedBlock = el("section", "fate-selected-block");
    selectedBlock.append(el("p", "relation-heading", copy.selectedSignals));
    const selectedList = el("div", "fate-selected-list");
    for (const node of result.selected) {
      selectedList.append(
        el("span", "fate-selected-chip", `${node.axisCode} · ${node.label}`),
      );
    }
    selectedBlock.append(selectedList);
    body.append(selectedBlock);
  }

  if (result.gaps.length > 0) {
    const gapBlock = el("section", "relation-block");
    const heading = el("div", "relation-heading");
    append(
      heading,
      document.createTextNode(copy.openKnots),
      el("span", "", `${result.gaps.length}`),
    );
    const list = el("ul", "gap-list");
    for (const gap of result.gaps.slice(0, 3)) {
      const item = el("li", "gap-item");
      const missing = gap.missingAxisIds[0];
      item.append(el("p", "", gap.text));
      if (missing) {
        item.append(
          makeButton(
            `${copy.chooseAxis} ${getAxis(missing).code}`,
            "clear-axis",
            () => goToAxis(missing),
          ),
        );
      }
      list.append(item);
    }
    append(gapBlock, heading, list);
    body.append(gapBlock);
  }

  const branches = relations(result);
  if (branches.length > 0) {
    const block = el("section", "relation-block");
    const heading = el("div", "relation-heading");
    append(
      heading,
      document.createTextNode(copy.relations),
      el("span", "", `${branches.length}`),
    );
    const list = el("ul", "relation-list");
    for (const relation of branches.slice(0, 3)) {
      const item = el(
        "li",
        `relation-item${relation.type === "tension" ? " is-tension" : ""}`,
      );
      append(
        item,
        el(
          "span",
          "relation-mark",
          relation.type === "co-create"
            ? "＋"
            : relation.type === "tension"
              ? "≈"
              : "→",
        ),
        el("span", "relation-copy", relation.text),
      );
      list.append(item);
    }
    append(block, heading, list);
    body.append(block);
  }

  const hasUnselectedStructure = AXES.some(
    (axis) => axis.kind === "structure" && !state.selections[axis.id],
  );
  if (hasUnselectedStructure) {
    body.append(
      makeButton(copy.fillGap, "secondary-button fate-panel-action", fillOneGap),
    );
  }
  return body;
}

function renderFatePanel(): HTMLElement {
  const copy = currentCopy();
  const panel = el("aside", "fate-panel");
  const head = el("div", "fate-panel-head");
  const titles = el("div");
  append(
    titles,
    el("h2", "fate-panel-title", copy.fatePanel),
    el("p", "fate-panel-desc", currentCausality().summary),
  );
  append(
    head,
    titles,
    el("span", "fate-badge", `${linkageCount()} ${copy.linkage}`),
  );
  append(panel, head, renderFateBody());
  return panel;
}

function renderMobileFateButton(): HTMLButtonElement {
  const copy = currentCopy();
  const button = el("button", "mobile-fate-button");
  button.type = "button";
  append(
    button,
    el(
      "span",
      "",
      `${linkageCount()} ${copy.linkage} · ${copy.showFate}`,
    ),
    document.createTextNode("→"),
  );
  button.addEventListener("click", showFateDrawer);
  return button;
}

function renderConnectionCard(): HTMLElement {
  const copy = currentCopy();
  const card = el("section", "connection-card");
  const label = el("div", "field-label", copy.connection);
  label.id = "connection-label";
  const tabs = el("div", "connection-tabs");
  tabs.setAttribute("role", "group");
  tabs.setAttribute("aria-labelledby", label.id);

  for (const mode of ["default", "custom"] as const) {
    const tab = el(
      "button",
      "connection-tab",
      mode === "default" ? copy.defaultMode : copy.customMode,
    );
    tab.type = "button";
    tab.dataset.focusKey = `connection-${mode}`;
    tab.setAttribute("aria-pressed", String(state.connectionMode === mode));
    tab.addEventListener("click", () => {
      commit(() => {
        state.connectionMode = mode;
        if (mode === "default") transientKey.clear();
        state.notice = "";
      });
    });
    tabs.append(tab);
  }

  append(card, label, tabs);
  if (state.connectionMode === "default") {
    const status = el("div", "connection-status");
    const dot = el(
      "span",
      `status-dot${isPreviewBuild ? " is-ready" : ""}`,
    );
    const text = el("div");
    append(
      text,
      el(
        "strong",
        "",
        isPreviewBuild ? copy.localPreviewReady : copy.defaultUnavailable,
      ),
      el(
        "span",
        "",
        isPreviewBuild
          ? copy.localPreviewDesc
          : copy.defaultUnavailableDesc,
      ),
    );
    append(status, dot, text);
    card.append(status);
    return card;
  }

  const fields = el("div", "connection-fields");
  const providers = providerRegistry.list();

  const providerGroup = el("label", "field-group");
  append(providerGroup, el("span", "field-label", copy.provider));
  const providerSelect = el("select", "select");
  providerSelect.dataset.focusKey = "provider-select";
  providerSelect.disabled = providers.length === 0;
  const emptyOption = el("option", "", copy.noProvider);
  emptyOption.value = "";
  providerSelect.append(emptyOption);
  for (const provider of providers) {
    const option = el("option", "", provider.displayName);
    option.value = provider.id;
    option.selected = state.providerId === provider.id;
    providerSelect.append(option);
  }
  providerSelect.addEventListener("change", () => {
    commit(() => {
      state.providerId = providerSelect.value;
      state.modelId = "";
      transientKey.clear();
      state.notice = "";
    });
  });
  providerGroup.append(providerSelect);

  const modelGroup = el("label", "field-group");
  append(modelGroup, el("span", "field-label", copy.modelId));
  const modelInput = el("input", "input");
  modelInput.type = "text";
  modelInput.value = state.modelId;
  modelInput.disabled = !state.providerId;
  modelInput.autocomplete = "off";
  modelInput.addEventListener("input", () => {
    state.modelId = modelInput.value.slice(0, 160);
    persistSafeDraft(state);
  });
  modelGroup.append(modelInput);

  const keyGroup = el("div", "field-group");
  const keyLabel = el("label", "field-label", copy.apiKey);
  keyLabel.htmlFor = "ephemeral-api-key";
  keyGroup.append(keyLabel);
  const keyRow = el("div", "key-row");
  const keyInput = el("input", "input");
  keyInput.id = "ephemeral-api-key";
  keyInput.type = "password";
  keyInput.dataset.keyInput = "true";
  keyInput.value = readTransientKey();
  keyInput.disabled = !state.providerId;
  keyInput.autocomplete = "off";
  keyInput.setAttribute("autocapitalize", "off");
  keyInput.setAttribute("aria-describedby", "key-privacy-note");
  keyInput.spellcheck = false;
  keyInput.addEventListener("input", () => {
    if (!keyInput.value.trim()) {
      transientKey.clear();
      return;
    }
    transientKey.set(keyInput.value);
  });
  const clear = makeButton(copy.clearKey, "secondary-button", clearKeyInput);
  clear.disabled = !state.providerId;
  append(keyRow, keyInput, clear);
  keyGroup.append(keyRow);

  const route = el("p", "privacy-note");
  const provider = state.providerId
    ? providerRegistry.get(state.providerId)
    : undefined;
  route.textContent = `${copy.route}: ${provider ? `${copy.routeBrowser} → ${provider.endpointOrigin}` : copy.routeEmpty}`;

  const privacy = el("p", "privacy-note", copy.privacy);
  privacy.id = "key-privacy-note";
  append(
    fields,
    providerGroup,
    modelGroup,
    keyGroup,
    privacy,
    route,
  );
  card.append(fields);
  return card;
}

function canGenerate(): boolean {
  if (!hasNarrativeAnchors(state)) return false;
  if (isPreviewBuild) return true;
  if (state.connectionMode === "default") return defaultExperience.enabled;
  const provider = providerRegistry.get(state.providerId);
  return Boolean(
    provider?.supportsBrowserCors && state.modelId.trim() && transientKey.has(),
  );
}

function renderComposePanel(): HTMLElement {
  const copy = currentCopy();
  const panel = el("section", "compose-panel");
  const extraGroup = el("div", "field-group");
  const label = el("label", "field-label");
  label.htmlFor = "extra-prompt";
  append(
    label,
    document.createTextNode(copy.extraLabel),
    el("span", "field-hint", copy.extraHint),
  );
  const textarea = el("textarea", "textarea");
  textarea.id = "extra-prompt";
  textarea.maxLength = 1200;
  textarea.placeholder = copy.extraPlaceholder;
  textarea.value = state.extraPrompt;
  const count = el("span", "field-count", `${state.extraPrompt.length} / 1200`);
  textarea.addEventListener("input", () => {
    state.extraPrompt = textarea.value.slice(0, 1200);
    count.textContent = `${state.extraPrompt.length} / 1200`;
    persistSafeDraft(state);
  });
  append(extraGroup, label, textarea, count);

  const actions = el("div", "compose-actions");
  const countText = interpolate(copy.selectedSummary, {
    count: selectedCount(state),
    structure: selectedStructureCount(state),
  });
  const summary = el("div", "selection-summary");
  append(
    summary,
    el("strong", "", countText),
    document.createElement("br"),
    document.createTextNode(copy.semanticRequirement),
  );

  const generateActions = el("div", "generate-actions");
  const generate = makeButton(
    isPreviewBuild ? copy.previewResult : copy.generate,
    "primary-button",
    beginGeneration,
  );
  generate.disabled = !canGenerate();
  append(generateActions, generate);
  append(actions, summary, generateActions);

  append(panel, extraGroup, renderConnectionCard(), actions);
  return panel;
}

function renderMobileActionBar(): HTMLElement {
  const copy = currentCopy();
  const bar = el("div", "mobile-action-bar");
  const summary = el("div", "mobile-action-summary");
  append(
    summary,
    el(
      "strong",
      "",
      `${copy.selected} ${selectedStructureCount(state)} ${copy.axes}`,
    ),
    document.createTextNode(copy.semanticRequirement),
  );
  const generate = makeButton(
    isPreviewBuild ? copy.previewResult : copy.generate,
    "primary-button",
    beginGeneration,
  );
  generate.disabled = !canGenerate();
  append(bar, summary, generate);
  return bar;
}

function renderEditor(): HTMLElement {
  const copy = currentCopy();
  const shell = el("div", "app-shell");
  shell.append(renderTopbar());

  const main = el("main", "main-frame");
  append(main, renderIntro(), renderChapterNav());
  const grid = el("div", "workspace-grid");
  const editorColumn = el("div");
  append(editorColumn, renderMobileFateButton(), renderChapterPanel());
  append(grid, editorColumn, renderFatePanel());
  append(main, grid, renderComposePanel());

  const status = el("div", "status-region", state.notice);
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  main.append(status);

  const footer = el("footer", "app-footer");
  append(
    footer,
    el(
      "p",
      "",
      state.locale === "zh"
        ? "代码与内容许可将在新版发布前分别明确。"
        : "Code and content licenses will be clarified separately before release.",
    ),
  );
  const repository = el("a", "", "GitHub");
  repository.href = "https://github.com/Yuqing-Cai/oc-fate-generator";
  repository.rel = "noreferrer";
  footer.append(repository);

  append(shell, main, renderMobileActionBar(), footer);
  return shell;
}

function beginGeneration(): void {
  const copy = currentCopy();
  if (!hasNarrativeAnchors(state)) {
    commit(() => {
      state.notice = `${copy.incomplete}：${copy.incompleteDetail}`;
    }, false);
    return;
  }

  if (!isPreviewBuild) {
    commit(() => {
      state.notice = copy.sourcePending;
    }, false);
    return;
  }

  commit(() => {
    state.result = generateLocalPreview(state);
    state.view = "result";
    state.notice = "";
  }, false, "result-title");
  window.scrollTo({ top: 0, behavior: "auto" });
}

function renderResult(): HTMLElement {
  const copy = currentCopy();
  const result = state.result;
  if (!result) {
    state.view = "editor";
    return renderEditor();
  }

  const shell = el("div", "app-shell result-view");
  shell.append(renderTopbar());
  const main = el("main", "main-frame");
  const head = el("header", "result-head");
  const titleGroup = el("div");
  const resultTitle = el("h1", "result-title", result.title);
  resultTitle.tabIndex = -1;
  resultTitle.dataset.focusKey = "result-title";
  append(
    titleGroup,
    el("p", "eyebrow", copy.resultEyebrow),
    resultTitle,
    el(
      "p",
      "result-meta",
      isPreviewBuild ? copy.sourceLocal : copy.sourcePending,
    ),
  );

  const toolbar = el("div", "result-toolbar");
  append(
    toolbar,
    makeButton(copy.backToAxes, "secondary-button", () => {
      commit(() => {
        state.view = "editor";
      }, false, `chapter-${state.activeChapter}`);
      window.scrollTo({ top: 0, behavior: "auto" });
    }),
    makeButton(copy.copyAll, "quiet-button", async (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      try {
        await navigator.clipboard.writeText(result.markdown);
        const original = button.textContent;
        button.textContent = copy.copied;
        window.setTimeout(() => {
          button.textContent = original;
        }, 1400);
      } catch {
        state.notice = copy.copyFailed;
        const status = document.querySelector<HTMLElement>(".status-region");
        if (status) status.textContent = state.notice;
      }
    }),
    makeButton(copy.download, "primary-button", () => {
      const blob = new Blob([result.markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `oc-fate-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }),
  );
  append(head, titleGroup, toolbar);

  const grid = el("div", "result-grid");
  const outline = el("nav", "result-outline");
  outline.setAttribute("aria-label", copy.outline);
  const outlineList = el("ul", "result-outline-list");
  for (const section of result.sections) {
    const item = el("li");
    const anchor = el("a", "", section.title);
    anchor.href = `#result-${section.id}`;
    item.append(anchor);
    outlineList.append(item);
  }
  append(outline, el("p", "result-outline-title", copy.outline), outlineList);

  const content = el("article", "result-content");
  const fateSummary = el("div", "result-fate-summary");
  for (const axis of AXES) {
    const value = selectedLabel(axis.id);
    if (value) {
      fateSummary.append(
        el(
          "span",
          "result-fate-chip",
          `${axis.code === "Palette" ? "TXT" : axis.code} · ${value}`,
        ),
      );
    }
  }
  content.append(fateSummary);
  for (const section of result.sections) {
    const sectionElement = el("section", "result-section");
    sectionElement.id = `result-${section.id}`;
    sectionElement.append(el("h2", "", section.title));
    for (const paragraph of section.body) {
      sectionElement.append(el("p", "", paragraph.replaceAll("**", "")));
    }
    content.append(sectionElement);
  }

  append(grid, outline, content);
  const status = el("div", "status-region", state.notice);
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  append(main, head, grid, status);
  shell.append(main);
  return shell;
}

function showGlobalHelp(): void {
  const copy = currentCopy();
  const dialog = el("dialog", "modal");
  dialog.setAttribute("aria-labelledby", "global-help-title");
  const head = el("div", "modal-head");
  const close = makeButton("×", "icon-button", () => dialog.close());
  close.setAttribute("aria-label", copy.close);
  const title = el("h2", "modal-title", copy.helpTitle);
  title.id = "global-help-title";
  append(head, title, close);
  const body = el("div", "modal-body");
  const list = el("ol");
  for (const point of [copy.helpPointOne, copy.helpPointTwo, copy.helpPointThree]) {
    list.append(el("li", "", point));
  }
  append(body, el("p", "", copy.helpIntro), list);
  append(dialog, head, body);
  document.body.append(dialog);
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  dialog.showModal();
}

function showAxisHelp(axis: Axis): void {
  const copy = currentCopy();
  const axisCopy = axis.copy[state.locale];
  const dialog = el("dialog", "modal");
  dialog.setAttribute("aria-labelledby", `axis-help-title-${axis.id}`);
  const head = el("div", "modal-head");
  const close = makeButton("×", "icon-button", () => dialog.close());
  close.setAttribute("aria-label", copy.close);
  const title = el("h2", "modal-title", axisDisplayName(axis, state.locale));
  title.id = `axis-help-title-${axis.id}`;
  append(head, title, close);
  const body = el("div", "modal-body");
  append(body, el("p", "", axisCopy.intro));
  if (axis.kind === "palette") {
    body.append(el("p", "", copy.paletteOutside));
  } else if ("links" in axisCopy) {
    append(
      body,
      el("h3", "", state.locale === "zh" ? "联动方式" : "Linkage"),
      el("p", "", axisCopy.links),
    );
  }
  for (const option of axis.options) {
    body.append(el("h3", "", option.copy[state.locale].label));
    body.append(el("p", "", option.copy[state.locale].detail));
  }
  append(dialog, head, body);
  document.body.append(dialog);
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  dialog.showModal();
}

function showFateDrawer(): void {
  const copy = currentCopy();
  const dialog = el("dialog", "drawer");
  dialog.setAttribute("aria-labelledby", "fate-drawer-title");
  const handle = el("div", "drawer-handle");
  const head = el("div", "drawer-head");
  const close = makeButton("×", "icon-button", () => dialog.close());
  close.autofocus = true;
  close.setAttribute("aria-label", copy.close);
  const title = el("h2", "drawer-title", copy.fatePanel);
  title.id = "fate-drawer-title";
  append(head, title, close);
  const body = renderFateBody();
  body.className = "drawer-body";
  append(dialog, handle, head, body);
  document.body.append(dialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  dialog.showModal();
  requestAnimationFrame(() => {
    dialog.classList.add("is-open");
    close.focus({ preventScroll: true });
  });
}

function render(): void {
  document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
  document.title =
    state.locale === "zh" ? "命运轴 · OC Fate Loom" : "OC Fate Loom";
  root.replaceChildren(state.view === "result" ? renderResult() : renderEditor());
}

window.addEventListener("pageshow", clearKeyInput);
window.addEventListener("pagehide", clearKeyInput);
window.addEventListener("beforeunload", () => disposeKeyLifecycle(), {
  once: true,
});

render();
