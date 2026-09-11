/* =========================================================
   RiGiD — DESIGN WORKSPACE
   design.js

   Backend-connected Design Workspace
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const SUPABASE_FUNCTIONS_URL =
    "https://mmmsmncmskvuqyhaqcne.supabase.co/functions/v1";


/* =========================================================
   SAFE HTML HELPER
========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


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

let designData = null;

let currentWorkId = null;

let isSaving = false;

let hasUnsavedChanges = false;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeDesign
);


async function initializeDesign() {

    currentWorkId =
        getWorkIdFromURL();


    if (!currentWorkId) {

        showTemporaryMessage(
            "Design ID is missing from the URL."
        );

        return;

    }


    try {

        setLoading(
            true
        );


        await loadDesignData();


        initializeDesignPage();


        showTemporaryMessage(
            "Design loaded."
        );

    }

    catch (error) {

        console.error(
            "Design initialization error:",
            error
        );


        showTemporaryMessage(
            error.message ||
            "Unable to load Design."
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

        params.get("design_id") ||

        params.get("id") ||

        params.get("work") ||

        params.get("design")

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
   LOAD DESIGN DATA
========================================================= */

async function loadDesignData() {

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
            "Unable to load Design data."

        );

    }


    designData =
        convertRigidDataToDesignData(

            result.data || {},
            result.work || {}

        );

}


/* =========================================================
   SAVE DESIGN DATA
========================================================= */

async function saveDesignData() {

    if (isSaving) {
        return;
    }


    if (!currentWorkId) {

        throw new Error(
            "Design ID is missing."
        );

    }


    if (!designData) {

        throw new Error(
            "Design data is not loaded."
        );

    }


    isSaving =
        true;


    try {

        const session =
            await getSession();


        const rigidData =
            convertDesignDataToRigidData(
                designData
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
                "Unable to save Design data."

            );

        }


        designData.updatedAt =
            new Date()
                .toISOString();


        hasUnsavedChanges =
            false;


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

function convertRigidDataToDesignData(
    data,
    work = {}
) {

    const workspace =
        data?.workspace || {};


    const design =
        data?.design || {};


    return {

        /* =================================================
           WORKSPACE
        ================================================= */

        id:
            workspace.id ||
            work?.id ||
            currentWorkId,


        title:
            workspace.title ||
            work?.title ||
            "Untitled Design",


        status:
            workspace.status ||
            design.status ||
            "in-progress",


        createdAt:
            workspace.createdAt ||
            work?.created_at ||
            null,


        updatedAt:
            workspace.updatedAt ||
            work?.updated_at ||
            null,


        /* =================================================
           DESIGN INFORMATION
        ================================================= */

        code:
            design.code ||
            "",


        description:
            design.description ||
            "",


        owner:
            design.owner ||
            workspace.owner ||
            work?.owner ||
            "You",


        version:
            design.version ||
            "v1.0",


        progress:
            clampPercentage(
                design.progress ?? 0
            ),


        progressTitle:
            design.progressTitle ||
            "In Development",


        progressDescription:
            design.progressDescription ||
            "",


        startDate:
            design.startDate ||
            workspace.createdAt ||
            "",


        /* =================================================
           FOUNDATION
        ================================================= */

        requirements:
            Array.isArray(
                design.requirements
            )
                ? design.requirements
                : [],


        objectives:
            Array.isArray(
                design.objectives
            )
                ? design.objectives
                : [],


        constraints:
            Array.isArray(
                design.constraints
            )
                ? design.constraints
                : [],


        tools:
            Array.isArray(
                design.tools
            )
                ? design.tools
                : [],


        /* =================================================
           ENGINEERING DATA
        ================================================= */

        specifications:
            Array.isArray(
                design.specifications
            )
                ? design.specifications
                : [],


        materials:
            Array.isArray(
                design.materials
            )
                ? design.materials
                : [],


        components:
            Array.isArray(
                design.components
            )
                ? design.components
                : [],


        /* =================================================
           DEVELOPMENT
        ================================================= */

        iterations:
            Array.isArray(
                design.iterations
            )
                ? design.iterations
                : [],


        decisions:
            Array.isArray(
                design.decisions
            )
                ? design.decisions
                : [],


        risks:
            Array.isArray(
                design.risks
            )
                ? design.risks
                : [],


        /* =================================================
           GENERAL DATA
        ================================================= */

        tasks:
            Array.isArray(
                data?.tasks
            )
                ? data.tasks
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


        tests:
            Array.isArray(
                design.tests
            )
                ? design.tests
                : [],


        notes:
            design.notes ||
            "",


        review:
            design.review ||
            {},


        timeline:
            Array.isArray(
                design.timeline
            )
                ? design.timeline
                : []

    };

}


/* =========================================================
   CONVERT DESIGN DATA TO RIGID DATA
========================================================= */

function convertDesignDataToRigidData(
    design
) {

    const now =
        new Date()
            .toISOString();


    return {

        version:
            1,


        workspace: {

            id:
                design.id,

            type:
                "design",

            title:
                design.title,

            status:
                design.status ||
                "in-progress",

            createdAt:
                design.createdAt ||
                now,

            updatedAt:
                now

        },


        design: {

            code:
                design.code ||
                "",

            description:
                design.description ||
                "",

            owner:
                design.owner ||
                "You",

            version:
                design.version ||
                "v1.0",

            progress:
                clampPercentage(
                    design.progress
                ),

            progressTitle:
                design.progressTitle ||
                "In Development",

            progressDescription:
                design.progressDescription ||
                "",

            startDate:
                design.startDate ||
                "",

            requirements:
                ensureArray(
                    design.requirements
                ),

            objectives:
                ensureArray(
                    design.objectives
                ),

            constraints:
                ensureArray(
                    design.constraints
                ),

            tools:
                ensureArray(
                    design.tools
                ),

            specifications:
                ensureArray(
                    design.specifications
                ),

            materials:
                ensureArray(
                    design.materials
                ),

            components:
                ensureArray(
                    design.components
                ),

            iterations:
                ensureArray(
                    design.iterations
                ),

            decisions:
                ensureArray(
                    design.decisions
                ),

            risks:
                ensureArray(
                    design.risks
                ),

            tests:
                ensureArray(
                    design.tests
                ),

            notes:
                design.notes ||
                "",

            review:
                design.review ||
                {},

            timeline:
                ensureArray(
                    design.timeline
                )

        },


        tasks:
            ensureArray(
                design.tasks
            ),


        attachments:
            ensureArray(
                design.attachments
            ),


        links:
            ensureArray(
                design.links
            )

    };

}
function initializeTimelineActions() {

    const button =
        getElement(
            "addTimelineButton"
        );

    if (!button) {
        return;
    }

    if (
        button.dataset.timelineBound === "true"
    ) {
        return;
    }

    button.dataset.timelineBound =
        "true";

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            openAddTimelineModal();

        }
    );

}

/* =========================================================
   INITIALIZE PAGE
========================================================= */

function initializeDesignPage() {

    renderEverything();

    initializeNavigation();

    initializeSaveSystem();

    initializeTaskSystem();

    initializeNotesSystem();

    initializeButtons();

    initializeFileActions();

    initializeReferenceActions();

    initializeProgressActions();

    initializeTimelineActions();

    initializeReviewActions();

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

    if (!designData) {
        return;
    }


    renderDesignInformation();

    renderFoundation();

    renderSpecifications();

    renderMaterials();

    renderComponents();

    renderIterations();

    renderDecisions();

    renderRisks();

    renderTasks();

    renderFiles();

    renderReferences();

    renderTests();

    renderNotes();

    renderReview();

    renderTimeline();

    updateSummary();

    updateProgress();

}


/* =========================================================
   DESIGN INFORMATION
========================================================= */

function renderDesignInformation() {

    setText(
        "designTitle",
        designData.title
    );


    setText(
        "designCode",
        designData.code ||
        "—"
    );


    setText(
        "designDescription",
        designData.description ||
        "No design description added."
    );


    setText(
        "designStatus",
        formatStatus(
            designData.status
        )
    );


    setText(
        "designVersion",
        designData.version
    );


    setText(
        "startDate",
        formatDisplayDate(
            designData.startDate ||
            designData.createdAt
        )
    );


    setText(
        "lastUpdated",
        formatDisplayDate(
            designData.updatedAt
        )
    );


    setText(
        "designerName",
        designData.owner
    );


    setText(
        "currentVersion",
        designData.version
    );


    setText(
        "footerVersion",
        designData.version
    );


    const status =
        getElement(
            "designStatus"
        );


    if (status) {

        status.className =
            `status-badge ${getStatusClass(
                designData.status
            )}`;

    }


    $$(".design-footer-panel h3")
        .forEach(
            element => {

                element.textContent =
                    designData.title;

            }
        );

}


/* =========================================================
   FOUNDATION
========================================================= */

function renderFoundation() {

    renderRequirements();

    renderObjectives();

    renderConstraints();

    renderTools();

}


function renderRequirements() {

    const container =
        getElement(
            "requirementList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !designData.requirements.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No requirements added."
            );

        return;

    }


    designData.requirements
        .forEach(
            (
                requirement,
                index
            ) => {

                const text =
                    typeof requirement ===
                        "string"
                        ? requirement
                        : requirement.text ||
                        requirement.title ||
                        "";


                const item =
                    document.createElement(
                        "li"
                    );


                /*
                 * Important:
                 * The text span has its own class.
                 * This prevents the × button from being
                 * selected by "span:last-child".
                 */

                item.innerHTML = `

                    <span
                        class="bullet"
                    ></span>

                    <span
                        class="design-item-text"
                    ></span>

                    ${createDeleteButton(
                    "requirements",
                    index
                )}

                `;


                item
                    .querySelector(
                        ".design-item-text"
                    )
                    .textContent =
                    text;


                container.appendChild(
                    item
                );

            }
        );

}


function renderObjectives() {

    const container =
        getElement(
            "objectiveList"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !designData.objectives.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No objectives added."
            );

        return;

    }


    designData.objectives
        .forEach(
            (
                objective,
                index
            ) => {

                const text =
                    typeof objective ===
                        "string"
                        ? objective
                        : objective.text ||
                        objective.title ||
                        "";


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "objective-item";


                item.innerHTML = `

                    <span class="objective-number">
                        ${String(index + 1)
                        .padStart(2, "0")}
                    </span>

                    <span class="design-item-text"></span>

                    ${createDeleteButton(
                            "objectives",
                            index
                        )}

                `;


                item
                    .querySelector(
                        ".design-item-text"
                    )
                    .textContent =
                    text;


                container.appendChild(
                    item
                );

            }
        );

}


function renderConstraints() {

    const container =
        getElement(
            "constraintList"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !designData.constraints.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No constraints added."
            );

        return;

    }


    designData.constraints
        .forEach(
            (
                constraint,
                index
            ) => {

                const item =
                    document.createElement(
                        "li"
                    );


                const key =
                    typeof constraint ===
                        "object"
                        ? constraint.key ||
                        constraint.title ||
                        "Constraint"
                        : "Constraint";


                const value =
                    typeof constraint ===
                        "object"
                        ? constraint.value ||
                        constraint.description ||
                        ""
                        : constraint;


                item.innerHTML = `

                    <span class="constraint-key"></span>

                    <span class="design-item-text"></span>

                    ${createDeleteButton(
                    "constraints",
                    index
                )}

                `;


                item
                    .querySelector(
                        ".constraint-key"
                    )
                    .textContent =
                    key;


                item
                    .querySelector(
                        ".design-item-text"
                    )
                    .textContent =
                    value;


                container.appendChild(
                    item
                );

            }
        );

}


function renderTools() {

    const container =
        getElement(
            "toolList"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !designData.tools.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No tools added."
            );

        return;

    }


    designData.tools
        .forEach(
            (
                tool,
                index
            ) => {

                const name =
                    typeof tool ===
                        "string"
                        ? tool
                        : tool.name ||
                        tool.title ||
                        "";


                const tag =
                    document.createElement(
                        "span"
                    );


                tag.className =
                    "tool-tag";


                tag.innerHTML = `

                    <span class="design-item-text"></span>

                    ${createDeleteButton(
                    "tools",
                    index
                )}

                `;


                tag
                    .querySelector(
                        ".design-item-text"
                    )
                    .textContent =
                    name;


                container.appendChild(
                    tag
                );

            }
        );

}


/* =========================================================
   SPECIFICATIONS
========================================================= */

