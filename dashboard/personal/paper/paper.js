/* =========================================================
   RiGiD — PAPER PAGE
   paper.js

   FRONTEND VERSION
   ---------------------------------------------------------
   Backend / Supabase integration can be connected later.

   Current data is stored in memory only.
========================================================= */


/* =========================================================
   01. PAPER DATA
========================================================= */

const paperData = {

    id: "paper-001",

    title:
        "Advancements in Outdoor Air Filtration: A Review of Existing Techniques and Technologies",

    description:
        "Review and analysis of existing outdoor air purification and filtration technologies.",

    status:
        "draft",

    stage:
        "draft",

    source:
        "Self",

    target:
        "Journal / Conference",

    deadline:
        "",

    createdDate:
        "18 Aug 2026",

    updatedDate:
        "23 Aug 2026",

    authors: [
        "You"
    ],

    tags: [
        "AIR FILTRATION",
        "HEPA",
        "ESP",
        "OUTDOOR AIR QUALITY"
    ],


    /* -----------------------------------------------------
       LEARNING
    ----------------------------------------------------- */

    learning: [

        "Existing outdoor air purification techniques include mechanical filtration, electrostatic precipitation, ionization, photocatalysis and hybrid systems.",

        "The effectiveness of an outdoor filtration system depends on particle size, airflow, energy consumption, maintenance and environmental conditions."

    ],


    findings: [

        {
            id: "finding-1",

            text:
                "Different air purification technologies have different strengths and limitations depending on the pollutant and operating environment."
        },

        {
            id: "finding-2",

            text:
                "Energy consumption and maintenance are important considerations for practical outdoor deployment."
        },

        {
            id: "finding-3",

            text:
                "Hybrid approaches may provide better overall performance than relying on a single purification technique."
        }

    ],


    methodology:
        "Record how the authors selected, compared and evaluated the technologies. Note the experimental setup, parameters, datasets and evaluation criteria.",


    questions: [

        {
            id: "question-1",

            text:
                "How does outdoor airflow affect the efficiency of filtration systems?",

            status:
                "open"
        },

        {
            id: "question-2",

            text:
                "What is the most practical technology for continuous outdoor deployment?",

            status:
                "open"
        }

    ],


    /* -----------------------------------------------------
       PAPER WRITING SECTIONS
    ----------------------------------------------------- */

    sections: [

        {
            id: "abstract",

            number: "01",

            title: "Abstract",

            status: "completed",

            content:
                "Write a concise summary of the research problem, methodology, major findings and conclusion."
        },

        {
            id: "introduction",

            number: "02",

            title: "Introduction",

            status: "completed",

            content:
                "Introduce outdoor air pollution, the need for air filtration and the motivation for reviewing existing technologies."
        },

        {
            id: "literature",

            number: "03",

            title: "Literature Review",

            status: "completed",

            content:
                "Organize existing research on HEPA filtration, electrostatic precipitation, ionization, photocatalysis and related technologies."
        },

        {
            id: "methodology",

            number: "04",

            title: "Methodology",

            status: "in-progress",

            content:
                "Describe how papers and technologies were identified, classified, compared and evaluated."
        },

        {
            id: "results",

            number: "05",

            title: "Results",

            status: "not-started",

            content:
                "Present the comparison and findings obtained from the literature review."
        },

        {
            id: "discussion",

            number: "06",

            title: "Discussion",

            status: "not-started",

            content:
                "Interpret the findings and discuss the advantages, limitations and practical implications."
        },

        {
            id: "conclusion",

            number: "07",

            title: "Conclusion",

            status: "not-started",

            content:
                "Summarize the major conclusions and identify future research opportunities."
        },

        {
            id: "references",

            number: "08",

            title: "References",

            status: "not-started",

            content:
                "Maintain the complete bibliography and citation information."
        }

    ],


    /* -----------------------------------------------------
       REFERENCES
    ----------------------------------------------------- */

    references: [],


    /* -----------------------------------------------------
       VERSION HISTORY
    ----------------------------------------------------- */

    versions: [

        {
            id: "version-1",

            version: "V1",

            title:
                "Initial Outline",

            description:
                "Initial structure and major sections created.",

            date:
                "18 Aug 2026",

            status:
                "Archived",

            size:
                "—"
        },

        {
            id: "version-2",

            version: "V2",

            title:
                "Literature Review Draft",

            description:
                "Added existing outdoor filtration technologies and comparison notes.",

            date:
                "22 Aug 2026",

            status:
                "Current",

            size:
                "—"
        }

    ],


    /* -----------------------------------------------------
       TIMELINE
    ----------------------------------------------------- */

    timeline: [

        {
            id: "timeline-1",

            date:
                "2026-08-18",

            title:
                "Create paper outline",

            description:
                "Define the major sections and research direction.",

            duration:
                "1 hour",

            status:
                "completed",

            priority:
                "normal"
        },

        {
            id: "timeline-2",

            date:
                "2026-08-24",

            title:
                "Complete literature review",

            description:
                "Organize the existing literature and identify research gaps.",

            duration:
                "3 hours",

            status:
                "ongoing",

            priority:
                "high"
        },

        {
            id: "timeline-3",

            date:
                "2026-08-27",

            title:
                "Complete methodology",

            description:
                "Finalize the methodology and technology comparison framework.",

            duration:
                "2 hours",

            status:
                "planned",

            priority:
                "high"
        },

        {
            id: "timeline-4",

            date:
                "2026-08-30",

            title:
                "Prepare results",

            description:
                "Create tables and comparisons for the reviewed technologies.",

            duration:
                "3 hours",

            status:
                "planned",

            priority:
                "normal"
        },

        {
            id: "timeline-5",

            date:
                "2026-09-03",

            title:
                "First complete draft",

            description:
                "Complete all paper sections and prepare the first full draft.",

            duration:
                "4 hours",

            status:
                "planned",

            priority:
                "high"
        }

    ],


    /* -----------------------------------------------------
       FUTURE WORK
    ----------------------------------------------------- */

    futureWork: [],


    /* -----------------------------------------------------
       ATTACHMENTS
    ----------------------------------------------------- */

    attachments: [],


    /* -----------------------------------------------------
       FEEDBACK
    ----------------------------------------------------- */

    feedback: [

        {
            id:
                "feedback-1",

            person:
                "Self Review",

            type:
                "SELF",

            date:
                "23 Aug 2026",

            content:
                "Need stronger comparison between technologies and clearer identification of research gaps."
        }

    ],


    /* -----------------------------------------------------
       NEXT ACTION
    ----------------------------------------------------- */

    nextAction:
        "Complete the literature review and identify the major research gaps."

};


