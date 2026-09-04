/* =========================================================
   RiGiD — STUDY PAGE
   Clean corrected study.js
========================================================= */

let studyData = null;
let currentWorkId = null;
let editingTimelineId = null;
let toastTimer = null;

const SUPABASE_FUNCTIONS_URL =
    "https://mmmsmncmskvuqyhaqcne.supabase.co/functions/v1";

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadStudyData();
        normalizeStudyData();
        initializeStudyPage();
    } catch (error) {
        console.error("Unable to load Study:", error);
        alert(error.message || "Unable to load this Study.");
    }
});

/* =========================================================
   DATA LOAD / SAVE
========================================================= */

async function loadStudyData() {
    currentWorkId = new URLSearchParams(window.location.search).get("work_id");

    if (!currentWorkId) {
        throw new Error("Study ID is missing from the URL.");
    }

    const { data: { session }, error: sessionError } =
        await window.sb.auth.getSession();

    if (sessionError || !session) {
        throw new Error("You must be logged in to open this Study.");
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
        throw new Error(result.error || "Unable to load Study data.");
    }

    studyData = convertRigidDataToStudyData(result.data || {}, result.work || {});
}

async function saveStudyData() {
    if (!currentWorkId || !studyData) {
        throw new Error("Study data is not loaded.");
    }

    const { data: { session }, error: sessionError } =
        await window.sb.auth.getSession();

    if (sessionError || !session) {
        throw new Error("You must be logged in to save this Study.");
    }

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
                data: convertStudyDataToRigidData(studyData)
            })
        }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save Study data.");
    }

    return result;
}

/* =========================================================
   DATA CONVERSION
========================================================= */

function convertRigidDataToStudyData(data, work) {
    const workspace = data.workspace || {};
    const study = data.study || {};

    return {
        id: workspace.id || work.id || currentWorkId,
        topic: workspace.title || work.title || "Untitled Study",
        introduction: study.introduction || "",
        objective: study.objective || "",
        owner: study.owner || workspace.owner || "You",
        createdAt: workspace.createdAt || null,
        updatedAt: workspace.updatedAt || null,
        createdDate: formatDate(workspace.createdAt),
        updatedDate: formatDate(workspace.updatedAt),
        status: workspace.status || "in-progress",
        confidence: Number(study.confidence ?? 0),
        tags: Array.isArray(study.tags) ? study.tags : [],
        learning: Array.isArray(study.learning) ? study.learning : [],
        knowledge: Array.isArray(data.knowledge) ? data.knowledge : [],
        concepts: Array.isArray(data.concepts) ? data.concepts : [],
        problems: Array.isArray(data.problems) ? data.problems : [],
        resources: Array.isArray(data.resources) ? data.resources : [],
        timeline: Array.isArray(data.tasks) ? data.tasks : [],
        futureWork: Array.isArray(data.futureWork) ? data.futureWork : [],
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
        relatedWork: Array.isArray(data.relatedWork) ? data.relatedWork : [],
        nextStudy: study.nextStudy || "",
        reflection: study.reflection || ""
    };
}

function convertStudyDataToRigidData(study) {
    const now = new Date().toISOString();

    return {
        version: 1,
        workspace: {
            id: study.id,
            type: "study",
            title: study.topic,
            status: study.status || "in-progress",
            createdAt: study.createdAt || now,
            updatedAt: now
        },
        study: {
            introduction: study.introduction || "",
            objective: study.objective || "",
            owner: study.owner || "You",
            tags: Array.isArray(study.tags) ? study.tags : [],
            confidence: Number(study.confidence ?? 0),
            learning: Array.isArray(study.learning) ? study.learning : [],
            nextStudy: study.nextStudy || "",
            reflection: study.reflection || ""
        },
        knowledge: study.knowledge || [],
        concepts: study.concepts || [],
        problems: study.problems || [],
        resources: study.resources || [],
        tasks: study.timeline || [],
        futureWork: study.futureWork || [],
        attachments: study.attachments || [],
        relatedWork: study.relatedWork || []
    };
}

function normalizeStudyData() {
    if (!studyData) return;

    [
        "tags", "learning", "knowledge", "concepts", "problems",
        "resources", "timeline", "futureWork", "attachments", "relatedWork"
    ].forEach(key => {
        if (!Array.isArray(studyData[key])) studyData[key] = [];
    });

    studyData.confidence = Math.max(
        0,
        Math.min(5, Number(studyData.confidence) || 0)
    );
}

/* =========================================================
   INITIALIZATION
========================================================= */

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
    setupRelatedWork();
    setupTimeline();
    setupFutureWork();
    setupUploads();
    setupLinks();
    setupReflection();
    setupGeneralControls();
    setupModalControls();
    setupStudyHeader();
    initializeStudyClock();
}

/* =========================================================
   GENERAL INFORMATION
========================================================= */

function loadStudyInformation() {
    setText("studyTopic", studyData.topic);
    setText("studyIntroduction", studyData.introduction || "No introduction added.");
    setText("studyOwner", studyData.owner || "You");
    setText("studyCreatedDate", studyData.createdDate || "—");
    setText("studyUpdatedDate", studyData.updatedDate || "—");
    setText("studyStatus", getStatusLabel(studyData.status));
    setText("learningObjective", studyData.objective || "—");
    setText("nextFocus", studyData.nextStudy || "—");

    const container = $("#studyTags");
    if (container) {
        container.innerHTML = "";
        studyData.tags.forEach(tag => {
            const span = document.createElement("span");
            span.textContent = tag;
            container.appendChild(span);
        });
    }
}

function getStatusLabel(status) {
    const labels = {
        "not-started": "○ NOT STARTED",
        "planned": "○ PLANNED",
        "in-progress": "● IN PROGRESS",
        "completed": "● COMPLETED",
        "paused": "Ⅱ PAUSED",
        "archived": "● ARCHIVED"
    };
    return labels[status] || "● IN PROGRESS";
}

/* =========================================================
   MODALS
========================================================= */

function openModal(selector) {
    $(selector)?.classList.remove("hidden");
}

function closeModal(selector) {
    $(selector)?.classList.add("hidden");
}

function closeAllModals() {
    $$(".study-modal").forEach(modal => modal.classList.add("hidden"));
}

