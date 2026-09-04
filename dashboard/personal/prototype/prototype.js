/* =========================================================
   RiGiD PROTOTYPE WORKSPACE
   Persistent version - no dummy data, no window.prompt()
   Uses:
   GET  /get-rigid-work-data
   POST /update-rigid-work-data
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
"use strict";

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let currentWorkId = getWorkId();
let prototypeData = null;
let isSaving = false;
let toastTimer = null;

/* =========================================================
   DATA
========================================================= */

function now() { return new Date().toISOString(); }
function id(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function arr(v) { return Array.isArray(v) ? v : []; }

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

function normalizeData(source) {
    const base = emptyData();
    const s = source && typeof source === "object" ? source : {};
    return {
        ...base,
        ...s,
        tags: arr(s.tags),
        specifications: arr(s.specifications),
        designDecisions: arr(s.designDecisions),
        buildLog: arr(s.buildLog),
        components: arr(s.components),
        tests: arr(s.tests),
        measurements: arr(s.measurements),
        iterations: arr(s.iterations),
        failures: arr(s.failures),
        modifications: arr(s.modifications),
        improvements: arr(s.improvements),
        resources: arr(s.resources),
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

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load Prototype data.");
    }

    const rigidData = result.data || {};
    const workspace = rigidData.workspace || {};
    const prototype =
        rigidData.prototype ||
        rigidData.prototype_data ||
        rigidData.prototypeData ||
        {};

    prototypeData = normalizeData({
        ...prototype,
        title: prototype.title || workspace.title || result.work?.title || "",
        status: prototype.status || workspace.status || "planning",
        startedAt: prototype.startedAt || workspace.createdAt || now(),
        updatedAt: prototype.updatedAt || workspace.updatedAt || now()
    });

    renderEverything();
}

async function savePrototypeData() {
    if (isSaving) return;
    if (!currentWorkId) throw new Error("Work ID is missing.");
    if (!prototypeData) throw new Error("Prototype data is not loaded.");

    isSaving = true;

    try {
        const session = await getSession();
        const functionsURL = getFunctionsURL();

        prototypeData.updatedAt = now();

        const response = await fetch(`${functionsURL}/update-rigid-work-data`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                work_id: currentWorkId,
                data: {
                    prototype: prototypeData
                }
            })
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || "Unable to save Prototype data.");
        }

        return result;
    } finally {
        isSaving = false;
    }
}

async function commit(message) {
    try {
        await savePrototypeData();
        renderEverything();
        if (message) showToast(message);
        return true;
    } catch (error) {
        console.error(error);
        showToast(error.message || "Unable to save changes.");
        return false;
    }
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
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 3000);
}

