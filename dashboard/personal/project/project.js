/* =========================================================
RiGiD — PROJECT WORKSPACE
project.js

Backend-connected version
========================================================= */

/* =========================================================
CONFIG
========================================================= */

const SUPABASE_FUNCTIONS_URL =
    "https://mmmsmncmskvuqyhaqcne.supabase.co/functions/v1";

/* =========================================================
DOM HELPERS
========================================================= */

const $ = selector =>
    document.querySelector(selector);

const $$ = selector =>
    Array.from(
        document.querySelectorAll(selector)
    );

function getElement(id) {


    return document.getElementById(id);


}

function getInputValue(id) {


    const element =
        getElement(id);


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();


}

function setInputValue(
    id,
    value
) {


    const element =
        getElement(id);


    if (!element) {

        return;

    }


    element.value =
        value ?? "";


}

function setText(
    id,
    value
) {


    const element =
        getElement(id);


    if (!element) {

        return;

    }


    element.textContent =
        value ?? "";


}

/* =========================================================
STATE
========================================================= */

let projectData = null;

let currentWorkId = null;

let editingTaskId = null;

let selectedTaskId = null;

let editingMilestoneId = null;

let editingTimelineId = null;

let confirmCallback = null;

let toastTimer = null;

let isSaving = false;

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeProject
);


function updateClock() {

    const clockElement =
        document.getElementById("clock");

    if (!clockElement) return;


    const now =
        new Date();


    const timeString =
        now.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            }
        );


    clockElement.textContent =
        timeString;
}


function setLoading(isLoading) {

    const loader =
        document.getElementById("loadingOverlay") ||
        document.getElementById("loading-overlay") ||
        document.querySelector(".loading-overlay");


    if (!loader) return;


    if (isLoading) {

        loader.style.display =
            "flex";

        loader.classList.add(
            "active"
        );

    }

    else {

        loader.style.display =
            "none";

        loader.classList.remove(
            "active"
        );

    }
}
/* =========================================================
   UTILITY FUNCTIONS
========================================================= */

function clampPercentage(value) {

    const number =
        Number(value);

    if (
        Number.isNaN(number) ||
        !Number.isFinite(number)
    ) {
        return 0;
    }


    return Math.min(
        100,
        Math.max(
            0,
            number
        )
    );
}


function showToast(
    message,
    type = "info"
) {

    const toast =
        document.getElementById("toast") ||
        document.getElementById("toastMessage") ||
        document.querySelector(".toast");


    if (!toast) {

        console.log(
            `[${type}] ${message}`
        );

        return;

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    toast.classList.remove(
        "success",
        "error",
        "info",
        "warning"
    );


    toast.classList.add(
        type
    );


    clearTimeout(
        window.__projectToastTimeout
    );


    window.__projectToastTimeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );
}
function formatDate(dateValue) {

    if (!dateValue) {
        return "Not specified";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Not specified";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   UTILITY FUNCTIONS
========================================================= */

function generateID(
    prefix = "item"
) {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {

        return `${prefix}-${window.crypto.randomUUID()}`;

    }


    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

}


function clone(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return value;

    }


    return JSON.parse(
        JSON.stringify(value)
    );

}


function findById(
    array,
    id
) {

    return (
        Array.isArray(array)
            ? array
            : []
    ).find(
        item =>
            String(item.id) ===
            String(id)
    );

}


function clampPercentage(value) {

    const number =
        Number(value);


    if (
        Number.isNaN(number) ||
        !Number.isFinite(number)
    ) {

        return 0;

    }


    return Math.max(
        0,
        Math.min(
            100,
            number
        )
    );

}


function formatLabel(value) {

    return String(
        value ||
        ""
    )
        .replace(
            /[-_]/g,
            " "
        )
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


function todayISO() {

    const date =
        new Date();


    const offset =
        date.getTimezoneOffset() *
        60000;


    return new Date(
        date.getTime() -
        offset
    )
        .toISOString()
        .slice(
            0,
            10
        );

}


function normalizeDateInput(value) {

    if (!value) {

        return "";

    }


    const string =
        String(value).trim();


    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(string)
    ) {

        return string;

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const offset =
        date.getTimezoneOffset() *
        60000;


    return new Date(
        date.getTime() -
        offset
    )
        .toISOString()
        .slice(
            0,
            10
        );

}


function formatDate(value) {

    if (!value) {

        return "";

    }


    const normalized =
        normalizeDateInput(
            value
        );


    if (!normalized) {

        return String(
            value
        );

    }


    const date =
        new Date(
            `${normalized}T00:00:00`
        );


    return date
        .toLocaleDateString(
            "en-IN",
            {

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"

            }
        );

}

function getExtension(
    filename
) {


    const parts =
        String(
            filename ||
            ""
        ).split(
            "."
        );


    if (
        parts.length <
        2
    ) {

        return "FILE";

    }


    return parts
        .pop()
        .slice(
            0,
            5
        )
        .toUpperCase();


}

function formatDateTime(value) {

    if (!value) {

        return "";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );

    }


    return date.toLocaleString(
        "en-IN",
        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    );

}


function normalizeURL(value) {

    const url =
        String(
            value ||
            ""
        )
            .trim();


    if (!url) {

        return "";

    }


    if (
        /^https?:\/\//i
            .test(url)
    ) {

        return url;

    }


    return `https://${url}`;

}


function emptyState(message) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "empty-state";


    element.textContent =
        message;


    return element;

}


function openModal(modal) {

    if (!modal) {

        return;

    }


    modal.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";

}


function closeModal(modal) {

    if (!modal) {

        return;

    }


    modal.classList.add(
        "hidden"
    );


    const openModalExists =
        $$(".project-modal")
            .some(
                item =>
                    !item.classList.contains(
                        "hidden"
                    )
            );


    if (!openModalExists) {

        document.body.style.overflow =
            "";

    }

}


function askConfirm(
    title,
    message,
    callback
) {

    confirmCallback =
        callback;


    setText(
        "confirmModalTitle",
        title
    );


    setText(
        "confirmModalMessage",
        message
    );


    openModal(
        getElement(
            "confirmModal"
        )
    );

}


function closeConfirm() {

    confirmCallback =
        null;


    closeModal(
        getElement(
            "confirmModal"
        )
    );

}


function showToast(
    message,
    type = "info"
) {

    const toast =
        getElement(
            "projectToast"
        ) ||
        getElement(
            "toast"
        ) ||
        getElement(
            "toastMessage"
        ) ||
        document.querySelector(
            ".toast"
        );


    if (!toast) {

        console.log(
            `[${type}] ${message}`
        );

        return;

    }


    toast.textContent =
        message;


    toast.classList.remove(
        "hidden"
    );


    toast.classList.add(
        "show"
    );


    toast.classList.remove(
        "success",
        "error",
        "info",
        "warning"
    );


    if (type) {

        toast.classList.add(
            type
        );

    }


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.add(
                    "hidden"
                );


                toast.classList.remove(
                    "show"
                );

            },
            2800
        );

}
/* =========================================================
MISSING PROJECT UTILITY FUNCTIONS
========================================================= */

function generateID(
    prefix = "item"
) {


    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {

        return `${prefix}-${window.crypto.randomUUID()}`;

    }


    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;


}

function clone(value) {


    if (
        value === null ||
        value === undefined
    ) {

        return value;

    }


    return JSON.parse(
        JSON.stringify(value)
    );


}

function findById(
    array,
    id
) {


    return (
        Array.isArray(array)
            ? array
            : []
    ).find(
        item =>
            String(item.id) ===
            String(id)
    );


}

function formatLabel(value) {


    return String(
        value ||
        ""
    )
        .replace(
            /[-_]/g,
            " "
        )
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );


}

function todayISO() {


    const date =
        new Date();


    const offset =
        date.getTimezoneOffset() *
        60000;


    return new Date(
        date.getTime() -
        offset
    )
        .toISOString()
        .slice(
            0,
            10
        );


}

function normalizeDateInput(value) {


    if (!value) {

        return "";

    }


    const string =
        String(value).trim();


    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(string)
    ) {

        return string;

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const offset =
        date.getTimezoneOffset() *
        60000;


    return new Date(
        date.getTime() -
        offset
    )
        .toISOString()
        .slice(
            0,
            10
        );


}

