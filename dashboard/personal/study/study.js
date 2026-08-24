/* =========================================================
   RiGiD — STUDY PAGE
   study.js

   FRONTEND VERSION
   ---------------------------------------------------------
   Backend / Supabase can be connected later.

   Current data is stored in memory only.
========================================================= */


/* =========================================================
   01. STUDY DATA
========================================================= */

const studyData = {

    id: "study-001",

    topic: "Power Electronics Fundamentals",

    introduction:
        "Understanding the fundamentals of power electronic converters, switching devices, control and energy conversion.",

    objective:
        "Understand how switching converters regulate and transfer electrical energy.",

    owner: "You",

    createdDate: "18 Aug 2026",

    updatedDate: "23 Aug 2026",

    status: "in-progress",

    confidence: 4,

    tags: [
        "POWER ELECTRONICS",
        "PMSG",
        "CONTROL"
    ],


    /* -----------------------------------------------------
       LEARNING
    ----------------------------------------------------- */

    learning: [

        "Power electronic converters control electrical energy by switching semiconductor devices at high frequency.",

        "Duty cycle affects the average output voltage, while inductors and capacitors are used to smooth the resulting waveform."

    ],


    /* -----------------------------------------------------
       KNOWLEDGE
    ----------------------------------------------------- */

    knowledge: [

        {
            id: "knowledge-1",

            text:
                "Switching frequency directly influences ripple and converter performance."
        },

        {
            id: "knowledge-2",

            text:
                "Duty cycle determines the average voltage in an ideal buck converter."
        },

        {
            id: "knowledge-3",

            text:
                "Component selection must consider voltage, current and ripple requirements."
        }

    ],


    /* -----------------------------------------------------
       CONCEPTS
    ----------------------------------------------------- */

    concepts: [

        {
            id: "concept-1",
            title: "Switching Devices",
            description:
                "MOSFETs, IGBTs and semiconductor switching.",
            status: "understood"
        },

        {
            id: "concept-2",
            title: "Duty Cycle",
            description:
                "Relationship between switching time and average output.",
            status: "understood"
        },

        {
            id: "concept-3",
            title: "Inductor Ripple",
            description:
                "Current ripple and inductor selection.",
            status: "reviewing"
        },

        {
            id: "concept-4",
            title: "Converter Efficiency",
            description:
                "Losses, switching behaviour and efficiency.",
            status: "learning"
        }

    ],


    /* -----------------------------------------------------
       PROBLEMS
    ----------------------------------------------------- */

    problems: [

        {
            id: "problem-1",

            title:
                "How does discontinuous conduction affect the converter?",

            description:
                "Need to understand the boundary between continuous and discontinuous conduction modes.",

            status: "open"
        },

        {
            id: "problem-2",

            title:
                "Why is a gate driver required?",

            description:
                "Need to understand the voltage and current requirements for reliable MOSFET switching.",

            status: "resolved"
        }

    ],


    /* -----------------------------------------------------
       RESOURCES
    ----------------------------------------------------- */

    resources: [

        {
            id: "resource-1",

            title:
                "Power Electronics Textbook",

            description:
                "Reference material used for converter fundamentals.",

            type:
                "BOOK",

            url:
                null
        },

        {
            id: "resource-2",

            title:
                "MATLAB Documentation",

            description:
                "Reference material for simulation concepts.",

            type:
                "WEBSITE",

            url:
                "https://www.mathworks.com/help/matlab/"
        }

    ],


    /* -----------------------------------------------------
       TIMELINE
    ----------------------------------------------------- */

    timeline: [

        {
            id: "timeline-1",

            date: "2026-08-18",

            title:
                "Introduction to Power Converters",

            description:
                "Study basic converter topology, switching and energy transfer.",

            duration:
                "1h 20m",

            status:
                "completed",

            priority:
                "normal"
        },

        {
            id: "timeline-2",

            date: "2026-08-23",

            title:
                "Study Switching Devices",

            description:
                "Understand MOSFET operation, gate driving and switching behaviour.",

            duration:
                "2 hours",

            status:
                "ongoing",

            priority:
                "high"
        },

        {
            id: "timeline-3",

            date: "2026-08-25",

            title:
                "Study Switching Losses",

            description:
                "Understand conduction losses and switching losses in practical converters.",

            duration:
                "2 hours",

            status:
                "planned",

            priority:
                "high"
        },

        {
            id: "timeline-4",

            date: "2026-08-27",

            title:
                "Solve Converter Problems",

            description:
                "Apply converter equations to numerical design problems.",

            duration:
                "2 hours",

            status:
                "planned",

            priority:
                "normal"
        },

        {
            id: "timeline-5",

            date: "2026-08-30",

            title:
                "Apply Knowledge to PMSG",

            description:
                "Connect the concepts learned here with the PMSG active rectifier project.",

            duration:
                "3 hours",

            status:
                "planned",

            priority:
                "high"
        }

    ],


    /* -----------------------------------------------------
       FUTURE WORK
    ----------------------------------------------------- */

    futureWork: [

        {
            id: "future-1",

            date: "2026-08-25",

            title:
                "Study switching losses",

            description:
                "Understand conduction and switching loss mechanisms.",

            priority:
                "high"
        },

        {
            id: "future-2",

            date: "2026-08-27",

            title:
                "Solve numerical problems",

            description:
                "Apply the theory to converter design problems.",

            priority:
                "normal"
        },

        {
            id: "future-3",

            date: "2026-08-30",

            title:
                "Apply knowledge to PMSG project",

            description:
                "Use the concepts learned here in the active rectifier.",

            priority:
                "high"
        }

    ],


    /* -----------------------------------------------------
       ATTACHMENTS
    ----------------------------------------------------- */

    attachments: [],


    /* -----------------------------------------------------
       RELATED WORK
    ----------------------------------------------------- */

    relatedWork: [

        {
            id: "related-1",

            type: "PAPER",

            title:
                "Review of Solar Energy Harvesting Circuits",

            description:
                "Knowledge from this study contributed to the literature review."
        },

        {
            id: "related-2",

            type: "PROJECT",

            title:
                "PMSG Active Rectifier",

            description:
                "Converter fundamentals are being applied to this project."
        }

    ],


    /* -----------------------------------------------------
       REFLECTION
    ----------------------------------------------------- */

    nextStudy:
        "Review discontinuous conduction mode and practical switching losses."

};


