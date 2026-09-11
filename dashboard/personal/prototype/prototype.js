/* =========================================================
   RiGiD — PROTOTYPE WORKSPACE
   Persistent data • immediate UI • background saving
   No window.prompt() / window.confirm()
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
"use strict";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

let currentWorkId = getWorkId();
let prototypeData = null;
let saveQueue = Promise.resolve();
let saveRevision = 0;
let toastTimer = null;
let loading = true;
let rigidDataCache = {};

/* =========================================================
   DATA
========================================================= */

function now() {
    return new Date().toISOString();
}

function id(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function arr(value) {
    return Array.isArray(value) ? value : [];
}

function emptyData() {
    const timestamp = now();
    return {
        title: "",
        description: "",
        status: "planning",
        version: "",
        versionTitle: "",
        versionDescription: "",
        tags: [],
        owner: "You",
        startedAt: timestamp,
        updatedAt: timestamp,
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

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function ensureItemId(item, prefix) {
    if (!item || typeof item !== "object") return item;
    if (!item.id) item.id = id(prefix);
    return item;
}

function normalizeData(source) {
    const base = emptyData();
    const s = source && typeof source === "object" ? source : {};
    const result = {
        ...base,
        ...s,
        tags: arr(s.tags).map(String).filter(Boolean),
        specifications: arr(s.specifications).map(x => ensureItemId({
            name: x?.name || x?.parameter || "",
            value: x?.value ?? x?.measured ?? ""
        }, "spec")),
        designDecisions: arr(s.designDecisions).map(x => ensureItemId({
            title: x?.title || "",
            description: x?.description || ""
        }, "decision")),
        buildLog: arr(s.buildLog).map(x => ensureItemId({
            title: x?.title || "",
            date: x?.date || todayISO(),
            progress: Number.isFinite(Number(x?.progress)) ? Number(x.progress) : null,
            description: x?.description || ""
        }, "build")),
        components: arr(s.components).map(x => ensureItemId({
            name: x?.name || "",
            quantity: Number(x?.quantity) || 1,
            status: x?.status || "active",
            description: x?.description || ""
        }, "component")),
        tests: arr(s.tests).map(x => ensureItemId({
            name: x?.name || "",
            result: ["passed","failed","pending"].includes(x?.result) ? x.result : "pending",
            date: x?.date || todayISO(),
            description: x?.description || ""
        }, "test")),
        measurements: arr(s.measurements).map(x => ensureItemId({
            parameter: x?.parameter || "",
            expected: x?.expected ?? "",
            measured: x?.measured ?? "",
            unit: x?.unit || "",
            result: ["PASS","CHECK","FAIL"].includes(String(x?.result || "").toUpperCase())
                ? String(x.result).toUpperCase()
                : "CHECK"
        }, "measurement")),
        iterations: arr(s.iterations).map(x => ensureItemId({
            version: x?.version || "",
            title: x?.title || "",
            date: x?.date || todayISO(),
            description: x?.description || "",
            changes: arr(x?.changes).map(String).filter(Boolean)
        }, "iteration")),
        failures: arr(s.failures).map(x => ensureItemId({
            title: x?.title || "",
            description: x?.description || ""
        }, "failure")),
        modifications: arr(s.modifications).map(x => ensureItemId({
            title: x?.title || "",
            description: x?.description || ""
        }, "modification")),
        improvements: arr(s.improvements).map(x => ensureItemId({
            priority: x?.priority || "MEDIUM PRIORITY",
            title: x?.title || "",
            description: x?.description || ""
        }, "improvement")),
        resources: arr(s.resources).map(x => ensureItemId({
            id: x?.id || "",
            driveFileId: x?.driveFileId || "",
            name: x?.name || x?.title || "Resource",
            kind: x?.kind || "file",
            type: x?.type || x?.fileType || "FILE",
            title: x?.title || x?.name || "Resource",
            url: x?.url || x?.webViewLink || x?.webContentLink || "",
            webViewLink: x?.webViewLink || "",
            webContentLink: x?.webContentLink || "",
            publicUrl: x?.publicUrl || "",
            downloadUrl: x?.downloadUrl || "",
            description: x?.description || "",
            bucket: x?.bucket || "",
            storagePath: x?.storagePath || "",
            mimeType: x?.mimeType || "",
            size: Number(x?.size) || 0,
            createdAt: x?.createdAt || x?.date || "",
            status: x?.status || "ready"
        }, "resource")),
        nextAction: {
            title: s.nextAction?.title || "",
            dueDate: s.nextAction?.dueDate || ""
        }
    };

    /*
     * Completion is a real Prototype state, not just a visual progress
     * value. Keep the two fields synchronized whenever 100% is reached.
     */
    if (Number(result.progress) >= 100) {
        result.progress = 100;
        result.progressPhase = "Completed";
        result.status = "completed";
    }

    const numericProgress = Math.max(0, Math.min(100, Number(result.progress) || 0));
    result.progress = numericProgress;
    if (numericProgress >= 100) {
        result.progress = 100;
        result.progressPhase = "Completed";
        result.status = "completed";
    }

    /* The first/newest iteration is always the current iteration. */
    if (result.iterations.length) {
        const current = result.iterations[0];
        if (!result.version) result.version = current.version;
        if (!result.versionTitle) result.versionTitle = current.title;
        if (!result.versionDescription) result.versionDescription = current.description || "";
    }

    return result;
}

/* =========================================================
   SUPABASE / WORK ID
========================================================= */

function getWorkId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("work_id") ||
           params.get("id") ||
           params.get("work") ||
           params.get("prototype");
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
        return String(SUPABASE_FUNCTIONS_URL).replace(/\/$/, "");
    }

    if (window.SUPABASE_FUNCTIONS_URL) {
        return String(window.SUPABASE_FUNCTIONS_URL).replace(/\/$/, "");
    }

    const client = getSupabaseClient();
    const url = client?.supabaseUrl || client?.rest?.url || "";

    if (url) {
        return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "") + "/functions/v1";
    }

    throw new Error("Supabase Functions URL is not configured.");
}

async function loadPrototypeData() {
    if (!currentWorkId) {
        throw new Error("Work ID is missing from the URL.");
    }

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

    let result = {};
    try {
        result = await response.json();
    } catch {
        throw new Error("The server returned an invalid response.");
    }

    if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load Prototype data.");
    }

    const rigidData = result.data && typeof result.data === "object" ? result.data : {};
    rigidDataCache = clone(rigidData);
    const workspace = rigidData.workspace || {};
    const prototype =
        rigidData.prototype ||
        rigidData.prototype_data ||
        rigidData.prototypeData ||
        {};

    prototypeData = normalizeData({
        ...prototype,
        title: prototype.title || workspace.title || result.work?.title || "",
        description: prototype.description || workspace.description || "",
        status: prototype.status || workspace.status || "planning",
        owner: prototype.owner || workspace.owner || "You",
        startedAt: prototype.startedAt || workspace.createdAt || now(),
        updatedAt: prototype.updatedAt || workspace.updatedAt || now()
    });

    renderEverything();
}