function formatDateTime(value) {


    if (!value) {

        return "";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleString(
        "en-IN",
        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    );


}

function emptyState(message) {


    return `
    <div class="empty-state">
        ${escapeHTML(message)}
    </div>
`;


}

function normalizeURL(value) {


    const url =
        String(
            value ||
            ""
        ).trim();


    if (!url) {

        return "";

    }


    if (
        /^https?:\/\//i.test(url)
    ) {

        return url;

    }


    return `https://${url}`;


}

function getInitials(name) {


    const parts =
        String(
            name ||
            ""
        )
            .trim()
            .split(
                /\s+/
            )
            .filter(Boolean);


    if (!parts.length) {

        return "?";

    }


    return parts
        .slice(0, 2)
        .map(
            part =>
                part.charAt(0)
                    .toUpperCase()
        )
        .join("");


}

function escapeHTML(value) {


    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ??
        "";


    return div.innerHTML;


}

async function initializeProject() {

    currentWorkId =
        getWorkIdFromURL();


    updateClock();


    setInterval(
        updateClock,
        1000
    );


    if (!currentWorkId) {

        showToast(
            "Project ID is missing."
        );

        return;

    }


    setLoading(
        true
    );


    try {

        await loadProjectData();


        initializeProjectPage();


        showToast(
            "Project loaded."
        );

    }

    catch (error) {

        console.error(
            "Project initialization error:",
            error
        );


        showToast(
            error.message ||
            "Unable to load Project."
        );

    }

    finally {

        setLoading(
            false
        );

    }

}
/* =========================================================
GET WORK ID
========================================================= */

function getWorkIdFromURL() {


    const params =
        new URLSearchParams(
            window.location.search
        );


    return (

        params.get("work_id") ||

        params.get("id") ||

        params.get("work") ||

        params.get("project")

    );


}

/* =========================================================
AUTH SESSION
========================================================= */

async function getSession() {


    if (!window.sb) {

        throw new Error(
            "Supabase client is unavailable."
        );

    }


    const {
        data: {
            session
        },
        error
    } =
        await window.sb.auth.getSession();


    if (
        error ||
        !session
    ) {

        throw new Error(
            "You must be logged in."
        );

    }


    return session;


}

/* =========================================================
LOAD PROJECT DATA
========================================================= */

async function loadProjectData() {


    const session =
        await getSession();


    const response =
        await fetch(

            `${SUPABASE_FUNCTIONS_URL}/get-rigid-work-data`,

            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${session.access_token}`

                },

                body:
                    JSON.stringify({

                        work_id:
                            currentWorkId

                    })

            }

        );


    const result =
        await response.json();


    if (
        !response.ok ||
        !result.success
    ) {

        throw new Error(

            result.error ||
            "Unable to load Project data."

        );

    }


    projectData =
        convertRigidDataToProjectData(

            result.data,
            result.work

        );


    console.log(
        "RiGiD Project loaded:",
        projectData
    );


}

/* =========================================================
SAVE PROJECT DATA
========================================================= */

async function saveProjectData() {


    if (isSaving) {

        return;

    }


    if (!currentWorkId) {

        throw new Error(
            "Project ID is missing."
        );

    }


    if (!projectData) {

        throw new Error(
            "Project data is not loaded."
        );

    }


    isSaving =
        true;


    try {

        const session =
            await getSession();


        const rigidData =
            convertProjectDataToRigidData(
                projectData
            );


        const response =
            await fetch(

                `${SUPABASE_FUNCTIONS_URL}/update-rigid-work-data`,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${session.access_token}`

                    },

                    body:
                        JSON.stringify({

                            work_id:
                                currentWorkId,

                            data:
                                rigidData

                        })

                }

            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(

                result.error ||
                "Unable to save Project data."

            );

        }


        projectData.updatedAt =
            new Date()
                .toISOString();


        return result;

    }

    finally {

        isSaving =
            false;

    }


}

/* =========================================================
DATA CONVERSION
========================================================= */

function convertRigidDataToProjectData(
    data,
    work = {}
) {


    const workspace =
        data?.workspace || {};


    const project =
        data?.project || {};


    return {

        id:
            workspace.id ||
            work?.id ||
            currentWorkId,


        title:
            workspace.title ||
            work?.title ||
            "Untitled Project",


        status:
            workspace.status ||
            project.status ||
            "in-progress",


        description:
            project.description ||
            "",


        objective:
            project.objective ||
            "",


        owner:
            project.owner ||
            workspace.owner ||
            work?.owner ||
            "You",


        priority:
            project.priority ||
            "medium",


        progress:
            clampPercentage(
                project.progress ?? 0
            ),


        progressStatus:
            project.progressStatus ||
            "on-track",


        startDate:
            project.startDate ||
            workspace.createdAt ||
            "",


        targetDate:
            project.targetDate ||
            "",


        tags:
            Array.isArray(
                project.tags
            )
                ? project.tags
                : [],


        currentWork:
        {

            title:
                project.currentWork?.title ||
                "",

            description:
                project.currentWork?.description ||
                ""

        },


        nextAction:
        {

            title:
                project.nextAction?.title ||
                "",

            dueDate:
                project.nextAction?.dueDate ||
                ""

        },


        collaborators:
            Array.isArray(
                project.collaborators
            )
                ? project.collaborators
                : [],


        milestones:
            Array.isArray(
                project.milestones
            )
                ? project.milestones
                : [],


        tests:
            Array.isArray(
                project.tests
            )
                ? project.tests
                : [],


        versions:
            Array.isArray(
                project.versions
            )
                ? project.versions
                : [],


        issues:
            Array.isArray(
                project.issues
            )
                ? project.issues
                : [],


        decisions:
            Array.isArray(
                project.decisions
            )
                ? project.decisions
                : [],


        outcome:
            project.outcome ||
            "",


        tasks:
            Array.isArray(
                data?.tasks
            )
                ? data.tasks
                : [],


        timeline:
            Array.isArray(
                data?.timeline
            )
                ? data.timeline
                : [],


        futureWork:
            Array.isArray(
                data?.futureWork
            )
                ? data.futureWork
                : [],


        attachments:
            Array.isArray(
                data?.attachments
            )
                ? data.attachments
                : [],


        links:
            Array.isArray(
                data?.links
            )
                ? data.links
                : [],


        createdAt:
            workspace.createdAt ||
            work?.created_at ||
            null,


        updatedAt:
            workspace.updatedAt ||
            work?.updated_at ||
            null

    };


}

function convertProjectDataToRigidData(
    project
) {


    const now =
        new Date()
            .toISOString();


    return {

        version:
            1,


        workspace:
        {

            id:
                project.id,

            type:
                "project",

            title:
                project.title,

            status:
                project.status ||
                "in-progress",

            createdAt:
                project.createdAt ||
                now,

            updatedAt:
                now

        },


        project:
        {

            description:
                project.description ||
                "",

            objective:
                project.objective ||
                "",

            owner:
                project.owner ||
                "You",

            priority:
                project.priority ||
                "medium",

            progress:
                clampPercentage(
                    project.progress
                ),

            progressStatus:
                project.progressStatus ||
                "on-track",

            startDate:
                project.startDate ||
                "",

            targetDate:
                project.targetDate ||
                "",

            tags:
                project.tags || [],

            currentWork:
                project.currentWork || {},

            nextAction:
                project.nextAction || {},

            collaborators:
                project.collaborators || [],

            milestones:
                project.milestones || [],

            tests:
                project.tests || [],

            versions:
                project.versions || [],

            issues:
                project.issues || [],

            decisions:
                project.decisions || [],

            outcome:
                project.outcome || ""

        },


        tasks:
            project.tasks || [],


        timeline:
            project.timeline || [],


        futureWork:
            project.futureWork || [],


        attachments:
            project.attachments || [],


        links:
            project.links || []

    };


}

/* =========================================================
INITIALIZE PAGE
========================================================= */

function initializeProjectPage() {


    renderEverything();

    setupNavigation();

    setupProjectDetails();

    setupProgress();

    setupCurrentWork();

    setupNextAction();

    setupDescription();

    setupTasks();

    setupMilestones();

    setupTimeline();

    setupCollaborators();

    setupTests();

    setupVersions();

    setupIssues();

    setupDecisions();

    setupFiles();

    setupLinks();

    setupFutureWork();

    setupOutcome();

    setupModalControls();

    setupDragAndDrop();


}

/* =========================================================
RENDER EVERYTHING
========================================================= */

function renderEverything() {


    if (!projectData) {

        return;

    }


    renderHeader();

    renderOverview();

    renderTasks();

    renderMilestones();

    renderTimeline();

    renderCollaborators();

    renderTests();

    renderVersions();

    renderIssues();

    renderDecisions();

    renderAttachments();

    renderLinks();

    renderFutureWork();

    renderOutcome();


}

/* =========================================================
HEADER
========================================================= */

function renderHeader() {


    setText(
        "projectTitle",
        projectData.title
    );


    setText(
        "projectDescription",
        projectData.description ||
        "No project description added."
    );


    setText(
        "projectOwner",
        projectData.owner ||
        "You"
    );


    setText(
        "projectStarted",
        formatDate(
            projectData.startDate
        ) ||
        "-"
    );


    setText(
        "projectTarget",
        formatDate(
            projectData.targetDate
        ) ||
        "-"
    );


    const status =
        String(
            projectData.status ||
            "in-progress"
        );


    const priority =
        String(
            projectData.priority ||
            "medium"
        );


    setText(
        "projectStatus",
        `● ${formatLabel(status)}`
    );


    setText(
        "projectPriority",
        formatLabel(priority)
    );


    const tags =
        getElement(
            "projectTags"
        );


    if (tags) {

        tags.innerHTML =
            "";


        projectData.tags
            .forEach(
                tag => {

                    const span =
                        document.createElement(
                            "span"
                        );


                    span.textContent =
                        tag;


                    tags.appendChild(
                        span
                    );

                }
            );

    }


}

/* =========================================================
OVERVIEW
========================================================= */

function renderOverview() {


    const progress =
        clampPercentage(
            projectData.progress
        );


    setText(
        "projectProgress",
        `${progress}%`
    );


    const progressBar =
        getElement(
            "projectProgressBar"
        );


    if (progressBar) {

        progressBar.style.width =
            `${progress}%`;

    }


    setText(
        "progressStatus",
        formatLabel(
            projectData.progressStatus
        )
    );


    setText(
        "currentWorkTitle",

        projectData.currentWork?.title ||
        "No current work recorded"
    );


    setText(
        "currentWorkDescription",

        projectData.currentWork?.description ||
        "Add the work currently being performed."
    );


    setText(
        "nextActionTitle",

        projectData.nextAction?.title ||
        "No next action recorded"
    );


    setText(
        "nextActionDue",

        projectData.nextAction?.dueDate

            ? formatDate(
                projectData.nextAction.dueDate
            )

            : "No due date"
    );


    const description =
        getElement(
            "descriptionContent"
        );


    if (description) {

        description.innerHTML =
            "";


        const paragraph =
            document.createElement(
                "p"
            );


        paragraph.textContent =
            projectData.objective ||
            "No project objective has been added yet.";


        description.appendChild(
            paragraph
        );

    }


}

/* =========================================================
PROJECT DETAILS
========================================================= */

function setupProjectDetails() {


    $("#editProject")
        ?.addEventListener(
            "click",
            openProjectDetailsModal
        );


    $("#saveProjectDetails")
        ?.addEventListener(
            "click",
            saveProjectDetails
        );


    $("#cancelProjectDetails")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "projectDetailsModal"
                    )
                )
        );


    $("#closeProjectDetailsModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "projectDetailsModal"
                    )
                )
        );


}

