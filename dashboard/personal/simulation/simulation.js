/* =========================================================
   RiGiD - SIMULATION WORKSPACE
   =========================================================

   SAVE BEHAVIOUR

   User action
        ↓
   Update local data immediately
        ↓
   Render UI immediately
        ↓
   Close modal immediately
        ↓
   Show "Saving..." toast
        ↓
   Save to Supabase
        ↓
   Show "... saved." toast

   If the backend save fails:
        ↓
   Restore previous data
        ↓
   Render previous UI
        ↓
   Show error toast

========================================================= */


/* =========================================================
   GLOBAL STATE
========================================================= */

let workId = null;
let rigidData = null;
let currentWork = null;

let isSaving = false;

let toastTimer = null;


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
                ).get("work_id");


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
   SUPABASE
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


async function getAccessToken() {

    const supabase =
        getSupabaseClient();


    const {
        data: {
            session
        },
        error: sessionError
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


function getSupabaseAnonKey() {

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


    return "";

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
                method: "POST",

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
        await response
            .json()
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


    if (
        typeof rigidData.simulation.description !==
        "string"
    ) {

        rigidData.simulation.description = "";

    }


    if (
        typeof rigidData.simulation.objective !==
        "string"
    ) {

        rigidData.simulation.objective = "";

    }


    if (
        !Array.isArray(
            rigidData.simulation.tools
        )
    ) {

        rigidData.simulation.tools = [];

    }


    if (
        !Array.isArray(
            rigidData.simulation.tags
        )
    ) {

        rigidData.simulation.tags = [];

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

        rigidData.simulation.progress = 0;

    }


    if (
        typeof rigidData.simulation.theory !==
        "string"
    ) {

        rigidData.simulation.theory = "";

    }


    if (
        !Array.isArray(
            rigidData.simulation.equations
        )
    ) {

        rigidData.simulation.equations = [];

    }


    if (
        typeof rigidData.simulation.modelNotes !==
        "string"
    ) {

        rigidData.simulation.modelNotes = "";

    }


    if (
        !rigidData.simulation.modelImage
    ) {

        rigidData.simulation.modelImage = null;

    }


    if (
        typeof rigidData.simulation.observations !==
        "string"
    ) {

        rigidData.simulation.observations = "";

    }


    if (
        typeof rigidData.simulation.conclusion !==
        "string"
    ) {

        rigidData.simulation.conclusion = "";

    }


    if (
        typeof rigidData.simulation.notes !==
        "string"
    ) {

        rigidData.simulation.notes = "";

    }


    if (
        !Array.isArray(
            rigidData.parameters
        )
    ) {

        rigidData.parameters = [];

    }


    if (
        !Array.isArray(
            rigidData.results
        )
    ) {

        rigidData.results = [];

    }


    if (
        !Array.isArray(
            rigidData.problems
        )
    ) {

        rigidData.problems = [];

    }


    if (
        !Array.isArray(
            rigidData.timeline
        )
    ) {

        rigidData.timeline = [];

    }


    if (
        !Array.isArray(
            rigidData.futureWork
        )
    ) {

        rigidData.futureWork = [];

    }


    if (
        !Array.isArray(
            rigidData.attachments
        )
    ) {

        rigidData.attachments = [];

    }


    if (
        !Array.isArray(
            rigidData.links
        )
    ) {

        rigidData.links = [];

    }


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

    if (!rigidData) {
        return;
    }


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
   HEADER
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


    const statusBadge =
        document.getElementById(
            "simulationStatusBadge"
        );


    if (statusBadge) {

        const status =
            rigidData.simulation.status ||
            "in-progress";


        statusBadge.textContent =
            formatStatus(status);


        statusBadge.className =
            `simulation-status-badge ${status}`;

    }

}


/* =========================================================
   OVERVIEW RENDER
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

        softwareList.innerHTML = "";


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
   THEORY RENDER
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


    equationList.innerHTML = "";


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
                        data-edit-equation="${escapeHtml(
                            equation.id
                        )}"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-action"
                        data-delete-equation="${escapeHtml(
                            equation.id
                        )}"
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
   PARAMETERS RENDER
========================================================= */

function renderParameters() {

    const container =
        document.getElementById(
            "parameterGrid"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


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
                            data-edit-parameter="${escapeHtml(
                                parameter.id
                            )}"
                        >
                            Edit
                        </button>

                        <button
                            class="delete-action"
                            data-delete-parameter="${escapeHtml(
                                parameter.id
                            )}"
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
   MODEL RENDER
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
        document.getElementById("modelPreview");

    if (!preview) {
        return;
    }

    const image =
        rigidData.simulation.modelImage;

    /*
       No image
    */

    if (!image) {

        preview.innerHTML = `
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
            .getElementById("modelImageButton")
            ?.addEventListener(
                "click",
                () => {

                    document
                        .getElementById("modelImageInput")
                        ?.click();

                }
            );

        return;
    }


    /*
       Google Drive file ID
    */

    const fileId =
        image.driveFileId ||
        image.id ||
        "";


    if (!fileId) {

        preview.innerHTML = `
            <div class="empty-preview">

                <span>
                    ⚠
                </span>

                <strong>
                    Image information is incomplete
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
            .getElementById("modelImageButton")
            ?.addEventListener(
                "click",
                () => {

                    document
                        .getElementById("modelImageInput")
                        ?.click();

                }
            );

        return;
    }


    /*
       IMPORTANT:
       Use Google's thumbnail endpoint.

       Do NOT depend on webContentLink or
       uc?export=view because those may not
       display a private Drive file.
    */

    const imageURL =
        `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2000`;


    preview.innerHTML = "";


    /*
       Image
    */

    const imageElement =
        document.createElement("img");


    imageElement.src =
        imageURL;


    imageElement.alt =
        image.name ||
        "Simulation Model";


    imageElement.className =
        "simulation-model-image";


    imageElement.loading =
        "lazy";


    imageElement.onerror =
        () => {

            console.error(
                "Unable to display Simulation model image:",
                fileId
            );


            preview.innerHTML = `
                <div class="empty-preview">

                    <span>
                        ⚠
                    </span>

                    <strong>
                        Unable to display image
                    </strong>

                    <p>
                        The image was uploaded to Google Drive,
                        but its preview could not be loaded.
                    </p>

                    <button
                        id="openModelImage"
                        class="outline-button"
                        type="button"
                    >
                        Open in Google Drive
                    </button>

                </div>
            `;


            document
                .getElementById("openModelImage")
                ?.addEventListener(
                    "click",
                    () => {

                        const driveURL =
                            image.webViewLink ||
                            `https://drive.google.com/file/d/${fileId}/view`;

                        window.open(
                            driveURL,
                            "_blank",
                            "noopener"
                        );

                    }
                );

        };


    preview.appendChild(
        imageElement
    );


    /*
       Remove button
    */

    const removeButton =
        document.createElement("button");


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


            const previous =
                cloneData(
                    rigidData.simulation.modelImage
                );


            /*
               Update UI FIRST
            */

            rigidData.simulation.modelImage =
                null;


            renderModel();


            try {

                showToast(
                    "Saving model image removal..."
                );


                await saveSimulationData();


                showToast(
                    "Model image removed and saved."
                );

            }

            catch (error) {

                rigidData.simulation.modelImage =
                    previous;


                renderModel();


                showToast(
                    error.message ||
                    "Unable to remove model image.",
                    "error"
                );

            }

        }
    );


    preview.appendChild(
        removeButton
    );

}