async function saveSnapshot(snapshot) {
    if (!currentWorkId) throw new Error("Work ID is missing.");

    const session = await getSession();
    const functionsURL = getFunctionsURL();

    const workspace = {
        ...(rigidDataCache.workspace || {}),
        id: rigidDataCache.workspace?.id || currentWorkId,
        type: rigidDataCache.workspace?.type || "prototype",
        title: snapshot.title || rigidDataCache.workspace?.title || "Untitled Prototype",
        status: snapshot.status || rigidDataCache.workspace?.status || "planning",
        createdAt: snapshot.startedAt || rigidDataCache.workspace?.createdAt || now(),
        updatedAt: now()
    };

    const rigidData = {
        ...rigidDataCache,
        version: Number(rigidDataCache.version) || 1,
        workspace,
        prototype: snapshot
    };

    const response = await fetch(`${functionsURL}/update-rigid-work-data`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
            work_id: currentWorkId,
            data: rigidData
        })
    });

    let result = {};
    try {
        result = await response.json();
    } catch {
        throw new Error("The server returned an invalid save response.");
    }

    if (!response.ok || result.success === false) {
        throw new Error(result.error || result.message || "Unable to save Prototype data.");
    }

    rigidDataCache = clone(rigidData);
    return result;
}

/*
 * Every edit is rendered and the relevant modal is closed first.
 * The network save is queued afterwards. Saves are serialized and
 * each request contains a complete snapshot, preventing stale
 * requests from overwriting a newer local edit.
 */
function queueSave(message, previousState) {
    if (!prototypeData) return;

    const revision = ++saveRevision;
    prototypeData.updatedAt = now();

    const snapshot = clone(prototypeData);

    saveQueue = saveQueue
        .catch(() => {})
        .then(async () => {
            try {
                await saveSnapshot(snapshot);
                if (revision === saveRevision && message) showToast(message);
            } catch (error) {
                console.error("RiGiD Prototype save error:", error);

                if (revision === saveRevision && previousState) {
                    prototypeData = normalizeData(previousState);
                    renderEverything();
                }

                showToast(error.message || "Unable to save changes.");
            }
        });

    return saveQueue;
}

function mutateAndSave(mutator, message, onDone) {
    if (!prototypeData) return;

    const previousState = clone(prototypeData);

    try {
        mutator();
        prototypeData.updatedAt = now();
        renderEverything();

        if (typeof onDone === "function") onDone();

        queueSave(message, previousState);
    } catch (error) {
        prototypeData = normalizeData(previousState);
        renderEverything();
        console.error(error);
        showToast(error.message || "Unable to update Prototype.");
    }
}

/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(value, includeYear = true) {
    if (!value) return "—";

    const raw = String(value);
    const date = new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(raw)
            ? `${raw}T00:00:00`
            : raw
    );

    if (Number.isNaN(date.getTime())) return raw;

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        ...(includeYear ? { year: "numeric" } : {})
    }).toUpperCase();
}

function todayISO() {
    const date = new Date();
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

function phaseForProgress(progress) {
    const value = Number(progress) || 0;
    if (value >= 100) return "Completed";
    if (value >= 75) return "Testing phase";
    if (value >= 45) return "Build phase";
    if (value >= 20) return "Design phase";
    return "Planning phase";
}

function showToast(message) {
    const element = $("#prototypeToast");
    if (!element) return;

    element.textContent = message;
    element.classList.remove("hidden");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.add("hidden"), 3000);
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
    const element = $(selector);
    if (element) element.textContent = value || fallback;
}

function setHTML(selector, html) {
    const element = $(selector);
    if (element) element.innerHTML = html;
}

function emptyState(text) {
    return `<div class="empty-state">${escapeHTML(text)}</div>`;
}

function safeStatus(value) {
    return ["planning","designing","building","testing","completed"].includes(value)
        ? value
        : "planning";
}

function resourceExtension(name) {
    const match = String(name || "").match(/\.([^.]+)$/);
    return (match ? match[1] : "FILE").toUpperCase().slice(0, 5);
}