function openModal(modal) {
    if (!modal) return;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
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
   DELETE UI HELPERS
========================================================= */

function deleteButton(section, itemId, label = "Delete") {
    return `<button type="button" class="prototype-delete-button" data-delete-section="${escapeHTML(section)}" data-delete-id="${escapeHTML(itemId)}" title="${escapeHTML(label)}" aria-label="${escapeHTML(label)}">×</button>`;
}

function deleteFieldButton(section, label = "Clear") {
    return `<button type="button" class="prototype-delete-button prototype-delete-field" data-delete-field="${escapeHTML(section)}" title="${escapeHTML(label)}" aria-label="${escapeHTML(label)}">×</button>`;
}

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
    `;
    document.head.appendChild(style);
}

function findPrototypeItem(section, itemId) {
    const list = arr(prototypeData?.[section]);
    return list.find(item => String(item?.id) === String(itemId));
}

async function deletePrototypeItem(section, itemId) {
    if (!prototypeData || !Array.isArray(prototypeData[section])) return;

    const index = section === "tags"
        ? Number(itemId)
        : prototypeData[section].findIndex(item => String(item?.id) === String(itemId));
    if (index < 0 || index >= prototypeData[section].length) return;

    const item = prototypeData[section][index];
    const name = typeof item === "string" ? item : (item?.title || item?.name || item?.parameter || item?.version || "this item");

    const confirmed = window.confirm(`Delete "${name}"?`);
    if (!confirmed) return;

    const backup = prototypeData[section].slice();
    prototypeData[section].splice(index, 1);

    /* Remove it from the visible page immediately. */
    renderEverything();

    try {
        await savePrototypeData();
        renderEverything();
        showToast("Item removed.");
    } catch (error) {
        /* Restore the item if the backend save failed. */
        prototypeData[section] = backup;
        renderEverything();
        console.error("Delete Prototype item error:", error);
        showToast(error.message || "Unable to remove item.");
    }
}

async function clearPrototypeField(field) {
    if (!prototypeData) return;

    const labels = {
        objective: "objective",
        designConcept: "design concept",
        outcome: "prototype outcome",
        nextAction: "next action",
        version: "current version"
    };

    if (!(field in prototypeData)) return;

    const confirmed = window.confirm(`Remove the ${labels[field] || field}?`);
    if (!confirmed) return;

    const oldValue = JSON.parse(JSON.stringify(prototypeData[field]));

    if (field === "nextAction") {
        prototypeData.nextAction = { title: "", dueDate: "" };
    } else if (field === "version") {
        prototypeData.version = "";
        prototypeData.versionTitle = "";
        prototypeData.versionDescription = "";
    } else {
        prototypeData[field] = "";
    }

    /* Update the live page immediately. */
    renderEverything();

    try {
        await savePrototypeData();
        renderEverything();
        showToast("Removed.");
    } catch (error) {
        prototypeData[field] = oldValue;
        renderEverything();
        console.error("Clear Prototype field error:", error);
        showToast(error.message || "Unable to remove item.");
    }
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
    if (outcome && document.activeElement !== outcome) outcome.value = prototypeData.outcome || "";
    const outcomeContainer = outcome?.closest(".outcome-card");
    if (outcomeContainer) {
        let button = outcomeContainer.querySelector("[data-delete-field=\"outcome\"]");
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
            ? fileItems.map(x => `
                <article class="prototype-file">
                    <div class="prototype-file-icon">${escapeHTML(x.type || "FILE")}</div>
                    <div class="prototype-file-info">
                        <strong>${escapeHTML(x.title)}</strong>
                        <span>${escapeHTML(x.description || x.url || "")}</span>
                    </div>
                    ${x.url ? `<button type="button" data-open-resource="${escapeHTML(x.id)}">Open</button>` : ""}
                    ${deleteButton("resources", x.id, "Delete resource")}
                </article>`).join("")
            : emptyState("No files or links added yet.");

        $$("[data-open-resource]").forEach(btn => {
            btn.onclick = () => {
                const item = prototypeData.resources.find(x => x.id === btn.dataset.openResource);
                if (item?.url) window.open(item.url, "_blank", "noopener,noreferrer");
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
    if (e.key === "Escape") $$(".prototype-modal").forEach(closeModal);
});

/* =========================================================
   FORM ACTIONS
========================================================= */

$("#editPrototype")?.addEventListener("click", () => {
    $("#prototypeDetailsTitle").value = prototypeData.title || "";
    $("#prototypeDetailsDescription").value = prototypeData.description || "";
    $("#prototypeDetailsStatus").value = prototypeData.status || "planning";
    $("#prototypeDetailsVersion").value = prototypeData.version || "";
    $("#prototypeDetailsTags").value = prototypeData.tags.join(", ");
    openModal($("#prototypeDetailsModal"));
});

$("#savePrototypeDetails")?.addEventListener("click", async () => {
    const title = $("#prototypeDetailsTitle").value.trim();
    if (!title) return showToast("Prototype title is required.");

    prototypeData.title = title;
    prototypeData.description = $("#prototypeDetailsDescription").value.trim();
    prototypeData.status = $("#prototypeDetailsStatus").value;
    prototypeData.version = $("#prototypeDetailsVersion").value.trim();
    prototypeData.tags = $("#prototypeDetailsTags").value.split(",").map(x => x.trim()).filter(Boolean);

    if (await commit("Prototype details saved.")) closeModal($("#prototypeDetailsModal"));
});

function openProgress() {
    $("#prototypeProgressInput").value = prototypeData.progress || 0;
    $("#prototypeProgressPhase").value = prototypeData.progressPhase || phaseForProgress(prototypeData.progress);
    openModal($("#prototypeProgressModal"));
}
$("#editPrototypeProgress")?.addEventListener("click", openProgress);
$("#updatePrototypeProgress")?.addEventListener("click", openProgress);

$("#savePrototypeProgress")?.addEventListener("click", async () => {
    const value = Number($("#prototypeProgressInput").value);
    if (Number.isNaN(value) || value < 0 || value > 100) {
        return showToast("Enter progress between 0 and 100.");
    }
    prototypeData.progress = value;
    prototypeData.progressPhase = $("#prototypeProgressPhase").value || phaseForProgress(value);
    if (await commit("Progress updated.")) closeModal($("#prototypeProgressModal"));
});

$("#editVersion")?.addEventListener("click", () => {
    $("#prototypeVersionInput").value = prototypeData.version || "";
    $("#prototypeVersionTitleInput").value = prototypeData.versionTitle || "";
    $("#prototypeVersionDescriptionInput").value = prototypeData.versionDescription || "";
    openModal($("#prototypeVersionModal"));
});

$("#savePrototypeVersion")?.addEventListener("click", async () => {
    const version = $("#prototypeVersionInput").value.trim();
    if (!version) return showToast("Version is required.");
    prototypeData.version = version;
    prototypeData.versionTitle = $("#prototypeVersionTitleInput").value.trim();
    prototypeData.versionDescription = $("#prototypeVersionDescriptionInput").value.trim();
    if (await commit("Version updated.")) closeModal($("#prototypeVersionModal"));
});

$("#editPrototypeNext")?.addEventListener("click", () => {
    $("#prototypeNextActionInput").value = prototypeData.nextAction.title || "";
    $("#prototypeNextActionDate").value = prototypeData.nextAction.dueDate || "";
    openModal($("#prototypeNextActionModal"));
});

$("#savePrototypeNextAction")?.addEventListener("click", async () => {
    const title = $("#prototypeNextActionInput").value.trim();
    if (!title) return showToast("Next action is required.");
    prototypeData.nextAction = { title, dueDate: $("#prototypeNextActionDate").value || "" };
    if (await commit("Next action saved.")) closeModal($("#prototypeNextActionModal"));
});

$("#editObjective")?.addEventListener("click", () => {
    $("#prototypeObjectiveInput").value = prototypeData.objective || "";
    openModal($("#prototypeObjectiveModal"));
});
$("#savePrototypeObjective")?.addEventListener("click", async () => {
    prototypeData.objective = $("#prototypeObjectiveInput").value.trim();
    if (await commit("Objective saved.")) closeModal($("#prototypeObjectiveModal"));
});

$("#editDesign")?.addEventListener("click", () => {
    $("#prototypeDesignConceptInput").value = prototypeData.designConcept || "";
    openModal($("#prototypeDesignModal"));
});
$("#savePrototypeDesign")?.addEventListener("click", async () => {
    prototypeData.designConcept = $("#prototypeDesignConceptInput").value.trim();
    if (await commit("Design concept saved.")) closeModal($("#prototypeDesignModal"));
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
$("#savePrototypeSpecification")?.addEventListener("click", async () => {
    const name = $("#prototypeSpecificationName").value.trim();
    const value = $("#prototypeSpecificationValue").value.trim();
    if (!name) return showToast("Parameter name is required.");
    prototypeData.specifications.push({ id: id("spec"), name, value });
    if (await commit("Specification added.")) closeModal($("#prototypeSpecificationModal"));
});

addModal("#addDesignDecision", "#prototypeDesignDecisionModal", {
    "#prototypeDesignDecisionTitle": "", "#prototypeDesignDecisionDescription": ""
});
$("#savePrototypeDesignDecision")?.addEventListener("click", async () => {
    const title = $("#prototypeDesignDecisionTitle").value.trim();
    if (!title) return showToast("Design decision is required.");
    prototypeData.designDecisions.push({
        id: id("decision"), title,
        description: $("#prototypeDesignDecisionDescription").value.trim()
    });
    if (await commit("Design decision added.")) closeModal($("#prototypeDesignDecisionModal"));
});

$("#addBuildEntry")?.addEventListener("click", () => {
    $("#buildEntryTitle").value = "";
    $("#buildEntryDate").value = todayISO();
    $("#buildEntryProgress").value = prototypeData.progress || 0;
    $("#buildEntryDescription").value = "";
    openModal($("#buildModal"));
});
$("#saveBuildEntry")?.addEventListener("click", async () => {
    const title = $("#buildEntryTitle").value.trim();
    if (!title) return showToast("Build activity is required.");
    const progress = Number($("#buildEntryProgress").value);
    if (Number.isNaN(progress) || progress < 0 || progress > 100) return showToast("Enter valid progress.");
    prototypeData.buildLog.unshift({
        id: id("build"), title,
        date: $("#buildEntryDate").value || todayISO(),
        description: $("#buildEntryDescription").value.trim()
    });
    prototypeData.progress = progress;
    prototypeData.progressPhase = phaseForProgress(progress);
    if (await commit("Build entry added.")) closeModal($("#buildModal"));
});

$("#addComponent")?.addEventListener("click", () => {
    $("#prototypeComponentName").value = "";
    $("#prototypeComponentQuantity").value = 1;
    $("#prototypeComponentStatus").value = "active";
    $("#prototypeComponentDescription").value = "";
    openModal($("#prototypeComponentModal"));
});
$("#savePrototypeComponent")?.addEventListener("click", async () => {
    const name = $("#prototypeComponentName").value.trim();
    if (!name) return showToast("Component name is required.");
    prototypeData.components.push({
        id: id("component"), name,
        quantity: Number($("#prototypeComponentQuantity").value) || 1,
        status: $("#prototypeComponentStatus").value,
        description: $("#prototypeComponentDescription").value.trim()
    });
    if (await commit("Component added.")) closeModal($("#prototypeComponentModal"));
});

$("#addPrototypeTest")?.addEventListener("click", () => {
    $("#prototypeTestName").value = "";
    $("#prototypeTestResult").value = "pending";
    $("#prototypeTestDate").value = todayISO();
    $("#prototypeTestDescription").value = "";
    openModal($("#prototypeTestModal"));
});
$("#savePrototypeTest")?.addEventListener("click", async () => {
    const name = $("#prototypeTestName").value.trim();
    if (!name) return showToast("Test name is required.");
    prototypeData.tests.push({
        id: id("test"), name,
        result: $("#prototypeTestResult").value,
        date: $("#prototypeTestDate").value || todayISO(),
        description: $("#prototypeTestDescription").value.trim()
    });
    if (await commit("Test added.")) closeModal($("#prototypeTestModal"));
});

$("#addMeasurement")?.addEventListener("click", () => {
    ["#prototypeMeasurementParameter","#prototypeMeasurementExpected","#prototypeMeasurementMeasured","#prototypeMeasurementUnit"]
        .forEach(s => $(s).value = "");
    $("#prototypeMeasurementResult").value = "PASS";
    openModal($("#prototypeMeasurementModal"));
});
$("#savePrototypeMeasurement")?.addEventListener("click", async () => {
    const parameter = $("#prototypeMeasurementParameter").value.trim();
    if (!parameter) return showToast("Measurement parameter is required.");
    prototypeData.measurements.push({
        id: id("measurement"), parameter,
        expected: $("#prototypeMeasurementExpected").value.trim(),
        measured: $("#prototypeMeasurementMeasured").value.trim(),
        unit: $("#prototypeMeasurementUnit").value.trim(),
        result: $("#prototypeMeasurementResult").value
    });
    if (await commit("Measurement added.")) closeModal($("#prototypeMeasurementModal"));
});

$("#addIteration")?.addEventListener("click", () => {
    $("#prototypeIterationVersion").value = "";
    $("#prototypeIterationDate").value = todayISO();
    $("#prototypeIterationTitle").value = "";
    $("#prototypeIterationDescription").value = "";
    $("#prototypeIterationChanges").value = "";
    openModal($("#prototypeIterationModal"));
});
$("#savePrototypeIteration")?.addEventListener("click", async () => {
    const version = $("#prototypeIterationVersion").value.trim();
    const title = $("#prototypeIterationTitle").value.trim();
    if (!version || !title) return showToast("Version and title are required.");
    const item = {
        id: id("iteration"), version, title,
        date: $("#prototypeIterationDate").value || todayISO(),
        description: $("#prototypeIterationDescription").value.trim(),
        changes: $("#prototypeIterationChanges").value.split("\n").map(x => x.trim()).filter(Boolean)
    };
    prototypeData.iterations.unshift(item);
    prototypeData.version = version;
    prototypeData.versionTitle = title;
    prototypeData.versionDescription = item.description;
    if (await commit("Iteration added.")) closeModal($("#prototypeIterationModal"));
});

function setupSimpleList(button, modal, save, titleInput, descriptionInput, key, label) {
    $(button)?.addEventListener("click", () => {
        $(titleInput).value = "";
        $(descriptionInput).value = "";
        openModal($(modal));
    });
    $(save)?.addEventListener("click", async () => {
        const title = $(titleInput).value.trim();
        if (!title) return showToast(`${label} title is required.`);
        prototypeData[key].push({
            id: id(key), title,
            description: $(descriptionInput).value.trim()
        });
        if (await commit(`${label} added.`)) closeModal($(modal));
    });
}
setupSimpleList("#addFailure","#prototypeFailureModal","#savePrototypeFailure",
    "#prototypeFailureTitle","#prototypeFailureDescription","failures","Failure");
setupSimpleList("#addModification","#prototypeModificationModal","#savePrototypeModification",
    "#prototypeModificationTitle","#prototypeModificationDescription","modifications","Modification");

$("#addImprovement")?.addEventListener("click", () => {
    $("#prototypeImprovementPriority").value = "MEDIUM PRIORITY";
    $("#prototypeImprovementTitle").value = "";
    $("#prototypeImprovementDescription").value = "";
    openModal($("#prototypeImprovementModal"));
});
$("#savePrototypeImprovement")?.addEventListener("click", async () => {
    const title = $("#prototypeImprovementTitle").value.trim();
    if (!title) return showToast("Improvement title is required.");
    prototypeData.improvements.push({
        id: id("improvement"),
        priority: $("#prototypeImprovementPriority").value,
        title,
        description: $("#prototypeImprovementDescription").value.trim()
    });
    if (await commit("Improvement added.")) closeModal($("#prototypeImprovementModal"));
});

$("#savePrototypeOutcome")?.addEventListener("click", async () => {
    prototypeData.outcome = $("#prototypeOutcome").value.trim();
    await commit("Prototype outcome saved.");
});

/* =========================================================
   LINKS / FILES
   Metadata and URL links are persistent. Raw local files
   cannot survive refresh unless uploaded to storage.
========================================================= */

$("#addPrototypeLink")?.addEventListener("click", () => {
    $("#prototypeLinkTitle").value = "";
    $("#prototypeLinkURL").value = "";
    $("#prototypeLinkDescription").value = "";
    openModal($("#prototypeLinkModal"));
});

$("#savePrototypeLink")?.addEventListener("click", async () => {
    const title = $("#prototypeLinkTitle").value.trim();
    const url = $("#prototypeLinkURL").value.trim();
    if (!title || !url) return showToast("Title and URL are required.");
    try { new URL(url); } catch { return showToast("Enter a valid URL."); }

    prototypeData.resources.push({
        id: id("resource"),
        kind: "link",
        type: "LINK",
        title,
        url,
        description: $("#prototypeLinkDescription").value.trim()
    });

    if (await commit("Link added.")) closeModal($("#prototypeLinkModal"));
});

const fileInput = $("#prototypeFileInput");
$("#uploadPrototypeFile")?.addEventListener("click", () => fileInput?.click());
$("#prototypeUploadZone")?.addEventListener("click", () => fileInput?.click());

function addLocalFileMetadata(file) {
    prototypeData.resources.push({
        id: id("resource"),
        kind: "file",
        type: (file.name.split(".").pop() || "FILE").toUpperCase().slice(0, 5),
        title: file.name,
        description: `${file.type || "File"} · ${(file.size / 1024).toFixed(1)} KB`,
        url: ""
    });
}

fileInput?.addEventListener("change", async e => {
    [...e.target.files].forEach(addLocalFileMetadata);
    e.target.value = "";
    await commit("File metadata saved. Configure storage upload to make files downloadable after refresh.");
});

const zone = $("#prototypeUploadZone");
if (zone) {
    ["dragenter","dragover"].forEach(name => zone.addEventListener(name, e => {
        e.preventDefault(); zone.classList.add("dragging");
    }));
    ["dragleave","drop"].forEach(name => zone.addEventListener(name, e => {
        e.preventDefault(); zone.classList.remove("dragging");
    }));
    zone.addEventListener("drop", async e => {
        [...e.dataTransfer.files].forEach(addLocalFileMetadata);
        await commit("File metadata saved. Configure storage upload to persist file contents.");
    });
}

initializeDeleteSystem();

/* =========================================================
   INITIAL LOAD
========================================================= */

(async function initialize() {
    try {
        await loadPrototypeData();
        console.log("RiGiD Prototype loaded:", prototypeData);
    } catch (error) {
        console.error("RiGiD Prototype initialization error:", error);
        prototypeData = emptyData();
        renderEverything();
        showToast(error.message || "Unable to load Prototype.");
    }
})();

});