function setupModalControls() {
    const controls = [
        ["#closeStudyEditModal", "#studyEditModal"], ["#cancelStudyEdit", "#studyEditModal"],
        ["#closeLearningModal", "#learningModal"], ["#cancelLearning", "#learningModal"],
        ["#closeObjectiveModal", "#objectiveModal"], ["#cancelObjective", "#objectiveModal"],
        ["#closeKnowledgeModal", "#knowledgeModal"], ["#cancelKnowledge", "#knowledgeModal"],
        ["#closeConceptModal", "#conceptModal"], ["#cancelConcept", "#conceptModal"],
        ["#closeProblemModal", "#problemModal"], ["#cancelProblem", "#problemModal"],
        ["#closeResourceModal", "#resourceModal"], ["#cancelResource", "#resourceModal"],
        ["#closeRelatedWorkModal", "#relatedWorkModal"], ["#cancelRelatedWork", "#relatedWorkModal"],
        ["#closeFutureWorkModal", "#futureWorkModal"], ["#cancelFutureWork", "#futureWorkModal"],
        ["#closeLinkModal", "#linkModal"], ["#cancelLink", "#linkModal"],
        ["#closeTimelineModal", "#timelineModal"], ["#cancelTimeline", "#timelineModal"]
    ];

    controls.forEach(([button, modal]) => {
        $(button)?.addEventListener("click", () => closeModal(modal));
    });

    $$(".study-modal").forEach(modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal) closeModal(`#${modal.id}`);
        });
    });
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeAllModals();
});

/* =========================================================
   CONFIDENCE
========================================================= */

function renderConfidence() {
    setText("confidenceValue", `${studyData.confidence} / 5`);
    setText("summaryConfidence", `${studyData.confidence} / 5`);

    $$(".confidence").forEach((bar, index) => {
        bar.classList.toggle("active", index < studyData.confidence);
    });

    $$(".confidence-actions button").forEach(button => {
        button.classList.toggle(
            "active",
            Number(button.dataset.confidence) === studyData.confidence
        );
    });
}

function setupConfidence() {
    $$(".confidence-actions button").forEach(button => {
        button.addEventListener("click", async () => {
            const previous = studyData.confidence;
            studyData.confidence = Number(button.dataset.confidence) || 0;
            renderConfidence();
            updateDate();

            try {
                await saveStudyData();
                showToast("Confidence updated.");
            } catch (error) {
                studyData.confidence = previous;
                renderConfidence();
                showToast(error.message || "Unable to save confidence.");
            }
        });
    });
}

/* =========================================================
   LEARNING
========================================================= */

function renderLearning() {
    const container = $("#learningContent");
    if (!container) return;

    container.innerHTML = "";

    studyData.learning.forEach((item, index) => {
        const row = document.createElement("article");
        row.className = "learning-item";
        row.innerHTML = `
      <span class="learning-index">${String(index + 1).padStart(2, "0")}</span>
      <div class="learning-content">
        <h3>${escapeHTML(item.title || item.text || "")}</h3>
        <p>${escapeHTML(item.description || "")}</p>
      </div>
    `;
        container.appendChild(row);
    });
}

function setupLearning() {
    $("#editLearning")?.addEventListener("click", () => {
        const input = $("#learningInput");
        if (input) {
            input.value = studyData.learning
                .map(item => item.title || item.text || "")
                .filter(Boolean)
                .join("\n");
        }
        openModal("#learningModal");
        input?.focus();
    });

    $("#saveLearning")?.addEventListener("click", saveLearning);
}

async function saveLearning() {
    const value = $("#learningInput")?.value.trim();
    if (!value) return showToast("Enter what you learned.");

    const previous = clone(studyData.learning);
    studyData.learning = value.split("\n").map(line => line.trim()).filter(Boolean)
        .map(line => ({ id: generateID("learning"), title: line, description: "" }));

    renderLearning();
    updateDate();

    try {
        await saveStudyData();
        closeModal("#learningModal");
        showToast("Learning updated and saved.");
    } catch (error) {
        studyData.learning = previous;
        renderLearning();
        showToast(error.message || "Unable to save learning.");
    }
}

/* =========================================================
   OBJECTIVE
========================================================= */

function setupGeneralControls() {
    $("#editStudy")?.addEventListener("click", () => {
        setValue("studyTopicInput", studyData.topic);
        setValue("studyIntroductionInput", studyData.introduction);
        openModal("#studyEditModal");
    });

    $("#saveStudyEdit")?.addEventListener("click", saveStudyEdit);

    $("#editObjective")?.addEventListener("click", () => {
        setValue("objectiveInput", studyData.objective);
        openModal("#objectiveModal");
        $("#objectiveInput")?.focus();
    });
    $("#deleteObjective")?.addEventListener(
    "click",
    deleteObjective
);

    $("#saveObjective")?.addEventListener("click", saveObjective);

    $("#archiveStudy")?.addEventListener("click", archiveStudy);
}

async function saveStudyEdit() {
    const topic = $("#studyTopicInput")?.value.trim();
    const introduction = $("#studyIntroductionInput")?.value.trim();

    if (!topic) return showToast("Enter a study title.");

    const previous = { topic: studyData.topic, introduction: studyData.introduction };
    studyData.topic = topic;
    studyData.introduction = introduction || "";
    loadStudyInformation();
    updateDate();

    try {
        await saveStudyData();
        closeModal("#studyEditModal");
        showToast("Study updated and saved.");
    } catch (error) {
        Object.assign(studyData, previous);
        loadStudyInformation();
        showToast(error.message || "Unable to save study.");
    }
}

async function saveObjective() {
    const objective = $("#objectiveInput")?.value.trim();
    if (!objective) return showToast("Enter a learning objective.");

    const previous = studyData.objective;
    studyData.objective = objective;
    loadStudyInformation();
    updateDate();

    try {
        await saveStudyData();
        closeModal("#objectiveModal");
        showToast("Objective updated and saved.");
    } catch (error) {
        studyData.objective = previous;
        loadStudyInformation();
        showToast(error.message || "Unable to save objective.");
    }
}

async function archiveStudy() {
    if (!window.confirm("Mark this study as archived?")) return;

    const previous = studyData.status;
    studyData.status = "archived";
    loadStudyInformation();
    updateDate();

    try {
        await saveStudyData();
        showToast("Study archived.");
    } catch (error) {
        studyData.status = previous;
        loadStudyInformation();
        showToast(error.message || "Unable to archive study.");
    }
}

/* =========================================================
   KNOWLEDGE — MODAL INPUT
========================================================= */

/* =========================================================
   KNOWLEDGE
========================================================= */

