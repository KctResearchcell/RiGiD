/* =========================================================
   RiGiD — PAPER WORKSPACE
   paper.js

   Direct Supabase backend version

   Backend flow:
   Supabase Auth
        ↓
   get-rigid-work-data
        ↓
   Paper page data
        ↓
   User changes
        ↓
   update-rigid-work-data
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const SUPABASE_FUNCTIONS_URL =
    "https://mmmsmncmskvuqyhaqcne.supabase.co/functions/v1";


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = selector => document.querySelector(selector);

const $$ = selector => Array.from(document.querySelectorAll(selector));

function getElement(id) {
    return document.getElementById(id);
}

function getInputValue(id) {
    const element = getElement(id);
    if (!element) return "";
    return String(element.value || "").trim();
}

function setInputValue(id, value) {
    const element = getElement(id);
    if (!element) return;
    element.value = value ?? "";
}

function setText(id, value) {
    const element = getElement(id);
    if (!element) return;
    element.textContent = value ?? "";
}


/* =========================================================
   STATE
========================================================= */

let paperData = null;
let currentWorkId = null;
let isSaving = false;
let toastTimer = null;

/* Dynamic Paper Section State */
let activeSectionId = null;
let editingPaperSectionId = null;
let deletingPaperSectionId = null;

/* Other Editing State */
let editingLearningIndex = null;
let editingFindingId = null;
let editingQuestionId = null;
let editingReferenceId = null;
let editingTimelineId = null;
let editingFutureWorkId = null;
let editingFeedbackId = null;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", initializePaper);

async function initializePaper() {
    currentWorkId = getPaperIdFromURL();

    if (!currentWorkId) {
        showToast("Paper ID is missing.");
        return;
    }

    try {
        await loadPaperData();
        normalizePaperData();
        initializePaperPage();
        showToast("Paper loaded.");
    }
    catch (error) {
        console.error("Paper initialization error:", error);
        showToast(error.message || "Unable to load Paper.");
    }
}


/* =========================================================
   GET PAPER / WORK ID
========================================================= */

function getPaperIdFromURL() {
    const params = new URLSearchParams(window.location.search);

    return (
        params.get("work_id") ||
        params.get("id") ||
        params.get("work") ||
        params.get("paper")
    );
}


/* =========================================================
   LOAD PAPER DATA
========================================================= */

async function loadPaperData() {
    if (!window.sb) {
        throw new Error("Supabase client is unavailable.");
    }

    const { data: { session }, error: sessionError } =
        await window.sb.auth.getSession();

    if (sessionError || !session) {
        throw new Error("You must be logged in.");
    }

    const response = await fetch(
        `${SUPABASE_FUNCTIONS_URL}/get-rigid-work-data`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ work_id: currentWorkId })
        }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load Paper data.");
    }

    paperData = convertRigidDataToPaperData(result.data, result.work);


}


/* =========================================================
   SAVE PAPER DATA
========================================================= */

async function savePaperData() {
    if (isSaving) {
    while (isSaving) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
}

    if (!currentWorkId) {
        throw new Error("Paper ID is missing.");
    }

    if (!paperData) {
        throw new Error("Paper data is not loaded.");
    }

    if (!window.sb) {
        throw new Error("Supabase client is unavailable.");
    }

    isSaving = true;

    try {
        const { data: { session }, error: sessionError } =
            await window.sb.auth.getSession();

        if (sessionError || !session) {
            throw new Error("You must be logged in to save this Paper.");
        }

        const rigidData = convertPaperDataToRigidData(paperData);

        const response = await fetch(
            `${SUPABASE_FUNCTIONS_URL}/update-rigid-work-data`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    work_id: currentWorkId,
                    data: rigidData
                })
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Unable to save Paper data.");
        }

        paperData.updatedAt = new Date().toISOString();
        paperData.updatedDate = formatRigidDate(paperData.updatedAt);

        setText("paperUpdated", paperData.updatedDate);

        return result;
    }
    finally {
        isSaving = false;
    }
}


/* =========================================================
   CONVERT RiGiD DATA → PAPER DATA
========================================================= */

function convertRigidDataToPaperData(data = {}, work = {}) {
    const workspace = data?.workspace || {};
    const paper = data?.paper || {};

    return {
        id: workspace.id || work?.id || currentWorkId,
        title: workspace.title || work?.title || "Untitled Paper",
        description: paper.description || "",
        // UI status is stored in paper.stage.
        // workspace.status is the database-level status:
        // ongoing / completed.
        status: paper.stage || workspace.status || "not-started",
        stage: paper.stage || workspace.status || "not-started",
        type: paper.type || "Research Paper",
        source: paper.source || "",
        target: paper.target || "",
        deadline: paper.deadline || "",
        createdAt: workspace.createdAt || null,
        updatedAt: workspace.updatedAt || null,
        createdDate: formatRigidDate(workspace.createdAt),
        updatedDate: formatRigidDate(workspace.updatedAt),
        authors: Array.isArray(paper.authors) ? paper.authors : [],
        tags: Array.isArray(paper.tags) ? paper.tags : [],
        learning: Array.isArray(paper.learning) ? paper.learning : [],
        findings: Array.isArray(paper.findings) ? paper.findings : [],
        methodology: paper.methodology || "",
        questions: Array.isArray(paper.questions) ? paper.questions : [],
        sections: Array.isArray(paper.sections) ? paper.sections : [],
        references: Array.isArray(paper.references) ? paper.references : [],
        versions: Array.isArray(paper.versions) ? paper.versions : [],
        timeline: Array.isArray(data?.tasks) ? data.tasks : [],
        futureWork: Array.isArray(data?.futureWork) ? data.futureWork : [],
        attachments: Array.isArray(data?.attachments) ? data.attachments : [],
        feedback: Array.isArray(paper.feedback) ? paper.feedback : [],
        nextAction: paper.nextAction || ""
    };
}


/* =========================================================
   CONVERT PAPER DATA → RiGiD DATA
========================================================= */

function convertPaperDataToRigidData(paper) {
    const now = new Date().toISOString();

    return {
        version: 1,

        workspace: {
            id: paper.id || currentWorkId,
            type: "paper",
            title: paper.title || "Untitled Paper",

            // Database only accepts:
            // ongoing / completed
            status:
                ["review", "published"].includes(
                    String(paper.status || "").toLowerCase()
                )
                    ? "completed"
                    : "ongoing",

            createdAt: paper.createdAt || now,
            updatedAt: now
        },

        paper: {
            description: paper.description || "",
            // Preserve the actual Paper UI status.
            stage: paper.status || paper.stage || "not-started",
            type: paper.type || "Research Paper",
            source: paper.source || "",
            target: paper.target || "",
            deadline: paper.deadline || "",
            authors: Array.isArray(paper.authors) ? paper.authors : [],
            tags: Array.isArray(paper.tags) ? paper.tags : [],
            learning: Array.isArray(paper.learning) ? paper.learning : [],
            findings: Array.isArray(paper.findings) ? paper.findings : [],
            methodology: paper.methodology || "",
            questions: Array.isArray(paper.questions) ? paper.questions : [],
            sections: Array.isArray(paper.sections) ? paper.sections : [],
            references: Array.isArray(paper.references) ? paper.references : [],
            versions: Array.isArray(paper.versions) ? paper.versions : [],
            feedback: Array.isArray(paper.feedback) ? paper.feedback : [],
            nextAction: paper.nextAction || ""
        },

        tasks: Array.isArray(paper.timeline) ? paper.timeline : [],
        futureWork: Array.isArray(paper.futureWork) ? paper.futureWork : [],
        attachments: Array.isArray(paper.attachments) ? paper.attachments : []
    };
}


/* =========================================================
   NORMALIZE PAPER DATA
========================================================= */

function normalizePaperData() {
    if (!paperData) return;

    const arrayFields = [
        "authors", "tags", "learning", "findings", "questions",
        "sections", "references", "versions", "timeline",
        "futureWork", "attachments", "feedback"
    ];

    arrayFields.forEach(field => {
        if (!Array.isArray(paperData[field])) {
            paperData[field] = [];
        }
    });

    paperData.title = paperData.title || "Untitled Paper";
    paperData.description = paperData.description || "";
    paperData.status = paperData.status || "not-started";
    paperData.stage = paperData.stage || paperData.status;
    paperData.type = paperData.type || "Research Paper";
    paperData.methodology = paperData.methodology || "";
    paperData.nextAction = paperData.nextAction || "";

    paperData.createdDate = formatRigidDate(paperData.createdAt);
    paperData.updatedDate = formatRigidDate(paperData.updatedAt);

    paperData.sections = paperData.sections.map(section => ({
        id: section.id || generateID("section"),
        title: section.title || "Untitled Section",
        description: section.description || "",
        status: normalizeSectionStatus(section.status),
        content: section.content || ""
    }));

    paperData.findings = paperData.findings.map(finding => {
        if (typeof finding === "string") {
            return { id: generateID("finding"), text: finding };
        }
        return {
            id: finding.id || generateID("finding"),
            text: finding.text || finding.content || ""
        };
    });

    paperData.questions = paperData.questions.map(question => {
        if (typeof question === "string") {
            return { id: generateID("question"), text: question, status: "open" };
        }
        return {
            id: question.id || generateID("question"),
            text: question.text || question.content || "",
            status: question.status || "open"
        };
    });

    paperData.learning = paperData.learning.map(item => {
        if (typeof item === "string") {
            return {
                id: generateID("learning"),
                text: item,
                createdAt: new Date().toISOString()
            };
        }
        return {
            id: item.id || generateID("learning"),
            text: item.text || item.content || "",
            createdAt: item.createdAt || new Date().toISOString()
        };
    });

    paperData.references = paperData.references.map(reference => ({
        id: reference.id || generateID("reference"),
        title: reference.title || "Untitled Reference",
        authors: reference.authors || "",
        year: reference.year || "",
        doi: reference.doi || reference.url || "",
        notes: reference.notes || ""
    }));

    paperData.timeline = paperData.timeline.map(item => ({
        id: item.id || generateID("timeline"),
        title: item.title || "Untitled Task",
        description: item.description || "",
        date: item.date || getTodayISO(),
        status: item.status || "planned",
        duration: item.duration || "",
        priority: item.priority || "normal"
    }));

    paperData.futureWork = paperData.futureWork.map(item => ({
        id: item.id || generateID("future"),
        title: item.title || "Untitled Future Work",
        description: item.description || ""
    }));

    paperData.feedback = paperData.feedback.map(item => ({
        id: item.id || generateID("feedback"),
        author: item.author || "Anonymous",
        date: item.date || "",
        type: item.type || "mentor",
        text: item.text || "",
        createdAt: item.createdAt || new Date().toISOString()
    }));

    if (!paperData.sections.some(section => section.id === activeSectionId)) {
        activeSectionId = paperData.sections[0]?.id || null;
    }
}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