function renderSpecifications() {

    const container =
        getElement(
            "specificationGrid"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !designData.specifications.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No specifications added."
            );

        return;

    }


    designData.specifications
        .forEach(
            (
                specification,
                index
            ) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "specification-item";


                const name =
                    specification.name ||
                    specification.key ||
                    "";


                const value =
                    specification.value ||
                    "";


                const unit =
                    specification.unit
                        ? ` ${specification.unit}`
                        : "";


                item.innerHTML = `

                    <span></span>

                    <strong></strong>

                    ${createDeleteButton(
                    "specifications",
                    index
                )}

                `;


                item
                    .querySelector(
                        "span"
                    )
                    .textContent =
                    name;


                item
                    .querySelector(
                        "strong"
                    )
                    .textContent =
                    `${value}${unit}`;


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   MATERIALS
========================================================= */

function renderMaterials() {

    const container =
        document.querySelector(
            ".material-list"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !designData.materials.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No materials added."
            );

        return;

    }


    designData.materials
        .forEach(
            (
                material,
                index
            ) => {

                const name =
                    material.name ||
                    material.title ||
                    "";


                const symbol =
                    material.symbol ||
                    getInitials(name);


                const usage =
                    material.usage ||
                    material.description ||
                    "";


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "material-item";


                item.innerHTML = `

                    <div class="material-symbol"></div>

                    <div>

                        <strong></strong>

                        <span></span>

                    </div>

                    ${createDeleteButton(
                    "materials",
                    index
                )}

                `;


                item
                    .querySelector(
                        ".material-symbol"
                    )
                    .textContent =
                    symbol;


                item
                    .querySelector(
                        "strong"
                    )
                    .textContent =
                    name;


                item
                    .querySelector(
                        "span"
                    )
                    .textContent =
                    usage;


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   COMPONENTS
========================================================= */

function renderComponents() {

    const container =
        getElement(
            "componentGrid"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !designData.components.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No components added."
            );

        return;

    }


    designData.components
        .forEach(
            (
                component,
                index
            ) => {

                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    "component-card";


                const status =
                    component.status ||
                    "DEFINED";


                const metaLabel =
                    component.metaLabel ||
                        component.material
                        ? "Material"
                        : "Type";


                const metaValue =
                    component.metaValue ||
                    component.material ||
                    component.type ||
                    "—";


                item.innerHTML = `

                    <div class="component-top">

                        <span class="component-index">
                            ${String(index + 1)
                        .padStart(2, "0")}
                        </span>

                        <span class="component-status"></span>

                    </div>

                    <h4></h4>

                    <p></p>

                    <div class="component-meta">

                        <span></span>

                        <strong></strong>

                    </div>

                    ${createDeleteButton(
                            "components",
                            index
                        )}

                `;


                item
                    .querySelector(
                        ".component-status"
                    )
                    .textContent =
                    String(status)
                        .toUpperCase();


                item
                    .querySelector(
                        "h4"
                    )
                    .textContent =
                    component.name ||
                    component.title ||
                    "Untitled Component";


                item
                    .querySelector(
                        "p"
                    )
                    .textContent =
                    component.description ||
                    "";


                item
                    .querySelector(
                        ".component-meta span"
                    )
                    .textContent =
                    metaLabel;


                item
                    .querySelector(
                        ".component-meta strong"
                    )
                    .textContent =
                    metaValue;


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   ITERATIONS
========================================================= */

function renderIterations() {

    const container =
        getElement(
            "iterationList"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !designData.iterations.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No design iterations added."
            );

        return;

    }


    designData.iterations
        .forEach(
            (
                iteration,
                index
            ) => {

                const item =
                    document.createElement(
                        "article"
                    );


                const isCurrent =
                    Boolean(
                        iteration.current
                    );


                item.className =
                    `iteration-card ${isCurrent
                        ? "iteration-current"
                        : ""
                    }`;


                item.innerHTML = `

                    <div class="iteration-version-column">

                        <span class="iteration-version"></span>

                        <span class="iteration-date"></span>

                    </div>

                    <div class="iteration-content">

                        <div class="iteration-heading">

                            <h4></h4>

                        </div>

                        <p></p>

                        <div class="iteration-tags"></div>

                    </div>

                    ${createDeleteButton(
                    "iterations",
                    index
                )}

                `;


                item
                    .querySelector(
                        ".iteration-version"
                    )
                    .textContent =
                    iteration.version ||
                    "—";


                item
                    .querySelector(
                        ".iteration-date"
                    )
                    .textContent =
                    formatDisplayDate(
                        iteration.date
                    );


                item
                    .querySelector(
                        "h4"
                    )
                    .textContent =
                    iteration.title ||
                    "Untitled Iteration";


                item
                    .querySelector(
                        "p"
                    )
                    .textContent =
                    iteration.description ||
                    "";


                if (isCurrent) {

                    const label =
                        document.createElement(
                            "span"
                        );


                    label.className =
                        "current-label";


                    label.textContent =
                        "CURRENT";


                    item
                        .querySelector(
                            ".iteration-heading"
                        )
                        .appendChild(
                            label
                        );

                }


                const tagContainer =
                    item.querySelector(
                        ".iteration-tags"
                    );


                ensureArray(
                    iteration.tags
                )
                    .forEach(
                        tagText => {

                            const tag =
                                document.createElement(
                                    "span"
                                );


                            tag.textContent =
                                tagText;


                            tagContainer.appendChild(
                                tag
                            );

                        }
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
        !designData.decisions.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No design decisions added."
            );

        return;

    }


    designData.decisions
        .forEach(
            (
                decision,
                index
            ) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "decision-item";


                item.innerHTML = `

                    <span class="decision-number">
                        ${String(index + 1)
                        .padStart(2, "0")}
                    </span>

                    <div>

                        <strong></strong>

                        <p></p>

                    </div>

                    ${createDeleteButton(
                            "decisions",
                            index
                        )}

                `;


                item
                    .querySelector(
                        "strong"
                    )
                    .textContent =
                    decision.title ||
                    decision.name ||
                    "";


                item
                    .querySelector(
                        "p"
                    )
                    .textContent =
                    decision.description ||
                    decision.reason ||
                    "";


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   RISKS
========================================================= */

function renderRisks() {

    const container =
        getElement(
            "riskList"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !designData.risks.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No risks added."
            );

        return;

    }


    designData.risks
        .forEach(
            (
                risk,
                index
            ) => {

                const level =
                    String(
                        risk.level ||
                        risk.severity ||
                        "medium"
                    )
                        .toLowerCase();


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    `risk-item risk-${level}`;


                item.innerHTML = `

                    <div class="risk-indicator"></div>

                    <div>

                        <strong></strong>

                        <p></p>

                    </div>

                    <span></span>

                    ${createDeleteButton(
                    "risks",
                    index
                )}

                `;


                item
                    .querySelector(
                        "strong"
                    )
                    .textContent =
                    risk.title ||
                    risk.name ||
                    "";


                item
                    .querySelector(
                        "p"
                    )
                    .textContent =
                    risk.description ||
                    "";


                item
                    .querySelector(
                        "span"
                    )
                    .textContent =
                    level === "medium"
                        ? "MED"
                        : level
                            .toUpperCase();


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   TASKS
========================================================= */

function renderTasks() {

    const container = getElement("taskList");

    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(designData.tasks)) {
        designData.tasks = [];
    }

    if (!designData.tasks.length) {
        container.innerHTML = createEmptyState("No tasks added.");
        updateTaskSummary();
        return;
    }

    designData.tasks.forEach((task, index) => {
        const completed = isTaskCompleted(task);
        const delayed = isTaskDelayed(task);

        const item = document.createElement("div");
        item.className = `task-item ${completed ? "completed" : ""} ${delayed ? "delayed" : ""}`;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = completed;
        checkbox.dataset.taskId = task.id || "";

        checkbox.addEventListener("change", async () => {
            const previous = {
                status: task.status,
                completed: task.completed,
                done: task.done,
                delayUntil: task.delayUntil,
                delayReason: task.delayReason,
                delayed: task.delayed
            };

            const wasCompleted = isTaskCompleted(task);

            if (checkbox.checked) {
                task.status = "completed";
                task.completed = true;
                task.done = true;
                task.delayed = false;
                delete task.delayUntil;
                delete task.delayReason;
            } else {
                task.status = "todo";
                task.completed = false;
                task.done = false;
            }

            markDesignChanged();
            renderEverything();

            try {
                await saveDesignData();
                if (!wasCompleted && checkbox.checked) {
                    showDesignConfetti();
                    showTemporaryMessage("Task completed!");
                }
            } catch (error) {
                Object.assign(task, previous);
                renderEverything();
                showTemporaryMessage(error.message || "Unable to update task.");
            }
        });

        item.appendChild(checkbox);

        const check = document.createElement("span");
        check.className = "task-check";
        item.appendChild(check);

        const content = document.createElement("span");
        content.className = "task-content";

        const title = document.createElement("strong");
        title.textContent = task.title || task.name || "Untitled Task";
        content.appendChild(title);

        const category = document.createElement("small");
        category.textContent = task.category || task.type || "";
        content.appendChild(category);

        if (delayed && task.delayUntil) {
            const delayInfo = document.createElement("small");
            delayInfo.className = "task-delay-info";
            delayInfo.textContent = `Delayed until ${formatDisplayDate(task.delayUntil)}`;
            content.appendChild(delayInfo);
        }

        item.appendChild(content);

        const state = document.createElement("span");
        state.className = "task-state";
        state.textContent = completed ? "DONE" : delayed ? "DELAYED" : formatTaskStatus(task.status);
        item.appendChild(state);


        item.insertAdjacentHTML("beforeend", createDeleteButton("tasks", index));
        container.appendChild(item);
    });

    updateTaskSummary();
}

function formatTaskStatus(status) {
    const value = String(status || "todo").toLowerCase();
    if (value === "in-progress") return "IN PROGRESS";
    if (value === "blocked") return "BLOCKED";
    if (value === "delayed") return "DELAYED";
    if (value === "completed" || value === "complete" || value === "done") return "DONE";
    return "TODO";
}

function isTaskDelayed(task) {
    return Boolean(
        task &&
        (task.delayed === true || String(task.status || "").toLowerCase() === "delayed")
    );
}

async function openTaskDelayModal(index) {
    const task = designData?.tasks?.[index];
    if (!task) return;

    const existing = getElement("designTaskDelayModal");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "designTaskDelayModal";
    Object.assign(overlay.style, {
        position: "fixed", inset: "0", zIndex: "10002", display: "flex",
        alignItems: "center", justifyContent: "center", padding: "20px",
        background: "rgba(0,0,0,0.68)", overflowY: "auto"
    });

    const modal = document.createElement("div");
    Object.assign(modal.style, {
        width: "min(520px, 100%)", background: "#17151f", border: "1px solid rgba(255,255,255,.12)",
        borderRadius: "18px", padding: "24px", boxShadow: "0 24px 80px rgba(0,0,0,.45)", color: "#fff"
    });

    modal.innerHTML = `
        <h2 style="margin:0 0 8px;font-size:20px">${escapeHtml(task.title || "Task")}</h2>
        <p style="margin:0 0 20px;color:#aaa4b8;font-size:14px">Set a new date for this task or clear its delay.</p>
        <form id="taskDelayForm">
            <label style="display:block;margin-bottom:14px;font-size:13px;color:#c9c4d2">Delayed until
                <input name="delayUntil" type="date" value="${task.delayUntil ? String(task.delayUntil).slice(0, 10) : ""}" style="display:block;width:100%;margin-top:7px;padding:11px;border-radius:10px;border:1px solid #3a3547;background:#100f15;color:#fff;box-sizing:border-box">
            </label>
            <label style="display:block;margin-bottom:18px;font-size:13px;color:#c9c4d2">Reason
                <textarea name="delayReason" rows="3" placeholder="Why is this task delayed?" style="display:block;width:100%;margin-top:7px;padding:11px;border-radius:10px;border:1px solid #3a3547;background:#100f15;color:#fff;box-sizing:border-box;resize:vertical">${escapeHtml(task.delayReason || "")}</textarea>
            </label>
            <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap">
                <button type="button" id="clearTaskDelay" style="padding:10px 14px;border-radius:10px;border:1px solid rgba(239,68,68,.35);background:transparent;color:#f87171;cursor:pointer">Clear Delay</button>
                <button type="button" id="cancelTaskDelay" style="padding:10px 14px;border-radius:10px;border:1px solid #3a3547;background:#24202d;color:#ddd;cursor:pointer">Cancel</button>
                <button type="submit" style="padding:10px 16px;border-radius:10px;border:0;background:#8b5cf6;color:white;cursor:pointer">Save Delay</button>
            </div>
        </form>`;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    modal.querySelector("#cancelTaskDelay").addEventListener("click", close);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });

    modal.querySelector("#clearTaskDelay").addEventListener("click", async () => {
        const previous = { status: task.status, delayed: task.delayed, delayUntil: task.delayUntil, delayReason: task.delayReason };
        task.delayed = false;
        task.status = task.status === "delayed" ? "todo" : task.status;
        delete task.delayUntil;
        delete task.delayReason;
        markDesignChanged();
        renderEverything();
        close();
        try {
            await saveDesignData();
            showTemporaryMessage("Task delay cleared.");
        } catch (error) {
            Object.assign(task, previous);
            renderEverything();
            showTemporaryMessage(error.message || "Unable to clear task delay.");
        }
    });

    modal.querySelector("#taskDelayForm").addEventListener("submit", async event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const delayUntil = String(form.get("delayUntil") || "").trim();
        const delayReason = String(form.get("delayReason") || "").trim();
        if (!delayUntil) {
            showTemporaryMessage("Please select a delay date.");
            return;
        }
        const previous = { status: task.status, delayed: task.delayed, delayUntil: task.delayUntil, delayReason: task.delayReason };
        task.delayed = true;
        task.status = "delayed";
        task.delayUntil = delayUntil;
        task.delayReason = delayReason;
        markDesignChanged();
        renderEverything();
        close();
        try {
            await saveDesignData();
            showTemporaryMessage("Task delay saved.");
        } catch (error) {
            Object.assign(task, previous);
            renderEverything();
            showTemporaryMessage(error.message || "Unable to save task delay.");
        }
    });
}



/* =========================================================
   TASK SUMMARY
========================================================= */

function updateTaskSummary() {

    const tasks =
        ensureArray(
            designData?.tasks
        );


    const total =
        tasks.length;


    const completed =
        tasks.filter(
            isTaskCompleted
        )
            .length;


    const remaining =
        total - completed;


    const percentage =
        total
            ? Math.round(
                (
                    completed /
                    total
                ) * 100
            )
            : 0;


    setText(
        "taskSummary",
        `${completed} / ${total}`
    );


    const taskProgressLabel =
        document.querySelector(
            ".task-progress-top strong"
        );


    if (taskProgressLabel) {

        taskProgressLabel.textContent =
            `${completed} / ${total}`;

    }


    const taskProgressFill =
        document.querySelector(
            ".task-progress-fill"
        );


    if (taskProgressFill) {

        taskProgressFill.style.width =
            `${percentage}%`;

    }


    const statBoxes =
        document.querySelectorAll(
            ".task-stat-grid strong"
        );


    if (statBoxes.length >= 4) {

        statBoxes[0].textContent =
            completed;

        statBoxes[1].textContent =
            remaining;

        statBoxes[2].textContent =
            tasks.filter(
                task =>
                    String(
                        task.status
                    )
                        .toLowerCase() ===
                    "blocked"
            )
                .length;

        statBoxes[3].textContent =
            total;

    }

}


/* =========================================================
   FILES
========================================================= */

function renderFiles() {

    const container =
        getElement(
            "fileGrid"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !designData.attachments.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No files uploaded."
            );

        return;

    }


    designData.attachments
        .forEach(
            (
                attachment,
                index
            ) => {

                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    "file-card";


                const fileType =
                    getFileType(
                        attachment
                    );


                const iconClass =
                    getFileIconClass(
                        fileType
                    );


                item.innerHTML = `

                    <div class="file-icon ${iconClass}"></div>

                    <div class="file-content">

                        <strong></strong>

                        <span></span>

                        <small></small>

                    </div>

                    <button
                        class="file-action"
                        type="button"
                        aria-label="Open file"
                    >
                        ↗
                    </button>

                    ${createDeleteButton(
                    "files",
                    index
                )}

                `;


                item
                    .querySelector(
                        ".file-icon"
                    )
                    .textContent =
                    getFileIconLabel(
                        fileType
                    );


                item
                    .querySelector(
                        ".file-content strong"
                    )
                    .textContent =
                    attachment.name ||
                    attachment.title ||
                    "Unnamed File";


                item
                    .querySelector(
                        ".file-content span"
                    )
                    .textContent =
                    attachment.type ||
                    fileType ||
                    "File";


                item
                    .querySelector(
                        ".file-content small"
                    )
                    .textContent =
                    `${formatFileSize(
                        attachment.size
                    )} · ${formatDisplayDate(
                        attachment.createdAt ||
                        attachment.date
                    )}`;


                item
                    .querySelector(
                        ".file-action"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            openAttachment(
                                attachment
                            );

                        }
                    );


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   REFERENCES
========================================================= */

function renderReferences() {

    const container =
        getElement(
            "referenceList"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !designData.links.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No references added."
            );

        return;

    }


    designData.links
        .forEach(
            (
                linkData,
                index
            ) => {

                const item =
                    document.createElement(
                        "a"
                    );


                item.className =
                    "reference-item";


                item.href =
                    linkData.url ||
                    "#";


                item.target =
                    "_blank";


                item.rel =
                    "noopener noreferrer";


                item.innerHTML = `

                    <span class="reference-icon">
                        ↗
                    </span>

                    <span class="reference-content">

                        <strong></strong>

                        <small></small>

                    </span>

                    ${createDeleteButton(
                    "references",
                    index
                )}

                `;


                item
                    .querySelector(
                        "strong"
                    )
                    .textContent =
                    linkData.title ||
                    linkData.name ||
                    "Reference";


                item
                    .querySelector(
                        "small"
                    )
                    .textContent =
                    linkData.description ||
                    linkData.url ||
                    "";


                if (!linkData.url) {

                    item.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            showTemporaryMessage(
                                "Reference URL is unavailable."
                            );

                        }
                    );

                }


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   TESTING
========================================================= */

function renderTests() {

    const container =
        document.querySelector(
            ".validation-grid"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !designData.tests.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No tests added."
            );

        return;

    }


    designData.tests
        .forEach(
            (
                test,
                index
            ) => {

                const status =
                    String(
                        test.status ||
                        "pending"
                    )
                        .toLowerCase();


                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    "validation-card";


                item.innerHTML = `

                    <div class="validation-header">

                        <span class="validation-number">
                            TEST ${String(index + 1)
                        .padStart(2, "0")}
                        </span>

                        <span class="validation-status ${status}"></span>

                    </div>

                    <h4></h4>

                    <p></p>

                    <div class="validation-result">

                        <span>
                            RESULT
                        </span>

                        <strong></strong>

                    </div>

                    ${createDeleteButton(
                            "tests",
                            index
                        )}

                `;


                item
                    .querySelector(
                        ".validation-status"
                    )
                    .textContent =
                    status
                        .toUpperCase();


                item
                    .querySelector(
                        "h4"
                    )
                    .textContent =
                    test.title ||
                    test.name ||
                    "Untitled Test";


                item
                    .querySelector(
                        "p"
                    )
                    .textContent =
                    test.description ||
                    "";


                item
                    .querySelector(
                        ".validation-result strong"
                    )
                    .textContent =
                    test.result ||
                    "No result recorded";


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   NOTES
========================================================= */

function renderNotes() {

    const notes =
        getElement(
            "designNotes"
        );


    if (notes) {

        notes.value =
            designData.notes ||
            "";

    }


    const notesStatus =
        document.querySelector(
            ".notes-status"
        );


    if (notesStatus) {

        notesStatus.textContent =
            designData.updatedAt
                ? "Saved"
                : "Not saved";

    }


    setText(
        "notesSaved",
        designData.updatedAt
            ? formatDisplayDate(
                designData.updatedAt
            )
            : "Not saved"
    );

}


/* =========================================================
   REVIEW
========================================================= */

function renderReview() {

    const review =
        designData.review ||
        {};

    const items =
        document.querySelectorAll(
            ".review-grid .review-item"
        );

    items.forEach(
        item => {

            const field =
                item.dataset.reviewField;

            const valueElement =
                item.querySelector("strong");

            if (!valueElement) {
                return;
            }

            let value = "";

            switch (field) {

                case "lastReview":

                    value =
                        review.lastReview
                            ? formatDisplayDate(
                                review.lastReview
                            )
                            : "—";

                    break;

                case "reviewer":

                    value =
                        review.reviewer ||
                        "—";

                    break;

                case "result":

                    value =
                        review.result ||
                        "—";

                    break;

                case "nextReview":

                    value =
                        review.nextReview
                            ? formatDisplayDate(
                                review.nextReview
                            )
                            : "—";

                    break;

            }

            valueElement.textContent =
                value;

        }
    );


    const note =
        document.querySelector(
            ".review-note p"
        );


    if (note) {

        note.textContent =
            review.note ||
            "No review notes added.";

    }

}

/* =========================================================
   REVIEW ACTIONS
========================================================= */

function initializeReviewActions() {

    const reviewItems =
        document.querySelectorAll(
            ".review-grid .review-item"
        );

    reviewItems.forEach(
        item => {

            if (
                item.dataset.reviewBound === "true"
            ) {
                return;
            }

            item.dataset.reviewBound =
                "true";

            item.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const field =
                        item.dataset.reviewField;

                    if (!field) {
                        return;
                    }

                    openReviewFieldModal(
                        field
                    );

                }
            );

        }
    );

}

/* =========================================================
   OPEN REVIEW FIELD MODAL
========================================================= */

function openReviewFieldModal(field) {

    if (!designData) {
        return;
    }

    const existing =
        getElement("designReviewModal");

    if (existing) {
        existing.remove();
    }

    const review =
        designData.review ||
        {};

    designData.review =
        review;

    const configuration =
        getReviewFieldConfiguration(
            field
        );

    if (!configuration) {
        return;
    }

    const overlay =
        document.createElement("div");

    overlay.id =
        "designReviewModal";

    Object.assign(
        overlay.style,
        {
            position: "fixed",
            inset: "0",
            zIndex: "10003",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(0,0,0,.68)",
            overflowY: "auto"
        }
    );

    const modal =
        document.createElement("div");

    Object.assign(
        modal.style,
        {
            width: "min(600px,100%)",
            maxWidth: "600px",
            padding: "24px",
            border: "1px solid rgba(139,92,246,.32)",
            borderRadius: "14px",
            background: "#11131f",
            color: "#f5f3ff",
            boxShadow: "0 25px 80px rgba(0,0,0,.6)"
        }
    );

    modal.innerHTML = `

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:20px;
            margin-bottom:20px;
        ">

            <div>

                <div style="
                    font-size:9px;
                    letter-spacing:2px;
                    color:#8b5cf6;
                    margin-bottom:7px;
                ">
                    DESIGN REVIEW
                </div>

                <h3 style="
                    margin:0;
                    font-size:20px;
                ">
                    ${escapeHtml(
        configuration.title
    )}
                </h3>

                <p style="
                    margin:7px 0 0;
                    color:#aaa6b9;
                    font-size:12px;
                    line-height:1.5;
                ">
                    ${escapeHtml(
        configuration.description
    )}
                </p>

            </div>

            <button
                type="button"
                id="closeReviewModal"
                style="
                    width:32px;
                    height:32px;
                    border:1px solid rgba(255,255,255,.12);
                    border-radius:7px;
                    background:rgba(255,255,255,.04);
                    color:#aaa6b9;
                    cursor:pointer;
                    font-size:18px;
                    flex:0 0 auto;
                "
            >
                ×
            </button>

        </div>

<form id="reviewForm">

    <label style="
        display:block;
        margin-bottom:${field === "result" ? "16px" : "20px"};
    ">

        <span style="
            display:block;
            margin-bottom:7px;
            font-size:11px;
            font-weight:600;
            color:#d8d4e5;
        ">
            ${escapeHtml(
        configuration.label
    )}
        </span>

        ${createReviewInput(
        configuration,
        review[field]
    )}

    </label>

    ${field === "result"
            ? `
                <label style="
                    display:block;
                    margin-bottom:20px;
                ">

                    <span style="
                        display:block;
                        margin-bottom:7px;
                        font-size:11px;
                        font-weight:600;
                        color:#d8d4e5;
                    ">
                        Comment
                    </span>

                    <textarea
                        name="reviewComment"
                        rows="5"
                        placeholder="Enter review comment..."
                        style="
                            display:block;
                            width:100%;
                            box-sizing:border-box;
                            padding:11px 12px;
                            border:1px solid rgba(255,255,255,.12);
                            border-radius:8px;
                            outline:none;
                            background:#0b0d15;
                            color:#f5f3ff;
                            font-family:inherit;
                            font-size:12px;
                            line-height:1.5;
                            resize:vertical;
                        "
                    >${escapeHtml(
                review.note || ""
            )}</textarea>

                </label>
            `
            : ""
        }

        <div style="
            display:flex;
            justify-content:flex-end;
            align-items:center;
            gap:10px;
            margin-top:4px;
            padding-top:16px;
            border-top:1px solid rgba(255,255,255,.08);
        ">
            <button
                type="button"
                id="cancelReviewModal"
                style="
                    display:inline-flex;
                    align-items:center;
                    justify-content:center;
                    min-width:82px;
                    min-height:38px;
                    padding:9px 14px;
                    border:1px solid rgba(255,255,255,.12);
                    border-radius:8px;
                    background:rgba(255,255,255,.04);
                    color:#d8d4e5;
                    font:inherit;
                    font-size:12px;
                    font-weight:600;
                    cursor:pointer;
                    box-sizing:border-box;
                "
            >
                Cancel
            </button>

            <button
                type="submit"
                id="saveReviewModal"
                style="
                    display:inline-flex;
                    align-items:center;
                    justify-content:center;
                    min-width:110px;
                    min-height:38px;
                    padding:9px 16px;
                    border:1px solid rgba(139,92,246,.55);
                    border-radius:8px;
                    background:rgba(139,92,246,.24);
                    color:#f5f3ff;
                    font:inherit;
                    font-size:12px;
                    font-weight:600;
                    cursor:pointer;
                    box-sizing:border-box;
                "
            >
                ${field === "result" ? "Update Result" : "Save Changes"}
            </button>
        </div>

    </form>
    `;

    Object.assign(
        modal.style,
        {
            maxHeight: "calc(100vh - 40px)",
            overflowY: "auto",
            boxSizing: "border-box"
        }
    );

    overlay.appendChild(
        modal
    );

    document.body.appendChild(
        overlay
    );

    const close =
        () => overlay.remove();

    modal.querySelector(
        "#closeReviewModal"
    )
        ?.addEventListener(
            "click",
            close
        );

    modal.querySelector(
        "#cancelReviewModal"
    )
        ?.addEventListener(
            "click",
            close
        );

    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {

                close();

            }

        }
    );

    const form =
        modal.querySelector(
            "#reviewForm"
        );

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const input =
                form.querySelector(
                    "[name='reviewValue']"
                );

            if (!input) {
                return;
            }

            const value =
                String(
                    input.value || ""
                ).trim();

            const commentInput =
                form.querySelector(
                    "[name='reviewComment']"
                );

            const previousValue =
                review[field];

            const previousComment =
                review.note || "";

            review[field] =
                value;

            if (field === "result" && commentInput) {

                review.note =
                    String(
                        commentInput.value || ""
                    ).trim();

            }

            markDesignChanged();

            renderReview();

            /*
             * CLOSE IMMEDIATELY.
             * Do not wait for Supabase.
             */
            close();

            try {

                await saveDesignData();

                showTemporaryMessage(
                    `${configuration.label} saved.`
                );

            }

            catch (error) {

                review[field] =
                    previousValue;

                if (field === "result") {

                    review.note =
                        previousComment;

                }

                renderReview();

                showTemporaryMessage(
                    error.message ||
                    `Unable to save ${configuration.label.toLowerCase()}.`
                );

            }

        }
    );

    const firstInput =
        form.querySelector(
            "input, select, textarea"
        );

    if (firstInput) {

        setTimeout(
            () => {

                firstInput.focus();

            },
            30
        );

    }

}

/* =========================================================
   REVIEW FIELD CONFIGURATION
========================================================= */

function getReviewFieldConfiguration(field) {

    const configurations = {

        lastReview: {

            title:
                "Update Last Review",

            description:
                "Record the date when the design was last reviewed.",

            label:
                "Last Review Date",

            type:
                "date"

        },

        reviewer: {

            title:
                "Update Reviewer",

            description:
                "Enter the person responsible for reviewing this design.",

            label:
                "Reviewer",

            type:
                "text",

            placeholder:
                "Enter reviewer name"

        },

        result: {

            title:
                "Update Review Result",

            description:
                "Record the review result and add a comment.",

            label:
                "Review Result",

            type:
                "select",

            options:
                [
                    "pending",
                    "in-progress",
                    "approved",
                    "approved-with-changes",
                    "rejected"
                ]

        },

        nextReview: {

            title:
                "Update Next Review",

            description:
                "Set the date for the next design review.",

            label:
                "Next Review Date",

            type:
                "date"

        }

    };

    return (
        configurations[field] ||
        null
    );

}

/* =========================================================
   CREATE REVIEW INPUT
========================================================= */

function createReviewInput(
    configuration,
    value
) {

    const safeValue =
        String(
            value || ""
        );

    const commonStyle = `
        display:block;
        width:100%;
        box-sizing:border-box;
        padding:11px 12px;
        border:1px solid rgba(255,255,255,.12);
        border-radius:8px;
        outline:none;
        background:#0b0d15;
        color:#f5f3ff;
        font-family:inherit;
        font-size:12px;
    `;

    if (
        configuration.type === "select"
    ) {

        return `
            <select
                name="reviewValue"
                style="${commonStyle}"
            >
                ${configuration.options
                .map(
                    option => `
                            <option
                                value="${escapeHtml(option)}"
                                ${option === safeValue
                            ? "selected"
                            : ""
                        }
                            >
                                ${escapeHtml(
                            formatStatus(option)
                        )}
                            </option>
                        `
                )
                .join("")}
            </select>
        `;

    }

    return `
        <input
            type="${escapeHtml(
        configuration.type || "text"
    )}"
            name="reviewValue"
            value="${escapeHtml(
        safeValue
    )}"
            placeholder="${escapeHtml(
        configuration.placeholder || ""
    )}"
            ${configuration.type === "date" ? "" : ""}
            style="${commonStyle}"
        >
    `;

}
/* =========================================================
   DESIGN TIMELINE
========================================================= */

function renderTimeline() {

    const container =
        getElement("designTimeline");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(designData.timeline) ||
        !designData.timeline.length
    ) {

        container.innerHTML =
            createEmptyState(
                "No timeline entries added."
            );

        return;
    }

    const entries =
        [...designData.timeline].sort(
            (a, b) =>
                new Date(b.date || b.createdAt || 0) -
                new Date(a.date || a.createdAt || 0)
        );

    entries.forEach(
        (entry, sortedIndex) => {

            const originalIndex =
                designData.timeline.indexOf(entry);

            const item =
                document.createElement("article");

            item.className =
                "timeline-entry";

            const status =
                String(
                    entry.status || "planned"
                ).toLowerCase();

            item.innerHTML = `

                <div class="timeline-marker"></div>

                <div class="timeline-content">

                    <div class="timeline-top">

                        <span class="timeline-date"></span>

                        <span class="timeline-status"></span>

                    </div>

                    <h4 class="timeline-title"></h4>

                    <p class="timeline-description"></p>

                    <div class="timeline-actions">

                        <button
                            type="button"
                            class="timeline-edit-button"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="timeline-delete-button"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;

            item.querySelector(
                ".timeline-date"
            ).textContent =
                formatDisplayDate(
                    entry.date ||
                    entry.createdAt
                );

            item.querySelector(
                ".timeline-status"
            ).textContent =
                formatStatus(status);

            item.querySelector(
                ".timeline-title"
            ).textContent =
                entry.title ||
                "Untitled Timeline Entry";

            item.querySelector(
                ".timeline-description"
            ).textContent =
                entry.description ||
                "";

            item.querySelector(
                ".timeline-edit-button"
            ).addEventListener(
                "click",
                () => {

                    openEditTimelineModal(
                        originalIndex
                    );

                }
            );

            item.querySelector(
                ".timeline-delete-button"
            ).addEventListener(
                "click",
                () => {

                    deleteTimelineEntry(
                        originalIndex
                    );

                }
            );

            container.appendChild(item);

        }
    );
}


/* =========================================================
   ADD TIMELINE MODAL
========================================================= */

function openAddTimelineModal() {

    if (!designData) {

        showTemporaryMessage(
            "Design data is not loaded."
        );

        return;
    }

    const existing =
        getElement("designTimelineModal");

    if (existing) {
        existing.remove();
    }

    const overlay =
        document.createElement("div");

    overlay.id =
        "designTimelineModal";

    Object.assign(
        overlay.style,
        {
            position: "fixed",
            inset: "0",
            zIndex: "10002",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(0,0,0,.68)",
            overflowY: "auto",
            boxSizing: "border-box"
        }
    );

    const modal =
        document.createElement("div");

    Object.assign(
        modal.style,
        {
            width: "min(600px,100%)",
            maxHeight: "calc(100vh - 40px)",
            overflowY: "auto",
            boxSizing: "border-box",
            padding: "24px",
            border: "1px solid rgba(139,92,246,.32)",
            borderRadius: "14px",
            background: "#11131f",
            color: "#f5f3ff",
            boxShadow: "0 25px 80px rgba(0,0,0,.6)"
        }
    );

    modal.innerHTML = `

        <div style="
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:20px;
    margin-bottom:20px;
">

            <div>

                <div style="
                    font-size:9px;
                    letter-spacing:2px;
                    color:#8b5cf6;
                    margin-bottom:7px;
                ">
                    DESIGN TIMELINE
                </div>

                <h3 style="
                    margin:0;
                    font-size:20px;
                ">
                    Add Timeline Entry
                </h3>

            </div>

            <button
                type="button"
                id="closeTimelineModal"
                style="
                    width:32px;
                    height:32px;
                    border:1px solid rgba(255,255,255,.12);
                    border-radius:7px;
                    background:rgba(255,255,255,.04);
                    color:#aaa6b9;
                    cursor:pointer;
                    font-size:18px;
                "
            >
                ×
            </button>

        </div>

        <form id="timelineForm">

            <label style="display:block;margin-bottom:15px;">
                <span>Date</span>

                <input
                    name="date"
                    type="date"
                    required
                    value="${new Date()
            .toISOString()
            .slice(0, 10)}"
                    style="
                        display:block;
                        width:100%;
                        margin-top:7px;
                        box-sizing:border-box;
                        padding:11px;
                        border:1px solid rgba(255,255,255,.12);
                        border-radius:8px;
                        background:#0b0d15;
                        color:#fff;
                    "
                >
            </label>

            <label style="display:block;margin-bottom:15px;">
                <span>Status</span>

                <select
                    name="status"
                    style="
                        display:block;
                        width:100%;
                        margin-top:7px;
                        box-sizing:border-box;
                        padding:11px;
                        border:1px solid rgba(255,255,255,.12);
                        border-radius:8px;
                        background:#0b0d15;
                        color:#fff;
                    "
                >
                    <option value="planned">Planned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                    <option value="blocked">Blocked</option>
                </select>

            </label>

            <label style="display:block;margin-bottom:15px;">
                <span>Title</span>

                <input
                    name="title"
                    type="text"
                    required
                    placeholder="Example: Initial concept completed"
                    style="
                        display:block;
                        width:100%;
                        margin-top:7px;
                        box-sizing:border-box;
                        padding:11px;
                        border:1px solid rgba(255,255,255,.12);
                        border-radius:8px;
                        background:#0b0d15;
                        color:#fff;
                    "
                >
            </label>

            <label style="display:block;margin-bottom:20px;">
                <span>Description</span>

                <textarea
                    name="description"
                    rows="4"
                    placeholder="Describe what happened during this stage..."
                    style="
                        display:block;
                        width:100%;
                        margin-top:7px;
                        box-sizing:border-box;
                        padding:11px;
                        border:1px solid rgba(255,255,255,.12);
                        border-radius:8px;
                        background:#0b0d15;
                        color:#fff;
                        resize:vertical;
                    "
                ></textarea>
            </label>

            <div style="
                display:flex;
                justify-content:flex-end;
                gap:10px;
                padding-top:18px;
                border-top:1px solid rgba(255,255,255,.08);
            ">
<button
    type="button"
    id="cancelTimelineModal"
    class="timeline-modal-cancel"
    style="
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-height:38px;
        padding:9px 14px;
        border:1px solid rgba(255,255,255,.12);
        border-radius:8px;
        background:rgba(255,255,255,.04);
        color:#d8d4e5;
        font:inherit;
        font-size:12px;
        cursor:pointer;
        box-sizing:border-box;
    "
>
    Cancel
</button>

<button
    type="submit"
    class="timeline-modal-submit"
    style="
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-height:38px;
        padding:9px 16px;
        border:1px solid rgba(139,92,246,.55);
        border-radius:8px;
        background:rgba(139,92,246,.24);
        color:#f5f3ff;
        font:inherit;
        font-size:12px;
        cursor:pointer;
        box-sizing:border-box;
    "
>
    Add Timeline Entry
</button>

            </div>

        </form>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close =
        () => overlay.remove();

    modal.querySelector(
        "#closeTimelineModal"
    ).addEventListener(
        "click",
        close
    );

    modal.querySelector(
        "#cancelTimelineModal"
    ).addEventListener(
        "click",
        close
    );

    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {
                close();
            }

        }
    );

    modal.querySelector(
        "#timelineForm"
    ).addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const form =
                new FormData(
                    event.currentTarget
                );

            const entry = {

                date:
                    form.get("date"),

                status:
                    form.get("status"),

                title:
                    String(
                        form.get("title") || ""
                    ).trim(),

                description:
                    String(
                        form.get("description") || ""
                    ).trim(),

                createdAt:
                    new Date()
                        .toISOString()

            };

            if (!entry.title) {

                showTemporaryMessage(
                    "Timeline title is required."
                );

                return;
            }

            designData.timeline =
                Array.isArray(
                    designData.timeline
                )
                    ? designData.timeline
                    : [];

            designData.timeline.push(
                entry
            );

            markDesignChanged();

            renderTimeline();

            close();

            try {

                await saveDesignData();

                showTemporaryMessage(
                    "Timeline entry added."
                );

            } catch (error) {

                designData.timeline.pop();

                renderTimeline();

                showTemporaryMessage(
                    error.message ||
                    "Unable to save timeline entry."
                );

            }

        }
    );

}