function formatBytes(bytes) {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} MB`;
    return `${(size / 1024 ** 3).toFixed(1)} GB`;
}

/* =========================================================
   DELETE CONFIRMATION MODAL
========================================================= */

let confirmationResolver = null;

function askConfirmation(title, message, confirmText = "Delete") {
    const modal = $("#prototypeConfirmModal");

    if (!modal) {
        return Promise.resolve(false);
    }

    $("#prototypeConfirmTitle").textContent = title;
    $("#prototypeConfirmMessage").textContent = message;
    $("#prototypeConfirmButton").textContent = confirmText;

    openModal(modal);

    return new Promise(resolve => {
        confirmationResolver = resolve;
    });
}

function resolveConfirmation(value) {
    const modal = $("#prototypeConfirmModal");
    if (confirmationResolver) {
        const resolver = confirmationResolver;
        confirmationResolver = null;
        resolver(value);
    }
    closeModal(modal);
}

$("#prototypeConfirmButton")?.addEventListener("click", () => resolveConfirmation(true));
$("#cancelPrototypeConfirm")?.addEventListener("click", () => resolveConfirmation(false));
$("#closePrototypeConfirmModal")?.addEventListener("click", () => resolveConfirmation(false));
$("#prototypeConfirmModal")?.addEventListener("click", event => {
    if (event.target === $("#prototypeConfirmModal")) resolveConfirmation(false);
});

/* =========================================================
   DELETE SYSTEM
========================================================= */

function deleteButton(section, itemId, label = "Delete") {
    return `
        <button
            type="button"
            class="prototype-delete-button"
            data-delete-section="${escapeHTML(section)}"
            data-delete-id="${escapeHTML(itemId)}"
            title="${escapeHTML(label)}"
            aria-label="${escapeHTML(label)}"
        >×</button>`;
}

function deleteFieldButton(field, label = "Delete") {
    return `
        <button
            type="button"
            class="prototype-delete-button prototype-delete-field"
            data-delete-field="${escapeHTML(field)}"
            title="${escapeHTML(label)}"
            aria-label="${escapeHTML(label)}"
        >×</button>`;
}

function findPrototypeItem(section, itemId) {
    return arr(prototypeData?.[section])
        .find(item => String(item?.id) === String(itemId));
}

async function deletePrototypeItem(section, itemId) {
    if (!prototypeData || !Array.isArray(prototypeData[section])) return;

    const index = section === "tags"
        ? Number(itemId)
        : prototypeData[section].findIndex(item => String(item?.id) === String(itemId));

    if (!Number.isInteger(index) || index < 0 || index >= prototypeData[section].length) return;

    const item = prototypeData[section][index];
    const name = typeof item === "string"
        ? item
        : item?.title || item?.name || item?.parameter || item?.version || "this item";

    const confirmed = await askConfirmation(
        "Delete item?",
        `Are you sure you want to delete "${name}"?`,
        "Delete"
    );
    if (!confirmed) return;

    const previousState = clone(prototypeData);
    const driveFileId = section === "resources" ? (item?.driveFileId || item?.id) : "";

    prototypeData[section].splice(index, 1);
    if (section === "iterations") syncCurrentIteration();
    prototypeData.updatedAt = now();
    renderEverything();
    showToast("Removed.");

    try {
        if (section === "resources" && driveFileId && item?.kind !== "link") {
            await deleteFileFromDrive(driveFileId);
        }
        queueSave("Changes saved.", previousState);
    } catch (error) {
        prototypeData = normalizeData(previousState);
        renderEverything();
        console.error("Delete Prototype item error:", error);
        showToast(error.message || "Unable to remove item.");
    }
}

async function clearPrototypeField(field) {
    if (!prototypeData || !(field in prototypeData)) return;

    const labels = {
        objective: "objective",
        designConcept: "design concept",
        outcome: "prototype outcome",
        nextAction: "next action",
        version: "current version"
    };

    const confirmed = await askConfirmation(
        `Delete ${labels[field] || field}?`,
        `This will permanently remove the current ${labels[field] || field} from this Prototype.`,
        "Delete"
    );

    if (!confirmed) return;

    const previousState = clone(prototypeData);

    if (field === "nextAction") {
        prototypeData.nextAction = { title: "", dueDate: "" };
    } else if (field === "version") {
        prototypeData.version = "";
        prototypeData.versionTitle = "";
        prototypeData.versionDescription = "";
    } else {
        prototypeData[field] = "";
    }

    prototypeData.updatedAt = now();
    renderEverything();
    showToast("Removed.");
    queueSave("Changes saved.", previousState);
}

function initializeDeleteSystem() {
    document.addEventListener("click", event => {
        const button = event.target.closest(
            "[data-delete-section], [data-delete-field]"
        );

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

    const status = safeStatus(prototypeData.status);
    setText("#prototypeStatus", `● ${status.toUpperCase()}`);
    setText("#prototypeVersion", prototypeData.version, "—");
    setText("#prototypeOwner", prototypeData.owner, "You");
    setText("#prototypeStarted", formatDate(prototypeData.startedAt));
    setText("#prototypeLastUpdated", formatDate(prototypeData.updatedAt));

    const tags = $("#prototypeTags");
    if (!tags) return;

    tags.innerHTML = prototypeData.tags.length
        ? prototypeData.tags.map((tag, index) => `
            <span class="prototype-tag prototype-delete-row">
                <span>${escapeHTML(tag)}</span>
                ${deleteButton("tags", String(index), "Delete tag")}
            </span>
        `).join("")
        : emptyState("No tags added.");
}

function renderOverview() {
    const progress = Math.max(
        0,
        Math.min(100, Number(prototypeData.progress) || 0)
    );

    setText("#prototypeProgress", `${progress}%`, "0%");

    const progressBar = $("#prototypeProgressBar");
    if (progressBar) progressBar.style.width = `${progress}%`;

    setText(
        "#prototypeProgressStatus",
        prototypeData.progressPhase || phaseForProgress(progress)
    );

    setText("#buildProgressPercentage", `${progress}%`, "0%");

    const buildBar = $("#buildProgressBar");
    if (buildBar) buildBar.style.width = `${progress}%`;

    setText(
        "#buildProgressLabel",
        prototypeData.progressPhase || phaseForProgress(progress)
    );

    setText("#currentVersion", prototypeData.version, "—");
    setText("#currentVersionTitle", prototypeData.versionTitle, "No version title");

    setHTML(
        "#currentVersionDescription",
        prototypeData.version
            ? `<div class="prototype-delete-row">
                 <span>${escapeHTML(prototypeData.versionDescription || "No version description")}</span>
                 ${deleteFieldButton("version", "Delete current version")}
               </div>`
            : "No version description"
    );

    setHTML(
        "#prototypeNextActionTitle",
        prototypeData.nextAction.title
            ? `<div class="prototype-delete-row">
                 <span>${escapeHTML(prototypeData.nextAction.title)}</span>
                 ${deleteFieldButton("nextAction", "Delete next action")}
               </div>`
            : emptyState("No next action")
    );

    setText(
        "#prototypeNextActionDue",
        prototypeData.nextAction.dueDate
            ? `Due: ${formatDate(prototypeData.nextAction.dueDate, false)}`
            : "No due date"
    );

    setHTML(
        "#prototypeObjective",
        prototypeData.objective
            ? `<div class="prototype-delete-row">
                 <p>${escapeHTML(prototypeData.objective)}</p>
                 ${deleteFieldButton("objective", "Delete objective")}
               </div>`
            : emptyState("No objective added yet.")
    );
}

function renderDesign() {
    setHTML(
        "#designConcept",
        prototypeData.designConcept
            ? `<div class="prototype-delete-row">
                 <p>${escapeHTML(prototypeData.designConcept)}</p>
                 ${deleteFieldButton("designConcept", "Delete design concept")}
               </div>`
            : emptyState("No design concept added yet.")
    );

    setHTML(
        "#specificationList",
        prototypeData.specifications.length
            ? prototypeData.specifications.map(item => `
                <div class="specification-row prototype-delete-row">
                    <span>${escapeHTML(item.name)}</span>
                    <strong>${escapeHTML(item.value)}</strong>
                    ${deleteButton("specifications", item.id, "Delete specification")}
                </div>
            `).join("")
            : emptyState("No specifications added yet.")
    );

    setHTML(
        "#designDecisionList",
        prototypeData.designDecisions.length
            ? prototypeData.designDecisions.map(item => `
                <div class="design-decision prototype-delete-row">
                    <div>
                        <strong>${escapeHTML(item.title)}</strong>
                        <p>${escapeHTML(item.description || "")}</p>
                    </div>
                    ${deleteButton("designDecisions", item.id, "Delete design decision")}
                </div>
            `).join("")
            : emptyState("No design decisions added yet.")
    );
}

function renderBuild() {
    setHTML(
        "#buildLogList",
        prototypeData.buildLog.length
            ? prototypeData.buildLog.map(item => `
                <article class="build-log-entry prototype-delete-row">
                    <div class="build-log-date">${escapeHTML(formatDate(item.date))}</div>
                    <div class="build-log-content">
                        <strong>${escapeHTML(item.title)}</strong>
                        <p>${escapeHTML(item.description || "")}</p>
                    </div>
                    ${deleteButton("buildLog", item.id, "Delete build entry")}
                </article>
            `).join("")
            : emptyState("No build activities recorded yet.")
    );
}

function renderComponents() {
    setHTML(
        "#prototypeComponentList",
        prototypeData.components.length
            ? prototypeData.components.map(item => `
                <article class="component-card">
                    <div class="component-card-top prototype-delete-row">
                        <strong>${escapeHTML(item.name)}</strong>
                        <span>${escapeHTML((item.status || "active").toUpperCase())}</span>
                        ${deleteButton("components", item.id, "Delete component")}
                    </div>
                    <p>${escapeHTML(item.description || "")}</p>
                    <small>Quantity: ${escapeHTML(item.quantity || 1)}</small>
                </article>
            `).join("")
            : emptyState("No components added yet.")
    );
}

function renderTesting() {
    const tests = prototypeData.tests;

    setText("#prototypeTestTotal", String(tests.length), "0");
    setText("#prototypeTestPassed", String(
        tests.filter(item => item.result === "passed").length
    ), "0");
    setText("#prototypeTestFailed", String(
        tests.filter(item => item.result === "failed").length
    ), "0");
    setText("#prototypeTestPending", String(
        tests.filter(item => item.result === "pending").length
    ), "0");

    setHTML(
        "#prototypeTestList",
        tests.length
            ? tests.map(item => {
                const result = ["passed","failed","pending"].includes(item.result)
                    ? item.result
                    : "pending";

                return `
                    <article class="prototype-test ${result}">
                        <div class="test-result-icon">
                            ${result === "passed" ? "✓" : result === "failed" ? "!" : "•"}
                        </div>
                        <div class="prototype-test-info">
                            <strong>${escapeHTML(item.name)}</strong>
                            <p>${escapeHTML(item.description || "")}</p>
                        </div>
                        <span class="test-result-badge ${result}">
                            ${escapeHTML(result.toUpperCase())}
                        </span>
                        ${deleteButton("tests", item.id, "Delete test")}
                    </article>
                `;
            }).join("")
            : emptyState("No tests recorded yet.")
    );

    const body = $("#measurementTableBody");
    if (!body) return;

    body.innerHTML = prototypeData.measurements.length
        ? prototypeData.measurements.map(item => {
            const result = ["PASS","CHECK","FAIL"].includes(item.result)
                ? item.result
                : "CHECK";

            const className =
                result === "PASS" ? "measurement-pass" :
                result === "FAIL" ? "measurement-fail" :
                "measurement-check";

            return `
                <tr>
                    <td>${escapeHTML(item.parameter)}</td>
                    <td>${escapeHTML(item.expected || "—")}</td>
                    <td>${escapeHTML(item.measured || "—")}</td>
                    <td>${escapeHTML(item.unit || "—")}</td>
                    <td class="prototype-delete-row">
                        <span class="${className}">${result}</span>
                        ${deleteButton("measurements", item.id, "Delete measurement")}
                    </td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="5">${escapeHTML("No measurements recorded yet.")}</td></tr>`;
}

function syncCurrentIteration() {
    if (!prototypeData.iterations.length) {
        prototypeData.version = "";
        prototypeData.versionTitle = "";
        prototypeData.versionDescription = "";
        return;
    }

    const current = prototypeData.iterations[0];

    prototypeData.version = current.version || "";
    prototypeData.versionTitle = current.title || "";
    prototypeData.versionDescription = current.description || "";
}

function renderIterations() {
    setHTML(
        "#iterationList",
        prototypeData.iterations.length
            ? prototypeData.iterations.map((item, index) => `
                <article class="iteration-card ${index === 0 ? "current" : ""}">
                    <div class="iteration-version">${escapeHTML(item.version)}</div>
                    <div class="iteration-content">
                        <div class="iteration-top">
                            <strong>${escapeHTML(item.title)}</strong>
                            <span>${escapeHTML(formatDate(item.date))}</span>
                        </div>
                        <p>${escapeHTML(item.description || "")}</p>
                        <div class="iteration-changes">
                            ${arr(item.changes).map(change =>
                                `<span>${escapeHTML(change)}</span>`
                            ).join("")}
                        </div>
                    </div>
                    ${deleteButton("iterations", item.id, "Delete iteration")}
                </article>
            `).join("")
            : emptyState("No prototype iterations recorded yet.")
    );
}

function renderFailures() {
    setHTML(
        "#failureList",
        prototypeData.failures.length
            ? prototypeData.failures.map(item => `
                <div class="failure-item prototype-delete-row">
                    <span class="failure-icon">!</span>
                    <div>
                        <strong>${escapeHTML(item.title)}</strong>
                        <p>${escapeHTML(item.description || "")}</p>
                    </div>
                    ${deleteButton("failures", item.id, "Delete failure")}
                </div>
            `).join("")
            : emptyState("No failures recorded yet.")
    );

    setHTML(
        "#modificationList",
        prototypeData.modifications.length
            ? prototypeData.modifications.map((item, index) => `
                <div class="modification-item prototype-delete-row">
                    <span class="modification-number">
                        ${String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                        <strong>${escapeHTML(item.title)}</strong>
                        <p>${escapeHTML(item.description || "")}</p>
                    </div>
                    ${deleteButton("modifications", item.id, "Delete modification")}
                </div>
            `).join("")
            : emptyState("No modifications recorded yet.")
    );
}

function renderImprovements() {
    setHTML(
        "#improvementGrid",
        prototypeData.improvements.length
            ? prototypeData.improvements.map(item => `
                <article class="improvement-card">
                    <div class="prototype-delete-row">
                        <span>${escapeHTML(item.priority || "MEDIUM PRIORITY")}</span>
                        ${deleteButton("improvements", item.id, "Delete improvement")}
                    </div>
                    <h3>${escapeHTML(item.title)}</h3>
                    <p>${escapeHTML(item.description || "")}</p>
                </article>
            `).join("")
            : emptyState("No future improvements added yet.")
    );

    const outcome = $("#prototypeOutcome");
    if (outcome && document.activeElement !== outcome) {
        outcome.value = prototypeData.outcome || "";
    }

    const outcomeCard = outcome?.closest(".outcome-card");
    if (outcomeCard) {
        let button = outcomeCard.querySelector(
            '[data-delete-field="outcome"]'
        );

        if (prototypeData.outcome && !button) {
            button = document.createElement("button");
            button.type = "button";
            button.className = "prototype-delete-button";
            button.dataset.deleteField = "outcome";
            button.title = "Delete outcome";
            button.setAttribute("aria-label", "Delete outcome");
            button.textContent = "×";

            const footer = outcomeCard.querySelector(".card-footer");
            footer?.prepend(button);
        }

        if (!prototypeData.outcome && button) {
            button.remove();
        }
    }
}

function renderResources() {
    const media = $("#prototypeMediaGrid");
    const files = $("#prototypeFileList");
    const resources = prototypeData.resources;

    const mediaItems = resources.filter(item =>
        item.kind === "media" ||
        String(item.mimeType || "").startsWith("image/") ||
        String(item.mimeType || "").startsWith("video/")
    );

    const fileItems = resources.filter(item => !mediaItems.includes(item));

    if (media) {
        media.innerHTML = mediaItems.length
            ? mediaItems.map(item => {
                const isVideo = String(item.mimeType || "").startsWith("video/");
                const isImage = String(item.mimeType || "").startsWith("image/");

                return `
                    <article class="prototype-media-card">
                        <div class="media-placeholder ${isVideo ? "video" : ""}">
                            ${isImage ? "IMAGE" : isVideo ? "VIDEO" : escapeHTML(item.type || "MEDIA")}
                        </div>
                        <div class="media-info">
                            <strong>${escapeHTML(item.title)}</strong>
                            <span>${escapeHTML(item.description || item.status || "")}</span>
                        </div>
                        <div class="prototype-resource-actions">
                            <button
                                type="button"
                                class="text-button"
                                data-open-resource="${escapeHTML(item.id)}"
                            >Open</button>
                            ${deleteButton("resources", item.id, "Delete resource")}
                        </div>
                    </article>
                `;
            }).join("")
            : "";
    }

    if (files) {
        files.innerHTML = fileItems.length
            ? fileItems.map(item => `
                <article class="prototype-file">
                    <div class="prototype-file-icon">
                        ${escapeHTML(item.type || "FILE")}
                    </div>
                    <div class="prototype-file-info">
                        <strong>${escapeHTML(item.title)}</strong>
                        <span>
                            ${escapeHTML(
                                item.status === "uploading"
                                    ? "Uploading…"
                                    : item.description || (item.size ? formatBytes(item.size) : item.url || "Resource")
                            )}
                        </span>
                    </div>
                    ${item.url || item.storagePath
                        ? `<button type="button" data-open-resource="${escapeHTML(item.id)}">Open</button>`
                        : ""}
                    ${deleteButton("resources", item.id, "Delete resource")}
                </article>
            `).join("")
            : emptyState("No files or links added yet.");
    }

    $$("[data-open-resource]").forEach(button => {
        button.onclick = () => openResource(button.dataset.openResource);
    });
}

/* =========================================================
   RESOURCE OPEN / GOOGLE DRIVE
========================================================= */

async function uploadFileToDrive(file) {
    if (!currentWorkId) throw new Error("Work ID is missing.");

    const session = await getSession();
    const formData = new FormData();
    formData.append("work_id", currentWorkId);
    formData.append("file", file, file.name);

    const response = await fetch(`${getFunctionsURL()}/upload-rigid-file`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${session.access_token}`
        },
        body: formData
    });

    let result = {};
    try {
        result = await response.json();
    } catch {
        throw new Error("Invalid response from file upload service.");
    }

    if (!response.ok || !result.success || !result.file) {
        throw new Error(result.error || "Unable to upload file.");
    }

    return result.file;
}