function initializePaperPage() {
    // SETUP BUTTONS FIRST
    setupTopNavigation();
    setupModalControls();
    setupPaperInformation();
    setupLearning();
    setupFindings();
    setupMethodology();
    setupQuestions();
    setupWritingWorkspace();
    setupReferences();
    setupVersions();
    setupTimeline();
    setupFutureWork();
    setupUploads();
    setupLinks();
    setupFeedback();
    setupPaperControls();

    // THEN RENDER DATA
    loadPaperInformation();
    renderAuthors();
    renderTags();
    renderLearning();
    renderFindings();
    renderMethodology();
    renderQuestions();
    renderPaperSections();
    renderReferences();
    renderVersions();
    renderTimeline();
    renderFutureWork();
    renderAttachments();
    renderFeedback();
    loadNextAction();
    updatePaperSummary();
    startLiveClock();
}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {
    loadPaperInformation();
    renderAuthors();
    renderTags();
    renderLearning();
    renderFindings();
    renderMethodology();
    renderQuestions();
    renderPaperSections();
    renderReferences();
    renderVersions();
    renderTimeline();
    renderFutureWork();
    renderAttachments();
    renderFeedback();
    loadNextAction();
    updatePaperSummary();
}


/* =========================================================
   PAPER INFORMATION
========================================================= */

function loadPaperInformation() {
    setText("paperTitle", paperData.title);
    setText("paperDescription", paperData.description);
    setText("paperStatus", formatStatus(paperData.status));
    setText("paperType", (paperData.type || "Research Paper").toUpperCase());
    setText("paperSource", paperData.source || "—");
    setText("paperTarget", paperData.target || "—");
    setText(
        "paperDeadline",
        paperData.deadline ? formatRigidDate(paperData.deadline) : "—"
    );
    setText("paperUpdated", paperData.updatedDate || "—");
}


function setupPaperInformation() {
    $("#editPaper")?.addEventListener("click", openPaperInformationModal);
    $("#savePaperInfo")?.addEventListener("click", savePaperInformation);
}


function openPaperInformationModal() {
    const modal = $("#paperInformationModal");

    if (!modal) {
        showToast("Paper information modal is unavailable.");
        return;
    }

    setInputValue("paperInfoTitle", paperData.title);
    setInputValue("paperInfoDescription", paperData.description);
    setInputValue("paperInfoType", paperData.type);
    setInputValue("paperInfoStatus", paperData.status);
    setInputValue("paperInfoSource", paperData.source);
    setInputValue("paperInfoTarget", paperData.target);
    setInputValue("paperInfoDeadline", paperData.deadline);

    openModal("#paperInformationModal");
}


async function savePaperInformation() {
    const title = getInputValue("paperInfoTitle");

    if (!title) {
        showToast("Enter a paper title.");
        return;
    }

    const previous = clone({
        title: paperData.title,
        description: paperData.description,
        status: paperData.status,
        stage: paperData.stage,
        type: paperData.type,
        source: paperData.source,
        target: paperData.target,
        deadline: paperData.deadline
    });

    paperData.title = title;
    paperData.description = getInputValue("paperInfoDescription");
    const newStatus =
        getInputValue("paperInfoStatus") || paperData.status;

    const previousStatus = paperData.status;

    paperData.status = newStatus;
    paperData.stage = newStatus;
    paperData.type = getInputValue("paperInfoType") || paperData.type;
    paperData.source = getInputValue("paperInfoSource");
    paperData.target = getInputValue("paperInfoTarget");
    paperData.deadline = getInputValue("paperInfoDeadline");

    touchPaperData();
    loadPaperInformation();

    try {
        closeModal("#paperInformationModal");
        showToast("Saving paper information...");

        await savePaperData();

        showToast("Paper information saved.");
        const normalizedNewStatus =
            String(newStatus || "").trim().toLowerCase();

        const normalizedPreviousStatus =
            String(previousStatus || "").trim().toLowerCase();
        if (
            ["review", "published"].includes(newStatus) &&
            !["review", "published"].includes(previousStatus)
        ) {
            triggerCompletionConfetti(normalizedNewStatus);
        }

    }
    catch (error) {
        Object.assign(paperData, previous);
        loadPaperInformation();
        showToast(error.message || "Unable to save paper information.");
    }
}


/* =========================================================
   AUTHORS (display only — no author-editing UI in this page)
========================================================= */

function renderAuthors() {
    const names = paperData.authors
        .map(author => (typeof author === "string" ? author : author?.name))
        .filter(Boolean);

    setText("paperAuthors", names.length ? names.join(", ") : "You");
}


/* =========================================================
   TAGS (display + remove — no "add tag" control in this page)
========================================================= */

function renderTags() {
    const container = $("#paperTags");

    if (!container) return;

    container.innerHTML = "";

    if (!paperData.tags.length) {
        container.innerHTML = `<div class="empty-state">No tags added.</div>`;
        return;
    }

    paperData.tags.forEach((tag, index) => {
        const item = document.createElement("span");
        item.className = "paper-tag";
        item.innerHTML = `
            ${escapeHTML(tag)}
            <button type="button" data-delete-tag="${index}" title="Remove tag">×</button>
        `;
        container.appendChild(item);
    });

    $$("[data-delete-tag]").forEach(button => {
        button.addEventListener("click", () => {
            deleteTag(Number(button.dataset.deleteTag));
        });
    });
}


async function deleteTag(index) {
    const previous = clone(paperData.tags);

    paperData.tags.splice(index, 1);

    touchPaperData();
    renderTags();

    try {
    showToast("Saving tag removal...");

    await savePaperData();

    showToast("Tag removed and saved.");
}
    catch (error) {
        paperData.tags = previous;
        renderTags();
        showToast(error.message || "Unable to remove tag.");
    }
}


/* =========================================================
   LEARNING
========================================================= */

function renderLearning() {
    const container = $("#learningContent");

    if (!container) return;

    container.innerHTML = "";

    if (!paperData.learning.length) {
        container.innerHTML = `<div class="empty-state">No learnings added yet.</div>`;
        return;
    }

    paperData.learning.forEach((learning, index) => {
        const item = document.createElement("article");
        item.className = "learning-item";
        item.innerHTML = `
            <p>${escapeHTML(learning.text)}</p>
            <div class="learning-actions">
                <button type="button" data-edit-learning="${index}">Edit</button>
                <button type="button" data-delete-learning="${index}">×</button>
            </div>
        `;
        container.appendChild(item);
    });

    $$("[data-edit-learning]").forEach(button => {
        button.addEventListener("click", () => {
            openLearningModal(Number(button.dataset.editLearning));
        });
    });

    $$("[data-delete-learning]").forEach(button => {
        button.addEventListener("click", () => {
            deleteLearning(Number(button.dataset.deleteLearning));
        });
    });
}


function setupLearning() {
    $("#addLearning")?.addEventListener("click", () => openLearningModal(null));
    $("#saveLearning")?.addEventListener("click", saveLearning);
}


function openLearningModal(index = null) {
    editingLearningIndex = index;

    const item = Number.isInteger(index) ? paperData.learning[index] : null;

    setText("learningModalTitle", item ? "Edit Learning" : "Add Learning");
    setInputValue("learningInput", item?.text || "");

    openModal("#learningModal");
}


async function saveLearning() {
    const text = getInputValue("learningInput");

    if (!text) {
        showToast("Enter what you learned.");
        return;
    }

    const previous = clone(paperData.learning);

    if (Number.isInteger(editingLearningIndex) && paperData.learning[editingLearningIndex]) {
        paperData.learning[editingLearningIndex].text = text;
    }
    else {
        paperData.learning.unshift({
            id: generateID("learning"),
            text,
            createdAt: new Date().toISOString()
        });
    }

    touchPaperData();
    renderLearning();

    try {
    closeModal("#learningModal");
    showToast("Saving learning...");

    await savePaperData();

    editingLearningIndex = null;
    showToast("Learning added and saved.");
}
    catch (error) {
        paperData.learning = previous;
        renderLearning();
        showToast(error.message || "Unable to save learning.");
    }
}


async function deleteLearning(index) {
    const previous = clone(paperData.learning);

    paperData.learning.splice(index, 1);

    touchPaperData();
    renderLearning();

    try {
    showToast("Saving learning removal...");

    await savePaperData();

    showToast("Learning removed and saved.");
}
    catch (error) {
        paperData.learning = previous;
        renderLearning();
        showToast(error.message || "Unable to remove learning.");
    }
}


/* =========================================================
   FINDINGS
========================================================= */

function renderFindings() {
    const container = $("#findingsList");

    if (!container) return;

    container.innerHTML = "";

    if (!paperData.findings.length) {
        container.innerHTML = `<div class="empty-state">No findings added yet.</div>`;
        return;
    }

    paperData.findings.forEach(finding => {
        const item = document.createElement("article");
        item.className = "finding-item";
        item.innerHTML = `
            <p>${escapeHTML(finding.text)}</p>
            <div class="finding-actions">
                <button type="button" data-edit-finding="${escapeAttribute(finding.id)}">Edit</button>
                <button type="button" data-delete-finding="${escapeAttribute(finding.id)}">×</button>
            </div>
        `;
        container.appendChild(item);
    });

    $$("[data-edit-finding]").forEach(button => {
        button.addEventListener("click", () => {
            openFindingModal(button.dataset.editFinding);
        });
    });

    $$("[data-delete-finding]").forEach(button => {
        button.addEventListener("click", () => {
            deleteFinding(button.dataset.deleteFinding);
        });
    });
}