function renderKnowledge() {

    const container =
        $("#knowledgeList");


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    studyData.knowledge.forEach(
        (
            item,
            index
        ) => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "knowledge-item";


            element.innerHTML =
                `

                <span class="knowledge-number">
                    ${String(index + 1).padStart(2, "0")}
                </span>


                <p>
                    ${escapeHTML(
                        item.text ||
                        item.title ||
                        ""
                    )}
                </p>


                <button
    type="button"
    class="delete-item-button knowledge-delete-button"
    data-delete-knowledge="${escapeAttribute(item.id)}"
>
    Delete
</button>

            `;


            container.appendChild(
                element
            );

        }
    );


    $$("[data-delete-knowledge]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteKnowledge(
                            button.dataset.deleteKnowledge
                        );

                    }
                );

            }
        );

}

async function deleteKnowledge(
    id
) {

    await deleteStudyArrayItem(

        "knowledge",

        id,

        renderKnowledge,

        "Knowledge deleted successfully.",

        "Delete this knowledge item?"

    );

}

function setupKnowledge() {
    $("#addKnowledge")?.addEventListener("click", () => {
        setValue("knowledgeInput", "");
        openModal("#knowledgeModal");
        $("#knowledgeInput")?.focus();
    });

    $("#saveKnowledge")?.addEventListener("click", saveKnowledge);
}

async function saveKnowledge() {
    const text = $("#knowledgeInput")?.value.trim();
    if (!text) return showToast("Enter the knowledge you gained.");

    const previous = clone(studyData.knowledge);
    studyData.knowledge.unshift({ id: generateID("knowledge"), text });

    renderKnowledge();
    updateSummary();
    updateDate();

    try {
        await saveStudyData();
        closeModal("#knowledgeModal");
        setValue("knowledgeInput", "");
        showToast("Knowledge added and saved.");
    } catch (error) {
        studyData.knowledge = previous;
        renderKnowledge();
        updateSummary();
        showToast(error.message || "Unable to save knowledge.");
    }
}

/* =========================================================
   CONCEPTS — MODAL INPUT
========================================================= */

/* =========================================================
   CONCEPTS
========================================================= */

function renderConcepts() {

    const container =
        $("#conceptGrid");


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    studyData.concepts.forEach(
        (
            concept,
            index
        ) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "concept-card";


            card.innerHTML =
                `

                <span class="concept-index">
                    ${String(index + 1).padStart(2, "0")}
                </span>


                <h3>
                    ${escapeHTML(
                        concept.title ||
                        ""
                    )}
                </h3>


                <p>
                    ${escapeHTML(
                        concept.description ||
                        ""
                    )}
                </p>


                <span
                    class="concept-status ${escapeHTML(
                        concept.status ||
                        "learning"
                    )}"
                >
                    ${escapeHTML(
                        getConceptStatus(
                            concept.status
                        )
                    )}
                </span>


                <button
                    type="button"
                    class="delete-item-button"
                    data-delete-concept="${escapeAttribute(
                        concept.id
                    )}"
                >
                    Delete
                </button>

            `;


            container.appendChild(
                card
            );

        }
    );


    $$("[data-delete-concept]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteConcept(
                            button.dataset.deleteConcept
                        );

                    }
                );

            }
        );

}
async function deleteConcept(
    id
) {

    await deleteStudyArrayItem(

        "concepts",

        id,

        renderConcepts,

        "Concept deleted successfully.",

        "Delete this concept?"

    );

}
function getConceptStatus(status) {
    return {
        understood: "UNDERSTOOD",
        reviewing: "REVIEW",
        learning: "LEARNING",
        strong: "STRONG",
        mastered: "MASTERED"
    }[String(status || "").toLowerCase()] || "LEARNING";
}

function setupConcepts() {
    $("#addConcept")?.addEventListener("click", () => {
        setValue("conceptTitleInput", "");
        setValue("conceptDescriptionInput", "");
        setValue("conceptLevelInput", "learning");
        openModal("#conceptModal");
        $("#conceptTitleInput")?.focus();
    });

    $("#saveConcept")?.addEventListener("click", saveConcept);
}

async function saveConcept() {
    const title = $("#conceptTitleInput")?.value.trim();
    const description = $("#conceptDescriptionInput")?.value.trim();
    const status = $("#conceptLevelInput")?.value || "learning";

    if (!title) return showToast("Enter a concept name.");

    const previous = clone(studyData.concepts);
    studyData.concepts.push({
        id: generateID("concept"),
        title,
        description: description || "Concept added.",
        status: normalizeConceptStatus(status)
    });

    renderConcepts();
    updateSummary();
    updateDate();

    try {
        await saveStudyData();
        closeModal("#conceptModal");
        showToast("Concept added and saved.");
    } catch (error) {
        studyData.concepts = previous;
        renderConcepts();
        updateSummary();
        showToast(error.message || "Unable to save concept.");
    }
}

function normalizeConceptStatus(status) {
    const allowed = ["understood", "reviewing", "learning", "strong", "mastered"];
    status = String(status || "").toLowerCase().trim();
    return allowed.includes(status) ? status : "learning";
}

/* =========================================================
   PROBLEMS
========================================================= */

/* =========================================================
   PROBLEMS
========================================================= */

function renderProblems() {

    const container =
        $("#problemsList");


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    studyData.problems.forEach(
        problem => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "problem-item";


            item.innerHTML =
                `

                <div class="problem-main">

                    <h3>
                        ${escapeHTML(
                            problem.title ||
                            "Untitled Problem"
                        )}
                    </h3>


                    <p>
                        ${escapeHTML(
                            problem.description ||
                            ""
                        )}
                    </p>

                </div>


                <span
                    class="problem-status ${escapeHTML(
                        problem.status ||
                        "open"
                    )}"
                >
                    ${escapeHTML(
                        String(
                            problem.status ||
                            "open"
                        ).toUpperCase()
                    )}
                </span>


                <button
                    type="button"
                    class="delete-item-button"
                    data-delete-problem="${escapeAttribute(
                        problem.id
                    )}"
                >
                    Delete
                </button>

            `;


            container.appendChild(
                item
            );

        }
    );


    $$("[data-delete-problem]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteProblem(
                            button.dataset.deleteProblem
                        );

                    }
                );

            }
        );

}

async function deleteProblem(
    id
) {

    await deleteStudyArrayItem(

        "problems",

        id,

        renderProblems,

        "Problem deleted successfully.",

        "Delete this problem?"

    );

}

function setupProblems() {
    $("#addProblem")?.addEventListener("click", () => {
        setValue("problemTitleInput", "");
        setValue("problemDescriptionInput", "");
        openModal("#problemModal");
        $("#problemTitleInput")?.focus();
    });

    $("#saveProblem")?.addEventListener("click", saveProblem);
}