/* =========================================================
   EDIT TIMELINE
========================================================= */

function openEditTimelineModal(index) {

    if (!designData) {
        return;
    }

    const entry =
        designData?.timeline?.[index];

    if (!entry) {
        return;
    }

    const existing =
        getElement("designTimelineModal");

    if (existing) {
        existing.remove();
    }
    const overlay =
        document.createElement("div");

    overlay.id =
        "designTimelineModal";

    Object.assign(
        overlay.style,
        {
            position: "fixed",
            inset: "0",
            zIndex: "10002",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(0,0,0,.68)",
            overflowY: "auto"
        }
    );
const modal =
    document.createElement("div");

Object.assign(
    modal.style,
    {
        width: "min(600px,100%)",
        maxHeight: "calc(100vh - 40px)",
        overflowY: "auto",
        boxSizing: "border-box",
        padding: "24px",
        border: "1px solid rgba(139,92,246,.32)",
        borderRadius: "14px",
        background: "#11131f",
        color: "#f5f3ff",
        boxShadow: "0 25px 80px rgba(0,0,0,.6)"
    }
);
    modal.innerHTML = `

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:20px;
            margin-bottom:20px;
        ">

            <div>

                <div style="
                    font-size:9px;
                    letter-spacing:2px;
                    color:#8b5cf6;
                    margin-bottom:7px;
                ">
                    DESIGN TIMELINE
                </div>

                <h3 style="
                    margin:0;
                    font-size:20px;
                ">
                    Edit Timeline Entry
                </h3>

            </div>

            <button
                type="button"
                id="closeTimelineModal"
                style="
                    width:32px;
                    height:32px;
                    border:1px solid rgba(255,255,255,.12);
                    border-radius:7px;
                    background:rgba(255,255,255,.04);
                    color:#aaa6b9;
                    cursor:pointer;
                    font-size:18px;
                "
            >
                ×
            </button>

        </div>

        <form id="timelineForm">

            <label style="display:block;margin-bottom:15px;">
                <span>Date</span>

                <input
                    name="date"
                    type="date"
                    required
                    value="${escapeHtml(
        String(
            entry.date || ""
        ).slice(0, 10)
    )}"
                    style="
                        display:block;
                        width:100%;
                        margin-top:7px;
                        box-sizing:border-box;
                        padding:11px;
                        border:1px solid rgba(255,255,255,.12);
                        border-radius:8px;
                        background:#0b0d15;
                        color:#fff;
                    "
                >
            </label>

            <label style="display:block;margin-bottom:15px;">
                <span>Status</span>

                <select
                    name="status"
                    style="
                        display:block;
                        width:100%;
                        margin-top:7px;
                        box-sizing:border-box;
                        padding:11px;
                        border:1px solid rgba(255,255,255,.12);
                        border-radius:8px;
                        background:#0b0d15;
                        color:#fff;
                    "
                >

                    <option
                        value="planned"
                        ${entry.status === "planned" ? "selected" : ""}
                    >
                        Planned
                    </option>

                    <option
                        value="in-progress"
                        ${entry.status === "in-progress" ? "selected" : ""}
                    >
                        In Progress
                    </option>

                    <option
                        value="completed"
                        ${entry.status === "completed" ? "selected" : ""}
                    >
                        Completed
                    </option>

                    <option
                        value="delayed"
                        ${entry.status === "delayed" ? "selected" : ""}
                    >
                        Delayed
                    </option>

                    <option
                        value="blocked"
                        ${entry.status === "blocked" ? "selected" : ""}
                    >
                        Blocked
                    </option>

                </select>

            </label>

            <label style="display:block;margin-bottom:15px;">
                <span>Title</span>

                <input
                    name="title"
                    type="text"
                    required
                    value="${escapeHtml(
        entry.title || ""
    )}"
                    placeholder="Example: Initial concept completed"
                    style="
                        display:block;
                        width:100%;
                        margin-top:7px;
                        box-sizing:border-box;
                        padding:11px;
                        border:1px solid rgba(255,255,255,.12);
                        border-radius:8px;
                        background:#0b0d15;
                        color:#fff;
                    "
                >
            </label>

            <label style="display:block;margin-bottom:20px;">
                <span>Description</span>

                <textarea
                    name="description"
                    rows="4"
                    placeholder="Describe what happened during this stage..."
                    style="
                        display:block;
                        width:100%;
                        margin-top:7px;
                        box-sizing:border-box;
                        padding:11px;
                        border:1px solid rgba(255,255,255,.12);
                        border-radius:8px;
                        background:#0b0d15;
                        color:#fff;
                        resize:vertical;
                    "
                >${escapeHtml(
        entry.description || ""
    )}</textarea>
            </label>

            <div style="
                display:flex;
                justify-content:flex-end;
                gap:10px;
                padding-top:18px;
                border-top:1px solid rgba(255,255,255,.08);
            ">

<button
    type="button"
    id="cancelTimelineModal"
    class="timeline-modal-cancel"
    style="
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-height:38px;
        padding:9px 14px;
        border:1px solid rgba(255,255,255,.12);
        border-radius:8px;
        background:rgba(255,255,255,.04);
        color:#d8d4e5;
        font:inherit;
        font-size:12px;
        cursor:pointer;
        box-sizing:border-box;
    "
>
    Cancel
</button>

<button
    type="submit"
    class="timeline-modal-submit"
    style="
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-height:38px;
        padding:9px 16px;
        border:1px solid rgba(139,92,246,.55);
        border-radius:8px;
        background:rgba(139,92,246,.24);
        color:#f5f3ff;
        font:inherit;
        font-size:12px;
        cursor:pointer;
        box-sizing:border-box;
    "
>
    Save Changes
</button>

            </div>

        </form>
    `;

    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    const close =
        () => overlay.remove();

    modal.querySelector(
        "#closeTimelineModal"
    ).addEventListener(
        "click",
        close
    );

    modal.querySelector(
        "#cancelTimelineModal"
    ).addEventListener(
        "click",
        close
    );

    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {
                close();
            }

        }
    );

    modal.querySelector(
        "#timelineForm"
    ).addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const form =
                new FormData(
                    event.currentTarget
                );

            const previous = {
                ...entry
            };

            entry.date =
                String(
                    form.get("date") || ""
                ).trim();

            entry.status =
                String(
                    form.get("status") || "planned"
                ).trim();

            entry.title =
                String(
                    form.get("title") || ""
                ).trim();

            entry.description =
                String(
                    form.get("description") || ""
                ).trim();

            if (!entry.title) {

                showTemporaryMessage(
                    "Timeline title is required."
                );

                return;
            }

            markDesignChanged();

            renderTimeline();

            /*
             * CLOSE IMMEDIATELY.
             * Do not wait for Supabase.
             */
            close();

            try {

                await saveDesignData();

                showTemporaryMessage(
                    "Timeline entry updated."
                );

            } catch (error) {

                Object.assign(
                    entry,
                    previous
                );

                renderTimeline();

                showTemporaryMessage(
                    error.message ||
                    "Unable to update timeline entry."
                );

            }

        }
    );

}


