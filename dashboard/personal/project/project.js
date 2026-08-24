/* =========================================================
   RiGiD — PROJECT
   Interactive behaviour
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

        const toast = $("#projectToast");

        if (!toast) return;

        toast.textContent = message;

        toast.classList.remove("hidden");

        clearTimeout(window.projectToastTimer);

        window.projectToastTimer =
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
                    month: "short"
                }
            )
            .toUpperCase();
    }


    /* =====================================================
       LIVE DATE + CLOCK
    ===================================================== */

    function updateClock() {

        const now = new Date();

        const date =
            $("#liveDate");

        const clock =
            $("#liveClock");


        if (date) {

            date.textContent =
                now.toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                ).toUpperCase();

        }


        if (clock) {

            clock.textContent =
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

    $$(".project-nav-item").forEach(item => {

        item.addEventListener(
            "click",
            () => {

                $$(".project-nav-item")
                    .forEach(nav =>
                        nav.classList.remove("active")
                    );


                item.classList.add("active");


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
       EDIT PROJECT
    ===================================================== */

    const editProject =
        $("#editProject");


    if (editProject) {

        editProject.addEventListener(
            "click",
            () => {

                const title =
                    $("#projectTitle");

                const description =
                    $("#projectDescription");


                const newTitle =
                    prompt(
                        "Project title:",
                        title?.textContent.trim()
                    );


                if (newTitle === null)
                    return;


                const newDescription =
                    prompt(
                        "Project description:",
                        description?.textContent.trim()
                    );


                if (
                    title &&
                    newTitle.trim()
                ) {

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


                showToast(
                    "Project details updated"
                );

            }
        );

    }


    /* =====================================================
       PROJECT STATUS
    ===================================================== */

    const projectStatus =
        $("#projectStatus");


    if (projectStatus) {

        projectStatus.addEventListener(
            "click",
            () => {

                const statuses = [
                    "NOT STARTED",
                    "IN PROGRESS",
                    "ON HOLD",
                    "COMPLETED"
                ];


                const current =
                    projectStatus.textContent
                        .replace("●", "")
                        .trim();


                const index =
                    statuses.indexOf(current);


                const next =
                    statuses[
                        (index + 1) %
                        statuses.length
                    ];


                projectStatus.textContent =
                    `● ${next}`;


                showToast(
                    `Status: ${next}`
                );

            }
        );

    }


    /* =====================================================
       PROJECT PRIORITY
    ===================================================== */

    const projectPriority =
        $("#projectPriority");


    if (projectPriority) {

        projectPriority.addEventListener(
            "click",
            () => {

                const priorities = [
                    "LOW PRIORITY",
                    "MEDIUM PRIORITY",
                    "HIGH PRIORITY"
                ];


                const current =
                    projectPriority.textContent.trim();


                const index =
                    priorities.indexOf(current);


                const next =
                    priorities[
                        (index + 1) %
                        priorities.length
                    ];


                projectPriority.textContent =
                    next;


                showToast(
                    `Priority: ${next}`
                );

            }
        );

    }


    /* =====================================================
       PROJECT PROGRESS
    ===================================================== */

    const progressCard =
        $(".progress-card");


    const progressBar =
        $("#projectProgressBar");


    const progressText =
        $("#projectProgress");


    const progressStatus =
        $("#progressStatus");


    function updateProgress(value) {

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

            if (value === 100) {

                progressStatus.textContent =
                    "Completed";

            } else if (value >= 70) {

                progressStatus.textContent =
                    "On track";

            } else if (value >= 40) {

                progressStatus.textContent =
                    "In progress";

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
                    "Project progress (0–100):",
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


            updateProgress(value);

            showToast(
                "Project progress updated"
            );

        }
    );


    /* =====================================================
       CURRENT WORK
    ===================================================== */

    $("#editCurrentWork")
        ?.addEventListener(
            "click",
            () => {

                const container =
                    $("#currentWork");

                if (!container)
                    return;


                const title =
                    container.querySelector(
                        "strong"
                    );


                const description =
                    container.querySelector(
                        "p"
                    );


                const newTitle =
                    prompt(
                        "Current work:",
                        title?.textContent.trim()
                    );


                if (newTitle === null)
                    return;


                const newDescription =
                    prompt(
                        "Description:",
                        description?.textContent.trim()
                    );


                if (
                    title &&
                    newTitle.trim()
                ) {

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


                showToast(
                    "Current work updated"
                );

            }
        );


    /* =====================================================
       NEXT ACTION
    ===================================================== */

    $("#editNextAction")
        ?.addEventListener(
            "click",
            () => {

                const container =
                    $("#nextAction");


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
                        date?.textContent
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
       DESCRIPTION
    ===================================================== */

    $("#editDescription")
        ?.addEventListener(
            "click",
            () => {

                const content =
                    $("#descriptionContent");


                if (!content)
                    return;


                const current =
                    content.innerText.trim();


                const updated =
                    prompt(
                        "Project objective:",
                        current
                    );


                if (updated === null)
                    return;


                content.innerHTML = "";


                const paragraph =
                    document.createElement("p");


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
       TASKS
    ===================================================== */

    const taskModal =
        $("#taskModal");


    const addTask =
        $("#addTask");


    const saveTask =
        $("#saveTask");


    const cancelTask =
        $("#cancelTask");


    const closeTaskModal =
        $("#closeTaskModal");


    let editingTask = null;


    function resetTaskForm() {

        $("#taskTitle").value = "";

        $("#taskPriority").value =
            "medium";

        $("#taskDate").value =
            todayISO();

        $("#taskStatus").value =
            "todo";

        $("#taskDescription").value = "";

        editingTask = null;

    }


    function openTaskEditor(task = null) {

        resetTaskForm();

        editingTask = task;


        if (task) {

            $("#taskTitle").value =
                task.querySelector(
                    "h3"
                )?.textContent.trim() || "";


            const priority =
                task.querySelector(
                    ".task-priority"
                );


            if (priority) {

                const value =
                    [...priority.classList]
                        .find(
                            item =>
                                [
                                    "high",
                                    "medium",
                                    "low"
                                ].includes(item)
                        );


                if (value)
                    $("#taskPriority").value =
                        value;

            }


            $("#taskDescription").value =
                task.querySelector(
                    "p"
                )?.textContent.trim() || "";

        }


        openModal(taskModal);

    }


    addTask?.addEventListener(
        "click",
        () => openTaskEditor()
    );


    saveTask?.addEventListener(
        "click",
        () => {

            const title =
                $("#taskTitle")
                    .value
                    .trim();


            const priority =
                $("#taskPriority")
                    .value;


            const date =
                $("#taskDate")
                    .value;


            const status =
                $("#taskStatus")
                    .value;


            const description =
                $("#taskDescription")
                    .value
                    .trim();


            if (!title) {

                showToast(
                    "Task title is required"
                );

                return;

            }


            let task =
                editingTask;


            if (!task) {

                task =
                    document.createElement(
                        "article"
                    );

                task.className =
                    "task-card";

                task.innerHTML = `

                    <div class="task-top">

                        <span class="task-priority"></span>

                        <button
                            class="task-menu"
                            type="button"
                        >
                            ⋯
                        </button>

                    </div>

                    <h3></h3>

                    <p></p>

                    <div class="task-footer">

                        <span></span>

                        <span>You</span>

                    </div>

                `;

            }


            task.dataset.status =
                status;


            task.querySelector("h3")
                .textContent =
                title;


            task.querySelector("p")
                .textContent =
                description ||
                "No description added.";


            const priorityElement =
                task.querySelector(
                    ".task-priority"
                );


            priorityElement.className =
                `task-priority ${priority}`;


            priorityElement.textContent =
                priority.toUpperCase();


            task.querySelector(
                ".task-footer span"
            ).textContent =
                date
                    ? formatDate(date)
                    : "No date";


            attachTaskMenu(task);


            const targetList =
                getTaskList(status);


            if (targetList) {

                targetList.appendChild(task);

            }


            updateTaskCounts();


            closeModal(taskModal);


            showToast(
                editingTask
                    ? "Task updated"
                    : "Task added"
            );

        }
    );


    cancelTask?.addEventListener(
        "click",
        () => closeModal(taskModal)
    );


    closeTaskModal?.addEventListener(
        "click",
        () => closeModal(taskModal)
    );


    function getTaskList(status) {

        if (status === "progress")
            return $("#progressTasks");

        if (status === "done")
            return $("#doneTasks");

        return $("#todoTasks");

    }


    function updateTaskCounts() {

        const todo =
            $("#todoTasks")
                ?.querySelectorAll(
                    ".task-card"
                ).length || 0;


        const progress =
            $("#progressTasks")
                ?.querySelectorAll(
                    ".task-card"
                ).length || 0;


        const done =
            $("#doneTasks")
                ?.querySelectorAll(
                    ".task-card"
                ).length || 0;


        if ($("#todoCount"))
            $("#todoCount").textContent =
                todo;


        if ($("#progressTaskCount"))
            $("#progressTaskCount").textContent =
                progress;


        if ($("#doneTaskCount"))
            $("#doneTaskCount").textContent =
                done;

    }


    function attachTaskMenu(task) {

        const button =
            task.querySelector(
                ".task-menu"
            );


        if (!button)
            return;


        button.onclick =
            event => {

                event.stopPropagation();

                const action =
                    prompt(
                        "Task action:\n1 = Edit\n2 = Change status\n3 = Delete",
                        "1"
                    );


                if (action === "1") {

                    openTaskEditor(task);

                }


                else if (action === "2") {

                    const status =
                        prompt(
                            "Status:\ntodo\nprogress\ndone",
                            task.dataset.status ||
                            "todo"
                        );


                    if (
                        ![
                            "todo",
                            "progress",
                            "done"
                        ].includes(status)
                    ) {

                        showToast(
                            "Invalid status"
                        );

                        return;

                    }


                    const list =
                        getTaskList(status);


                    if (list)
                        list.appendChild(task);


                    task.dataset.status =
                        status;


                    updateTaskCounts();

                    showToast(
                        "Task status updated"
                    );

                }


                else if (action === "3") {

                    if (
                        confirm(
                            "Delete this task?"
                        )
                    ) {

                        task.remove();

                        updateTaskCounts();

                        showToast(
                            "Task deleted"
                        );

                    }

                }

            };

    }


    $$(".task-card")
        .forEach(
            attachTaskMenu
        );


    updateTaskCounts();


    /* =====================================================
       MILESTONES
    ===================================================== */

    $("#addMilestone")
        ?.addEventListener(
            "click",
            () => {

                const title =
                    prompt(
                        "Milestone name:"
                    );


                if (!title?.trim())
                    return;


                const description =
                    prompt(
                        "Milestone description:"
                    );


                const date =
                    prompt(
                        "Target date:"
                    );


                const progress =
                    prompt(
                        "Progress (0–100):",
                        "0"
                    );


                const value =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            Number(progress) || 0
                        )
                    );


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "milestone-card planned";


                card.innerHTML = `

                    <div class="milestone-top">

                        <span>
                            NEW MILESTONE
                        </span>

                        <strong>
                            ${value}%
                        </strong>

                    </div>

                    <h3></h3>

                    <p></p>

                    <div class="milestone-bar">

                        <span
                            style="width:${value}%"
                        ></span>

                    </div>

                    <div class="milestone-footer">

                        <span>
                            Planned
                        </span>

                        <span></span>

                    </div>

                `;


                card.querySelector("h3")
                    .textContent =
                    title.trim();


                card.querySelector("p")
                    .textContent =
                    description?.trim() ||
                    "No description added.";


                card.querySelector(
                    ".milestone-footer span:last-child"
                ).textContent =
                    date?.trim() ||
                    "No target";


                $("#milestoneGrid")
                    ?.appendChild(card);


                showToast(
                    "Milestone added"
                );

            }
        );


    /* =====================================================
       TIMELINE
    ===================================================== */

    const timelineModal =
        $("#timelineModal");


    const addTimeline =
        $("#addTimeline");


    const saveTimeline =
        $("#saveTimeline");


    const cancelTimeline =
        $("#cancelTimeline");


    const closeTimelineModal =
        $("#closeTimelineModal");


    let editingTimeline = null;


    function resetTimelineForm() {

        $("#timelineDate").value =
            todayISO();

        $("#timelineStatus").value =
            "planned";

        $("#timelineTitle").value =
            "";

        $("#timelineDescription").value =
            "";

        editingTimeline = null;

    }


    function openTimelineEditor(item = null) {

        resetTimelineForm();

        editingTimeline = item;


        if (item) {

            $("#timelineDate").value =
                item.dataset.date ||
                todayISO();


            $("#timelineStatus").value =
                item.dataset.status ||
                "planned";


            $("#timelineTitle").value =
                item.querySelector(
                    "h3"
                )?.textContent.trim() || "";


            $("#timelineDescription").value =
                item.querySelector(
                    "p"
                )?.textContent.trim() || "";

        }


        openModal(
            timelineModal
        );

    }


    addTimeline?.addEventListener(
        "click",
        () =>
            openTimelineEditor()
    );


    saveTimeline?.addEventListener(
        "click",
        () => {

            const date =
                $("#timelineDate")
                    .value;


            const status =
                $("#timelineStatus")
                    .value;


            const title =
                $("#timelineTitle")
                    .value
                    .trim();


            const description =
                $("#timelineDescription")
                    .value
                    .trim();


            if (!date || !title) {

                showToast(
                    "Date and title are required"
                );

                return;

            }


            let item =
                editingTimeline;


            if (!item) {

                item =
                    document.createElement(
                        "article"
                    );

                item.className =
                    "timeline-item";


                item.innerHTML = `

                    <div class="timeline-date"></div>

                    <div class="timeline-point"></div>

                    <div class="timeline-card">

                        <div class="timeline-top">

                            <span
                                class="timeline-status"
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


                $("#projectTimelineList")
                    ?.appendChild(item);

            }


            item.dataset.date =
                date;


            item.dataset.status =
                status;


            item.querySelector(
                ".timeline-date"
            ).textContent =
                formatDate(date);


            item.querySelector(
                ".timeline-status"
            ).className =
                `timeline-status ${status}`;


            item.querySelector(
                ".timeline-status"
            ).textContent =
                status.toUpperCase();


            item.querySelector(
                ".timeline-point"
            ).className =
                `timeline-point ${status}`;


            item.querySelector("h3")
                .textContent =
                title;


            item.querySelector("p")
                .textContent =
                description ||
                "No description added.";


            attachTimelineEditor(item);


            closeModal(
                timelineModal
            );


            showToast(
                editingTimeline
                    ? "Timeline updated"
                    : "Timeline entry added"
            );

        }
    );


    cancelTimeline?.addEventListener(
        "click",
        () =>
            closeModal(timelineModal)
    );


    closeTimelineModal?.addEventListener(
        "click",
        () =>
            closeModal(timelineModal)
    );


    function attachTimelineEditor(item) {

        const button =
            item.querySelector(
                ".timeline-edit"
            );


        if (!button)
            return;


        button.onclick =
            () =>
                openTimelineEditor(item);

    }


    $$(".timeline-item")
        .forEach(
            attachTimelineEditor
        );


    /* =====================================================
       COLLABORATORS
    ===================================================== */

    $("#addCollaborator")
        ?.addEventListener(
            "click",
            () => {

                const name =
                    prompt(
                        "Member name:"
                    );


                if (!name?.trim())
                    return;


                const role =
                    prompt(
                        "Role:"
                    );


                const initials =
                    name
                        .trim()
                        .split(/\s+/)
                        .map(
                            word =>
                                word[0]
                        )
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "collaborator-card";


                card.innerHTML = `

                    <div class="member-avatar">
                        ${initials}
                    </div>

                    <div>

                        <strong></strong>

                        <span></span>

                    </div>

                `;


                card.querySelector(
                    "strong"
                ).textContent =
                    name.trim();


                card.querySelector(
                    "span"
                ).textContent =
                    role?.trim() ||
                    "Collaborator";


                $("#collaboratorGrid")
                    ?.appendChild(card);


                showToast(
                    "Collaborator added"
                );

            }
        );


    /* =====================================================
       TESTING
    ===================================================== */

    $("#addTest")
        ?.addEventListener(
            "click",
            () => {

                const name =
                    prompt(
                        "Test name:"
                    );


                if (!name?.trim())
                    return;


                const description =
                    prompt(
                        "Test description:"
                    );


                const result =
                    prompt(
                        "Result:\npassed\nfailed\npending",
                        "pending"
                    );


                const validResults = [
                    "passed",
                    "failed",
                    "pending"
                ];


                const finalResult =
                    validResults.includes(
                        result
                    )
                        ? result
                        : "pending";


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    `test-card ${finalResult}`;


                const indicator =
                    finalResult === "passed"
                        ? "✓"
                        : finalResult === "failed"
                            ? "!"
                            : "•";


                card.innerHTML = `

                    <div class="test-indicator">
                        ${indicator}
                    </div>

                    <div class="test-info">

                        <strong></strong>

                        <p></p>

                    </div>

                    <span
                        class="test-result ${finalResult}"
                    >
                        ${finalResult.toUpperCase()}
                    </span>

                `;


                card.querySelector(
                    "strong"
                ).textContent =
                    name.trim();


                card.querySelector(
                    "p"
                ).textContent =
                    description?.trim() ||
                    "No description added.";


                $("#testList")
                    ?.appendChild(card);


                updateTestingSummary();


                showToast(
                    "Test added"
                );

            }
        );


    function updateTestingSummary() {

        const tests =
            $$(".test-card");


        let passed = 0;
        let failed = 0;
        let pending = 0;


        tests.forEach(test => {

            if (
                test.classList.contains(
                    "passed"
                )
            )
                passed++;


            else if (
                test.classList.contains(
                    "failed"
                )
            )
                failed++;


            else
                pending++;

        });


        const summaryCards =
            $$(".test-summary-card");


        if (summaryCards.length >= 4) {

            summaryCards[0]
                .querySelector(
                    ".test-summary-number"
                )
                .textContent =
                tests.length;


            summaryCards[1]
                .querySelector(
                    ".test-summary-number"
                )
                .textContent =
                passed;


            summaryCards[2]
                .querySelector(
                    ".test-summary-number"
                )
                .textContent =
                failed;


            summaryCards[3]
                .querySelector(
                    ".test-summary-number"
                )
                .textContent =
                pending;

        }

    }


    /* =====================================================
       VERSION HISTORY
    ===================================================== */

    $("#addVersion")
        ?.addEventListener(
            "click",
            () => {

                const version =
                    prompt(
                        "Version number:",
                        "V3"
                    );


                if (!version?.trim())
                    return;


                const title =
                    prompt(
                        "Version title:"
                    );


                if (!title?.trim())
                    return;


                const description =
                    prompt(
                        "What changed?"
                    );


                const date =
                    prompt(
                        "Date:",
                        todayISO()
                    );


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "version-card current";


                card.innerHTML = `

                    <div class="version-number"></div>

                    <div class="version-info">

                        <div class="version-top">

                            <strong></strong>

                            <span></span>

                        </div>

                        <p></p>

                    </div>

                `;


                card.querySelector(
                    ".version-number"
                ).textContent =
                    version.trim();


                card.querySelector(
                    ".version-top strong"
                ).textContent =
                    title.trim();


                card.querySelector(
                    ".version-top span"
                ).textContent =
                    date?.trim() ||
                    "Today";


                card.querySelector(
                    "p"
                ).textContent =
                    description?.trim() ||
                    "No change description added.";


                $("#versionGrid")
                    ?.prepend(card);


                showToast(
                    "Version added"
                );

            }
        );


    /* =====================================================
       ISSUES
    ===================================================== */

    $("#addIssue")
        ?.addEventListener(
            "click",
            () => {

                const title =
                    prompt(
                        "Issue / blocker:"
                    );


                if (!title?.trim())
                    return;


                const description =
                    prompt(
                        "Describe the issue:"
                    );


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "issue-item";


                item.innerHTML = `

                    <span
                        class="issue-dot"
                    ></span>

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


                $("#issueList")
                    ?.appendChild(item);


                showToast(
                    "Issue added"
                );

            }
        );


    /* =====================================================
       DECISIONS
    ===================================================== */

    $("#addDecision")
        ?.addEventListener(
            "click",
            () => {

                const title =
                    prompt(
                        "Decision:"
                    );


                if (!title?.trim())
                    return;


                const description =
                    prompt(
                        "Why was this decision made?"
                    );


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "decision-item";


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
                    description?.trim() ||
                    "No explanation added.";


                $("#decisionList")
                    ?.appendChild(item);


                showToast(
                    "Decision added"
                );

            }
        );


    /* =====================================================
       FILE UPLOAD
    ===================================================== */

    const fileInput =
        $("#projectFileInput");


    const uploadButton =
        $("#uploadProjectFile");


    const uploadZone =
        $("#projectUploadZone");


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
                addAttachment
            );


            fileInput.value = "";

        }
    );


    function addAttachment(file) {

        const grid =
            $("#projectAttachmentGrid");


        if (!grid)
            return;


        const extension =
            getExtension(
                file.name
            );


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "attachment-card";


        card.innerHTML = `

            <div class="attachment-icon">
                ${extension}
            </div>

            <div class="attachment-info">

                <strong></strong>

                <span></span>

                <small>
                    Uploaded just now
                </small>

            </div>

            <button
                type="button"
            >
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


        grid.prepend(card);


        showToast(
            `${file.name} added`
        );

    }


    function getExtension(filename) {

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
                    [
                        ...event.dataTransfer.files
                    ];


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
        $("#projectLinkModal");


    $("#addProjectLink")
        ?.addEventListener(
            "click",
            () => {

                $("#projectLinkTitle").value =
                    "";

                $("#projectLinkURL").value =
                    "";

                $("#projectLinkDescription").value =
                    "";

                openModal(
                    linkModal
                );

            }
        );


    $("#saveProjectLink")
        ?.addEventListener(
            "click",
            () => {

                const title =
                    $("#projectLinkTitle")
                        .value
                        .trim();


                const url =
                    $("#projectLinkURL")
                        .value
                        .trim();


                const description =
                    $("#projectLinkDescription")
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
                    "attachment-card";


                card.innerHTML = `

                    <div class="attachment-icon">
                        LINK
                    </div>

                    <div class="attachment-info">

                        <strong></strong>

                        <span>
                            External resource
                        </span>

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


                $("#projectAttachmentGrid")
                    ?.prepend(card);


                closeModal(
                    linkModal
                );


                showToast(
                    "Link added"
                );

            }
        );


    $("#cancelProjectLink")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    linkModal
                )
        );


    $("#closeProjectLinkModal")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    linkModal
                )
        );


    /* =====================================================
       FUTURE WORK
    ===================================================== */

    $("#addFutureWork")
        ?.addEventListener(
            "click",
            () => {

                const stage =
                    prompt(
                        "Stage / timing:"
                    );


                if (!stage?.trim())
                    return;


                const title =
                    prompt(
                        "Future work:"
                    );


                if (!title?.trim())
                    return;


                const description =
                    prompt(
                        "What should be achieved?"
                    );


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "future-card";


                card.innerHTML = `

                    <span></span>

                    <h3></h3>

                    <p></p>

                `;


                card.querySelector(
                    "span"
                ).textContent =
                    stage.trim()
                        .toUpperCase();


                card.querySelector(
                    "h3"
                ).textContent =
                    title.trim();


                card.querySelector(
                    "p"
                ).textContent =
                    description?.trim() ||
                    "No description added.";


                $("#futureWorkGrid")
                    ?.appendChild(card);


                showToast(
                    "Future work added"
                );

            }
        );


    /* =====================================================
       OUTCOME
    ===================================================== */

    $("#saveOutcome")
        ?.addEventListener(
            "click",
            () => {

                const outcome =
                    $("#projectOutcome")
                        ?.value
                        .trim();


                if (!outcome) {

                    showToast(
                        "Write the project outcome first"
                    );

                    return;

                }


                showToast(
                    "Project outcome saved"
                );

            }
        );


    /* =====================================================
       MODAL BACKDROP
    ===================================================== */

    [
        taskModal,
        timelineModal,
        linkModal
    ].forEach(modal => {

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


            closeModal(taskModal);

            closeModal(
                timelineModal
            );

            closeModal(
                linkModal
            );

        }
    );


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    updateProgress(62);

});