async function saveProblem() {
    const title = $("#problemTitleInput")?.value.trim();
    const description = $("#problemDescriptionInput")?.value.trim();

    if (!title) return showToast("Enter a problem or doubt.");

    const previous = clone(studyData.problems);
    studyData.problems.unshift({
        id: generateID("problem"),
        title,
        description: description || "",
        status: "open"
    });

    renderProblems();
    updateSummary();
    updateDate();

    try {
        await saveStudyData();
        closeModal("#problemModal");
        showToast("Problem added and saved.");
    } catch (error) {
        studyData.problems = previous;
        renderProblems();
        updateSummary();
        showToast(error.message || "Unable to save problem.");
    }
}

/* =========================================================
   RESOURCES — MODAL INPUT
========================================================= */

/* =========================================================
   RESOURCES
========================================================= */

function renderResources() {

    const container =
        $("#resourcesList");


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    studyData.resources.forEach(
        resource => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "resource-card";


            card.innerHTML =
                `

                <div class="resource-icon">

                    ${escapeHTML(
                        resource.type ||
                        "RESOURCE"
                    )}

                </div>


                <div class="resource-info">

                    <h3>
                        ${escapeHTML(
                            resource.title ||
                            ""
                        )}
                    </h3>


                    <p>
                        ${escapeHTML(
                            resource.description ||
                            ""
                        )}
                    </p>


                    <span>
                        ${escapeHTML(
                            resource.type ||
                            ""
                        )}
                    </span>

                </div>


                ${
                    resource.url

                        ? `

                            <a
                                class="resource-open"
                                href="${escapeAttribute(
                                    resource.url
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Open
                            </a>

                        `

                        : `

                            <span class="resource-open">
                                Saved
                            </span>

                        `
                }


                <button
                    type="button"
                    class="delete-item-button"
                    data-delete-resource="${escapeAttribute(
                        resource.id
                    )}"
                >
                    Delete
                </button>

            `;


            container.appendChild(
                card
            );

        }
    );


    $$("[data-delete-resource]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteResource(
                            button.dataset.deleteResource
                        );

                    }
                );

            }
        );

}

async function deleteResource(
    id
) {

    await deleteStudyArrayItem(

        "resources",

        id,

        renderResources,

        "Resource deleted successfully.",

        "Delete this resource?"

    );

}

function setupResources() {
    $("#addResource")?.addEventListener("click", () => {
        setValue("resourceTitleInput", "");
        setValue("resourceURLInput", "");
        setValue("resourceDescriptionInput", "");
        setValue("resourceTypeInput", "website");
        openModal("#resourceModal");
        $("#resourceTitleInput")?.focus();
    });

    $("#saveResource")?.addEventListener("click", saveResource);
}

async function saveResource() {
    const title = $("#resourceTitleInput")?.value.trim();
    const type = $("#resourceTypeInput")?.value || "other";
    const url = $("#resourceURLInput")?.value.trim();
    const description = $("#resourceDescriptionInput")?.value.trim();

    if (!title) return showToast("Enter a resource title.");

    const previous = clone(studyData.resources);
    studyData.resources.unshift({
        id: generateID("resource"),
        title,
        type: String(type).toUpperCase(),
        url: url ? normalizeURL(url) : null,
        description: description || "Study resource."
    });

    renderResources();
    updateSummary();
    updateDate();

    try {
        await saveStudyData();
        closeModal("#resourceModal");
        showToast("Resource added and saved.");
    } catch (error) {
        studyData.resources = previous;
        renderResources();
        updateSummary();
        showToast(error.message || "Unable to save resource.");
    }
}

/* =========================================================
   RELATED WORK — + LINK
========================================================= */

/* =========================================================
   RELATED WORK
========================================================= */