/* =========================================================
   DELETE TIMELINE
========================================================= */

function deleteTimelineEntry(index) {

    const entry =
        designData?.timeline?.[index];

    if (!entry) {
        return;
    }

    askConfirm(
        "Delete Timeline Entry",
        `Delete "${entry.title || "this timeline entry"}"?`,
        async () => {

            designData.timeline.splice(
                index,
                1
            );

            markDesignChanged();

            renderTimeline();

            try {

                await saveDesignData();

                showTemporaryMessage(
                    "Timeline entry removed."
                );

            } catch (error) {

                designData.timeline.splice(
                    index,
                    0,
                    entry
                );

                renderTimeline();

                showTemporaryMessage(
                    error.message ||
                    "Unable to delete timeline entry."
                );

            }

        }
    );

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const tasks =
        ensureArray(
            designData.tasks
        );


    const completedTasks =
        tasks.filter(
            isTaskCompleted
        )
            .length;


    setText(
        "taskSummary",
        `${completedTasks} / ${tasks.length}`
    );


    setText(
        "iterationSummary",
        designData.iterations.length
    );


    setText(
        "fileSummary",
        designData.attachments.length
    );


    const activeRisks =
        designData.risks.filter(
            risk =>
                String(
                    risk.status ||
                    "open"
                )
                    .toLowerCase() !==
                "resolved"
        )
            .length;


    setText(
        "riskSummary",
        activeRisks
    );


    const summaryCards =
        document.querySelectorAll(
            ".summary-card"
        );


    if (summaryCards.length) {

        const statusValue =
            summaryCards[0]
                .querySelector(
                    ".summary-value"
                );


        if (statusValue) {

            statusValue.textContent =
                formatStatus(
                    designData.status
                );

        }

    }


    const progressFooter =
        document.querySelectorAll(
            ".progress-footer span"
        );


    if (
        progressFooter.length >= 2
    ) {

        progressFooter[0].textContent =
            `${clampPercentage(
                designData.progress
            )}% completed`;


        progressFooter[1].textContent =
            `${designData.iterations.length} iterations`;

    }

}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    const progress =
        clampPercentage(
            designData.progress
        );


    setText(
        "progressValue",
        `${progress}%`
    );


    const progressBar =
        getElement(
            "progressBar"
        );


    if (progressBar) {

        progressBar.style.width =
            `${progress}%`;

    }


    const progressRing =
        getElement(
            "progressRing"
        );


    if (progressRing) {

        progressRing.style.background =
            `
            conic-gradient(
                #8b5cf6 ${progress}%,
                rgba(255,255,255,0.055) ${progress}%
            )
            `;

    }


    const progressInfo =
        document.querySelector(
            ".progress-info"
        );


    if (progressInfo) {

        const title =
            progressInfo.querySelector(
                "strong"
            );


        const description =
            progressInfo.querySelector(
                "span"
            );


        if (title) {

            title.textContent =
                designData.progressTitle ||
                (progress === 100
                    ? "Completed"
                    : "In Development");

        }


        if (description) {

            description.textContent =
                designData.progressDescription ||
                "";

        }

    }


    const editButton =
        getElement(
            "editDesignProgressButton"
        );


    if (editButton) {

        editButton.textContent =
            progress === 100
                ? "Edit Progress"
                : "Edit Progress";

        editButton.setAttribute(
            "aria-label",
            "Edit design progress"
        );

    }

}


/* =========================================================
   PROGRESS EDITOR
========================================================= */