function openProjectDetailsModal() {


    setInputValue(
        "editProjectTitle",
        projectData.title
    );


    setInputValue(
        "editProjectDescription",
        projectData.description
    );


    setInputValue(
        "editProjectStatus",
        projectData.status
    );


    setInputValue(
        "editProjectPriority",
        projectData.priority
    );


    setInputValue(
        "editProjectStartDate",
        normalizeDateInput(
            projectData.startDate
        )
    );


    setInputValue(
        "editProjectTargetDate",
        normalizeDateInput(
            projectData.targetDate
        )
    );


    setInputValue(
        "editProjectTags",
        projectData.tags.join(
            ", "
        )
    );


    openModal(
        getElement(
            "projectDetailsModal"
        )
    );


}

async function saveProjectDetails() {


    const title =
        getInputValue(
            "editProjectTitle"
        );


    if (!title) {

        showToast(
            "Project title is required."
        );

        return;

    }


    const previous =
        clone(
            projectData
        );


    projectData.title =
        title;


    projectData.description =
        getInputValue(
            "editProjectDescription"
        );


    projectData.status =
        getInputValue(
            "editProjectStatus"
        ) ||
        "in-progress";


    projectData.priority =
        getInputValue(
            "editProjectPriority"
        ) ||
        "medium";


    projectData.startDate =
        getInputValue(
            "editProjectStartDate"
        );


    projectData.targetDate =
        getInputValue(
            "editProjectTargetDate"
        );


    projectData.tags =
        getInputValue(
            "editProjectTags"
        )
            .split(",")
            .map(
                tag =>
                    tag.trim()
            )
            .filter(
                Boolean
            );


    renderEverything();


    try {

        await saveProjectData();

        closeModal(
            getElement(
                "projectDetailsModal"
            )
        );


        showToast(
            "Project updated."
        );

    }

    catch (error) {

        projectData =
            previous;


        renderEverything();


        showToast(
            error.message ||
            "Unable to update Project."
        );

    }


}

/* =========================================================
PROGRESS
========================================================= */

function setupProgress() {


    $("#editProgress")
        ?.addEventListener(
            "click",
            openProgressModal
        );


    $("#projectProgressTrack")
        ?.addEventListener(
            "click",
            openProgressModal
        );


    $("#saveProgress")
        ?.addEventListener(
            "click",
            saveProgress
        );


    $("#cancelProgress")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "progressModal"
                    )
                )
        );


    $("#closeProgressModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "progressModal"
                    )
                )
        );


}

function openProgressModal() {


    setInputValue(
        "editProjectProgress",
        projectData.progress
    );


    setInputValue(
        "editProgressStatus",
        projectData.progressStatus
    );


    openModal(
        getElement(
            "progressModal"
        )
    );


}

async function saveProgress() {


    const previous =
    {

        progress:
            projectData.progress,

        progressStatus:
            projectData.progressStatus

    };


    projectData.progress =
        clampPercentage(
            getInputValue(
                "editProjectProgress"
            )
        );


    projectData.progressStatus =
        getInputValue(
            "editProgressStatus"
        ) ||
        "on-track";


    renderOverview();


    try {

        await saveProjectData();

        closeModal(
            getElement(
                "progressModal"
            )
        );


        showToast(
            "Progress updated."
        );

    }

    catch (error) {

        projectData.progress =
            previous.progress;


        projectData.progressStatus =
            previous.progressStatus;


        renderOverview();


        showToast(
            error.message ||
            "Unable to update progress."
        );

    }


}

/* =========================================================
CURRENT WORK
========================================================= */

function setupCurrentWork() {


    $("#editCurrentWork")
        ?.addEventListener(
            "click",
            openCurrentWorkModal
        );


    $("#saveCurrentWork")
        ?.addEventListener(
            "click",
            saveCurrentWork
        );


    $("#cancelCurrentWork")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "currentWorkModal"
                    )
                )
        );


    $("#closeCurrentWorkModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "currentWorkModal"
                    )
                )
        );


}

function openCurrentWorkModal() {


    setInputValue(
        "editCurrentWorkTitle",
        projectData.currentWork?.title
    );


    setInputValue(
        "editCurrentWorkDescription",
        projectData.currentWork?.description
    );


    openModal(
        getElement(
            "currentWorkModal"
        )
    );


}

async function saveCurrentWork() {


    const previous =
        clone(
            projectData.currentWork
        );


    projectData.currentWork =
    {

        title:
            getInputValue(
                "editCurrentWorkTitle"
            ),

        description:
            getInputValue(
                "editCurrentWorkDescription"
            )

    };


    renderOverview();


    try {

        await saveProjectData();

        closeModal(
            getElement(
                "currentWorkModal"
            )
        );


        showToast(
            "Current work updated."
        );

    }

    catch (error) {

        projectData.currentWork =
            previous;


        renderOverview();


        showToast(
            error.message ||
            "Unable to update current work."
        );

    }


}

/* =========================================================
NEXT ACTION
========================================================= */

function setupNextAction() {


    $("#editNextAction")
        ?.addEventListener(
            "click",
            openNextActionModal
        );


    $("#saveNextAction")
        ?.addEventListener(
            "click",
            saveNextAction
        );


    $("#cancelNextAction")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "nextActionModal"
                    )
                )
        );


    $("#closeNextActionModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "nextActionModal"
                    )
                )
        );


}

function openNextActionModal() {


    setInputValue(
        "editNextActionTitle",
        projectData.nextAction?.title
    );


    setInputValue(
        "editNextActionDue",
        normalizeDateInput(
            projectData.nextAction?.dueDate
        )
    );


    openModal(
        getElement(
            "nextActionModal"
        )
    );


}

async function saveNextAction() {


    const previous =
        clone(
            projectData.nextAction
        );


    projectData.nextAction =
    {

        title:
            getInputValue(
                "editNextActionTitle"
            ),

        dueDate:
            getInputValue(
                "editNextActionDue"
            )

    };


    renderOverview();


    try {

        await saveProjectData();

        closeModal(
            getElement(
                "nextActionModal"
            )
        );


        showToast(
            "Next action updated."
        );

    }

    catch (error) {

        projectData.nextAction =
            previous;


        renderOverview();


        showToast(
            error.message ||
            "Unable to update next action."
        );

    }


}

/* =========================================================
DESCRIPTION / OBJECTIVE
========================================================= */

function setupDescription() {


    $("#editDescription")
        ?.addEventListener(
            "click",
            openDescriptionModal
        );


    $("#saveDescription")
        ?.addEventListener(
            "click",
            saveDescription
        );


    $("#cancelDescription")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "descriptionModal"
                    )
                )
        );


    $("#closeDescriptionModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "descriptionModal"
                    )
                )
        );


}

function openDescriptionModal() {


    setInputValue(
        "editDescriptionContent",
        projectData.objective
    );


    openModal(
        getElement(
            "descriptionModal"
        )
    );


}

async function saveDescription() {


    const previous =
        projectData.objective;


    projectData.objective =
        getInputValue(
            "editDescriptionContent"
        );


    renderOverview();


    try {

        await saveProjectData();

        closeModal(
            getElement(
                "descriptionModal"
            )
        );


        showToast(
            "Project objective updated."
        );

    }

    catch (error) {

        projectData.objective =
            previous;


        renderOverview();


        showToast(
            error.message ||
            "Unable to update objective."
        );

    }


}

/* =========================================================
TASKS
========================================================= */

function setupTasks() {


    $("#addTask")
        ?.addEventListener(
            "click",
            () =>
                openTaskModal()
        );


    $("#saveTask")
        ?.addEventListener(
            "click",
            saveTask
        );


    $("#cancelTask")
        ?.addEventListener(
            "click",
            closeTaskModal
        );


    $("#closeTaskModal")
        ?.addEventListener(
            "click",
            closeTaskModal
        );


    $("#closeTaskActionModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "taskActionModal"
                    )
                )
        );


    $("#editSelectedTask")
        ?.addEventListener(
            "click",
            () => {

                const task =
                    findById(
                        projectData.tasks,
                        selectedTaskId
                    );


                closeModal(
                    getElement(
                        "taskActionModal"
                    )
                );


                if (task) {

                    openTaskModal(
                        task
                    );

                }

            }
        );


    $("#moveTaskToTodo")
        ?.addEventListener(
            "click",
            () =>
                changeSelectedTaskStatus(
                    "todo"
                )
        );


    $("#moveTaskToProgress")
        ?.addEventListener(
            "click",
            () =>
                changeSelectedTaskStatus(
                    "progress"
                )
        );


    $("#moveTaskToDone")
        ?.addEventListener(
            "click",
            () =>
                changeSelectedTaskStatus(
                    "done"
                )
        );


    $("#deleteSelectedTask")
        ?.addEventListener(
            "click",
            () => {

                closeModal(
                    getElement(
                        "taskActionModal"
                    )
                );


                askConfirm(

                    "Delete Task",

                    "Are you sure you want to delete this task?",

                    async () => {

                        const previous =
                            clone(
                                projectData.tasks
                            );


                        projectData.tasks =
                            projectData.tasks.filter(
                                task =>
                                    String(task.id) !==
                                    String(
                                        selectedTaskId
                                    )
                            );


                        renderTasks();


                        try {

                            await saveProjectData();

                            showToast(
                                "Task deleted."
                            );

                        }

                        catch (error) {

                            projectData.tasks =
                                previous;


                            renderTasks();


                            showToast(
                                error.message ||
                                "Unable to delete task."
                            );

                        }

                    }

                );

            }
        );


}