/* =========================================================
   02. DOM SHORTCUTS
========================================================= */

const $ = selector =>
    document.querySelector(selector);


const $$ = selector =>
    document.querySelectorAll(selector);


/* =========================================================
   03. INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeStudyPage
);


function initializeStudyPage() {

    loadStudyInformation();

    renderConfidence();

    renderLearning();

    renderKnowledge();

    renderConcepts();

    renderProblems();

    renderResources();

    renderTimeline();

    renderFutureWork();

    renderAttachments();

    renderRelatedWork();

    loadReflection();

    updateSummary();

    setupNavigation();

    setupConfidence();

    setupLearning();

    setupKnowledge();

    setupConcepts();

    setupProblems();

    setupResources();

    setupTimeline();

    setupFutureWork();

    setupUploads();

    setupLinks();

    setupRelatedWork();

    setupReflection();

    setupGeneralControls();

}


/* =========================================================
   04. STUDY INFORMATION
========================================================= */

function loadStudyInformation() {

    const topic =
        $("#studyTopic");

    const introduction =
        $("#studyIntroduction");

    const owner =
        $("#studyOwner");

    const created =
        $("#studyCreatedDate");

    const updated =
        $("#studyUpdatedDate");

    const status =
        $("#studyStatus");

    const objective =
        $("#learningObjective");


    if (topic)
        topic.textContent =
            studyData.topic;


    if (introduction)
        introduction.textContent =
            studyData.introduction;


    if (owner)
        owner.textContent =
            studyData.owner;


    if (created)
        created.textContent =
            studyData.createdDate;


    if (updated)
        updated.textContent =
            studyData.updatedDate;


    if (status)
        status.textContent =
            getStatusLabel(
                studyData.status
            );


    if (objective)
        objective.textContent =
            studyData.objective;


    loadTags();

}


/* =========================================================
   05. TAGS
========================================================= */

function loadTags() {

    const container =
        $("#studyTags");


    if (!container)
        return;


    container.innerHTML = "";


    studyData.tags.forEach(tag => {

        const element =
            document.createElement("span");

        element.textContent =
            tag;

        container.appendChild(
            element
        );

    });

}


/* =========================================================
   06. STATUS
========================================================= */

function getStatusLabel(status) {

    const labels = {

        "not-started":
            "○ NOT STARTED",

        "in-progress":
            "● IN PROGRESS",

        "completed":
            "● COMPLETED"

    };


    return labels[status]
        || "● IN PROGRESS";

}


/* =========================================================
   07. CONFIDENCE
========================================================= */

function renderConfidence() {

    const value =
        $("#confidenceValue");

    if (value) {

        value.textContent =
            `${studyData.confidence} / 5`;

    }


    $$(".confidence")
        .forEach(
            (bar, index) => {

                bar.classList.toggle(
                    "active",
                    index <
                    studyData.confidence
                );

            }
        );


    $$(".confidence-actions button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                Number(
                    button.dataset.confidence
                ) === studyData.confidence
            );

        });

}


/* =========================================================
   08. CONFIDENCE CONTROL
========================================================= */

function setupConfidence() {

    $$(".confidence-actions button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    studyData.confidence =
                        Number(
                            button.dataset.confidence
                        );

                    renderConfidence();

                    updateDate();

                    showToast(
                        "Confidence updated."
                    );

                }
            );

        });

}


/* =========================================================
   09. LEARNING
========================================================= */

function renderLearning() {

    const container =
        $("#learningContent");


    if (!container)
        return;


    container.innerHTML = "";


    studyData.learning.forEach(
        text => {

            const p =
                document.createElement("p");

            p.textContent =
                text;

            container.appendChild(
                p
            );

        }
    );

}


function setupLearning() {

    $("#editLearning")
        ?.addEventListener(
            "click",
            () => {

                const current =
                    studyData.learning.join(
                        "\n\n"
                    );


                const result =
                    window.prompt(
                        "Edit what you learned:",
                        current
                    );


                if (result === null)
                    return;


                studyData.learning =
                    result
                        .split(/\n\s*\n/)
                        .map(
                            item =>
                                item.trim()
                        )
                        .filter(Boolean);


                renderLearning();

                updateDate();

                showToast(
                    "Learning updated."
                );

            }
        );


    $("#editObjective")
        ?.addEventListener(
            "click",
            () => {

                const result =
                    window.prompt(
                        "Learning objective:",
                        studyData.objective
                    );


                if (result === null)
                    return;


                studyData.objective =
                    result.trim();


                $("#learningObjective")
                    .textContent =
                    studyData.objective;


                updateDate();

                showToast(
                    "Objective updated."
                );

            }
        );

}


/* =========================================================
   10. KNOWLEDGE
========================================================= */