function getDesignProgressCard() {

    const progressValue =
        getElement(
            "progressValue"
        );

    if (!progressValue) {
        return null;
    }

    let node =
        progressValue;

    while (
        node &&
        node !== document.body
    ) {

        if (
            node.querySelector &&
            node.querySelector(
                "#progressRing"
            ) &&
            node.querySelector(
                "#progressBar"
            ) &&
            node.querySelector(
                ".progress-info"
            )
        ) {

            return node;

        }

        node =
            node.parentElement;

    }

    return progressValue.parentElement;

}


function initializeProgressActions() {

    const card =
        getDesignProgressCard();

    if (!card) {
        return;
    }

    let editButton =
        getElement(
            "editDesignProgressButton"
        );

    if (!editButton) {

        editButton =
            document.createElement(
                "button"
            );

        editButton.type =
            "button";

        editButton.id =
            "editDesignProgressButton";

        editButton.textContent =
            "Edit Progress";

        Object.assign(
            editButton.style,
            {
                position: "absolute",
                top: "18px",
                right: "18px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "32px",
                padding: "7px 11px",
                border: "1px solid rgba(139,92,246,.35)",
                borderRadius: "7px",
                background: "rgba(139,92,246,.08)",
                color: "#c4b5fd",
                font: "inherit",
                fontSize: "10px",
                fontWeight: "600",
                cursor: "pointer",
                zIndex: "2",
                boxSizing: "border-box"
            }
        );

        if (
            getComputedStyle(card).position ===
            "static"
        ) {

            card.style.position =
                "relative";

        }

        card.appendChild(
            editButton
        );

    }

    if (
        editButton.dataset.progressBound ===
        "true"
    ) {
        return;
    }

    editButton.dataset.progressBound =
        "true";

    editButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            openDesignProgressModal();

        }
    );

}


function openDesignProgressModal() {

    if (!designData) {
        return;
    }

    const existing =
        getElement(
            "designProgressModal"
        );

    if (existing) {
        existing.remove();
    }

    const overlay =
        document.createElement(
            "div"
        );

    overlay.id =
        "designProgressModal";

    Object.assign(
        overlay.style,
        {
            position: "fixed",
            inset: "0",
            zIndex: "10004",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(0,0,0,.68)",
            overflowY: "auto",
            boxSizing: "border-box"
        }
    );

    const modal =
        document.createElement(
            "div"
        );

    Object.assign(
        modal.style,
        {
            width: "min(520px,100%)",
            maxHeight: "calc(100vh - 40px)",
            overflowY: "auto",
            boxSizing: "border-box",
            padding: "24px",
            border: "1px solid rgba(139,92,246,.32)",
            borderRadius: "14px",
            background: "#11131f",
            color: "#f5f3ff",
            boxShadow: "0 25px 80px rgba(0,0,0,.6)"
        }
    );

    const currentProgress =
        clampPercentage(
            designData.progress
        );

    const currentTitle =
        designData.progressTitle ||
        (currentProgress === 100
            ? "Completed"
            : "In Development");

    const currentDescription =
        designData.progressDescription ||
        "";

    const currentStatus =
        currentProgress === 100
            ? "completed"
            : "in-progress";

    modal.innerHTML = `
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:20px;
            margin-bottom:22px;
        ">
            <div>
                <div style="
                    font-size:9px;
                    letter-spacing:2px;
                    color:#8b5cf6;
                    margin-bottom:7px;
                ">
                    DESIGN PROGRESS
                </div>

                <h3 style="
                    margin:0;
                    font-size:20px;
                ">
                    Edit Design Progress
                </h3>

                <p style="
                    margin:7px 0 0;
                    color:#aaa6b9;
                    font-size:12px;
                    line-height:1.5;
                ">
                    Update the completion percentage. Reaching 100% automatically completes the design.
                </p>
            </div>

            <button
                type="button"
                id="closeDesignProgressModal"
                aria-label="Close"
                style="
                    width:34px;
                    height:34px;
                    border:1px solid rgba(255,255,255,.12);
                    border-radius:8px;
                    background:rgba(255,255,255,.04);
                    color:#aaa6b9;
                    cursor:pointer;
                    font-size:18px;
                    flex:0 0 auto;
                "
            >
                ×
            </button>
        </div>

        <form id="designProgressForm">
            <label style="display:block;margin-bottom:18px;">
                <span style="display:block;margin-bottom:7px;font-size:11px;font-weight:600;color:#d8d4e5;">
                    Progress Percentage
                </span>
                <div style="display:flex;align-items:center;gap:10px;">
                    <input
                        type="number"
                        name="progress"
                        min="0"
                        max="100"
                        step="1"
                        value="${currentProgress}"
                        required
                        style="
                            display:block;
                            width:100%;
                            box-sizing:border-box;
                            padding:11px 12px;
                            border:1px solid rgba(255,255,255,.12);
                            border-radius:8px;
                            outline:none;
                            background:#0b0d15;
                            color:#f5f3ff;
                            font:inherit;
                            font-size:13px;
                        "
                    >
                    <span style="font-size:12px;color:#8f8a9e;">%</span>
                </div>
            </label>

            <label style="display:block;margin-bottom:18px;">
                <span style="display:block;margin-bottom:7px;font-size:11px;font-weight:600;color:#d8d4e5;">
                    Progress Title
                </span>
                <input
                    type="text"
                    name="progressTitle"
                    maxlength="80"
                    value="${escapeHtml(currentTitle)}"
                    placeholder="In Development"
                    style="
                        display:block;
                        width:100%;
                        box-sizing:border-box;
                        padding:11px 12px;
                        border:1px solid rgba(255,255,255,.12);
                        border-radius:8px;
                        outline:none;
                        background:#0b0d15;
                        color:#f5f3ff;
                        font:inherit;
                        font-size:12px;
                    "
                >
            </label>

            <label style="display:block;margin-bottom:18px;">
                <span style="display:block;margin-bottom:7px;font-size:11px;font-weight:600;color:#d8d4e5;">
                    Description
                </span>
                <textarea
                    name="progressDescription"
                    rows="3"
                    maxlength="300"
                    placeholder="Optional progress description..."
                    style="
                        display:block;
                        width:100%;
                        box-sizing:border-box;
                        padding:11px 12px;
                        border:1px solid rgba(255,255,255,.12);
                        border-radius:8px;
                        outline:none;
                        background:#0b0d15;
                        color:#f5f3ff;
                        font:inherit;
                        font-size:12px;
                        line-height:1.5;
                        resize:vertical;
                    "
                >${escapeHtml(currentDescription)}</textarea>
            </label>

            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:12px;
                padding:11px 12px;
                margin-bottom:20px;
                border:1px solid rgba(255,255,255,.07);
                border-radius:8px;
                background:rgba(255,255,255,.025);
            ">
                <span style="font-size:11px;color:#aaa6b9;">Design Status</span>
                <strong id="progressModalStatus" style="font-size:11px;color:#c4b5fd;">
                    ${formatStatus(currentStatus)}
                </strong>
            </div>

            <div style="
                display:flex;
                justify-content:flex-end;
                gap:10px;
                padding-top:4px;
            ">
                <button
                    type="button"
                    id="cancelDesignProgressModal"
                    style="
                        display:inline-flex;
                        align-items:center;
                        justify-content:center;
                        min-height:38px;
                        padding:9px 14px;
                        border:1px solid rgba(255,255,255,.12);
                        border-radius:8px;
                        background:rgba(255,255,255,.04);
                        color:#d8d4e5;
                        font:inherit;
                        font-size:12px;
                        cursor:pointer;
                    "
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    style="
                        display:inline-flex;
                        align-items:center;
                        justify-content:center;
                        min-height:38px;
                        padding:9px 16px;
                        border:1px solid rgba(139,92,246,.55);
                        border-radius:8px;
                        background:rgba(139,92,246,.24);
                        color:#f5f3ff;
                        font:inherit;
                        font-size:12px;
                        cursor:pointer;
                    "
                >
                    Save Progress
                </button>
            </div>
        </form>
    `;

    overlay.appendChild(
        modal
    );

    document.body.appendChild(
        overlay
    );

    const close =
        () => overlay.remove();

    modal.querySelector(
        "#closeDesignProgressModal"
    )?.addEventListener(
        "click",
        close
    );

    modal.querySelector(
        "#cancelDesignProgressModal"
    )?.addEventListener(
        "click",
        close
    );

    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {

                close();

            }

        }
    );

    const form =
        modal.querySelector(
            "#designProgressForm"
        );

    const progressInput =
        form.querySelector(
            "[name='progress']"
        );

    const statusLabel =
        form.querySelector(
            "#progressModalStatus"
        );

    const updateModalStatus =
        () => {

            const value =
                clampPercentage(
                    progressInput.value
                );

            statusLabel.textContent =
                formatStatus(
                    value === 100
                        ? "completed"
                        : "in-progress"
                );

        };

    progressInput.addEventListener(
        "input",
        updateModalStatus
    );

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const nextProgress =
                clampPercentage(
                    progressInput.value
                );

            const titleInput =
                form.querySelector(
                    "[name='progressTitle']"
                );

            const descriptionInput =
                form.querySelector(
                    "[name='progressDescription']"
                );

            const previous = {
                progress:
                    designData.progress,
                progressTitle:
                    designData.progressTitle,
                progressDescription:
                    designData.progressDescription,
                status:
                    designData.status
            };

            designData.progress =
                nextProgress;

            designData.progressTitle =
                String(
                    titleInput.value ||
                    ""
                ).trim() ||
                (nextProgress === 100
                    ? "Completed"
                    : "In Development");

            designData.progressDescription =
                String(
                    descriptionInput.value ||
                    ""
                ).trim();

            if (
                nextProgress === 100
            ) {

                designData.status =
                    "completed";

            } else if (
                String(
                    designData.status ||
                    ""
                ).toLowerCase() ===
                "completed"
            ) {

                designData.status =
                    "in-progress";

            }

            markDesignChanged();

            renderDesignInformation();

            updateSummary();

            updateProgress();

            close();

            try {

                await saveDesignData();

                if (
                    nextProgress === 100 &&
                    previous.progress !== 100
                ) {

                    showDesignConfetti();

                    showTemporaryMessage(
                        "Design completed!"
                    );

                } else {

                    showTemporaryMessage(
                        "Design progress saved."
                    );

                }

            } catch (error) {

                designData.progress =
                    previous.progress;

                designData.progressTitle =
                    previous.progressTitle;

                designData.progressDescription =
                    previous.progressDescription;

                designData.status =
                    previous.status;

                renderDesignInformation();

                updateSummary();

                updateProgress();

                showTemporaryMessage(
                    error.message ||
                    "Unable to save design progress."
                );

            }

        }
    );

    setTimeout(
        () => {

            progressInput.focus();

            progressInput.select();

        },
        30
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

    const backButton =
        getElement(
            "backButton"
        );


    if (!backButton) {
        return;
    }


    backButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "../personal.html";

        }
    );

}


/* =========================================================
   SAVE SYSTEM
========================================================= */

function initializeSaveSystem() {

    const saveButton =
        getElement(
            "saveButton"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            async () => {

                /*
                 * Prevent duplicate clicks while the same save is
                 * already in progress. This is not a visual delay;
                 * it only prevents duplicate network requests.
                 */
                if (isSaving) {
                    return;
                }


                try {

                    await saveCurrentNotes();

                    await saveDesignData();


                    showSaveFeedback(
                        saveButton,
                        "Saved"
                    );


                    showTemporaryMessage(
                        "Design saved."
                    );

                }

                catch (error) {

                    saveButton.disabled =
                        false;

                    showTemporaryMessage(
                        error.message ||
                        "Unable to save Design."
                    );

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        async event => {

            if (
                (
                    event.ctrlKey ||
                    event.metaKey
                ) &&
                event.key.toLowerCase() ===
                "s"
            ) {

                event.preventDefault();


                if (isSaving) {
                    return;
                }


                try {

                    await saveCurrentNotes();

                    await saveDesignData();


                    if (saveButton) {

                        showSaveFeedback(
                            saveButton,
                            "Saved"
                        );

                    }


                    showTemporaryMessage(
                        "Design saved."
                    );

                }

                catch (error) {

                    showTemporaryMessage(
                        error.message ||
                        "Unable to save Design."
                    );

                }

            }

        }
    );

}


/* =========================================================
   NOTES SYSTEM
========================================================= */

function initializeNotesSystem() {

    const notes =
        getElement(
            "designNotes"
        );


    if (!notes) {
        return;
    }


    notes.addEventListener(
        "input",
        () => {

            designData.notes =
                notes.value;


            hasUnsavedChanges =
                true;


            const notesStatus =
                document.querySelector(
                    ".notes-status"
                );


            if (notesStatus) {

                notesStatus.textContent =
                    "Unsaved";

            }

        }
    );


    notes.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Tab"
            ) {

                event.preventDefault();


                const start =
                    notes.selectionStart;


                const end =
                    notes.selectionEnd;


                notes.value =
                    notes.value.substring(
                        0,
                        start
                    ) +
                    "    " +
                    notes.value.substring(
                        end
                    );


                notes.selectionStart =
                    notes.selectionEnd =
                    start + 4;


                designData.notes =
                    notes.value;


                hasUnsavedChanges =
                    true;

            }

        }
    );

}


/* =========================================================
   SAVE CURRENT NOTES
========================================================= */

async function saveCurrentNotes() {

    const notes =
        getElement(
            "designNotes"
        );


    if (!notes) {
        return;
    }


    designData.notes =
        notes.value;


    designData.updatedAt =
        new Date()
            .toISOString();

}


/* =========================================================
   COMPLETION CONFETTI
========================================================= */

function showDesignConfetti() {

    const existing = getElement("designConfetti");

    if (existing) {
        existing.remove();
    }

    const layer = document.createElement("div");
    layer.id = "designConfetti";
    Object.assign(layer.style, {
        position: "fixed",
        inset: "0",
        pointerEvents: "none",
        zIndex: "20000",
        overflow: "hidden"
    });

    for (let i = 0; i < 110; i++) {
        const piece = document.createElement("span");
        const size = 5 + Math.random() * 8;
        const left = Math.random() * 100;
        const duration = 1.8 + Math.random() * 2.2;
        const delay = Math.random() * 0.35;
        const hue = Math.floor(Math.random() * 360);

        Object.assign(piece.style, {
            position: "absolute",
            left: `${left}%`,
            top: "-20px",
            width: `${size}px`,
            height: `${size * 1.5}px`,
            background: `hsl(${hue} 85% 65%)`,
            borderRadius: "2px",
            opacity: "0.95",
            transform: `rotate(${Math.random() * 360}deg)`,
            animation: `designConfettiFall ${duration}s ease-out ${delay}s forwards`
        });

        layer.appendChild(piece);
    }

    const style = document.createElement("style");
    style.id = "designConfettiStyle";
    style.textContent = `
        @keyframes designConfettiFall {
            0% { transform: translate3d(0, -20px, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate3d(var(--drift, 0px), 105vh, 0) rotate(720deg); opacity: 0; }
        }
    `;
    layer.appendChild(style);
    document.body.appendChild(layer);

    setTimeout(() => layer.remove(), 4500);
}

/* =========================================================
   TASK SYSTEM
========================================================= */

function initializeTaskSystem() {

    updateTaskSummary();

}


/* =========================================================
   BUTTON SYSTEM
========================================================= */

