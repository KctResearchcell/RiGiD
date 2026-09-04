/* =========================================================
   RiGiD - SIMULATION WORKSPACE
========================================================= */


/* =========================================================
   GLOBAL STATE
========================================================= */

let workId = null;
let rigidData = null;
let currentWork = null;


/* =========================================================
   SUPABASE FUNCTION URL
========================================================= */

const SUPABASE_FUNCTIONS_BASE =
    "https://mmmsmncmskvuqyhaqcne.supabase.co/functions/v1";


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            workId =
                new URLSearchParams(
                    window.location.search
                ).get(
                    "work_id"
                );


            if (!workId) {

                showToast(
                    "Simulation ID is missing.",
                    "error"
                );

                return;

            }


            startLiveClock();

            setupNavigation();

            setupModalControls();

            setupButtons();

            setupUploadControls();

            await loadSimulationData();

        }

        catch (error) {

            console.error(
                "Unable to load Simulation:",
                error
            );

            showToast(
                error.message ||
                "Unable to load simulation.",
                "error"
            );

        }

    }
);


/* =========================================================
   GET SUPABASE CLIENT
========================================================= */

function getSupabaseClient() {

    if (
        !window.sb ||
        !window.sb.auth ||
        typeof window.sb.auth.getSession !== "function"
    ) {

        throw new Error(
            "Supabase client is unavailable."
        );

    }


    return window.sb;

}


/* =========================================================
   GET ACCESS TOKEN
========================================================= */

async function getAccessToken() {

    const supabase =
        getSupabaseClient();


    const {

        data: {
            session
        },

        error:
            sessionError

    } =

        await supabase
            .auth
            .getSession();


    if (
        sessionError ||
        !session
    ) {

        throw new Error(
            "You must be logged in to open this Simulation."
        );

    }


    return session.access_token;

}


/* =========================================================
   CALL EDGE FUNCTION
========================================================= */