function renderKnowledge() {

    const container =
        $("#knowledgeList");


    if (!container)
        return;


    container.innerHTML = "";


    studyData.knowledge.forEach(
        (item, index) => {

            const element =
                document.createElement("div");

            element.className =
                "knowledge-item";


            element.innerHTML = `

                <span class="knowledge-number">
                    ${String(index + 1).padStart(2, "0")}
                </span>

                <p>
                    ${escapeHTML(item.text)}
                </p>

            `;


            container.appendChild(
                element
            );

        }
    );

}


function setupKnowledge() {

    $("#addKnowledge")
        ?.addEventListener(
            "click",
            () => {

                const result =
                    window.prompt(
                        "What important thing did you learn?"
                    );


                if (!result)
                    return;


                studyData.knowledge.push({

                    id:
                        generateID("knowledge"),

                    text:
                        result.trim()

                });


                renderKnowledge();

                updateSummary();

                updateDate();

                showToast(
                    "Knowledge added."
                );

            }
        );

}


/* =========================================================
   11. CONCEPTS
========================================================= */

function renderConcepts() {

    const container =
        $("#conceptGrid");


    if (!container)
        return;


    container.innerHTML = "";


    studyData.concepts.forEach(
        (concept, index) => {

            const card =
                document.createElement("article");

            card.className =
                "concept-card";


            card.innerHTML = `

                <span class="concept-index">
                    ${String(index + 1).padStart(2, "0")}
                </span>

                <h3>
                    ${escapeHTML(concept.title)}
                </h3>

                <p>
                    ${escapeHTML(concept.description)}
                </p>

                <span class="concept-status ${escapeHTML(concept.status)}">
                    ${getConceptStatus(concept.status)}
                </span>

            `;


            container.appendChild(
                card
            );

        }
    );

}


function getConceptStatus(status) {

    const labels = {

        understood:
            "UNDERSTOOD",

        reviewing:
            "REVIEW",

        learning:
            "LEARNING"

    };


    return labels[status]
        || "LEARNING";

}


function setupConcepts() {

    $("#addConcept")
        ?.addEventListener(
            "click",
            () => {

                const title =
                    window.prompt(
                        "Concept name:"
                    );


                if (!title)
                    return;


                const description =
                    window.prompt(
                        "Describe the concept:"
                    );


                const status =
                    window.prompt(
                        "Status: UNDERSTOOD / REVIEWING / LEARNING",
                        "LEARNING"
                    );


                studyData.concepts.push({

                    id:
                        generateID("concept"),

                    title:
                        title.trim(),

                    description:
                        description?.trim()
                        || "Concept added.",

                    status:
                        normalizeConceptStatus(
                            status
                        )

                });


                renderConcepts();

                updateDate();

                showToast(
                    "Concept added."
                );

            }
        );

}


function normalizeConceptStatus(status) {

    status =
        String(status || "")
            .toLowerCase()
            .trim();


    if (
        status === "understood" ||
        status === "reviewing" ||
        status === "learning"
    ) {

        return status;

    }


    return "learning";

}


/* =========================================================
   12. PROBLEMS
========================================================= */

function renderProblems() {

    const container =
        $("#problemsList");


    if (!container)
        return;


    container.innerHTML = "";


    studyData.problems.forEach(
        problem => {

            const card =
                document.createElement("article");

            card.className =
                `problem-card ${problem.status}`;


            card.innerHTML = `

                <div class="problem-status-dot"></div>

                <div class="problem-content">

                    <div class="problem-header">

                        <h3>
                            ${escapeHTML(problem.title)}
                        </h3>

                        <span>
                            ${problem.status.toUpperCase()}
                        </span>

                    </div>

                    <p>
                        ${escapeHTML(problem.description)}
                    </p>

                </div>

                ${
                    problem.status === "open"
                    ?
                    `
                    <button
                        class="problem-action"
                        data-resolve-problem="${problem.id}"
                        type="button"
                    >
                        Resolve
                    </button>
                    `
                    :
                    ""
                }

            `;


            container.appendChild(
                card
            );

        }
    );


    $$("[data-resolve-problem]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    resolveProblem(
                        button.dataset.resolveProblem
                    );

                }
            );

        });

}


function setupProblems() {

    $("#addProblem")
        ?.addEventListener(
            "click",
            () => {

                openModal(
                    "#problemModal"
                );

                $("#problemTitleInput")
                    ?.focus();

            }
        );


    $("#closeProblemModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal("#problemModal")
        );


    $("#cancelProblem")
        ?.addEventListener(
            "click",
            () =>
                closeModal("#problemModal")
        );


    $("#saveProblem")
        ?.addEventListener(
            "click",
            saveProblem
        );

}


function saveProblem() {

    const title =
        $("#problemTitleInput")
            ?.value.trim();


    const description =
        $("#problemDescriptionInput")
            ?.value.trim();


    if (!title) {

        showToast(
            "Enter the problem."
        );

        return;

    }


    studyData.problems.unshift({

        id:
            generateID("problem"),

        title,

        description:
            description ||
            "Problem added for further study.",

        status:
            "open"

    });


    renderProblems();

    updateSummary();

    updateDate();

    clearInput("#problemTitleInput");

    clearInput("#problemDescriptionInput");

    closeModal("#problemModal");

    showToast(
        "Problem added."
    );

}


function resolveProblem(id) {

    const problem =
        studyData.problems.find(
            item =>
                item.id === id
        );


    if (!problem)
        return;


    problem.status =
        "resolved";


    renderProblems();

    updateSummary();

    updateDate();

    showToast(
        "Problem resolved."
    );

}


/* =========================================================
   13. RESOURCES
========================================================= */