function openTaskModal(
    task = null
) {


    editingTaskId =
        task?.id ||
        null;


    setText(
        "taskModalHeading",

        task
            ? "Edit Project Task"
            : "Add Project Task"
    );


    setInputValue(
        "taskTitle",
        task?.title || ""
    );


    setInputValue(
        "taskPriority",
        task?.priority || "medium"
    );


    setInputValue(
        "taskDate",
        normalizeDateInput(
            task?.dueDate
        )
    );


    setInputValue(
        "taskStatus",
        task?.status || "todo"
    );


    setInputValue(
        "taskAssignee",
        task?.assignee || ""
    );


    setInputValue(
        "taskDescription",
        task?.description || ""
    );


    openModal(
        getElement(
            "taskModal"
        )
    );


}

function closeTaskModal() {


    editingTaskId =
        null;


    closeModal(
        getElement(
            "taskModal"
        )
    );


}

async function saveTask() {


    const title =
        getInputValue(
            "taskTitle"
        );


    if (!title) {

        showToast(
            "Task title is required."
        );

        return;

    }


    const previous =
        clone(
            projectData.tasks
        );


    const task =
    {

        id:
            editingTaskId ||
            generateID(
                "task"
            ),

        title,

        description:
            getInputValue(
                "taskDescription"
            ),

        priority:
            getInputValue(
                "taskPriority"
            ) ||
            "medium",

        dueDate:
            getInputValue(
                "taskDate"
            ),

        status:
            getInputValue(
                "taskStatus"
            ) ||
            "todo",

        assignee:
            getInputValue(
                "taskAssignee"
            ),

        updatedAt:
            new Date()
                .toISOString()

    };


    if (editingTaskId) {

        const index =
            projectData.tasks.findIndex(
                item =>
                    String(item.id) ===
                    String(
                        editingTaskId
                    )
            );


        if (index >= 0) {

            projectData.tasks[index] =
            {

                ...projectData.tasks[index],

                ...task

            };

        }

    }

    else {

        task.createdAt =
            new Date()
                .toISOString();


        projectData.tasks.unshift(
            task
        );

    }


    renderTasks();


    try {

        await saveProjectData();

        closeTaskModal();


        showToast(

            editingTaskId
                ? "Task updated."
                : "Task added."

        );

    }

    catch (error) {

        projectData.tasks =
            previous;


        renderTasks();


        showToast(
            error.message ||
            "Unable to save task."
        );

    }


}

async function changeSelectedTaskStatus(
    status
) {


    const task =
        findById(
            projectData.tasks,
            selectedTaskId
        );


    if (!task) {

        return;

    }


    const previous =
        task.status;


    task.status =
        status;


    renderTasks();


    try {

        await saveProjectData();

        closeModal(
            getElement(
                "taskActionModal"
            )
        );


        showToast(
            "Task status updated."
        );

    }

    catch (error) {

        task.status =
            previous;


        renderTasks();


        showToast(
            error.message ||
            "Unable to update task status."
        );

    }


}

function renderTasks() {


    const containers =
    {

        todo:
            getElement(
                "todoTasks"
            ),

        progress:
            getElement(
                "progressTasks"
            ),

        done:
            getElement(
                "doneTasks"
            )

    };


    Object.values(
        containers
    ).forEach(
        container => {

            if (container) {

                container.innerHTML =
                    "";

            }

        }
    );


    projectData.tasks
        .forEach(
            task => {

                const status =
                    [

                        "todo",
                        "progress",
                        "done"

                    ].includes(
                        task.status
                    )

                        ? task.status

                        : "todo";


                const container =
                    containers[
                    status
                    ];


                if (!container) {

                    return;

                }


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    `task-card ${status === "done"
                        ? "completed"
                        : ""
                    }`;


                card.dataset.id =
                    task.id;


                card.dataset.status =
                    status;


                const top =
                    document.createElement(
                        "div"
                    );


                top.className =
                    "task-top";


                const priority =
                    document.createElement(
                        "span"
                    );


                priority.className =
                    `task-priority ${status === "done"
                        ? "done"
                        : task.priority
                    }`;


                priority.textContent =
                    status === "done"

                        ? "DONE"

                        : String(
                            task.priority ||
                            "medium"
                        )
                            .toUpperCase();


                const menu =
                    document.createElement(
                        "button"
                    );


                menu.type =
                    "button";


                menu.className =
                    "task-menu";


                menu.textContent =
                    "⋯";


                menu.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        selectedTaskId =
                            task.id;


                        openModal(
                            getElement(
                                "taskActionModal"
                            )
                        );

                    }
                );


                top.append(
                    priority,
                    menu
                );


                const title =
                    document.createElement(
                        "h3"
                    );


                title.textContent =
                    task.title ||
                    "Untitled Task";


                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    task.description ||
                    "No description added.";


                const footer =
                    document.createElement(
                        "div"
                    );


                footer.className =
                    "task-footer";


                const date =
                    document.createElement(
                        "span"
                    );


                date.textContent =
                    task.dueDate

                        ? formatDate(
                            task.dueDate
                        )

                        : "No date";


                const assignee =
                    document.createElement(
                        "span"
                    );


                assignee.textContent =
                    task.assignee ||
                    "-";


                footer.append(
                    date,
                    assignee
                );


                card.append(
                    top,
                    title,
                    description,
                    footer
                );


                container.appendChild(
                    card
                );

            }
        );


    updateTaskCounts();


}

function updateTaskCounts() {


    const tasks =
        projectData.tasks || [];


    const todo =
        tasks.filter(
            task =>
                task.status ===
                "todo"
        ).length;


    const progress =
        tasks.filter(
            task =>
                task.status ===
                "progress"
        ).length;


    const done =
        tasks.filter(
            task =>
                task.status ===
                "done"
        ).length;


    setText(
        "todoCount",
        todo
    );


    setText(
        "progressTaskCount",
        progress
    );


    setText(
        "doneTaskCount",
        done
    );


}

/* =========================================================
MILESTONES
========================================================= */

function setupMilestones() {


    $("#addMilestone")
        ?.addEventListener(
            "click",
            () =>
                openMilestoneModal()
        );


    $("#saveMilestone")
        ?.addEventListener(
            "click",
            saveMilestone
        );


    $("#cancelMilestone")
        ?.addEventListener(
            "click",
            closeMilestoneModal
        );


    $("#closeMilestoneModal")
        ?.addEventListener(
            "click",
            closeMilestoneModal
        );


}

function openMilestoneModal(
    milestone = null
) {


    editingMilestoneId =
        milestone?.id ||
        null;


    setText(
        "milestoneModalHeading",

        milestone
            ? "Edit Milestone"
            : "Add Milestone"
    );


    setInputValue(
        "milestoneTitle",
        milestone?.title || ""
    );


    setInputValue(
        "milestoneDescription",
        milestone?.description || ""
    );


    setInputValue(
        "milestoneProgress",
        milestone?.progress ?? 0
    );


    setInputValue(
        "milestoneStatus",
        milestone?.status || "planned"
    );


    setInputValue(
        "milestoneDate",
        normalizeDateInput(
            milestone?.date
        )
    );


    openModal(
        getElement(
            "milestoneModal"
        )
    );


}

function closeMilestoneModal() {


    editingMilestoneId =
        null;


    closeModal(
        getElement(
            "milestoneModal"
        )
    );


}

async function saveMilestone() {


    const title =
        getInputValue(
            "milestoneTitle"
        );


    if (!title) {

        showToast(
            "Milestone title is required."
        );

        return;

    }


    const previous =
        clone(
            projectData.milestones
        );


    const milestone =
    {

        id:
            editingMilestoneId ||
            generateID(
                "milestone"
            ),

        title,

        description:
            getInputValue(
                "milestoneDescription"
            ),

        progress:
            clampPercentage(
                getInputValue(
                    "milestoneProgress"
                )
            ),

        status:
            getInputValue(
                "milestoneStatus"
            ) ||
            "planned",

        date:
            getInputValue(
                "milestoneDate"
            )

    };


    if (editingMilestoneId) {

        const index =
            projectData.milestones.findIndex(
                item =>
                    String(item.id) ===
                    String(
                        editingMilestoneId
                    )
            );


        if (index >= 0) {

            projectData.milestones[index] =
                milestone;

        }

    }

    else {

        projectData.milestones.push(
            milestone
        );

    }


    renderMilestones();


    try {

        await saveProjectData();

        closeMilestoneModal();

        showToast(
            "Milestone saved."
        );

    }

    catch (error) {

        projectData.milestones =
            previous;


        renderMilestones();


        showToast(
            error.message ||
            "Unable to save milestone."
        );

    }


}

function renderMilestones() {


    const container =
        getElement(
            "milestoneGrid"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !projectData.milestones.length
    ) {

        container.innerHTML =
            emptyState(
                "No milestones added yet."
            );

        return;

    }


    projectData.milestones
        .forEach(
            (
                milestone,
                index
            ) => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    `milestone-card ${milestone.status ||
                    "planned"
                    }`;


                card.addEventListener(
                    "click",
                    () =>
                        openMilestoneModal(
                            milestone
                        )
                );


                const top =
                    document.createElement(
                        "div"
                    );


                top.className =
                    "milestone-top";


                const label =
                    document.createElement(
                        "span"
                    );


                label.textContent =
                    `MILESTONE ${String(
                        index + 1
                    ).padStart(
                        2,
                        "0"
                    )
                    }`;


                const percentage =
                    document.createElement(
                        "strong"
                    );


                percentage.textContent =
                    `${clampPercentage(
                        milestone.progress
                    )}%`;


                top.append(
                    label,
                    percentage
                );


                const title =
                    document.createElement(
                        "h3"
                    );


                title.textContent =
                    milestone.title;


                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    milestone.description ||
                    "No description added.";


                const bar =
                    document.createElement(
                        "div"
                    );


                bar.className =
                    "milestone-bar";


                const barValue =
                    document.createElement(
                        "span"
                    );


                barValue.style.width =
                    `${clampPercentage(
                        milestone.progress
                    )}%`;


                bar.appendChild(
                    barValue
                );


                const footer =
                    document.createElement(
                        "div"
                    );


                footer.className =
                    "milestone-footer";


                const status =
                    document.createElement(
                        "span"
                    );


                status.textContent =
                    formatLabel(
                        milestone.status
                    );


                const date =
                    document.createElement(
                        "span"
                    );


                date.textContent =
                    milestone.date

                        ? formatDate(
                            milestone.date
                        )

                        : "No target";


                footer.append(
                    status,
                    date
                );


                card.append(
                    top,
                    title,
                    description,
                    bar,
                    footer
                );


                container.appendChild(
                    card
                );

            }
        );


}