async function callEdgeFunction(
    functionName,
    body
) {

    const accessToken =
        await getAccessToken();


    const response =
        await fetch(

            `${SUPABASE_FUNCTIONS_BASE}/${functionName}`,

            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${accessToken}`,

                    "apikey":
                        getSupabaseAnonKey()

                },

                body:
                    JSON.stringify(body)

            }

        );


    const result =
        await response.json()
        .catch(
            () => null
        );


    if (!response.ok) {

        throw new Error(

            result?.error ||

            `Request failed (${response.status})`

        );

    }


    if (
        !result ||
        result.success === false
    ) {

        throw new Error(

            result?.error ||

            "Request failed."

        );

    }


    return result;

}


/* =========================================================
   GET SUPABASE ANON KEY
========================================================= */

function getSupabaseAnonKey() {

    /*
       Try common variable names used in
       supabase-client.js
    */

    if (
        window.SUPABASE_ANON_KEY
    ) {

        return window.SUPABASE_ANON_KEY;

    }


    if (
        window.supabaseAnonKey
    ) {

        return window.supabaseAnonKey;

    }


    /*
       Empty fallback.

       Authorization header is the important
       authentication header for the function.
    */

    return "";

}


/* =========================================================
   LOAD SIMULATION DATA
========================================================= */

async function loadSimulationData() {

    const result =
        await callEdgeFunction(

            "get-rigid-work-data",

            {

                work_id:
                    workId

            }

        );


    currentWork =
        result.work;


    rigidData =
        result.data;


    if (!rigidData) {

        throw new Error(
            "Simulation data could not be loaded."
        );

    }


    ensureSimulationStructure();

    renderSimulation();

}


/* =========================================================
   ENSURE DATA STRUCTURE
========================================================= */

function ensureSimulationStructure() {

    if (!rigidData.workspace) {

        rigidData.workspace = {};

    }


    if (!rigidData.simulation) {

        rigidData.simulation = {};

    }


    /*
       Simulation fields
    */

    if (
        typeof rigidData.simulation.description !==
        "string"
    ) {

        rigidData.simulation.description =
            "";

    }


    if (
        typeof rigidData.simulation.objective !==
        "string"
    ) {

        rigidData.simulation.objective =
            "";

    }


    if (
        !Array.isArray(
            rigidData.simulation.tools
        )
    ) {

        rigidData.simulation.tools =
            [];

    }


    if (
        !Array.isArray(
            rigidData.simulation.tags
        )
    ) {

        rigidData.simulation.tags =
            [];

    }


    if (
        typeof rigidData.simulation.status !==
        "string"
    ) {

        rigidData.simulation.status =
            "in-progress";

    }


    if (
        typeof rigidData.simulation.progress !==
        "number"
    ) {

        rigidData.simulation.progress =
            0;

    }


    if (
        typeof rigidData.simulation.theory !==
        "string"
    ) {

        rigidData.simulation.theory =
            "";

    }


    if (
        !Array.isArray(
            rigidData.simulation.equations
        )
    ) {

        rigidData.simulation.equations =
            [];

    }


    if (
        typeof rigidData.simulation.modelNotes !==
        "string"
    ) {

        rigidData.simulation.modelNotes =
            "";

    }


    if (
        !rigidData.simulation.modelImage
    ) {

        rigidData.simulation.modelImage =
            null;

    }


    if (
        typeof rigidData.simulation.observations !==
        "string"
    ) {

        rigidData.simulation.observations =
            "";

    }


    if (
        typeof rigidData.simulation.conclusion !==
        "string"
    ) {

        rigidData.simulation.conclusion =
            "";

    }


    if (
        typeof rigidData.simulation.notes !==
        "string"
    ) {

        rigidData.simulation.notes =
            "";

    }


    /*
       Arrays
    */

    if (
        !Array.isArray(
            rigidData.parameters
        )
    ) {

        rigidData.parameters =
            [];

    }


    if (
        !Array.isArray(
            rigidData.results
        )
    ) {

        rigidData.results =
            [];

    }


    if (
        !Array.isArray(
            rigidData.problems
        )
    ) {

        rigidData.problems =
            [];

    }


    if (
        !Array.isArray(
            rigidData.timeline
        )
    ) {

        rigidData.timeline =
            [];

    }


    if (
        !Array.isArray(
            rigidData.futureWork
        )
    ) {

        rigidData.futureWork =
            [];

    }


    if (
        !Array.isArray(
            rigidData.attachments
        )
    ) {

        rigidData.attachments =
            [];

    }


    if (
        !Array.isArray(
            rigidData.links
        )
    ) {

        rigidData.links =
            [];

    }


    /*
       Metadata
    */

    if (
        !rigidData.workspace.status
    ) {

        rigidData.workspace.status =
            rigidData.simulation.status;

    }

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderSimulation() {

    renderHeader();

    renderOverview();

    renderTheory();

    renderParameters();

    renderModel();

    renderResults();

    renderConclusion();

    renderTimeline();

    renderFutureWork();

    renderFiles();

    renderNotes();

}


/* =========================================================
   RENDER HEADER
========================================================= */

function renderHeader() {

    const title =
        rigidData.workspace?.title ||

        currentWork?.title ||

        "Untitled Simulation";


    setText(
        "simulationTitle",
        title
    );


    const description =
        rigidData.simulation.description ||

        rigidData.simulation.objective ||

        "No simulation description added yet.";


    setText(
        "simulationDescription",
        description
    );


    const status =
        rigidData.simulation.status ||
        "in-progress";


    setText(

        "simulationStatus",

        `● ${formatStatus(status).toUpperCase()}`

    );


    setText(

        "simulationOwner",

        rigidData.workspace?.owner ||
        "You"

    );


    setText(

        "simulationCreated",

        formatDate(

            rigidData.workspace?.createdAt ||

            currentWork?.created_at

        )

    );


    setText(

        "simulationUpdated",

        formatDate(

            rigidData.workspace?.updatedAt ||

            currentWork?.updated_at

        )

    );


    const tagsContainer =
        document.getElementById(
            "simulationTags"
        );


    if (!tagsContainer) {

        return;

    }


    tagsContainer.innerHTML =
        "";


    rigidData.simulation.tags.forEach(
        tag => {

            const span =
                document.createElement(
                    "span"
                );


            span.className =
                "simulation-tag";


            span.textContent =
                tag;


            tagsContainer.appendChild(
                span
            );

        }
    );

}


/* =========================================================
   RENDER OVERVIEW
========================================================= */

function renderOverview() {

    const description =
        rigidData.simulation.description ||

        rigidData.simulation.objective ||

        "No simulation description added yet.";


    setText(
        "descriptionContent",
        description
    );


    const softwareList =
        document.getElementById(
            "softwareList"
        );


    if (softwareList) {

        softwareList.innerHTML =
            "";


        if (
            rigidData.simulation.tools.length ===
            0
        ) {

            softwareList.innerHTML =
                `<p class="empty-state">
                    No software added yet.
                </p>`;

        }

        else {

            rigidData.simulation.tools.forEach(
                tool => {

                    const item =
                        document.createElement(
                            "span"
                        );


                    item.className =
                        "software-item";


                    item.textContent =
                        tool;


                    softwareList.appendChild(
                        item
                    );

                }
            );

        }

    }


    const progress =
        Math.max(

            0,

            Math.min(

                100,

                Number(
                    rigidData.simulation.progress
                ) || 0

            )

        );


    setText(
        "progressValue",
        `${progress}%`
    );


    const progressFill =
        document.getElementById(
            "progressFill"
        );


    if (progressFill) {

        progressFill.style.width =
            `${progress}%`;

    }


    setText(

        "statusText",

        formatStatus(
            rigidData.simulation.status
        )

    );

}


/* =========================================================
   RENDER THEORY
========================================================= */

function renderTheory() {

    setText(

        "theoryContent",

        rigidData.simulation.theory ||

        "No theory or methodology added yet."

    );


    const equationList =
        document.getElementById(
            "equationList"
        );


    if (!equationList) {

        return;

    }


    equationList.innerHTML =
        "";


    if (
        rigidData.simulation.equations.length ===
        0
    ) {

        equationList.innerHTML =
            emptyMessage(
                "No equations added yet."
            );


        return;

    }


    rigidData.simulation.equations.forEach(
        equation => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "equation-item";


            item.innerHTML =
                `

                <div class="equation-main">

                    <strong>
                        ${escapeHtml(
                            equation.equation
                        )}
                    </strong>

                    <p>
                        ${escapeHtml(
                            equation.description || ""
                        )}
                    </p>

                </div>

                <div class="item-actions">

                    <button
                        class="icon-action"
                        data-edit-equation="${equation.id}"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-action"
                        data-delete-equation="${equation.id}"
                    >
                        Delete
                    </button>

                </div>

                `;


            equationList.appendChild(
                item
            );

        }
    );


    setupEquationActions();

}


/* =========================================================
   RENDER PARAMETERS
========================================================= */

function renderParameters() {

    const container =
        document.getElementById(
            "parameterGrid"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        rigidData.parameters.length ===
        0
    ) {

        container.innerHTML =
            emptyMessage(
                "No parameters added yet."
            );

        return;

    }


    rigidData.parameters.forEach(
        parameter => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "parameter-card";


            card.innerHTML =
                `

                <div class="parameter-header">

                    <div>

                        <span class="parameter-category">

                            ${escapeHtml(
                                parameter.category ||
                                "Parameter"
                            )}

                        </span>


                        <h3>

                            ${escapeHtml(
                                parameter.name
                            )}

                        </h3>

                    </div>


                    <div class="item-actions">

                        <button
                            data-edit-parameter="${parameter.id}"
                        >
                            Edit
                        </button>


                        <button
                            class="delete-action"
                            data-delete-parameter="${parameter.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>


                <div class="parameter-value">

                    ${escapeHtml(
                        parameter.value || ""
                    )}

                    <span>

                        ${escapeHtml(
                            parameter.unit || ""
                        )}

                    </span>

                </div>


                <p>

                    ${escapeHtml(
                        parameter.description || ""
                    )}

                </p>

                `;


            container.appendChild(
                card
            );

        }
    );


    setupParameterActions();

}


/* =========================================================
   RENDER MODEL
========================================================= */

async function uploadModelImage(
    file
) {

    try {

        showToast(
            "Uploading model image..."
        );


        const uploaded =
            await uploadFileToDrive(
                file
            );


        rigidData.simulation.modelImage = {

            id:
                uploaded.id,

            driveFileId:
                uploaded.id,

            name:
                uploaded.name,

            mimeType:
                uploaded.mimeType,

            size:
                uploaded.size,

            webViewLink:
                uploaded.webViewLink ||
                "",

            webContentLink:
                uploaded.webContentLink ||
                "",

            url:
                uploaded.webContentLink ||
                `https://drive.google.com/uc?export=view&id=${uploaded.id}`

        };


        await saveAndRender();


        showToast(
            "Model image uploaded."
        );

    }

    catch (error) {

        console.error(
            error
        );


        showToast(

            error.message ||
            "Unable to upload model image.",

            "error"

        );

    }

}


/* =========================================================
   RENDER RESULTS
========================================================= */

function renderResults() {

    setText(

        "resultsContent",

        rigidData.simulation.observations ||

        "No observations recorded yet."

    );


    renderResultList();

    renderProblemList();

}


function renderResultList() {

    const container =
        document.getElementById(
            "resultList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        rigidData.results.length ===
        0
    ) {

        container.innerHTML =
            emptyMessage(
                "No key results added yet."
            );

        return;

    }


    rigidData.results.forEach(
        result => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "result-item";


            item.innerHTML =
                `

                <div>

                    <h4>

                        ${escapeHtml(
                            result.name
                        )}

                    </h4>


                    <strong>

                        ${escapeHtml(
                            result.value || ""
                        )}

                        ${escapeHtml(
                            result.unit || ""
                        )}

                    </strong>


                    ${

                        result.expected

                            ?

                            `<p>
                                Expected:
                                ${escapeHtml(
                                    result.expected
                                )}
                            </p>`

                            :

                            ""

                    }


                    <p>

                        ${escapeHtml(
                            result.observation || ""
                        )}

                    </p>

                </div>


                <div class="item-actions">

                    <button
                        data-edit-result="${result.id}"
                    >
                        Edit
                    </button>


                    <button
                        class="delete-action"
                        data-delete-result="${result.id}"
                    >
                        Delete
                    </button>

                </div>

                `;


            container.appendChild(
                item
            );

        }
    );


    setupResultActions();

}