async function deleteFileFromDrive(driveFileId) {
    if (!driveFileId) return true;

    const session = await getSession();
    const response = await fetch(`${getFunctionsURL()}/delete-rigid-file`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
            work_id: currentWorkId,
            drive_file_id: driveFileId
        })
    });

    let result = {};
    try {
        result = await response.json();
    } catch {
        throw new Error("Invalid response from file deletion service.");
    }

    if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete file from Google Drive.");
    }

    return true;
}

async function openResource(resourceId) {
    const resource = findPrototypeItem("resources", resourceId);
    if (!resource) return;

    const url = resource.url || resource.webViewLink || resource.webContentLink || resource.publicUrl || resource.downloadUrl;
    if (!url) {
        showToast("This resource does not have an accessible link.");
        return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
}

async function processFiles(files) {
    if (!prototypeData) return;
    const selected = [...files].filter(Boolean);
    if (!selected.length) return;

    for (const file of selected) {
        const resource = {
            id: id("resource"),
            driveFileId: "",
            kind: String(file.type || "").startsWith("image/") || String(file.type || "").startsWith("video/") ? "media" : "file",
            type: resourceExtension(file.name),
            title: file.name,
            name: file.name,
            url: "",
            webViewLink: "",
            webContentLink: "",
            description: `${file.type || "File"} · ${formatBytes(file.size)}`,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            status: "uploading",
            createdAt: now()
        };

        const previousState = clone(prototypeData);
        prototypeData.resources.unshift(resource);
        renderEverything();
        showToast(`Uploading ${file.name}…`);

        try {
            const uploaded = await uploadFileToDrive(file);

            resource.driveFileId = uploaded.id || uploaded.driveFileId || "";
            resource.id = resource.id;
            resource.name = uploaded.name || file.name;
            resource.title = uploaded.name || file.name;
            resource.mimeType = uploaded.mimeType || file.type || "application/octet-stream";
            resource.size = Number(uploaded.size || file.size || 0);
            resource.type = uploaded.fileType || resourceExtension(resource.title);
            resource.url = uploaded.webViewLink || uploaded.webContentLink || uploaded.url || "";
            resource.webViewLink = uploaded.webViewLink || "";
            resource.webContentLink = uploaded.webContentLink || "";
            resource.publicUrl = uploaded.publicUrl || "";
            resource.downloadUrl = uploaded.downloadUrl || "";
            resource.status = "ready";

            prototypeData.updatedAt = now();
            renderEverything();
            queueSave("File uploaded and saved.", previousState);
        } catch (error) {
            const index = prototypeData.resources.findIndex(item => item.id === resource.id);
            if (index >= 0) prototypeData.resources.splice(index, 1);
            renderEverything();
            console.error("Prototype file upload error:", error);
            showToast(error.message || "File upload failed.");
        }
    }
}

/* =========================================================
   COMPLETION CELEBRATION
========================================================= */

function celebrateCompletion() {
    /*
     * Lightweight dependency-free celebration. It is deliberately
     * created only when the Prototype crosses into 100% completion.
     */
    const existing = document.querySelector(".prototype-confetti-layer");
    existing?.remove();

    const layer = document.createElement("div");
    layer.className = "prototype-confetti-layer";
    layer.setAttribute("aria-hidden", "true");

    const pieces = 90;

    for (let i = 0; i < pieces; i += 1) {
        const piece = document.createElement("span");
        piece.className = "prototype-confetti-piece";

        const hue = i % 3;
        const colors = [
            "var(--prototype-cyan)",
            "var(--prototype-green)",
            "var(--prototype-orange)"
        ];

        piece.style.background = colors[hue];
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.animationDelay = `${Math.random() * 0.35}s`;
        piece.style.animationDuration = `${1.8 + Math.random() * 1.8}s`;
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;
        piece.style.setProperty("--confetti-x", `${(Math.random() - 0.5) * 220}px`);
        piece.style.setProperty("--confetti-r", `${(Math.random() - 0.5) * 720}deg`);

        layer.appendChild(piece);
    }

    document.body.appendChild(layer);

    window.setTimeout(() => layer.remove(), 4200);
}

/* =========================================================
   HEADER / WORKSPACE NAVIGATION
========================================================= */

function initializeWorkspaceNavigation() {
    const button = $("#backToWorkspace");

    if (!button) return;

    button.addEventListener("click", () => {

        const params = new URLSearchParams(window.location.search);

        /*
         * 1. Explicit return URL, if supplied by the workspace.
         */
        const returnUrl =
            params.get("return") ||
            params.get("return_url") ||
            params.get("workspace_url");

        if (returnUrl) {
            try {
                const target = new URL(returnUrl, window.location.href);

                if (target.origin === window.location.origin) {
                    window.location.assign(target.href);
                    return;
                }
            } catch (error) {
                console.warn(
                    "Invalid workspace return URL:",
                    error
                );
            }
        }

        /*
         * 2. If Prototype was opened from Personal Workspace,
         * return directly to that exact page.
         */
        if (document.referrer) {
            try {
                const referrer = new URL(
                    document.referrer,
                    window.location.href
                );

                if (
                    referrer.origin === window.location.origin &&
                    /personal\.html$/i.test(referrer.pathname)
                ) {
                    window.location.assign(referrer.href);
                    return;
                }
            } catch (error) {
                console.warn(
                    "Unable to read workspace referrer:",
                    error
                );
            }
        }

        /*
         * 3. Normal browser navigation fallback.
         */
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        /*
         * 4. Last-resort fallback.
         *
         * Prototype is one level below the Personal Workspace
         * in the RiGiD page structure.
         */
        window.location.assign("../personal.html");
    });
}

function initializeStatusNavigation() {
    const statusButton = $("#prototypeStatus");
    if (!statusButton) return;

    statusButton.addEventListener("click", () => {
        if (!prototypeData) return;

        $("#prototypeDetailsTitle").value = prototypeData.title || "";
        $("#prototypeDetailsDescription").value = prototypeData.description || "";
        $("#prototypeDetailsStatus").value = safeStatus(prototypeData.status);
        $("#prototypeDetailsVersion").value = prototypeData.version || "";
        $("#prototypeDetailsTags").value = prototypeData.tags.join(", ");

        openModal($("#prototypeDetailsModal"));
    });
}

/* =========================================================
   CLOCK / NAVIGATION
========================================================= */

function updateClock() {
    const date = new Date();

    setText(
        "#prototypeDate",
        date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).toUpperCase()
    );

    setText(
        "#prototypeClock",
        date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })
    );
}