function renderRelatedWork() {

    const container =
        $("#relatedWorkGrid");


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    studyData.relatedWork.forEach(
        work => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                `related-work-card ${
                    String(
                        work.type ||
                        "external"
                    ).toLowerCase()
                }`;


            card.innerHTML =
                `

                <span>
                    ${escapeHTML(
                        work.type ||
                        "RELATED"
                    )}
                </span>


                <h3>
                    ${escapeHTML(
                        work.title ||
                        ""
                    )}
                </h3>


                <p>
                    ${escapeHTML(
                        work.description ||
                        ""
                    )}
                </p>


                <div class="related-work-actions">

                    <button
                        type="button"
                        data-related-work="${escapeAttribute(
                            work.id
                        )}"
                    >
                        Open →
                    </button>


                    <button
                        type="button"
                        class="delete-item-button"
                        data-delete-related-work="${escapeAttribute(
                            work.id
                        )}"
                    >
                        Delete
                    </button>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );


    $$("[data-related-work]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const work =
                            studyData.relatedWork.find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        button.dataset
                                            .relatedWork
                                    )
                            );


                        if (
                            work?.url &&
                            /^https?:\/\//i.test(
                                work.url
                            )
                        ) {

                            window.open(
                                work.url,
                                "_blank",
                                "noopener,noreferrer"
                            );

                        }

                        else {

                            showToast(
                                "No web link is available for this item."
                            );

                        }

                    }
                );

            }
        );


    $$("[data-delete-related-work]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteRelatedWork(
                            button.dataset
                                .deleteRelatedWork
                        );

                    }
                );

            }
        );

}

async function deleteRelatedWork(
    id
) {

    await deleteStudyArrayItem(

        "relatedWork",

        id,

        renderRelatedWork,

        "Related work deleted successfully.",

        "Delete this related work?"

    );

}

function setupRelatedWork() {
    $("#addRelatedWork")?.addEventListener("click", () => {
        setValue("relatedWorkTitleInput", "");
        setValue("relatedWorkURLInput", "");
        setValue("relatedWorkDescriptionInput", "");
        setValue("relatedWorkTypeInput", "study");
        openModal("#relatedWorkModal");
        $("#relatedWorkTitleInput")?.focus();
    });

    $("#saveRelatedWork")?.addEventListener("click", saveRelatedWork);
}

async function saveRelatedWork() {
    const title = $("#relatedWorkTitleInput")?.value.trim();
    const type = $("#relatedWorkTypeInput")?.value || "study";
    const url = $("#relatedWorkURLInput")?.value.trim();
    const description = $("#relatedWorkDescriptionInput")?.value.trim();

    if (!title) return showToast("Enter a title for the related work.");

    const previous = clone(studyData.relatedWork);
    studyData.relatedWork.push({
        id: generateID("related"),
        type: String(type).toUpperCase(),
        title,
        url: url ? normalizeURL(url) : null,
        description: description || "Related work."
    });

    renderRelatedWork();
    updateDate();

    try {
        await saveStudyData();
        closeModal("#relatedWorkModal");
        showToast("Related work added and saved.");
    } catch (error) {
        studyData.relatedWork = previous;
        renderRelatedWork();
        showToast(error.message || "Unable to save related work.");
    }
}

/* =========================================================
   TIMELINE
========================================================= */

function renderTimeline() {
    const container = $("#studyTimeline");
    if (!container) return;

    container.innerHTML = "";

    [...studyData.timeline]
        .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
        .forEach(entry => {
            const item = document.createElement("article");
            item.className = "study-timeline-item";

            if (entry.status === "ongoing") item.classList.add("current");

            item.innerHTML = `
        <div class="timeline-point"></div>
        <div class="timeline-date">${escapeHTML(formatDate(entry.date))}</div>
        <div class="timeline-card">
          <div class="timeline-card-top">
            <div>
              <span class="timeline-status ${escapeHTML(entry.status || "planned")}">
                ${escapeHTML(String(entry.status || "planned").toUpperCase())}
              </span>
              ${entry.priority === "high" ? `<span class="timeline-priority">HIGH</span>` : ""}
            </div>
            <div class="timeline-actions">
              <button type="button" data-edit-timeline="${escapeAttribute(entry.id)}">Edit</button>
              <button type="button" data-delete-timeline="${escapeAttribute(entry.id)}">×</button>
            </div>
          </div>
          <h3>${escapeHTML(entry.title || "")}</h3>
          <p>${escapeHTML(entry.description || "")}</p>
          <span>${escapeHTML(entry.duration || "Time not specified")}</span>
        </div>
      `;
            container.appendChild(item);
        });

    $$("[data-edit-timeline]").forEach(button => {
        button.addEventListener("click", () => editTimeline(button.dataset.editTimeline));
    });

    $$("[data-delete-timeline]").forEach(button => {
        button.addEventListener("click", () => deleteTimeline(button.dataset.deleteTimeline));
    });
}

function setupTimeline() {
    $("#addStudySession")?.addEventListener("click", () => {
        editingTimelineId = null;
        resetTimelineForm();
        setValue("timelineDate", getTodayISO());
        setValue("timelineStatus", "planned");
        openModal("#timelineModal");
    });

    $("#saveTimeline")?.addEventListener("click", saveTimeline);
}

function resetTimelineForm() {
    ["timelineDate", "timelineTitle", "timelineDescription", "timelineDuration"].forEach(id => setValue(id, ""));
    setValue("timelineStatus", "planned");
    setValue("timelinePriority", "normal");
}

function editTimeline(id) {
    const entry = studyData.timeline.find(item => String(item.id) === String(id));
    if (!entry) return;

    editingTimelineId = entry.id;
    setValue("timelineDate", entry.date || "");
    setValue("timelineStatus", entry.status || "planned");
    setValue("timelineTitle", entry.title || "");
    setValue("timelineDescription", entry.description || "");
    setValue("timelineDuration", entry.duration || "");
    setValue("timelinePriority", entry.priority || "normal");
    openModal("#timelineModal");
}

async function saveTimeline() {
    const date = $("#timelineDate")?.value;
    const status = $("#timelineStatus")?.value || "planned";
    const title = $("#timelineTitle")?.value.trim();
    const description = $("#timelineDescription")?.value.trim();
    const duration = $("#timelineDuration")?.value.trim();
    const priority = $("#timelinePriority")?.value || "normal";

    if (!date || !title) return showToast("Date and title are required.");

    const previous = clone(studyData.timeline);
    const entry = {
        id: editingTimelineId || generateID("timeline"),
        date, status, title,
        description: description || "",
        duration: duration || "",
        priority
    };

    if (editingTimelineId) {
        const index = studyData.timeline.findIndex(item => String(item.id) === String(editingTimelineId));
        if (index >= 0) studyData.timeline[index] = entry;
    } else {
        studyData.timeline.push(entry);
    }

    syncFutureWorkFromTimeline();
    renderTimeline();
    renderFutureWork();
    updateSummary();
    updateDate();

    try {
        await saveStudyData();
        closeModal("#timelineModal");
        editingTimelineId = null;
        showToast("Timeline saved.");
    } catch (error) {
        studyData.timeline = previous;
        syncFutureWorkFromTimeline();
        renderTimeline();
        renderFutureWork();
        showToast(error.message || "Unable to save timeline.");
    }
}

async function deleteTimeline(id) {
    const previous = clone(studyData.timeline);
    studyData.timeline = studyData.timeline.filter(item => String(item.id) !== String(id));
    syncFutureWorkFromTimeline();
    renderTimeline();
    renderFutureWork();
    updateDate();

    try {
        await saveStudyData();
        showToast("Timeline item deleted.");
    } catch (error) {
        studyData.timeline = previous;
        syncFutureWorkFromTimeline();
        renderTimeline();
        renderFutureWork();
        showToast(error.message || "Unable to delete timeline item.");
    }
}

/* =========================================================
   FUTURE WORK
========================================================= */

function syncFutureWorkFromTimeline() {
    const planned = studyData.timeline
        .filter(entry => entry.status === "planned")
        .map(entry => ({
            id: entry.id,
            date: entry.date,
            title: entry.title,
            description: entry.description,
            priority: entry.priority,
            fromTimeline: true
        }));

    const manual = studyData.futureWork.filter(item => !item.fromTimeline);
    studyData.futureWork = [...manual, ...planned];
}

/* =========================================================
   FUTURE WORK
========================================================= */

function renderFutureWork() {

    const container =
        $("#futureWorkList");


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    studyData.futureWork.forEach(
        item => {

            const row =
                document.createElement(
                    "article"
                );


            row.className =
                "future-work-item";


            row.innerHTML =
                `

                <div>

                    <strong>
                        ${escapeHTML(
                            item.title ||
                            ""
                        )}
                    </strong>


                    <p>
                        ${escapeHTML(
                            item.description ||
                            ""
                        )}
                    </p>


                    ${
                        item.date

                            ? `

                                <span class="future-date">

                                    ${escapeHTML(
                                        formatDate(
                                            item.date
                                        )
                                    )}

                                </span>

                            `

                            : ""
                    }

                </div>


                <button
    type="button"
    class="delete-item-button future-delete-button"
    data-delete-future-work="${escapeAttribute(
        item.id
    )}"