function setupFindings() {
    $("#addFinding")?.addEventListener("click", () => openFindingModal(null));
    $("#saveFinding")?.addEventListener("click", saveFinding);
}


function openFindingModal(id = null) {
    editingFindingId = id;

    const finding = id
        ? paperData.findings.find(item => item.id === id)
        : null;

    setText("findingModalTitle", finding ? "Edit Finding" : "Add Finding");
    setInputValue("findingInput", finding?.text || "");

    openModal("#findingModal");
}


async function saveFinding() {
    const text = getInputValue("findingInput");

    if (!text) {
        showToast("Enter a finding.");
        return;
    }

    const previous = clone(paperData.findings);

    if (editingFindingId) {
        const finding = paperData.findings.find(item => item.id === editingFindingId);
        if (finding) finding.text = text;
    }
    else {
        paperData.findings.unshift({ id: generateID("finding"), text });
    }

    touchPaperData();
    renderFindings();

    try {
    closeModal("#findingModal");
    showToast("Saving finding...");

    await savePaperData();

    editingFindingId = null;
    showToast("Finding added and saved.");
}
    catch (error) {
        paperData.findings = previous;
        renderFindings();
        showToast(error.message || "Unable to save finding.");
    }
}


async function deleteFinding(id) {
    const previous = clone(paperData.findings);

    paperData.findings = paperData.findings.filter(item => item.id !== id);

    touchPaperData();
    renderFindings();

    try {
    showToast("Saving finding removal...");

    await savePaperData();

    showToast("Finding removed and saved.");
}
    catch (error) {
        paperData.findings = previous;
        renderFindings();
        showToast(error.message || "Unable to remove finding.");
    }
}


/* =========================================================
   METHODOLOGY
========================================================= */

function renderMethodology() {
    const container = $("#methodologyContent");

    if (!container) return;

    container.innerHTML = "";

    if (!paperData.methodology) {
        container.innerHTML = `<div class="empty-state">No methodology notes added yet.</div>`;
        return;
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = paperData.methodology;
    container.appendChild(paragraph);
}


function setupMethodology() {
    $("#editMethodology")?.addEventListener("click", () => {
        setInputValue("methodologyInput", paperData.methodology);
        openModal("#methodologyModal");
    });

    $("#saveMethodology")?.addEventListener("click", saveMethodology);
}


async function saveMethodology() {
    const previous = paperData.methodology;

    paperData.methodology = getInputValue("methodologyInput");

    touchPaperData();
    renderMethodology();

    try {
    closeModal("#methodologyModal");
    showToast("Saving methodology...");

    await savePaperData();

    showToast("Methodology saved.");
}
    catch (error) {
        paperData.methodology = previous;
        renderMethodology();
        showToast(error.message || "Unable to save methodology.");
    }
}


/* =========================================================
   QUESTIONS & GAPS
========================================================= */

function renderQuestions() {
    const container = $("#questionList");

    if (!container) return;

    container.innerHTML = "";

    if (!paperData.questions.length) {
        container.innerHTML = `<div class="empty-state">No questions or gaps added.</div>`;
        return;
    }

    paperData.questions.forEach(question => {
        const item = document.createElement("article");
        item.className = `question-item ${escapeHTML(question.status)}`;
        item.innerHTML = `
            <div>
                <p>${escapeHTML(question.text)}</p>
                <span>${escapeHTML(formatStatus(question.status))}</span>
            </div>
            <div class="question-actions">
                <button type="button" data-toggle-question="${escapeAttribute(question.id)}">
                    ${question.status === "resolved" ? "Reopen" : "Resolve"}
                </button>
                <button type="button" data-edit-question="${escapeAttribute(question.id)}">Edit</button>
                <button type="button" data-delete-question="${escapeAttribute(question.id)}">×</button>
            </div>
        `;
        container.appendChild(item);
    });

    $$("[data-toggle-question]").forEach(button => {
        button.addEventListener("click", () => {
            toggleQuestionStatus(button.dataset.toggleQuestion);
        });
    });

    $$("[data-edit-question]").forEach(button => {
        button.addEventListener("click", () => {
            openQuestionModal(button.dataset.editQuestion);
        });
    });

    $$("[data-delete-question]").forEach(button => {
        button.addEventListener("click", () => {
            deleteQuestion(button.dataset.deleteQuestion);
        });
    });
}


function setupQuestions() {
    $("#addQuestion")?.addEventListener("click", () => openQuestionModal(null));
    $("#saveQuestion")?.addEventListener("click", saveQuestion);
}


function openQuestionModal(id = null) {
    editingQuestionId = id;

    const question = id
        ? paperData.questions.find(item => item.id === id)
        : null;

    setText("questionModalTitle", question ? "Edit Question or Gap" : "Add Question or Gap");
    setInputValue("questionInput", question?.text || "");

    openModal("#questionModal");
}


async function saveQuestion() {
    const text = getInputValue("questionInput");

    if (!text) {
        showToast("Enter a question or research gap.");
        return;
    }

    const previous = clone(paperData.questions);

    if (editingQuestionId) {
        const question = paperData.questions.find(item => item.id === editingQuestionId);
        if (question) question.text = text;
    }
    else {
        paperData.questions.push({
            id: generateID("question"),
            text,
            status: "open"
        });
    }

    touchPaperData();
    renderQuestions();

    try {
    closeModal("#questionModal");
    showToast("Saving question...");

    await savePaperData();

    editingQuestionId = null;
    showToast("Question added and saved.");
}
    catch (error) {
        paperData.questions = previous;
        renderQuestions();
        showToast(error.message || "Unable to save question.");
    }
}


async function toggleQuestionStatus(id) {
    const previous = clone(paperData.questions);

    const question = paperData.questions.find(item => item.id === id);

    if (!question) return;

    question.status = question.status === "resolved" ? "open" : "resolved";

    touchPaperData();
    renderQuestions();

    try {
    showToast("Saving question status...");

    await savePaperData();

    showToast(
        question.status === "resolved"
            ? "Question resolved and saved."
            : "Question reopened and saved."
    );
}
    catch (error) {
        paperData.questions = previous;
        renderQuestions();
        showToast(error.message || "Unable to update question.");
    }
}


async function deleteQuestion(id) {
    const previous = clone(paperData.questions);

    paperData.questions = paperData.questions.filter(item => item.id !== id);

    touchPaperData();
    renderQuestions();

    try {
    showToast("Saving question removal...");

    await savePaperData();

    showToast("Question removed and saved.");
}
    catch (error) {
        paperData.questions = previous;
        renderQuestions();
        showToast(error.message || "Unable to remove question.");
    }
}


/* =========================================================
   SHARED DATA HELPERS
========================================================= */

function touchPaperData() {
    paperData.updatedAt = new Date().toISOString();
    paperData.updatedDate = formatRigidDate(paperData.updatedAt);
    setText("paperUpdated", paperData.updatedDate);
}

function clone(value) {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
}

function generateID(prefix = "item") {
    return (
        `${prefix}-` +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 8)
    );
}

function normalizeSectionStatus(status) {
    const allowed = ["not-started", "in-progress", "completed"];
    return allowed.includes(status) ? status : "not-started";
}

function formatStatus(status) {
    return String(status || "")
        .replaceAll("-", " ")
        .replace(/\b\w/g, character => character.toUpperCase());
}

function formatRigidDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getTodayISO() {
    return new Date().toISOString().slice(0, 10);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHTML(value);
}


/* =========================================================
   WRITING WORKSPACE / USER-CREATED PAPER SECTIONS
========================================================= */

function setupWritingWorkspace() {
    // Open the "add section" modal from any of its three entry points
    $("#addPaperSection")?.addEventListener("click", () => openPaperSectionModal(null));
    $("#addPaperSectionSide")?.addEventListener("click", () => openPaperSectionModal(null));
    $("#addFirstPaperSection")?.addEventListener("click", () => openPaperSectionModal(null));

    $("#savePaperSection")?.addEventListener("click", savePaperSection);

    // Manual "save draft" for whatever is currently in the editor
    $("#saveDraft")?.addEventListener("click", saveActiveSectionContent);

    // Toolbar controls that act on the currently selected section
    $("#renameActiveSection")?.addEventListener("click", renameActiveSection);
    $("#moveActiveSectionUp")?.addEventListener("click", () => {
        if (activeSectionId) movePaperSection(activeSectionId, -1);
    });
    $("#moveActiveSectionDown")?.addEventListener("click", () => {
        if (activeSectionId) movePaperSection(activeSectionId, 1);
    });
    $("#deleteActiveSection")?.addEventListener("click", () => {
        if (activeSectionId) openDeleteSectionModal(activeSectionId);
    });

    // Delete-section confirmation modal
    $("#confirmDeletePaperSection")?.addEventListener("click", confirmDeletePaperSection);

    // New version / draft upload
    $("#newVersion")?.addEventListener("click", createNewVersion);
    $("#newVersionFromWorkspace")?.addEventListener("click", createNewVersion);
    $("#saveVersion")?.addEventListener("click", saveVersionFromModal);

    const draftInput = $("#draftFileInput");
    $("#uploadDraft")?.addEventListener("click", () => draftInput?.click());
    draftInput?.addEventListener("change", async event => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        await uploadDraftFiles(files);
        draftInput.value = "";
    });
}