/* =========================================================
   UPLOAD MODEL IMAGE
========================================================= */

async function uploadModelImage(file) {

    if (!file) {
        return;
    }


    const previous =
        cloneData(
            rigidData.simulation.modelImage
        );


    try {

        /*
           Google Drive upload
        */

        showToast(
            "Uploading model image..."
        );


        const uploaded =
            await uploadFileToDrive(
                file
            );


        const fileId =
            uploaded?.id ||
            "";


        if (!fileId) {

            throw new Error(
                "Google Drive did not return a file ID."
            );

        }


        /*
           Store the Drive ID.

           This is the important part.
        */

        rigidData.simulation.modelImage = {

            id:
                fileId,

            driveFileId:
                fileId,

            name:
                uploaded.name ||
                file.name,

            mimeType:
                uploaded.mimeType ||
                file.type ||
                "image/*",

            size:
                Number(
                    uploaded.size ||
                    file.size ||
                    0
                ),

            /*
               Keep the Drive links for
               opening the original file.
            */

            webViewLink:
                uploaded.webViewLink ||
                `https://drive.google.com/file/d/${fileId}/view`,

            webContentLink:
                uploaded.webContentLink ||
                "",

            /*
               Store the reliable preview URL.
            */

            previewUrl:
                `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2000`,

            url:
                `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2000`

        };


        /*
           VERY IMPORTANT:

           Render immediately after Drive upload.
           Do not wait for Supabase.
        */

        renderModel();


        showToast(
            "Saving model image..."
        );


        /*
           Save metadata to Supabase.
        */

        await saveSimulationData();


        showToast(
            "Model image uploaded and saved."
        );

    }

    catch (error) {

        console.error(
            "Model image upload error:",
            error
        );


        /*
           Roll back local state if the
           Supabase save failed.
        */

        rigidData.simulation.modelImage =
            previous;


        renderModel();


        showToast(
            error.message ||
            "Unable to upload model image.",
            "error"
        );

    }

}