function renderResources() {

    const container =
        $("#resourcesList");


    if (!container)
        return;


    container.innerHTML = "";


    studyData.resources.forEach(
        resource => {

            const card =
                document.createElement("article");

            card.className =
                "resource-card";


            card.innerHTML = `

                <div class="resource-icon">
                    ${escapeHTML(resource.type)}
                </div>

                <div class="resource-info">

                    <h3>
                        ${escapeHTML(resource.title)}
                    </h3>

                    <p>
                        ${escapeHTML(resource.description)}
                    </p>

                    <span>
                        ${escapeHTML(resource.type)}
                    </span>

                </div>

                ${
                    resource.url
                    ?
                    `
                    <a
                        class="resource-open"
                        href="${escapeAttribute(resource.url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open
                    </a>
                    `
                    :
                    `
                    <span class="resource-open">
                        Saved
                    </span>
                    `
                }

            `;


            container.appendChild(
                card
            );

        }
    );

}


function setupResources() {

    $("#addResource")
        ?.addEventListener(
            "click",
            () => {

                const title =
                    window.prompt(
                        "Resource title:"
                    );


                if (!title)
                    return;


                const description =
                    window.prompt(
                        "Description:"
                    );


                const type =
                    window.prompt(
                        "Type: BOOK / PAPER / WEBSITE / VIDEO / OTHER",
                        "WEBSITE"
                    );


                const url =
                    window.prompt(
                        "URL (optional):"
                    );


                studyData.resources.unshift({

                    id:
                        generateID("resource"),

                    title:
                        title.trim(),

                    description:
                        description?.trim()
                        || "Study resource.",

                    type:
                        String(
                            type || "OTHER"
                        )
                        .toUpperCase(),

                    url:
                        url
                            ? normalizeURL(url)
                            : null

                });


                renderResources();

                updateDate();

                showToast(
                    "Resource added."
                );

            }
        );

}


/* =========================================================
   14. TIMELINE
========================================================= */

function renderTimeline() {

    const container =
        $("#studyTimeline");


    if (!container)
        return;


    container.innerHTML = "";


    const sorted =
        [...studyData.timeline]
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );


    sorted.forEach(entry => {

        const item =
            document.createElement("article");

        item.className =
            "study-timeline-item";


        if (
            entry.status === "ongoing"
        ) {

            item.classList.add(
                "current"
            );

        }


        const formattedDate =
            formatTimelineDate(
                entry.date
            );


        item.innerHTML = `

            <div class="timeline-point"></div>

            <div class="timeline-date">
                ${formattedDate}
            </div>

            <div class="timeline-card">

                <div class="timeline-card-top">

                    <div>

                        <span class="timeline-status ${entry.status}">
                            ${entry.status.toUpperCase()}
                        </span>

                        ${
                            entry.priority === "high"
                            ?
                            `
                            <span class="timeline-priority">
                                HIGH
                            </span>
                            `
                            :
                            ""
                        }

                    </div>

                    <div class="timeline-actions">

                        <button
                            type="button"
                            data-edit-timeline="${entry.id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            data-delete-timeline="${entry.id}"
                        >
                            ×
                        </button>

                    </div>

                </div>

                <h3>
                    ${escapeHTML(entry.title)}
                </h3>

                <p>
                    ${escapeHTML(entry.description)}
                </p>

                <span>
                    ${escapeHTML(entry.duration || "Time not specified")}
                </span>

            </div>

        `;


        container.appendChild(
            item
        );

    });


    bindTimelineActions();

}


function bindTimelineActions() {

    $$("[data-edit-timeline]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editTimeline(
                        button.dataset.editTimeline
                    );

                }
            );

        });


    $$("[data-delete-timeline]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteTimeline(
                        button.dataset.deleteTimeline
                    );

                }
            );

        });

}


/* =========================================================
   15. TIMELINE SETUP
========================================================= */

let editingTimelineId = null;


function setupTimeline() {

    $("#addStudySession")
        ?.addEventListener(
            "click",
            () => {

                editingTimelineId = null;

                resetTimelineForm();

                $("#timelineDate").value =
                    getTodayISO();

                $("#timelineStatus").value =
                    "planned";

                openModal(
                    "#timelineModal"
                );

            }
        );


    $("#closeTimelineModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal("#timelineModal")
        );


    $("#cancelTimeline")
        ?.addEventListener(
            "click",
            () =>
                closeModal("#timelineModal")
        );


    $("#saveTimeline")
        ?.addEventListener(
            "click",
            saveTimeline
        );

}


function saveTimeline() {

    const date =
        $("#timelineDate")
            ?.value;


    const status =
        $("#timelineStatus")
            ?.value;


    const title =
        $("#timelineTitle")
            ?.value.trim();


    const description =
        $("#timelineDescription")
            ?.value.trim();


    const duration =
        $("#timelineDuration")
            ?.value.trim();


    const priority =
        $("#timelinePriority")
            ?.value;


    if (!date || !title) {

        showToast(
            "Date and title are required."
        );

        return;

    }


    if (editingTimelineId) {

        const entry =
            studyData.timeline.find(
                item =>
                    item.id ===
                    editingTimelineId
            );


        if (entry) {

            entry.date =
                date;

            entry.status =
                status;

            entry.title =
                title;

            entry.description =
                description ||
                "Timeline task.";

            entry.duration =
                duration ||
                "Not specified";

            entry.priority =
                priority;

        }

        showToast(
            "Timeline updated."
        );

    }

    else {

        studyData.timeline.push({

            id:
                generateID("timeline"),

            date,

            status,

            title,

            description:
                description ||
                "Timeline task.",

            duration:
                duration ||
                "Not specified",

            priority

        });


        showToast(
            "Timeline added."
        );

    }


    /*
     * Keep future work synchronized
     * with planned timeline entries.
     */

    syncFutureWorkFromTimeline();


    renderTimeline();

    renderFutureWork();

    updateDate();

    closeModal("#timelineModal");

    resetTimelineForm();

}


