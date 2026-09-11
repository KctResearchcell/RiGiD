/* =========================================================
   RiGiD PROTOTYPE WORKSPACE
   Persistent version — no dummy data, no window.prompt(),
   no window.confirm(). Every local action is immediate;
   Supabase persistence happens in the background and is
   rolled back automatically if it fails.

   Uses:
   GET  /get-rigid-work-data
   POST /update-rigid-work-data

   Optional (file uploads):
   Supabase Storage bucket — see PROTOTYPE_STORAGE_BUCKET
   below. Update that constant if your RiGiD project uses
   a different bucket name for workspace files.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
"use strict";

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let currentWorkId = getWorkId();
let prototypeData = null;
let toastTimer = null;

/* Background save state — guarantees "latest local state
   wins" even if several actions happen in quick succession. */
let saveInFlight = false;
let saveQueued = false;
let rollbackSnapshot = null;

/* Storage bucket used for uploaded Prototype resources.
   Update this if the rest of RiGiD uses a different bucket. */
const PROTOTYPE_STORAGE_BUCKET = "rigid-files";

/* =========================================================
   DATA
========================================================= */

function now() { return new Date().toISOString(); }
function id(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function arr(v) { return Array.isArray(v) ? v : []; }
function clone(v) { return JSON.parse(JSON.stringify(v)); }

function emptyData() {
    const t = now();
    return {
        title: "",
        description: "",
        status: "planning",
        version: "",
        versionTitle: "",
        versionDescription: "",
        tags: [],
        owner: "You",
        startedAt: t,
        updatedAt: t,
        progress: 0,
        progressPhase: "Planning phase",
        nextAction: { title: "", dueDate: "" },
        objective: "",
        designConcept: "",
        specifications: [],
        designDecisions: [],
        buildLog: [],
        components: [],
        tests: [],
        measurements: [],
        iterations: [],
        failures: [],
        modifications: [],
        improvements: [],
        outcome: "",
        resources: []
    };
}

/* Ensures every item in a list array has a stable, unique
   id. Never reassigns an id that already exists. */
function ensureIds(list, prefix) {
    const seen = new Set();
    return arr(list).map(item => {
        if (!item || typeof item !== "object") return item;
        let itemId = item.id;
        if (!itemId || seen.has(String(itemId))) {
            itemId = id(prefix);
        }
        seen.add(String(itemId));
        return { ...item, id: itemId };
    });
}

function normalizeData(source) {
    const base = emptyData();
    const s = source && typeof source === "object" ? source : {};
    return {
        ...base,
        ...s,
        tags: arr(s.tags).map(t => String(t)),
        specifications: ensureIds(s.specifications, "spec"),
        designDecisions: ensureIds(s.designDecisions, "decision"),
        buildLog: ensureIds(s.buildLog, "build"),
        components: ensureIds(s.components, "component"),
        tests: ensureIds(s.tests, "test"),
        measurements: ensureIds(s.measurements, "measurement"),
        iterations: ensureIds(s.iterations, "iteration"),
        failures: ensureIds(s.failures, "failure"),
        modifications: ensureIds(s.modifications, "modification"),
        improvements: ensureIds(s.improvements, "improvement"),
        resources: ensureIds(s.resources, "resource"),
        progress: Math.max(0, Math.min(100, Number(s.progress) || 0)),
        nextAction: {
            title: s.nextAction?.title || "",
            dueDate: s.nextAction?.dueDate || ""
        }
    };
}

/* =========================================================
   SUPABASE / WORK ID
========================================================= */

function getWorkId() {
    const p = new URLSearchParams(window.location.search);
    return p.get("work_id") || p.get("id") || p.get("work") || p.get("prototype");
}

function getSupabaseClient() {
    if (window.sb?.auth) return window.sb;
    if (window.supabaseClient?.auth) return window.supabaseClient;
    if (window.supabase?.auth) return window.supabase;
    return null;
}

async function getSession() {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is unavailable.");
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data?.session) throw new Error("Please log in again.");
    return data.session;
}

function getFunctionsURL() {
    if (typeof SUPABASE_FUNCTIONS_URL !== "undefined" && SUPABASE_FUNCTIONS_URL) {
        return SUPABASE_FUNCTIONS_URL;
    }
    if (window.SUPABASE_FUNCTIONS_URL) return window.SUPABASE_FUNCTIONS_URL;

    const client = getSupabaseClient();
    const url = client?.supabaseUrl || client?.rest?.url || "";
    if (url) {
        return url.replace("/rest/v1", "").replace(/\/$/, "") + "/functions/v1";
    }
    throw new Error("Supabase Functions URL is not configured.");
}

async function loadPrototypeData() {
    if (!currentWorkId) throw new Error("Work ID is missing from the URL.");

    const session = await getSession();
    const functionsURL = getFunctionsURL();

    const response = await fetch(`${functionsURL}/get-rigid-work-data`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ work_id: currentWorkId })
    });

    let result = null;
    try {
        result = await response.json();
    } catch {
        result = null;
    }
    if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to load Prototype data.");
    }

    const rigidData = result.data || {};
    const workspace = rigidData.workspace || {};
    const prototype =
        rigidData.prototype ||
        rigidData.prototype_data ||
        rigidData.prototypeData ||
        {};

    /* Saved Prototype fields always win. Workspace values are
       only used as a fallback when the Prototype record itself
       has nothing for that field yet. */
    prototypeData = normalizeData({
        ...prototype,
        title: prototype.title || workspace.title || result.work?.title || "",
        status: prototype.status || workspace.status || "planning",
        startedAt: prototype.startedAt || workspace.createdAt || now(),
        updatedAt: prototype.updatedAt || workspace.updatedAt || now()
    });
}

/* Sends an explicit snapshot to the backend. Passing the
   snapshot explicitly (rather than re-reading the live,
   mutable prototypeData mid-flight) keeps each request's
   payload well defined even while the user keeps editing. */
async function persistSnapshot(snapshot) {
    if (!currentWorkId) throw new Error("Work ID is missing.");

    const session = await getSession();
    const functionsURL = getFunctionsURL();

    const response = await fetch(`${functionsURL}/update-rigid-work-data`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
            work_id: currentWorkId,
            data: { prototype: snapshot }
        })
    });

    let result = null;
    try {
        result = await response.json();
    } catch {
        result = null;
    }
    if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to save Prototype data.");
    }
    return result;
}