function renderPaperSections() {
    const list = $("#paperSectionList");
    const empty = $("#paperSectionEmpty");

    if (!list) return;

    list.innerHTML = "";

    if (!paperData.sections.length) {
        if (empty) {
            empty.hidden = false;
            empty.classList.remove("hidden");
        }

        activeSectionId = null;

        renderActiveSectionEditor();
        updatePaperSummary();
        return;
    }

    if (empty) {
        empty.hidden = true;
        empty.classList.add("hidden");
    }

    if (!paperData.sections.some(section => section.id === activeSectionId)) {
        activeSectionId = paperData.sections[0].id;
    }

    paperData.sections.forEach((section, index) => {
        const item = document.createElement("div");
        item.className = "paper-section-item";

        if (section.id === activeSectionId) {
            item.classList.add("active");
        }

        item.innerHTML = `
            <button type="button" class="paper-section-select" data-select-section="${escapeAttribute(section.id)}">
                <span class="section-order">${index + 1}</span>
                <span class="section-info">
                    <strong>${escapeHTML(section.title)}</strong>
                    <small>${escapeHTML(formatStatus(section.status))}</small>
                </span>
            </button>
            <div class="section-item-actions">
                <button type="button" title="Move up" data-move-section-up="${escapeAttribute(section.id)}" ${index === 0 ? "disabled" : ""}>↑</button>
                <button type="button" title="Move down" data-move-section-down="${escapeAttribute(section.id)}" ${index === paperData.sections.length - 1 ? "disabled" : ""}>↓</button>
                <button type="button" title="Edit section" data-edit-section="${escapeAttribute(section.id)}">Edit</button>
            </div>
        `;

        list.appendChild(item);
    });

    $$("[data-select-section]").forEach(button => {
        button.addEventListener("click", () => {
            selectPaperSection(button.dataset.selectSection);
        });
    });

    $$("[data-move-section-up]").forEach(button => {
        button.addEventListener("click", () => {
            movePaperSection(button.dataset.moveSectionUp, -1);
        });
    });

    $$("[data-move-section-down]").forEach(button => {
        button.addEventListener("click", () => {
            movePaperSection(button.dataset.moveSectionDown, 1);
        });
    });

    $$("[data-edit-section]").forEach(button => {
        button.addEventListener("click", () => {
            openPaperSectionModal(button.dataset.editSection);
        });
    });

    renderActiveSectionEditor();
    updatePaperSummary();
}


function selectPaperSection(id) {
    activeSectionId = id;
    renderPaperSections();
}


function renderActiveSectionEditor() {
    const section = paperData.sections.find(item => item.id === activeSectionId);

    const editor = $("#paperEditor");
    const statusSelect = $("#activeSectionStatus");
    const renameBtn = $("#renameActiveSection");
    const upBtn = $("#moveActiveSectionUp");
    const downBtn = $("#moveActiveSectionDown");
    const deleteBtn = $("#deleteActiveSection");
    const description = $("#activeSectionDescription");

    if (!section) {
        setText("activeSectionTitle", "Select a section");
        if (description) description.textContent = "Select a paper section to start writing.";

        if (editor) {
            editor.value = "";
            editor.disabled = true;
        }
        if (statusSelect) statusSelect.disabled = true;
        [renameBtn, upBtn, downBtn, deleteBtn].forEach(button => {
            if (button) button.disabled = true;
        });

        setText("wordCount", "0 words");
        setText("editorSaveState", "Select a section to start writing");

        return;
    }

    setText("activeSectionTitle", section.title);
    if (description) description.textContent = section.description || "";

    if (statusSelect) {
        statusSelect.disabled = false;
        statusSelect.value = section.status;

        // Strip any previously attached listener before re-binding
        const freshStatus = statusSelect.cloneNode(true);
        statusSelect.replaceWith(freshStatus);
        freshStatus.addEventListener("change", event => {
            updateActiveSectionStatus(event.target.value);
        });
    }

    const index = paperData.sections.findIndex(item => item.id === section.id);

    if (renameBtn) renameBtn.disabled = false;
    if (upBtn) upBtn.disabled = index <= 0;
    if (downBtn) downBtn.disabled = index >= paperData.sections.length - 1;
    if (deleteBtn) deleteBtn.disabled = false;

    if (editor) {
        editor.disabled = false;

        const freshEditor = editor.cloneNode(true);
        editor.replaceWith(freshEditor);

        freshEditor.value = section.content;

        freshEditor.addEventListener("input", () => {
            updateSectionWordCount();
            setText("editorSaveState", "Unsaved changes");
        });
    }

    updateSectionWordCount();
    setText("editorSaveState", "Saved");
}


function updateSectionWordCount() {
    const input = $("#paperEditor");

    if (!input) return;

    const text = String(input.value || "").trim();
    const count = text ? text.split(/\s+/).length : 0;

    setText("wordCount", `${count} words`);
}


function openPaperSectionModal(id = null) {
    editingPaperSectionId = id;

    const section = id
        ? paperData.sections.find(item => item.id === id)
        : null;

    setText("paperSectionModalTitle", section ? "Edit Paper Section" : "Add Paper Section");
    setInputValue("paperSectionName", section?.title || "");
    setInputValue("paperSectionPurpose", section?.description || "");
    setInputValue("paperSectionStatus", section?.status || "not-started");

    openModal("#paperSectionModal");
}


async function savePaperSection() {
    const title = getInputValue("paperSectionName");

    if (!title) {
        showToast("Enter a section title.");
        return;
    }

    const previous = clone(paperData.sections);

    const description = getInputValue("paperSectionPurpose");
    const status = normalizeSectionStatus(getInputValue("paperSectionStatus"));

    if (editingPaperSectionId) {
        const section = paperData.sections.find(item => item.id === editingPaperSectionId);
        if (section) {
            section.title = title;
            section.description = description;
            section.status = status;
        }
    }
    else {
        const newSection = {
            id: generateID("section"),
            title,
            description,
            status,
            content: ""
        };

        paperData.sections.push(newSection);
        activeSectionId = newSection.id;
    }

    touchPaperData();
    renderPaperSections();

    try {
    closeModal("#paperSectionModal");
    showToast("Saving paper section...");

    await savePaperData();

    editingPaperSectionId = null;
    showToast("Paper section added and saved.");
}
    catch (error) {
        paperData.sections = previous;
        renderPaperSections();
        showToast(error.message || "Unable to save paper section.");
    }
}


function renameActiveSection() {
    const section = paperData.sections.find(item => item.id === activeSectionId);

    if (!section) return;

    editingPaperSectionId = section.id;

    setText("paperSectionModalTitle", "Rename Paper Section");
    setInputValue("paperSectionName", section.title);
    setInputValue("paperSectionPurpose", section.description || "");
    setInputValue("paperSectionStatus", section.status || "not-started");

    openModal("#paperSectionModal");
}


function openDeleteSectionModal(id) {
    const section = paperData.sections.find(item => item.id === id);
    if (!section) return;

    deletingPaperSectionId = id;

    setText(
        "deletePaperSectionText",
        `Delete "${section.title}"? This section and its content will be permanently removed.`
    );

    openModal("#deletePaperSectionModal");
}


async function confirmDeletePaperSection() {
    if (!deletingPaperSectionId) {
        closeModal("#deletePaperSectionModal");
        return;
    }

    const id = deletingPaperSectionId;

    closeModal("#deletePaperSectionModal");

    await deletePaperSection(id);

    deletingPaperSectionId = null;
}


async function deletePaperSection(id) {
    const previous = clone(paperData.sections);

    const index = paperData.sections.findIndex(item => item.id === id);

    if (index < 0) return;

    paperData.sections.splice(index, 1);

    if (activeSectionId === id) {
        activeSectionId =
            paperData.sections[Math.max(0, index - 1)]?.id ||
            paperData.sections[0]?.id ||
            null;
    }

    touchPaperData();
    renderPaperSections();

    try {
    showToast("Saving paper section deletion...");

    await savePaperData();

    showToast("Paper section deleted and saved.");
}
    catch (error) {
        paperData.sections = previous;

        if (!paperData.sections.some(item => item.id === activeSectionId)) {
            activeSectionId = id;
        }

        renderPaperSections();
        showToast(error.message || "Unable to delete paper section.");
    }
}


async function movePaperSection(id, direction) {
    const previous = clone(paperData.sections);

    const index = paperData.sections.findIndex(item => item.id === id);

    if (index < 0) return;

    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= paperData.sections.length) return;

    [paperData.sections[index], paperData.sections[newIndex]] =
        [paperData.sections[newIndex], paperData.sections[index]];

    touchPaperData();
    renderPaperSections();

    try {
    showToast("Saving section order...");

    await savePaperData();

    showToast("Section order saved.");
}
    catch (error) {
        paperData.sections = previous;
        renderPaperSections();
        showToast(error.message || "Unable to reorder sections.");
    }
}


async function updateActiveSectionStatus(status) {
    const previous = clone(paperData.sections);

    const section = paperData.sections.find(item => item.id === activeSectionId);

    if (!section) return;

    section.status = normalizeSectionStatus(status);

    touchPaperData();
    renderPaperSections();

    try {
    showToast("Saving section status...");

    await savePaperData();

    showToast("Section status updated and saved.");
}

    catch (error) {
        paperData.sections = previous;
        renderPaperSections();
        showToast(error.message || "Unable to update section.");
    }
}


async function saveActiveSectionContent() {
    const section = paperData.sections.find(item => item.id === activeSectionId);

    if (!section) {
        showToast("Select or create a section first.");
        return;
    }

    const previous = section.content;

    section.content = getInputValue("paperEditor");

    if (section.content.trim() && section.status === "not-started") {
        section.status = "in-progress";
    }

    touchPaperData();
    renderPaperSections();

   try {
    showToast("Saving section content...");

    await savePaperData();

    setText("editorSaveState", "Saved");
    showToast("Section content saved.");
}
catch (error) {
        section.content = previous;
        renderPaperSections();
        showToast(error.message || "Unable to save section content.");
    }
}


/* =========================================================
   REFERENCES
========================================================= */

function setupReferences() {
    $("#addReference")?.addEventListener("click", () => openReferenceModal(null));
    $("#saveReference")?.addEventListener("click", saveReference);
}


function renderReferences() {
    const container = $("#referenceList");

    if (!container) return;

    container.innerHTML = "";

    if (!paperData.references.length) {
        container.innerHTML = `<div class="empty-state">No references added yet.</div>`;
        return;
    }

    paperData.references.forEach(reference => {
        const item = document.createElement("article");
        item.className = "reference-item";
        item.innerHTML = `
            <div class="reference-content">
                <h4>${escapeHTML(reference.title || "Untitled Reference")}</h4>
                <p>${escapeHTML(reference.authors || "")}</p>
                ${reference.year ? `<span>${escapeHTML(reference.year)}</span>` : ""}
                ${reference.doi ? `
                    <a href="${escapeAttribute(reference.doi)}" target="_blank" rel="noopener">Open source</a>
                ` : ""}
            </div>
            <div class="reference-actions">
                <button type="button" data-edit-reference="${escapeAttribute(reference.id)}">Edit</button>
                <button type="button" data-delete-reference="${escapeAttribute(reference.id)}">×</button>
            </div>
        `;
        container.appendChild(item);
    });

    $$("[data-edit-reference]").forEach(button => {
        button.addEventListener("click", () => {
            openReferenceModal(button.dataset.editReference);
        });
    });

    $$("[data-delete-reference]").forEach(button => {
        button.addEventListener("click", () => {
            deleteReference(button.dataset.deleteReference);
        });
    });
}