/* =========================================================
   02. GLOBAL STATE
========================================================= */

let activeSectionId =
    paperData.sections[0].id;

let editingTimelineId =
    null;


/* =========================================================
   03. DOM HELPERS
========================================================= */

const $ = selector =>
    document.querySelector(selector);


const $$ = selector =>
    document.querySelectorAll(selector);


/* =========================================================
   04. INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializePaper
);


function initializePaper() {

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

    updateLiveClock();

    setupNavigation();

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

}


/* =========================================================
   05. PAPER INFORMATION
========================================================= */

function loadPaperInformation() {

    const title =
        $("#paperTitle");

    const description =
        $("#paperDescription");

    const status =
        $("#paperStatus");

    const stage =
        $("#paperStage");

    const source =
        $("#paperSource");

    const target =
        $("#paperTarget");

    const deadline =
        $("#paperDeadline");

    const updated =
        $("#paperUpdated");


    if (title)
        title.textContent =
            paperData.title;


    if (description)
        description.textContent =
            paperData.description;


    if (status)
        status.textContent =
            getPaperStatusLabel(
                paperData.status
            );


    if (stage)
        stage.textContent =
            getStageNumber(
                paperData.stage
            );


    if (source)
        source.textContent =
            paperData.source;


    if (target)
        target.textContent =
            paperData.target;


    if (deadline)
        deadline.textContent =
            paperData.deadline ||
            "Not set";


    if (updated)
        updated.textContent =
            paperData.updatedDate;


    const stageLabel =
        $("#stageLabel");


    if (stageLabel)
        stageLabel.textContent =
            capitalize(
                paperData.stage
            );

}


/* =========================================================
   06. STATUS
========================================================= */

function getPaperStatusLabel(status) {

    const labels = {

        draft:
            "● DRAFT",

        review:
            "● UNDER REVIEW",

        submitted:
            "● SUBMITTED",

        published:
            "● PUBLISHED"

    };


    return labels[status]
        || "● DRAFT";

}


function getStageNumber(stage) {

    const stages = {

        idea: "STAGE 01",

        outline: "STAGE 02",

        draft: "STAGE 03",

        review: "STAGE 04",

        published: "STAGE 05"

    };


    return stages[stage]
        || "STAGE 03";

}


/* =========================================================
   07. AUTHORS
========================================================= */

function renderAuthors() {

    const container =
        $("#authorList");


    if (!container)
        return;


    container.innerHTML = "";


    paperData.authors.forEach(
        (author, index) => {

            const chip =
                document.createElement("span");

            chip.className =
                "author-chip";


            chip.innerHTML = `

                ${escapeHTML(author)}

                ${
                    index > 0
                    ?
                    `
                    <button
                        type="button"
                        data-remove-author="${index}"
                        style="
                            margin-left:5px;
                            border:0;
                            background:transparent;
                            color:inherit;
                            cursor:pointer;
                        "
                    >
                        ×
                    </button>
                    `
                    :
                    ""
                }

            `;


            container.appendChild(
                chip
            );

        }
    );


    $$("[data-remove-author]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.removeAuthor
                        );


                    paperData.authors
                        .splice(
                            index,
                            1
                        );


                    renderAuthors();

                    updatePaperDate();

                }
            );

        });

}


/* =========================================================
   08. TAGS
========================================================= */

function renderTags() {

    const container =
        $("#paperTags");


    if (!container)
        return;


    container.innerHTML = "";


    paperData.tags.forEach(
        tag => {

            const element =
                document.createElement("span");

            element.textContent =
                tag;


            container.appendChild(
                element
            );

        }
    );

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


    paperData.learning.forEach(
        item => {

            const p =
                document.createElement("p");

            p.textContent =
                item;


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
            editLearning
        );


    $("#addLearning")
        ?.addEventListener(
            "click",
            () => {

                const result =
                    window.prompt(
                        "What did you learn from this paper?"
                    );


                if (!result)
                    return;


                paperData.learning.push(
                    result.trim()
                );


                renderLearning();

                updatePaperDate();

                showToast(
                    "Learning added."
                );

            }
        );

}


function editLearning() {

    const current =
        paperData.learning.join(
            "\n\n"
        );


    const result =
        window.prompt(
            "Edit your learning notes:",
            current
        );


    if (result === null)
        return;


    paperData.learning =
        result
            .split(/\n\s*\n/)
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);


    renderLearning();

    updatePaperDate();

    showToast(
        "Learning updated."
    );

}


/* =========================================================
   10. FINDINGS
========================================================= */

function renderFindings() {

    const container =
        $("#findingsList");


    if (!container)
        return;


    container.innerHTML = "";


    paperData.findings.forEach(
        (finding, index) => {

            const item =
                document.createElement("div");

            item.className =
                "finding-item";


            item.innerHTML = `

                <span class="finding-number">
                    ${String(index + 1).padStart(2, "0")}
                </span>

                <p>
                    ${escapeHTML(finding.text)}
                </p>

            `;


            container.appendChild(
                item
            );

        }
    );

}