/* =========================================================
TIMELINE
========================================================= */

function setupTimeline() {


    $("#addTimeline")
        ?.addEventListener(
            "click",
            () =>
                openTimelineModal()
        );


    $("#saveTimeline")
        ?.addEventListener(
            "click",
            saveTimeline
        );


    $("#cancelTimeline")
        ?.addEventListener(
            "click",
            closeTimelineModal
        );


    $("#closeTimelineModal")
        ?.addEventListener(
            "click",
            closeTimelineModal
        );


}

function openTimelineModal(
    item = null
) {


    editingTimelineId =
        item?.id ||
        null;


    setText(
        "timelineModalHeading",

        item
            ? "Edit Timeline Entry"
            : "Timeline Entry"
    );


    setInputValue(
        "timelineDate",
        normalizeDateInput(
            item?.date
        ) ||
        todayISO()
    );


    setInputValue(
        "timelineStatus",
        item?.status ||
        "planned"
    );


    setInputValue(
        "timelineTitle",
        item?.title ||
        ""
    );


    setInputValue(
        "timelineDescription",
        item?.description ||
        ""
    );


    openModal(
        getElement(
            "timelineModal"
        )
    );


}

function closeTimelineModal() {


    editingTimelineId =
        null;


    closeModal(
        getElement(
            "timelineModal"
        )
    );


}

async function saveTimeline() {


    const date =
        getInputValue(
            "timelineDate"
        );


    const title =
        getInputValue(
            "timelineTitle"
        );


    if (
        !date ||
        !title
    ) {

        showToast(
            "Date and title are required."
        );

        return;

    }


    const previous =
        clone(
            projectData.timeline
        );


    const item =
    {

        id:
            editingTimelineId ||
            generateID(
                "timeline"
            ),

        date,

        status:
            getInputValue(
                "timelineStatus"
            ) ||
            "planned",

        title,

        description:
            getInputValue(
                "timelineDescription"
            )

    };


    if (editingTimelineId) {

        const index =
            projectData.timeline.findIndex(
                entry =>
                    String(entry.id) ===
                    String(
                        editingTimelineId
                    )
            );


        if (index >= 0) {

            projectData.timeline[index] =
                item;

        }

    }

    else {

        projectData.timeline.push(
            item
        );

    }


    renderTimeline();


    try {

        await saveProjectData();

        closeTimelineModal();

        showToast(
            "Timeline saved."
        );

    }

    catch (error) {

        projectData.timeline =
            previous;


        renderTimeline();


        showToast(
            error.message ||
            "Unable to save timeline."
        );

    }


}

function renderTimeline() {


    const container =
        getElement(
            "projectTimelineList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !projectData.timeline.length
    ) {

        container.innerHTML =
            emptyState(
                "No timeline entries added yet."
            );

        return;

    }


    const items =
        [
            ...projectData.timeline
        ]
            .sort(
                (
                    a,
                    b
                ) =>
                    String(
                        a.date || ""
                    )
                        .localeCompare(
                            String(
                                b.date || ""
                            )
                        )
            );


    items.forEach(
        item => {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "timeline-item";


            const date =
                document.createElement(
                    "div"
                );


            date.className =
                "timeline-date";


            date.textContent =
                formatDate(
                    item.date
                );


            const point =
                document.createElement(
                    "div"
                );


            point.className =
                `timeline-point ${item.status ||
                "planned"
                }`;


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "timeline-card";


            const top =
                document.createElement(
                    "div"
                );


            top.className =
                "timeline-top";


            const status =
                document.createElement(
                    "span"
                );


            status.className =
                `timeline-status ${item.status ||
                "planned"
                }`;


            status.textContent =
                formatLabel(
                    item.status
                );


            const edit =
                document.createElement(
                    "button"
                );


            edit.type =
                "button";


            edit.className =
                "timeline-edit";


            edit.textContent =
                "✎";


            edit.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openTimelineModal(
                        item
                    );

                }
            );


            const remove =
                document.createElement(
                    "button"
                );


            remove.type =
                "button";


            remove.className =
                "timeline-delete";


            remove.textContent =
                "×";


            remove.title =
                "Delete timeline entry";


            remove.addEventListener(
                "click",
                async event => {

                    event.stopPropagation();


                    if (
                        !window.confirm(
                            "Delete this timeline entry?"
                        )
                    ) {
                        return;
                    }


                    const previous =
                        clone(
                            projectData.timeline
                        );


                    projectData.timeline =
                        projectData.timeline.filter(
                            entry =>
                                String(entry.id) !==
                                String(item.id)
                        );


                    renderTimeline();


                    try {

                        await saveProjectData();


                        showToast(
                            "Timeline entry deleted.",
                            "success"
                        );

                    }

                    catch (error) {

                        projectData.timeline =
                            previous;


                        renderTimeline();


                        showToast(
                            error.message ||
                            "Unable to delete timeline entry.",
                            "error"
                        );

                    }

                }
            );


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "timeline-actions";


            actions.append(
                edit,
                remove
            );


            top.append(
                status,
                actions
            );


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                item.title;


            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                item.description ||
                "No description added.";


            card.append(
                top,
                title,
                description
            );


            article.append(
                date,
                point,
                card
            );


            container.appendChild(
                article
            );

        }
    );


}

/* =========================================================
COLLABORATORS
========================================================= */

function setupCollaborators() {


    $("#addCollaborator")
        ?.addEventListener(
            "click",
            () => {

                setInputValue(
                    "collaboratorName",
                    ""
                );


                setInputValue(
                    "collaboratorRole",
                    ""
                );


                setInputValue(
                    "collaboratorInitials",
                    ""
                );


                openModal(
                    getElement(
                        "collaboratorModal"
                    )
                );

            }
        );


    $("#saveCollaborator")
        ?.addEventListener(
            "click",
            saveCollaborator
        );


    $("#cancelCollaborator")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "collaboratorModal"
                    )
                )
        );


    $("#closeCollaboratorModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "collaboratorModal"
                    )
                )
        );


}

async function saveCollaborator() {


    const name =
        getInputValue(
            "collaboratorName"
        );


    if (!name) {

        showToast(
            "Collaborator name is required."
        );

        return;

    }


    const previous =
        clone(
            projectData.collaborators
        );


    projectData.collaborators.push(
        {

            id:
                generateID(
                    "collaborator"
                ),

            name,

            role:
                getInputValue(
                    "collaboratorRole"
                ),

            initials:
                getInputValue(
                    "collaboratorInitials"
                ) ||
                getInitials(
                    name
                )

        }
    );


    renderCollaborators();


    try {

        await saveProjectData();

        closeModal(
            getElement(
                "collaboratorModal"
            )
        );


        showToast(
            "Collaborator added."
        );

    }

    catch (error) {

        projectData.collaborators =
            previous;


        renderCollaborators();


        showToast(
            error.message ||
            "Unable to add collaborator."
        );

    }


}

function renderCollaborators() {


    const container =
        getElement(
            "collaboratorGrid"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !projectData.collaborators.length
    ) {

        container.innerHTML =
            emptyState(
                "No collaborators added yet."
            );

        return;

    }


    projectData.collaborators
        .forEach(
            member => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "collaborator-card";


                const avatar =
                    document.createElement(
                        "div"
                    );


                avatar.className =
                    "member-avatar";


                avatar.textContent =
                    member.initials ||
                    getInitials(
                        member.name
                    );


                const info =
                    document.createElement(
                        "div"
                    );


                const name =
                    document.createElement(
                        "strong"
                    );


                name.textContent =
                    member.name;


                const role =
                    document.createElement(
                        "span"
                    );


                role.textContent =
                    member.role ||
                    "Team Member";


                info.append(
                    name,
                    role
                );


                card.append(
                    avatar,
                    info
                );


                container.appendChild(
                    card
                );

            }
        );


}

/* =========================================================
TESTING
========================================================= */

function setupTests() {


    $("#addTest")
        ?.addEventListener(
            "click",
            () => {

                setInputValue(
                    "testTitle",
                    ""
                );


                setInputValue(
                    "testResult",
                    "pending"
                );


                setInputValue(
                    "testDate",
                    todayISO()
                );


                setInputValue(
                    "testDescription",
                    ""
                );


                openModal(
                    getElement(
                        "testModal"
                    )
                );

            }
        );


    $("#saveTest")
        ?.addEventListener(
            "click",
            saveTest
        );


    $("#cancelTest")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "testModal"
                    )
                )
        );


    $("#closeTestModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "testModal"
                    )
                )
        );


}

async function saveTest() {


    const title =
        getInputValue(
            "testTitle"
        );


    if (!title) {

        showToast(
            "Test name is required."
        );

        return;

    }


    const previous =
        clone(
            projectData.tests
        );


    projectData.tests.unshift(
        {

            id:
                generateID(
                    "test"
                ),

            title,

            result:
                getInputValue(
                    "testResult"
                ) ||
                "pending",

            date:
                getInputValue(
                    "testDate"
                ),

            description:
                getInputValue(
                    "testDescription"
                )

        }
    );


    renderTests();


    try {

        await saveProjectData();

        closeModal(
            getElement(
                "testModal"
            )
        );


        showToast(
            "Test added."
        );

    }

    catch (error) {

        projectData.tests =
            previous;


        renderTests();


        showToast(
            error.message ||
            "Unable to save test."
        );

    }


}