function renderProblemList() {

    const container =
        document.getElementById(
            "problemList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        rigidData.problems.length ===
        0
    ) {

        container.innerHTML =
            emptyMessage(
                "No problems recorded."
            );

        return;

    }


    rigidData.problems.forEach(
        problem => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "problem-item";


            item.innerHTML =
                `

                <div>

                    <span class="problem-status">

                        ${escapeHtml(
                            formatStatus(
                                problem.status
                            )
                        )}

                    </span>


                    <h4>

                        ${escapeHtml(
                            problem.title
                        )}

                    </h4>


                    <p>

                        ${escapeHtml(
                            problem.description || ""
                        )}

                    </p>

                </div>


                <div class="item-actions">

                    <button
                        data-edit-problem="${problem.id}"
                    >
                        Edit
                    </button>


                    <button
                        class="delete-action"
                        data-delete-problem="${problem.id}"
                    >
                        Delete
                    </button>

                </div>

                `;


            container.appendChild(
                item
            );

        }
    );


    setupProblemActions();

}


/* =========================================================
   RENDER CONCLUSION
========================================================= */

function renderConclusion() {

    const textarea =
        document.getElementById(
            "conclusionText"
        );


    if (textarea) {

        textarea.value =
            rigidData.simulation.conclusion ||
            "";

    }

}


/* =========================================================
   RENDER TIMELINE
========================================================= */

function renderTimeline() {

    const container =
        document.getElementById(
            "simulationTimeline"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        rigidData.timeline.length ===
        0
    ) {

        container.innerHTML =
            emptyMessage(
                "No timeline entries added yet."
            );

        return;

    }


    const sortedTimeline =
        [...rigidData.timeline]
        .sort(

            (a, b) =>

                new Date(
                    a.date
                ) -

                new Date(
                    b.date
                )

        );


    sortedTimeline.forEach(
        item => {

            const entry =
                document.createElement(
                    "article"
                );


            entry.className =
                "timeline-entry";


            entry.innerHTML =
                `

                <div class="timeline-date">

                    ${escapeHtml(
                        formatDate(
                            item.date
                        )
                    )}

                </div>


                <div class="timeline-content">

                    <span>

                        ${escapeHtml(
                            formatStatus(
                                item.status
                            )
                        )}

                    </span>


                    <h3>

                        ${escapeHtml(
                            item.title
                        )}

                    </h3>


                    <p>

                        ${escapeHtml(
                            item.description || ""
                        )}

                    </p>

                </div>


                <div class="item-actions">

                    <button
                        data-edit-timeline="${item.id}"
                    >
                        Edit
                    </button>


                    <button
                        class="delete-action"
                        data-delete-timeline="${item.id}"
                    >
                        Delete
                    </button>

                </div>

                `;


            container.appendChild(
                entry
            );

        }
    );


    setupTimelineActions();

}


/* =========================================================
   RENDER FUTURE WORK
========================================================= */

function renderFutureWork() {

    const container =
        document.getElementById(
            "futureWorkList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        rigidData.futureWork.length ===
        0
    ) {

        container.innerHTML =
            emptyMessage(
                "No future work added yet."
            );

        return;

    }


    rigidData.futureWork.forEach(
        item => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "future-work-card";


            card.innerHTML =
                `

                <div class="future-work-top">

                    <span class="priority-${escapeHtml(
                        item.priority || "medium"
                    )}">

                        ${escapeHtml(
                            formatStatus(
                                item.priority ||
                                "medium"
                            )
                        )}

                    </span>


                    <div class="item-actions">

                        <button
                            data-edit-future-work="${item.id}"
                        >
                            Edit
                        </button>


                        <button
                            class="delete-action"
                            data-delete-future-work="${item.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>


                <h3>

                    ${escapeHtml(
                        item.title
                    )}

                </h3>


                <p>

                    ${escapeHtml(
                        item.description || ""
                    )}

                </p>


                <small>

                    ${

                        item.date

                            ?

                            `Target: ${escapeHtml(
                                formatDate(
                                    item.date
                                )
                            )}`

                            :

                            ""

                    }

                </small>

                `;


            container.appendChild(
                card
            );

        }
    );


    setupFutureWorkActions();

}


/* =========================================================
   RENDER FILES
========================================================= */

function renderFiles() {

    renderAttachments();

    renderLinks();

}