function setupFindings() {

    $("#addFinding")
        ?.addEventListener(
            "click",
            () => {

                const result =
                    window.prompt(
                        "Add an important finding:"
                    );


                if (!result)
                    return;


                paperData.findings.push({

                    id:
                        generateID("finding"),

                    text:
                        result.trim()

                });


                renderFindings();

                updatePaperDate();

                showToast(
                    "Finding added."
                );

            }
        );

}


/* =========================================================
   11. METHODOLOGY
========================================================= */

function renderMethodology() {

    const container =
        $("#methodologyContent");


    if (!container)
        return;


    container.innerHTML = `

        <p>
            ${escapeHTML(
                paperData.methodology
            )}
        </p>

    `;

}


function setupMethodology() {

    $("#editMethodology")
        ?.addEventListener(
            "click",
            () => {

                const result =
                    window.prompt(
                        "Methodology notes:",
                        paperData.methodology
                    );


                if (result === null)
                    return;


                paperData.methodology =
                    result.trim();


                renderMethodology();

                updatePaperDate();

                showToast(
                    "Methodology updated."
                );

            }
        );

}


/* =========================================================
   12. QUESTIONS
========================================================= */

function renderQuestions() {

    const container =
        $("#questionList");


    if (!container)
        return;


    container.innerHTML = "";


    paperData.questions.forEach(
        question => {

            const item =
                document.createElement("div");

            item.className =
                "question-item";


            item.innerHTML = `

                <span>
                    ${question.status === "open"
                        ? "OPEN"
                        : "DONE"}
                </span>

                <p>
                    ${escapeHTML(question.text)}
                </p>

                ${
                    question.status === "open"
                    ?
                    `
                    <button
                        type="button"
                        data-resolve-question="${question.id}"
                        style="
                            margin-left:auto;
                            border:0;
                            background:transparent;
                            color:#b991ff;
                            font-size:7px;
                            cursor:pointer;
                        "
                    >
                        Resolve
                    </button>
                    `
                    :
                    ""
                }

            `;


            container.appendChild(
                item
            );

        }
    );


    $$("[data-resolve-question]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const question =
                        paperData.questions.find(
                            item =>
                                item.id ===
                                button.dataset.resolveQuestion
                        );


                    if (!question)
                        return;


                    question.status =
                        "resolved";


                    renderQuestions();

                    updatePaperSummary();

                    updatePaperDate();

                    showToast(
                        "Question resolved."
                    );

                }
            );

        });

}


function setupQuestions() {

    $("#addQuestion")
        ?.addEventListener(
            "click",
            () => {

                const result =
                    window.prompt(
                        "What question or research gap did you find?"
                    );


                if (!result)
                    return;


                paperData.questions.push({

                    id:
                        generateID("question"),

                    text:
                        result.trim(),

                    status:
                        "open"

                });


                renderQuestions();

                updatePaperSummary();

                updatePaperDate();

                showToast(
                    "Question added."
                );

            }
        );

}


/* =========================================================
   13. PAPER WRITING SECTIONS
========================================================= */