/* =========================================================
   IMMEDIATE-COMMIT / BACKGROUND SAVE

   Every local change should feel instant:
     1. Mutate prototypeData.
     2. Call commitImmediate() — it stamps updatedAt,
        re-renders, shows a toast, closes nothing on its own
        (callers close their own modal), and queues a
        background save.
     3. The background save always sends the CURRENT
        prototypeData at the moment it actually goes out,
        so "latest local state wins" even if several edits
        land in quick succession.
     4. If the save ultimately fails, the state is rolled
        back to the snapshot captured right before the most
        recent change and an error toast is shown.
========================================================= */

function commitImmediate(message, previousSnapshot) {
    prototypeData.updatedAt = now();
    renderEverything();
    if (message) showToast(message);
    queueBackgroundSave(previousSnapshot);
}

function queueBackgroundSave(previousSnapshot) {
    if (previousSnapshot) rollbackSnapshot = previousSnapshot;

    if (saveInFlight) {
        saveQueued = true;
        return;
    }
    runSaveLoop();
}

async function runSaveLoop() {
    saveInFlight = true;

    /* Loop instead of recursing: if more edits arrive while a
       save is in flight, send one more request with the
       freshest data once the current request finishes. */
    for (;;) {
        saveQueued = false;
        const snapshot = clone(prototypeData);

        try {
            await persistSnapshot(snapshot);
            rollbackSnapshot = null;
        } catch (error) {
            console.error("RiGiD Prototype save failed:", error);
            if (rollbackSnapshot) {
                prototypeData = rollbackSnapshot;
                rollbackSnapshot = null;
                renderEverything();
            }
            showToast(error.message || "Unable to save changes. Reverted.");
            saveQueued = false;
            break;
        }

        if (!saveQueued) break;
    }

    saveInFlight = false;
}

/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(v) {
    return String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(value, includeYear = true) {
    if (!value) return "—";
    const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        ...(includeYear ? { year: "numeric" } : {})
    }).toUpperCase();
}

function todayISO() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 10);
}

function phaseForProgress(n) {
    n = Number(n) || 0;
    if (n >= 100) return "Completed";
    if (n >= 75) return "Testing phase";
    if (n >= 45) return "Build phase";
    if (n >= 20) return "Design phase";
    return "Planning phase";
}

function showToast(message) {
    const el = $("#prototypeToast");
    if (!el) return;
    el.textContent = message;
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 3000);
}

function openModal(modal) {
    if (!modal) return;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    const focusable = modal.querySelector("input, textarea, select, button");
    focusable?.focus();
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.add("hidden");
    if (!$$(".prototype-modal:not(.hidden)").length) {
        document.body.style.overflow = "";
    }
}

function setText(selector, value, fallback = "—") {
    const el = $(selector);
    if (el) el.textContent = value || fallback;
}

function setHTML(selector, html) {
    const el = $(selector);
    if (el) el.innerHTML = html;
}

function emptyState(text) {
    return `<div class="empty-state">${escapeHTML(text)}</div>`;
}

/* =========================================================
   CONFIRMATION MODAL
   Built once at runtime and reused for every delete/clear
   action so there is a single, consistent, accessible
   confirmation flow instead of window.confirm().
   Markup mirrors the existing .prototype-modal structure
   so it inherits all existing modal styling with no new
   CSS required.
========================================================= */

let confirmModalEl = null;
let confirmPendingAction = null;