function renderAttachments() {

    const container =
        document.getElementById(
            "simulationAttachmentGrid"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        rigidData.attachments.length ===
        0
    ) {

        return;

    }


    rigidData.attachments.forEach(
        attachment => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "attachment-card";


            card.innerHTML =
                `

                <div class="attachment-info">

                    <strong>

                        ${escapeHtml(
                            attachment.name ||
                            "Unnamed file"
                        )}

                    </strong>


                    <span>

                        ${escapeHtml(
                            formatFileSize(
                                attachment.size
                            )
                        )}

                    </span>

                </div>


                <div class="attachment-actions">

                    <a
                        href="${escapeHtml(
                            attachment.webViewLink ||
                            attachment.url ||
                            "#"
                        )}"
                        target="_blank"
                        rel="noopener"
                    >
                        Open
                    </a>


                    <button
                        class="delete-action"
                        data-delete-attachment="${attachment.id}"
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


    document
        .querySelectorAll(
            "[data-delete-attachment]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    async () => {

                        const id =
                            button.dataset
                                .deleteAttachment;


                        await deleteAttachment(
                            id
                        );

                    }

                );

            }

        );

}


function renderLinks() {

    const container =
        document.getElementById(
            "simulationLinkList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    rigidData.links.forEach(
        link => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "simulation-link-item";


            item.innerHTML =
                `

                <div>

                    <strong>

                        ${escapeHtml(
                            link.title
                        )}

                    </strong>


                    <p>

                        ${escapeHtml(
                            link.description || ""
                        )}

                    </p>

                </div>


                <div class="attachment-actions">

                    <a
                        href="${escapeHtml(
                            link.url
                        )}"
                        target="_blank"
                        rel="noopener"
                    >
                        Open
                    </a>


                    <button
                        class="delete-action"
                        data-delete-link="${link.id}"
                    >
                        Delete
                    </button>

                </div>

                `;


            container.appendChild(
                item
            );

        }
    );


    document
        .querySelectorAll(
            "[data-delete-link]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    async () => {

                        const id =
                            button.dataset
                                .deleteLink;


                        await deleteLink(
                            id
                        );

                    }

                );

            }

        );

}


/* =========================================================
   RENDER NOTES
========================================================= */

function renderNotes() {

    const notes =
        document.getElementById(
            "simulationNotes"
        );


    if (notes) {

        notes.value =
            rigidData.simulation.notes ||
            "";

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(
            ".simulation-nav-item"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        document
                            .querySelectorAll(
                                ".simulation-nav-item"
                            )
                            .forEach(

                                nav => {

                                    nav.classList.remove(
                                        "active"
                                    );

                                }

                            );


                        button.classList.add(
                            "active"
                        );


                        const section =
                            document.getElementById(

                                button.dataset
                                    .section

                            );


                        if (section) {

                            section.scrollIntoView(

                                {

                                    behavior:
                                        "smooth",

                                    block:
                                        "start"

                                }

                            );

                        }

                    }

                );

            }

        );

}


/* =========================================================
   MODALS
========================================================= */

function setupModalControls() {

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        closeModal(

                            button.dataset
                                .closeModal

                        );

                    }

                );

            }

        );


    document
        .querySelectorAll(
            ".simulation-modal"
        )
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
                                modal.id
                            );

                        }

                    }

                );

            }

        );

}


function openModal(
    id
) {

    document
        .getElementById(id)
        ?.classList.remove(
            "hidden"
        );

}


function closeModal(
    id
) {

    document
        .getElementById(id)
        ?.classList.add(
            "hidden"
        );

}


/* =========================================================
   BUTTON SETUP
========================================================= */

function setupButtons() {

    /*
       OVERVIEW
    */

    bindClick(
        "editSimulation",
        openOverviewModal
    );


    bindClick(
        "editDescription",
        openOverviewModal
    );


    bindClick(
        "editStatus",
        openOverviewModal
    );


    bindClick(
        "saveSimulationOverview",
        saveOverview
    );


    /*
       SOFTWARE
    */

    bindClick(
        "editSoftware",
        openSoftwareModal
    );


    bindClick(
        "saveSoftware",
        saveSoftware
    );


    /*
       THEORY
    */

    bindClick(
        "editTheory",
        openTheoryModal
    );


    bindClick(
        "saveTheory",
        saveTheory
    );


    /*
       EQUATIONS
    */

    bindClick(
        "addEquation",
        openAddEquationModal
    );


    bindClick(
        "saveEquation",
        saveEquation
    );


    /*
       PARAMETERS
    */

    bindClick(
        "addParameter",
        openAddParameterModal
    );


    bindClick(
        "saveParameter",
        saveParameter
    );


    /*
       MODEL
    */

    bindClick(
        "uploadModelImage",
        () => {

            document
                .getElementById(
                    "modelImageInput"
                )
                ?.click();

        }
    );


    bindClick(
        "editModelNotes",
        openModelNotesModal
    );


    bindClick(
        "saveModelNotes",
        saveModelNotes
    );


    /*
       RESULTS
    */

    bindClick(
        "editResults",
        openResultsModal
    );


    bindClick(
        "saveResults",
        saveResultsObservations
    );


    bindClick(
        "addResult",
        openAddResultModal
    );


    bindClick(
        "saveResult",
        saveResult
    );


    bindClick(
        "addProblem",
        openAddProblemModal
    );


    bindClick(
        "saveProblem",
        saveProblem
    );


    /*
       CONCLUSION
    */

    bindClick(
        "saveConclusion",
        saveConclusion
    );


    /*
       TIMELINE
    */

    bindClick(
        "addTimeline",
        openAddTimelineModal
    );


    bindClick(
        "saveTimeline",
        saveTimeline
    );


    /*
       FUTURE WORK
    */

    bindClick(
        "addFutureWork",
        openAddFutureWorkModal
    );


    bindClick(
        "saveFutureWork",
        saveFutureWork
    );


    /*
       LINKS
    */

    bindClick(
        "addSimulationLink",
        () => {

            clearLinkModal();

            openModal(
                "simulationLinkModal"
            );

        }
    );


    bindClick(
        "saveSimulationLink",
        saveSimulationLink
    );


    /*
       NOTES
    */

    bindClick(
        "saveSimulationNotes",
        saveSimulationNotes
    );

}


/* =========================================================
   OVERVIEW
========================================================= */

function openOverviewModal() {

    setInputValue(

        "overviewDescriptionInput",

        rigidData.simulation.description

    );


    setInputValue(

        "overviewStatusInput",

        rigidData.simulation.status

    );


    setInputValue(

        "overviewProgressInput",

        rigidData.simulation.progress

    );


    setInputValue(

        "overviewTagsInput",

        rigidData.simulation.tags.join(
            ", "
        )

    );


    openModal(
        "simulationOverviewModal"
    );

}


async function saveOverview() {

    const description =
        getInputValue(
            "overviewDescriptionInput"
        );


    const status =
        getInputValue(
            "overviewStatusInput"
        ) ||
        "in-progress";


    const progress =
        Number(

            getInputValue(
                "overviewProgressInput"
            )

        ) || 0;


    const tags =
        getInputValue(
            "overviewTagsInput"
        )

        .split(",")

        .map(
            tag => tag.trim()
        )

        .filter(Boolean);


    rigidData.simulation.description =
        description;


    rigidData.simulation.objective =
        description;


    rigidData.simulation.status =
        status;


    rigidData.simulation.progress =
        Math.max(
            0,
            Math.min(
                100,
                progress
            )
        );


    rigidData.simulation.tags =
        tags;


    await saveAndRender();

    closeModal(
        "simulationOverviewModal"
    );

}


/* =========================================================
   SOFTWARE
========================================================= */

function openSoftwareModal() {

    setInputValue(

        "softwareInput",

        rigidData.simulation.tools.join(
            "\n"
        )

    );


    openModal(
        "softwareModal"
    );

}


async function saveSoftware() {

    const tools =
        getInputValue(
            "softwareInput"
        )

        .split("\n")

        .map(
            item => item.trim()
        )

        .filter(Boolean);


    rigidData.simulation.tools =
        tools;


    await saveAndRender();

    closeModal(
        "softwareModal"
    );

}


/* =========================================================
   THEORY
========================================================= */

function openTheoryModal() {

    setInputValue(

        "theoryInput",

        rigidData.simulation.theory

    );


    openModal(
        "theoryModal"
    );

}


async function saveTheory() {

    rigidData.simulation.theory =
        getInputValue(
            "theoryInput"
        );


    await saveAndRender();

    closeModal(
        "theoryModal"
    );

}


/* =========================================================
   EQUATIONS
========================================================= */

function openAddEquationModal() {

    clearEquationModal();

    openModal(
        "equationModal"
    );

}


function clearEquationModal() {

    setInputValue(
        "equationInput",
        ""
    );


    setInputValue(
        "equationDescriptionInput",
        ""
    );


    setInputValue(
        "editingEquationId",
        ""
    );


    setText(
        "equationModalTitle",
        "Add Equation"
    );

}


function setupEquationActions() {

    document
        .querySelectorAll(
            "[data-edit-equation]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        const equation =
                            rigidData
                                .simulation
                                .equations
                                .find(

                                    item =>

                                        item.id ===

                                        button.dataset
                                            .editEquation

                                );


                        if (!equation) {

                            return;

                        }


                        setInputValue(

                            "equationInput",

                            equation.equation

                        );


                        setInputValue(

                            "equationDescriptionInput",

                            equation.description

                        );


                        setInputValue(

                            "editingEquationId",

                            equation.id

                        );


                        setText(

                            "equationModalTitle",

                            "Edit Equation"

                        );


                        openModal(
                            "equationModal"
                        );

                    }

                );

            }

        );


    document
        .querySelectorAll(
            "[data-delete-equation]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    async () => {

                        if (
                            !confirm(
                                "Delete this equation?"
                            )
                        ) {

                            return;

                        }


                        rigidData
                            .simulation
                            .equations =

                            rigidData
                                .simulation
                                .equations
                                .filter(

                                    item =>

                                        item.id !==

                                        button.dataset
                                            .deleteEquation

                                );


                        await saveAndRender();

                    }

                );

            }

        );

}


async function saveEquation() {

    const equation =
        getInputValue(
            "equationInput"
        );


    if (!equation) {

        showToast(
            "Enter an equation.",
            "error"
        );

        return;

    }


    const id =
        getInputValue(
            "editingEquationId"
        );


    const item = {

        id:
            id ||
            createId(),

        equation:
            equation,

        description:
            getInputValue(
                "equationDescriptionInput"
            )

    };


    if (id) {

        const index =
            rigidData
                .simulation
                .equations
                .findIndex(

                    equation =>

                        equation.id ===
                        id

                );


        if (index !== -1) {

            rigidData
                .simulation
                .equations[
                    index
                ] =
                item;

        }

    }

    else {

        rigidData
            .simulation
            .equations
            .push(
                item
            );

    }


    await saveAndRender();

    closeModal(
        "equationModal"
    );

}


/* =========================================================
   PARAMETERS
========================================================= */

function openAddParameterModal() {

    clearParameterModal();

    openModal(
        "parameterModal"
    );

}


function clearParameterModal() {

    [

        "parameterNameInput",
        "parameterValueInput",
        "parameterUnitInput",
        "parameterCategoryInput",
        "parameterDescriptionInput",
        "editingParameterId"

    ]

    .forEach(

        id =>

            setInputValue(
                id,
                ""
            )

    );


    setText(
        "parameterModalTitle",
        "Add Parameter"
    );

}


function setupParameterActions() {

    document
        .querySelectorAll(
            "[data-edit-parameter]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        const item =
                            rigidData
                                .parameters
                                .find(

                                    parameter =>

                                        parameter.id ===

                                        button.dataset
                                            .editParameter

                                );


                        if (!item) {

                            return;

                        }


                        setInputValue(
                            "parameterNameInput",
                            item.name
                        );


                        setInputValue(
                            "parameterValueInput",
                            item.value
                        );


                        setInputValue(
                            "parameterUnitInput",
                            item.unit
                        );


                        setInputValue(
                            "parameterCategoryInput",
                            item.category
                        );


                        setInputValue(
                            "parameterDescriptionInput",
                            item.description
                        );


                        setInputValue(
                            "editingParameterId",
                            item.id
                        );


                        setText(
                            "parameterModalTitle",
                            "Edit Parameter"
                        );


                        openModal(
                            "parameterModal"
                        );

                    }

                );

            }

        );


    document
        .querySelectorAll(
            "[data-delete-parameter]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    async () => {

                        if (
                            !confirm(
                                "Delete this parameter?"
                            )
                        ) {

                            return;

                        }


                        rigidData.parameters =
                            rigidData
                                .parameters
                                .filter(

                                    item =>

                                        item.id !==

                                        button.dataset
                                            .deleteParameter

                                );


                        await saveAndRender();

                    }

                );

            }

        );

}


async function saveParameter() {

    const name =
        getInputValue(
            "parameterNameInput"
        );


    if (!name) {

        showToast(
            "Parameter name is required.",
            "error"
        );

        return;

    }


    const id =
        getInputValue(
            "editingParameterId"
        );


    const item = {

        id:
            id ||
            createId(),

        name:
            name,

        value:
            getInputValue(
                "parameterValueInput"
            ),

        unit:
            getInputValue(
                "parameterUnitInput"
            ),

        category:
            getInputValue(
                "parameterCategoryInput"
            ),

        description:
            getInputValue(
                "parameterDescriptionInput"
            )

    };


    if (id) {

        const index =
            rigidData.parameters
            .findIndex(

                item =>
                    item.id === id

            );


        if (index !== -1) {

            rigidData.parameters[
                index
            ] =
            item;

        }

    }

    else {

        rigidData.parameters.push(
            item
        );

    }


    await saveAndRender();

    closeModal(
        "parameterModal"
    );

}


/* =========================================================
   MODEL NOTES
========================================================= */

function openModelNotesModal() {

    setInputValue(

        "modelNotesInput",

        rigidData.simulation.modelNotes

    );


    openModal(
        "modelNotesModal"
    );

}


async function saveModelNotes() {

    rigidData.simulation.modelNotes =
        getInputValue(
            "modelNotesInput"
        );


    await saveAndRender();

    closeModal(
        "modelNotesModal"
    );

}


/* =========================================================
   OBSERVATIONS
========================================================= */

function openResultsModal() {

    setInputValue(

        "resultsInput",

        rigidData.simulation.observations

    );


    openModal(
        "resultsModal"
    );

}


async function saveResultsObservations() {

    rigidData.simulation.observations =
        getInputValue(
            "resultsInput"
        );


    await saveAndRender();

    closeModal(
        "resultsModal"
    );

}


/* =========================================================
   RESULTS
========================================================= */

function openAddResultModal() {

    clearResultModal();

    openModal(
        "resultModal"
    );

}


function clearResultModal() {

    [

        "resultNameInput",
        "resultValueInput",
        "resultUnitInput",
        "resultExpectedInput",
        "resultObservationInput",
        "editingResultId"

    ]

    .forEach(

        id =>

            setInputValue(
                id,
                ""
            )

    );


    setText(
        "resultModalTitle",
        "Add Result"
    );

}


function setupResultActions() {

    document
        .querySelectorAll(
            "[data-edit-result]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        const item =
                            rigidData.results
                            .find(

                                result =>

                                    result.id ===

                                    button.dataset
                                        .editResult

                            );


                        if (!item) {

                            return;

                        }


                        setInputValue(
                            "resultNameInput",
                            item.name
                        );


                        setInputValue(
                            "resultValueInput",
                            item.value
                        );


                        setInputValue(
                            "resultUnitInput",
                            item.unit
                        );


                        setInputValue(
                            "resultExpectedInput",
                            item.expected
                        );


                        setInputValue(
                            "resultObservationInput",
                            item.observation
                        );


                        setInputValue(
                            "editingResultId",
                            item.id
                        );


                        setText(
                            "resultModalTitle",
                            "Edit Result"
                        );


                        openModal(
                            "resultModal"
                        );

                    }

                );

            }

        );


    document
        .querySelectorAll(
            "[data-delete-result]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    async () => {

                        if (
                            !confirm(
                                "Delete this result?"
                            )
                        ) {

                            return;

                        }


                        rigidData.results =
                            rigidData
                                .results
                                .filter(

                                    item =>

                                        item.id !==

                                        button.dataset
                                            .deleteResult

                                );


                        await saveAndRender();

                    }

                );

            }

        );

}


async function saveResult() {

    const name =
        getInputValue(
            "resultNameInput"
        );


    if (!name) {

        showToast(
            "Result name is required.",
            "error"
        );

        return;

    }


    const id =
        getInputValue(
            "editingResultId"
        );


    const item = {

        id:
            id ||
            createId(),

        name:
            name,

        value:
            getInputValue(
                "resultValueInput"
            ),

        unit:
            getInputValue(
                "resultUnitInput"
            ),

        expected:
            getInputValue(
                "resultExpectedInput"
            ),

        observation:
            getInputValue(
                "resultObservationInput"
            )

    };


    if (id) {

        const index =
            rigidData.results
            .findIndex(

                item =>
                    item.id === id

            );


        if (index !== -1) {

            rigidData.results[
                index
            ] =
            item;

        }

    }

    else {

        rigidData.results.push(
            item
        );

    }


    await saveAndRender();

    closeModal(
        "resultModal"
    );

}


/* =========================================================
   PROBLEMS
========================================================= */

function openAddProblemModal() {

    clearProblemModal();

    openModal(
        "problemModal"
    );

}


function clearProblemModal() {

    setInputValue(
        "problemTitleInput",
        ""
    );


    setInputValue(
        "problemDescriptionInput",
        ""
    );


    setInputValue(
        "problemStatusInput",
        "open"
    );


    setInputValue(
        "editingProblemId",
        ""
    );


    setText(
        "problemModalTitle",
        "Add Problem"
    );

}


function setupProblemActions() {

    document
        .querySelectorAll(
            "[data-edit-problem]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        const item =
                            rigidData.problems
                            .find(

                                problem =>

                                    problem.id ===

                                    button.dataset
                                        .editProblem

                            );


                        if (!item) {

                            return;

                        }


                        setInputValue(
                            "problemTitleInput",
                            item.title
                        );


                        setInputValue(
                            "problemDescriptionInput",
                            item.description
                        );


                        setInputValue(
                            "problemStatusInput",
                            item.status
                        );


                        setInputValue(
                            "editingProblemId",
                            item.id
                        );


                        setText(
                            "problemModalTitle",
                            "Edit Problem"
                        );


                        openModal(
                            "problemModal"
                        );

                    }

                );

            }

        );


    document
        .querySelectorAll(
            "[data-delete-problem]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    async () => {

                        if (
                            !confirm(
                                "Delete this problem?"
                            )
                        ) {

                            return;

                        }


                        rigidData.problems =
                            rigidData
                                .problems
                                .filter(

                                    item =>

                                        item.id !==

                                        button.dataset
                                            .deleteProblem

                                );


                        await saveAndRender();

                    }

                );

            }

        );

}


async function saveProblem() {

    const title =
        getInputValue(
            "problemTitleInput"
        );


    if (!title) {

        showToast(
            "Problem title is required.",
            "error"
        );

        return;

    }


    const id =
        getInputValue(
            "editingProblemId"
        );


    const item = {

        id:
            id ||
            createId(),

        title:
            title,

        description:
            getInputValue(
                "problemDescriptionInput"
            ),

        status:
            getInputValue(
                "problemStatusInput"
            )

    };


    if (id) {

        const index =
            rigidData.problems
            .findIndex(

                item =>
                    item.id === id

            );


        if (index !== -1) {

            rigidData.problems[
                index
            ] =
            item;

        }

    }

    else {

        rigidData.problems.push(
            item
        );

    }


    await saveAndRender();

    closeModal(
        "problemModal"
    );

}


/* =========================================================
   CONCLUSION
========================================================= */

async function saveConclusion() {

    rigidData.simulation.conclusion =
        getInputValue(
            "conclusionText"
        );


    await saveAndRender();

}


/* =========================================================
   TIMELINE
========================================================= */

function openAddTimelineModal() {

    clearTimelineModal();

    openModal(
        "timelineModal"
    );

}


function clearTimelineModal() {

    [

        "timelineDateInput",
        "timelineTitleInput",
        "timelineDescriptionInput",
        "editingTimelineId"

    ]

    .forEach(

        id =>

            setInputValue(
                id,
                ""
            )

    );


    setInputValue(
        "timelineStatusInput",
        "planned"
    );


    setText(
        "timelineModalTitle",
        "Add Timeline Entry"
    );

}


function setupTimelineActions() {

    document
        .querySelectorAll(
            "[data-edit-timeline]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        const item =
                            rigidData.timeline
                            .find(

                                timeline =>

                                    timeline.id ===

                                    button.dataset
                                        .editTimeline

                            );


                        if (!item) {

                            return;

                        }


                        setInputValue(
                            "timelineDateInput",
                            item.date
                        );


                        setInputValue(
                            "timelineStatusInput",
                            item.status
                        );


                        setInputValue(
                            "timelineTitleInput",
                            item.title
                        );


                        setInputValue(
                            "timelineDescriptionInput",
                            item.description
                        );


                        setInputValue(
                            "editingTimelineId",
                            item.id
                        );


                        setText(
                            "timelineModalTitle",
                            "Edit Timeline Entry"
                        );


                        openModal(
                            "timelineModal"
                        );

                    }

                );

            }

        );


    document
        .querySelectorAll(
            "[data-delete-timeline]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    async () => {

                        if (
                            !confirm(
                                "Delete this timeline entry?"
                            )
                        ) {

                            return;

                        }


                        rigidData.timeline =
                            rigidData
                                .timeline
                                .filter(

                                    item =>

                                        item.id !==

                                        button.dataset
                                            .deleteTimeline

                                );


                        await saveAndRender();

                    }

                );

            }

        );

}


async function saveTimeline() {

    const title =
        getInputValue(
            "timelineTitleInput"
        );


    if (!title) {

        showToast(
            "Timeline title is required.",
            "error"
        );

        return;

    }


    const id =
        getInputValue(
            "editingTimelineId"
        );


    const item = {

        id:
            id ||
            createId(),

        date:
            getInputValue(
                "timelineDateInput"
            ),

        status:
            getInputValue(
                "timelineStatusInput"
            ),

        title:
            title,

        description:
            getInputValue(
                "timelineDescriptionInput"
            )

    };


    if (id) {

        const index =
            rigidData.timeline
            .findIndex(

                item =>
                    item.id === id

            );


        if (index !== -1) {

            rigidData.timeline[
                index
            ] =
            item;

        }

    }

    else {

        rigidData.timeline.push(
            item
        );

    }


    await saveAndRender();

    closeModal(
        "timelineModal"
    );

}


/* =========================================================
   FUTURE WORK
========================================================= */

function openAddFutureWorkModal() {

    clearFutureWorkModal();

    openModal(
        "futureWorkModal"
    );

}


function clearFutureWorkModal() {

    [

        "futureWorkDateInput",
        "futureWorkTitleInput",
        "futureWorkDescriptionInput",
        "editingFutureWorkId"

    ]

    .forEach(

        id =>

            setInputValue(
                id,
                ""
            )

    );


    setInputValue(
        "futureWorkPriorityInput",
        "medium"
    );


    setText(
        "futureWorkModalTitle",
        "Add Future Work"
    );

}


function setupFutureWorkActions() {

    document
        .querySelectorAll(
            "[data-edit-future-work]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        const item =
                            rigidData.futureWork
                            .find(

                                futureWork =>

                                    futureWork.id ===

                                    button.dataset
                                        .editFutureWork

                            );


                        if (!item) {

                            return;

                        }


                        setInputValue(
                            "futureWorkDateInput",
                            item.date
                        );


                        setInputValue(
                            "futureWorkPriorityInput",
                            item.priority
                        );


                        setInputValue(
                            "futureWorkTitleInput",
                            item.title
                        );


                        setInputValue(
                            "futureWorkDescriptionInput",
                            item.description
                        );


                        setInputValue(
                            "editingFutureWorkId",
                            item.id
                        );


                        setText(
                            "futureWorkModalTitle",
                            "Edit Future Work"
                        );


                        openModal(
                            "futureWorkModal"
                        );

                    }

                );

            }

        );


    document
        .querySelectorAll(
            "[data-delete-future-work]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    async () => {

                        if (
                            !confirm(
                                "Delete this future work item?"
                            )
                        ) {

                            return;

                        }


                        rigidData.futureWork =
                            rigidData
                                .futureWork
                                .filter(

                                    item =>

                                        item.id !==

                                        button.dataset
                                            .deleteFutureWork

                                );


                        await saveAndRender();

                    }

                );

            }

        );

}


async function saveFutureWork() {

    const title =
        getInputValue(
            "futureWorkTitleInput"
        );


    if (!title) {

        showToast(
            "Future work title is required.",
            "error"
        );

        return;

    }


    const id =
        getInputValue(
            "editingFutureWorkId"
        );


    const item = {

        id:
            id ||
            createId(),

        date:
            getInputValue(
                "futureWorkDateInput"
            ),

        priority:
            getInputValue(
                "futureWorkPriorityInput"
            ),

        title:
            title,

        description:
            getInputValue(
                "futureWorkDescriptionInput"
            )

    };


    if (id) {

        const index =
            rigidData.futureWork
            .findIndex(

                item =>
                    item.id === id

            );


        if (index !== -1) {

            rigidData.futureWork[
                index
            ] =
            item;

        }

    }

    else {

        rigidData.futureWork.push(
            item
        );

    }


    await saveAndRender();

    closeModal(
        "futureWorkModal"
    );

}


/* =========================================================
   LINKS
========================================================= */

function clearLinkModal() {

    setInputValue(
        "simulationLinkTitleInput",
        ""
    );


    setInputValue(
        "simulationLinkUrlInput",
        ""
    );


    setInputValue(
        "simulationLinkDescriptionInput",
        ""
    );

}


async function saveSimulationLink() {

    const title =
        getInputValue(
            "simulationLinkTitleInput"
        );


    const url =
        getInputValue(
            "simulationLinkUrlInput"
        );


    if (
        !title ||
        !url
    ) {

        showToast(
            "Link title and URL are required.",
            "error"
        );

        return;

    }


    rigidData.links.push({

        id:
            createId(),

        title:
            title,

        url:
            url,

        description:
            getInputValue(
                "simulationLinkDescriptionInput"
            ),

        createdAt:
            new Date().toISOString()

    });


    await saveAndRender();

    closeModal(
        "simulationLinkModal"
    );

}


async function deleteLink(
    id
) {

    if (
        !confirm(
            "Delete this link?"
        )
    ) {

        return;

    }


    rigidData.links =
        rigidData.links
        .filter(

            link =>
                link.id !== id

        );


    await saveAndRender();

}


/* =========================================================
   NOTES
========================================================= */

async function saveSimulationNotes() {

    rigidData.simulation.notes =
        getInputValue(
            "simulationNotes"
        );


    await saveAndRender();

}


/* =========================================================
   FILE UPLOAD CONTROLS
========================================================= */

function setupUploadControls() {

    const fileInput =
        document.getElementById(
            "simulationFileInput"
        );


    const uploadButton =
        document.getElementById(
            "uploadSimulationFile"
        );


    const uploadZone =
        document.getElementById(
            "simulationUploadZone"
        );


    if (uploadButton) {

        uploadButton.addEventListener(

            "click",

            () => {

                fileInput?.click();

            }

        );

    }


    if (uploadZone) {

        uploadZone.addEventListener(

            "click",

            () => {

                fileInput?.click();

            }

        );


        uploadZone.addEventListener(

            "dragover",

            event => {

                event.preventDefault();

                uploadZone.classList.add(
                    "dragging"
                );

            }

        );


        uploadZone.addEventListener(

            "dragleave",

            () => {

                uploadZone.classList.remove(
                    "dragging"
                );

            }

        );


        uploadZone.addEventListener(

            "drop",

            async event => {

                event.preventDefault();

                uploadZone.classList.remove(
                    "dragging"
                );


                const files =
                    event.dataTransfer.files;


                await uploadFiles(
                    files
                );

            }

        );

    }


    fileInput?.addEventListener(

        "change",

        async event => {

            await uploadFiles(
                event.target.files
            );


            event.target.value =
                "";

        }

    );


    /*
       MODEL IMAGE
    */

    const modelImageInput =
        document.getElementById(
            "modelImageInput"
        );


    modelImageInput?.addEventListener(

        "change",

        async event => {

            const file =
                event.target.files?.[0];


            if (!file) {

                return;

            }


            await uploadModelImage(
                file
            );


            event.target.value =
                "";

        }

    );

}


/* =========================================================
   UPLOAD MULTIPLE FILES
========================================================= */

async function uploadFiles(
    files
) {

    if (
        !files ||
        files.length === 0
    ) {

        return;

    }


    try {

        showToast(
            "Uploading file..."
        );


        for (
            const file of files
        ) {

            const uploaded =
                await uploadFileToDrive(
                    file
                );


            rigidData.attachments.push({

                id:
                    uploaded.id,

                name:
                    uploaded.name,

                mimeType:
                    uploaded.mimeType,

                size:
                    uploaded.size,

                webViewLink:
                    uploaded.webViewLink,

                webContentLink:
                    uploaded.webContentLink,

                uploadedAt:
                    new Date().toISOString()

            });

        }


        await saveAndRender();

        showToast(
            "File uploaded successfully."
        );

    }

    catch (error) {

        console.error(
            "Upload error:",
            error
        );


        showToast(

            error.message ||

            "Unable to upload file.",

            "error"

        );

    }

}


/* =========================================================
   UPLOAD MODEL IMAGE
========================================================= */

/* =========================================================
   RENDER MODEL
========================================================= */

function renderModel() {

    setText(

        "modelNotes",

        rigidData.simulation.modelNotes ||

        "No model architecture notes added yet."

    );


    const preview =
        document.getElementById(
            "modelPreview"
        );


    if (!preview) {

        return;

    }


    const image =
        rigidData.simulation.modelImage;


    if (
        image &&
        (
            image.id ||
            image.driveFileId ||
            image.webContentLink ||
            image.url ||
            image.webViewLink
        )
    ) {

        const fileId =

            image.driveFileId ||

            image.id;


        let imageURL =

            image.webContentLink ||

            image.url ||

            "";


        /*
           Convert Google Drive preview URLs
           into a direct image URL.
        */

        if (
            fileId &&
            (
                !imageURL ||

                imageURL.includes(
                    "drive.google.com"
                )
            )
        ) {

            imageURL =

                `https://drive.google.com/uc?export=view&id=${fileId}`;

        }


        preview.innerHTML =
            "";


        const imageElement =
            document.createElement(
                "img"
            );


        imageElement.src =
            imageURL;


        imageElement.alt =
            image.name ||

            "Simulation Model";


        /*
           Fallback URL if the first
           Google Drive image URL fails.
        */

        imageElement.onerror =
            () => {

                if (
                    fileId &&
                    !imageElement.dataset.fallbackUsed
                ) {

                    imageElement.dataset.fallbackUsed =
                        "true";


                    imageElement.src =

                        `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;

                }

                else {

                    preview.innerHTML =
                        `

                        <div class="empty-preview">

                            <span>
                                ⚠
                            </span>

                            <strong>
                                Unable to display image
                            </strong>

                            <p>
                                Please upload the model image again.
                            </p>

                            <button
                                id="modelImageButton"
                                class="outline-button"
                                type="button"
                            >
                                Upload Image
                            </button>

                        </div>

                        `;


                    document
                        .getElementById(
                            "modelImageButton"
                        )
                        ?.addEventListener(

                            "click",

                            () => {

                                document
                                    .getElementById(
                                        "modelImageInput"
                                    )
                                    ?.click();

                            }

                        );

                }

            };


        preview.appendChild(
            imageElement
        );


        const removeButton =
            document.createElement(
                "button"
            );


        removeButton.type =
            "button";


        removeButton.id =
            "removeModelImage";


        removeButton.className =
            "delete-model-image";


        removeButton.textContent =
            "Remove Image";


        removeButton.addEventListener(

            "click",

            async () => {

                const confirmed =
                    confirm(
                        "Remove this model image?"
                    );


                if (!confirmed) {

                    return;

                }


                rigidData.simulation.modelImage =
                    null;


                try {

                    await saveAndRender();


                    showToast(
                        "Model image removed."
                    );

                }

                catch (error) {

                    console.error(
                        error
                    );


                    showToast(

                        error.message ||
                        "Unable to remove image.",

                        "error"

                    );

                }

            }

        );


        preview.appendChild(
            removeButton
        );


        return;

    }


    /*
       EMPTY STATE
    */

    preview.innerHTML =
        `

        <div class="empty-preview">

            <span>
                ◇
            </span>

            <strong>
                Simulation Model Preview
            </strong>

            <p>
                Upload a screenshot of your
                simulation model.
            </p>

            <button
                id="modelImageButton"
                class="outline-button"
                type="button"
            >
                Upload Image
            </button>

        </div>

        `;


    document
        .getElementById(
            "modelImageButton"
        )
        ?.addEventListener(

            "click",

            () => {

                document
                    .getElementById(
                        "modelImageInput"
                    )
                    ?.click();

            }

        );

}




/* =========================================================
   UPLOAD FILE TO DRIVE
========================================================= */

async function uploadFileToDrive(
    file
) {

    const accessToken =
        await getAccessToken();


    const formData =
        new FormData();


    formData.append(
        "work_id",
        workId
    );


    formData.append(
        "file",
        file
    );


    const response =
        await fetch(

            `${SUPABASE_FUNCTIONS_BASE}/upload-rigid-file`,

            {

                method:
                    "POST",

                headers: {

                    "Authorization":
                        `Bearer ${accessToken}`,

                    "apikey":
                        getSupabaseAnonKey()

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

            result?.error ||

            "Unable to upload file."

        );

    }


    return result.file;

}

async function uploadModelImage(
    file
) {

    try {

        showToast(
            "Uploading model image..."
        );


        const uploaded =
            await uploadFileToDrive(
                file
            );


        rigidData.simulation.modelImage = {

            id:
                uploaded.id,

            driveFileId:
                uploaded.id,

            name:
                uploaded.name,

            mimeType:
                uploaded.mimeType,

            size:
                uploaded.size,

            webViewLink:
                uploaded.webViewLink ||
                "",

            webContentLink:
                uploaded.webContentLink ||
                "",

            url:
                uploaded.webContentLink ||
                `https://drive.google.com/uc?export=view&id=${uploaded.id}`

        };


        await saveAndRender();


        showToast(
            "Model image uploaded."
        );

    }

    catch (error) {

        console.error(
            error
        );


        showToast(

            error.message ||
            "Unable to upload model image.",

            "error"

        );

    }

}