function openReferenceModal(id = null) {
    editingReferenceId = id;

    const reference = id
        ? paperData.references.find(item => item.id === id)
        : null;

    setInputValue("referenceTitle", reference?.title || "");
    setInputValue("referenceAuthors", reference?.authors || "");
    setInputValue("referenceYear", reference?.year || "");
    setInputValue("referenceDOI", reference?.doi || "");
    setInputValue("referenceNotes", reference?.notes || "");

    openModal("#referenceModal");
}


async function saveReference() {
    const title = getInputValue("referenceTitle");

    if (!title) {
        showToast("Enter a reference title.");
        return;
    }

    const previous = clone(paperData.references);

    const referenceData = {
        title,
        authors: getInputValue("referenceAuthors"),
        year: getInputValue("referenceYear"),
        doi: getInputValue("referenceDOI"),
        notes: getInputValue("referenceNotes")
    };

    if (editingReferenceId) {
        const reference = paperData.references.find(item => item.id === editingReferenceId);
        if (reference) Object.assign(reference, referenceData);
    }
    else {
        paperData.references.unshift({ id: generateID("reference"), ...referenceData });
    }

    touchPaperData();
    renderReferences();

    try {
        closeModal("#referenceModal");
        showToast("Saving reference...");

        await savePaperData();

        editingReferenceId = null;
        showToast("Reference added and saved.");
    }
    catch (error) {
        paperData.references = previous;
        renderReferences();
        showToast(error.message || "Unable to save reference.");
    }
}


async function deleteReference(id) {
    const previous = clone(paperData.references);

    paperData.references = paperData.references.filter(item => item.id !== id);

    touchPaperData();
    renderReferences();

    try {
        showToast("Saving reference removal...");

        await savePaperData();

        showToast("Reference removed and saved.");
    }
    catch (error) {
        paperData.references = previous;
        renderReferences();
        showToast(error.message || "Unable to remove reference.");
    }
}


/* =========================================================
   VERSIONS (no dedicated modal in this page —
   "New Version" prompts for a name; "Upload Draft"
   uploads a file straight into the versions list)
========================================================= */

function setupVersions() {
    // Wired in setupWritingWorkspace() since the buttons
    // ("newVersion", "newVersionFromWorkspace", "uploadDraft")
    // live in both the Writing and Versions sections.
}


function renderVersions() {
    const container = $("#versionGrid");

    if (!container) return;

    container.innerHTML = "";

    if (!paperData.versions.length) {
        container.innerHTML = `<div class="empty-state">No versions saved yet.</div>`;
        return;
    }

    paperData.versions.forEach(version => {
        const item = document.createElement("article");
        item.className = "version-item";

        const isFile = version.isFile;

        item.innerHTML = `
            <div>
                <strong>${escapeHTML(version.name)}</strong>
                <small>${escapeHTML(formatRigidDate(version.createdAt))}</small>
                ${isFile
                ? `<p>${escapeHTML(version.mimeType || "File")}${version.size ? ` · ${formatFileSize(version.size)}` : ""}</p>`
                : `<p>Snapshot of ${version.snapshot?.length || 0} section(s)</p>`
            }
                ${isFile && version.url ? `<a href="${escapeAttribute(version.url)}" target="_blank" rel="noopener">Open</a>` : ""}
                ${isFile && version.downloadUrl ? `<a href="${escapeAttribute(version.downloadUrl)}" target="_blank" rel="noopener">Download</a>` : ""}
            </div>
            <button type="button" data-delete-version="${escapeAttribute(version.id)}">×</button>
        `;

        container.appendChild(item);
    });

    $$("[data-delete-version]").forEach(button => {
        button.addEventListener("click", () => {
            deleteVersion(button.dataset.deleteVersion);
        });
    });
}

async function saveVersionFromModal() {
    const input = document.getElementById("versionNameInput");

    if (!input) return;

    const name = input.value.trim();

    if (!name) {
        showToast("Please enter a version name.");
        input.focus();
        return;
    }

    const version = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        source: "manual",
        snapshot: clone(paperData.sections)
    };

    paperData.versions = Array.isArray(paperData.versions)
        ? paperData.versions
        : [];

    paperData.versions.unshift(version);

    touchPaperData();
    renderVersions();

    try {
        closeModal("#versionModal");
        input.value = "";

        showToast("Saving version...");

        await savePaperData();

        showToast("Version added and saved.");
    }
    catch (error) {
        console.error("Unable to save version:", error);
        showToast(error.message || "Unable to save version.");
    }
}

function createNewVersion() {
    const modal = document.querySelector("#versionModal");

    if (!modal) {
        showToast("Version modal is unavailable.");
        return;
    }

    setText("versionModalTitle", "Create New Version");
    setInputValue("versionNameInput", "");

    openModal("#versionModal");
}


async function uploadDraftFiles(files) {
    for (const file of files) {
        await uploadSingleDraftFile(file);
    }
}


async function uploadSingleDraftFile(file) {
    if (!currentWorkId) {
        showToast("Paper ID is missing.");
        return;
    }

    if (!window.sb) {
        showToast("Supabase client is unavailable.");
        return;
    }

    const pendingId = generateID("version");

    const pendingRecord = {
        id: pendingId,
        name: file.name,
        isFile: true,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        createdAt: new Date().toISOString(),
        uploadStatus: "uploading",
        url: ""
    };

    paperData.versions.unshift(pendingRecord);
renderVersions();

showToast(`Uploading "${file.name}"...`);

    try {
        const { data: { session }, error: sessionError } =
            await window.sb.auth.getSession();

        if (sessionError || !session) {
            throw new Error("You must be logged in to upload files.");
        }

        const formData = new FormData();
        formData.append("work_id", currentWorkId);
        formData.append("file", file, file.name);

        const response = await fetch(
            `${SUPABASE_FUNCTIONS_URL}/upload-rigid-file`,
            {
                method: "POST",
                headers: { "Authorization": `Bearer ${session.access_token}` },
                body: formData
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Unable to upload draft file.");
        }

        const uploaded = result.file || {};

        const index = paperData.versions.findIndex(item => item.id === pendingId);

        const finalRecord = {
            id: pendingId,
            driveFileId: uploaded.id || "",
            name: uploaded.name || file.name,
            isFile: true,
            mimeType: uploaded.mimeType || file.type || "application/octet-stream",
            size: Number(uploaded.size || file.size || 0),
            url: uploaded.webViewLink || "",
            downloadUrl: uploaded.webContentLink || "",
            createdAt: uploaded.createdAt || pendingRecord.createdAt,
            uploadStatus: "uploaded"
        };

        if (index === -1) {
            paperData.versions.unshift(finalRecord);
        }
        else {
            paperData.versions[index] = finalRecord;
        }

        touchPaperData();
renderVersions();

showToast(`Saving "${finalRecord.name}"...`);

await savePaperData();

showToast(`"${finalRecord.name}" uploaded and saved.`);
    }
    catch (error) {
        paperData.versions = paperData.versions.filter(item => item.id !== pendingId);
        renderVersions();
        showToast(error.message || `Unable to upload "${file.name}".`);
    }
}


async function deleteVersion(id) {
    const previous = clone(paperData.versions);

    paperData.versions = paperData.versions.filter(item => item.id !== id);

    touchPaperData();
    renderVersions();

    try {
    showToast("Saving version removal...");

    await savePaperData();

    showToast("Version removed and saved.");
}
    catch (error) {
        paperData.versions = previous;
        renderVersions();
        showToast(error.message || "Unable to remove version.");
    }
}


/* =========================================================
   TIMELINE
========================================================= */

function setupTimeline() {
    $("#addPaperTimeline")?.addEventListener("click", () => openTimelineModal(null));
    $("#savePaperTimeline")?.addEventListener("click", saveTimelineItem);
}


function renderTimeline() {
    const container = $("#paperTimelineList");

    if (!container) return;

    container.innerHTML = "";

    if (!paperData.timeline.length) {
        container.innerHTML = `<div class="empty-state">No timeline items added.</div>`;
        return;
    }

    paperData.timeline.forEach(item => {
        const element = document.createElement("article");
        element.className = `timeline-item ${escapeHTML(item.status || "planned")}`;
        element.innerHTML = `
            <div class="timeline-date">${escapeHTML(formatRigidDate(item.date))}</div>
            <div class="timeline-content">
                <strong>${escapeHTML(item.title || "Untitled Task")}</strong>
                ${item.description ? `<p>${escapeHTML(item.description)}</p>` : ""}
                <small>
                    ${escapeHTML(formatStatus(item.status || "planned"))}
                    ${item.priority && item.priority !== "normal" ? ` · ${escapeHTML(formatStatus(item.priority))} priority` : ""}
                    ${item.duration ? ` · ${escapeHTML(item.duration)}` : ""}
                </small>
            </div>
            <div class="timeline-actions">
                <button type="button" data-edit-timeline="${escapeAttribute(item.id)}">Edit</button>
                <button type="button" data-delete-timeline="${escapeAttribute(item.id)}">×</button>
            </div>
        `;
        container.appendChild(element);
    });

    $$("[data-edit-timeline]").forEach(button => {
        button.addEventListener("click", () => {
            openTimelineModal(button.dataset.editTimeline);
        });
    });

    $$("[data-delete-timeline]").forEach(button => {
        button.addEventListener("click", () => {
            deleteTimelineItem(button.dataset.deleteTimeline);
        });
    });
}


function openTimelineModal(id = null) {
    editingTimelineId = id;

    const item = id
        ? paperData.timeline.find(entry => entry.id === id)
        : null;

    setText("paperTimelineModalTitle", item ? "Edit Timeline Entry" : "Add Timeline Entry");
    setInputValue("paperTimelineTitle", item?.title || "");
    setInputValue("paperTimelineDescription", item?.description || "");
    setInputValue("paperTimelineDate", item?.date || getTodayISO());
    setInputValue("paperTimelineStatus", item?.status || "planned");
    setInputValue("paperTimelineDuration", item?.duration || "");
    setInputValue("paperTimelinePriority", item?.priority || "normal");

    openModal("#paperTimelineModal");
}


async function saveTimelineItem() {
    const title = getInputValue("paperTimelineTitle");

    if (!title) {
        showToast("Enter a timeline title.");
        return;
    }

    const previous = clone(paperData.timeline);

    const timelineData = {
        title,
        description: getInputValue("paperTimelineDescription"),
        date: getInputValue("paperTimelineDate") || getTodayISO(),
        status: getInputValue("paperTimelineStatus") || "planned",
        duration: getInputValue("paperTimelineDuration"),
        priority: getInputValue("paperTimelinePriority") || "normal"
    };

    if (editingTimelineId) {
        const item = paperData.timeline.find(entry => entry.id === editingTimelineId);
        if (item) Object.assign(item, timelineData);
    }
    else {
        paperData.timeline.push({ id: generateID("timeline"), ...timelineData });
    }

    paperData.timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    touchPaperData();
    renderTimeline();

    try {
    closeModal("#paperTimelineModal");
    showToast("Saving timeline...");

    await savePaperData();

    editingTimelineId = null;
    showToast("Timeline added and saved.");
}
    catch (error) {
        paperData.timeline = previous;
        renderTimeline();
        showToast(error.message || "Unable to save timeline.");
    }
}


async function deleteTimelineItem(id) {
    const previous = clone(paperData.timeline);

    paperData.timeline = paperData.timeline.filter(item => item.id !== id);

    touchPaperData();
    renderTimeline();

    try {
    showToast("Saving timeline removal...");

    await savePaperData();

    showToast("Timeline item removed and saved.");
}
    catch (error) {
        paperData.timeline = previous;
        renderTimeline();
        showToast(error.message || "Unable to remove timeline item.");
    }
}


/* =========================================================
   FUTURE WORK (no dedicated modal in this page — uses
   simple prompts for title / description)
========================================================= */

function setupFutureWork() {
    $("#addFutureWork")?.addEventListener("click", () => openFutureWorkPrompt(null));
}


function renderFutureWork() {
    const container = $("#futureWorkList");

    if (!container) return;

    container.innerHTML = "";

    if (!paperData.futureWork.length) {
        container.innerHTML = `<div class="empty-state">No future work added.</div>`;
        return;
    }

    paperData.futureWork.forEach(item => {
        const element = document.createElement("article");
        element.className = "future-work-item";
        element.innerHTML = `
            <div>
                <strong>${escapeHTML(item.title || "Untitled Future Work")}</strong>
                ${item.description ? `<p>${escapeHTML(item.description)}</p>` : ""}
            </div>
            <div>
                <button type="button" data-edit-future-work="${escapeAttribute(item.id)}">Edit</button>
                <button type="button" data-delete-future-work="${escapeAttribute(item.id)}">×</button>
            </div>
        `;
        container.appendChild(element);
    });

    $$("[data-edit-future-work]").forEach(button => {
        button.addEventListener("click", () => {
            openFutureWorkPrompt(button.dataset.editFutureWork);
        });
    });

    $$("[data-delete-future-work]").forEach(button => {
        button.addEventListener("click", () => {
            deleteFutureWork(button.dataset.deleteFutureWork);
        });
    });
}


async function openFutureWorkPrompt(id = null) {
    editingFutureWorkId = id;

    const existing = id
        ? paperData.futureWork.find(entry => entry.id === id)
        : null;

    const title = window.prompt("Future work title:", existing?.title || "");

    if (title === null) return;

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
        showToast("Enter future work.");
        return;
    }

    const description = window.prompt(
        "Description (optional):",
        existing?.description || ""
    );

    if (description === null) return;

    await saveFutureWork({
        title: trimmedTitle,
        description: description.trim()
    });
}


