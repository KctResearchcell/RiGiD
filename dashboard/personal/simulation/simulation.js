/* =========================================================
   RiGiD — SIMULATION
   Interactive behaviour
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       HELPERS
    ===================================================== */

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    function showToast(message) {

        const toast = $("#simulationToast");

        if (!toast) return;

        toast.textContent = message;
        toast.classList.remove("hidden");

        clearTimeout(window.__simulationToastTimer);

        window.__simulationToastTimer =
            setTimeout(() => {
                toast.classList.add("hidden");
            }, 2200);
    }


    function openModal(modal) {

        if (!modal) return;

        modal.classList.remove("hidden");

        document.body.style.overflow = "hidden";
    }


    function closeModal(modal) {

        if (!modal) return;

        modal.classList.add("hidden");

        document.body.style.overflow = "";
    }


    function getTodayISO() {

        const date = new Date();

        const offset =
            date.getTimezoneOffset() * 60000;

        return new Date(
            date.getTime() - offset
        ).toISOString().slice(0, 10);
    }


    /* =====================================================
       LIVE DATE + CLOCK
    ===================================================== */

    function updateClock() {

        const now = new Date();

        const dateElement = $("#liveDate");
        const clockElement = $("#liveClock");

        if (dateElement) {

            dateElement.textContent =
                now.toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                ).toUpperCase();
        }


        if (clockElement) {

            clockElement.textContent =
                now.toLocaleTimeString(
                    "en-US",
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }
                );
        }
    }

    updateClock();

    setInterval(updateClock, 1000);


    /* =====================================================
       NAVIGATION
    ===================================================== */

    $$(".simulation-nav-item").forEach(button => {

        button.addEventListener("click", () => {

            $$(".simulation-nav-item")
                .forEach(item =>
                    item.classList.remove("active")
                );

            button.classList.add("active");

            const targetID =
                button.dataset.section;

            const target =
                document.getElementById(targetID);

            if (target) {

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });

    });


    /* =====================================================
       SIMPLE EDITABLE CONTENT
    ===================================================== */

    const editableMap = {

        "#editDescription": "#descriptionContent",
        "#editTheory": "#theoryContent",
        "#editResults": "#resultsContent",
        "#editModelNotes": "#modelNotes"

    };


    Object.entries(editableMap).forEach(
        ([buttonSelector, contentSelector]) => {

            const button = $(buttonSelector);
            const content = $(contentSelector);

            if (!button || !content) return;

            button.addEventListener("click", () => {

                const currentlyEditing =
                    content.dataset.editing === "true";


                if (currentlyEditing) {

                    content.contentEditable = "false";
                    content.dataset.editing = "false";

                    button.textContent = "Edit";

                    showToast("Changes saved");

                    return;
                }


                content.contentEditable = "true";
                content.dataset.editing = "true";

                content.focus();

                button.textContent = "Save";

            });

        }
    );


    /* =====================================================
       EDIT SIMULATION
    ===================================================== */

    const editSimulation =
        $("#editSimulation");

    if (editSimulation) {

        editSimulation.addEventListener(
            "click",
            () => {

                const title =
                    $("#simulationTitle");

                const description =
                    $("#simulationDescription");


                const newTitle =
                    prompt(
                        "Simulation title:",
                        title?.textContent.trim()
                    );

                if (newTitle === null) return;


                const newDescription =
                    prompt(
                        "Simulation description:",
                        description?.textContent.trim()
                    );


                if (title && newTitle.trim()) {

                    title.textContent =
                        newTitle.trim();
                }


                if (
                    description &&
                    newDescription !== null
                ) {

                    description.textContent =
                        newDescription.trim();
                }


                showToast("Simulation updated");

            }
        );

    }


    /* =====================================================
       SOFTWARE EDIT
    ===================================================== */

    const editSoftware =
        $("#editSoftware");

    if (editSoftware) {

        editSoftware.addEventListener(
            "click",
            () => {

                const list =
                    $("#softwareList");

                if (!list) return;

                const current =
                    [...list.querySelectorAll("span")]
                        .map(item =>
                            item.textContent.trim()
                        )
                        .join(", ");


                const value =
                    prompt(
                        "Enter software separated by commas:",
                        current
                    );


                if (value === null) return;


                list.innerHTML = "";


                value
                    .split(",")
                    .map(item => item.trim())
                    .filter(Boolean)
                    .forEach(item => {

                        const span =
                            document.createElement("span");

                        span.textContent = item;

                        list.appendChild(span);
                    });


                showToast("Software updated");

            }
        );

    }


    /* =====================================================
       SIMULATION PROGRESS
    ===================================================== */

    const progressBar =
        $("#simulationProgressBar");

    const progressText =
        $("#simulationProgress");


    function setProgress(value) {

        value =
            Math.max(
                0,
                Math.min(100, Number(value))
            );


        if (progressBar) {

            progressBar.style.width =
                `${value}%`;
        }


        if (progressText) {

            progressText.textContent =
                `${value}%`;
        }
    }


    const simulationState =
        document.querySelector(".simulation-state");


    if (simulationState) {

        simulationState.addEventListener(
            "click",
            () => {

                const value =
                    prompt(
                        "Simulation progress (0–100):",
                        progressText?.textContent
                            .replace("%", "")
                    );


                if (value === null) return;

                if (
                    value === "" ||
                    Number.isNaN(Number(value))
                ) {

                    showToast("Enter a valid percentage");
                    return;
                }


                setProgress(value);

                showToast("Progress updated");

            }
        );

    }


    /* =====================================================
       ADD EQUATION
    ===================================================== */

    const addEquation =
        $("#addEquation");

    if (addEquation) {

        addEquation.addEventListener(
            "click",
            () => {

                const equation =
                    prompt(
                        "Enter equation:"
                    );

                if (!equation?.trim()) return;


                const item =
                    document.createElement("div");

                item.className =
                    "equation-item";

                item.innerHTML = `
                    <code></code>
                `;

                item.querySelector("code")
                    .textContent =
                    equation.trim();


                $("#equationList")
                    ?.appendChild(item);


                showToast("Equation added");

            }
        );

    }


    /* =====================================================
       ADD PARAMETER
    ===================================================== */

    const addParameter =
        $("#addParameter");

    if (addParameter) {

        addParameter.addEventListener(
            "click",
            () => {

                const name =
                    prompt(
                        "Parameter name:"
                    );

                if (!name?.trim()) return;


                const value =
                    prompt(
                        "Parameter value:"
                    );

                if (value === null) return;


                const card =
                    document.createElement("div");

                card.className =
                    "parameter-card";


                const span =
                    document.createElement("span");

                span.textContent =
                    name.trim();


                const strong =
                    document.createElement("strong");

                strong.textContent =
                    value.trim() || "—";


                card.append(
                    span,
                    strong
                );


                $("#parameterGrid")
                    ?.appendChild(card);


                showToast("Parameter added");

            }
        );

    }


    /* =====================================================
       ADD RESULT
    ===================================================== */

    const addResult =
        $("#addResult");

    if (addResult) {

        addResult.addEventListener(
            "click",
            () => {

                const name =
                    prompt(
                        "Result name:"
                    );

                if (!name?.trim()) return;


                const value =
                    prompt(
                        "Result value:"
                    );

                if (value === null) return;


                const item =
                    document.createElement("div");

                item.className =
                    "result-item";


                const label =
                    document.createElement("span");

                label.textContent =
                    name.trim();


                const strong =
                    document.createElement("strong");

                strong.textContent =
                    value.trim() || "—";


                item.append(
                    label,
                    strong
                );


                $("#resultList")
                    ?.appendChild(item);


                showToast("Result added");

            }
        );

    }


    /* =====================================================
       ADD PROBLEM
    ===================================================== */

    const addProblem =
        $("#addProblem");

    if (addProblem) {

        addProblem.addEventListener(
            "click",
            () => {

                const title =
                    prompt(
                        "Problem title:"
                    );

                if (!title?.trim()) return;


                const description =
                    prompt(
                        "Describe the problem:"
                    );


                const item =
                    document.createElement("div");

                item.className =
                    "problem-item";


                const dot =
                    document.createElement("span");

                dot.className =
                    "problem-dot";


                const content =
                    document.createElement("div");


                const strong =
                    document.createElement("strong");

                strong.textContent =
                    title.trim();


                const p =
                    document.createElement("p");

                p.textContent =
                    description?.trim() ||
                    "No description added.";


                content.append(
                    strong,
                    p
                );

                item.append(
                    dot,
                    content
                );


                $("#problemList")
                    ?.appendChild(item);


                showToast("Problem added");

            }
        );

    }


    /* =====================================================
       MODEL IMAGE UPLOAD
    ===================================================== */

    const modelImageInput =
        $("#modelImageInput");

    const modelImageButton =
        $("#modelImageButton");

    const uploadModelImage =
        $("#uploadModelImage");


    function openModelImagePicker() {

        modelImageInput?.click();

    }


    modelImageButton?.addEventListener(
        "click",
        openModelImagePicker
    );

    uploadModelImage?.addEventListener(
        "click",
        openModelImagePicker
    );


    modelImageInput?.addEventListener(
        "change",
        () => {

            const file =
                modelImageInput.files?.[0];

            if (!file) return;


            if (!file.type.startsWith("image/")) {

                showToast("Please select an image");
                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                event => {

                    const preview =
                        $("#modelPreview");

                    if (!preview) return;


                    preview.innerHTML = "";


                    const image =
                        document.createElement("img");

                    image.src =
                        event.target.result;

                    image.alt =
                        file.name;


                    preview.appendChild(image);


                    showToast("Model image added");

                };


            reader.readAsDataURL(file);

        }
    );


    /* =====================================================
       TIMELINE
    ===================================================== */

    const timelineModal =
        $("#simulationTimelineModal");

    const addTimeline =
        $("#addTimeline");

    const saveTimeline =
        $("#saveSimulationTimeline");

    const cancelTimeline =
        $("#cancelSimulationTimeline");

    const closeTimeline =
        $("#closeSimulationTimelineModal");


    let editingTimelineItem = null;


    function resetTimelineForm() {

        $("#simulationTimelineDate").value =
            getTodayISO();

        $("#simulationTimelineStatus").value =
            "planned";

        $("#simulationTimelineTitle").value =
            "";

        $("#simulationTimelineDescription").value =
            "";

        editingTimelineItem = null;

    }


    function openTimelineEditor(item = null) {

        resetTimelineForm();

        editingTimelineItem = item;


        if (item) {

            $("#simulationTimelineDate").value =
                item.dataset.date || getTodayISO();

            $("#simulationTimelineStatus").value =
                item.dataset.status || "planned";

            $("#simulationTimelineTitle").value =
                item.querySelector("h3")?.textContent.trim() || "";

            $("#simulationTimelineDescription").value =
                item.querySelector("p")?.textContent.trim() || "";

        }


        openModal(timelineModal);

    }


    addTimeline?.addEventListener(
        "click",
        () => openTimelineEditor()
    );


    saveTimeline?.addEventListener(
        "click",
        () => {

            const date =
                $("#simulationTimelineDate").value;

            const status =
                $("#simulationTimelineStatus").value;

            const title =
                $("#simulationTimelineTitle").value.trim();

            const description =
                $("#simulationTimelineDescription").value.trim();


            if (!date || !title) {

                showToast(
                    "Date and task are required"
                );

                return;
            }


            const timeline =
                $("#simulationTimeline");


            if (!timeline) return;


            let item =
                editingTimelineItem;


            if (!item) {

                item =
                    document.createElement("article");

                item.className =
                    "timeline-item";

                item.innerHTML = `
                    <div class="timeline-date"></div>

                    <div class="timeline-point"></div>

                    <div class="timeline-card">

                        <div class="timeline-top">

                            <span class="timeline-status"></span>

                            <button
                                class="timeline-edit"
                                type="button"
                                title="Edit timeline entry"
                            >
                                ✎
                            </button>

                        </div>

                        <h3></h3>

                        <p></p>

                    </div>
                `;

                timeline.appendChild(item);

            }


            const dateObject =
                new Date(`${date}T00:00:00`);


            item.querySelector(".timeline-date")
                .textContent =
                dateObject
                    .toLocaleDateString(
                        "en-GB",
                        {
                            day: "2-digit",
                            month: "short"
                        }
                    )
                    .toUpperCase();


            item.querySelector("h3")
                .textContent =
                title;


            item.querySelector("p")
                .textContent =
                description ||
                "No description added.";


            const statusElement =
                item.querySelector(".timeline-status");


            statusElement.className =
                `timeline-status ${status}`;

            statusElement.textContent =
                status.toUpperCase();


            item.dataset.date =
                date;

            item.dataset.status =
                status;


            attachTimelineEditor(item);


            closeModal(timelineModal);

            showToast(
                editingTimelineItem
                    ? "Timeline updated"
                    : "Timeline entry added"
            );

        }
    );


    cancelTimeline?.addEventListener(
        "click",
        () => closeModal(timelineModal)
    );

    closeTimeline?.addEventListener(
        "click",
        () => closeModal(timelineModal)
    );


    function attachTimelineEditor(item) {

        const editButton =
            item.querySelector(".timeline-edit");

        if (!editButton) return;


        editButton.onclick =
            () => openTimelineEditor(item);

    }


    $$(".timeline-item").forEach(
        attachTimelineEditor
    );


    /* =====================================================
       FUTURE WORK
    ===================================================== */

    const addFutureWork =
        $("#addFutureWork");


    addFutureWork?.addEventListener(
        "click",
        () => {

            const date =
                prompt(
                    "Date (example: 05 SEP 2026):"
                );

            if (!date?.trim()) return;


            const title =
                prompt(
                    "Future work:"
                );

            if (!title?.trim()) return;


            const description =
                prompt(
                    "What should be achieved?"
                );


            const card =
                document.createElement("article");

            card.className =
                "future-work-card";


            card.innerHTML = `
                <div class="future-work-date"></div>
                <h3></h3>
                <p></p>
            `;


            card.querySelector(
                ".future-work-date"
            ).textContent =
                date.trim().toUpperCase();


            card.querySelector("h3")
                .textContent =
                title.trim();


            card.querySelector("p")
                .textContent =
                description?.trim() ||
                "No description added.";


            $("#futureWorkList")
                ?.appendChild(card);


            showToast("Future work added");

        }
    );


    /* =====================================================
       FILE UPLOAD
    ===================================================== */

    const fileInput =
        $("#simulationFileInput");

    const uploadButton =
        $("#uploadSimulationFile");

    const uploadZone =
        $("#simulationUploadZone");


    uploadButton?.addEventListener(
        "click",
        () => fileInput?.click()
    );


    uploadZone?.addEventListener(
        "click",
        event => {

            if (
                event.target === uploadZone ||
                event.target.closest(
                    ".simulation-upload-zone"
                )
            ) {

                fileInput?.click();

            }

        }
    );


    fileInput?.addEventListener(
        "change",
        () => {

            const files =
                [...(fileInput.files || [])];

            files.forEach(
                addAttachment
            );

            fileInput.value = "";

        }
    );


    function addAttachment(file) {

        const grid =
            $("#simulationAttachmentGrid");

        if (!grid) return;


        const card =
            document.createElement("article");

        card.className =
            "attachment-card";


        const icon =
            document.createElement("div");

        icon.className =
            "attachment-icon";

        icon.textContent =
            getFileExtension(file.name);


        const info =
            document.createElement("div");

        info.className =
            "attachment-info";


        const name =
            document.createElement("strong");

        name.textContent =
            file.name;


        const meta =
            document.createElement("span");

        meta.textContent =
            `${file.type || "File"} · ${formatBytes(file.size)}`;


        const description =
            document.createElement("small");

        description.textContent =
            "Uploaded just now";


        info.append(
            name,
            meta,
            description
        );


        const open =
            document.createElement("button");

        open.type =
            "button";

        open.textContent =
            "Open";


        open.addEventListener(
            "click",
            () => {

                const url =
                    URL.createObjectURL(file);

                window.open(
                    url,
                    "_blank",
                    "noopener"
                );

            }
        );


        card.append(
            icon,
            info,
            open
        );


        grid.prepend(card);


        showToast(
            `${file.name} added`
        );

    }


    function getFileExtension(filename) {

        const extension =
            filename
                .split(".")
                .pop()
                ?.toUpperCase();


        if (!extension) return "FILE";

        return extension.length > 5
            ? "FILE"
            : extension;

    }


    function formatBytes(bytes) {

        if (!bytes) return "0 B";

        const units =
            [
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

        return `${(
            bytes /
            Math.pow(1024, index)
        ).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;

    }


    /* =====================================================
       DRAG & DROP
    ===================================================== */

    if (uploadZone) {

        [
            "dragenter",
            "dragover"
        ].forEach(type => {

            uploadZone.addEventListener(
                type,
                event => {

                    event.preventDefault();

                    uploadZone.classList.add(
                        "dragging"
                    );

                }
            );

        });


        [
            "dragleave",
            "drop"
        ].forEach(type => {

            uploadZone.addEventListener(
                type,
                event => {

                    event.preventDefault();

                    uploadZone.classList.remove(
                        "dragging"
                    );

                }
            );

        });


        uploadZone.addEventListener(
            "drop",
            event => {

                const files =
                    [...event.dataTransfer.files];

                files.forEach(
                    addAttachment
                );

            }
        );

    }


    /* =====================================================
       LINK MODAL
    ===================================================== */

    const linkModal =
        $("#simulationLinkModal");

    const addLink =
        $("#addSimulationLink");

    const saveLink =
        $("#saveSimulationLink");

    const cancelLink =
        $("#cancelSimulationLink");

    const closeLink =
        $("#closeSimulationLinkModal");


    addLink?.addEventListener(
        "click",
        () => {

            $("#simulationLinkTitle").value = "";
            $("#simulationLinkURL").value = "";
            $("#simulationLinkDescription").value = "";

            openModal(linkModal);

        }
    );


    saveLink?.addEventListener(
        "click",
        () => {

            const title =
                $("#simulationLinkTitle")
                    .value
                    .trim();

            const url =
                $("#simulationLinkURL")
                    .value
                    .trim();

            const description =
                $("#simulationLinkDescription")
                    .value
                    .trim();


            if (!title || !url) {

                showToast(
                    "Title and URL are required"
                );

                return;
            }


            try {

                new URL(url);

            } catch {

                showToast(
                    "Enter a valid URL"
                );

                return;
            }


            const grid =
                $("#simulationAttachmentGrid");


            const card =
                document.createElement("article");

            card.className =
                "attachment-card";


            card.innerHTML = `
                <div class="attachment-icon">
                    LINK
                </div>

                <div class="attachment-info">

                    <strong></strong>

                    <span>External resource</span>

                    <small></small>

                </div>

                <button type="button">
                    Open
                </button>
            `;


            card.querySelector(
                "strong"
            ).textContent =
                title;


            card.querySelector(
                "small"
            ).textContent =
                description ||
                url;


            card.querySelector(
                "button"
            ).addEventListener(
                "click",
                () => {

                    window.open(
                        url,
                        "_blank",
                        "noopener,noreferrer"
                    );

                }
            );


            grid?.prepend(card);

            closeModal(linkModal);

            showToast("Link added");

        }
    );


    cancelLink?.addEventListener(
        "click",
        () => closeModal(linkModal)
    );


    closeLink?.addEventListener(
        "click",
        () => closeModal(linkModal)
    );


    /* =====================================================
       SAVE NOTES / CONCLUSION
    ===================================================== */

    $("#saveSimulationNotes")
        ?.addEventListener(
            "click",
            () => {

                showToast(
                    "Simulation notes saved"
                );

            }
        );


    $("#saveConclusion")
        ?.addEventListener(
            "click",
            () => {

                showToast(
                    "Conclusion saved"
                );

            }
        );


    /* =====================================================
       CLOSE MODALS WITH BACKDROP / ESC
    ===================================================== */

    [timelineModal, linkModal]
        .forEach(modal => {

            modal?.addEventListener(
                "click",
                event => {

                    if (
                        event.target === modal
                    ) {

                        closeModal(modal);

                    }

                }
            );

        });


    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape")
                return;

            closeModal(timelineModal);
            closeModal(linkModal);

        }
    );


});