/* =========================================================
   DELETE ATTACHMENT
========================================================= */

async function deleteAttachment(
    id
) {

    if (
        !confirm(
            "Remove this file from the simulation?"
        )
    ) {

        return;

    }


    rigidData.attachments =
        rigidData.attachments
        .filter(

            attachment =>

                attachment.id !== id

        );


    await saveAndRender();

}


/* =========================================================
   SAVE COMPLETE RIGID DATA
========================================================= */

async function saveRigidData() {

    if (!rigidData) {

        return;

    }


    rigidData.workspace.updatedAt =
        new Date().toISOString();


    /*
       This function must be deployed
       as:

       update-rigid-work-data
    */

    const result =
        await callEdgeFunction(

            "update-rigid-work-data",

            {

                work_id:
                    workId,

                data:
                    rigidData

            }

        );


    return result;

}


/* =========================================================
   SAVE + RENDER
========================================================= */

async function saveAndRender() {

    try {

        await saveRigidData();

        renderSimulation();

        showToast(
            "Saved successfully."
        );

    }

    catch (error) {

        console.error(
            "Save error:",
            error
        );


        showToast(

            error.message ||

            "Unable to save changes.",

            "error"

        );

        throw error;

    }

}


/* =========================================================
   LIVE CLOCK
========================================================= */

