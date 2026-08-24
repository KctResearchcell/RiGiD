/* =========================================================
   RiGiD — PROTOTYPE
   Interactive Prototype Workspace
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       HELPERS
    ===================================================== */

    const $ = (selector) =>
        document.querySelector(selector);

    const $$ = (selector) =>
        document.querySelectorAll(selector);


    function showToast(message) {

        const toast = $("#prototypeToast");

        if (!toast) return;

        toast.textContent = message;
        toast.classList.remove("hidden");

        clearTimeout(window.prototypeToastTimer);

        window.prototypeToastTimer =
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


    function todayISO() {

        const date = new Date();

        const offset =
            date.getTimezoneOffset() * 60000;

        return new Date(
            date.getTime() - offset
        ).toISOString().slice(0, 10);
    }


    function formatDate(dateString) {

        if (!dateString) return "";

        const date =
            new Date(`${dateString}T00:00:00`);

        if (Number.isNaN(date.getTime()))
            return dateString;

        return date
            .toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            )
            .toUpperCase();
    }


    function formatShortDate(dateString) {

        if (!dateString) return "";

        const date =
            new Date(`${dateString}T00:00:00`);

        if (Number.isNaN(date.getTime()))
            return dateString;

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


    /* =====================================================
       LIVE DATE + CLOCK
    ===================================================== */

    function updatePrototypeClock() {

        const now = new Date();

        const dateElement =
            $("#prototypeDate");

        const clockElement =
            $("#prototypeClock");


        if (dateElement) {

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


    updatePrototypeClock();

    setInterval(
        updatePrototypeClock,
        1000
    );


    /* =====================================================
       NAVIGATION
    ===================================================== */

    $$(".prototype-nav-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    $$(".prototype-nav-item")
                        .forEach(nav => {

                            nav.classList.remove(
                                "active"
                            );

                        });


                    item.classList.add(
                        "active"
                    );


                    const sectionID =
                        item.dataset.section;


                    const section =
                        document.getElementById(
                            sectionID
                        );


                    if (section) {

                        section.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }

                }
            );

        });


    /* =====================================================
       EDIT PROTOTYPE
    ===================================================== */

    $("#editPrototype")
        ?.addEventListener(
            "click",
            () => {

                const titleElement =
                    $("#prototypeTitle");

                const descriptionElement =
                    $("#prototypeDescription");


                const title =
                    prompt(
                        "Prototype name:",
                        titleElement?.textContent.trim()
                    );


                if (title === null)
                    return;


                const description =
                    prompt(
                        "Prototype description:",
                        descriptionElement?.textContent.trim()
                    );


                if (
                    titleElement &&
                    title.trim()
                ) {

                    titleElement.textContent =
                        title.trim();

                }


                if (
                    descriptionElement &&
                    description !== null
                ) {

                    descriptionElement.textContent =
                        description.trim();

                }


                showToast(
                    "Prototype details updated"
                );

            }
        );


    /* =====================================================
       STATUS
    ===================================================== */

    const statusElement =
        $("#prototypeStatus");


    if (statusElement) {

        statusElement.style.cursor =
            "pointer";


        statusElement.addEventListener(
            "click",
            () => {

                const statuses = [
                    {
                        text: "● PLANNING",
                        value: "planning"
                    },
                    {
                        text: "● DESIGNING",
                        value: "designing"
                    },
                    {
                        text: "● BUILDING",
                        value: "building"
                    },
                    {
                        text: "● TESTING",
                        value: "testing"
                    },
                    {
                        text: "● COMPLETED",
                        value: "completed"
                    }
                ];


                const current =
                    statusElement.textContent
                        .trim()
                        .replace("● ", "")
                        .toLowerCase();


                const index =
                    statuses.findIndex(
                        item =>
                            item.value ===
                            current
                    );


                const next =
                    statuses[
                        (index + 1) %
                        statuses.length
                    ];


                statusElement.textContent =
                    next.text;


                showToast(
                    `Status: ${next.value.toUpperCase()}`
                );

            }
        );

    }


    /* =====================================================
       PROGRESS
    ===================================================== */

    const progressCard =
        $(".progress-card");


    const progressBar =
        $("#prototypeProgressBar");


    const progressText =
        $("#prototypeProgress");


    const progressStatus =
        $("#prototypeProgressStatus");


    function updatePrototypeProgress(
        value
    ) {

        value =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(value)
                )
            );


        if (progressBar) {

            progressBar.style.width =
                `${value}%`;

        }


        if (progressText) {

            progressText.textContent =
                `${value}%`;

        }


        if (progressStatus) {

            if (value >= 100) {

                progressStatus.textContent =
                    "Completed";

            } else if (value >= 75) {

                progressStatus.textContent =
                    "Testing phase";

            } else if (value >= 45) {

                progressStatus.textContent =
                    "Build phase";

            } else if (value >= 20) {

                progressStatus.textContent =
                    "Design phase";

            } else {

                progressStatus.textContent =
                    "Getting started";

            }

        }

    }


    progressCard?.addEventListener(
        "click",
        event => {

            if (
                event.target.closest("button")
            )
                return;


            const current =
                progressText?.textContent
                    .replace("%", "")
                    .trim() || "0";


            const value =
                prompt(
                    "Prototype progress (0–100):",
                    current
                );


            if (value === null)
                return;


            if (
                value === "" ||
                Number.isNaN(Number(value))
            ) {

                showToast(
                    "Enter a valid percentage"
                );

                return;

            }


            updatePrototypeProgress(
                value
            );


            showToast(
                "Prototype progress updated"
            );

        }
    );


    /* =====================================================
       VERSION
    ===================================================== */

    $("#editVersion")
        ?.addEventListener(
            "click",
            () => {

                const version =
                    prompt(
                        "Current prototype version:",
                        $("#currentVersion")
                            ?.textContent.trim() ||
                        "V2"
                    );


                if (version === null)
                    return;


                const description =
                    prompt(
                        "Version description:"
                    );


                if (
                    $("#currentVersion") &&
                    version.trim()
                ) {

                    $("#currentVersion")
                        .textContent =
                        version.trim();

                }


                if (
                    $("#prototypeVersion") &&
                    version.trim()
                ) {

                    $("#prototypeVersion")
                        .textContent =
                        version.trim();

                }


                const versionDescription =
                    $(".version-display span");


                if (
                    versionDescription &&
                    description !== null
                ) {

                    versionDescription.textContent =
                        description.trim();

                }


                showToast(
                    "Version updated"
                );

            }
        );


    /* =====================================================
       NEXT ACTION
    ===================================================== */

    $("#editPrototypeNext")
        ?.addEventListener(
            "click",
            () => {

                const container =
                    $("#prototypeNextAction");


                const title =
                    container?.querySelector(
                        "strong"
                    );


                const date =
                    container?.querySelector(
                        "span"
                    );


                const newTitle =
                    prompt(
                        "Next action:",
                        title?.textContent.trim()
                    );


                if (newTitle === null)
                    return;


                const newDate =
                    prompt(
                        "Due date:",
                        date?.textContent.trim()
                    );


                if (
                    title &&
                    newTitle.trim()
                ) {

                    title.textContent =
                        newTitle.trim();

                }


                if (
                    date &&
                    newDate !== null
                ) {

                    date.textContent =
                        newDate.trim();

                }


                showToast(
                    "Next action updated"
                );

            }
        );


    /* =====================================================
       OBJECTIVE
    ===================================================== */

    $("#editObjective")
        ?.addEventListener(
            "click",
            () => {

                const content =
                    $("#prototypeObjective");


                if (!content)
                    return;


                const current =
                    content.innerText.trim();


                const updated =
                    prompt(
                        "Prototype objective:",
                        current
                    );


                if (updated === null)
                    return;


                content.innerHTML = "";


                const paragraph =
                    document.createElement(
                        "p"
                    );


                paragraph.textContent =
                    updated.trim();


                content.appendChild(
                    paragraph
                );


                showToast(
                    "Objective updated"
                );

            }
        );


    /* =====================================================
       SPECIFICATIONS
    ===================================================== */

    $("#addSpecification")
        ?.addEventListener(
            "click",
            () => {

                const name =
                    prompt(
                        "Parameter name:"
                    );


                if (!name?.trim())
                    return;


                const value =
                    prompt(
                        "Value:"
                    );


                if (value === null)
                    return;


                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "specification-row";


                const nameSpan =
                    document.createElement(
                        "span"
                    );


                const valueStrong =
                    document.createElement(
                        "strong"
                    );


                nameSpan.textContent =
                    name.trim();


                valueStrong.textContent =
                    value.trim();


                row.appendChild(
                    nameSpan
                );


                row.appendChild(
                    valueStrong
                );


                $("#specificationList")
                    ?.appendChild(row);


                showToast(
                    "Specification added"
                );

            }
        );


    /* =====================================================
       DESIGN DECISIONS
    ===================================================== */

    $("#addDesignDecision")
        ?.addEventListener(
            "click",
            () => {

                const title =
                    prompt(
                        "Design decision:"
                    );


                if (!title?.trim())
                    return;


                const reason =
                    prompt(
                        "Reason / explanation:"
                    );


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "design-decision";


                item.innerHTML = `
                    <strong></strong>
                    <p></p>
                `;


                item.querySelector(
                    "strong"
                ).textContent =
                    title.trim();


                item.querySelector(
                    "p"
                ).textContent =
                    reason?.trim() ||
                    "No explanation added.";


                $("#designDecisionList")
                    ?.appendChild(item);


                showToast(
                    "Design decision added"
                );

            }
        );


    /* =====================================================
       BUILD LOG
    ===================================================== */

    const buildModal =
        $("#buildModal");


    const addBuildEntry =
        $("#addBuildEntry");


    const saveBuild =
        $("#saveBuild");


    const cancelBuild =
        $("#cancelBuild");


    const closeBuildModal =
        $("#closeBuildModal");


    let editingBuildEntry = null;


    function resetBuildForm() {

        $("#buildDate").value =
            todayISO();

        $("#buildStatus").value =
            "ongoing";

        $("#buildTitle").value =
            "";

        $("#buildDescription").value =
            "";

        editingBuildEntry = null;

    }


    function openBuildEditor(
        entry = null
    ) {

        resetBuildForm();

        editingBuildEntry =
            entry;


        if (entry) {

            $("#buildDate").value =
                entry.dataset.date ||
                todayISO();


            $("#buildStatus").value =
                entry.dataset.status ||
                "ongoing";


            $("#buildTitle").value =
                entry.querySelector(
                    "h3"
                )?.textContent.trim() ||
                "";


            $("#buildDescription").value =
                entry.querySelector(
                    "p"
                )?.textContent.trim() ||
                "";

        }


        openModal(
            buildModal
        );

    }


    addBuildEntry?.addEventListener(
        "click",
        () =>
            openBuildEditor()
    );


    saveBuild?.addEventListener(
        "click",
        () => {

            const date =
                $("#buildDate").value;


            const status =
                $("#buildStatus").value;


            const title =
                $("#buildTitle")
                    .value
                    .trim();


            const description =
                $("#buildDescription")
                    .value
                    .trim();


            if (!date || !title) {

                showToast(
                    "Date and title are required"
                );

                return;

            }


            let entry =
                editingBuildEntry;


            if (!entry) {

                entry =
                    document.createElement(
                        "article"
                    );


                entry.className =
                    "build-entry";


                entry.innerHTML = `

                    <div class="build-entry-date"></div>

                    <div class="build-entry-content">

                        <div class="build-entry-top">

                            <span
                                class="build-status"
                            ></span>

                            <button
                                class="timeline-edit"
                                type="button"
                            >
                                ✎
                            </button>

                        </div>

                        <h3></h3>

                        <p></p>

                    </div>

                `;


                $("#buildLog")
                    ?.prepend(entry);

            }


            entry.dataset.date =
                date;


            entry.dataset.status =
                status;


            entry.querySelector(
                ".build-entry-date"
            ).textContent =
                formatShortDate(date);


            const statusElement =
                entry.querySelector(
                    ".build-status"
                );


            statusElement.className =
                `build-status ${status}`;


            statusElement.textContent =
                status === "completed"
                    ? "COMPLETED"
                    : status === "ongoing"
                        ? "IN PROGRESS"
                        : "PLANNED";


            entry.querySelector(
                "h3"
            ).textContent =
                title;


            entry.querySelector(
                "p"
            ).textContent =
                description ||
                "No description added.";


            attachBuildEditor(
                entry
            );


            closeModal(
                buildModal
            );


            showToast(
                editingBuildEntry
                    ? "Build entry updated"
                    : "Build entry added"
            );

        }
    );


    cancelBuild?.addEventListener(
        "click",
        () =>
            closeModal(buildModal)
    );


    closeBuildModal?.addEventListener(
        "click",
        () =>
            closeModal(buildModal)
    );


    function attachBuildEditor(
        entry
    ) {

        const button =
            entry.querySelector(
                ".timeline-edit"
            );


        if (!button)
            return;


        button.onclick =
            () =>
                openBuildEditor(entry);

    }


    $$(".build-entry")
        .forEach(
            attachBuildEditor
        );


    /* =====================================================
       COMPONENTS
    ===================================================== */

    $("#addComponent")
        ?.addEventListener(
            "click",
            () => {

                const name =
                    prompt(
                        "Component name:"
                    );


                if (!name?.trim())
                    return;


                const specification =
                    prompt(
                        "Specification:"
                    );


                const quantity =
                    prompt(
                        "Quantity:",
                        "1"
                    );


                const status =
                    prompt(
                        "Status:\nready\npending",
                        "ready"
                    );


                const notes =
                    prompt(
                        "Notes:"
                    );


                const finalStatus =
                    status === "pending"
                        ? "pending"
                        : "ready";


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td></td>

                    <td></td>

                    <td></td>

                    <td>

                        <span
                            class="component-status"
                        ></span>

                    </td>

                    <td></td>

                `;


                row.children[0]
                    .textContent =
                    name.trim();


                row.children[1]
                    .textContent =
                    specification?.trim() ||
                    "—";


                row.children[2]
                    .textContent =
                    quantity?.trim() ||
                    "1";


                const statusElement =
                    row.querySelector(
                        ".component-status"
                    );


                statusElement.className =
                    `component-status ${finalStatus}`;


                statusElement.textContent =
                    finalStatus === "ready"
                        ? "READY"
                        : "PENDING";


                row.children[4]
                    .textContent =
                    notes?.trim() ||
                    "—";


                $("#componentTableBody")
                    ?.appendChild(row);


                updateComponentSummary();


                showToast(
                    "Component added"
                );

            }
        );


    function updateComponentSummary() {

        const rows =
            $$("#componentTableBody tr");


        let ready = 0;
        let pending = 0;


        rows.forEach(row => {

            if (
                row.querySelector(
                    ".component-status.ready"
                )
            ) {

                ready++;

            } else {

                pending++;

            }

        });


        if ($("#componentTotal"))
            $("#componentTotal")
                .textContent =
                rows.length;


        if ($("#componentReady"))
            $("#componentReady")
                .textContent =
                ready;


        if ($("#componentPending"))
            $("#componentPending")
                .textContent =
                pending;

    }


    updateComponentSummary();


    /* =====================================================
       TESTING
    ===================================================== */

    const testModal =
        $("#prototypeTestModal");


    let editingPrototypeTest = null;


    $("#addPrototypeTest")
        ?.addEventListener(
            "click",
            () => {

                resetTestForm();

                openModal(
                    testModal
                );

            }
        );


    function resetTestForm() {

        $("#prototypeTestName").value =
            "";

        $("#prototypeTestResult").value =
            "pending";

        $("#prototypeTestDate").value =
            todayISO();

        $("#prototypeTestDescription").value =
            "";

        editingPrototypeTest = null;

    }


    $("#savePrototypeTest")
        ?.addEventListener(
            "click",
            () => {

                const name =
                    $("#prototypeTestName")
                        .value
                        .trim();


                const result =
                    $("#prototypeTestResult")
                        .value;


                const date =
                    $("#prototypeTestDate")
                        .value;


                const description =
                    $("#prototypeTestDescription")
                        .value
                        .trim();


                if (!name) {

                    showToast(
                        "Test name is required"
                    );

                    return;

                }


                let test =
                    editingPrototypeTest;


                if (!test) {

                    test =
                        document.createElement(
                            "article"
                        );


                    test.className =
                        "prototype-test";


                    test.innerHTML = `

                        <div
                            class="test-result-icon"
                        ></div>

                        <div
                            class="prototype-test-info"
                        >

                            <strong></strong>

                            <p></p>

                        </div>

                        <span
                            class="test-result-badge"
                        ></span>

                    `;


                    $("#prototypeTestList")
                        ?.prepend(test);

                }


                test.className =
                    `prototype-test ${result}`;


                const icon =
                    result === "passed"
                        ? "✓"
                        : result === "failed"
                            ? "!"
                            : "•";


                test.querySelector(
                    ".test-result-icon"
                ).textContent =
                    icon;


                test.querySelector(
                    ".prototype-test-info strong"
                ).textContent =
                    name;


                test.querySelector(
                    ".prototype-test-info p"
                ).textContent =
                    description ||
                    "No description added.";


                const badge =
                    test.querySelector(
                        ".test-result-badge"
                    );


                badge.className =
                    `test-result-badge ${result}`;


                badge.textContent =
                    result.toUpperCase();


                test.dataset.date =
                    date;


                closeModal(
                    testModal
                );


                updateTestSummary();


                showToast(
                    editingPrototypeTest
                        ? "Test updated"
                        : "Test added"
                );

            }
        );


    $("#cancelPrototypeTest")
        ?.addEventListener(
            "click",
            () =>
                closeModal(testModal)
        );


    $("#closePrototypeTestModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(testModal)
        );


    function updateTestSummary() {

        const tests =
            $$(".prototype-test");


        let passed = 0;
        let failed = 0;
        let pending = 0;


        tests.forEach(test => {

            if (
                test.classList.contains(
                    "passed"
                )
            ) {

                passed++;

            } else if (
                test.classList.contains(
                    "failed"
                )
            ) {

                failed++;

            } else {

                pending++;

            }

        });


        const summary =
            $$(".test-summary-card");


        if (summary.length >= 4) {

            summary[0]
                .querySelector("strong")
                .textContent =
                tests.length;


            summary[1]
                .querySelector("strong")
                .textContent =
                passed;


            summary[2]
                .querySelector("strong")
                .textContent =
                failed;


            summary[3]
                .querySelector("strong")
                .textContent =
                pending;

        }

    }


    updateTestSummary();


    /* =====================================================
       MEASUREMENTS
    ===================================================== */

    $("#addMeasurement")
        ?.addEventListener(
            "click",
            () => {

                const parameter =
                    prompt(
                        "Parameter:"
                    );


                if (!parameter?.trim())
                    return;


                const expected =
                    prompt(
                        "Expected value:"
                    );


                const measured =
                    prompt(
                        "Measured value:"
                    );


                const unit =
                    prompt(
                        "Unit:"
                    );


                const numericExpected =
                    Number(expected);


                const numericMeasured =
                    Number(measured);


                let result =
                    "PASS";


                if (
                    Number.isFinite(
                        numericExpected
                    ) &&
                    Number.isFinite(
                        numericMeasured
                    )
                ) {

                    const tolerance =
                        Math.abs(
                            numericExpected
                        ) * 0.05;


                    result =
                        Math.abs(
                            numericMeasured -
                            numericExpected
                        ) <= tolerance
                            ? "PASS"
                            : "CHECK";

                }


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td></td>

                    <td></td>

                    <td></td>

                    <td></td>

                    <td>

                        <span
                            class="measurement-pass"
                        ></span>

                    </td>

                `;


                row.children[0]
                    .textContent =
                    parameter.trim();


                row.children[1]
                    .textContent =
                    expected?.trim() ||
                    "—";


                row.children[2]
                    .textContent =
                    measured?.trim() ||
                    "—";


                row.children[3]
                    .textContent =
                    unit?.trim() ||
                    "—";


                row.querySelector(
                    ".measurement-pass"
                ).textContent =
                    result;


                if (result === "CHECK") {

                    row.querySelector(
                        ".measurement-pass"
                    ).style.color =
                        "#f08c42";

                }


                $("#measurementTableBody")
                    ?.appendChild(row);


                showToast(
                    "Measurement added"
                );

            }
        );


    /* =====================================================
       ITERATIONS
    ===================================================== */

    $("#addIteration")
        ?.addEventListener(
            "click",
            () => {

                const version =
                    prompt(
                        "Version:",
                        "V3"
                    );


                if (!version?.trim())
                    return;


                const title =
                    prompt(
                        "Iteration title:"
                    );


                if (!title?.trim())
                    return;


                const description =
                    prompt(
                        "What changed?"
                    );


                const changes =
                    prompt(
                        "Changes separated by commas:"
                    );


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "iteration-card current";


                card.innerHTML = `

                    <div
                        class="iteration-version"
                    ></div>

                    <div
                        class="iteration-content"
                    >

                        <div class="iteration-top">

                            <strong></strong>

                            <span></span>

                        </div>

                        <p></p>

                        <div
                            class="iteration-changes"
                        ></div>

                    </div>

                `;


                card.querySelector(
                    ".iteration-version"
                ).textContent =
                    version.trim();


                card.querySelector(
                    ".iteration-top strong"
                ).textContent =
                    title.trim();


                card.querySelector(
                    ".iteration-top span"
                ).textContent =
                    formatDate(todayISO());


                card.querySelector(
                    ".iteration-content p"
                ).textContent =
                    description?.trim() ||
                    "No description added.";


                const changesContainer =
                    card.querySelector(
                        ".iteration-changes"
                    );


                if (changes) {

                    changes
                        .split(",")
                        .map(
                            item =>
                                item.trim()
                        )
                        .filter(Boolean)
                        .forEach(
                            change => {

                                const span =
                                    document.createElement(
                                        "span"
                                    );

                                span.textContent =
                                    `+ ${change}`;

                                changesContainer
                                    .appendChild(
                                        span
                                    );

                            }
                        );

                }


                $("#iterationList")
                    ?.prepend(card);


                showToast(
                    `${version.trim()} added`
                );

            }
        );


    /* =====================================================
       FAILURE
    ===================================================== */

    $("#addFailure")
        ?.addEventListener(
            "click",
            () => {

                const title =
                    prompt(
                        "Problem / failure:"
                    );


                if (!title?.trim())
                    return;


                const description =
                    prompt(
                        "What happened?"
                    );


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "failure-item";


                item.innerHTML = `

                    <span class="failure-icon">
                        !
                    </span>

                    <div>

                        <strong></strong>

                        <p></p>

                    </div>

                `;


                item.querySelector(
                    "strong"
                ).textContent =
                    title.trim();


                item.querySelector(
                    "p"
                ).textContent =
                    description?.trim() ||
                    "No description added.";


                $("#failureList")
                    ?.appendChild(item);


                showToast(
                    "Failure added"
                );

            }
        );


    /* =====================================================
       MODIFICATION
    ===================================================== */

    $("#addModification")
        ?.addEventListener(
            "click",
            () => {

                const title =
                    prompt(
                        "Modification:"
                    );


                if (!title?.trim())
                    return;


                const description =
                    prompt(
                        "What was changed?"
                    );


                const count =
                    $$(".modification-item")
                        .length + 1;


                const number =
                    String(count)
                        .padStart(
                            2,
                            "0"
                        );


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "modification-item";


                item.innerHTML = `

                    <span
                        class="modification-number"
                    ></span>

                    <div>

                        <strong></strong>

                        <p></p>

                    </div>

                `;


                item.querySelector(
                    ".modification-number"
                ).textContent =
                    number;


                item.querySelector(
                    "strong"
                ).textContent =
                    title.trim();


                item.querySelector(
                    "p"
                ).textContent =
                    description?.trim() ||
                    "No description added.";


                $("#modificationList")
                    ?.appendChild(item);


                showToast(
                    "Modification added"
                );

            }
        );


    /* =====================================================
       FILE UPLOAD
    ===================================================== */

    const fileInput =
        $("#prototypeFileInput");


    const uploadButton =
        $("#uploadPrototypeFile");


    const uploadZone =
        $("#prototypeUploadZone");


    uploadButton?.addEventListener(
        "click",
        () =>
            fileInput?.click()
    );


    uploadZone?.addEventListener(
        "click",
        () =>
            fileInput?.click()
    );


    fileInput?.addEventListener(
        "change",
        () => {

            const files =
                [
                    ...(fileInput.files || [])
                ];


            files.forEach(
                addPrototypeFile
            );


            fileInput.value = "";

        }
    );


    function addPrototypeFile(file) {

        const extension =
            getFileExtension(
                file.name
            );


        const image =
            file.type.startsWith(
                "image/"
            );


        const video =
            file.type.startsWith(
                "video/"
            );


        if (
            image ||
            video
        ) {

            addMediaFile(
                file,
                image
            );

        } else {

            addDocumentFile(
                file
            );

        }


        showToast(
            `${file.name} added`
        );

    }


    function addMediaFile(
        file,
        isImage
    ) {

        const grid =
            $("#prototypeMediaGrid");


        if (!grid)
            return;


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "prototype-media-card";


        const placeholder =
            document.createElement(
                "div"
            );


        placeholder.className =
                "media-placeholder" +
                (
                    isImage
                        ? ""
                        : " video"
                );


        if (isImage) {

            const image =
                document.createElement(
                    "img"
                );


            image.src =
                URL.createObjectURL(
                    file
                );


            image.alt =
                file.name;


            image.style.width =
                "100%";


            image.style.height =
                "125px";


            image.style.objectFit =
                "cover";


            placeholder.replaceWith(
                image
            );


            card.appendChild(
                image
            );

        } else {

            placeholder.textContent =
                "VIDEO";


            card.appendChild(
                placeholder
            );

        }


        const info =
            document.createElement(
                "div"
            );


        info.className =
            "media-info";


        const strong =
            document.createElement(
                "strong"
            );


        const span =
            document.createElement(
                "span"
            );


        strong.textContent =
            file.name;


        span.textContent =
            isImage
                ? "Image"
                : "Video";


        info.appendChild(
            strong
        );


        info.appendChild(
            span
        );


        card.appendChild(
            info
        );


        grid.prepend(card);

    }


    function addDocumentFile(file) {

        const list =
            $("#prototypeFileList");


        if (!list)
            return;


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "prototype-file";


        card.innerHTML = `

            <div class="prototype-file-icon">
                ${getFileExtension(file.name)}
            </div>

            <div class="prototype-file-info">

                <strong></strong>

                <span></span>

            </div>

            <button type="button">
                Open
            </button>

        `;


        card.querySelector(
            "strong"
        ).textContent =
            file.name;


        card.querySelector(
            "span"
        ).textContent =
            `${file.type || "File"} · ${
                formatBytes(file.size)
            }`;


        card.querySelector(
            "button"
        ).addEventListener(
            "click",
            () => {

                const url =
                    URL.createObjectURL(
                        file
                    );


                window.open(
                    url,
                    "_blank",
                    "noopener"
                );

            }
        );


        list.prepend(card);

    }


    function getFileExtension(
        filename
    ) {

        const extension =
            filename
                .split(".")
                .pop()
                ?.toUpperCase();


        if (!extension)
            return "FILE";


        return extension.length > 5
            ? "FILE"
            : extension;

    }


    function formatBytes(bytes) {

        if (!bytes)
            return "0 B";


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


        return `${
            (
                bytes /
                Math.pow(
                    1024,
                    index
                )
            ).toFixed(
                index === 0
                    ? 0
                    : 1
            )
        } ${units[index]}`;

    }


    /* =====================================================
       DRAG & DROP
    ===================================================== */

    if (uploadZone) {

        [
            "dragenter",
            "dragover"
        ].forEach(
            eventName => {

                uploadZone.addEventListener(
                    eventName,
                    event => {

                        event.preventDefault();

                        uploadZone.classList.add(
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

                uploadZone.addEventListener(
                    eventName,
                    event => {

                        event.preventDefault();

                        uploadZone.classList.remove(
                            "dragging"
                        );

                    }
                );

            }
        );


        uploadZone.addEventListener(
            "drop",
            event => {

                const files =
                    [
                        ...event.dataTransfer.files
                    ];


                files.forEach(
                    addPrototypeFile
                );

            }
        );

    }


    /* =====================================================
       LINK MODAL
    ===================================================== */

    const linkModal =
        $("#prototypeLinkModal");


    $("#addPrototypeLink")
        ?.addEventListener(
            "click",
            () => {

                $("#prototypeLinkTitle").value =
                    "";

                $("#prototypeLinkURL").value =
                    "";

                $("#prototypeLinkDescription").value =
                    "";

                openModal(
                    linkModal
                );

            }
        );


    $("#savePrototypeLink")
        ?.addEventListener(
            "click",
            () => {

                const title =
                    $("#prototypeLinkTitle")
                        .value
                        .trim();


                const url =
                    $("#prototypeLinkURL")
                        .value
                        .trim();


                const description =
                    $("#prototypeLinkDescription")
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


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "prototype-file";


                card.innerHTML = `

                    <div class="prototype-file-icon">
                        LINK
                    </div>

                    <div class="prototype-file-info">

                        <strong></strong>

                        <span></span>

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
                    "span"
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


                $("#prototypeFileList")
                    ?.prepend(card);


                closeModal(
                    linkModal
                );


                showToast(
                    "Link added"
                );

            }
        );


    $("#cancelPrototypeLink")
        ?.addEventListener(
            "click",
            () =>
                closeModal(linkModal)
        );


    $("#closePrototypeLinkModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(linkModal)
        );


    /* =====================================================
       FUTURE IMPROVEMENT
===================================================== */

    $("#addImprovement")
        ?.addEventListener(
            "click",
            () => {

                const priority =
                    prompt(
                        "Priority:\nhigh\nmedium\nfuture",
                        "medium"
                    );


                const title =
                    prompt(
                        "Improvement:"
                    );


                if (!title?.trim())
                    return;


                const description =
                    prompt(
                        "Description:"
                    );


                const validPriority =
                    [
                        "high",
                        "medium",
                        "future"
                    ];


                const finalPriority =
                    validPriority.includes(
                        priority
                    )
                        ? priority
                        : "medium";


                const label =
                    finalPriority === "high"
                        ? "HIGH PRIORITY"
                        : finalPriority === "medium"
                            ? "MEDIUM PRIORITY"
                            : "FUTURE";


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "improvement-card";


                card.innerHTML = `

                    <span></span>

                    <h3></h3>

                    <p></p>

                `;


                card.querySelector(
                    "span"
                ).textContent =
                    label;


                card.querySelector(
                    "h3"
                ).textContent =
                    title.trim();


                card.querySelector(
                    "p"
                ).textContent =
                    description?.trim() ||
                    "No description added.";


                $("#improvementGrid")
                    ?.appendChild(card);


                showToast(
                    "Improvement added"
                );

            }
        );


    /* =====================================================
       OUTCOME
    ===================================================== */

    $("#savePrototypeOutcome")
        ?.addEventListener(
            "click",
            () => {

                const outcome =
                    $("#prototypeOutcome")
                        ?.value
                        .trim();


                if (!outcome) {

                    showToast(
                        "Write the prototype outcome first"
                    );

                    return;

                }


                showToast(
                    "Prototype outcome saved"
                );

            }
        );


    /* =====================================================
       MODAL BACKDROP
    ===================================================== */

    [
        buildModal,
        testModal,
        linkModal
    ].forEach(
        modal => {

            modal?.addEventListener(
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


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            )
                return;


            closeModal(
                buildModal
            );


            closeModal(
                testModal
            );


            closeModal(
                linkModal
            );

        }
    );


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    updatePrototypeProgress(68);

});