/* =========================================================
   RESULTS RENDER
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


    container.innerHTML = "";


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
                        data-edit-result="${escapeHtml(
                            result.id
                        )}"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-action"
                        data-delete-result="${escapeHtml(
                            result.id
                        )}"
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


    container.innerHTML = "";


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
                        data-edit-problem="${escapeHtml(
                            problem.id
                        )}"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-action"
                        data-delete-problem="${escapeHtml(
                            problem.id
                        )}"
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
   CONCLUSION
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
   TIMELINE
========================================================= */

function renderTimeline() {

    const container =
        document.getElementById(
            "simulationTimeline"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


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
        [...rigidData.timeline].sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
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
                        data-edit-timeline="${escapeHtml(
                            item.id
                        )}"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-action"
                        data-delete-timeline="${escapeHtml(
                            item.id
                        )}"
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
   FUTURE WORK
========================================================= */

function renderFutureWork() {

    const container =
        document.getElementById(
            "futureWorkList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


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
                            data-edit-future-work="${escapeHtml(
                                item.id
                            )}"
                        >
                            Edit
                        </button>

                        <button
                            class="delete-action"
                            data-delete-future-work="${escapeHtml(
                                item.id
                            )}"
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
   FILES
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


    container.innerHTML = "";


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
                        data-delete-attachment="${escapeHtml(
                            attachment.id
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


    document
        .querySelectorAll(
            "[data-delete-attachment]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteAttachment(
                            button.dataset
                                .deleteAttachment
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


    container.innerHTML = "";


    if (
        rigidData.links.length ===
        0
    ) {

        return;

    }


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
                        data-delete-link="${escapeHtml(
                            link.id
                        )}"
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
                    () => {

                        deleteLink(
                            button.dataset
                                .deleteLink
                        );

                    }
                );

            }
        );

}


/* =========================================================
   NOTES
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
                                button.dataset.section
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


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            document
                .querySelectorAll(
                    ".simulation-modal:not(.hidden)"
                )
                .forEach(
                    modal => {

                        closeModal(
                            modal.id
                        );

                    }
                );

        }
    );

}


function openModal(id) {

    document
        .getElementById(id)
        ?.classList.remove(
            "hidden"
        );

}


function closeModal(id) {

    document
        .getElementById(id)
        ?.classList.add(
            "hidden"
        );

}


function closeAnyOpenModal() {

    document
        .querySelectorAll(
            ".simulation-modal:not(.hidden)"
        )
        .forEach(
            modal => {

                closeModal(
                    modal.id
                );

            }
        );

}


/* =========================================================
   BUTTON SETUP
========================================================= */

function setupButtons() {

    const workspaceButton =
        document.getElementById(
            "backToWorkspace"
        );


    if (workspaceButton) {

        workspaceButton.addEventListener(
            "click",
            () => {

                if (
                    window.history.length >
                    1
                ) {

                    window.history.back();

                    return;

                }


                window.location.href =
                    "../../personal.html";

            }
        );

    }


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


    bindClick(
        "editSoftware",
        openSoftwareModal
    );

    bindClick(
        "saveSoftware",
        saveSoftware
    );


    bindClick(
        "editTheory",
        openTheoryModal
    );

    bindClick(
        "saveTheory",
        saveTheory
    );


    bindClick(
        "addEquation",
        openAddEquationModal
    );

    bindClick(
        "saveEquation",
        saveEquation
    );


    bindClick(
        "addParameter",
        openAddParameterModal
    );

    bindClick(
        "saveParameter",
        saveParameter
    );


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


    bindClick(
        "saveConclusion",
        saveConclusion
    );


    bindClick(
        "addTimeline",
        openAddTimelineModal
    );

    bindClick(
        "saveTimeline",
        saveTimeline
    );


    bindClick(
        "addFutureWork",
        openAddFutureWorkModal
    );

    bindClick(
        "saveFutureWork",
        saveFutureWork
    );


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
        rigidData.simulation.tags.join(", ")
    );


    openModal(
        "simulationOverviewModal"
    );

}