function renderTests() {


    const tests =
        projectData.tests || [];


    const total =
        tests.length;


    const passed =
        tests.filter(
            test =>
                test.result ===
                "passed"
        ).length;


    const failed =
        tests.filter(
            test =>
                test.result ===
                "failed"
        ).length;


    const pending =
        tests.filter(
            test =>
                test.result ===
                "pending"
        ).length;


    setText(
        "totalTests",
        total
    );


    setText(
        "passedTests",
        passed
    );


    setText(
        "failedTests",
        failed
    );


    setText(
        "pendingTests",
        pending
    );


    const percentage =
        total

            ? Math.round(
                (
                    passed /
                    total
                ) * 100
            )

            : 0;


    setText(
        "passedTestPercentage",
        `${percentage}%`
    );


    const container =
        getElement(
            "testList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (!tests.length) {

        container.innerHTML =
            emptyState(
                "No tests recorded yet."
            );

        return;

    }


    tests.forEach(
        test => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "test-item";


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                test.title;


            const result =
                document.createElement(
                    "span"
                );


            result.textContent =
                formatLabel(
                    test.result
                );


            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                test.description ||
                "No observation added.";


            item.append(
                title,
                result,
                description
            );


            container.appendChild(
                item
            );

        }
    );


}

/* =========================================================
VERSION HISTORY
========================================================= */

function setupVersions() {


    $("#addVersion")
        ?.addEventListener(
            "click",
            () => {

                setInputValue(
                    "versionNumber",
                    ""
                );


                setInputValue(
                    "versionDate",
                    todayISO()
                );


                setInputValue(
                    "versionTitle",
                    ""
                );


                setInputValue(
                    "versionDescription",
                    ""
                );


                const current =
                    getElement(
                        "versionCurrent"
                    );


                if (current) {

                    current.checked =
                        false;

                }


                openModal(
                    getElement(
                        "versionModal"
                    )
                );

            }
        );


    $("#saveVersion")
        ?.addEventListener(
            "click",
            saveVersion
        );


    $("#cancelVersion")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "versionModal"
                    )
                )
        );


    $("#closeVersionModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "versionModal"
                    )
                )
        );


}

async function saveVersion() {


    const number =
        getInputValue(
            "versionNumber"
        );


    const title =
        getInputValue(
            "versionTitle"
        );


    if (
        !number ||
        !title
    ) {

        showToast(
            "Version number and title are required."
        );

        return;

    }


    const previous =
        clone(
            projectData.versions
        );


    const current =
        getElement(
            "versionCurrent"
        )?.checked ||
        false;


    if (current) {

        projectData.versions =
            projectData.versions.map(
                version =>
                ({

                    ...version,

                    current:
                        false

                })
            );

    }


    projectData.versions.unshift(
        {

            id:
                generateID(
                    "version"
                ),

            number,

            title,

            description:
                getInputValue(
                    "versionDescription"
                ),

            date:
                getInputValue(
                    "versionDate"
                ),

            current

        }
    );


    renderVersions();


    try {

        await saveProjectData();

        closeModal(
            getElement(
                "versionModal"
            )
        );


        showToast(
            "Version added."
        );

    }

    catch (error) {

        projectData.versions =
            previous;


        renderVersions();


        showToast(
            error.message ||
            "Unable to save version."
        );

    }


}

function renderVersions() {


    const container =
        getElement(
            "versionGrid"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !projectData.versions.length
    ) {

        container.innerHTML =
            emptyState(
                "No version history added yet."
            );

        return;

    }


    projectData.versions
        .forEach(
            version => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    `version-card ${version.current
                        ? "current"
                        : ""
                    }`;


                const number =
                    document.createElement(
                        "div"
                    );


                number.className =
                    "version-number";


                number.textContent =
                    version.number;


                const info =
                    document.createElement(
                        "div"
                    );


                info.className =
                    "version-info";


                const top =
                    document.createElement(
                        "div"
                    );


                top.className =
                    "version-top";


                const title =
                    document.createElement(
                        "strong"
                    );


                title.textContent =
                    version.title;


                const date =
                    document.createElement(
                        "span"
                    );


                date.textContent =
                    formatDate(
                        version.date
                    );


                top.append(
                    title,
                    date
                );


                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    version.description ||
                    "No change description added.";


                info.append(
                    top,
                    description
                );


                card.append(
                    number,
                    info
                );


                container.appendChild(
                    card
                );

            }
        );


}

/* =========================================================
ISSUES
========================================================= */

function setupIssues() {


    $("#addIssue")
        ?.addEventListener(
            "click",
            () => {

                setInputValue(
                    "issueTitle",
                    ""
                );


                setInputValue(
                    "issueDescription",
                    ""
                );


                openModal(
                    getElement(
                        "issueModal"
                    )
                );

            }
        );


    $("#saveIssue")
        ?.addEventListener(
            "click",
            saveIssue
        );


    $("#cancelIssue")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "issueModal"
                    )
                )
        );


    $("#closeIssueModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "issueModal"
                    )
                )
        );


}

async function saveIssue() {


    const title =
        getInputValue(
            "issueTitle"
        );


    if (!title) {

        showToast(
            "Issue title is required."
        );

        return;

    }


    const previous =
        clone(
            projectData.issues
        );


    projectData.issues.unshift(
        {

            id:
                generateID(
                    "issue"
                ),

            title,

            description:
                getInputValue(
                    "issueDescription"
                ),

            createdAt:
                new Date()
                    .toISOString()

        }
    );


    renderIssues();


    try {

        await saveProjectData();

        closeModal(
            getElement(
                "issueModal"
            )
        );


        showToast(
            "Issue added."
        );

    }

    catch (error) {

        projectData.issues =
            previous;


        renderIssues();


        showToast(
            error.message ||
            "Unable to save issue."
        );

    }


}

function renderIssues() {


    const container =
        getElement(
            "issueList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !projectData.issues.length
    ) {

        container.innerHTML =
            emptyState(
                "No issues recorded."
            );

        return;

    }


    projectData.issues
        .forEach(
            issue => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "issue-item";


                const dot =
                    document.createElement(
                        "span"
                    );


                dot.className =
                    "issue-dot";


                const content =
                    document.createElement(
                        "div"
                    );


                const title =
                    document.createElement(
                        "strong"
                    );


                title.textContent =
                    issue.title;


                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    issue.description ||
                    "No description added.";


                content.append(
                    title,
                    description
                );


                item.append(
                    dot,
                    content
                );


                container.appendChild(
                    item
                );

            }
        );


}

/* =========================================================
DECISIONS
========================================================= */

function setupDecisions() {


    $("#addDecision")
        ?.addEventListener(
            "click",
            () => {

                setInputValue(
                    "decisionTitle",
                    ""
                );


                setInputValue(
                    "decisionDescription",
                    ""
                );


                openModal(
                    getElement(
                        "decisionModal"
                    )
                );

            }
        );


    $("#saveDecision")
        ?.addEventListener(
            "click",
            saveDecision
        );


    $("#cancelDecision")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "decisionModal"
                    )
                )
        );


    $("#closeDecisionModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "decisionModal"
                    )
                )
        );


}

async function saveDecision() {


    const title =
        getInputValue(
            "decisionTitle"
        );


    if (!title) {

        showToast(
            "Decision is required."
        );

        return;

    }


    const previous =
        clone(
            projectData.decisions
        );


    projectData.decisions.unshift(
        {

            id:
                generateID(
                    "decision"
                ),

            title,

            description:
                getInputValue(
                    "decisionDescription"
                ),

            createdAt:
                new Date()
                    .toISOString()

        }
    );


    renderDecisions();


    try {

        await saveProjectData();

        closeModal(
            getElement(
                "decisionModal"
            )
        );


        showToast(
            "Decision added."
        );

    }

    catch (error) {

        projectData.decisions =
            previous;


        renderDecisions();


        showToast(
            error.message ||
            "Unable to save decision."
        );

    }


}

function renderDecisions() {


    const container =
        getElement(
            "decisionList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !projectData.decisions.length
    ) {

        container.innerHTML =
            emptyState(
                "No decisions recorded."
            );

        return;

    }


    projectData.decisions
        .forEach(
            decision => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "decision-item";


                const title =
                    document.createElement(
                        "strong"
                    );


                title.textContent =
                    decision.title;


                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    decision.description ||
                    "No explanation added.";


                item.append(
                    title,
                    description
                );


                container.appendChild(
                    item
                );

            }
        );


}

/* =========================================================
FILES
========================================================= */

function setupFiles() {


    $("#uploadProjectFile")
        ?.addEventListener(
            "click",
            () =>
                getElement(
                    "projectFileInput"
                )?.click()
        );


    $("#projectUploadZone")
        ?.addEventListener(
            "click",
            () =>
                getElement(
                    "projectFileInput"
                )?.click()
        );


    $("#projectUploadZone")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();


                    getElement(
                        "projectFileInput"
                    )?.click();

                }

            }
        );


    $("#projectFileInput")
        ?.addEventListener(
            "change",
            async event => {

                const files =
                    Array.from(
                        event.target.files ||
                        []
                    );


                if (!files.length) {

                    return;

                }


                await uploadProjectFiles(
                    files
                );


                event.target.value =
                    "";

            }
        );


}

async function uploadProjectFiles(
    files
) {


    const previous =
        clone(
            projectData.attachments
        );


    try {

        for (
            const file of files
        ) {

            const uploaded =
                await uploadProjectFile(
                    file
                );


            projectData.attachments.unshift(
                {

                    id:
                        uploaded.id ||
                        generateID(
                            "file"
                        ),

                    name:
                        uploaded.name ||
                        file.name,

                    mimeType:
                        uploaded.mimeType ||
                        uploaded.type ||
                        file.type,

                    size:
                        uploaded.size ||
                        file.size,

                    url:
                        uploaded.url ||
                        uploaded.webViewLink ||
                        uploaded.webContentLink ||
                        "",

                    driveFileId:
                        uploaded.driveFileId ||
                        uploaded.file_id ||
                        uploaded.id ||
                        "",

                    createdAt:
                        new Date()
                            .toISOString()

                }
            );

        }


        renderAttachments();


        await saveProjectData();


        showToast(
            files.length === 1

                ? "File uploaded."

                : "Files uploaded."
        );

    }

    catch (error) {

        projectData.attachments =
            previous;


        renderAttachments();


        showToast(
            error.message ||
            "Unable to upload file."
        );

    }


}