async function saveFutureWork(futureWorkData) {
    const previous = clone(paperData.futureWork);

    if (editingFutureWorkId) {
        const item = paperData.futureWork.find(entry => entry.id === editingFutureWorkId);
        if (item) Object.assign(item, futureWorkData);
    }
    else {
        paperData.futureWork.push({ id: generateID("future"), ...futureWorkData });
    }

    touchPaperData();
    renderFutureWork();

    try {
    showToast("Saving future work...");

    await savePaperData();

    editingFutureWorkId = null;
    showToast("Future work added and saved.");
}
    catch (error) {
        paperData.futureWork = previous;
        renderFutureWork();
        showToast(error.message || "Unable to save future work.");
    }
}


async function deleteFutureWork(id) {
    const previous = clone(paperData.futureWork);

    paperData.futureWork = paperData.futureWork.filter(item => item.id !== id);

    touchPaperData();
    renderFutureWork();

    try {
    showToast("Saving future work removal...");

    await savePaperData();

    showToast("Future work removed and saved.");
}
    catch (error) {
        paperData.futureWork = previous;
        renderFutureWork();
        showToast(error.message || "Unable to remove future work.");
    }
}


/* =========================================================
   ATTACHMENTS

   Files are uploaded through the "upload-rigid-file"
   Supabase Edge Function, which stores them in the
   paper's Google Drive "Attachments" folder and returns
   the Drive file metadata. That metadata (not the raw
   file) is what gets saved into paperData.attachments
   through update-rigid-work-data.

   Links are stored as attachment records too, but with
   type "link" and no Drive file behind them.
========================================================= */

function setupUploads() {
    const fileInput = $("#paperFileInput");
    const uploadButton = $("#uploadPaperFile");
    const uploadZone = $("#paperUploadZone");

    uploadButton?.addEventListener("click", () => fileInput?.click());

    fileInput?.addEventListener("change", async event => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        await uploadAttachments(files);
        fileInput.value = "";
    });

    if (!uploadZone) return;

    ["dragenter", "dragover"].forEach(eventName => {
        uploadZone.addEventListener(eventName, event => {
            event.preventDefault();
            event.stopPropagation();
            uploadZone.classList.add("drag-active");
        });
    });

    ["dragleave", "dragend"].forEach(eventName => {
        uploadZone.addEventListener(eventName, event => {
            event.preventDefault();
            event.stopPropagation();
            uploadZone.classList.remove("drag-active");
        });
    });

    uploadZone.addEventListener("drop", async event => {
        event.preventDefault();
        event.stopPropagation();
        uploadZone.classList.remove("drag-active");

        const files = Array.from(event.dataTransfer?.files || []);
        if (!files.length) return;

        await uploadAttachments(files);
    });

    uploadZone.addEventListener("click", () => fileInput?.click());
}


async function uploadAttachments(files) {
    for (const file of files) {
        await uploadSingleAttachment(file);
    }
}