/* =========================================================
   16. EDIT TIMELINE
========================================================= */

function editTimeline(id) {

    const entry =
        studyData.timeline.find(
            item =>
                item.id === id
        );


    if (!entry)
        return;


    editingTimelineId =
        id;


    $("#timelineDate").value =
        entry.date;


    $("#timelineStatus").value =
        entry.status;


    $("#timelineTitle").value =
        entry.title;


    $("#timelineDescription").value =
        entry.description;


    $("#timelineDuration").value =
        entry.duration || "";


    $("#timelinePriority").value =
        entry.priority || "normal";


    openModal(
        "#timelineModal"
    );

}


/* =========================================================
   17. DELETE TIMELINE
========================================================= */

function deleteTimeline(id) {

    const confirmed =
        window.confirm(
            "Delete this timeline entry?"
        );


    if (!confirmed)
        return;


    studyData.timeline =
        studyData.timeline.filter(
            item =>
                item.id !== id
        );


    studyData.futureWork =
        studyData.futureWork.filter(
            item =>
                item.id !== id
        );


    renderTimeline();

    renderFutureWork();

    updateDate();

    showToast(
        "Timeline entry deleted."
    );

}


/* =========================================================
   18. TIMELINE FORM
========================================================= */

function resetTimelineForm() {

    clearInput("#timelineDate");

    clearInput("#timelineTitle");

    clearInput("#timelineDescription");

    clearInput("#timelineDuration");


    if ($("#timelineStatus"))
        $("#timelineStatus").value =
            "planned";


    if ($("#timelinePriority"))
        $("#timelinePriority").value =
            "normal";

}


function formatTimelineDate(dateString) {

    if (!dateString)
        return "";


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    return date
        .toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short"
            }
        )
        .toUpperCase();

}


/* =========================================================
   19. FUTURE WORK
========================================================= */

function renderFutureWork() {

    const container =
        $("#futureWorkList");


    if (!container)
        return;


    container.innerHTML = "";


    const future =
        [...studyData.futureWork]
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );


    future.forEach(item => {

        const element =
            document.createElement("div");

        element.className =
            "future-work-item";


        element.innerHTML = `

            <div class="future-date">
                ${formatTimelineDate(item.date)}
            </div>

            <div>

                <strong>
                    ${escapeHTML(item.title)}
                </strong>

                <p>
                    ${escapeHTML(item.description)}
                </p>

            </div>

        `;


        container.appendChild(
            element
        );

    });


    const count =
        document.querySelector(
            ".future-count"
        );


    if (count) {

        count.textContent =
            String(
                future.length
            ).padStart(2, "0");

    }

}


/* =========================================================
   20. FUTURE WORK SETUP
========================================================= */

function setupFutureWork() {

    $("#addFutureWork")
        ?.addEventListener(
            "click",
            () => {

                /*
                 * Future work is also represented as
                 * a planned timeline item.
                 */

                editingTimelineId = null;

                resetTimelineForm();

                $("#timelineDate").value =
                    getTodayISO();

                $("#timelineStatus").value =
                    "planned";

                openModal(
                    "#timelineModal"
                );

            }
        );

}


/* =========================================================
   21. SYNC FUTURE WORK
========================================================= */

function syncFutureWorkFromTimeline() {

    studyData.futureWork =
        studyData.timeline
            .filter(
                entry =>
                    entry.status ===
                    "planned"
            )
            .map(
                entry => ({

                    id:
                        entry.id,

                    date:
                        entry.date,

                    title:
                        entry.title,

                    description:
                        entry.description,

                    priority:
                        entry.priority

                })
            );

}


/* =========================================================
   22. UPLOADS
========================================================= */

function setupUploads() {

    const button =
        $("#uploadButton");

    const input =
        $("#studyFileInput");

    const zone =
        $("#studyUploadZone");


    button?.addEventListener(
        "click",
        () => {

            input?.click();

        }
    );


    zone?.addEventListener(
        "click",
        () => {

            input?.click();

        }
    );


    input?.addEventListener(
        "change",
        event => {

            handleFiles(
                event.target.files
            );

            event.target.value = "";

        }
    );


    zone?.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            zone.classList.add(
                "dragging"
            );

        }
    );


    zone?.addEventListener(
        "dragleave",
        () => {

            zone.classList.remove(
                "dragging"
            );

        }
    );


    zone?.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            zone.classList.remove(
                "dragging"
            );


            handleFiles(
                event.dataTransfer.files
            );

        }
    );

}


function handleFiles(files) {

    if (!files?.length)
        return;


    Array.from(files)
        .forEach(file => {

            const url =
                URL.createObjectURL(
                    file
                );


            studyData.attachments.unshift({

                id:
                    generateID("file"),

                type:
                    "file",

                name:
                    file.name,

                fileType:
                    getFileType(file),

                size:
                    formatFileSize(
                        file.size
                    ),

                date:
                    getTodayISO(),

                url,

                description:
                    ""

            });

        });


    renderAttachments();

    updateDate();

    showToast(
        `${files.length} file${files.length > 1 ? "s" : ""} added.`
    );

}


/* =========================================================
   23. ATTACHMENT RENDERING
========================================================= */

function renderAttachments() {

    const container =
        $("#studyUploadGrid");


    if (!container)
        return;


    container.innerHTML = "";


    if (
        studyData.attachments.length === 0
    ) {

        container.innerHTML = `

            <div
                style="
                    grid-column:1/-1;
                    padding:18px;
                    border:1px solid rgba(94,164,220,.12);
                    border-radius:8px;
                    color:#6f879c;
                    text-align:center;
                    font-size:8px;
                "
            >
                No files or links added yet.
            </div>

        `;

        return;

    }


    studyData.attachments.forEach(
        attachment => {

            if (
                attachment.type ===
                "link"
            ) {

                renderLinkAttachment(
                    container,
                    attachment
                );

            }

            else {

                renderFileAttachment(
                    container,
                    attachment
                );

            }

        }
    );

}