async function uploadProjectFile(
    file
) {


    const session =
        await getSession();


    const formData =
        new FormData();


    formData.append(
        "work_id",
        currentWorkId
    );


    formData.append(
        "file",
        file
    );


    const response =
        await fetch(

            `${SUPABASE_FUNCTIONS_URL}/upload-rigid-file`,

            {

                method:
                    "POST",

                headers:
                {

                    "Authorization":
                        `Bearer ${session.access_token}`

                },

                body:
                    formData

            }

        );


    const result =
        await response.json();


    if (
        !response.ok ||
        !result.success
    ) {

        throw new Error(

            result.error ||
            "Unable to upload file."

        );

    }


    return (
        result.file ||
        result.data ||
        result
    );


}

function renderAttachments() {

    const container =
        getElement(
            "projectAttachmentGrid"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !Array.isArray(
            projectData.attachments
        ) ||
        !projectData.attachments.length
    ) {

        container.innerHTML =
            emptyState(
                "No files uploaded yet."
            );

        return;

    }


    projectData.attachments
        .forEach(
            attachment => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "attachment-card";


                /* =========================
                   FILE ICON
                ========================= */

                const extension =
                    document.createElement(
                        "div"
                    );


                extension.className =
                    "attachment-icon";


                extension.textContent =
                    getExtension(
                        attachment.name
                    );


                /* =========================
                   FILE INFORMATION
                ========================= */

                const info =
                    document.createElement(
                        "div"
                    );


                info.className =
                    "attachment-info";


                const name =
                    document.createElement(
                        "strong"
                    );


                name.textContent =
                    attachment.name ||
                    "Attachment";


                name.title =
                    attachment.name ||
                    "Attachment";


                const metadata =
                    document.createElement(
                        "span"
                    );


                const fileType =
                    attachment.mimeType ||
                    attachment.type ||
                    getExtension(
                        attachment.name
                    ) ||
                    "File";


                metadata.textContent =
                    `${fileType} · ${formatBytes(
                        attachment.size
                    )}`;


                const date =
                    document.createElement(
                        "small"
                    );


                date.textContent =
                    attachment.createdAt

                        ? `Uploaded ${formatDateTime(
                            attachment.createdAt
                        )}`

                        : "Uploaded file";


                info.append(
                    name,
                    metadata,
                    date
                );


                /* =========================
                   ACTIONS
                ========================= */

                const actions =
                    document.createElement(
                        "div"
                    );


                actions.className =
                    "attachment-actions";


                const open =
                    document.createElement(
                        "button"
                    );


                open.type =
                    "button";


                open.className =
                    "attachment-open";


                open.textContent =
                    "Open";


                open.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        const fileURL =
                            attachment.url ||
                            attachment.webViewLink ||
                            attachment.webContentLink;


                        if (!fileURL) {

                            showToast(
                                "File URL is unavailable.",
                                "error"
                            );

                            return;

                        }


                        window.open(
                            fileURL,
                            "_blank",
                            "noopener,noreferrer"
                        );

                    }
                );


                const remove =
                    document.createElement(
                        "button"
                    );


                remove.type =
                    "button";


                remove.className =
                    "attachment-remove";


                remove.innerHTML =
                    "&times;";


                remove.title =
                    "Delete file";


                remove.setAttribute(
                    "aria-label",
                    "Delete file"
                );


                remove.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        deleteAttachment(
                            attachment
                        );

                    }
                );


                actions.append(
                    open,
                    remove
                );


                /* =========================
                   CARD CLICK
                ========================= */

                card.addEventListener(
                    "click",
                    () => {

                        const fileURL =
                            attachment.url ||
                            attachment.webViewLink ||
                            attachment.webContentLink;


                        if (
                            fileURL
                        ) {

                            window.open(
                                fileURL,
                                "_blank",
                                "noopener,noreferrer"
                            );

                        }

                    }
                );


                card.append(
                    extension,
                    info,
                    actions
                );


                container.appendChild(
                    card
                );

            }
        );

}

async function deleteAttachment(
    attachment
) {


    askConfirm(

        "Delete File",

        `Delete "${attachment.name}"?`,

        async () => {

            const previous =
                clone(
                    projectData.attachments
                );


            projectData.attachments =
                projectData.attachments.filter(
                    item =>
                        String(item.id) !==
                        String(
                            attachment.id
                        )
                );


            renderAttachments();


            try {

                if (
                    attachment.driveFileId
                ) {

                    await deleteProjectFile(
                        attachment.driveFileId
                    );

                }


                await saveProjectData();


                showToast(
                    "File deleted."
                );

            }

            catch (error) {

                projectData.attachments =
                    previous;


                renderAttachments();


                showToast(
                    error.message ||
                    "Unable to delete file."
                );

            }

        }

    );


}

async function deleteProjectFile(
    fileId
) {

    const session =
        await getSession();


    if (
        !session ||
        !session.access_token
    ) {

        throw new Error(
            "Your session has expired. Please sign in again."
        );

    }


    if (!fileId) {

        throw new Error(
            "File ID is missing."
        );

    }


    const response =
        await fetch(
            `${SUPABASE_FUNCTIONS_URL}/delete-rigid-file`,
            {
                method: "POST",

                headers: {

                    "Authorization":
                        `Bearer ${session.access_token}`,

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        work_id:
                            currentWorkId,

                        drive_file_id:
                            fileId

                    })
            }
        );


    const responseText =
        await response.text();


    console.log(
        "delete-rigid-file status:",
        response.status
    );


    console.log(
        "delete-rigid-file response:",
        responseText
    );


    let result;


    try {

        result =
            JSON.parse(
                responseText
            );

    }

    catch {

        throw new Error(
            responseText ||
            "Invalid response from file deletion service."
        );

    }


    if (
        !response.ok ||
        !result.success
    ) {

        throw new Error(

            result?.error ||

            "Unable to delete file."

        );

    }


    return true;

}

/* =========================================================
DRAG AND DROP
========================================================= */

function setupDragAndDrop() {


    const zone =
        getElement(
            "projectUploadZone"
        );


    if (!zone) {

        return;

    }


    [
        "dragenter",
        "dragover"
    ].forEach(
        eventName => {

            zone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();

                    zone.classList.add(
                        "dragging"
                    );

                }
            );

        }
    );


    [
        "dragleave",
        "drop"
    ].forEach(
        eventName => {

            zone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();

                    zone.classList.remove(
                        "dragging"
                    );

                }
            );

        }
    );


    zone.addEventListener(
        "drop",
        async event => {

            const files =
                Array.from(
                    event.dataTransfer?.files ||
                    []
                );


            if (
                files.length
            ) {

                await uploadProjectFiles(
                    files
                );

            }

        }
    );


}

/* =========================================================
LINKS
========================================================= */

function setupLinks() {


    $("#addProjectLink")
        ?.addEventListener(
            "click",
            () => {

                setInputValue(
                    "projectLinkTitle",
                    ""
                );


                setInputValue(
                    "projectLinkURL",
                    ""
                );


                setInputValue(
                    "projectLinkDescription",
                    ""
                );


                openModal(
                    getElement(
                        "projectLinkModal"
                    )
                );

            }
        );


    $("#saveProjectLink")
        ?.addEventListener(
            "click",
            saveProjectLink
        );


    $("#cancelProjectLink")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "projectLinkModal"
                    )
                )
        );


    $("#closeProjectLinkModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "projectLinkModal"
                    )
                )
        );


}

async function saveProjectLink() {


    const title =
        getInputValue(
            "projectLinkTitle"
        );


    let url =
        getInputValue(
            "projectLinkURL"
        );


    if (
        !title ||
        !url
    ) {

        showToast(
            "Link title and URL are required."
        );

        return;

    }


    url =
        normalizeURL(
            url
        );


    const previous =
        clone(
            projectData.links
        );


    projectData.links.unshift(
        {

            id:
                generateID(
                    "link"
                ),

            title,

            url,

            description:
                getInputValue(
                    "projectLinkDescription"
                ),

            createdAt:
                new Date()
                    .toISOString()

        }
    );


    renderLinks();


    try {

        await saveProjectData();

        closeModal(
            getElement(
                "projectLinkModal"
            )
        );


        showToast(
            "Link added."
        );

    }

    catch (error) {

        projectData.links =
            previous;


        renderLinks();


        showToast(
            error.message ||
            "Unable to save link."
        );

    }


}

function renderLinks() {


    const container =
        getElement(
            "projectLinkList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !projectData.links.length
    ) {

        container.innerHTML =
            emptyState(
                "No project links added yet."
            );

        return;

    }


    projectData.links
        .forEach(
            link => {

                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    "project-link-item";


                const title =
                    document.createElement(
                        "strong"
                    );


                title.textContent =
                    link.title;


                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    link.description ||
                    "";


                const open =
                    document.createElement(
                        "a"
                    );


                open.href =
                    link.url;


                open.target =
                    "_blank";


                open.rel =
                    "noopener";


                open.textContent =
                    "Open →";


                const remove =
                    document.createElement(
                        "button"
                    );


                remove.type =
                    "button";


                remove.textContent =
                    "×";


                remove.addEventListener(
                    "click",
                    () => {

                        askConfirm(

                            "Delete Link",

                            `Delete "${link.title}"?`,

                            async () => {

                                const previous =
                                    clone(
                                        projectData.links
                                    );


                                projectData.links =
                                    projectData.links.filter(
                                        item =>
                                            String(item.id) !==
                                            String(link.id)
                                    );


                                renderLinks();


                                try {

                                    await saveProjectData();

                                    showToast(
                                        "Link deleted."
                                    );

                                }

                                catch (error) {

                                    projectData.links =
                                        previous;


                                    renderLinks();


                                    showToast(
                                        error.message ||
                                        "Unable to delete link."
                                    );

                                }

                            }

                        );

                    }
                );


                item.append(
                    title,
                    description,
                    open,
                    remove
                );


                container.appendChild(
                    item
                );

            }
        );


}