>
    Delete
</button>

            `;


            container.appendChild(
                row
            );

        }
    );


    $$("[data-delete-future-work]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteFutureWork(
                            button.dataset
                                .deleteFutureWork
                        );

                    }
                );

            }
        );


    setText(
        "futureWorkCount",
        String(
            studyData.futureWork.length
        )
    );


    const count =
        document.querySelector(
            ".future-count"
        );


    if (count) {

        count.textContent =
            String(
                studyData.futureWork.length
            ).padStart(
                2,
                "0"
            );

    }

}

async function deleteFutureWork(
    id
) {

    const futureItem =
        studyData.futureWork.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!futureItem) {

        showToast(
            "Future work item not found."
        );

        return;

    }


    const confirmed =
        window.confirm(
            "Delete this future work?"
        );


    if (!confirmed) {

        return;

    }


    /*
     * If this Future Work came from
     * a Timeline entry, delete the
     * Timeline entry as well.
     */

    if (
        futureItem.fromTimeline
    ) {

        await deleteTimeline(
            futureItem.id
        );

        return;

    }


    const previous =
        clone(
            studyData.futureWork
        );


    try {

        studyData.futureWork =
            studyData.futureWork.filter(
                item =>
                    String(item.id) !==
                    String(id)
            );


        renderFutureWork();

        updateDate();


        await saveStudyData();


        showToast(
            "Future work deleted successfully."
        );

    }

    catch (error) {

        studyData.futureWork =
            previous;


        renderFutureWork();


        showToast(

            error.message ||

            "Unable to delete future work."

        );

    }

}

function setupFutureWork() {
    $("#addFutureWork")?.addEventListener("click", () => {
        setValue("futureWorkTitleInput", "");
        setValue("futureWorkDescriptionInput", "");
        openModal("#futureWorkModal");
    });

    $("#saveFutureWork")?.addEventListener("click", saveFutureWork);
}

async function saveFutureWork() {
    const title = $("#futureWorkTitleInput")?.value.trim();
    const description = $("#futureWorkDescriptionInput")?.value.trim();

    if (!title) return showToast("Enter a future work title.");

    const previous = clone(studyData.futureWork);
    studyData.futureWork.push({
        id: generateID("future-work"),
        title,
        description: description || "",
        fromTimeline: false
    });

    renderFutureWork();
    updateDate();

    try {
        await saveStudyData();
        closeModal("#futureWorkModal");
        showToast("Future work added and saved.");
    } catch (error) {
        studyData.futureWork = previous;
        renderFutureWork();
        showToast(error.message || "Unable to save future work.");
    }
}

/* =========================================================
   UPLOADS / ATTACHMENTS
========================================================= */

/* =========================================================
   PERMANENT GOOGLE DRIVE FILE UPLOADS
========================================================= */

function setupUploads() {

    const button = $("#uploadButton");
    const input = $("#studyFileInput");
    const zone = $("#studyUploadZone");


    button?.addEventListener(
        "click",
        () => input?.click()
    );


    zone?.addEventListener(
        "click",
        () => input?.click()
    );


    input?.addEventListener(
        "change",
        async event => {

            await handleFiles(
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
        async event => {

            event.preventDefault();

            zone.classList.remove(
                "dragging"
            );


            await handleFiles(
                event.dataTransfer.files
            );

        }
    );

}


/* =========================================================
   HANDLE FILES
========================================================= */

async function handleFiles(files) {

    if (!files?.length) {
        return;
    }


    const fileList =
        Array.from(files);


    for (const file of fileList) {

        try {

            showToast(
                `Uploading ${file.name}...`
            );


            const uploadedFile =
                await uploadFileToGoogleDrive(
                    file
                );


            studyData.attachments.unshift({

                id:
                    generateID("file"),

                type:
                    "file",

                name:
                    uploadedFile.name ||
                    file.name,

                fileType:
                    getFileType(file),

                size:
                    formatFileSize(
                        Number(
                            uploadedFile.size ||
                            file.size
                        )
                    ),

                date:
                    getTodayISO(),


                /*
                 * Permanent Google Drive information
                 */

                driveFileId:
                    uploadedFile.id,


                /*
                 * Used for opening the file
                 */

                url:
                    uploadedFile.webViewLink,


                /*
                 * Useful later if download support
                 * is added separately.
                 */

                downloadUrl:
                    uploadedFile.webContentLink,


                mimeType:
                    uploadedFile.mimeType ||
                    file.type,


                description:
                    ""

            });


        }

        catch (error) {

            console.error(
                "File upload failed:",
                error
            );


            showToast(

                error.message ||

                `Unable to upload ${file.name}.`

            );

        }

    }


    /*
     * Update UI after all uploads finish.
     */

    renderAttachments();

    updateDate();


    /*
     * Save permanent attachment metadata
     * into rigid-data.json.
     */

    try {

        await saveStudyData();


        showToast(
            `${fileList.length} file${fileList.length > 1 ? "s" : ""} uploaded and saved.`
        );

    }

    catch (error) {

        console.error(
            "Unable to save attachment metadata:",
            error
        );


        showToast(

            error.message ||

            "Files were uploaded but attachment information could not be saved."

        );

    }

}


/* =========================================================
   UPLOAD FILE TO SUPABASE EDGE FUNCTION
========================================================= */

async function uploadFileToGoogleDrive(
    file
) {

    if (!currentWorkId) {

        throw new Error(
            "Study ID is missing."
        );

    }


    const {

        data: {
            session
        },

        error:
            sessionError

    } =

        await window.sb
            .auth
            .getSession();


    if (
        sessionError ||
        !session
    ) {

        throw new Error(
            "You must be logged in to upload files."
        );

    }


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

                headers: {

                    "Authorization":
                        `Bearer ${session.access_token}`

                },


                /*
                 * DO NOT manually set Content-Type here.
                 *
                 * The browser automatically adds the
                 * multipart boundary.
                 */

                body:
                    formData

            }

        );


    let result;


    try {

        result =
            await response.json();

    }

    catch {

        throw new Error(
            "Invalid response from file upload service."
        );

    }


    if (
        !response.ok ||
        !result.success ||
        !result.file
    ) {

        throw new Error(

            result?.error ||

            "Unable to upload file."

        );

    }


    return result.file;

}

function renderAttachments() {
    const container = $("#studyUploadGrid");
    if (!container) return;

    container.innerHTML = "";

    if (!studyData.attachments.length) {
        container.innerHTML = `<div class="empty-state">No files or links added yet.</div>`;
        return;
    }

    studyData.attachments.forEach(attachment => {
        const card = document.createElement("article");
        card.className = attachment.type === "link" ? "link-attachment" : "study-upload-card";

        if (attachment.type === "link") {
            card.innerHTML = `
        <div>
          <div class="link-top"><div class="link-icon">🔗</div><span class="link-type">WEB LINK</span></div>
          <h3>${escapeHTML(attachment.name || "")}</h3>
          <p class="link-description">${escapeHTML(attachment.description || "")}</p>
          <div class="link-url">${escapeHTML(attachment.url || "")}</div>
        </div>
        <div class="upload-actions">
          <button class="upload-action" data-open-attachment="${escapeAttribute(attachment.id)}" type="button">Open</button>
          <button class="upload-action" data-delete-attachment="${escapeAttribute(attachment.id)}" type="button">Delete</button>
        </div>
      `;
        } else {
            card.innerHTML = `
        <div class="upload-preview">${createFilePreview(attachment)}</div>
        <div class="upload-info">
          <span class="upload-name">${escapeHTML(attachment.name || "")}</span>
          <div class="upload-meta">
            <span>${escapeHTML(attachment.fileType || "FILE")}</span>
            <span>${escapeHTML(attachment.size || "")}</span>
          </div>
        </div>
        <div class="upload-actions">
          <button class="upload-action" data-open-attachment="${escapeAttribute(attachment.id)}" type="button">Open</button>
          <button class="upload-action" data-delete-attachment="${escapeAttribute(attachment.id)}" type="button">Delete</button>
        </div>
      `;
        }

        container.appendChild(card);
    });

    $$("[data-open-attachment]").forEach(button => {
        button.addEventListener("click", () => openAttachment(button.dataset.openAttachment));
    });

    $$("[data-delete-attachment]").forEach(button => {
        button.addEventListener("click", () => deleteAttachment(button.dataset.deleteAttachment));
    });
}

function createFilePreview(attachment) {
    if (attachment.fileType === "IMAGE" && attachment.url) {
        return `<img src="${escapeAttribute(attachment.url)}" alt="${escapeHTML(attachment.name)}">`;
    }
    if (attachment.fileType === "VIDEO" && attachment.url) {
        return `<video src="${escapeAttribute(attachment.url)}" muted></video>`;
    }
    return escapeHTML(attachment.fileType || "FILE");
}

function openAttachment(id) {

    const attachment =
        studyData.attachments.find(
            item =>
                item.id === id
        );


    if (!attachment) {

        showToast(
            "Attachment not found."
        );

        return;

    }


    /*
     * External links
     */

    if (
        attachment.type ===
        "link"
    ) {

        if (attachment.url) {

            window.open(
                attachment.url,
                "_blank",
                "noopener,noreferrer"
            );

        }

        return;

    }


    /*
     * Permanent Google Drive file
     */

    const fileURL =

        attachment.url ||

        attachment.webViewLink ||

        (

            attachment.driveFileId

                ? `https://drive.google.com/file/d/${attachment.driveFileId}/view`

                : null

        );


    if (!fileURL) {

        showToast(
            "This file does not have a valid Drive link."
        );

        return;

    }


    window.open(
        fileURL,
        "_blank",
        "noopener,noreferrer"
    );

}