async function saveOverview() {

    const previous =
        cloneData(
            rigidData.simulation
        );


    const previousStatus =
        rigidData.simulation.status;


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


    renderSimulation();

    closeModal(
        "simulationOverviewModal"
    );


    try {

        showToast(
            "Saving simulation overview..."
        );


        await saveSimulationData();


        if (
            previousStatus !== "completed" &&
            rigidData.simulation.status ===
                "completed"
        ) {

            launchCompletionConfetti();

        }


        showToast(
            "Simulation overview saved."
        );

    }

    catch (error) {

        rigidData.simulation =
            previous;


        renderSimulation();


        showToast(
            error.message ||
            "Unable to save simulation overview.",
            "error"
        );

    }

}


/* =========================================================
   SOFTWARE
========================================================= */

function openSoftwareModal() {

    setInputValue(
        "softwareInput",
        rigidData.simulation.tools.join("\n")
    );


    openModal(
        "softwareModal"
    );

}


async function saveSoftware() {

    const previous =
        cloneData(
            rigidData.simulation.tools
        );


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


    renderOverview();

    closeModal(
        "softwareModal"
    );


    try {

        showToast(
            "Saving software..."
        );


        await saveSimulationData();


        showToast(
            "Software saved."
        );

    }

    catch (error) {

        rigidData.simulation.tools =
            previous;


        renderOverview();


        showToast(
            error.message ||
            "Unable to save software.",
            "error"
        );

    }

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

    const previous =
        rigidData.simulation.theory;


    rigidData.simulation.theory =
        getInputValue(
            "theoryInput"
        );


    renderTheory();

    closeModal(
        "theoryModal"
    );


    try {

        showToast(
            "Saving theory..."
        );


        await saveSimulationData();


        showToast(
            "Theory saved."
        );

    }

    catch (error) {

        rigidData.simulation.theory =
            previous;


        renderTheory();


        showToast(
            error.message ||
            "Unable to save theory.",
            "error"
        );

    }

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
                    () => {

                        deleteEquation(
                            button.dataset
                                .deleteEquation
                        );

                    }
                );

            }
        );

}