/* =========================================================
FUTURE WORK
========================================================= */

function setupFutureWork() {


    $("#addFutureWork")
        ?.addEventListener(
            "click",
            () => {

                setInputValue(
                    "futureWorkStage",
                    ""
                );


                setInputValue(
                    "futureWorkTitle",
                    ""
                );


                setInputValue(
                    "futureWorkDescription",
                    ""
                );


                openModal(
                    getElement(
                        "futureWorkModal"
                    )
                );

            }
        );


    $("#saveFutureWork")
        ?.addEventListener(
            "click",
            saveFutureWork
        );


    $("#cancelFutureWork")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "futureWorkModal"
                    )
                )
        );


    $("#closeFutureWorkModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    getElement(
                        "futureWorkModal"
                    )
                )
        );


}

async function saveFutureWork() {


    const title =
        getInputValue(
            "futureWorkTitle"
        );


    if (!title) {

        showToast(
            "Future work title is required."
        );

        return;

    }


    const previous =
        clone(
            projectData.futureWork
        );


    projectData.futureWork.push(
        {

            id:
                generateID(
                    "future"
                ),

            stage:
                getInputValue(
                    "futureWorkStage"
                ) ||
                "NEXT",

            title,

            description:
                getInputValue(
                    "futureWorkDescription"
                )

        }
    );


    renderFutureWork();


    try {

        await saveProjectData();

        closeModal(
            getElement(
                "futureWorkModal"
            )
        );


        showToast(
            "Future work added."
        );

    }

    catch (error) {

        projectData.futureWork =
            previous;


        renderFutureWork();


        showToast(
            error.message ||
            "Unable to save future work."
        );

    }


}

function renderFutureWork() {


    const container =
        getElement(
            "futureWorkGrid"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !projectData.futureWork.length
    ) {

        container.innerHTML =
            emptyState(
                "No future work added yet."
            );

        return;

    }


    projectData.futureWork
        .forEach(
            item => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "future-card";


                const stage =
                    document.createElement(
                        "span"
                    );


                stage.textContent =
                    item.stage ||
                    "NEXT";


                const title =
                    document.createElement(
                        "h3"
                    );


                title.textContent =
                    item.title;


                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    item.description ||
                    "No description added.";


                card.append(
                    stage,
                    title,
                    description
                );


                container.appendChild(
                    card
                );

            }
        );


}

/* =========================================================
OUTCOME
========================================================= */

function setupOutcome() {


    $("#saveOutcome")
        ?.addEventListener(
            "click",
            saveOutcome
        );


}

function renderOutcome() {


    setInputValue(
        "projectOutcome",
        projectData.outcome
    );


}

async function saveOutcome() {


    const previous =
        projectData.outcome;


    projectData.outcome =
        getInputValue(
            "projectOutcome"
        );


    try {

        await saveProjectData();

        showToast(
            "Project outcome saved."
        );

    }

    catch (error) {

        projectData.outcome =
            previous;


        renderOutcome();


        showToast(
            error.message ||
            "Unable to save outcome."
        );

    }


}

/* =========================================================
NAVIGATION
========================================================= */

function setupNavigation() {


    $$(".project-nav-item")
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    () => {

                        $$(".project-nav-item")
                            .forEach(
                                nav =>
                                    nav.classList.remove(
                                        "active"
                                    )
                            );


                        item.classList.add(
                            "active"
                        );


                        const section =
                            getElement(
                                item.dataset.section
                            );


                        section?.scrollIntoView(
                            {

                                behavior:
                                    "smooth",

                                block:
                                    "start"

                            }
                        );

                    }
                );

            }
        );


}

/* =========================================================
MODAL CONTROLS
========================================================= */

function setupModalControls() {


    $$(".project-modal")
        .forEach(
            modal => {

                modal.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            modal
                        ) {

                            closeModal(
                                modal
                            );

                        }

                    }
                );

            }
        );


    $("#cancelConfirm")
        ?.addEventListener(
            "click",
            () =>
                closeConfirm()
        );


    $("#closeConfirmModal")
        ?.addEventListener(
            "click",
            () =>
                closeConfirm()
        );


    $("#confirmAction")
        ?.addEventListener(
            "click",
            async () => {

                const callback =
                    confirmCallback;


                closeConfirm();


                if (callback) {

                    await callback();

                }

            }
        );


}

function openModal(
    modal
) {


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";


}

function closeModal(
    modal
) {


    if (!modal) {

        return;

    }


    modal.classList.add(
        "hidden"
    );


    const openModalExists =
        $$(".project-modal")
            .some(
                item =>
                    !item.classList.contains(
                        "hidden"
                    )
            );


    if (!openModalExists) {

        document.body.style.overflow =
            "";

    }


}

function askConfirm(
    title,
    message,
    callback
) {


    confirmCallback =
        callback;


    setText(
        "confirmModalTitle",
        title
    );


    setText(
        "confirmModalMessage",
        message
    );


    openModal(
        getElement(
            "confirmModal"
        )
    );


}

function closeConfirm() {


    confirmCallback =
        null;


    closeModal(
        getElement(
            "confirmModal"
        )
    );


}

/* =========================================================
CLOCK
========================================================= */

function updateClock() {


    const now =
        new Date();


    const date =
        getElement(
            "liveDate"
        );


    const clock =
        getElement(
            "liveClock"
        );


    if (date) {

        date.textContent =
            now
                .toLocaleDateString(
                    "en-GB",
                    {

                        day:
                            "2-digit",

                        month:
                            "short",

                        year:
                            "numeric"

                    }
                )
                .toUpperCase();

    }


    if (clock) {

        clock.textContent =
            now.toLocaleTimeString(
                "en-US",
                {

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit"

                }
            );

    }


}

/* =========================================================
LOADING
========================================================= */

function setLoading(
    loading
) {


    const element =
        getElement(
            "projectLoading"
        );


    if (!element) {

        return;

    }


    element.style.display =
        loading
            ? "block"
            : "none";


}

/* =========================================================
TOAST
========================================================= */

function showToast(
    message
) {


    const toast =
        getElement(
            "projectToast"
        );


    if (!toast) {

        return;

    }


    toast.textContent =
        message;


    toast.classList.remove(
        "hidden"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.add(
                    "hidden"
                );

            },

            2600
        );


}

/* =========================================================
UTILITY FUNCTIONS
========================================================= */

function generateID(
    prefix = "item"
) {


    if (
        window.crypto &&
        typeof crypto.randomUUID ===
        "function"
    ) {

        return `${prefix}-${crypto.randomUUID()}`;

    }


    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;


}

function clone(
    value
) {


    return JSON.parse(
        JSON.stringify(
            value
        )
    );


}

function findById(
    array,
    id
) {


    return (
        array || []
    ).find(
        item =>
            String(item.id) ===
            String(id)
    );


}

function clampPercentage(
    value
) {


    const number =
        Number(value);


    if (
        Number.isNaN(
            number
        )
    ) {

        return 0;

    }


    return Math.max(
        0,
        Math.min(
            100,
            number
        )
    );


}

function formatLabel(
    value
) {


    return String(
        value ||
        ""
    )
        .replace(
            /-/g,
            " "
        )
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );


}

function todayISO() {


    const date =
        new Date();


    const offset =
        date.getTimezoneOffset() *
        60000;


    return new Date(
        date.getTime() -
        offset
    )
        .toISOString()
        .slice(
            0,
            10
        );


}

function normalizeDateInput(
    value
) {


    if (!value) {

        return "";

    }


    const string =
        String(value);


    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(
                string
            )
    ) {

        return string;

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date
        .toISOString()
        .slice(
            0,
            10
        );


}

function formatDate(
    value
) {


    if (!value) {

        return "";

    }


    const normalized =
        normalizeDateInput(
            value
        );


    if (!normalized) {

        return String(
            value
        );

    }


    const date =
        new Date(
            `${normalized}T00:00:00`
        );


    return date
        .toLocaleDateString(
            "en-GB",
            {

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"

            }
        )
        .toUpperCase();


}

function formatDateTime(
    value
) {


    if (!value) {

        return "";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );

    }


    return date
        .toLocaleString(
            "en-GB",
            {

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        );


}

function getInitials(
    name
) {


    return String(
        name ||
        "?"
    )
        .split(
            /\s+/
        )
        .filter(
            Boolean
        )
        .slice(
            0,
            3
        )
        .map(
            word =>
                word[0]
                    .toUpperCase()
        )
        .join(
            ""
        );


}



function formatBytes(
    bytes
) {


    const value =
        Number(
            bytes
        );


    if (
        !value ||
        Number.isNaN(
            value
        )
    ) {

        return "Unknown size";

    }


    const units =
        [

            "B",

            "KB",

            "MB",

            "GB",

            "TB"

        ];


    const index =
        Math.floor(
            Math.log(
                value
            ) /
            Math.log(
                1024
            )
        );


    return `${(
        value /
        Math.pow(
            1024,
            index
        )
    )
        .toFixed(
            index === 0
                ? 0
                : 1
        )} ${units[index]
        }`;


}

function normalizeURL(
    value
) {


    const url =
        String(
            value ||
            ""
        ).trim();


    if (
        /^https?:\/\//i
            .test(
                url
            )
    ) {

        return url;

    }


    return `https://${url}`;


}

function emptyState(
    message
) {


    return `
    <div class="empty-state">
        ${escapeHTML(message)}
    </div>
`;


}

function escapeHTML(
    value
) {


    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            value ||
            ""
        );


    return div.innerHTML;

}