/* =========================================================
   DELETE ATTACHMENT
========================================================= */

async function deleteAttachment(
    id
) {

    const attachment =
        studyData.attachments.find(
            item =>
                item.id === id
        );


    if (!attachment) {

        showToast(
            "Attachment not found."
        );

        return;

    }


    const confirmed =
        window.confirm(

            `Delete "${attachment.name}"?`

        );


    if (!confirmed) {

        return;

    }


    try {


        /*
         * Show deletion progress.
         */

        showToast(
            `Deleting ${attachment.name}...`
        );


        /*
         * Delete the actual Google Drive file.
         *
         * Only normal uploaded files have
         * driveFileId.
         *
         * Links do not have an actual
         * Google Drive file.
         */

        if (
            attachment.type ===
            "file" &&

            attachment.driveFileId
        ) {

            await deleteFileFromGoogleDrive(

                attachment.driveFileId

            );

        }


        /*
         * Remove attachment from Study data.
         */

        studyData.attachments =
            studyData.attachments.filter(

                item =>
                    item.id !== id

            );


        /*
         * Update the UI immediately.
         */

        renderAttachments();


        updateDate();


        /*
         * Permanently save the updated
         * attachment list.
         */

        await saveStudyData();


        showToast(
            "Attachment deleted successfully."
        );


    }

    catch (error) {

        console.error(
            "Attachment deletion failed:",
            error
        );


        showToast(

            error.message ||

            "Unable to delete attachment."

        );

    }

}

/* =========================================================
   ADD LINK — MODAL INPUT
========================================================= */

function setupLinks() {
    $("#addLinkButton")?.addEventListener("click", () => {
        setValue("linkTitleInput", "");
        setValue("linkURLInput", "");
        setValue("linkDescriptionInput", "");
        openModal("#linkModal");
        $("#linkTitleInput")?.focus();
    });

    $("#saveLink")?.addEventListener("click", saveLink);
}

async function saveLink() {
    const title = $("#linkTitleInput")?.value.trim();
    const url = $("#linkURLInput")?.value.trim();
    const description = $("#linkDescriptionInput")?.value.trim();

    if (!title || !url) return showToast("Title and URL are required.");

    const previous = clone(studyData.attachments);
    studyData.attachments.unshift({
        id: generateID("link"),
        type: "link",
        name: title,
        url: normalizeURL(url),
        description: description || "Study reference.",
        date: getTodayISO()
    });

    renderAttachments();
    updateDate();

    try {
        await saveStudyData();
        closeModal("#linkModal");
        showToast("Link added and saved.");
    } catch (error) {
        studyData.attachments = previous;
        renderAttachments();
        showToast(error.message || "Unable to save link.");
    }
}

/* =========================================================
   REFLECTION
========================================================= */

function loadReflection() {
    setValue("nextStudy", studyData.nextStudy || "");
}

function setupReflection() {
    $("#saveReflection")?.addEventListener("click", async () => {
        const previous = studyData.nextStudy;
        studyData.nextStudy = $("#nextStudy")?.value.trim() || "";
        setText("nextFocus", studyData.nextStudy || "—");
        updateDate();

        try {
            await saveStudyData();
            showToast("Study plan saved.");
        } catch (error) {
            studyData.nextStudy = previous;
            loadReflection();
            setText("nextFocus", previous || "—");
            showToast(error.message || "Unable to save study plan.");
        }
    });
}