function startLiveClock() {

    const updateClock =
        () => {

            const now =
                new Date();


            setText(

                "liveDate",

                now.toLocaleDateString(

                    undefined,

                    {

                        weekday:
                            "short",

                        year:
                            "numeric",

                        month:
                            "short",

                        day:
                            "numeric"

                    }

                )

            );


            setText(

                "liveClock",

                now.toLocaleTimeString(

                    undefined,

                    {

                        hour:
                            "2-digit",

                        minute:
                            "2-digit",

                        second:
                            "2-digit"

                    }

                )

            );

        };


    updateClock();

    setInterval(
        updateClock,
        1000
    );

}


/* =========================================================
   DOM HELPERS
========================================================= */

function bindClick(
    id,
    callback
) {

    document
        .getElementById(id)
        ?.addEventListener(

            "click",

            callback

        );

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ??
            "";

    }

}


function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.value =
            value ??
            "";

    }

}


function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    return (
        element?.value ||
        ""
    ).trim();

}


/* =========================================================
   UTILITIES
========================================================= */

function createId() {

    if (
        window.crypto &&
        crypto.randomUUID
    ) {

        return crypto.randomUUID();

    }


    return (

        Date.now()
        .toString(36) +

        Math.random()
        .toString(36)
        .substring(2)

    );

}