updateClock();
setInterval(updateClock, 1000);

$$(".prototype-nav-item").forEach(button => {
    button.addEventListener("click", () => {
        $$(".prototype-nav-item").forEach(item => item.classList.remove("active"));
        button.classList.add("active");

        document.getElementById(button.dataset.section)?.scrollIntoView({
            behavior: "smooth",
            block: "start"
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

    modal?.addEventListener("click", event => {
        if (event.target === modal) closeModal(modal);
    });
});

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    if (confirmationResolver) {
        resolveConfirmation(false);
        return;
    }

    const openModals = $$(".prototype-modal:not(.hidden)");
    const last = openModals[openModals.length - 1];
    if (last) closeModal(last);
});

/* =========================================================
   FORM ACTIONS
========================================================= */

$("#editPrototype")?.addEventListener("click", () => {
    $("#prototypeDetailsTitle").value = prototypeData.title || "";
    $("#prototypeDetailsDescription").value = prototypeData.description || "";
    $("#prototypeDetailsStatus").value = safeStatus(prototypeData.status);
    $("#prototypeDetailsVersion").value = prototypeData.version || "";
    $("#prototypeDetailsTags").value = prototypeData.tags.join(", ");
    openModal($("#prototypeDetailsModal"));
});

$("#savePrototypeDetails")?.addEventListener("click", () => {
    const title = $("#prototypeDetailsTitle").value.trim();
    if (!title) {
        showToast("Prototype title is required.");
        return;
    }

    const description = $("#prototypeDetailsDescription").value.trim();
    const status = safeStatus($("#prototypeDetailsStatus").value);
    const version = $("#prototypeDetailsVersion").value.trim();
    const tags = $("#prototypeDetailsTags").value
        .split(",")
        .map(value => value.trim())
        .filter(Boolean);

    const wasCompleted = prototypeData.status === "completed" || Number(prototypeData.progress) >= 100;

    mutateAndSave(() => {
        prototypeData.title = title;
        prototypeData.description = description;
        prototypeData.status = status;
        prototypeData.version = version;
        prototypeData.tags = tags;

        if (status === "completed") {
            prototypeData.progress = 100;
            prototypeData.progressPhase = "Completed";
        }
    }, "Prototype details saved.", () => {
        const isCompleted = prototypeData.status === "completed" || Number(prototypeData.progress) >= 100;
        if (!wasCompleted && isCompleted) celebrateCompletion();
    });

    closeModal($("#prototypeDetailsModal"));
});

function openProgress() {
    $("#prototypeProgressInput").value = prototypeData.progress || 0;
    $("#prototypeProgressPhase").value =
        prototypeData.progressPhase || phaseForProgress(prototypeData.progress);

    openModal($("#prototypeProgressModal"));
}

$("#editPrototypeProgress")?.addEventListener("click", openProgress);
$("#updatePrototypeProgress")?.addEventListener("click", openProgress);

$("#savePrototypeProgress")?.addEventListener("click", () => {
    const value = Number($("#prototypeProgressInput").value);

    if (!Number.isFinite(value) || value < 0 || value > 100) {
        showToast("Enter progress between 0 and 100.");
        return;
    }

    const phase = $("#prototypeProgressPhase").value || phaseForProgress(value);
    const wasCompleted = prototypeData.status === "completed" || Number(prototypeData.progress) >= 100;

    mutateAndSave(() => {
        prototypeData.progress = Math.round(value);

        if (value >= 100) {
            prototypeData.progress = 100;
            prototypeData.progressPhase = "Completed";
            prototypeData.status = "completed";
        } else {
            prototypeData.progressPhase = phaseForProgress(value);
            prototypeData.status = safeStatus(
                prototypeData.status === "completed"
                    ? "testing"
                    : prototypeData.status
            );
        }
    }, "Progress updated.", () => {
        const isCompleted = prototypeData.status === "completed" || Number(prototypeData.progress) >= 100;
        if (!wasCompleted && isCompleted) celebrateCompletion();
    });

    closeModal($("#prototypeProgressModal"));
});

$("#editVersion")?.addEventListener("click", () => {
    $("#prototypeVersionInput").value = prototypeData.version || "";
    $("#prototypeVersionTitleInput").value = prototypeData.versionTitle || "";
    $("#prototypeVersionDescriptionInput").value =
        prototypeData.versionDescription || "";

    openModal($("#prototypeVersionModal"));
});

$("#savePrototypeVersion")?.addEventListener("click", () => {
    const version = $("#prototypeVersionInput").value.trim();

    if (!version) {
        showToast("Version is required.");
        return;
    }

    mutateAndSave(() => {
        prototypeData.version = version;
        prototypeData.versionTitle = $("#prototypeVersionTitleInput").value.trim();
        prototypeData.versionDescription =
            $("#prototypeVersionDescriptionInput").value.trim();
    }, "Version updated.");

    closeModal($("#prototypeVersionModal"));
});

$("#editPrototypeNext")?.addEventListener("click", () => {
    $("#prototypeNextActionInput").value = prototypeData.nextAction.title || "";
    $("#prototypeNextActionDate").value = prototypeData.nextAction.dueDate || "";
    openModal($("#prototypeNextActionModal"));
});

$("#savePrototypeNextAction")?.addEventListener("click", () => {
    const title = $("#prototypeNextActionInput").value.trim();

    if (!title) {
        showToast("Next action is required.");
        return;
    }

    mutateAndSave(() => {
        prototypeData.nextAction = {
            title,
            dueDate: $("#prototypeNextActionDate").value || ""
        };
    }, "Next action saved.");

    closeModal($("#prototypeNextActionModal"));
});

$("#editObjective")?.addEventListener("click", () => {
    $("#prototypeObjectiveInput").value = prototypeData.objective || "";
    openModal($("#prototypeObjectiveModal"));
});

$("#savePrototypeObjective")?.addEventListener("click", () => {
    mutateAndSave(() => {
        prototypeData.objective = $("#prototypeObjectiveInput").value.trim();
    }, "Objective saved.");

    closeModal($("#prototypeObjectiveModal"));
});

$("#editDesign")?.addEventListener("click", () => {
    $("#prototypeDesignConceptInput").value =
        prototypeData.designConcept || "";
    openModal($("#prototypeDesignModal"));
});

$("#savePrototypeDesign")?.addEventListener("click", () => {
    mutateAndSave(() => {
        prototypeData.designConcept =
            $("#prototypeDesignConceptInput").value.trim();
    }, "Design concept saved.");

    closeModal($("#prototypeDesignModal"));
});

function resetFields(fields) {
    Object.entries(fields).forEach(([selector, value]) => {
        const element = $(selector);
        if (element) element.value = value;
    });
}

function setupAddModal(buttonSelector, modalSelector, fields) {
    $(buttonSelector)?.addEventListener("click", () => {
        resetFields(fields);
        openModal($(modalSelector));
    });
}

setupAddModal("#addSpecification", "#prototypeSpecificationModal", {
    "#prototypeSpecificationName": "",
    "#prototypeSpecificationValue": ""
});

$("#savePrototypeSpecification")?.addEventListener("click", () => {
    const name = $("#prototypeSpecificationName").value.trim();
    const value = $("#prototypeSpecificationValue").value.trim();

    if (!name || !value) {
        showToast("Parameter and value are required.");
        return;
    }

    mutateAndSave(() => {
        prototypeData.specifications.push({
            id: id("spec"),
            name,
            value
        });
    }, "Specification added.");

    closeModal($("#prototypeSpecificationModal"));
});

setupAddModal("#addDesignDecision", "#prototypeDesignDecisionModal", {
    "#prototypeDesignDecisionTitle": "",
    "#prototypeDesignDecisionDescription": ""
});

$("#savePrototypeDesignDecision")?.addEventListener("click", () => {
    const title = $("#prototypeDesignDecisionTitle").value.trim();

    if (!title) {
        showToast("Design decision is required.");
        return;
    }

    mutateAndSave(() => {
        prototypeData.designDecisions.push({
            id: id("decision"),
            title,
            description: $("#prototypeDesignDecisionDescription").value.trim()
        });
    }, "Design decision added.");

    closeModal($("#prototypeDesignDecisionModal"));
});

$("#addBuildEntry")?.addEventListener("click", () => {
    resetFields({
        "#buildEntryTitle": "",
        "#buildEntryDate": todayISO(),
        "#buildEntryProgress": prototypeData.progress || 0,
        "#buildEntryDescription": ""
    });
    openModal($("#buildModal"));
});

$("#saveBuildEntry")?.addEventListener("click", () => {
    const title = $("#buildEntryTitle").value.trim();
    const progress = Number($("#buildEntryProgress").value);

    if (!title) {
        showToast("Build activity is required.");
        return;
    }

    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
        showToast("Enter valid progress.");
        return;
    }

    mutateAndSave(() => {
        prototypeData.buildLog.unshift({
            id: id("build"),
            title,
            date: $("#buildEntryDate").value || todayISO(),
            progress: Math.round(progress),
            description: $("#buildEntryDescription").value.trim()
        });

        prototypeData.progress = Math.round(progress);

        if (progress >= 100) {
            prototypeData.progress = 100;
            prototypeData.progressPhase = "Completed";
            prototypeData.status = "completed";
        } else {
            prototypeData.progressPhase = phaseForProgress(progress);
        }
    }, "Build entry added.");

    closeModal($("#buildModal"));
});

$("#addComponent")?.addEventListener("click", () => {
    resetFields({
        "#prototypeComponentName": "",
        "#prototypeComponentQuantity": 1,
        "#prototypeComponentStatus": "active",
        "#prototypeComponentDescription": ""
    });
    openModal($("#prototypeComponentModal"));
});

$("#savePrototypeComponent")?.addEventListener("click", () => {
    const name = $("#prototypeComponentName").value.trim();
    const quantity = Number($("#prototypeComponentQuantity").value);

    if (!name) {
        showToast("Component name is required.");
        return;
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
        showToast("Quantity must be at least 1.");
        return;
    }

    mutateAndSave(() => {
        prototypeData.components.push({
            id: id("component"),
            name,
            quantity: Math.round(quantity),
            status: $("#prototypeComponentStatus").value || "active",
            description: $("#prototypeComponentDescription").value.trim()
        });
    }, "Component added.");

    closeModal($("#prototypeComponentModal"));
});

$("#addPrototypeTest")?.addEventListener("click", () => {
    resetFields({
        "#prototypeTestName": "",
        "#prototypeTestResult": "pending",
        "#prototypeTestDate": todayISO(),
        "#prototypeTestDescription": ""
    });
    openModal($("#prototypeTestModal"));
});

$("#savePrototypeTest")?.addEventListener("click", () => {
    const name = $("#prototypeTestName").value.trim();

    if (!name) {
        showToast("Test name is required.");
        return;
    }

    mutateAndSave(() => {
        prototypeData.tests.push({
            id: id("test"),
            name,
            result: $("#prototypeTestResult").value || "pending",
            date: $("#prototypeTestDate").value || todayISO(),
            description: $("#prototypeTestDescription").value.trim()
        });
    }, "Test added.");

    closeModal($("#prototypeTestModal"));
});

$("#addMeasurement")?.addEventListener("click", () => {
    resetFields({
        "#prototypeMeasurementParameter": "",
        "#prototypeMeasurementExpected": "",
        "#prototypeMeasurementMeasured": "",
        "#prototypeMeasurementUnit": "",
        "#prototypeMeasurementResult": "PASS"
    });
    openModal($("#prototypeMeasurementModal"));
});

$("#savePrototypeMeasurement")?.addEventListener("click", () => {
    const parameter = $("#prototypeMeasurementParameter").value.trim();

    if (!parameter) {
        showToast("Measurement parameter is required.");
        return;
    }

    mutateAndSave(() => {
        prototypeData.measurements.push({
            id: id("measurement"),
            parameter,
            expected: $("#prototypeMeasurementExpected").value.trim(),
            measured: $("#prototypeMeasurementMeasured").value.trim(),
            unit: $("#prototypeMeasurementUnit").value.trim(),
            result: String($("#prototypeMeasurementResult").value || "CHECK").toUpperCase()
        });
    }, "Measurement added.");

    closeModal($("#prototypeMeasurementModal"));
});

$("#addIteration")?.addEventListener("click", () => {
    resetFields({
        "#prototypeIterationVersion": "",
        "#prototypeIterationDate": todayISO(),
        "#prototypeIterationTitle": "",
        "#prototypeIterationDescription": "",
        "#prototypeIterationChanges": ""
    });
    openModal($("#prototypeIterationModal"));
});

$("#savePrototypeIteration")?.addEventListener("click", () => {
    const version = $("#prototypeIterationVersion").value.trim();
    const title = $("#prototypeIterationTitle").value.trim();

    if (!version || !title) {
        showToast("Version and title are required.");
        return;
    }

    const iteration = {
        id: id("iteration"),
        version,
        title,
        date: $("#prototypeIterationDate").value || todayISO(),
        description: $("#prototypeIterationDescription").value.trim(),
        changes: $("#prototypeIterationChanges").value
            .split("\n")
            .map(value => value.trim())
            .filter(Boolean)
    };

    mutateAndSave(() => {
        prototypeData.iterations.unshift(iteration);
        syncCurrentIteration();
    }, "Iteration added.");

    closeModal($("#prototypeIterationModal"));
});

function setupSimpleList(button, modal, save, titleInput, descriptionInput, key, label) {
    $(button)?.addEventListener("click", () => {
        resetFields({
            [titleInput]: "",
            [descriptionInput]: ""
        });
        openModal($(modal));
    });

    $(save)?.addEventListener("click", () => {
        const title = $(titleInput).value.trim();

        if (!title) {
            showToast(`${label} title is required.`);
            return;
        }

        mutateAndSave(() => {
            prototypeData[key].push({
                id: id(key),
                title,
                description: $(descriptionInput).value.trim()
            });
        }, `${label} added.`);

        closeModal($(modal));
    });
}

setupSimpleList(
    "#addFailure",
    "#prototypeFailureModal",
    "#savePrototypeFailure",
    "#prototypeFailureTitle",
    "#prototypeFailureDescription",
    "failures",
    "Failure"
);

setupSimpleList(
    "#addModification",
    "#prototypeModificationModal",
    "#savePrototypeModification",
    "#prototypeModificationTitle",
    "#prototypeModificationDescription",
    "modifications",
    "Modification"
);

$("#addImprovement")?.addEventListener("click", () => {
    resetFields({
        "#prototypeImprovementPriority": "MEDIUM PRIORITY",
        "#prototypeImprovementTitle": "",
        "#prototypeImprovementDescription": ""
    });
    openModal($("#prototypeImprovementModal"));
});

$("#savePrototypeImprovement")?.addEventListener("click", () => {
    const title = $("#prototypeImprovementTitle").value.trim();

    if (!title) {
        showToast("Improvement title is required.");
        return;
    }

    mutateAndSave(() => {
        prototypeData.improvements.push({
            id: id("improvement"),
            priority: $("#prototypeImprovementPriority").value || "MEDIUM PRIORITY",
            title,
            description: $("#prototypeImprovementDescription").value.trim()
        });
    }, "Improvement added.");

    closeModal($("#prototypeImprovementModal"));
});

$("#savePrototypeOutcome")?.addEventListener("click", () => {
    mutateAndSave(() => {
        prototypeData.outcome = $("#prototypeOutcome").value.trim();
    }, "Prototype outcome saved.");
});

/* =========================================================
   LINKS
========================================================= */

$("#addPrototypeLink")?.addEventListener("click", () => {
    resetFields({
        "#prototypeLinkTitle": "",
        "#prototypeLinkURL": "",
        "#prototypeLinkDescription": ""
    });
    openModal($("#prototypeLinkModal"));
});

$("#savePrototypeLink")?.addEventListener("click", () => {
    const title = $("#prototypeLinkTitle").value.trim();
    const url = $("#prototypeLinkURL").value.trim();

    if (!title || !url) {
        showToast("Title and URL are required.");
        return;
    }

    try {
        new URL(url);
    } catch {
        showToast("Enter a valid URL.");
        return;
    }

    mutateAndSave(() => {
        prototypeData.resources.unshift({
            id: id("resource"),
            kind: "link",
            type: "LINK",
            title,
            url,
            description: $("#prototypeLinkDescription").value.trim(),
            status: "ready"
        });
    }, "Link added.");

    closeModal($("#prototypeLinkModal"));
});

/* =========================================================
   FILE PICKER / DRAG & DROP
========================================================= */

const fileInput = $("#prototypeFileInput");
const uploadZone = $("#prototypeUploadZone");

$("#uploadPrototypeFile")?.addEventListener("click", () => fileInput?.click());
uploadZone?.addEventListener("click", () => fileInput?.click());

fileInput?.addEventListener("change", event => {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    processFiles(files);
});

if (uploadZone) {
    ["dragenter","dragover"].forEach(eventName => {
        uploadZone.addEventListener(eventName, event => {
            event.preventDefault();
            event.stopPropagation();
            uploadZone.classList.add("dragging");
        });
    });

    ["dragleave","drop"].forEach(eventName => {
        uploadZone.addEventListener(eventName, event => {
            event.preventDefault();
            event.stopPropagation();
            uploadZone.classList.remove("dragging");
        });
    });

    uploadZone.addEventListener("drop", event => {
        processFiles([...(event.dataTransfer?.files || [])]);
    });

    uploadZone.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInput?.click();
        }
    });
}