function renderFileAttachment(
    container,
    attachment
) {

    const card =
        document.createElement("article");

    card.className =
        "study-upload-card";


    const preview =
        createFilePreview(
            attachment
        );


    card.innerHTML = `

        <div class="upload-preview">
            ${preview}
        </div>

        <div class="upload-info">

            <span class="upload-name">
                ${escapeHTML(attachment.name)}
            </span>

            <div class="upload-meta">

                <span>
                    ${escapeHTML(attachment.fileType)}
                </span>

                <span>
                    ${escapeHTML(attachment.size)}
                </span>

            </div>

        </div>

        <div class="upload-actions">

            <button
                class="upload-action"
                data-open-attachment="${attachment.id}"
                type="button"
            >
                Open
            </button>

            <button
                class="upload-action"
                data-delete-attachment="${attachment.id}"
                type="button"
            >
                Delete
            </button>

        </div>

    `;


    container.appendChild(
        card
    );

}


/* =========================================================
   24. FILE PREVIEW
========================================================= */

function createFilePreview(
    attachment
) {

    if (
        attachment.fileType ===
        "IMAGE"
    ) {

        return `

            <img
                src="${escapeAttribute(attachment.url)}"
                alt="${escapeHTML(attachment.name)}"
            >

        `;

    }


    if (
        attachment.fileType ===
        "VIDEO"
    ) {

        return `

            <video
                src="${escapeAttribute(attachment.url)}"
                muted
            ></video>

        `;

    }


    if (
        attachment.fileType ===
        "PDF"
    ) {

        return "PDF";

    }


    if (
        attachment.fileType ===
        "DOCUMENT"
    ) {

        return "DOC";

    }


    if (
        attachment.fileType ===
        "SPREADSHEET"
    ) {

        return "XLS";

    }


    if (
        attachment.fileType ===
        "ARCHIVE"
    ) {

        return "ZIP";

    }


    return "FILE";

}


/* =========================================================
   25. FILE ACTIONS
========================================================= */

function setupAttachmentActions() {

    $$("[data-open-attachment]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openAttachment(
                        button.dataset.openAttachment
                    );

                }
            );

        });


    $$("[data-delete-attachment]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteAttachment(
                        button.dataset.deleteAttachment
                    );

                }
            );

        });

}


function openAttachment(id) {

    const attachment =
        studyData.attachments.find(
            item =>
                item.id === id
        );


    if (!attachment)
        return;


    if (attachment.url) {

        window.open(
            attachment.url,
            "_blank",
            "noopener,noreferrer"
        );

    }

}


function deleteAttachment(id) {

    const attachment =
        studyData.attachments.find(
            item =>
                item.id === id
        );


    if (!attachment)
        return;


    if (
        attachment.type === "file" &&
        attachment.url
    ) {

        URL.revokeObjectURL(
            attachment.url
        );

    }


    studyData.attachments =
        studyData.attachments.filter(
            item =>
                item.id !== id
        );


    renderAttachments();

    updateDate();

    showToast(
        "Attachment deleted."
    );

}


/* =========================================================
   26. LINK SYSTEM
========================================================= */

function setupLinks() {

    $("#addLinkButton")
        ?.addEventListener(
            "click",
            () => {

                clearInput(
                    "#linkTitleInput"
                );

                clearInput(
                    "#linkURLInput"
                );

                clearInput(
                    "#linkDescriptionInput"
                );

                openModal(
                    "#linkModal"
                );

                $("#linkTitleInput")
                    ?.focus();

            }
        );


    $("#closeLinkModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal("#linkModal")
        );


    $("#cancelLink")
        ?.addEventListener(
            "click",
            () =>
                closeModal("#linkModal")
        );


    $("#saveLink")
        ?.addEventListener(
            "click",
            saveLink
        );

}


function saveLink() {

    const title =
        $("#linkTitleInput")
            ?.value.trim();


    const url =
        $("#linkURLInput")
            ?.value.trim();


    const description =
        $("#linkDescriptionInput")
            ?.value.trim();


    if (!title || !url) {

        showToast(
            "Title and URL are required."
        );

        return;

    }


    studyData.attachments.unshift({

        id:
            generateID("link"),

        type:
            "link",

        name:
            title,

        url:
            normalizeURL(url),

        description:
            description ||
            "Study reference.",

        date:
            getTodayISO()

    });


    renderAttachments();

    updateDate();

    closeModal("#linkModal");


    showToast(
        "Link added."
    );

}


/* =========================================================
   27. LINK CARD
========================================================= */

function renderLinkAttachment(
    container,
    attachment
) {

    const card =
        document.createElement("article");

    card.className =
        "link-attachment";


    card.innerHTML = `

        <div>

            <div class="link-top">

                <div class="link-icon">
                    🔗
                </div>

                <span class="link-type">
                    WEB LINK
                </span>

            </div>

            <h3>
                ${escapeHTML(attachment.name)}
            </h3>

            <p class="link-description">
                ${escapeHTML(attachment.description)}
            </p>

            <div class="link-url">
                ${escapeHTML(attachment.url)}
            </div>

        </div>

        <div class="upload-actions">

            <button
                class="upload-action"
                data-open-attachment="${attachment.id}"
                type="button"
            >
                Open
            </button>

            <button
                class="upload-action"
                data-delete-attachment="${attachment.id}"
                type="button"
            >
                Delete
            </button>

        </div>

    `;


    container.appendChild(
        card
    );


    bindAttachmentButtons(
        card
    );

}