async function uploadSingleAttachment(file) {
    if (!currentWorkId) {
        showToast("Paper ID is missing.");
        return;
    }

    if (!window.sb) {
        showToast("Supabase client is unavailable.");
        return;
    }

    const pendingId = generateID("attachment");

    const pendingRecord = {
        id: pendingId,
        name: file.name,
        type: "file",
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        createdAt: new Date().toISOString(),
        uploadStatus: "uploading",
        url: ""
    };

    paperData.attachments.push(pendingRecord);
renderAttachments();

showToast(`Uploading "${file.name}"...`);

    try {
        const { data: { session }, error: sessionError } =
            await window.sb.auth.getSession();

        if (sessionError || !session) {
            throw new Error("You must be logged in to upload files.");
        }

        const formData = new FormData();
        formData.append("work_id", currentWorkId);
        formData.append("file", file, file.name);

        const response = await fetch(
            `${SUPABASE_FUNCTIONS_URL}/upload-rigid-file`,
            {
                method: "POST",
                headers: { "Authorization": `Bearer ${session.access_token}` },
                body: formData
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Unable to upload file to Google Drive.");
        }

        const uploaded = result.file || {};

        const index = paperData.attachments.findIndex(item => item.id === pendingId);

        const finalRecord = {
            id: pendingId,
            driveFileId: uploaded.id || "",
            name: uploaded.name || file.name,
            type: "file",
            mimeType: uploaded.mimeType || file.type || "application/octet-stream",
            size: Number(uploaded.size || file.size || 0),
            url: uploaded.webViewLink || "",
            downloadUrl: uploaded.webContentLink || "",
            folderId: uploaded.folderId || "",
            createdAt: uploaded.createdAt || pendingRecord.createdAt,
            uploadStatus: "uploaded"
        };

        if (index === -1) {
            paperData.attachments.push(finalRecord);
        }
        else {
            paperData.attachments[index] = finalRecord;
        }

        touchPaperData();
renderAttachments();

showToast(`Saving "${finalRecord.name}"...`);

await savePaperData();

showToast(`"${finalRecord.name}" uploaded and saved.`);
    }
    catch (error) {
        paperData.attachments = paperData.attachments.filter(item => item.id !== pendingId);
        renderAttachments();
        showToast(error.message || `Unable to upload "${file.name}".`);
    }
}


/* =========================================================
   LINKS
========================================================= */

function setupLinks() {
    $("#addPaperLink")?.addEventListener("click", () => {
        setInputValue("paperLinkTitle", "");
        setInputValue("paperLinkURL", "");
        setInputValue("paperLinkDescription", "");
        openModal("#paperLinkModal");
    });

    $("#savePaperLink")?.addEventListener("click", saveLink);
}


async function saveLink() {
    const url = getInputValue("paperLinkURL");

    if (!url) {
        showToast("Enter a link URL.");
        return;
    }

    const previous = clone(paperData.attachments);

    paperData.attachments.push({
        id: generateID("link"),
        name: getInputValue("paperLinkTitle") || url,
        description: getInputValue("paperLinkDescription"),
        type: "link",
        url,
        createdAt: new Date().toISOString(),
        uploadStatus: "uploaded"
    });

    touchPaperData();
    renderAttachments();

    try {
    closeModal("#paperLinkModal");
    showToast("Saving link...");

    await savePaperData();

    showToast("Link added and saved.");
}
    catch (error) {
        paperData.attachments = previous;
        renderAttachments();
        showToast(error.message || "Unable to save link.");
    }
}


/* =========================================================
   RENDER ATTACHMENTS
========================================================= */

function formatFileSize(bytes) {
    const size = Number(bytes) || 0;

    if (!size) return "";

    const units = ["B", "KB", "MB", "GB"];

    let value = size;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}


function renderAttachments() {
    const container = $("#paperAttachmentGrid");

    if (!container) return;

    container.innerHTML = "";

    if (!paperData.attachments.length) {
        container.innerHTML = `<div class="empty-state">No files or links attached yet.</div>`;
        return;
    }

    paperData.attachments.forEach(attachment => {
        const item = document.createElement("article");
        item.className = "attachment-card";

        const isLink = attachment.type === "link";
        const isUploading = attachment.uploadStatus === "uploading";

        item.innerHTML = `
            <div class="attachment-card-icon">${isLink ? "🔗" : "📄"}</div>
            <div class="attachment-card-body">
                <strong>${escapeHTML(attachment.name)}</strong>
                <small>
                    ${isLink
                ? "Link"
                : `${escapeHTML(attachment.mimeType || attachment.type || "File")}${attachment.size ? ` · ${formatFileSize(attachment.size)}` : ""}`
            }
                </small>
                ${isUploading ? `<span class="attachment-status">Uploading…</span>` : ""}
                ${attachment.description ? `<p>${escapeHTML(attachment.description)}</p>` : ""}
            </div>
            <div class="attachment-card-actions">
                ${attachment.url ? `<a href="${escapeAttribute(attachment.url)}" target="_blank" rel="noopener">Open</a>` : ""}
                ${attachment.downloadUrl ? `<a href="${escapeAttribute(attachment.downloadUrl)}" target="_blank" rel="noopener">Download</a>` : ""}
                <button type="button" class="attachment-delete" data-delete-attachment="${escapeAttribute(attachment.id)}" ${isUploading ? "disabled" : ""}>×</button>
            </div>
        `;

        container.appendChild(item);
    });

    $$("[data-delete-attachment]").forEach(button => {
        button.addEventListener("click", () => {
            deleteAttachment(button.dataset.deleteAttachment);
        });
    });
}


async function deleteAttachment(id) {
    const attachment = paperData.attachments.find(item => item.id === id);

    if (!attachment) return;

    const confirmed = window.confirm(`Remove "${attachment.name}"?`);

    if (!confirmed) return;

    const previous = clone(paperData.attachments);

    paperData.attachments = paperData.attachments.filter(item => item.id !== id);

    touchPaperData();
    renderAttachments();

    try {
    showToast("Removing attachment...");

    if (attachment.driveFileId) {
            if (!window.sb) {
                throw new Error("Supabase client is unavailable.");
            }

            const { data: { session }, error: sessionError } =
                await window.sb.auth.getSession();

            if (sessionError || !session) {
                throw new Error("You must be logged in to remove this file.");
            }

            const response = await fetch(
                `${SUPABASE_FUNCTIONS_URL}/delete-rigid-file`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        work_id: currentWorkId,
                        drive_file_id: attachment.driveFileId
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Unable to delete file from Google Drive.");
            }
        }

                showToast("Saving attachment removal...");

        await savePaperData();

        showToast("Attachment removed and saved.");
    }
    catch (error) {
        paperData.attachments = previous;
        renderAttachments();
        showToast(error.message || "Unable to remove attachment.");
    }
}


/* =========================================================
   FEEDBACK
========================================================= */

function setupFeedback() {
    $("#addFeedback")?.addEventListener("click", () => openFeedbackModal(null));
    $("#saveFeedback")?.addEventListener("click", saveFeedback);
}


function renderFeedback() {
    const container = $("#feedbackGrid");

    if (!container) return;

    container.innerHTML = "";

    if (!paperData.feedback.length) {
        container.innerHTML = `<div class="empty-state">No feedback added yet.</div>`;
        return;
    }

    paperData.feedback.forEach(feedback => {
        const item = document.createElement("article");
        item.className = "feedback-item";
        item.innerHTML = `
            <div>
                <strong>${escapeHTML(feedback.author || "Anonymous")}</strong>
                <small>${escapeHTML(formatStatus(feedback.type || "mentor"))}</small>
                <p>${escapeHTML(feedback.text)}</p>
                <small>${escapeHTML(feedback.date ? formatRigidDate(feedback.date) : formatRigidDate(feedback.createdAt))}</small>
            </div>
            <div>
                <button type="button" data-edit-feedback="${escapeAttribute(feedback.id)}">Edit</button>
                <button type="button" data-delete-feedback="${escapeAttribute(feedback.id)}">×</button>
            </div>
        `;
        container.appendChild(item);
    });

    $$("[data-edit-feedback]").forEach(button => {
        button.addEventListener("click", () => {
            openFeedbackModal(button.dataset.editFeedback);
        });
    });

    $$("[data-delete-feedback]").forEach(button => {
        button.addEventListener("click", () => {
            deleteFeedback(button.dataset.deleteFeedback);
        });
    });
}


function openFeedbackModal(id = null) {
    editingFeedbackId = id;

    const feedback = id
        ? paperData.feedback.find(item => item.id === id)
        : null;

    setInputValue("feedbackPerson", feedback?.author || "");
    setInputValue("feedbackDate", feedback?.date || getTodayISO());
    setInputValue("feedbackType", feedback?.type || "mentor");
    setInputValue("feedbackContent", feedback?.text || "");

    openModal("#feedbackModal");
}


async function saveFeedback() {
    const text = getInputValue("feedbackContent");

    if (!text) {
        showToast("Enter feedback.");
        return;
    }

    const previous = clone(paperData.feedback);

    const feedbackData = {
        author: getInputValue("feedbackPerson") || "Anonymous",
        date: getInputValue("feedbackDate"),
        type: getInputValue("feedbackType") || "mentor",
        text
    };

    if (editingFeedbackId) {
        const feedback = paperData.feedback.find(item => item.id === editingFeedbackId);
        if (feedback) Object.assign(feedback, feedbackData);
    }
    else {
        paperData.feedback.unshift({
            id: generateID("feedback"),
            ...feedbackData,
            createdAt: new Date().toISOString()
        });
    }

    touchPaperData();
    renderFeedback();

    try {
    closeModal("#feedbackModal");
    showToast("Saving feedback...");

    await savePaperData();

    editingFeedbackId = null;
    showToast("Feedback added and saved.");
}
    catch (error) {
        paperData.feedback = previous;
        renderFeedback();
        showToast(error.message || "Unable to save feedback.");
    }
}


async function deleteFeedback(id) {
    const previous = clone(paperData.feedback);

    paperData.feedback = paperData.feedback.filter(item => item.id !== id);

    touchPaperData();
    renderFeedback();

    try {
    showToast("Saving feedback removal...");

    await savePaperData();

    showToast("Feedback removed and saved.");
}
    catch (error) {
        paperData.feedback = previous;
        renderFeedback();
        showToast(error.message || "Unable to remove feedback.");
    }
}


/* =========================================================
   NEXT ACTION
========================================================= */

function loadNextAction() {
    setInputValue("nextPaperAction", paperData.nextAction || "");
}


function setupPaperControls() {
    $("#backToWorkspace")?.addEventListener("click", () => {
        // Adjust this if the app has a specific workspace URL —
        // falling back to browser history keeps this safe by default.
        if (window.history.length > 1) {
            window.history.back();
        }
        else {
            window.location.href = "index.html";
        }
    });

    $("#saveNextAction")?.addEventListener("click", saveNextAction);
}


async function saveNextAction() {
    const previous = paperData.nextAction;

    paperData.nextAction = getInputValue("nextPaperAction");

    touchPaperData();

    try {
    showToast("Saving next action...");

    await savePaperData();

    showToast("Next action saved.");
}
    catch (error) {
        paperData.nextAction = previous;
        loadNextAction();
        showToast(error.message || "Unable to save next action.");
    }
}


/* =========================================================
   PAPER SUMMARY / PROGRESS
========================================================= */

function updatePaperSummary() {
    const totalSections = paperData.sections.length;

    const completedSections = paperData.sections.filter(
        section => section.status === "completed"
    ).length;

    const totalWords = paperData.sections.reduce((total, section) => {
        const text = String(section.content || "").trim();
        if (!text) return total;
        return total + text.split(/\s+/).length;
    }, 0);

    const progress = totalSections
        ? Math.round((completedSections / totalSections) * 100)
        : 0;

    const openQuestions = paperData.questions.filter(
        question => question.status !== "resolved"
    ).length;

    // Progress strip
    setText("sectionProgress", `${completedSections} / ${totalSections}`);
    setText("referenceCount", paperData.references.length);
    setText("draftCount", paperData.versions.length);
    setText("questionCount", openQuestions);
    setText("paperCompletion", `${progress}%`);

    // Writing workspace sidebar
    setText("writingPercentage", `${progress}%`);
    const progressFill = $("#writingProgressFill");
    if (progressFill) progressFill.style.width = `${progress}%`;

    // Bottom summary card
    setText("summarySections", `${completedSections} / ${totalSections}`);
    setText("summaryReferences", paperData.references.length);
    setText("summaryVersions", paperData.versions.length);
    setText("summaryWords", totalWords);
}


/* =========================================================
   TOP NAVIGATION
========================================================= */

function setupTopNavigation() {
    $$(".paper-nav-item").forEach(button => {
        button.addEventListener("click", () => {
            const sectionKey = button.dataset.section;

            if (!sectionKey) return;

            $$(".paper-nav-item").forEach(item => item.classList.remove("active"));
            button.classList.add("active");

            const target = document.getElementById(`${sectionKey}Section`);

            target?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}


/* =========================================================
   MODAL CONTROLS
========================================================= */

/* Every modal's close (×) and cancel buttons, mapped to
   their modal id. Wired generically here since the HTML
   does not use a shared data-close-modal attribute. */
const MODAL_CLOSE_BUTTONS = {
    paperInformationModal: ["closePaperInfoModal", "cancelPaperInfo"],
    learningModal: ["closeLearningModal", "cancelLearning"],
    findingModal: ["closeFindingModal", "cancelFinding"],
    methodologyModal: ["closeMethodologyModal", "cancelMethodology"],
    questionModal: ["closeQuestionModal", "cancelQuestion"],
    paperSectionModal: ["closePaperSectionModal", "cancelPaperSection"],
    deletePaperSectionModal: ["closeDeletePaperSectionModal", "cancelDeletePaperSection"],
    referenceModal: ["closeReferenceModal", "cancelReference"],
    paperLinkModal: ["closePaperLinkModal", "cancelPaperLink"],
    paperTimelineModal: ["closePaperTimelineModal", "cancelPaperTimeline"],
    versionModal: ["closeVersionModal", "cancelVersion"],
    feedbackModal: ["closeFeedbackModal", "cancelFeedback"]
};

function setupModalControls() {
    Object.entries(MODAL_CLOSE_BUTTONS).forEach(([modalId, buttonIds]) => {
        buttonIds.forEach(buttonId => {
            $(`#${buttonId}`)?.addEventListener("click", () => {
                closeModal(`#${modalId}`);
            });
        });
    });

    // Click on the dark overlay (outside the modal box) closes it
    $$(".paper-modal").forEach(modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeModal(`#${modal.id}`);
            }
        });
    });

    // Escape key closes any open modal
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            $$(".paper-modal.open").forEach(modal => {
                closeModal(`#${modal.id}`);
            });
        }
    });
}