function initializeButtons() {

    const moreButton =
        getElement(
            "moreButton"
        );


    if (moreButton) {

        moreButton.addEventListener(
            "click",
            () =>
                showMoreMenu(
                    moreButton
                )
        );

    }


    const archiveButton =
        getElement(
            "archiveButton"
        );


    if (archiveButton) {

        archiveButton.addEventListener(
            "click",
            () => {

                askConfirm(

                    "Archive Design",

                    "Are you sure you want to archive this design?",

                    async () => {

                        const previous =
                            designData.status;


                        designData.status =
                            "archived";


                        renderDesignInformation();

                        updateSummary();


                        try {

                            await saveDesignData();


                            archiveButton.textContent =
                                "Archived";


                            showTemporaryMessage(
                                "Design archived."
                            );

                        }

                        catch (error) {

                            designData.status =
                                previous;


                            renderDesignInformation();

                            updateSummary();


                            showTemporaryMessage(
                                error.message ||
                                "Unable to archive Design."
                            );

                        }

                    }

                );

            }
        );

    }


    const completeButton =
        getElement(
            "completeButton"
        );


    if (completeButton) {

        completeButton.addEventListener(
            "click",
            () => {

                askConfirm(

                    "Complete Design",

                    "Mark this design as complete?",

                    async () => {

                        const previous =
                            designData.status;


                        designData.status =
                            "completed";


                        renderDesignInformation();

                        updateSummary();


                        try {

                            showDesignConfetti();
                            await saveDesignData();


                            completeButton.textContent =
                                "Completed";




                            showTemporaryMessage(
                                "Design marked as complete."
                            );

                        }

                        catch (error) {

                            designData.status =
                                previous;


                            renderDesignInformation();

                            updateSummary();


                            showTemporaryMessage(
                                error.message ||
                                "Unable to complete Design."
                            );

                        }

                    }

                );

            }
        );

    }


    /* =================================================
   ADD BUTTONS
================================================= */

    const addButtons =
        $$(".card-add-button");


    addButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    openDesignAddModal(
                        button.dataset.section
                    );

                }
            );

        }
    );


    /* =================================================
       SECTION ACTIONS
    ================================================= */

    const sectionActions =
        $$(".section-action");


    sectionActions.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.section;


                    if (
                        section === "files"
                    ) {

                        openDesignFilePicker();

                        return;

                    }


                    openDesignAddModal(
                        section
                    );

                }
            );

        }
    );

    /* =========================================================
   DELETE BUTTONS
========================================================= */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".design-delete-button"
                );


            if (
                !button
            ) {

                return;

            }


            event.preventDefault();


            const section =
                button.dataset.deleteSection;


            const index =
                Number(
                    button.dataset.deleteIndex
                );


            if (
                Number.isNaN(
                    index
                )
            ) {

                return;

            }


            deleteDesignItem(
                section,
                index
            );

        }
    );

}
/* =========================================================
   DESIGN ADD MODAL
========================================================= */

function openDesignAddModal(
    section
) {

    if (!designData) {

        showTemporaryMessage(
            "Design data is not loaded."
        );

        return;

    }


    const existing =
        getElement(
            "designAddModal"
        );


    if (existing) {

        existing.remove();

    }


    const configuration =
        getDesignModalConfiguration(
            section
        );


    if (!configuration) {

        showTemporaryMessage(
            "This section is not available."
        );

        return;

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "designAddModal";


    Object.assign(
        overlay.style,
        {

            position:
                "fixed",

            inset:
                "0",

            zIndex:
                "10001",

            display:
                "flex",

            alignItems:
                "center",

            justifyContent:
                "center",

            padding:
                "20px",

            background:
                "rgba(0,0,0,0.68)",

            overflowY:
                "auto"

        }
    );


    const modal =
        document.createElement(
            "div"
        );


    Object.assign(
        modal.style,
        {

            width:
                "min(620px, 100%)",

            maxHeight:
                "90vh",

            overflowY:
                "auto",

            padding:
                "24px",

            border:
                "1px solid rgba(139,92,246,0.32)",

            borderRadius:
                "14px",

            background:
                "#11131f",

            boxShadow:
                "0 25px 80px rgba(0,0,0,0.60)",

            color:
                "#f5f3ff"

        }
    );


    const heading =
        document.createElement(
            "div"
        );


    heading.innerHTML =
        `

            <div
                style="
                    display:flex;
                    align-items:flex-start;
                    justify-content:space-between;
                    gap:20px;
                    margin-bottom:20px;
                "
            >

                <div>

                    <div
                        style="
                            font-size:9px;
                            letter-spacing:2px;
                            color:#8b5cf6;
                            margin-bottom:7px;
                        "
                    >
                        DESIGN WORKSPACE
                    </div>

                    <h3
                        style="
                            margin:0;
                            font-size:20px;
                        "
                    >
                        ${configuration.title}
                    </h3>

                    <p
                        style="
                            margin:7px 0 0;
                            color:#aaa6b9;
                            font-size:12px;
                            line-height:1.5;
                        "
                    >
                        ${configuration.description}
                    </p>

                </div>

                <button
                    type="button"
                    id="closeDesignAddModal"
                    style="
                        width:32px;
                        height:32px;
                        border:1px solid rgba(255,255,255,0.12);
                        border-radius:7px;
                        background:rgba(255,255,255,0.04);
                        color:#aaa6b9;
                        cursor:pointer;
                        font-size:18px;
                    "
                >
                    ×
                </button>

            </div>

        `;


    const form =
        document.createElement(
            "form"
        );


    form.id =
        "designAddForm";


    form.innerHTML =
        configuration.fields
            .map(
                field =>
                    createDesignModalField(
                        field
                    )
            )
            .join(
                ""
            );


    const actions =
        document.createElement(
            "div"
        );


    Object.assign(
        actions.style,
        {

            display:
                "flex",

            justifyContent:
                "flex-end",

            gap:
                "10px",

            marginTop:
                "24px",

            paddingTop:
                "18px",

            borderTop:
                "1px solid rgba(255,255,255,0.08)"

        }
    );


    const cancel =
        document.createElement(
            "button"
        );


    cancel.type =
        "button";


    cancel.textContent =
        "Cancel";


    styleModalButton(
        cancel,
        false
    );


    const submit =
        document.createElement(
            "button"
        );


    submit.type =
        "submit";


    submit.textContent =
        configuration.submitText ||
        "Add";


    styleModalButton(
        submit,
        true
    );


    actions.appendChild(
        cancel
    );


    actions.appendChild(
        submit
    );


    form.appendChild(
        actions
    );


    modal.appendChild(
        heading
    );


    modal.appendChild(
        form
    );


    overlay.appendChild(
        modal
    );


    document.body.appendChild(
        overlay
    );


    const closeModal =
        () => {

            overlay.remove();

        };


    getElement(
        "closeDesignAddModal"
    )
        ?.addEventListener(
            "click",
            closeModal
        );


    cancel.addEventListener(
        "click",
        closeModal
    );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {

                closeModal();

            }

        }
    );


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const values =
                getDesignModalValues(
                    configuration.fields
                );


            const validationError =
                validateDesignModalValues(
                    configuration.fields,
                    values
                );


            if (validationError) {

                showTemporaryMessage(
                    validationError
                );

                return;

            }


            /*
             * IMPORTANT:
             * Close the modal FIRST.
             *
             * addDesignSectionItem() updates the local UI immediately
             * and then performs the Supabase save asynchronously.
             * The modal must never wait for the network request.
             */
            closeModal();

            void addDesignSectionItem(
                section,
                values
            );

        }
    );


    const firstInput =
        form.querySelector(
            "input, textarea, select"
        );


    if (firstInput) {

        setTimeout(
            () => {

                firstInput.focus();

            },
            50
        );

    }

}


/* =========================================================
   MODAL CONFIGURATION
========================================================= */

function getDesignModalConfiguration(
    section
) {

    const configurations =
    {

        requirements: {

            title:
                "Add Requirement",

            description:
                "Add a design requirement.",

            submitText:
                "Add Requirement",

            fields:
                [
                    {

                        name:
                            "text",

                        label:
                            "Requirement",

                        type:
                            "textarea",

                        required:
                            true,

                        placeholder:
                            "Enter the design requirement..."

                    }
                ]

        },


        objectives: {

            title:
                "Add Design Objective",

            description:
                "Define a goal for this design.",

            submitText:
                "Add Objective",

            fields:
                [
                    {

                        name:
                            "text",

                        label:
                            "Objective",

                        type:
                            "textarea",

                        required:
                            true,

                        placeholder:
                            "Enter the design objective..."

                    }
                ]

        },


        constraints: {

            title:
                "Add Design Constraint",

            description:
                "Record a limitation or restriction affecting the design.",

            submitText:
                "Add Constraint",

            fields:
                [
                    {

                        name:
                            "key",

                        label:
                            "Constraint Category",

                        type:
                            "text",

                        required:
                            true,

                        placeholder:
                            "Example: Cost"

                    },

                    {

                        name:
                            "value",

                        label:
                            "Constraint",

                        type:
                            "textarea",

                        required:
                            true,

                        placeholder:
                            "Describe the limitation..."

                    }
                ]

        },


        tools: {

            title:
                "Add Software or Tool",

            description:
                "Add a software package, engineering tool or design tool.",

            submitText:
                "Add Tool",

            fields:
                [
                    {

                        name:
                            "name",

                        label:
                            "Tool Name",

                        type:
                            "text",

                        required:
                            true,

                        placeholder:
                            "Example: SolidWorks"

                    }
                ]

        },


        specifications: {

            title:
                "Add Specification",

            description:
                "Add a design parameter, dimension or engineering specification.",

            submitText:
                "Add Specification",

            fields:
                [
                    {

                        name:
                            "name",

                        label:
                            "Specification Name",

                        type:
                            "text",

                        required:
                            true,

                        placeholder:
                            "Example: Shaft Diameter"

                    },

                    {

                        name:
                            "value",

                        label:
                            "Value",

                        type:
                            "text",

                        required:
                            true,

                        placeholder:
                            "Example: 25"

                    },

                    {

                        name:
                            "unit",

                        label:
                            "Unit",

                        type:
                            "text",

                        required:
                            false,

                        placeholder:
                            "Example: mm"

                    }
                ]

        },


        materials: {

            title:
                "Add Material",

            description:
                "Record a material used in the design.",

            submitText:
                "Add Material",

            fields:
                [
                    {

                        name:
                            "name",

                        label:
                            "Material Name",

                        type:
                            "text",

                        required:
                            true,

                        placeholder:
                            "Example: Aluminium 6061"

                    },

                    {

                        name:
                            "symbol",

                        label:
                            "Short Symbol",

                        type:
                            "text",

                        required:
                            false,

                        placeholder:
                            "Example: AL"

                    },

                    {

                        name:
                            "usage",

                        label:
                            "Usage",

                        type:
                            "textarea",

                        required:
                            false,

                        placeholder:
                            "Where is this material used?"

                    }
                ]

        },


        components: {

            title:
                "Add Component",

            description:
                "Add a component that forms part of this design.",

            submitText:
                "Add Component",

            fields:
                [
                    {

                        name:
                            "name",

                        label:
                            "Component Name",

                        type:
                            "text",

                        required:
                            true,

                        placeholder:
                            "Enter component name"

                    },

                    {

                        name:
                            "description",

                        label:
                            "Description",

                        type:
                            "textarea",

                        required:
                            false,

                        placeholder:
                            "Describe the component..."

                    },

                    {

                        name:
                            "category",

                        label:
                            "Category",

                        type:
                            "text",

                        required:
                            false,

                        placeholder:
                            "Example: Mechanical"

                    },

                    {

                        name:
                            "tags",

                        label:
                            "Tags",

                        type:
                            "text",

                        required:
                            false,

                        placeholder:
                            "Separate tags with commas"

                    }
                ]

        },


        iterations: {

            title:
                "Add Design Iteration",

            description:
                "Record a version or development iteration.",

            submitText:
                "Add Iteration",

            fields:
                [
                    {

                        name:
                            "title",

                        label:
                            "Iteration Title",

                        type:
                            "text",

                        required:
                            true,

                        placeholder:
                            "Example: Housing Revision v1.2"

                    },

                    {

                        name:
                            "description",

                        label:
                            "Description",

                        type:
                            "textarea",

                        required:
                            false,

                        placeholder:
                            "What changed in this iteration?"

                    },

                    {

                        name:
                            "version",

                        label:
                            "Version",

                        type:
                            "text",

                        required:
                            false,

                        placeholder:
                            "Example: v1.2"

                    }
                ]

        },


        decisions: {

            title:
                "Add Design Decision",

            description:
                "Record an important engineering or design decision.",

            submitText:
                "Add Decision",

            fields:
                [
                    {

                        name:
                            "title",

                        label:
                            "Decision",

                        type:
                            "text",

                        required:
                            true,

                        placeholder:
                            "Enter the design decision"

                    },

                    {

                        name:
                            "description",

                        label:
                            "Reason / Description",

                        type:
                            "textarea",

                        required:
                            true,

                        placeholder:
                            "Explain why this decision was made..."

                    }
                ]

        },


        risks: {

            title:
                "Add Risk",

            description:
                "Record a technical risk or engineering concern.",

            submitText:
                "Add Risk",

            fields:
                [
                    {

                        name:
                            "title",

                        label:
                            "Risk Title",

                        type:
                            "text",

                        required:
                            true,

                        placeholder:
                            "Enter the risk"

                    },

                    {

                        name:
                            "description",

                        label:
                            "Description",

                        type:
                            "textarea",

                        required:
                            false,

                        placeholder:
                            "Describe the risk..."

                    },

                    {

                        name:
                            "level",

                        label:
                            "Risk Level",

                        type:
                            "select",

                        required:
                            true,

                        options:
                            [
                                "low",
                                "medium",
                                "high",
                                "critical"
                            ]

                    }
                ]

        },


        tasks: {

            title:
                "Add Design Task",

            description:
                "Create a task for the design work.",

            submitText:
                "Add Task",

            fields:
                [
                    {

                        name:
                            "title",

                        label:
                            "Task Title",

                        type:
                            "text",

                        required:
                            true,

                        placeholder:
                            "Enter task title"

                    },

                    {

                        name:
                            "category",

                        label:
                            "Category",

                        type:
                            "text",

                        required:
                            false,

                        placeholder:
                            "Example: Mechanical"

                    },

                    {

                        name:
                            "status",

                        label:
                            "Status",

                        type:
                            "select",

                        required:
                            true,

                        options:
                            [
                                "todo",
                                "in-progress",
                                "completed",
                                "blocked",
                                "delayed"
                            ]

                    },

                    {

                        name:
                            "delayUntil",

                        label:
                            "Delay Until (optional)",

                        type:
                            "date",

                        required:
                            false

                    },

                    {

                        name:
                            "delayReason",

                        label:
                            "Delay Reason (optional)",

                        type:
                            "textarea",

                        required:
                            false,

                        placeholder:
                            "Why is this task delayed?"

                    }
                ]

        },


        references: {

            title:
                "Add Reference",

            description:
                "Add an external resource or useful engineering reference.",

            submitText:
                "Add Reference",

            fields:
                [
                    {

                        name:
                            "title",

                        label:
                            "Reference Title",

                        type:
                            "text",

                        required:
                            true,

                        placeholder:
                            "Enter reference title"

                    },

                    {

                        name:
                            "url",

                        label:
                            "URL",

                        type:
                            "url",

                        required:
                            false,

                        placeholder:
                            "https://..."

                    },

                    {

                        name:
                            "description",

                        label:
                            "Description",

                        type:
                            "textarea",

                        required:
                            false,

                        placeholder:
                            "Brief description..."

                    }
                ]

        },


        tests: {

            title:
                "Add Test",

            description:
                "Add a validation or verification test.",

            submitText:
                "Add Test",

            fields:
                [
                    {

                        name:
                            "title",

                        label:
                            "Test Name",

                        type:
                            "text",

                        required:
                            true,

                        placeholder:
                            "Enter test name"

                    },

                    {

                        name:
                            "description",

                        label:
                            "Test Description",

                        type:
                            "textarea",

                        required:
                            false,

                        placeholder:
                            "Describe the verification..."

                    },

                    {

                        name:
                            "status",

                        label:
                            "Status",

                        type:
                            "select",

                        required:
                            true,

                        options:
                            [
                                "pending",
                                "passed",
                                "failed",
                                "in-progress"
                            ]

                    },

                    {

                        name:
                            "result",

                        label:
                            "Result",

                        type:
                            "text",

                        required:
                            false,

                        placeholder:
                            "Test result..."

                    }
                ]

        }

    };


    return (
        configurations[
        section
        ] ||
        null
    );

}