/* =========================================================
   SUMMARY / NAVIGATION
========================================================= */

function updateSummary() {
    setText("summaryConfidence", `${studyData.confidence} / 5`);
    setText("summaryConcepts", String(studyData.concepts.length));
    setText(
        "summaryProblems",
        String(studyData.problems.filter(item => item.status === "open").length)
    );
    setText("knowledgeCount", String(studyData.knowledge.length));
    setText("conceptsCount", String(studyData.concepts.length));
    setText("problemsCount", String(studyData.problems.length));
    setText("resourcesCount", String(studyData.resources.length));
}

function setupNavigation() {
    $$("[data-section]").forEach(button => {
        button.addEventListener("click", () => {
            const target = document.getElementById(button.dataset.section)
                || document.getElementById(`${button.dataset.section}Section`);
            target?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}

/* =========================================================
   UTILITIES
========================================================= */

function updateDate() {
    const now = new Date();
    studyData.updatedAt = now.toISOString();
    studyData.updatedDate = formatDate(now);
    setText("studyUpdatedDate", studyData.updatedDate);
}

function getTodayISO() {
    return new Date().toISOString().split("T")[0];
}

function formatDate(value) {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getFileType(file) {
    const name = file.name.toLowerCase();
    if (file.type.startsWith("image/")) return "IMAGE";
    if (file.type.startsWith("video/")) return "VIDEO";
    if (file.type === "application/pdf") return "PDF";
    if (file.type.includes("word") || /\.(doc|docx)$/.test(name)) return "DOCUMENT";
    if (file.type.includes("sheet") || /\.(xls|xlsx|csv)$/.test(name)) return "SPREADSHEET";
    if (file.type.includes("zip") || /\.(zip|rar|7z)$/.test(name)) return "ARCHIVE";
    return "FILE";
}

function formatFileSize(bytes) {
    if (!bytes) return "0 KB";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function normalizeURL(url) {
    const value = String(url || "").trim();
    if (!value) return "";
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function generateID(prefix = "item") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value ?? "";
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value ?? "";
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

function showToast(message) {
    const toast = $("#studyToast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hidden");
    }, 2500);
}
/* =========================================================
   STUDY HEADER
========================================================= */

function setupStudyHeader() {

    const backButton =
        document.getElementById(
            "backToWorkspace"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                /*
                 * Return to the previous page if the user
                 * came from the Personal Workspace.
                 */

                if (
                    window.history.length > 1
                ) {

                    window.history.back();

                    return;

                }


                /*
                 * Fallback location.
                 *
                 * Change this path only if your Personal
                 * Workspace HTML is located somewhere else.
                 */

                window.location.href =
                    "../../personal.html";

            }
        );

    }

}


/* =========================================================
   LIVE STUDY CLOCK
========================================================= */

function initializeStudyClock() {

    const dateElement =
        document.getElementById(
            "liveDate"
        );


    const clockElement =
        document.getElementById(
            "liveClock"
        );


    if (
        !dateElement &&
        !clockElement
    ) {

        return;

    }


    function updateStudyClock() {

        const now =
            new Date();


        /*
         * Date
         */

        if (dateElement) {

            dateElement.textContent =
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


        /*
         * Time
         */

        if (clockElement) {

            clockElement.textContent =
                now.toLocaleTimeString(
                    "en-IN",
                    {
                        hour:
                            "2-digit",

                        minute:
                            "2-digit",

                        second:
                            "2-digit",

                        hour12:
                            true
                    }
                );

        }

    }


    /*
     * Show immediately.
     */

    updateStudyClock();


    /*
     * Update every second.
     */

    setInterval(
        updateStudyClock,
        1000
    );

}

/* =========================================================
   DELETE FILE FROM GOOGLE DRIVE
========================================================= */

async function deleteFileFromGoogleDrive(
    driveFileId
) {

    if (!currentWorkId) {

        throw new Error(
            "Study ID is missing."
        );

    }


    if (!driveFileId) {

        throw new Error(
            "Google Drive file ID is missing."
        );

    }


    const {

        data: {
            session
        },

        error:
            sessionError

    } =

        await window.sb
            .auth
            .getSession();


    if (
        sessionError ||
        !session
    ) {

        throw new Error(
            "You must be logged in to delete files."
        );

    }


    const response =
        await fetch(

            `${SUPABASE_FUNCTIONS_URL}/delete-rigid-file`,

            {

                method:
                    "POST",

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
                            driveFileId

                    })

            }

        );


    let result;


    try {

        result =
            await response.json();

    }

    catch {

        throw new Error(
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
   DELETE OBJECTIVE
========================================================= */

async function deleteObjective() {

    const currentObjective =
        studyData.objective;


    /*
     * Check whether an objective exists.
     */

    if (
        !currentObjective ||
        !currentObjective.trim()
    ) {

        showToast(
            "There is no objective to delete."
        );

        return;

    }


    /*
     * Ask for confirmation.
     */

    const confirmed =
        window.confirm(
            "Are you sure you want to delete the objective?"
        );


    if (!confirmed) {

        return;

    }


    try {

        /*
         * Remove the objective.
         */

        studyData.objective = "";


        /*
         * Permanently save the updated data.
         */

        await saveStudyData();


        /*
         * Reload/update the displayed
         * Study information.
         */

        loadStudyInformation();


        showToast(
            "Objective deleted successfully."
        );

    }

    catch (error) {

        console.error(
            "Unable to delete objective:",
            error
        );


        showToast(

            error.message ||

            "Unable to delete objective."

        );

    }

}

/* =========================================================
   DELETE ARRAY ITEM
========================================================= */

async function deleteStudyArrayItem(
    arrayName,
    id,
    renderFunction,
    successMessage,
    confirmationMessage
) {

    const confirmed =
        window.confirm(
            confirmationMessage
        );


    if (!confirmed) {

        return;

    }


    const previous =
        clone(
            studyData[arrayName]
        );


    try {

        studyData[arrayName] =
            studyData[arrayName].filter(
                item =>
                    String(item.id) !==
                    String(id)
            );


        renderFunction();


        updateSummary();

        updateDate();


        await saveStudyData();


        showToast(
            successMessage
        );

    }

    catch (error) {

        console.error(
            `Unable to delete ${arrayName}:`,
            error
        );


        studyData[arrayName] =
            previous;


        renderFunction();

        updateSummary();


        showToast(

            error.message ||

            "Unable to delete item."

        );

    }

}