/* =========================================================
   INITIAL LOAD
========================================================= */

function showLoadingState() {
    loading = true;
    $("#prototypeLoadingState")?.classList.remove("hidden");
    $("#prototypeWorkspace")?.classList.add("prototype-workspace-loading");
    $("#prototypeErrorState")?.classList.add("hidden");
}

function hideLoadingState() {
    loading = false;
    $("#prototypeLoadingState")?.classList.add("hidden");
    $("#prototypeWorkspace")?.classList.remove("prototype-workspace-loading");
}

function showErrorState(message) {
    const error = $("#prototypeErrorState");
    if (!error) return;

    error.textContent = message;
    error.classList.remove("hidden");
}

initializeDeleteSystem();
initializeWorkspaceNavigation();
initializeStatusNavigation();
showLoadingState();

(async function initialize() {
    try {
        await loadPrototypeData();
        hideLoadingState();

    } catch (error) {
        console.error("RiGiD Prototype initialization error:", error);

        /* Hide the loading message, but keep the workspace hidden so
           the static HTML sample content is never shown as real data. */
        $("#prototypeLoadingState")?.classList.add("hidden");
        $("#prototypeWorkspace")?.classList.add("prototype-workspace-loading");

        showErrorState(
            error.message ||
            "Unable to load Prototype data. Please try again."
        );
        showToast(error.message || "Unable to load Prototype.");
    }
})();

});