/* =========================================================
   28. ATTACHMENT BUTTON BINDING
========================================================= */

function bindAttachmentButtons(
    container
) {

    container
        .querySelectorAll(
            "[data-open-attachment]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openAttachment(
                        button.dataset.openAttachment
                    );

                }
            );

        });


    container
        .querySelectorAll(
            "[data-delete-attachment]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteAttachment(
                        button.dataset.deleteAttachment
                    );

                }
            );

        });

}


/* =========================================================
   29. RELATED WORK
========================================================= */

function renderRelatedWork() {

    const container =
        $("#relatedWorkGrid");


    if (!container)
        return;


    container.innerHTML = "";


    studyData.relatedWork.forEach(
        work => {

            const card =
                document.createElement("article");

            card.className =
                `related-work-card ${work.type.toLowerCase()}`;


            card.innerHTML = `

                <span>
                    ${escapeHTML(work.type)}
                </span>

                <h3>
                    ${escapeHTML(work.title)}
                </h3>

                <p>
                    ${escapeHTML(work.description)}
                </p>

                <button
                    type="button"
                    data-related-work="${work.id}"
                >
                    Open →
                </button>

            `;


            container.appendChild(
                card
            );

        }
    );


    $$("[data-related-work]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    /*
                     * Backend routing will later
                     * open the actual Study/Paper/
                     * Project/Simulation page.
                     */

                    showToast(
                        "Related-work navigation will be connected later."
                    );

                }
            );

        });

}


function setupRelatedWork() {

    $("#addRelatedWork")
        ?.addEventListener(
            "click",
            () => {

                const title =
                    window.prompt(
                        "Related work title:"
                    );


                if (!title)
                    return;


                const type =
                    window.prompt(
                        "Type: PAPER / PROJECT / SIMULATION / PROTOTYPE",
                        "PROJECT"
                    );


                const description =
                    window.prompt(
                        "Why is this related?"
                    );


                studyData.relatedWork.push({

                    id:
                        generateID("related"),

                    type:
                        String(
                            type || "PROJECT"
                        )
                        .trim()
                        .toUpperCase(),

                    title:
                        title.trim(),

                    description:
                        description?.trim()
                        || "Related work."

                });


                renderRelatedWork();

                updateDate();

                showToast(
                    "Related work added."
                );

            }
        );

}


/* =========================================================
   30. REFLECTION
========================================================= */

function loadReflection() {

    const textarea =
        $("#nextStudy");


    if (textarea) {

        textarea.value =
            studyData.nextStudy;

    }

}


function setupReflection() {

    $("#saveReflection")
        ?.addEventListener(
            "click",
            () => {

                const textarea =
                    $("#nextStudy");


                if (!textarea)
                    return;


                studyData.nextStudy =
                    textarea.value.trim();


                updateDate();

                showToast(
                    "Study plan saved."
                );

            }
        );

}


/* =========================================================
   31. GENERAL CONTROLS
========================================================= */

function setupGeneralControls() {

    $("#editStudy")
        ?.addEventListener(
            "click",
            editStudy
        );


    $("#archiveStudy")
        ?.addEventListener(
            "click",
            archiveStudy
        );


    $("#backToWorkspace")
        ?.addEventListener(
            "click",
            () => {

                /*
                 * study.html:
                 *
                 * personal/
                 * └── progress/
                 *     └── study/
                 *         └── study.html
                 *
                 * personal.html:
                 *
                 * personal/
                 * └── personal.html
                 *
                 * Therefore:
                 */

                window.location.href =
                    "../../personal.html";

            }
        );


    $("#studySettings")
        ?.addEventListener(
            "click",
            () => {

                showToast(
                    "Settings will be connected later."
                );

            }
        );


    /*
     * Escape closes all open modals.
     */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeAllModals();

            }

        }
    );

}


/* =========================================================
   32. EDIT STUDY
========================================================= */

function editStudy() {

    const topic =
        window.prompt(
            "Study topic:",
            studyData.topic
        );


    if (topic === null)
        return;


    const description =
        window.prompt(
            "Study description:",
            studyData.introduction
        );


    if (description === null)
        return;


    studyData.topic =
        topic.trim();


    studyData.introduction =
        description.trim();


    loadStudyInformation();

    updateDate();

    showToast(
        "Study updated."
    );

}


/* =========================================================
   33. ARCHIVE
========================================================= */

function archiveStudy() {

    const confirmed =
        window.confirm(
            "Mark this study as completed?"
        );


    if (!confirmed)
        return;


    studyData.status =
        "completed";


    const status =
        $("#studyStatus");


    if (status) {

        status.textContent =
            getStatusLabel(
                studyData.status
            );

    }


    updateDate();

    showToast(
        "Study marked as completed."
    );

}


/* =========================================================
   34. SUMMARY
========================================================= */

function updateSummary() {

    const confidence =
        $("#summaryConfidence");

    const concepts =
        $("#summaryConcepts");

    const problems =
        $("#summaryProblems");


    if (confidence) {

        confidence.textContent =
            `${studyData.confidence} / 5`;

    }


    if (concepts) {

        concepts.textContent =
            studyData.concepts.length;

    }


    if (problems) {

        problems.textContent =
            studyData.problems.filter(
                item =>
                    item.status === "open"
            ).length;

    }


    updateStudyTime();

}