/* =========================================================
   CREATE MODAL FIELD
========================================================= */

function createDesignModalField(
    field
) {

    const label =
        `
            <label
                style="
                    display:block;
                    margin-bottom:7px;
                    font-size:10px;
                    font-weight:600;
                    color:#d8d4e5;
                    letter-spacing:0.4px;
                "
            >
                ${field.label}
                ${field.required
            ? `<span style="color:#a78bfa">*</span>`
            : ""
        }
            </label>
        `;


    let input =
        "";


    if (
        field.type === "textarea"
    ) {

        input =
            `
                <textarea
                    name="${field.name}"
                    placeholder="${field.placeholder || ""}"
                    style="
                        width:100%;
                        min-height:100px;
                        resize:vertical;
                        box-sizing:border-box;
                        padding:11px 12px;
                        border:1px solid rgba(255,255,255,0.12);
                        border-radius:8px;
                        outline:none;
                        background:#0b0d15;
                        color:#f5f3ff;
                        font-family:inherit;
                        font-size:12px;
                        line-height:1.5;
                    "
                ></textarea>
            `;

    }


    else if (
        field.type === "select"
    ) {

        input =
            `
                <select
                    name="${field.name}"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        padding:11px 12px;
                        border:1px solid rgba(255,255,255,0.12);
                        border-radius:8px;
                        outline:none;
                        background:#0b0d15;
                        color:#f5f3ff;
                        font-family:inherit;
                        font-size:12px;
                    "
                >
                    ${field.options
                .map(
                    option =>
                        `
                                        <option
                                            value="${option}"
                                        >
                                            ${formatStatus(
                            option
                        )}
                                        </option>
                                    `
                )
                .join(
                    ""
                )
            }
                </select>
            `;

    }


    else {

        input =
            `
                <input
                    type="${field.type || "text"}"
                    name="${field.name}"
                    placeholder="${field.placeholder || ""}"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        padding:11px 12px;
                        border:1px solid rgba(255,255,255,0.12);
                        border-radius:8px;
                        outline:none;
                        background:#0b0d15;
                        color:#f5f3ff;
                        font-family:inherit;
                        font-size:12px;
                    "
                >
            `;

    }


    return `

        <div
            style="
                margin-bottom:16px;
            "
        >
            ${label}

            ${input}

        </div>

    `;

}


/* =========================================================
   GET MODAL VALUES
========================================================= */

function getDesignModalValues(
    fields
) {

    const values =
        {};


    fields.forEach(
        field => {

            const input =
                document.querySelector(
                    `#designAddForm [name="${field.name}"]`
                );


            values[
                field.name
            ] =
                input
                    ? String(
                        input.value
                    ).trim()
                    : "";

        }
    );


    return values;

}


/* =========================================================
   VALIDATE MODAL
========================================================= */

function validateDesignModalValues(
    fields,
    values
) {

    for (
        const field of fields
    ) {

        if (
            field.required &&
            !values[
            field.name
            ]
        ) {

            return (
                `${field.label} is required.`
            );

        }

    }


    return "";

}


/* =========================================================
   ADD SECTION ITEM
========================================================= */

async function addDesignSectionItem(
    section,
    values
) {

    const now =
        new Date()
            .toISOString();


    let item;


    switch (
    section
    ) {

        case "requirements":

            item =
                values.text;

            designData.requirements.push(
                item
            );

            break;


        case "objectives":

            item =
                values.text;

            designData.objectives.push(
                item
            );

            break;


        case "constraints":

            item =
            {

                key:
                    values.key,

                value:
                    values.value

            };

            designData.constraints.push(
                item
            );

            break;


        case "tools":

            item =
            {

                name:
                    values.name

            };

            designData.tools.push(
                item
            );

            break;


        case "specifications":

            item =
            {

                name:
                    values.name,

                value:
                    values.value,

                unit:
                    values.unit

            };

            designData.specifications.push(
                item
            );

            break;


        case "materials":

            item =
            {

                name:
                    values.name,

                symbol:
                    values.symbol,

                usage:
                    values.usage

            };

            designData.materials.push(
                item
            );

            break;


        case "components":

            item =
            {

                name:
                    values.name,

                description:
                    values.description,

                category:
                    values.category,

                tags:
                    values.tags
                        ? values.tags
                            .split(
                                ","
                            )
                            .map(
                                tag =>
                                    tag.trim()
                            )
                            .filter(
                                Boolean
                            )
                        : []

            };

            designData.components.push(
                item
            );

            break;


        case "iterations":

            item =
            {

                title:
                    values.title,

                description:
                    values.description,

                version:
                    values.version,

                date:
                    now,

                createdAt:
                    now

            };

            designData.iterations.push(
                item
            );

            break;


        case "decisions":

            item =
            {

                title:
                    values.title,

                description:
                    values.description,

                createdAt:
                    now

            };

            designData.decisions.push(
                item
            );

            break;


        case "risks":

            item =
            {

                title:
                    values.title,

                description:
                    values.description,

                level:
                    values.level,

                createdAt:
                    now

            };

            designData.risks.push(
                item
            );

            break;


        case "tasks":

            item =
            {

                title:
                    values.title,

                category:
                    values.category,

                status:
                    values.delayUntil
                        ? "delayed"
                        : values.status,

                completed:
                    values.status ===
                    "completed",

                done:
                    values.status ===
                    "completed",

                delayed:
                    Boolean(values.delayUntil) ||
                    values.status ===
                    "delayed",

                delayUntil:
                    values.delayUntil ||
                    null,

                delayReason:
                    values.delayReason ||
                    "",

                createdAt:
                    now

            };

            designData.tasks.push(
                item
            );

            break;


        case "references":

            item =
            {

                title:
                    values.title,

                url:
                    normalizeDesignURL(
                        values.url
                    ),

                description:
                    values.description,

                createdAt:
                    now

            };

            designData.links.push(
                item
            );

            break;


        case "tests":

            item =
            {

                title:
                    values.title,

                description:
                    values.description,

                status:
                    values.status,

                result:
                    values.result,

                createdAt:
                    now

            };

            designData.tests.push(
                item
            );

            break;


        default:

            return;

    }
    markDesignChanged();
    renderEverything();

    try {
        await saveDesignData();
        showTemporaryMessage(
            `${getDesignSectionLabel(section)} added.`
        );
    } catch (error) {
        const collection = section === "references" ? designData.links : designData[section];
        if (Array.isArray(collection)) {
            const position = collection.lastIndexOf(item);
            if (position >= 0) collection.splice(position, 1);
        }
        renderEverything();
        showTemporaryMessage(error.message || `Unable to add ${getDesignSectionLabel(section).toLowerCase()}.`);
    }

}


/* =========================================================
   NORMALIZE URL
========================================================= */

function normalizeDesignURL(
    url
) {

    const value =
        String(
            url ||
            ""
        ).trim();


    if (!value) {

        return "";

    }


    if (
        /^https?:\/\//i.test(
            value
        )
    ) {

        return value;

    }


    return (
        `https://${value}`
    );

}




/* =========================================================
   SECTION LABEL
========================================================= */

function getDesignSectionLabel(
    section
) {

    const labels =
    {

        requirements:
            "Requirement",

        objectives:
            "Objective",

        constraints:
            "Constraint",

        tools:
            "Tool",

        specifications:
            "Specification",

        materials:
            "Material",

        components:
            "Component",

        iterations:
            "Iteration",

        decisions:
            "Design decision",

        risks:
            "Risk",

        tasks:
            "Task",

        references:
            "Reference",

        tests:
            "Test",

        timeline:
            "Timeline entry"

    };


    return (
        labels[
        section
        ] ||
        "Item"
    );

}


/* =========================================================
   MARK DESIGN AS CHANGED
========================================================= */

function markDesignChanged() {

    hasUnsavedChanges =
        true;


    designData.updatedAt =
        new Date()
            .toISOString();

}

/* =========================================================
   FILE ACTIONS
========================================================= */

function initializeFileActions() {

    /*
     * Files are dynamically rendered.
     * File actions are attached inside renderFiles().
     */

}


/* =========================================================
   REFERENCE ACTIONS
========================================================= */

function initializeReferenceActions() {

    /*
     * References are dynamically rendered.
     */

}


/* =========================================================
   MORE MENU
========================================================= */

function showMoreMenu(
    button
) {

    const existingMenu =
        document.querySelector(
            ".design-more-menu"
        );


    if (existingMenu) {

        existingMenu.remove();

        return;

    }


    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "design-more-menu";


    menu.innerHTML = `

        <button
            type="button"
            data-action="duplicate"
        >
            Duplicate Design
        </button>

        <button
            type="button"
            data-action="export"
        >
            Export Record
        </button>

        <button
            type="button"
            data-action="reset"
        >
            Reset Unsaved Changes
        </button>

    `;


    Object.assign(
        menu.style,
        {

            position:
                "fixed",

            zIndex:
                "999",

            minWidth:
                "180px",

            padding:
                "5px",

            border:
                "1px solid rgba(139,92,246,0.28)",

            borderRadius:
                "8px",

            background:
                "rgba(15,17,29,0.98)",

            boxShadow:
                "0 15px 40px rgba(0,0,0,0.4)",

            backdropFilter:
                "blur(15px)"

        }
    );


    const rect =
        button.getBoundingClientRect();


    menu.style.top =
        `${rect.bottom + 7}px`;


    menu.style.right =
        `${window.innerWidth - rect.right}px`;


    document.body.appendChild(
        menu
    );


    menu.querySelectorAll(
        "button"
    )
        .forEach(
            item => {

                Object.assign(
                    item.style,
                    {

                        display:
                            "block",

                        width:
                            "100%",

                        padding:
                            "9px 10px",

                        border:
                            "none",

                        borderRadius:
                            "5px",

                        background:
                            "transparent",

                        color:
                            "#aaa6b9",

                        textAlign:
                            "left",

                        fontSize:
                            "9px",

                        cursor:
                            "pointer"

                    }
                );


                item.addEventListener(
                    "click",
                    () => {

                        handleMoreAction(
                            item.dataset.action
                        );


                        menu.remove();

                    }
                );

            }
        );


    setTimeout(
        () => {

            document.addEventListener(
                "click",
                function closeMenu(
                    event
                ) {

                    if (

                        !menu.contains(
                            event.target
                        ) &&

                        event.target !==
                        button

                    ) {

                        menu.remove();


                        document.removeEventListener(
                            "click",
                            closeMenu
                        );

                    }

                }
            );

        },
        0
    );

}


/* =========================================================
   MORE ACTIONS
========================================================= */

function handleMoreAction(
    action
) {

    switch (action) {

        case "duplicate":

            showTemporaryMessage(
                "Design duplication will be added later."
            );

            break;


        case "export":

            exportDesignRecord();

            break;


        case "reset":

            askConfirm(

                "Reset Unsaved Changes",

                "Discard all unsaved changes and reload the saved Design data?",

                async () => {

                    try {

                        await loadDesignData();

                        renderEverything();


                        hasUnsavedChanges =
                            false;


                        showTemporaryMessage(
                            "Unsaved changes discarded."
                        );

                    }

                    catch (error) {

                        showTemporaryMessage(
                            error.message ||
                            "Unable to reload Design."
                        );

                    }

                }

            );

            break;


        default:

            break;

    }

}


/* =========================================================
   EXPORT DESIGN RECORD
========================================================= */

function exportDesignRecord() {

    if (!designData) {
        return;
    }


    const blob =
        new Blob(

            [

                JSON.stringify(

                    convertDesignDataToRigidData(
                        designData
                    ),

                    null,

                    4

                )

            ],

            {

                type:
                    "application/json"

            }

        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `${slugify(
            designData.title
        ) || "rigid-design"}-record.json`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );


    showTemporaryMessage(
        "Design record exported."
    );

}

/* =========================================================
   DESIGN FILE UPLOAD
========================================================= */

function openDesignFilePicker() {

    if (
        !currentWorkId
    ) {

        showTemporaryMessage(
            "Design ID is missing."
        );

        return;

    }


    const existingInput =
        getElement(
            "designFilePicker"
        );


    if (
        existingInput
    ) {

        existingInput.remove();

    }


    const input =
        document.createElement(
            "input"
        );


    input.id =
        "designFilePicker";


    input.type =
        "file";


    input.multiple =
        true;


    input.style.display =
        "none";


    document.body.appendChild(
        input
    );


    input.addEventListener(
        "change",
        async event => {

            const files =
                Array.from(
                    event.target.files ||
                    []
                );


            if (
                !files.length
            ) {

                input.remove();

                return;

            }


            try {

                await uploadDesignFiles(
                    files
                );

            }

            catch (
            error
            ) {

                console.error(
                    "Design file upload error:",
                    error
                );


                showTemporaryMessage(
                    error.message ||
                    "Unable to upload file."
                );

            }

            finally {

                input.remove();

            }

        }
    );


    input.click();

}


/* =========================================================
   UPLOAD DESIGN FILES
========================================================= */

async function uploadDesignFiles(
    files
) {

    if (
        !designData
    ) {

        throw new Error(
            "Design data is not loaded."
        );

    }


    if (
        !currentWorkId
    ) {

        throw new Error(
            "Design ID is missing."
        );

    }


    if (
        !Array.isArray(
            designData.attachments
        )
    ) {

        designData.attachments =
            [];

    }


    let uploadedCount =
        0;


    for (
        const file of files
    ) {

        showTemporaryMessage(
            `Uploading ${file.name}...`
        );


        const uploadedAttachment =
            await uploadSingleDesignFile(
                file
            );


        designData.attachments.unshift(
            uploadedAttachment
        );


        uploadedCount++;

    }


    markDesignChanged();


    renderFiles();


    updateSummary();


    try {

        await saveDesignData();


        showTemporaryMessage(
            `${uploadedCount} file${uploadedCount === 1
                ? ""
                : "s"
            } uploaded successfully.`
        );

    }

    catch (
    error
    ) {

        console.error(
            "Unable to save uploaded file metadata:",
            error
        );


        throw new Error(
            "File was uploaded, but its Design record could not be saved."
        );

    }

}


/* =========================================================
   UPLOAD SINGLE DESIGN FILE
========================================================= */