function ensureConfirmModal() {
    if (confirmModalEl) return confirmModalEl;

    const modal = document.createElement("div");
    modal.className = "prototype-modal hidden";
    modal.id = "prototypeConfirmModal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "prototypeConfirmTitle");
    modal.innerHTML = `
        <div class="modal-panel">
            <div class="modal-header">
                <div>
                    <span class="section-label">CONFIRM</span>
                    <h2 id="prototypeConfirmTitle">Remove this item?</h2>
                </div>
                <button type="button" id="prototypeConfirmClose" aria-label="Close">×</button>
            </div>
            <div class="modal-grid">
                <p id="prototypeConfirmMessage" class="full"></p>
            </div>
            <div class="modal-actions">
                <button class="outline-button" type="button" id="prototypeConfirmCancel">Cancel</button>
                <button class="primary-button prototype-confirm-delete" type="button" id="prototypeConfirmDelete">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    /* Minimal, scoped styling for the destructive action button.
       (Belongs in prototype.css long-term — flagged for the
       CSS pass — kept tiny and additive here so nothing breaks
       in the meantime.) */
    if (!document.getElementById("prototypeConfirmStyle")) {
        const style = document.createElement("style");
        style.id = "prototypeConfirmStyle";
        style.textContent = `
            .prototype-confirm-delete {
                background: var(--prototype-red, #ff667c) !important;
                border-color: var(--prototype-red, #ff667c) !important;
                color: #1c0508 !important;
            }
            .prototype-confirm-delete:hover {
                filter: brightness(1.08);
            }
        `;
        document.head.appendChild(style);
    }

    const close = () => {
        closeModal(modal);
        confirmPendingAction = null;
    };

    modal.querySelector("#prototypeConfirmClose").addEventListener("click", close);
    modal.querySelector("#prototypeConfirmCancel").addEventListener("click", close);
    modal.addEventListener("click", e => { if (e.target === modal) close(); });
    modal.querySelector("#prototypeConfirmDelete").addEventListener("click", () => {
        const action = confirmPendingAction;
        close();
        if (typeof action === "function") action();
    });

    confirmModalEl = modal;
    return modal;
}

function requestConfirmation(message, onConfirm) {
    const modal = ensureConfirmModal();
    modal.querySelector("#prototypeConfirmMessage").textContent = message;
    confirmPendingAction = onConfirm;
    openModal(modal);
}

/* =========================================================
   DELETE / CLEAR (immediate, with rollback on failure)
========================================================= */

function findPrototypeItem(section, itemId) {
    const list = arr(prototypeData?.[section]);
    return list.find(item => String(item?.id) === String(itemId));
}

function deleteButton(section, itemId, label = "Delete") {
    return `<button type="button" class="prototype-delete-button" data-delete-section="${escapeHTML(section)}" data-delete-id="${escapeHTML(itemId)}" title="${escapeHTML(label)}" aria-label="${escapeHTML(label)}">×</button>`;
}

function deleteFieldButton(section, label = "Clear") {
    return `<button type="button" class="prototype-delete-button prototype-delete-field" data-delete-field="${escapeHTML(section)}" title="${escapeHTML(label)}" aria-label="${escapeHTML(label)}">×</button>`;
}

/* NOTE: this small injected stylesheet should move into
   prototype.css during the CSS pass (see project notes).
   Left in place here, unchanged in behaviour, so nothing
   visually breaks while only prototype.js is being updated. */
function withDeleteStyle() {
    if (document.getElementById("prototypeDeleteStyle")) return;
    const style = document.createElement("style");
    style.id = "prototypeDeleteStyle";
    style.textContent = `
        .prototype-delete-button {
            margin-left: auto;
            flex: 0 0 auto;
            width: 22px;
            height: 22px;
            min-width: 22px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: transparent;
            color: inherit;
            font-size: 17px;
            line-height: 20px;
            cursor: pointer;
            opacity: .55;
        }
        .prototype-delete-button:hover { opacity: 1; }
        .prototype-delete-field { margin-left: 8px; }
        .prototype-delete-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .prototype-delete-row > :not(.prototype-delete-button) { min-width: 0; }
        .prototype-resource-uploading { opacity: .6; }
    `;
    document.head.appendChild(style);
}

function deletePrototypeItem(section, itemId) {
    if (!prototypeData || !Array.isArray(prototypeData[section])) return;

    const index = section === "tags"
        ? Number(itemId)
        : prototypeData[section].findIndex(item => String(item?.id) === String(itemId));
    if (index < 0 || index >= prototypeData[section].length) return;

    const item = prototypeData[section][index];
    const name = typeof item === "string"
        ? item
        : (item?.title || item?.name || item?.parameter || item?.version || "this item");

    requestConfirmation(`Delete "${name}"? This cannot be undone.`, () => {
        const previousSnapshot = clone(prototypeData);
        prototypeData[section].splice(index, 1);
        commitImmediate("Item removed.", previousSnapshot);
    });
}

function clearPrototypeField(field) {
    if (!prototypeData || !(field in prototypeData)) return;

    const labels = {
        objective: "objective",
        designConcept: "design concept",
        outcome: "prototype outcome",
        nextAction: "next action",
        version: "current version"
    };

    requestConfirmation(`Remove the ${labels[field] || field}?`, () => {
        const previousSnapshot = clone(prototypeData);

        if (field === "nextAction") {
            prototypeData.nextAction = { title: "", dueDate: "" };
        } else if (field === "version") {
            prototypeData.version = "";
            prototypeData.versionTitle = "";
            prototypeData.versionDescription = "";
        } else {
            prototypeData[field] = "";
        }

        commitImmediate("Removed.", previousSnapshot);
    });
}

function initializeDeleteSystem() {
    withDeleteStyle();

    document.addEventListener("click", event => {
        const button = event.target.closest("[data-delete-section], [data-delete-field]");
        if (!button) return;

        event.preventDefault();
        event.stopPropagation();

        if (button.dataset.deleteField) {
            clearPrototypeField(button.dataset.deleteField);
            return;
        }

        deletePrototypeItem(
            button.dataset.deleteSection,
            button.dataset.deleteId
        );
    });
}

/* =========================================================
   LOADING / ERROR STATE

   These target optional elements (#prototypeLoadingState,
   #prototypeErrorState, #prototypeWorkspace). If the current
   HTML does not yet include them, these calls simply no-op —
   nothing breaks — but wiring them up is recommended in the
   next pass over prototype.html.
========================================================= */

function showLoadingState() {
    $("#prototypeLoadingState")?.classList.remove("hidden");
    $("#prototypeErrorState")?.classList.add("hidden");
    $("#prototypeWorkspace")?.setAttribute("aria-busy", "true");
}

function hideLoadingState() {
    $("#prototypeLoadingState")?.classList.add("hidden");
    $("#prototypeWorkspace")?.removeAttribute("aria-busy");
}

function showErrorState(message) {
    const el = $("#prototypeErrorState");
    if (el) {
        el.textContent = message;
        el.classList.remove("hidden");
    }
    $("#prototypeLoadingState")?.classList.add("hidden");
}

/* =========================================================
   RENDER
========================================================= */

function renderEverything() {
    if (!prototypeData) return;
    renderHeader();
    renderOverview();
    renderDesign();
    renderBuild();
    renderComponents();
    renderTesting();
    renderIterations();
    renderFailures();
    renderImprovements();
    renderResources();
}

function renderHeader() {
    setText("#prototypeTitle", prototypeData.title, "Untitled Prototype");
    setText("#prototypeDescription", prototypeData.description, "No description added.");
    setText("#prototypeStatus", `● ${(prototypeData.status || "planning").toUpperCase()}`);
    setText("#prototypeVersion", prototypeData.version, "—");
    setText("#prototypeOwner", prototypeData.owner, "You");
    setText("#prototypeStarted", formatDate(prototypeData.startedAt));
    setText("#prototypeLastUpdated", formatDate(prototypeData.updatedAt));

    const tags = $("#prototypeTags");
    if (tags) {
        tags.innerHTML = prototypeData.tags.length
            ? prototypeData.tags.map((x, i) => `<span class="prototype-tag prototype-delete-row"><span>${escapeHTML(x)}</span>${deleteButton("tags", String(i), "Delete tag")}</span>`).join("")
            : emptyState("No tags added.");
    }
}

function renderOverview() {
    const p = Math.max(0, Math.min(100, Number(prototypeData.progress) || 0));
    setText("#prototypeProgress", `${p}%`, "0%");
    const bar = $("#prototypeProgressBar");
    if (bar) bar.style.width = `${p}%`;
    setText("#prototypeProgressStatus", prototypeData.progressPhase || phaseForProgress(p));

    setText("#buildProgressPercentage", `${p}%`, "0%");
    const buildBar = $("#buildProgressBar");
    if (buildBar) buildBar.style.width = `${p}%`;
    setText("#buildProgressLabel", prototypeData.progressPhase || phaseForProgress(p));

    setText("#currentVersion", prototypeData.version, "—");
    setText("#currentVersionTitle", prototypeData.versionTitle, "No version title");
    setHTML("#currentVersionDescription", prototypeData.version
        ? `<div class="prototype-delete-row"><span>${escapeHTML(prototypeData.versionDescription || "No version description")}</span>${deleteFieldButton("version", "Delete current version")}</div>`
        : "No version description");

    setHTML("#prototypeNextActionTitle", prototypeData.nextAction.title
        ? `<div class="prototype-delete-row"><span>${escapeHTML(prototypeData.nextAction.title)}</span>${deleteFieldButton("nextAction", "Delete next action")}</div>`
        : emptyState("No next action"));
    setText("#prototypeNextActionDue",
        prototypeData.nextAction.dueDate
            ? `Due: ${formatDate(prototypeData.nextAction.dueDate, false)}`
            : "No due date"
    );

    setHTML("#prototypeObjective",
        prototypeData.objective
            ? `<div class="prototype-delete-row"><p>${escapeHTML(prototypeData.objective)}</p>${deleteFieldButton("objective", "Delete objective")}</div>`
            : emptyState("No objective added yet.")
    );
}

function renderDesign() {
    setHTML("#designConcept",
        prototypeData.designConcept
            ? `<div class="prototype-delete-row"><p>${escapeHTML(prototypeData.designConcept)}</p>${deleteFieldButton("designConcept", "Delete design concept")}</div>`
            : emptyState("No design concept added yet.")
    );

    setHTML("#specificationList",
        prototypeData.specifications.length
            ? prototypeData.specifications.map(x => `
                <div class="specification-row prototype-delete-row">
                    <span>${escapeHTML(x.name)}</span>
                    <strong>${escapeHTML(x.value)}</strong>
                    ${deleteButton("specifications", x.id, "Delete specification")}
                </div>`).join("")
            : emptyState("No specifications added yet.")
    );

    setHTML("#designDecisionList",
        prototypeData.designDecisions.length
            ? prototypeData.designDecisions.map(x => `
                <div class="design-decision prototype-delete-row">
                    <div>
                        <strong>${escapeHTML(x.title)}</strong>
                        <p>${escapeHTML(x.description)}</p>
                    </div>
                    ${deleteButton("designDecisions", x.id, "Delete design decision")}
                </div>`).join("")
            : emptyState("No design decisions added yet.")
    );
}

function renderBuild() {
    setHTML("#buildLogList",
        prototypeData.buildLog.length
            ? prototypeData.buildLog.map(x => `
                <article class="build-log-entry prototype-delete-row">
                    <div class="build-log-date">${escapeHTML(formatDate(x.date))}</div>
                    <div class="build-log-content">
                        <strong>${escapeHTML(x.title)}</strong>
                        <p>${escapeHTML(x.description || "")}</p>
                    </div>
                    ${deleteButton("buildLog", x.id, "Delete build entry")}
                </article>`).join("")
            : emptyState("No build activities recorded yet.")
    );
}

function renderComponents() {
    setHTML("#prototypeComponentList",
        prototypeData.components.length
            ? prototypeData.components.map(x => `
                <article class="component-card">
                    <div class="component-card-top prototype-delete-row">
                        <strong>${escapeHTML(x.name)}</strong>
                        <span>${escapeHTML((x.status || "active").toUpperCase())}</span>
                        ${deleteButton("components", x.id, "Delete component")}
                    </div>
                    <p>${escapeHTML(x.description || "")}</p>
                    <small>Quantity: ${escapeHTML(x.quantity || 1)}</small>
                </article>`).join("")
            : emptyState("No components added yet.")
    );
}

function renderTesting() {
    const tests = prototypeData.tests;
    setText("#prototypeTestTotal", String(tests.length), "0");
    setText("#prototypeTestPassed", String(tests.filter(x => x.result === "passed").length), "0");
    setText("#prototypeTestFailed", String(tests.filter(x => x.result === "failed").length), "0");
    setText("#prototypeTestPending", String(tests.filter(x => x.result === "pending").length), "0");

    setHTML("#prototypeTestList",
        tests.length
            ? tests.map(x => `
                <article class="prototype-test ${escapeHTML(x.result || "pending")}">
                    <div class="test-result-icon">${x.result === "passed" ? "✓" : x.result === "failed" ? "!" : "•"}</div>
                    <div class="prototype-test-info">
                        <strong>${escapeHTML(x.name)}</strong>
                        <p>${escapeHTML(x.description || "")}</p>
                    </div>
                    <span class="test-result-badge ${escapeHTML(x.result || "pending")}">${escapeHTML((x.result || "pending").toUpperCase())}</span>
                    ${deleteButton("tests", x.id, "Delete test")}
                </article>`).join("")
            : emptyState("No tests recorded yet.")
    );

    const tbody = $("#measurementTableBody");
    if (tbody) {
        tbody.innerHTML = prototypeData.measurements.length
            ? prototypeData.measurements.map(x => {
                const result = x.result || "CHECK";
                const cls = result === "PASS" ? "measurement-pass" :
                    result === "FAIL" ? "measurement-fail" : "measurement-check";
                return `<tr>
                    <td>${escapeHTML(x.parameter)}</td>
                    <td>${escapeHTML(x.expected || "—")}</td>
                    <td>${escapeHTML(x.measured || "—")}</td>
                    <td>${escapeHTML(x.unit || "—")}</td>
                    <td class="prototype-delete-row"><span class="${cls}">${escapeHTML(result)}</span>${deleteButton("measurements", x.id, "Delete measurement")}</td>
                </tr>`;
            }).join("")
            : `<tr><td colspan="5">${escapeHTML("No measurements recorded yet.")}</td></tr>`;
    }
}

function renderIterations() {
    setHTML("#iterationList",
        prototypeData.iterations.length
            ? prototypeData.iterations.map((x, i) => `
                <article class="iteration-card ${i === 0 ? "current" : ""}">
                    <div class="iteration-version">${escapeHTML(x.version)}</div>
                    <div class="iteration-content">
                        <div class="iteration-top">
                            <strong>${escapeHTML(x.title)}</strong>
                            <span>${escapeHTML(formatDate(x.date))}</span>
                        </div>
                        <p>${escapeHTML(x.description || "")}</p>
                        <div class="iteration-changes">
                            ${arr(x.changes).map(c => `<span>${escapeHTML(c)}</span>`).join("")}
                        </div>
                    </div>
                    ${deleteButton("iterations", x.id, "Delete iteration")}
                </article>`).join("")
            : emptyState("No prototype iterations recorded yet.")
    );
}

function renderFailures() {
    setHTML("#failureList",
        prototypeData.failures.length
            ? prototypeData.failures.map(x => `
                <div class="failure-item prototype-delete-row">
                    <span class="failure-icon">!</span>
                    <div><strong>${escapeHTML(x.title)}</strong><p>${escapeHTML(x.description || "")}</p></div>
                    ${deleteButton("failures", x.id, "Delete failure")}
                </div>`).join("")
            : emptyState("No failures recorded yet.")
    );

    setHTML("#modificationList",
        prototypeData.modifications.length
            ? prototypeData.modifications.map((x, i) => `
                <div class="modification-item prototype-delete-row">
                    <span class="modification-number">${String(i + 1).padStart(2, "0")}</span>
                    <div><strong>${escapeHTML(x.title)}</strong><p>${escapeHTML(x.description || "")}</p></div>
                    ${deleteButton("modifications", x.id, "Delete modification")}
                </div>`).join("")
            : emptyState("No modifications recorded yet.")
    );
}

function renderImprovements() {
    setHTML("#improvementGrid",
        prototypeData.improvements.length
            ? prototypeData.improvements.map(x => `
                <article class="improvement-card">
                    <div class="prototype-delete-row">
                        <span>${escapeHTML(x.priority || "MEDIUM PRIORITY")}</span>
                        ${deleteButton("improvements", x.id, "Delete improvement")}
                    </div>
                    <h3>${escapeHTML(x.title)}</h3>
                    <p>${escapeHTML(x.description || "")}</p>
                </article>`).join("")
            : emptyState("No future improvements added yet.")
    );

    const outcome = $("#prototypeOutcome");
    /* Never overwrite the textarea while the user is actively
       typing in it — avoids losing in-progress content. */
    if (outcome && document.activeElement !== outcome) {
        outcome.value = prototypeData.outcome || "";
    }
    const outcomeContainer = outcome?.closest(".outcome-card");
    if (outcomeContainer) {
        let button = outcomeContainer.querySelector('[data-delete-field="outcome"]');
        if (prototypeData.outcome) {
            if (!button) {
                button = document.createElement("button");
                button.type = "button";
                button.className = "prototype-delete-button";
                button.dataset.deleteField = "outcome";
                button.title = "Delete outcome";
                button.setAttribute("aria-label", "Delete outcome");
                button.textContent = "×";
                const footer = outcomeContainer.querySelector(".card-footer");
                if (footer) footer.prepend(button);
            }
        } else if (button) {
            button.remove();
        }
    }
}

function renderResources() {
    const media = $("#prototypeMediaGrid");
    const files = $("#prototypeFileList");
    const resources = prototypeData.resources;

    if (media) {
        const mediaItems = resources.filter(x => x.kind === "media");
        media.innerHTML = mediaItems.length
            ? mediaItems.map(x => `
                <article class="prototype-media-card">
                    <div class="media-placeholder">${escapeHTML(x.type || "MEDIA")}</div>
                    <div class="media-info">
                        <strong>${escapeHTML(x.title)}</strong>
                        <span>${escapeHTML(x.description || "")}</span>
                    </div>
                </article>`).join("")
            : "";
    }

    if (files) {
        const fileItems = resources.filter(x => x.kind !== "media");
        files.innerHTML = fileItems.length
            ? fileItems.map(x => {
                if (x.uploading) {
                    return `
                        <article class="prototype-file prototype-resource-uploading">
                            <div class="prototype-file-icon">${escapeHTML(x.type || "FILE")}</div>
                            <div class="prototype-file-info">
                                <strong>${escapeHTML(x.title)}</strong>
                                <span>Uploading…</span>
                            </div>
                        </article>`;
                }
                return `
                    <article class="prototype-file prototype-delete-row">
                        <div class="prototype-file-icon">${escapeHTML(x.type || "FILE")}</div>
                        <div class="prototype-file-info">
                            <strong>${escapeHTML(x.title)}</strong>
                            <span>${escapeHTML(x.description || x.url || "")}</span>
                        </div>
                        ${x.url ? `<button type="button" data-open-resource="${escapeHTML(x.id)}">Open</button>` : ""}
                        ${deleteButton("resources", x.id, "Delete resource")}
                    </article>`;
            }).join("")
            : emptyState("No files or links added yet.");

        $$("[data-open-resource]").forEach(btn => {
            btn.onclick = () => {
                const item = prototypeData.resources.find(x => x.id === btn.dataset.openResource);
                if (!item?.url) return;
                try {
                    const parsed = new URL(item.url, window.location.href);
                    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
                        window.open(parsed.href, "_blank", "noopener,noreferrer");
                    }
                } catch {
                    /* Invalid URL — refuse to open it. */
                }
            };
        });
    }
}

/* =========================================================
   CLOCK / NAVIGATION
========================================================= */

function updateClock() {
    const d = new Date();
    setText("#prototypeDate", d.toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric"
    }).toUpperCase());
    setText("#prototypeClock", d.toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    }));
}
updateClock();
setInterval(updateClock, 1000);

$$(".prototype-nav-item").forEach(btn => {
    btn.setAttribute("type", "button");
    btn.addEventListener("click", () => {
        $$(".prototype-nav-item").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.section)?.scrollIntoView({
            behavior: "smooth", block: "start"
        });
    });
});

/* =========================================================
   MODALS
========================================================= */

const modalPairs = [
    ["#prototypeDetailsModal", "#closePrototypeDetailsModal", "#cancelPrototypeDetails"],
    ["#prototypeProgressModal", "#closePrototypeProgressModal", "#cancelPrototypeProgress"],
    ["#prototypeVersionModal", "#closePrototypeVersionModal", "#cancelPrototypeVersion"],
    ["#prototypeNextActionModal", "#closePrototypeNextActionModal", "#cancelPrototypeNextAction"],
    ["#prototypeObjectiveModal", "#closePrototypeObjectiveModal", "#cancelPrototypeObjective"],
    ["#prototypeDesignModal", "#closePrototypeDesignModal", "#cancelPrototypeDesign"],
    ["#prototypeSpecificationModal", "#closePrototypeSpecificationModal", "#cancelPrototypeSpecification"],
    ["#prototypeDesignDecisionModal", "#closePrototypeDesignDecisionModal", "#cancelPrototypeDesignDecision"],
    ["#buildModal", "#closeBuildModal", "#cancelBuildEntry"],
    ["#prototypeComponentModal", "#closePrototypeComponentModal", "#cancelPrototypeComponent"],
    ["#prototypeTestModal", "#closePrototypeTestModal", "#cancelPrototypeTest"],
    ["#prototypeMeasurementModal", "#closePrototypeMeasurementModal", "#cancelPrototypeMeasurement"],
    ["#prototypeIterationModal", "#closePrototypeIterationModal", "#cancelPrototypeIteration"],
    ["#prototypeFailureModal", "#closePrototypeFailureModal", "#cancelPrototypeFailure"],
    ["#prototypeModificationModal", "#closePrototypeModificationModal", "#cancelPrototypeModification"],
    ["#prototypeImprovementModal", "#closePrototypeImprovementModal", "#cancelPrototypeImprovement"],
    ["#prototypeLinkModal", "#closePrototypeLinkModal", "#cancelPrototypeLink"]
];

modalPairs.forEach(([modalSelector, closeSelector, cancelSelector]) => {
    const modal = $(modalSelector);
    $(closeSelector)?.addEventListener("click", () => closeModal(modal));
    $(cancelSelector)?.addEventListener("click", () => closeModal(modal));
    modal?.addEventListener("click", e => { if (e.target === modal) closeModal(modal); });
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") $$(".prototype-modal:not(.hidden)").forEach(closeModal);
});

/* =========================================================
   FORM ACTIONS
   Pattern for every handler below:
     1. Validate input synchronously.
     2. Snapshot the previous state.
     3. Mutate prototypeData.
     4. Close the modal immediately.
     5. commitImmediate() — renders, toasts, and saves in
        the background with automatic rollback on failure.
========================================================= */

$("#editPrototype")?.addEventListener("click", () => {
    $("#prototypeDetailsTitle").value = prototypeData.title || "";
    $("#prototypeDetailsDescription").value = prototypeData.description || "";
    $("#prototypeDetailsStatus").value = prototypeData.status || "planning";
    $("#prototypeDetailsVersion").value = prototypeData.version || "";
    $("#prototypeDetailsTags").value = prototypeData.tags.join(", ");
    openModal($("#prototypeDetailsModal"));
});

$("#savePrototypeDetails")?.addEventListener("click", () => {
    const title = $("#prototypeDetailsTitle").value.trim();
    if (!title) return showToast("Prototype title is required.");

    const previousSnapshot = clone(prototypeData);
    prototypeData.title = title;
    prototypeData.description = $("#prototypeDetailsDescription").value.trim();
    prototypeData.status = $("#prototypeDetailsStatus").value;
    prototypeData.version = $("#prototypeDetailsVersion").value.trim();
    prototypeData.tags = $("#prototypeDetailsTags").value.split(",").map(x => x.trim()).filter(Boolean);

    closeModal($("#prototypeDetailsModal"));
    commitImmediate("Prototype details saved.", previousSnapshot);
});

function openProgress() {
    $("#prototypeProgressInput").value = prototypeData.progress || 0;
    $("#prototypeProgressPhase").value = prototypeData.progressPhase || phaseForProgress(prototypeData.progress);
    openModal($("#prototypeProgressModal"));
}
$("#editPrototypeProgress")?.addEventListener("click", openProgress);
$("#updatePrototypeProgress")?.addEventListener("click", openProgress);

$("#savePrototypeProgress")?.addEventListener("click", () => {
    const value = Number($("#prototypeProgressInput").value);
    if (Number.isNaN(value) || value < 0 || value > 100) {
        return showToast("Enter progress between 0 and 100.");
    }
    const previousSnapshot = clone(prototypeData);
    prototypeData.progress = value;
    prototypeData.progressPhase = $("#prototypeProgressPhase").value || phaseForProgress(value);

    closeModal($("#prototypeProgressModal"));
    commitImmediate("Progress updated.", previousSnapshot);
});

$("#editVersion")?.addEventListener("click", () => {
    $("#prototypeVersionInput").value = prototypeData.version || "";
    $("#prototypeVersionTitleInput").value = prototypeData.versionTitle || "";
    $("#prototypeVersionDescriptionInput").value = prototypeData.versionDescription || "";
    openModal($("#prototypeVersionModal"));
});

$("#savePrototypeVersion")?.addEventListener("click", () => {
    const version = $("#prototypeVersionInput").value.trim();
    if (!version) return showToast("Version is required.");

    const previousSnapshot = clone(prototypeData);
    prototypeData.version = version;
    prototypeData.versionTitle = $("#prototypeVersionTitleInput").value.trim();
    prototypeData.versionDescription = $("#prototypeVersionDescriptionInput").value.trim();

    closeModal($("#prototypeVersionModal"));
    commitImmediate("Version updated.", previousSnapshot);
});

$("#editPrototypeNext")?.addEventListener("click", () => {
    $("#prototypeNextActionInput").value = prototypeData.nextAction.title || "";
    $("#prototypeNextActionDate").value = prototypeData.nextAction.dueDate || "";
    openModal($("#prototypeNextActionModal"));
});

$("#savePrototypeNextAction")?.addEventListener("click", () => {
    const title = $("#prototypeNextActionInput").value.trim();
    if (!title) return showToast("Next action is required.");

    const previousSnapshot = clone(prototypeData);
    prototypeData.nextAction = { title, dueDate: $("#prototypeNextActionDate").value || "" };

    closeModal($("#prototypeNextActionModal"));
    commitImmediate("Next action saved.", previousSnapshot);
});

$("#editObjective")?.addEventListener("click", () => {
    $("#prototypeObjectiveInput").value = prototypeData.objective || "";
    openModal($("#prototypeObjectiveModal"));
});
$("#savePrototypeObjective")?.addEventListener("click", () => {
    const previousSnapshot = clone(prototypeData);
    prototypeData.objective = $("#prototypeObjectiveInput").value.trim();

    closeModal($("#prototypeObjectiveModal"));
    commitImmediate("Objective saved.", previousSnapshot);
});

$("#editDesign")?.addEventListener("click", () => {
    $("#prototypeDesignConceptInput").value = prototypeData.designConcept || "";
    openModal($("#prototypeDesignModal"));
});
$("#savePrototypeDesign")?.addEventListener("click", () => {
    const previousSnapshot = clone(prototypeData);
    prototypeData.designConcept = $("#prototypeDesignConceptInput").value.trim();

    closeModal($("#prototypeDesignModal"));
    commitImmediate("Design concept saved.", previousSnapshot);
});

function addModal(openButton, modal, fields) {
    $(openButton)?.addEventListener("click", () => {
        Object.entries(fields).forEach(([selector, value]) => {
            const el = $(selector);
            if (el) el.value = value;
        });
        openModal($(modal));
    });
}

addModal("#addSpecification", "#prototypeSpecificationModal", {
    "#prototypeSpecificationName": "", "#prototypeSpecificationValue": ""
});
$("#savePrototypeSpecification")?.addEventListener("click", () => {
    const name = $("#prototypeSpecificationName").value.trim();
    const value = $("#prototypeSpecificationValue").value.trim();
    if (!name) return showToast("Parameter name is required.");

    const previousSnapshot = clone(prototypeData);
    prototypeData.specifications.push({ id: id("spec"), name, value });

    closeModal($("#prototypeSpecificationModal"));
    commitImmediate("Specification added.", previousSnapshot);
});

addModal("#addDesignDecision", "#prototypeDesignDecisionModal", {
    "#prototypeDesignDecisionTitle": "", "#prototypeDesignDecisionDescription": ""
});
$("#savePrototypeDesignDecision")?.addEventListener("click", () => {
    const title = $("#prototypeDesignDecisionTitle").value.trim();
    if (!title) return showToast("Design decision is required.");

    const previousSnapshot = clone(prototypeData);
    prototypeData.designDecisions.unshift({
        id: id("decision"), title,
        description: $("#prototypeDesignDecisionDescription").value.trim()
    });

    closeModal($("#prototypeDesignDecisionModal"));
    commitImmediate("Design decision added.", previousSnapshot);
});

$("#addBuildEntry")?.addEventListener("click", () => {
    $("#buildEntryTitle").value = "";
    $("#buildEntryDate").value = todayISO();
    $("#buildEntryProgress").value = prototypeData.progress || 0;
    $("#buildEntryDescription").value = "";
    openModal($("#buildModal"));
});
$("#saveBuildEntry")?.addEventListener("click", () => {
    const title = $("#buildEntryTitle").value.trim();
    if (!title) return showToast("Build activity is required.");
    const progress = Number($("#buildEntryProgress").value);
    if (Number.isNaN(progress) || progress < 0 || progress > 100) return showToast("Enter valid progress.");

    const previousSnapshot = clone(prototypeData);
    prototypeData.buildLog.unshift({
        id: id("build"), title,
        date: $("#buildEntryDate").value || todayISO(),
        description: $("#buildEntryDescription").value.trim()
    });
    prototypeData.progress = progress;
    prototypeData.progressPhase = phaseForProgress(progress);

    closeModal($("#buildModal"));
    commitImmediate("Build entry added.", previousSnapshot);
});

$("#addComponent")?.addEventListener("click", () => {
    $("#prototypeComponentName").value = "";
    $("#prototypeComponentQuantity").value = 1;
    $("#prototypeComponentStatus").value = "active";
    $("#prototypeComponentDescription").value = "";
    openModal($("#prototypeComponentModal"));
});
$("#savePrototypeComponent")?.addEventListener("click", () => {
    const name = $("#prototypeComponentName").value.trim();
    if (!name) return showToast("Component name is required.");

    const previousSnapshot = clone(prototypeData);
    prototypeData.components.push({
        id: id("component"), name,
        quantity: Number($("#prototypeComponentQuantity").value) || 1,
        status: $("#prototypeComponentStatus").value,
        description: $("#prototypeComponentDescription").value.trim()
    });

    closeModal($("#prototypeComponentModal"));
    commitImmediate("Component added.", previousSnapshot);
});

$("#addPrototypeTest")?.addEventListener("click", () => {
    $("#prototypeTestName").value = "";
    $("#prototypeTestResult").value = "pending";
    $("#prototypeTestDate").value = todayISO();
    $("#prototypeTestDescription").value = "";
    openModal($("#prototypeTestModal"));
});
$("#savePrototypeTest")?.addEventListener("click", () => {
    const name = $("#prototypeTestName").value.trim();
    if (!name) return showToast("Test name is required.");

    const previousSnapshot = clone(prototypeData);
    prototypeData.tests.push({
        id: id("test"), name,
        result: $("#prototypeTestResult").value,
        date: $("#prototypeTestDate").value || todayISO(),
        description: $("#prototypeTestDescription").value.trim()
    });

    closeModal($("#prototypeTestModal"));
    commitImmediate("Test added.", previousSnapshot);
});

$("#addMeasurement")?.addEventListener("click", () => {
    ["#prototypeMeasurementParameter", "#prototypeMeasurementExpected", "#prototypeMeasurementMeasured", "#prototypeMeasurementUnit"]
        .forEach(s => $(s).value = "");
    $("#prototypeMeasurementResult").value = "PASS";
    openModal($("#prototypeMeasurementModal"));
});
$("#savePrototypeMeasurement")?.addEventListener("click", () => {
    const parameter = $("#prototypeMeasurementParameter").value.trim();
    if (!parameter) return showToast("Measurement parameter is required.");

    const previousSnapshot = clone(prototypeData);
    prototypeData.measurements.push({
        id: id("measurement"), parameter,
        expected: $("#prototypeMeasurementExpected").value.trim(),
        measured: $("#prototypeMeasurementMeasured").value.trim(),
        unit: $("#prototypeMeasurementUnit").value.trim(),
        result: $("#prototypeMeasurementResult").value
    });

    closeModal($("#prototypeMeasurementModal"));
    commitImmediate("Measurement added.", previousSnapshot);
});

$("#addIteration")?.addEventListener("click", () => {
    $("#prototypeIterationVersion").value = "";
    $("#prototypeIterationDate").value = todayISO();
    $("#prototypeIterationTitle").value = "";
    $("#prototypeIterationDescription").value = "";
    $("#prototypeIterationChanges").value = "";
    openModal($("#prototypeIterationModal"));
});
$("#savePrototypeIteration")?.addEventListener("click", () => {
    const version = $("#prototypeIterationVersion").value.trim();
    const title = $("#prototypeIterationTitle").value.trim();
    if (!version || !title) return showToast("Version and title are required.");

    const previousSnapshot = clone(prototypeData);
    const item = {
        id: id("iteration"), version, title,
        date: $("#prototypeIterationDate").value || todayISO(),
        description: $("#prototypeIterationDescription").value.trim(),
        changes: $("#prototypeIterationChanges").value.split("\n").map(x => x.trim()).filter(Boolean)
    };

    /* Newest iteration goes first, becomes "current", and
       drives the Overview / Build "current version" fields. */
    prototypeData.iterations.unshift(item);
    prototypeData.version = version;
    prototypeData.versionTitle = title;
    prototypeData.versionDescription = item.description;

    closeModal($("#prototypeIterationModal"));
    commitImmediate("Iteration added.", previousSnapshot);
});

function setupSimpleList(button, modal, save, titleInput, descriptionInput, key, label) {
    $(button)?.addEventListener("click", () => {
        $(titleInput).value = "";
        $(descriptionInput).value = "";
        openModal($(modal));
    });
    $(save)?.addEventListener("click", () => {
        const title = $(titleInput).value.trim();
        if (!title) return showToast(`${label} title is required.`);

        const previousSnapshot = clone(prototypeData);
        prototypeData[key].unshift({
            id: id(key), title,
            description: $(descriptionInput).value.trim()
        });

        closeModal($(modal));
        commitImmediate(`${label} added.`, previousSnapshot);
    });
}
setupSimpleList("#addFailure", "#prototypeFailureModal", "#savePrototypeFailure",
    "#prototypeFailureTitle", "#prototypeFailureDescription", "failures", "Failure");
setupSimpleList("#addModification", "#prototypeModificationModal", "#savePrototypeModification",
    "#prototypeModificationTitle", "#prototypeModificationDescription", "modifications", "Modification");

$("#addImprovement")?.addEventListener("click", () => {
    $("#prototypeImprovementPriority").value = "MEDIUM PRIORITY";
    $("#prototypeImprovementTitle").value = "";
    $("#prototypeImprovementDescription").value = "";
    openModal($("#prototypeImprovementModal"));
});
$("#savePrototypeImprovement")?.addEventListener("click", () => {
    const title = $("#prototypeImprovementTitle").value.trim();
    if (!title) return showToast("Improvement title is required.");

    const previousSnapshot = clone(prototypeData);
    prototypeData.improvements.unshift({
        id: id("improvement"),
        priority: $("#prototypeImprovementPriority").value,
        title,
        description: $("#prototypeImprovementDescription").value.trim()
    });

    closeModal($("#prototypeImprovementModal"));
    commitImmediate("Improvement added.", previousSnapshot);
});

$("#savePrototypeOutcome")?.addEventListener("click", () => {
    const previousSnapshot = clone(prototypeData);
    prototypeData.outcome = $("#prototypeOutcome").value.trim();
    commitImmediate("Prototype outcome saved.", previousSnapshot);
});

/* =========================================================
   LINKS / FILES

   Links are pure metadata and are immediate, like everything
   else above. Uploaded files require an actual network
   upload to Supabase Storage before a working, refresh-safe
   URL exists — that part of the flow necessarily waits on
   the network, but it never blocks the rest of the UI: a
   placeholder "Uploading…" entry appears immediately, and
   the surrounding page stays fully interactive.
========================================================= */

$("#addPrototypeLink")?.addEventListener("click", () => {
    $("#prototypeLinkTitle").value = "";
    $("#prototypeLinkURL").value = "";
    $("#prototypeLinkDescription").value = "";
    openModal($("#prototypeLinkModal"));
});

$("#savePrototypeLink")?.addEventListener("click", () => {
    const title = $("#prototypeLinkTitle").value.trim();
    const url = $("#prototypeLinkURL").value.trim();
    if (!title || !url) return showToast("Title and URL are required.");

    let parsed;
    try {
        parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad protocol");
    } catch {
        return showToast("Enter a valid http(s) URL.");
    }

    const previousSnapshot = clone(prototypeData);
    prototypeData.resources.unshift({
        id: id("resource"),
        kind: "link",
        type: "LINK",
        title,
        url: parsed.href,
        description: $("#prototypeLinkDescription").value.trim()
    });

    closeModal($("#prototypeLinkModal"));
    commitImmediate("Link added.", previousSnapshot);
});

const fileInput = $("#prototypeFileInput");
$("#uploadPrototypeFile")?.addEventListener("click", () => fileInput?.click());
$("#prototypeUploadZone")?.addEventListener("click", () => fileInput?.click());

/* Uploads a single file to Supabase Storage and returns its
   public URL. Throws on failure — callers handle rollback. */
async function uploadFileToStorage(file) {
    const client = getSupabaseClient();
    if (!client?.storage) {
        throw new Error("File storage is unavailable.");
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
    const path = `${currentWorkId || "unassigned"}/prototype/${id("file")}_${safeName}`;

    const { error: uploadError } = await client.storage
        .from(PROTOTYPE_STORAGE_BUCKET)
        .upload(path, file, {
            upsert: false,
            contentType: file.type || undefined
        });

    if (uploadError) throw uploadError;

    const { data: publicData } = client.storage
        .from(PROTOTYPE_STORAGE_BUCKET)
        .getPublicUrl(path);

    return { path, url: publicData?.publicUrl || "" };
}

async function handleIncomingFiles(fileList) {
    const files = [...fileList].filter(Boolean);
    if (!files.length) return;

    for (const file of files) {
        const placeholderId = id("resource");

        /* Immediate, optimistic placeholder so the UI reacts
           the instant the user drops/selects a file. */
        prototypeData.resources.unshift({
            id: placeholderId,
            kind: "file",
            type: (file.name.split(".").pop() || "FILE").toUpperCase().slice(0, 5),
            title: file.name,
            uploading: true
        });
        renderEverything();

        try {
            const uploaded = await uploadFileToStorage(file);
            const target = findPrototypeItem("resources", placeholderId);
            if (target) {
                delete target.uploading;
                target.description = `${file.type || "File"} · ${(file.size / 1024).toFixed(1)} KB`;
                target.url = uploaded.url;
                target.path = uploaded.path;
            }
            commitImmediate(`${file.name} uploaded.`, null);
        } catch (error) {
            console.error("RiGiD Prototype file upload failed:", error);
            const index = prototypeData.resources.findIndex(x => x.id === placeholderId);
            if (index >= 0) prototypeData.resources.splice(index, 1);
            renderEverything();
            showToast(`Could not upload ${file.name}.`);
        }
    }
}

fileInput?.addEventListener("change", async e => {
    await handleIncomingFiles(e.target.files);
    e.target.value = "";
});

const zone = $("#prototypeUploadZone");
if (zone) {
    ["dragenter", "dragover"].forEach(name => zone.addEventListener(name, e => {
        e.preventDefault();
        zone.classList.add("dragging");
    }));
    ["dragleave", "drop"].forEach(name => zone.addEventListener(name, e => {
        e.preventDefault();
        zone.classList.remove("dragging");
    }));
    zone.addEventListener("drop", async e => {
        await handleIncomingFiles(e.dataTransfer.files);
    });
}

initializeDeleteSystem();

/* =========================================================
   INITIAL LOAD
========================================================= */

(async function initialize() {
    showLoadingState();
    try {
        await loadPrototypeData();
        hideLoadingState();
        renderEverything();

    } catch (error) {
        console.error("RiGiD Prototype initialization error:", error);
        hideLoadingState();
        showErrorState(error.message || "Unable to load Prototype workspace.");
        showToast(error.message || "Unable to load Prototype.");
        /* Do not silently swap in fake sample data — leave the
           workspace in a visible error state instead. */
    }
})();

});