function updateStudyTime() {

    const element =
        $("#summaryTime");


    if (!element)
        return;


    let totalMinutes = 0;


    studyData.timeline
        .filter(
            item =>
                item.status ===
                "completed"
        )
        .forEach(
            item => {

                totalMinutes +=
                    parseDuration(
                        item.duration
                    );

            }
        );


    if (totalMinutes <= 0) {

        element.textContent =
            "—";

        return;

    }


    const hours =
        Math.floor(
            totalMinutes / 60
        );

    const minutes =
        totalMinutes % 60;


    element.textContent =
        `${hours}h ${minutes}m`;

}


/* =========================================================
   35. DURATION PARSER
========================================================= */

function parseDuration(value) {

    if (!value)
        return 0;


    const text =
        String(value)
            .toLowerCase();


    const hoursMatch =
        text.match(
            /(\d+(?:\.\d+)?)\s*h/
        );


    const minutesMatch =
        text.match(
            /(\d+)\s*m/
        );


    const hours =
        hoursMatch
            ? Number(hoursMatch[1])
            : 0;


    const minutes =
        minutesMatch
            ? Number(minutesMatch[1])
            : 0;


    return (
        hours * 60 +
        minutes
    );

}


/* =========================================================
   36. NAVIGATION
========================================================= */

function setupNavigation() {

    $$(".study-nav-item")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.section;


                    const target =
                        document.getElementById(
                            `${section}Section`
                        );


                    if (!target)
                        return;


                    $$(".study-nav-item")
                        .forEach(
                            item =>
                                item.classList.toggle(
                                    "active",
                                    item === button
                                )
                        );


                    target.scrollIntoView({

                        behavior: "smooth",

                        block: "start"

                    });

                }
            );

        });

}


/* =========================================================
   37. MODAL HELPERS
========================================================= */

function openModal(selector) {

    $(selector)
        ?.classList.remove(
            "hidden"
        );

}


function closeModal(selector) {

    $(selector)
        ?.classList.add(
            "hidden"
        );

}


function closeAllModals() {

    $$(".study-modal")
        .forEach(
            modal =>
                modal.classList.add(
                    "hidden"
                )
        );

}


/* =========================================================
   38. DATE
========================================================= */

function updateDate() {

    studyData.updatedDate =
        formatDisplayDate(
            new Date()
        );


    const element =
        $("#studyUpdatedDate");


    if (element) {

        element.textContent =
            studyData.updatedDate;

    }

}


function getTodayISO() {

    const date =
        new Date();


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


function formatDisplayDate(date) {

    return date
        .toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

}


/* =========================================================
   39. FILE TYPE
========================================================= */

function getFileType(file) {

    const name =
        file.name.toLowerCase();


    if (
        file.type.startsWith(
            "image/"
        )
    )
        return "IMAGE";


    if (
        file.type.startsWith(
            "video/"
        )
    )
        return "VIDEO";


    if (
        file.type ===
        "application/pdf"
    )
        return "PDF";


    if (
        file.type.includes("word") ||
        name.endsWith(".doc") ||
        name.endsWith(".docx")
    )
        return "DOCUMENT";


    if (
        file.type.includes("sheet") ||
        name.endsWith(".xls") ||
        name.endsWith(".xlsx") ||
        name.endsWith(".csv")
    )
        return "SPREADSHEET";


    if (
        file.type.includes("zip") ||
        name.endsWith(".zip") ||
        name.endsWith(".rar")
    )
        return "ARCHIVE";


    return "FILE";

}


/* =========================================================
   40. FILE SIZE
========================================================= */

function formatFileSize(bytes) {

    if (!bytes)
        return "0 KB";


    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    const size =
        bytes /
        Math.pow(
            1024,
            index
        );


    return `${size.toFixed(
        index === 0 ? 0 : 1
    )} ${units[index]}`;

}


/* =========================================================
   41. URL
========================================================= */

function normalizeURL(url) {

    if (
        /^https?:\/\//i.test(
            url
        )
    ) {

        return url;

    }


    return `https://${url}`;

}


/* =========================================================
   42. INPUT
========================================================= */

function clearInput(selector) {

    const element =
        $(selector);


    if (element)
        element.value = "";

}


/* =========================================================
   43. ID
========================================================= */

function generateID(prefix) {

    return (

        prefix +
        "-" +
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)

    );

}


/* =========================================================
   44. HTML ESCAPING
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    )
        return "";


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(value) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   45. TOAST
========================================================= */

let toastTimer;


function showToast(message) {

    const toast =
        $("#studyToast");


    if (!toast)
        return;


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
            2400
        );

}


/* =========================================================
   46. FINAL EVENT BINDING
========================================================= */

/*
 * Attachment buttons are dynamically generated,
 * therefore we use event delegation here.
 */

document.addEventListener(
    "click",
    event => {

        const openButton =
            event.target.closest(
                "[data-open-attachment]"
            );


        const deleteButton =
            event.target.closest(
                "[data-delete-attachment]"
            );


        if (openButton) {

            openAttachment(
                openButton.dataset.openAttachment
            );

        }


        if (deleteButton) {

            deleteAttachment(
                deleteButton.dataset.deleteAttachment
            );

        }

    }
);

/* =========================================================
   LIVE DATE & CLOCK
========================================================= */

function updateLiveClock() {

    const now = new Date();


    const dateElement =
        document.getElementById(
            "liveDate"
        );


    const clockElement =
        document.getElementById(
            "liveClock"
        );


    if (!dateElement || !clockElement)
        return;


    const date =
        now.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    const time =
        now.toLocaleTimeString(
            "en-US",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            }
        );


    dateElement.textContent =
        date.toUpperCase();


    clockElement.textContent =
        time;

}


/* Start clock immediately */

updateLiveClock();


/* Update every second */

setInterval(
    updateLiveClock,
    1000
);
/* =========================================================
   END
========================================================= */