async function saveEquation() {

    const equationText =
        getInputValue(
            "equationInput"
        );


    if (!equationText) {

        showToast(
            "Enter an equation.",
            "error"
        );

        return;

    }


    const previous =
        cloneData(
            rigidData.simulation.equations
        );


    const id =
        getInputValue(
            "editingEquationId"
        );


    const item = {

        id:
            id ||
            createId(),

        equation:
            equationText,

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
                    entry =>
                        entry.id === id
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


    renderTheory();

    closeModal(
        "equationModal"
    );


    try {

        showToast(
            id
                ? "Saving equation..."
                : "Saving equation..."
        );


        await saveSimulationData();


        showToast(
            id
                ? "Equation updated and saved."
                : "Equation added and saved."
        );

    }

    catch (error) {

        rigidData.simulation.equations =
            previous;


        renderTheory();


        showToast(
            error.message ||
            "Unable to save equation.",
            "error"
        );

    }

}


async function deleteEquation(id) {

    if (
        !confirm(
            "Delete this equation?"
        )
    ) {

        return;

    }


    const previous =
        cloneData(
            rigidData.simulation.equations
        );


    rigidData.simulation.equations =
        rigidData.simulation.equations.filter(
            item =>
                item.id !== id
        );


    renderTheory();


    try {

        showToast(
            "Saving equation removal..."
        );


        await saveSimulationData();


        showToast(
            "Equation removed and saved."
        );

    }

    catch (error) {

        rigidData.simulation.equations =
            previous;


        renderTheory();


        showToast(
            error.message ||
            "Unable to remove equation.",
            "error"
        );

    }

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
            id => {

                setInputValue(
                    id,
                    ""
                );

            }
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
                            rigidData.parameters.find(
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
                    () => {

                        deleteParameter(
                            button.dataset
                                .deleteParameter
                        );

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


    const previous =
        cloneData(
            rigidData.parameters
        );


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
            rigidData.parameters.findIndex(
                parameter =>
                    parameter.id === id
            );


        if (index !== -1) {

            rigidData.parameters[index] =
                item;

        }

    }

    else {

        rigidData.parameters.push(
            item
        );

    }


    renderParameters();

    closeModal(
        "parameterModal"
    );


    try {

        showToast(
            "Saving parameter..."
        );


        await saveSimulationData();


        showToast(
            id
                ? "Parameter updated and saved."
                : "Parameter added and saved."
        );

    }

    catch (error) {

        rigidData.parameters =
            previous;


        renderParameters();


        showToast(
            error.message ||
            "Unable to save parameter.",
            "error"
        );

    }

}


async function deleteParameter(id) {

    if (
        !confirm(
            "Delete this parameter?"
        )
    ) {

        return;

    }


    const previous =
        cloneData(
            rigidData.parameters
        );


    rigidData.parameters =
        rigidData.parameters.filter(
            item =>
                item.id !== id
        );


    renderParameters();


    try {

        showToast(
            "Saving parameter removal..."
        );


        await saveSimulationData();


        showToast(
            "Parameter removed and saved."
        );

    }

    catch (error) {

        rigidData.parameters =
            previous;


        renderParameters();


        showToast(
            error.message ||
            "Unable to remove parameter.",
            "error"
        );

    }

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

    const previous =
        rigidData.simulation.modelNotes;


    rigidData.simulation.modelNotes =
        getInputValue(
            "modelNotesInput"
        );


    renderModel();

    closeModal(
        "modelNotesModal"
    );


    try {

        showToast(
            "Saving model notes..."
        );


        await saveSimulationData();


        showToast(
            "Model notes saved."
        );

    }

    catch (error) {

        rigidData.simulation.modelNotes =
            previous;


        renderModel();


        showToast(
            error.message ||
            "Unable to save model notes.",
            "error"
        );

    }

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

    const previous =
        rigidData.simulation.observations;


    rigidData.simulation.observations =
        getInputValue(
            "resultsInput"
        );


    renderResults();

    closeModal(
        "resultsModal"
    );


    try {

        showToast(
            "Saving observations..."
        );


        await saveSimulationData();


        showToast(
            "Observations saved."
        );

    }

    catch (error) {

        rigidData.simulation.observations =
            previous;


        renderResults();


        showToast(
            error.message ||
            "Unable to save observations.",
            "error"
        );

    }

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
            id => {

                setInputValue(
                    id,
                    ""
                );

            }
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
                            rigidData.results.find(
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
                    () => {

                        deleteResult(
                            button.dataset
                                .deleteResult
                        );

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


    const previous =
        cloneData(
            rigidData.results
        );


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
            rigidData.results.findIndex(
                result =>
                    result.id === id
            );


        if (index !== -1) {

            rigidData.results[index] =
                item;

        }

    }

    else {

        rigidData.results.push(
            item
        );

    }


    renderResults();

    closeModal(
        "resultModal"
    );


    try {

        showToast(
            "Saving result..."
        );


        await saveSimulationData();


        showToast(
            id
                ? "Result updated and saved."
                : "Result added and saved."
        );

    }

    catch (error) {

        rigidData.results =
            previous;


        renderResults();


        showToast(
            error.message ||
            "Unable to save result.",
            "error"
        );

    }

}


async function deleteResult(id) {

    if (
        !confirm(
            "Delete this result?"
        )
    ) {

        return;

    }


    const previous =
        cloneData(
            rigidData.results
        );


    rigidData.results =
        rigidData.results.filter(
            item =>
                item.id !== id
        );


    renderResults();


    try {

        showToast(
            "Saving result removal..."
        );


        await saveSimulationData();


        showToast(
            "Result removed and saved."
        );

    }

    catch (error) {

        rigidData.results =
            previous;


        renderResults();


        showToast(
            error.message ||
            "Unable to remove result.",
            "error"
        );

    }

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
                            rigidData.problems.find(
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
                    () => {

                        deleteProblem(
                            button.dataset
                                .deleteProblem
                        );

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


    const previous =
        cloneData(
            rigidData.problems
        );


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
            rigidData.problems.findIndex(
                problem =>
                    problem.id === id
            );


        if (index !== -1) {

            rigidData.problems[index] =
                item;

        }

    }

    else {

        rigidData.problems.push(
            item
        );

    }


    renderProblemList();

    closeModal(
        "problemModal"
    );


    try {

        showToast(
            "Saving problem..."
        );


        await saveSimulationData();


        showToast(
            id
                ? "Problem updated and saved."
                : "Problem added and saved."
        );

    }

    catch (error) {

        rigidData.problems =
            previous;


        renderProblemList();


        showToast(
            error.message ||
            "Unable to save problem.",
            "error"
        );

    }

}


async function deleteProblem(id) {

    if (
        !confirm(
            "Delete this problem?"
        )
    ) {

        return;

    }


    const previous =
        cloneData(
            rigidData.problems
        );


    rigidData.problems =
        rigidData.problems.filter(
            item =>
                item.id !== id
        );


    renderProblemList();


    try {

        showToast(
            "Saving problem removal..."
        );


        await saveSimulationData();


        showToast(
            "Problem removed and saved."
        );

    }

    catch (error) {

        rigidData.problems =
            previous;


        renderProblemList();


        showToast(
            error.message ||
            "Unable to remove problem.",
            "error"
        );

    }

}


/* =========================================================
   CONCLUSION
========================================================= */

async function saveConclusion() {

    const previous =
        rigidData.simulation.conclusion;


    rigidData.simulation.conclusion =
        getInputValue(
            "conclusionText"
        );


    renderConclusion();

    try {

        showToast(
            "Saving conclusion..."
        );


        await saveSimulationData();


        showToast(
            "Conclusion saved."
        );

    }

    catch (error) {

        rigidData.simulation.conclusion =
            previous;


        renderConclusion();


        showToast(
            error.message ||
            "Unable to save conclusion.",
            "error"
        );

    }

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
            id => {

                setInputValue(
                    id,
                    ""
                );

            }
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
                            rigidData.timeline.find(
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
                    () => {

                        deleteTimeline(
                            button.dataset
                                .deleteTimeline
                        );

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


    const previous =
        cloneData(
            rigidData.timeline
        );


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
            ) ||
            "planned",

        title:
            title,

        description:
            getInputValue(
                "timelineDescriptionInput"
            )

    };


    if (id) {

        const index =
            rigidData.timeline.findIndex(
                timeline =>
                    timeline.id === id
            );


        if (index !== -1) {

            rigidData.timeline[index] =
                item;

        }

    }

    else {

        rigidData.timeline.push(
            item
        );

    }


    rigidData.timeline.sort(
        (a, b) =>
            new Date(a.date) -
            new Date(b.date)
    );


    renderTimeline();

    closeModal(
        "timelineModal"
    );


    try {

        showToast(
            "Saving timeline..."
        );


        await saveSimulationData();


        showToast(
            id
                ? "Timeline updated and saved."
                : "Timeline added and saved."
        );

    }

    catch (error) {

        rigidData.timeline =
            previous;


        renderTimeline();


        showToast(
            error.message ||
            "Unable to save timeline.",
            "error"
        );

    }

}


async function deleteTimeline(id) {

    if (
        !confirm(
            "Delete this timeline entry?"
        )
    ) {

        return;

    }


    const previous =
        cloneData(
            rigidData.timeline
        );


    rigidData.timeline =
        rigidData.timeline.filter(
            item =>
                item.id !== id
        );


    renderTimeline();


    try {

        showToast(
            "Saving timeline removal..."
        );


        await saveSimulationData();


        showToast(
            "Timeline item removed and saved."
        );

    }

    catch (error) {

        rigidData.timeline =
            previous;


        renderTimeline();


        showToast(
            error.message ||
            "Unable to remove timeline item.",
            "error"
        );

    }

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
            id => {

                setInputValue(
                    id,
                    ""
                );

            }
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
                            rigidData.futureWork.find(
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
                    () => {

                        deleteFutureWork(
                            button.dataset
                                .deleteFutureWork
                        );

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


    const previous =
        cloneData(
            rigidData.futureWork
        );


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
            ) ||
            "medium",

        title:
            title,

        description:
            getInputValue(
                "futureWorkDescriptionInput"
            )

    };


    if (id) {

        const index =
            rigidData.futureWork.findIndex(
                futureWork =>
                    futureWork.id === id
            );


        if (index !== -1) {

            rigidData.futureWork[index] =
                item;

        }

    }

    else {

        rigidData.futureWork.push(
            item
        );

    }


    renderFutureWork();

    closeModal(
        "futureWorkModal"
    );


    try {

        showToast(
            "Saving future work..."
        );


        await saveSimulationData();


        showToast(
            id
                ? "Future work updated and saved."
                : "Future work added and saved."
        );

    }

    catch (error) {

        rigidData.futureWork =
            previous;


        renderFutureWork();


        showToast(
            error.message ||
            "Unable to save future work.",
            "error"
        );

    }

}


async function deleteFutureWork(id) {

    if (
        !confirm(
            "Delete this future work item?"
        )
    ) {

        return;

    }


    const previous =
        cloneData(
            rigidData.futureWork
        );


    rigidData.futureWork =
        rigidData.futureWork.filter(
            item =>
                item.id !== id
        );


    renderFutureWork();


    try {

        showToast(
            "Saving future work removal..."
        );


        await saveSimulationData();


        showToast(
            "Future work removed and saved."
        );

    }

    catch (error) {

        rigidData.futureWork =
            previous;


        renderFutureWork();


        showToast(
            error.message ||
            "Unable to remove future work.",
            "error"
        );

    }

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


    const previous =
        cloneData(
            rigidData.links
        );


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


    renderLinks();

    closeModal(
        "simulationLinkModal"
    );


    try {

        showToast(
            "Saving link..."
        );


        await saveSimulationData();


        showToast(
            "Link added and saved."
        );

    }

    catch (error) {

        rigidData.links =
            previous;


        renderLinks();


        showToast(
            error.message ||
            "Unable to save link.",
            "error"
        );

    }

}


async function deleteLink(id) {

    if (
        !confirm(
            "Delete this link?"
        )
    ) {

        return;

    }


    const previous =
        cloneData(
            rigidData.links
        );


    rigidData.links =
        rigidData.links.filter(
            link =>
                link.id !== id
        );


    renderLinks();


    try {

        showToast(
            "Saving link removal..."
        );


        await saveSimulationData();


        showToast(
            "Link removed and saved."
        );

    }

    catch (error) {

        rigidData.links =
            previous;


        renderLinks();


        showToast(
            error.message ||
            "Unable to remove link.",
            "error"
        );

    }

}


/* =========================================================
   NOTES
========================================================= */

async function saveSimulationNotes() {

    const previous =
        rigidData.simulation.notes;


    rigidData.simulation.notes =
        getInputValue(
            "simulationNotes"
        );


    renderNotes();


    try {

        showToast(
            "Saving notes..."
        );


        await saveSimulationData();


        showToast(
            "Notes saved."
        );

    }

    catch (error) {

        rigidData.simulation.notes =
            previous;


        renderNotes();


        showToast(
            error.message ||
            "Unable to save notes.",
            "error"
        );

    }

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


    uploadButton?.addEventListener(
        "click",
        () => {

            fileInput?.click();

        }
    );


    uploadZone?.addEventListener(
        "click",
        () => {

            fileInput?.click();

        }
    );


    uploadZone?.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            uploadZone.classList.add(
                "dragging"
            );

        }
    );


    uploadZone?.addEventListener(
        "dragleave",
        () => {

            uploadZone.classList.remove(
                "dragging"
            );

        }
    );


    uploadZone?.addEventListener(
        "drop",
        async event => {

            event.preventDefault();

            uploadZone.classList.remove(
                "dragging"
            );


            await uploadFiles(
                event.dataTransfer.files
            );

        }
    );


    fileInput?.addEventListener(
        "change",
        async event => {

            await uploadFiles(
                event.target.files
            );


            event.target.value = "";

        }
    );


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


            event.target.value = "";

        }
    );

}