function renderPaperSections() {

    const container =
        $("#paperSectionList");


    if (!container)
        return;


    container.innerHTML = "";


    paperData.sections.forEach(
        section => {

            const button =
                document.createElement("button");

            button.type =
                "button";

            button.className =
                "paper-writing-section";


            if (
                section.id ===
                activeSectionId
            ) {

                button.classList.add(
                    "active"
                );

            }


            if (
                section.status ===
                "completed"
            ) {

                button.classList.add(
                    "completed"
                );

            }


            button.innerHTML = `

                <span class="section-number">
                    ${section.number}
                </span>

                <strong>
                    ${escapeHTML(section.title)}
                </strong>

                <span class="section-check">
                    ${
                        section.status ===
                        "completed"
                        ?
                        "✓"
                        :
                        ""
                    }
                </span>

            `;


            button.addEventListener(
                "click",
                () => {

                    setActiveSection(
                        section.id
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );


    updateWritingProgress();

}


/* =========================================================
   14. ACTIVE SECTION
========================================================= */

function setActiveSection(id) {

    saveActiveEditor();


    activeSectionId =
        id;


    const section =
        getActiveSection();


    if (!section)
        return;


    $("#activeSectionTitle")
        .textContent =
        section.title;


    $("#paperEditor")
        .value =
        section.content;


    renderPaperSections();

    updateWordCount();

}


/* =========================================================
   15. ACTIVE SECTION DATA
========================================================= */

function getActiveSection() {

    return paperData.sections.find(
        section =>
            section.id ===
            activeSectionId
    );

}


/* =========================================================
   16. WRITING WORKSPACE
========================================================= */

function setupWritingWorkspace() {

    setActiveSection(
        activeSectionId
    );


    $("#paperEditor")
        ?.addEventListener(
            "input",
            () => {

                updateWordCount();

            }
        );


    $("#saveDraft")
        ?.addEventListener(
            "click",
            () => {

                saveActiveEditor();

                updatePaperDate();

                showToast(
                    "Draft saved."
                );

            }
        );


    $("#newVersion")
        ?.addEventListener(
            "click",
            createVersion
        );


    $("#editorBold")
        ?.addEventListener(
            "click",
            () =>
                insertFormatting("bold")
        );


    $("#editorItalic")
        ?.addEventListener(
            "click",
            () =>
                insertFormatting("italic")
        );


    $("#editorList")
        ?.addEventListener(
            "click",
            () =>
                insertFormatting("list")
        );

}


function saveActiveEditor() {

    const editor =
        $("#paperEditor");


    const section =
        getActiveSection();


    if (!editor || !section)
        return;


    section.content =
        editor.value;


    /*
     * A section becomes "completed"
     * when the user has entered meaningful
     * content and explicitly saves it.
     */

    if (
        section.content.trim().length >= 20 &&
        section.status === "not-started"
    ) {

        section.status =
            "in-progress";

    }


    updateWritingProgress();

    updatePaperSummary();

}


/* =========================================================
   17. WORD COUNT
========================================================= */

function updateWordCount() {

    const editor =
        $("#paperEditor");


    const counter =
        $("#wordCount");


    if (!editor || !counter)
        return;


    const text =
        editor.value.trim();


    const count =
        text
            ? text.split(/\s+/).length
            : 0;


    counter.textContent =
        `${count} word${count === 1 ? "" : "s"}`;


    updateTotalWordCount();

}


/* =========================================================
   18. TOTAL WORD COUNT
========================================================= */

function updateTotalWordCount() {

    const total =
        paperData.sections.reduce(
            (sum, section) => {

                return (
                    sum +
                    countWords(
                        section.content
                    )
                );

            },
            0
        );


    const element =
        $("#summaryWords");


    if (element)
        element.textContent =
            total;

}


/* =========================================================
   19. WRITING PROGRESS
========================================================= */

function updateWritingProgress() {

    const total =
        paperData.sections.length;


    const completed =
        paperData.sections.filter(
            section =>
                section.status ===
                "completed"
        ).length;


    const percentage =
        Math.round(
            (completed / total) * 100
        );


    const progress =
        $("#writingProgressFill");


    const writingPercentage =
        $("#writingPercentage");


    const sectionProgress =
        $("#sectionProgress");


    if (progress)
        progress.style.width =
            `${percentage}%`;


    if (writingPercentage)
        writingPercentage.textContent =
            `${percentage}%`;


    if (sectionProgress)
        sectionProgress.textContent =
            `${completed} / ${total}`;


    const completion =
        $("#paperCompletion");


    if (completion)
        completion.textContent =
            `${percentage}%`;


    updatePaperSummary();

}


/* =========================================================
   20. EDITOR FORMATTING
========================================================= */

function insertFormatting(type) {

    const editor =
        $("#paperEditor");


    if (!editor)
        return;


    const start =
        editor.selectionStart;


    const end =
        editor.selectionEnd;


    const selected =
        editor.value.substring(
            start,
            end
        );


    let replacement =
        selected;


    if (type === "bold") {

        replacement =
            `**${selected || "bold text"}**`;

    }


    if (type === "italic") {

        replacement =
            `*${selected || "italic text"}*`;

    }


    if (type === "list") {

        replacement =
            selected
                ? selected
                    .split("\n")
                    .map(
                        line =>
                            `• ${line}`
                    )
                    .join("\n")
                : "• ";

    }


    editor.setRangeText(
        replacement,
        start,
        end,
        "end"
    );


    editor.focus();

    updateWordCount();

}


/* =========================================================
   21. REFERENCES
========================================================= */

function renderReferences() {

    const container =
        $("#referenceList");


    if (!container)
        return;


    container.innerHTML = "";


    if (
        paperData.references.length === 0
    ) {

        container.innerHTML = `

            <div class="reference-item">

                <span class="reference-number">
                    —
                </span>

                <div>

                    <h3>
                        No references added yet
                    </h3>

                    <p>
                        Add papers, books, websites or other sources.
                    </p>

                </div>

            </div>

        `;

    }


    paperData.references.forEach(
        (reference, index) => {

            const item =
                document.createElement("article");

            item.className =
                "reference-item";


            item.innerHTML = `

                <span class="reference-number">
                    [${index + 1}]
                </span>

                <div>

                    <h3>
                        ${escapeHTML(reference.title)}
                    </h3>

                    <p>
                        ${escapeHTML(reference.authors)}
                        ·
                        ${escapeHTML(reference.year)}
                    </p>

                    ${
                        reference.notes
                        ?
                        `
                        <p>
                            ${escapeHTML(reference.notes)}
                        </p>
                        `
                        :
                        ""
                    }

                </div>

                ${
                    reference.url
                    ?
                    `
                    <a
                        class="reference-open"
                        href="${escapeAttribute(
                            normalizeURL(
                                reference.url
                            )
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open
                    </a>
                    `
                    :
                    `
                    <button
                        class="small-action"
                        data-delete-reference="${reference.id}"
                        type="button"
                    >
                        Delete
                    </button>
                    `
                }

            `;


            container.appendChild(
                item
            );

        }
    );


    $$("[data-delete-reference]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    paperData.references =
                        paperData.references.filter(
                            item =>
                                item.id !==
                                button.dataset.deleteReference
                        );


                    renderReferences();

                    updatePaperSummary();

                    updatePaperDate();

                }
            );

        });


    updateReferenceCount();

}


function setupReferences() {

    $("#addReference")
        ?.addEventListener(
            "click",
            () => {

                clearInput(
                    "#referenceTitle"
                );

                clearInput(
                    "#referenceAuthors"
                );

                clearInput(
                    "#referenceYear"
                );

                clearInput(
                    "#referenceDOI"
                );

                clearInput(
                    "#referenceNotes"
                );

                openModal(
                    "#referenceModal"
                );

            }
        );


    $("#closeReferenceModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "#referenceModal"
                )
        );


    $("#cancelReference")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "#referenceModal"
                )
        );


    $("#saveReference")
        ?.addEventListener(
            "click",
            saveReference
        );

}