function formatStatus(
    status
) {

    if (!status) {

        return "";

    }


    return String(status)

        .replaceAll(
            "-",
            " "
        )

        .replace(
            /\b\w/g,

            character =>

                character.toUpperCase()

        );

}


function formatDate(
    value
) {

    if (!value) {

        return "--";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleDateString(

        undefined,

        {

            year:
                "numeric",

            month:
                "short",

            day:
                "numeric"

        }

    );

}


function formatFileSize(
    bytes
) {

    const value =
        Number(bytes);


    if (
        !value ||
        value <= 0
    ) {

        return "";

    }


    const units =

        [
            "B",
            "KB",
            "MB",
            "GB"
        ];


    const index =
        Math.floor(

            Math.log(value) /
            Math.log(1024)

        );


    const size =
        value /
        Math.pow(
            1024,
            index
        );


    return (

        `${size.toFixed(

            index === 0
                ? 0
                : 2

        )} ${units[index]}`

    );

}


function emptyMessage(
    message
) {

    return `

        <div class="empty-state">
            ${escapeHtml(message)}
        </div>

    `;

}


function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer =
    null;


function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "simulationToast"
        );


    if (!toast) {

        return;

    }


    toast.textContent =
        message;


    toast.className =
        `simulation-toast ${type}`;


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

            3000

        );

}

function getDrivePreviewUrl(file) {

    if (!file) {
        return "";
    }


    const fileId =

        file.driveFileId ||

        file.id ||

        "";


    if (!fileId) {

        return (
            file.webContentLink ||
            file.webViewLink ||
            file.url ||
            ""
        );

    }


    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;

}