/* =========================================================
   UPLOAD FILE TO GOOGLE DRIVE
========================================================= */

async function uploadFileToDrive(file) {

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
                method: "POST",

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


/* =========================================================
   UPLOAD MULTIPLE FILES
========================================================= */

async function uploadFiles(files) {

    if (
        !files ||
        files.length === 0
    ) {

        return;

    }


    const previous =
        cloneData(
            rigidData.attachments
        );


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
                    uploaded.webViewLink ||
                    "",

                webContentLink:
                    uploaded.webContentLink ||
                    "",

                uploadedAt:
                    new Date().toISOString()

            });


            renderAttachments();

        }


        showToast(
            "Saving uploaded files..."
        );


        await saveSimulationData();


        showToast(
            files.length === 1
                ? "File uploaded and saved."
                : "Files uploaded and saved."
        );

    }

    catch (error) {

        rigidData.attachments =
            previous;


        renderAttachments();


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
   DELETE ATTACHMENT
========================================================= */

async function deleteAttachment(id) {

    if (
        !confirm(
            "Remove this file from the simulation?"
        )
    ) {

        return;

    }


    const previous =
        cloneData(
            rigidData.attachments
        );


    rigidData.attachments =
        rigidData.attachments.filter(
            attachment =>
                attachment.id !== id
        );


    renderAttachments();


    try {

        showToast(
            "Saving file removal..."
        );


        await saveSimulationData();


        showToast(
            "File removed and saved."
        );

    }

    catch (error) {

        rigidData.attachments =
            previous;


        renderAttachments();


        showToast(
            error.message ||
            "Unable to remove file.",
            "error"
        );

    }

}


/* =========================================================
   SAVE COMPLETE RIGID DATA
========================================================= */

async function saveSimulationData() {

    if (!rigidData) {

        return;

    }


    /*
       Match the Paper.js save behaviour:
       if another save is already running,
       wait for it to finish.
    */

    if (isSaving) {

        while (isSaving) {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        50
                    )
            );

        }

    }


    isSaving = true;


    try {

        if (!rigidData.workspace) {

            rigidData.workspace = {};

        }


        rigidData.workspace.updatedAt =
            new Date().toISOString();


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

    finally {

        isSaving = false;

    }

}