function saveReference() {

    const title =
        $("#referenceTitle")
            ?.value.trim();


    if (!title) {

        showToast(
            "Reference title is required."
        );

        return;

    }


    paperData.references.push({

        id:
            generateID("reference"),

        title,

        authors:
            $("#referenceAuthors")
                ?.value.trim()
                || "Unknown authors",

        year:
            $("#referenceYear")
                ?.value.trim()
                || "Year not specified",

        url:
            $("#referenceDOI")
                ?.value.trim()
                || "",

        notes:
            $("#referenceNotes")
                ?.value.trim()
                || ""

    });


    renderReferences();

    updatePaperSummary();

    updatePaperDate();

    closeModal(
        "#referenceModal"
    );


    showToast(
        "Reference added."
    );

}


function updateReferenceCount() {

    const count =
        paperData.references.length;


    $("#referenceCount")
        ?.replaceChildren(
            document.createTextNode(
                count
            )
        );


    $("#summaryReferences")
        ?.replaceChildren(
            document.createTextNode(
                count
            )
        );

}


/* =========================================================
   22. VERSION HISTORY
========================================================= */

function renderVersions() {

    const container =
        $("#versionGrid");


    if (!container)
        return;


    container.innerHTML = "";


    paperData.versions.forEach(
        version => {

            const card =
                document.createElement("article");

            card.className =
                "version-card";


            card.innerHTML = `

                <div class="version-top">

                    <span class="version-number">
                        ${escapeHTML(version.version)}
                    </span>

                    <span class="version-status">
                        ${escapeHTML(version.status.toUpperCase())}
                    </span>

                </div>

                <h3>
                    ${escapeHTML(version.title)}
                </h3>

                <p>
                    ${escapeHTML(version.description)}
                </p>

                <div class="version-meta">

                    <span>
                        ${escapeHTML(version.date)}
                    </span>

                    <span>
                        ${escapeHTML(version.size)}
                    </span>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );


    updateVersionCount();

}


function setupVersions() {

    $("#newVersion")
        ?.addEventListener(
            "click",
            createVersion
        );


    $("#uploadDraft")
        ?.addEventListener(
            "click",
            () => {

                $("#draftFileInput")
                    ?.click();

            }
        );


    $("#draftFileInput")
        ?.addEventListener(
            "change",
            event => {

                Array.from(
                    event.target.files
                )
                .forEach(
                    file =>
                        addDraftVersion(
                            file
                        )
                );


                event.target.value = "";

            }
        );

}


function createVersion() {

    saveActiveEditor();


    const nextNumber =
        paperData.versions.length + 1;


    paperData.versions
        .forEach(
            version => {

                version.status =
                    "Archived";

            }
        );


    paperData.versions.unshift({

        id:
            generateID("version"),

        version:
            `V${nextNumber}`,

        title:
            "New Draft",

        description:
            "New paper version created from the current workspace.",

        date:
            formatDisplayDate(
                new Date()
            ),

        status:
            "Current",

        size:
            "—"

    });


    renderVersions();

    updatePaperDate();

    showToast(
        `Version V${nextNumber} created.`
    );

}


function addDraftVersion(file) {

    const nextNumber =
        paperData.versions.length + 1;


    paperData.versions
        .forEach(
            version => {

                version.status =
                    "Archived";

            }
        );


    paperData.versions.unshift({

        id:
            generateID("version"),

        version:
            `V${nextNumber}`,

        title:
            file.name,

        description:
            "Uploaded paper draft.",

        date:
            formatDisplayDate(
                new Date()
            ),

        status:
            "Current",

        size:
            formatFileSize(
                file.size
            )

    });


    renderVersions();

    updatePaperDate();

    showToast(
        "Draft uploaded."
    );

}


function updateVersionCount() {

    const count =
        paperData.versions.length;


    $("#draftCount")
        ?.replaceChildren(
            document.createTextNode(
                count
            )
        );


    $("#summaryVersions")
        ?.replaceChildren(
            document.createTextNode(
                count
            )
        );

}


/* =========================================================
   23. TIMELINE
========================================================= */

function renderTimeline() {

    const container =
        $("#paperTimeline");


    if (!container)
        return;


    container.innerHTML = "";


    const sorted =
        [...paperData.timeline]
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );


    sorted.forEach(
        entry => {

            const item =
                document.createElement("article");

            item.className =
                "paper-timeline-item";


            item.innerHTML = `

                <div class="paper-timeline-point"></div>

                <div class="paper-timeline-date">
                    ${formatTimelineDate(entry.date)}
                </div>

                <div class="paper-timeline-card">

                    <div class="paper-timeline-top">

                        <span
                            class="paper-timeline-status ${escapeHTML(entry.status)}"
                        >
                            ${escapeHTML(
                                entry.status.toUpperCase()
                            )}
                        </span>

                        <div class="paper-timeline-actions">

                            <button
                                type="button"
                                data-edit-paper-timeline="${entry.id}"
                                title="Edit"
                            >
                                ✎
                            </button>

                            <button
                                type="button"
                                data-delete-paper-timeline="${entry.id}"
                                title="Delete"
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

                    <span class="paper-timeline-duration">
                        ${escapeHTML(entry.duration)}
                    </span>

                </div>

            `;


            container.appendChild(
                item
            );

        }
    );


    bindTimelineActions();

}


function bindTimelineActions() {

    $$("[data-edit-paper-timeline]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    editTimeline(
                        button.dataset.editPaperTimeline
                    )
            );

        });


    $$("[data-delete-paper-timeline]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    deleteTimeline(
                        button.dataset.deletePaperTimeline
                    )
            );

        });

}


/* =========================================================
   24. TIMELINE SETUP
========================================================= */

function setupTimeline() {

    $("#addTimeline")
        ?.addEventListener(
            "click",
            () => {

                editingTimelineId =
                    null;

                resetTimelineForm();

                $("#paperTimelineDate").value =
                    getTodayISO();

                openModal(
                    "#paperTimelineModal"
                );

            }
        );


    $("#closePaperTimelineModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "#paperTimelineModal"
                )
        );


    $("#cancelPaperTimeline")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "#paperTimelineModal"
                )
        );


    $("#savePaperTimeline")
        ?.addEventListener(
            "click",
            saveTimeline
        );

}


function saveTimeline() {

    const date =
        $("#paperTimelineDate")
            ?.value;


    const status =
        $("#paperTimelineStatus")
            ?.value;


    const title =
        $("#paperTimelineTitle")
            ?.value.trim();


    const description =
        $("#paperTimelineDescription")
            ?.value.trim();


    const duration =
        $("#paperTimelineDuration")
            ?.value.trim();


    const priority =
        $("#paperTimelinePriority")
            ?.value;


    if (!date || !title) {

        showToast(
            "Date and task are required."
        );

        return;

    }


    if (editingTimelineId) {

        const entry =
            paperData.timeline.find(
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
                "Paper task.";

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

        paperData.timeline.push({

            id:
                generateID("timeline"),

            date,

            status,

            title,

            description:
                description ||
                "Paper task.",

            duration:
                duration ||
                "Not specified",

            priority

        });


        showToast(
            "Timeline added."
        );

    }


    syncFutureWork();

    renderTimeline();

    renderFutureWork();

    updatePaperDate();

    closeModal(
        "#paperTimelineModal"
    );

    resetTimelineForm();

}


/* =========================================================
   25. EDIT TIMELINE
========================================================= */

function editTimeline(id) {

    const entry =
        paperData.timeline.find(
            item =>
                item.id === id
        );


    if (!entry)
        return;


    editingTimelineId =
        id;


    $("#paperTimelineDate").value =
        entry.date;


    $("#paperTimelineStatus").value =
        entry.status;


    $("#paperTimelineTitle").value =
        entry.title;


    $("#paperTimelineDescription").value =
        entry.description;


    $("#paperTimelineDuration").value =
        entry.duration || "";


    $("#paperTimelinePriority").value =
        entry.priority || "normal";


    openModal(
        "#paperTimelineModal"
    );

}


/* =========================================================
   26. DELETE TIMELINE
========================================================= */

function deleteTimeline(id) {

    if (
        !window.confirm(
            "Delete this timeline entry?"
        )
    )
        return;


    paperData.timeline =
        paperData.timeline.filter(
            item =>
                item.id !== id
        );


    syncFutureWork();

    renderTimeline();

    renderFutureWork();

    updatePaperDate();

    showToast(
        "Timeline entry deleted."
    );

}


function resetTimelineForm() {

    clearInput(
        "#paperTimelineDate"
    );

    clearInput(
        "#paperTimelineTitle"
    );

    clearInput(
        "#paperTimelineDescription"
    );

    clearInput(
        "#paperTimelineDuration"
    );


    if (
        $("#paperTimelineStatus")
    )
        $("#paperTimelineStatus").value =
            "planned";


    if (
        $("#paperTimelinePriority")
    )
        $("#paperTimelinePriority").value =
            "normal";

}


/* =========================================================
   27. FUTURE WORK
========================================================= */

function syncFutureWork() {

    paperData.futureWork =
        paperData.timeline
            .filter(
                item =>
                    item.status ===
                    "planned"
            )
            .map(
                item => ({

                    id:
                        item.id,

                    date:
                        item.date,

                    title:
                        item.title,

                    description:
                        item.description,

                    priority:
                        item.priority

                })
            );

}


function renderFutureWork() {

    const container =
        $("#futureWorkList");


    if (!container)
        return;


    syncFutureWork();


    container.innerHTML = "";


    paperData.futureWork
        .sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        )
        .forEach(
            item => {

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

            }
        );


    const count =
        $("#futureCount");


    if (count)
        count.textContent =
            String(
                paperData.futureWork.length
            ).padStart(2, "0");

}


function setupFutureWork() {

    $("#addFutureWork")
        ?.addEventListener(
            "click",
            () => {

                editingTimelineId =
                    null;

                resetTimelineForm();

                $("#paperTimelineDate").value =
                    getTodayISO();


                $("#paperTimelineStatus").value =
                    "planned";


                openModal(
                    "#paperTimelineModal"
                );

            }
        );

}


/* =========================================================
   28. UPLOADS
========================================================= */

function setupUploads() {

    const input =
        $("#paperFileInput");

    const button =
        $("#uploadPaperFile");

    const zone =
        $("#paperUploadZone");


    button?.addEventListener(
        "click",
        () =>
            input?.click()
    );


    zone?.addEventListener(
        "click",
        () =>
            input?.click()
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
        () =>
            zone.classList.remove(
                "dragging"
            )
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
        .forEach(
            file => {

                const url =
                    URL.createObjectURL(
                        file
                    );


                paperData.attachments.unshift({

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

                    url,

                    description:
                        ""

                });

            }
        );


    renderAttachments();

    updatePaperDate();

    showToast(
        `${files.length} file${files.length > 1 ? "s" : ""} added.`
    );

}


/* =========================================================
   29. ATTACHMENTS
========================================================= */

function renderAttachments() {

    const container =
        $("#paperAttachmentGrid");


    if (!container)
        return;


    container.innerHTML = "";


    if (
        paperData.attachments.length === 0
    ) {

        container.innerHTML = `

            <div
                class="attachment-card"
                style="
                    grid-column:1/-1;
                    text-align:center;
                    padding:20px;
                    color:#71839a;
                "
            >
                No files or links added yet.
            </div>

        `;

        return;

    }


    paperData.attachments.forEach(
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
        "attachment-card";


    card.innerHTML = `

        <div class="attachment-preview">

            ${createPreview(attachment)}

        </div>

        <strong>
            ${escapeHTML(attachment.name)}
        </strong>

        <p>
            ${escapeHTML(attachment.fileType)}
            ·
            ${escapeHTML(attachment.size)}
        </p>

        <div class="attachment-actions">

            <button
                type="button"
                data-open-paper-attachment="${attachment.id}"
            >
                Open
            </button>

            <button
                type="button"
                data-delete-paper-attachment="${attachment.id}"
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


function createPreview(
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


    return escapeHTML(
        attachment.fileType
    );

}


/* =========================================================
   30. LINKS
========================================================= */

function setupLinks() {

    $("#addPaperLink")
        ?.addEventListener(
            "click",
            () => {

                clearInput(
                    "#paperLinkTitle"
                );

                clearInput(
                    "#paperLinkURL"
                );

                clearInput(
                    "#paperLinkDescription"
                );

                openModal(
                    "#paperLinkModal"
                );

            }
        );


    $("#closePaperLinkModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "#paperLinkModal"
                )
        );


    $("#cancelPaperLink")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "#paperLinkModal"
                )
        );


    $("#savePaperLink")
        ?.addEventListener(
            "click",
            savePaperLink
        );

}