async function uploadSingleDesignFile(
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
        file,
        file.name
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
        !result.success
    ) {

        throw new Error(

            result.error ||
            "Unable to upload file."

        );

    }


    const uploadedFile =
        result.file ||
        {};


    const now =
        new Date()
            .toISOString();


    return {

        id:
            uploadedFile.id ||
            uploadedFile.driveFileId ||
            `file-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`,


        driveFileId:
            uploadedFile.id ||
            uploadedFile.driveFileId ||
            "",


        name:
            uploadedFile.name ||
            file.name,


        mimeType:
            uploadedFile.mimeType ||
            file.type ||
            "application/octet-stream",


        size:
            Number(
                uploadedFile.size ||
                file.size ||
                0
            ),


        fileType:
            getDesignFileCategory(
                uploadedFile.mimeType ||
                file.type,
                uploadedFile.name ||
                file.name
            ),


        date:
            uploadedFile.createdTime ||
            uploadedFile.modifiedTime ||
            now,


        createdAt:
            now,


        url:
            uploadedFile.webViewLink ||
            uploadedFile.url ||
            uploadedFile.publicUrl ||
            (
                uploadedFile.id
                    ? `https://drive.google.com/file/d/${uploadedFile.id}/view`
                    : ""
            ),


        publicUrl:
            uploadedFile.webViewLink ||
            "",


        downloadUrl:
            uploadedFile.webContentLink ||
            "",


        description:
            ""

    };

}


/* =========================================================
   DESIGN FILE CATEGORY
========================================================= */

function getDesignFileCategory(
    mimeType,
    fileName
) {

    const mime =
        String(
            mimeType ||
            ""
        )
            .toLowerCase();


    const name =
        String(
            fileName ||
            ""
        )
            .toLowerCase();


    if (
        mime.startsWith(
            "image/"
        )
    ) {

        return "IMAGE";

    }


    if (
        mime.startsWith(
            "video/"
        )
    ) {

        return "VIDEO";

    }


    if (
        mime.includes(
            "pdf"
        ) ||
        name.endsWith(
            ".pdf"
        )
    ) {

        return "PDF";

    }


    if (
        name.endsWith(
            ".step"
        ) ||
        name.endsWith(
            ".stp"
        )
    ) {

        return "STEP MODEL";

    }


    if (
        name.endsWith(
            ".stl"
        )
    ) {

        return "STL MODEL";

    }


    if (
        name.endsWith(
            ".iges"
        ) ||
        name.endsWith(
            ".igs"
        )
    ) {

        return "IGES MODEL";

    }


    if (
        name.endsWith(
            ".sldprt"
        ) ||
        name.endsWith(
            ".sldasm"
        ) ||
        name.endsWith(
            ".dwg"
        ) ||
        name.endsWith(
            ".dxf"
        )
    ) {

        return "CAD";

    }


    if (
        mime.includes(
            "word"
        ) ||
        name.endsWith(
            ".doc"
        ) ||
        name.endsWith(
            ".docx"
        )
    ) {

        return "DOCUMENT";

    }


    if (
        mime.includes(
            "sheet"
        ) ||
        mime.includes(
            "excel"
        ) ||
        name.endsWith(
            ".xls"
        ) ||
        name.endsWith(
            ".xlsx"
        ) ||
        name.endsWith(
            ".csv"
        )
    ) {

        return "SPREADSHEET";

    }


    if (
        mime.includes(
            "presentation"
        ) ||
        mime.includes(
            "powerpoint"
        ) ||
        name.endsWith(
            ".ppt"
        ) ||
        name.endsWith(
            ".pptx"
        )
    ) {

        return "PRESENTATION";

    }


    if (
        mime.includes(
            "zip"
        ) ||
        mime.includes(
            "compressed"
        ) ||
        name.endsWith(
            ".zip"
        ) ||
        name.endsWith(
            ".rar"
        ) ||
        name.endsWith(
            ".7z"
        )
    ) {

        return "ARCHIVE";

    }


    return "FILE";

}
/* =========================================================
   OPEN ATTACHMENT
========================================================= */

function openAttachment(
    attachment
) {

    const url =
        attachment.url ||
        attachment.publicUrl ||
        attachment.path ||
        "";


    if (!url) {

        showTemporaryMessage(
            "File URL is unavailable."
        );

        return;

    }


    window.open(
        url,
        "_blank",
        "noopener"
    );

}


/* =========================================================
   CUSTOM CONFIRM MODAL
========================================================= */

function askConfirm(

    title,

    message,

    onConfirm

) {

    const existing =
        getElement(
            "designConfirmModal"
        );


    if (existing) {

        existing.remove();

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "designConfirmModal";


    Object.assign(
        overlay.style,
        {

            position:
                "fixed",

            inset:
                "0",

            zIndex:
                "10000",

            display:
                "flex",

            alignItems:
                "center",

            justifyContent:
                "center",

            padding:
                "20px",

            background:
                "rgba(0,0,0,0.62)"

        }
    );


    const modal =
        document.createElement(
            "div"
        );


    Object.assign(
        modal.style,
        {

            width:
                "min(420px, 100%)",

            padding:
                "22px",

            border:
                "1px solid rgba(139,92,246,0.32)",

            borderRadius:
                "14px",

            background:
                "#11131f",

            boxShadow:
                "0 25px 80px rgba(0,0,0,0.55)",

            color:
                "#f5f3ff"

        }
    );


    const heading =
        document.createElement(
            "h3"
        );


    heading.textContent =
        title;


    heading.style.margin =
        "0 0 10px";


    const description =
        document.createElement(
            "p"
        );


    description.textContent =
        message;


    Object.assign(
        description.style,
        {

            margin:
                "0",

            color:
                "#aaa6b9",

            fontSize:
                "13px",

            lineHeight:
                "1.6"

        }
    );


    const actions =
        document.createElement(
            "div"
        );


    Object.assign(
        actions.style,
        {

            display:
                "flex",

            justifyContent:
                "flex-end",

            gap:
                "10px",

            marginTop:
                "20px"

        }
    );


    const cancel =
        document.createElement(
            "button"
        );


    cancel.type =
        "button";


    cancel.textContent =
        "Cancel";


    const confirm =
        document.createElement(
            "button"
        );


    confirm.type =
        "button";


    confirm.textContent =
        "Confirm";


    styleModalButton(
        cancel,
        false
    );


    styleModalButton(
        confirm,
        true
    );


    cancel.addEventListener(
        "click",
        () =>
            overlay.remove()
    );


    confirm.addEventListener(
        "click",
        () => {

            /*
             * IMPORTANT:
             * Remove the confirmation modal immediately.
             * Never wait for the Supabase request before closing it.
             */
            overlay.remove();

            /*
             * Run the actual action asynchronously after the modal
             * has already disappeared. Any normal errors are handled
             * by the individual action itself; this catch is only a
             * safety net for unexpected failures.
             */
            Promise.resolve()
                .then(
                    () => onConfirm()
                )
                .catch(
                    error => {

                        console.error(
                            "Design confirmation action error:",
                            error
                        );

                        showTemporaryMessage(
                            error?.message ||
                            "Unable to complete the requested action."
                        );

                    }
                );

        }
    );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {

                overlay.remove();

            }

        }
    );


    actions.appendChild(
        cancel
    );


    actions.appendChild(
        confirm
    );


    modal.appendChild(
        heading
    );


    modal.appendChild(
        description
    );


    modal.appendChild(
        actions
    );


    overlay.appendChild(
        modal
    );


    document.body.appendChild(
        overlay
    );

}


/* =========================================================
   CONFIRM BUTTON STYLE
========================================================= */

function styleModalButton(
    button,
    primary
) {

    Object.assign(
        button.style,
        {

            padding:
                "9px 14px",

            border:
                primary
                    ? "1px solid rgba(139,92,246,0.55)"
                    : "1px solid rgba(255,255,255,0.12)",

            borderRadius:
                "7px",

            background:
                primary
                    ? "rgba(139,92,246,0.22)"
                    : "rgba(255,255,255,0.04)",

            color:
                primary
                    ? "#ddd6fe"
                    : "#aaa6b9",

            cursor:
                "pointer"

        }
    );

}


/* =========================================================
   SAVE FEEDBACK
========================================================= */

function showSaveFeedback(
    button,
    message
) {

    if (!button) {
        return;
    }


    /*
     * Feedback must be visual only.
     * Do not keep the Save button disabled while waiting for
     * an artificial timeout. The actual save operation already
     * controls its own isSaving state.
     */
    const originalText =
        button.dataset.originalText ||
        button.textContent;


    button.dataset.originalText =
        originalText;


    button.textContent =
        message;


    button.disabled =
        false;

}


/* =========================================================
   LOADING
========================================================= */

function setLoading(
    isLoading
) {

    const saveButton =
        getElement(
            "saveButton"
        );


    if (saveButton) {

        saveButton.disabled =
            isLoading;

    }


    document.body.classList.toggle(
        "design-loading",
        isLoading
    );

}


/* =========================================================
   PAGE EXIT WARNING
========================================================= */

window.addEventListener(
    "beforeunload",
    event => {

        if (
            !hasUnsavedChanges
        ) {
            return;
        }


        event.preventDefault();

        event.returnValue =
            "";

    }
);


/* =========================================================
   TOAST
========================================================= */

function showTemporaryMessage(
    message
) {

    const existing =
        document.querySelector(
            ".design-toast"
        );


    if (existing) {

        existing.remove();

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "design-toast";


    toast.textContent =
        message;


    Object.assign(
        toast.style,
        {

            position:
                "fixed",

            left:
                "50%",

            bottom:
                "24px",

            transform:
                "translateX(-50%)",

            zIndex:
                "9999",

            maxWidth:
                "min(90vw, 500px)",

            padding:
                "10px 14px",

            border:
                "1px solid rgba(139,92,246,0.35)",

            borderRadius:
                "8px",

            background:
                "rgba(15,17,29,0.96)",

            color:
                "#c4b5fd",

            fontFamily:
                '"Inter", sans-serif',

            fontSize:
                "11px",

            lineHeight:
                "1.4",

            boxShadow:
                "0 15px 40px rgba(0,0,0,0.4)",

            backdropFilter:
                "blur(15px)",

            opacity:
                "0",

            transition:
                "opacity 0.2s ease"

        }
    );


    document.body.appendChild(
        toast
    );


    requestAnimationFrame(
        () => {

            toast.style.opacity =
                "1";

        }
    );


    setTimeout(
        () => {

            toast.style.opacity =
                "0";


            setTimeout(
                () => {

                    toast.remove();

                },
                200
            );

        },
        2300
    );

}


/* =========================================================
   HELPERS
========================================================= */

function ensureArray(
    value
) {

    return Array.isArray(
        value
    )
        ? value
        : [];

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


    return Math.min(
        100,
        Math.max(
            0,
            Math.round(
                number
            )
        )
    );

}


function formatDisplayDate(
    value
) {

    if (!value) {
        return "—";
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

        return "—";

    }


    return date.toLocaleDateString(

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


function formatStatus(
    status
) {

    return String(
        status ||
        "in-progress"
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


function getStatusClass(
    status
) {

    const value =
        String(
            status ||
            ""
        )
            .toLowerCase();


    if (
        value === "completed" ||
        value === "complete"
    ) {

        return "status-completed";

    }


    if (
        value === "archived"
    ) {

        return "status-archived";

    }


    return "status-ongoing";

}


function isTaskCompleted(
    task
) {

    const status =
        String(
            task.status ||
            ""
        )
            .toLowerCase();


    return (

        task.completed === true ||

        task.done === true ||

        status === "done" ||

        status === "completed" ||

        status === "complete"

    );

}


function getInitials(
    text
) {

    return String(
        text ||
        ""
    )

        .split(
            " "
        )

        .filter(
            Boolean
        )

        .slice(
            0,
            2
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


function createEmptyState(
    message
) {

    return `
        <div
            class="empty-state"
            style="
                padding: 12px 0;
                color: #777487;
                font-size: 11px;
            "
        >
            ${message}
        </div>
    `;

}


function getFileType(
    attachment
) {

    const name =
        attachment.name ||
        attachment.title ||
        "";


    const extension =
        name
            .split(
                "."
            )
            .pop()
            ?.toLowerCase();


    return (
        attachment.type ||
        extension ||
        "file"
    );

}


function getFileIconClass(
    type
) {

    const value =
        String(
            type
        )
            .toLowerCase();


    if (

        [
            "step",
            "stp",
            "sldprt",
            "sldasm",
            "dwg",
            "dxf"

        ]
            .includes(
                value
            )

    ) {

        return "file-cad";

    }


    if (
        value === "pdf"
    ) {

        return "file-pdf";

    }


    if (

        [
            "png",
            "jpg",
            "jpeg",
            "webp",
            "gif"

        ]
            .includes(
                value
            )

    ) {

        return "file-image";

    }


    return "";

}


function getFileIconLabel(
    type
) {

    const value =
        String(
            type
        )
            .toLowerCase();


    if (

        [
            "step",
            "stp",
            "sldprt",
            "sldasm",
            "dwg",
            "dxf"

        ]
            .includes(
                value
            )

    ) {

        return "CAD";

    }


    if (
        value === "pdf"
    ) {

        return "PDF";

    }


    if (

        [
            "png",
            "jpg",
            "jpeg",
            "webp",
            "gif"

        ]
            .includes(
                value
            )

    ) {

        return "IMG";

    }


    return "FILE";

}


function formatFileSize(
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

        return "—";

    }


    if (
        value < 1024
    ) {

        return `${value} B`;

    }


    if (
        value <
        1024 * 1024
    ) {

        return `${(
            value /
            1024
        )
            .toFixed(
                1
            )} KB`;

    }


    return `${(
        value /
        (
            1024 *
            1024
        )
    )
        .toFixed(
            1
        )} MB`;

}


function slugify(
    value
) {

    return String(
        value ||
        ""
    )

        .toLowerCase()

        .trim()

        .replace(
            /[^a-z0-9]+/g,
            "-"
        )

        .replace(
            /^-+|-+$/g,
            ""
        );

}

/* =========================================================
   DELETE DESIGN ITEM
========================================================= */

async function deleteDesignItem(section, index) {

    if (!designData) return;

    const sectionMap = {
        requirements: "requirements", objectives: "objectives", constraints: "constraints",
        tools: "tools", specifications: "specifications", materials: "materials",
        components: "components", iterations: "iterations", decisions: "decisions",
        risks: "risks", tasks: "tasks", references: "links", tests: "tests", files: "attachments"
    };

    const property = sectionMap[section];
    if (!property || !Array.isArray(designData[property])) return;
    if (index < 0 || index >= designData[property].length) return;

    const item = designData[property][index];
    const label = getDesignSectionLabel(section);
    const itemName =
        typeof item === "string"
            ? item
            : item?.title ||
            item?.name ||
            item?.key ||
            label;

    askConfirm(
        `Delete ${label}`,
        `Are you sure you want to delete ${itemName}? This will also remove it from the saved Design data.`,
        async () => {
            designData[property].splice(index, 1);


            markDesignChanged();
            renderEverything();

            try {
                await saveDesignData();
                showTemporaryMessage(`${label} removed.`);
            } catch (error) {
                designData[property].splice(index, 0, item);
                renderEverything();
                showTemporaryMessage(error.message || `Unable to remove ${label.toLowerCase()}.`);
            }
        }
    );
}

/* =========================================================
   CREATE DELETE BUTTON
========================================================= */

function createDeleteButton(
    section,
    index
) {

    return `

        <button
            type="button"
            class="design-delete-button"
            data-delete-section="${section}"
            data-delete-index="${index}"
            title="Delete"
            aria-label="Delete item"
        >
            ×
        </button>

    `;

}

/* =========================================================
   CONSOLE
========================================================= */