/* =========================================================
   BACKWARD-COMPATIBILITY ALIAS
========================================================= */

async function saveRigidData() {

    return await saveSimulationData();

}


/*
   Keep this function available for any older
   code that may still call saveAndRender().

   It now follows the NEW optimistic behaviour:
   the caller should already have changed and
   rendered its local data.
*/

async function saveAndRender(
    savingMessage = "Saving...",
    successMessage = "Saved successfully."
) {

    try {

        showToast(
            savingMessage
        );


        const result =
            await saveSimulationData();


        showToast(
            successMessage
        );


        return result;

    }

    catch (error) {

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
   DATA HELPERS
========================================================= */

function cloneData(value) {

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


/* =========================================================
   ID
========================================================= */

function createId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return window.crypto.randomUUID();

    }


    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );

}


/* =========================================================
   FORMATTING
========================================================= */

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


    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.min(
            units.length - 1,
            Math.floor(
                Math.log(value) /
                Math.log(1024)
            )
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
   DRIVE PREVIEW
========================================================= */

function getDrivePreviewUrl(
    file
) {

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


    return (
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`
    );

}


/* =========================================================
   TOAST
========================================================= */

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


/* =========================================================
   COMPLETION CONFETTI
========================================================= */

function launchCompletionConfetti() {

    const overlay =
        document.getElementById(
            "completionOverlay"
        );


    const particles =
        document.getElementById(
            "completionParticles"
        );


    if (
        !overlay ||
        !particles
    ) {

        return;

    }


    particles.innerHTML = "";


    overlay.classList.remove(
        "show"
    );


    void overlay.offsetWidth;


    overlay.classList.add(
        "show"
    );


    const colors = [
        "#ff4757",
        "#ffa502",
        "#2ed573",
        "#1e90ff",
        "#a55eea",
        "#ff6b81"
    ];


    for (
        let i = 0;
        i < 80;
        i++
    ) {

        const particle =
            document.createElement(
                "span"
            );


        particle.className =
            "completion-particle";


        const angle =
            Math.random() *
            Math.PI *
            2;


        const distance =
            180 +
            Math.random() *
            350;


        const x =
            Math.cos(angle) *
            distance;


        const y =
            Math.sin(angle) *
            distance;


        particle.style.setProperty(
            "--x",
            `${x}px`
        );


        particle.style.setProperty(
            "--y",
            `${y}px`
        );


        particle.style.background =
            colors[
                Math.floor(
                    Math.random() *
                    colors.length
                )
            ];


        particle.style.animationDelay =
            `${Math.random() * 0.15}s`;


        particles.appendChild(
            particle
        );

    }


    const duration =
        2500;


    const end =
        Date.now() +
        duration;


    const interval =
        setInterval(
            () => {

                if (
                    Date.now() >
                    end
                ) {

                    clearInterval(
                        interval
                    );

                    return;

                }


                for (
                    let i = 0;
                    i < 8;
                    i++
                ) {

                    const piece =
                        document.createElement(
                            "div"
                        );


                    piece.className =
                        "completion-confetti";


                    piece.style.left =
                        `${Math.random() * 100}vw`;


                    piece.style.animationDelay =
                        `${Math.random() * 0.3}s`;


                    piece.style.background =
                        colors[
                            Math.floor(
                                Math.random() *
                                colors.length
                            )
                        ];


                    piece.style.transform =
                        `rotate(${Math.random() * 360}deg)`;


                    document.body.appendChild(
                        piece
                    );


                    setTimeout(
                        () => {

                            piece.remove();

                        },
                        3000
                    );

                }

            },
            120
        );


    setTimeout(
        () => {

            overlay.classList.remove(
                "show"
            );


            particles.innerHTML =
                "";

        },
        3500
    );

}