function openModal(selector) {
    const modal = document.querySelector(selector);

    if (!modal) {
        console.warn("Modal not found:", selector);
        return;
    }

    modal.hidden = false;
    modal.classList.remove("hidden");

    requestAnimationFrame(() => {
        modal.classList.add("open");
    });

    document.body.classList.add("modal-open");

    const firstInput = modal.querySelector("input, textarea, select");
    setTimeout(() => firstInput?.focus(), 100);
}


function closeModal(selector) {
    const modal = document.querySelector(selector);

    if (!modal) return;

    modal.classList.remove("open");

    setTimeout(() => {
        modal.hidden = true;
        modal.classList.add("hidden");
    }, 180);

    if (!$(".paper-modal.open")) {
        document.body.classList.remove("modal-open");
    }
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {
    const toast = $("#paperToast");

    if (!toast) return;

    toast.textContent = message;
    toast.hidden = false;
    toast.classList.remove("hidden");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.hidden = true;
        toast.classList.add("hidden");
    }, 3500);
}


/* =========================================================
   LIVE CLOCK
========================================================= */

function startLiveClock() {
    const dateEl = $("#liveDate");
    const clockEl = $("#liveClock");

    if (!dateEl && !clockEl) return;

    function updateClock() {
        const now = new Date();

        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        }

        if (clockEl) {
            clockEl.textContent = now.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        }
    }

    updateClock();
    setInterval(updateClock, 1000);
}

/* =========================================================
   COMPLETION CONFETTI
========================================================= */

/* =========================================================
   COMPLETION CONFETTI
========================================================= */

/* =========================================================
   COMPLETION POPUP + CONFETTI
========================================================= */

function triggerCompletionConfetti(status) {
    // Remove an existing popup if one somehow remains
    document.querySelector(".rigid-completion-overlay")?.remove();

    const normalizedStatus =
        String(status || "").trim().toLowerCase();

    const isPublished = normalizedStatus === "published";

    const title = isPublished
        ? "Paper Published!"
        : "Ready for Review!";

    const message = isPublished
        ? "Your paper has been published and marked as completed."
        : "Your paper is ready for review and has been marked as completed.";

    const icon = isPublished ? "🚀" : "🎉";
    const buttonText = isPublished ? "Great!" : "Continue";

    /* ---------------------------------------------------------
       OVERLAY
    --------------------------------------------------------- */

    const overlay = document.createElement("div");

    overlay.className = "rigid-completion-overlay";

    Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: "2147483646",
        opacity: "0",
        transition: "opacity 220ms ease"
    });

    /* ---------------------------------------------------------
       POPUP
    --------------------------------------------------------- */

    const popup = document.createElement("div");

    Object.assign(popup.style, {
        width: "min(420px, calc(100vw - 40px))",
        padding: "32px 28px 26px",
        borderRadius: "20px",
        background: "#171027",
        border: "1px solid rgba(168, 85, 247, 0.65)",
        boxShadow:
            "0 25px 80px rgba(0, 0, 0, 0.55), 0 0 40px rgba(168, 85, 247, 0.18)",
        textAlign: "center",
        color: "#ffffff",
        transform: "translateY(25px) scale(0.92)",
        transition:
            "transform 600ms cubic-bezier(.17,.89,.32,1.28)"
    });

    /* ---------------------------------------------------------
       ICON
    --------------------------------------------------------- */

    const iconElement = document.createElement("div");

    iconElement.textContent = icon;

    Object.assign(iconElement.style, {
        fontSize: "54px",
        lineHeight: "1",
        marginBottom: "18px",
        animation: "rigidCompletionIcon 700ms ease forwards"
    });

    /* ---------------------------------------------------------
       TITLE
    --------------------------------------------------------- */

    const titleElement = document.createElement("h2");

    titleElement.textContent = title;

    Object.assign(titleElement.style, {
        margin: "0 0 10px",
        fontSize: "25px",
        fontWeight: "700",
        letterSpacing: "-0.3px"
    });

    /* ---------------------------------------------------------
       MESSAGE
    --------------------------------------------------------- */

    const messageElement = document.createElement("p");

    messageElement.textContent = message;

    Object.assign(messageElement.style, {
        margin: "0 auto 24px",
        maxWidth: "330px",
        color: "rgba(255, 255, 255, 0.72)",
        fontSize: "14px",
        lineHeight: "1.6"
    });

    /* ---------------------------------------------------------
       BUTTON
    --------------------------------------------------------- */

    const button = document.createElement("button");

    button.type = "button";
    button.textContent = buttonText;

    Object.assign(button.style, {
        minWidth: "120px",
        padding: "11px 24px",
        border: "0",
        borderRadius: "10px",
        background: "#7c3aed",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "transform 160ms ease, opacity 160ms ease"
    });

    button.addEventListener("mouseenter", () => {
        button.style.transform = "translateY(-1px)";
        button.style.opacity = "0.9";
    });

    button.addEventListener("mouseleave", () => {
        button.style.transform = "translateY(0)";
        button.style.opacity = "1";
    });

    /* ---------------------------------------------------------
       CLOSE FUNCTION
    --------------------------------------------------------- */

    function closeCompletionPopup() {
        overlay.style.opacity = "0";
        popup.style.transform = "translateY(25px) scale(0.92)";

        setTimeout(() => {
            overlay.remove();
        }, 230);
    }

    button.addEventListener("click", closeCompletionPopup);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeCompletionPopup();
        }
    });

    /* ---------------------------------------------------------
       ESC KEY
    --------------------------------------------------------- */

    function handleEscape(event) {
        if (event.key === "Escape") {
            closeCompletionPopup();
            document.removeEventListener("keydown", handleEscape);
        }
    }

    document.addEventListener("keydown", handleEscape);

    /* ---------------------------------------------------------
       BUILD POPUP
    --------------------------------------------------------- */

    popup.appendChild(iconElement);
    popup.appendChild(titleElement);
    popup.appendChild(messageElement);
    popup.appendChild(button);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    /* ---------------------------------------------------------
       POPUP ANIMATION
    --------------------------------------------------------- */

    requestAnimationFrame(() => {
        overlay.style.opacity = "1";
        popup.style.transform = "translateY(0) scale(1)";
    });

    /* ---------------------------------------------------------
       CONFETTI BEHIND POPUP
    --------------------------------------------------------- */

    createCompletionConfetti();
}


/* =========================================================
   CONFETTI BURST
========================================================= */

function createCompletionConfetti() {
    const container = document.createElement("div");

    Object.assign(container.style, {
        position: "fixed",
        inset: "0",
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: "2147483645"
    });

    document.body.appendChild(container);

    const colors = [
        "#ff4d6d",
        "#ffd166",
        "#06d6a0",
        "#4cc9f0",
        "#a855f7",
        "#ffffff",
        "#ff9f1c"
    ];

    for (let i = 0; i < 100; i++) {
        const piece = document.createElement("div");

        const size = 5 + Math.random() * 7;
        const x = Math.random() * window.innerWidth;
        const drift = (Math.random() - 0.5) * 450;
        const duration = 1600 + Math.random() * 1800;
        const delay = Math.random() * 250;

        Object.assign(piece.style, {
            position: "absolute",
            left: `${x}px`,
            top: "-20px",
            width: `${size}px`,
            height: `${size * 1.5}px`,
            background:
                colors[Math.floor(Math.random() * colors.length)],
            borderRadius: "2px"
        });

        container.appendChild(piece);

        piece.animate(
            [
                {
                    transform: "translate3d(0, 0, 0) rotate(0deg)",
                    opacity: 1
                },
                {
                    transform:
                        `translate3d(${drift}px, ${window.innerHeight * 0.45}px, 0) rotate(300deg)`,
                    opacity: 1
                },
                {
                    transform:
                        `translate3d(${drift * 1.4}px, ${window.innerHeight + 80}px, 0) rotate(700deg)`,
                    opacity: 0
                }
            ],
            {
                duration,
                delay,
                easing: "cubic-bezier(.2,.7,.3,1)",
                fill: "forwards"
            }
        );
    }

    setTimeout(() => {
        container.remove();
    }, 4200);
}


/* =========================================================
   POPUP ICON ANIMATION
========================================================= */

(function addCompletionPopupAnimation() {
    if (document.getElementById("rigidCompletionPopupStyles")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "rigidCompletionPopupStyles";

    style.textContent = `
        @keyframes rigidCompletionIcon {
            0% {
                transform: scale(0.4) rotate(-15deg);
                opacity: 0;
            }

            55% {
                transform: scale(1.15) rotate(5deg);
                opacity: 1;
            }

            100% {
                transform: scale(1) rotate(0deg);
                opacity: 1;
            }
        }
    `;

    document.head.appendChild(style);
})();
/* =========================================================
   END OF PAPER.JS
========================================================= */