function savePaperLink() {

    const title =
        $("#paperLinkTitle")
            ?.value.trim();


    const url =
        $("#paperLinkURL")
            ?.value.trim();


    const description =
        $("#paperLinkDescription")
            ?.value.trim();


    if (!title || !url) {

        showToast(
            "Title and URL are required."
        );

        return;

    }


    paperData.attachments.unshift({

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
            "Paper resource."

    });


    renderAttachments();

    updatePaperDate();

    closeModal(
        "#paperLinkModal"
    );


    showToast(
        "Link added."
    );

}


/* =========================================================
   31. LINK ATTACHMENT
========================================================= */

function renderLinkAttachment(
    container,
    attachment
) {

    const card =
        document.createElement("article");

    card.className =
        "attachment-card";


    card.innerHTML = `

        <div
            class="attachment-preview"
            style="
                flex-direction:column;
                gap:4px;
            "
        >

            <span
                style="
                    font-size:18px;
                "
            >
                🔗
            </span>

            <span
                style="
                    font-size:6px;
                "
            >
                WEB LINK
            </span>

        </div>


        <strong>
            ${escapeHTML(attachment.name)}
        </strong>


        <p>
            ${escapeHTML(
                attachment.description
            )}
        </p>


        <div class="attachment-actions">

            <button
                type="button"
                data-open-paper-attachment="${attachment.id}"
            >
                Open
            </button>

            <button
                type="button"
                data-delete-paper-attachment="${attachment.id}"
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
   32. ATTACHMENT BUTTONS
========================================================= */

function bindAttachmentButtons(
    container
) {

    container
        .querySelectorAll(
            "[data-open-paper-attachment]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        openAttachment(
                            button.dataset
                                .openPaperAttachment
                        )
                );

            }
        );


    container
        .querySelectorAll(
            "[data-delete-paper-attachment]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        deleteAttachment(
                            button.dataset
                                .deletePaperAttachment
                        )
                );

            }
        );

}


/* =========================================================
   33. OPEN / DELETE ATTACHMENT
========================================================= */

function openAttachment(id) {

    const attachment =
        paperData.attachments.find(
            item =>
                item.id === id
        );


    if (
        attachment?.url
    ) {

        window.open(
            attachment.url,
            "_blank",
            "noopener,noreferrer"
        );

    }

}


function deleteAttachment(id) {

    const attachment =
        paperData.attachments.find(
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


    paperData.attachments =
        paperData.attachments.filter(
            item =>
                item.id !== id
        );


    renderAttachments();

    updatePaperDate();

    showToast(
        "Attachment deleted."
    );

}


/* =========================================================
   34. FEEDBACK
========================================================= */

function renderFeedback() {

    const container =
        $("#feedbackGrid");


    if (!container)
        return;


    container.innerHTML = "";


    paperData.feedback.forEach(
        feedback => {

            const card =
                document.createElement("article");

            card.className =
                "feedback-card";


            card.innerHTML = `

                <div class="feedback-top">

                    <span class="feedback-person">
                        ${escapeHTML(feedback.person)}
                    </span>

                    <span class="feedback-type">
                        ${escapeHTML(feedback.type)}
                    </span>

                </div>

                <p>
                    ${escapeHTML(feedback.content)}
                </p>

                <span class="feedback-date">
                    ${escapeHTML(feedback.date)}
                </span>

            `;


            container.appendChild(
                card
            );

        }
    );

}


function setupFeedback() {

    $("#addFeedback")
        ?.addEventListener(
            "click",
            () => {

                clearInput(
                    "#feedbackPerson"
                );

                clearInput(
                    "#feedbackDate"
                );

                clearInput(
                    "#feedbackContent"
                );


                $("#feedbackDate").value =
                    getTodayISO();


                openModal(
                    "#feedbackModal"
                );

            }
        );


    $("#closeFeedbackModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "#feedbackModal"
                )
        );


    $("#cancelFeedback")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "#feedbackModal"
                )
        );


    $("#saveFeedback")
        ?.addEventListener(
            "click",
            saveFeedback
        );

}


function saveFeedback() {

    const person =
        $("#feedbackPerson")
            ?.value.trim();


    const date =
        $("#feedbackDate")
            ?.value;


    const type =
        $("#feedbackType")
            ?.value;


    const content =
        $("#feedbackContent")
            ?.value.trim();


    if (!person || !content) {

        showToast(
            "Reviewer and feedback are required."
        );

        return;

    }


    paperData.feedback.unshift({

        id:
            generateID("feedback"),

        person,

        type:
            String(type || "SELF")
                .toUpperCase(),

        date:
            date
                ? formatDisplayDate(
                    new Date(
                        `${date}T00:00:00`
                    )
                )
                : formatDisplayDate(
                    new Date()
                ),

        content

    });


    renderFeedback();

    updatePaperDate();

    closeModal(
        "#feedbackModal"
    );


    showToast(
        "Feedback added."
    );

}


/* =========================================================
   35. NEXT ACTION
========================================================= */

function loadNextAction() {

    const textarea =
        $("#nextPaperAction");


    if (textarea)
        textarea.value =
            paperData.nextAction;

}


function setupPaperControls() {

    $("#saveNextAction")
        ?.addEventListener(
            "click",
            () => {

                const textarea =
                    $("#nextPaperAction");


                if (!textarea)
                    return;


                paperData.nextAction =
                    textarea.value.trim();


                updatePaperDate();

                showToast(
                    "Next action saved."
                );

            }
        );


    $("#addAuthor")
        ?.addEventListener(
            "click",
            () => {

                const name =
                    window.prompt(
                        "Author / co-author name:"
                    );


                if (!name)
                    return;


                paperData.authors.push(
                    name.trim()
                );


                renderAuthors();

                updatePaperDate();

            }
        );


    $("#editPaper")
        ?.addEventListener(
            "click",
            editPaper
        );


    $("#archivePaper")
        ?.addEventListener(
            "click",
            archivePaper
        );


    $("#paperSettings")
        ?.addEventListener(
            "click",
            () => {

                showToast(
                    "Paper settings will be connected later."
                );

            }
        );


    $("#backToWorkspace")
        ?.addEventListener(
            "click",
            () => {

                /*
                 * paper.html location:
                 *
                 * personal/
                 *   progress/
                 *     paper/
                 *       paper.html
                 *
                 * personal.html is two levels up.
                 */

                window.location.href =
                    "../../personal.html";

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeAllModals();

            }

        }
    );

}


/* =========================================================
   36. EDIT PAPER
========================================================= */

function editPaper() {

    const title =
        window.prompt(
            "Paper title:",
            paperData.title
        );


    if (title === null)
        return;


    const description =
        window.prompt(
            "Paper description:",
            paperData.description
        );


    if (description === null)
        return;


    const target =
        window.prompt(
            "Target journal / conference:",
            paperData.target
        );


    if (target === null)
        return;


    paperData.title =
        title.trim();


    paperData.description =
        description.trim();


    paperData.target =
        target.trim();


    loadPaperInformation();

    updatePaperDate();

    showToast(
        "Paper information updated."
    );

}


/* =========================================================
   37. ARCHIVE / STAGE
========================================================= */

function archivePaper() {

    if (
        !window.confirm(
            "Mark this paper as published?"
        )
    )
        return;


    paperData.status =
        "published";


    paperData.stage =
        "published";


    loadPaperInformation();

    updatePaperDate();

    showToast(
        "Paper marked as published."
    );

}


/* =========================================================
   38. NAVIGATION
========================================================= */

function setupNavigation() {

    $$(".paper-nav-item")
        .forEach(
            button => {

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


                        $$(".paper-nav-item")
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

            }
        );

}


/* =========================================================
   39. SUMMARY
========================================================= */

function updatePaperSummary() {

    updateWritingProgress();

    updateReferenceCount();

    updateVersionCount();

    updateQuestionCount();

    updateTotalWordCount();

}


function updateQuestionCount() {

    const count =
        paperData.questions.filter(
            question =>
                question.status ===
                "open"
        ).length;


    $("#questionCount")
        ?.replaceChildren(
            document.createTextNode(
                count
            )
        );

}


/* =========================================================
   40. LIVE CLOCK
========================================================= */

function updateLiveClock() {

    const dateElement =
        $("#liveDate");


    const clockElement =
        $("#liveClock");


    if (
        !dateElement ||
        !clockElement
    )
        return;


    const now =
        new Date();


    dateElement.textContent =
        now
            .toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            )
            .toUpperCase();


    clockElement.textContent =
        now
            .toLocaleTimeString(
                "en-US",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                }
            );

}


setInterval(
    updateLiveClock,
    1000
);


/* =========================================================
   41. PAPER DATE
========================================================= */

function updatePaperDate() {

    paperData.updatedDate =
        formatDisplayDate(
            new Date()
        );


    const element =
        $("#paperUpdated");


    if (element)
        element.textContent =
            paperData.updatedDate;

}


/* =========================================================
   42. MODALS
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

    $$(".paper-modal")
        .forEach(
            modal =>
                modal.classList.add(
                    "hidden"
                )
        );

}


/* =========================================================
   43. HELPERS
========================================================= */

function getTodayISO() {

    const date =
        new Date();


    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0"),

        String(
            date.getDate()
        ).padStart(2, "0")

    ].join("-");

}


function formatDisplayDate(date) {

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function formatTimelineDate(
    dateString
) {

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


function capitalize(value) {

    if (!value)
        return "";


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


function countWords(text) {

    if (!text)
        return 0;


    const trimmed =
        String(text).trim();


    if (!trimmed)
        return 0;


    return trimmed.split(
        /\s+/
    ).length;

}


function clearInput(selector) {

    const element =
        $(selector);


    if (element)
        element.value = "";

}


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
   44. FILE HELPERS
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
        name.endsWith(".ppt") ||
        name.endsWith(".pptx")
    )
        return "PRESENTATION";


    if (
        name.endsWith(".zip") ||
        name.endsWith(".rar")
    )
        return "ARCHIVE";


    return "FILE";

}


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
   45. HTML ESCAPING
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
   46. TOAST
========================================================= */

let toastTimer;


function showToast(message) {

    const toast =
        $("#paperToast");


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
   47. END
========================================================= */