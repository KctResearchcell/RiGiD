/* =========================================================
   RiGiD DASHBOARD
========================================================= */

const CONFIG = {

    TEAM_NAME: "RiGiD Workspace"

};


const el = (id) =>
    document.getElementById(id);


let currentUser = null;

let currentProfile = null;

let currentTeam = null;

let projects = [];

let tasks = [];



/* =========================================================
   CLOCK
========================================================= */

function startClock() {

    const clock =
        el("liveClock");

    if (!clock) return;


    function update() {

        const now =
            new Date();

        clock.textContent =
            now.toLocaleDateString(
                undefined,
                {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            )
            +
            " — "
            +
            now.toLocaleTimeString();

    }


    update();

    setInterval(
        update,
        1000
    );

}



/* =========================================================
   THEME
========================================================= */

function initTheme() {

    const button =
        el("themeToggle");

    if (!button) return;


    function updateIcon() {

        const dark =
            document.documentElement
                .classList
                .contains("dark");

        button.textContent =
            dark
                ? "☀"
                : "☾";

    }


    button.addEventListener(
        "click",
        () => {

            const dark =
                document.documentElement
                    .classList
                    .toggle("dark");

            localStorage.setItem(
                "logbook-theme",
                dark
                    ? "dark"
                    : "light"
            );

            updateIcon();

        }
    );


    updateIcon();

}



/* =========================================================
   AUTH CHECK
========================================================= */

async function checkAuthentication() {

    try {

        const {
            data,
            error
        } =
            await sb.auth.getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            window.location.href =
                "../login/login.html";

            return false;

        }


        if (!data.session) {

            window.location.href =
                "../login/login.html";

            return false;

        }


        currentUser =
            data.session.user;


        return true;

    }

    catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        window.location.href =
            "../login/login.html";

        return false;

    }

}



/* =========================================================
   LOAD USER PROFILE
========================================================= */

async function loadProfile() {

    if (!currentUser)
        return;


    const {
        data,
        error
    } =
        await sb
            .from("profiles")
            .select(`
                id,
                email,
                name,
                status,
                role,
                team_id,
                teams (
                    id,
                    name
                )
            `)
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Profile loading error:",
            error
        );

        return;

    }


    currentProfile =
        data;


    if (!data)
        return;


    currentTeam =
        data.teams;


    const email =
        data.email ||
        currentUser.email ||
        "";


    const name =
        data.name ||
        currentUser.user_metadata?.full_name ||
        email.split("@")[0] ||
        "User";


    const userName =
        el("userName");

    const userEmail =
        el("userEmail");

    const teamName =
        el("teamName");


    if (userName)
        userName.textContent =
            name;


    if (userEmail)
        userEmail.textContent =
            email;


    if (teamName)
        teamName.textContent =
            currentTeam?.name ||
            "No Team";


    /*
       If the account isn't approved,
       don't allow dashboard access.
    */

    if (
        data.status &&
        data.status !== "approved"
    ) {

        alert(
            `Your account status is "${data.status}".`
        );

        await sb.auth.signOut();

        window.location.href =
            "../login/login.html";

        return;

    }


    /*
       Show admin section if role
       indicates administrator.
    */

    if (
        data.role === "admin" ||
        data.role === "administrator"
    ) {

        el("adminSection")
            ?.classList
            .remove("hidden");

        loadPending();

    }

}



/* =========================================================
   NAVIGATION
========================================================= */

function initNavigation() {

    const personalBtn =
        el("btnPersonalDash");

    const mainBtn =
        el("btnMainWorkspace");

    const mainView =
        el("mainWorkspaceView");

    const personalView =
        el("personalDashboardView");


    personalBtn?.addEventListener(
        "click",
        () => {

            mainView
                ?.classList
                .add("hidden");

            personalView
                ?.classList
                .remove("hidden");

            personalBtn
                ?.classList
                .add("hidden");

            mainBtn
                ?.classList
                .remove("hidden");

            loadPersonalDashboard();

        }
    );


    mainBtn?.addEventListener(
        "click",
        () => {

            personalView
                ?.classList
                .add("hidden");

            mainView
                ?.classList
                .remove("hidden");

            mainBtn
                ?.classList
                .add("hidden");

            personalBtn
                ?.classList
                .remove("hidden");

        }
    );


    el("signOutBtn")
        ?.addEventListener(
            "click",
            signOut
        );

}



/* =========================================================
   SIGN OUT
========================================================= */

async function signOut() {

    try {

        await sb.auth.signOut();

    }

    catch (error) {

        console.error(
            "Sign out error:",
            error
        );

    }

    finally {

        window.location.href =
            "../login/login.html";

    }

}



/* =========================================================
   LOAD PROJECTS
========================================================= */

async function loadProjects() {

    const grid =
        el("projectGrid");

    const empty =
        el("projectEmpty");


    if (!grid)
        return;


    grid.innerHTML = "";


    /*
       This expects a projects table.

       If the table doesn't exist yet,
       the dashboard will simply show
       the empty state.
    */

    const {
        data,
        error
    } =
        await sb
            .from("projects")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.warn(
            "Projects table unavailable:",
            error.message
        );

        projects = [];

        empty
            ?.classList
            .remove("hidden");

        updateStats();

        return;

    }


    projects =
        data || [];


    if (
        projects.length === 0
    ) {

        empty
            ?.classList
            .remove("hidden");

    }

    else {

        empty
            ?.classList
            .add("hidden");

        renderProjects();

    }


    updateStats();

}



/* =========================================================
   RENDER PROJECTS
========================================================= */

function renderProjects() {

    const grid =
        el("projectGrid");

    const template =
        el("projectCardTemplate");


    if (
        !grid ||
        !template
    )
        return;


    grid.innerHTML = "";


    projects.forEach(
        project => {

            const card =
                template
                    .content
                    .cloneNode(true);


            const article =
                card.querySelector(
                    ".project-card"
                );


            const title =
                card.querySelector(
                    ".project-title"
                );

            const description =
                card.querySelector(
                    ".project-description"
                );

            const status =
                card.querySelector(
                    ".project-status"
                );

            const priority =
                card.querySelector(
                    ".project-priority"
                );

            const progress =
                card.querySelector(
                    ".project-progress"
                );

            const fill =
                card.querySelector(
                    ".progress-fill"
                );

            const start =
                card.querySelector(
                    ".project-start"
                );

            const end =
                card.querySelector(
                    ".project-end"
                );


            title.textContent =
                project.name ||
                "Untitled Project";


            description.textContent =
                project.description ||
                "No description provided.";


            status.textContent =
                project.status ||
                "active";


            priority.textContent =
                project.priority ||
                "medium";


            const percent =
                Number(
                    project.progress ||
                    project.progress_percentage ||
                    0
                );


            const safePercent =
                Math.max(
                    0,
                    Math.min(
                        100,
                        percent
                    )
                );


            progress.textContent =
                `${safePercent}%`;


            fill.style.width =
                `${safePercent}%`;


            start.textContent =
                project.start_date
                    ? `Start: ${formatDate(project.start_date)}`
                    : "";


            end.textContent =
                project.expected_completion_date
                    ? `Due: ${formatDate(project.expected_completion_date)}`
                    : (
                        project.end_date
                            ? `Due: ${formatDate(project.end_date)}`
                            : ""
                    );


            /*
               Clicking a project currently
               opens a simple project detail
               placeholder.
            */

            article.addEventListener(
                "click",
                () => {

                    openProject(project);

                }
            );


            grid.appendChild(card);

        }
    );

}



/* =========================================================
   PROJECT DETAIL
========================================================= */

function openProject(project) {

    alert(
        `${project.name}\n\n` +
        `Status: ${project.status || "Active"}\n` +
        `Priority: ${project.priority || "Medium"}\n` +
        `Progress: ${project.progress || 0}%`
    );

}



/* =========================================================
   CREATE PROJECT MODAL
========================================================= */

function initProjectModal() {

    const modal =
        el("projectModal");

    const openBtn =
        el("createProjectBtn");

    const closeBtn =
        el("closeProjectModal");

    const cancelBtn =
        el("cancelProjectBtn");

    const form =
        el("projectForm");


    if (!modal)
        return;


    function open() {

        modal
            .classList
            .remove("hidden");

        el("projectName")
            ?.focus();

    }


    function close() {

        modal
            .classList
            .add("hidden");

        form?.reset();

        el("projectFormMessage")
            ?.classList
            .add("hidden");

    }


    openBtn?.addEventListener(
        "click",
        open
    );


    closeBtn?.addEventListener(
        "click",
        close
    );


    cancelBtn?.addEventListener(
        "click",
        close
    );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                close();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !modal.classList.contains("hidden")
            ) {

                close();

            }

        }
    );


    form?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await createProject();

        }
    );

}



/* =========================================================
   CREATE PROJECT
========================================================= */

async function createProject() {

    const message =
        el("projectFormMessage");

    const button =
        document.querySelector(
            "#projectForm button[type='submit']"
        );


    const name =
        el("projectName")
            ?.value
            .trim();


    const description =
        el("projectDescription")
            ?.value
            .trim();


    const priority =
        el("projectPriority")
            ?.value;


    const status =
        el("projectStatus")
            ?.value;


    const startDate =
        el("projectStartDate")
            ?.value ||
        null;


    const endDate =
        el("projectEndDate")
            ?.value ||
        null;


    if (!name) {

        showFormMessage(
            "Project name is required."
        );

        return;

    }


    if (!currentUser) {

        showFormMessage(
            "You are not logged in."
        );

        return;

    }


    button.disabled = true;

    button.textContent =
        "Creating...";


    try {

        const projectData = {

            name,

            description,

            priority,

            status,

            start_date:
                startDate,

            expected_completion_date:
                endDate,

            progress: 0,

            created_by:
                currentUser.id,

            team_id:
                currentProfile?.team_id ||
                null

        };


        const {
            data,
            error
        } =
            await sb
                .from("projects")
                .insert(
                    projectData
                )
                .select()
                .single();


        if (error) {

            console.error(
                "Create project error:",
                error
            );

            showFormMessage(
                error.message ||
                "Unable to create project."
            );

            return;

        }


        projects.unshift(
            data
        );


        renderProjects();

        updateStats();


        el("projectModal")
            ?.classList
            .add("hidden");


        el("projectForm")
            ?.reset();


    }

    catch (error) {

        console.error(
            error
        );

        showFormMessage(
            "Something went wrong."
        );

    }

    finally {

        button.disabled = false;

        button.textContent =
            "Create Project";

    }

}



/* =========================================================
   FORM MESSAGE
========================================================= */

function showFormMessage(text) {

    const box =
        el("projectFormMessage");

    if (!box)
        return;


    box.textContent =
        text;

    box.classList.remove(
        "hidden"
    );

}



/* =========================================================
   STATS
========================================================= */

function updateStats() {

    const projectCount =
        projects.length;


    const totalProgress =
        projects.reduce(
            (
                total,
                project
            ) => {

                return total +
                    Number(
                        project.progress ||
                        project.progress_percentage ||
                        0
                    );

            },
            0
        );


    const averageProgress =
        projectCount
            ? Math.round(
                totalProgress /
                projectCount
            )
            : 0;


    const projectCountEl =
        el("projectCount");

    const progressEl =
        el("overallProgress");


    if (projectCountEl)
        projectCountEl.textContent =
            projectCount;


    if (progressEl)
        progressEl.textContent =
            `${averageProgress}%`;


    /*
       Tasks/milestones are populated
       separately when those tables
       exist.
    */

    loadTaskStats();

}



/* =========================================================
   TASK STATS
========================================================= */

async function loadTaskStats() {

    let taskCount = 0;

    let milestoneCount = 0;


    try {

        const {
            count
        } =
            await sb
                .from("tasks")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                );


        taskCount =
            count || 0;

    }

    catch (error) {

        console.warn(
            "Tasks table unavailable."
        );

    }


    try {

        const {
            count
        } =
            await sb
                .from("milestones")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                );


        milestoneCount =
            count || 0;

    }

    catch (error) {

        console.warn(
            "Milestones table unavailable."
        );

    }


    if (el("taskCount"))
        el("taskCount").textContent =
            taskCount;


    if (el("milestoneCount"))
        el("milestoneCount").textContent =
            milestoneCount;

}



/* =========================================================
   PERSONAL DASHBOARD
========================================================= */

async function loadPersonalDashboard() {

    let personalTasks = [];


    try {

        const {
            data,
            error
        } =
            await sb
                .from("tasks")
                .select("*")
                .eq(
                    "assigned_to",
                    currentUser.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (!error)
            personalTasks =
                data || [];

    }

    catch (error) {

        console.warn(
            "Personal task loading failed."
        );

    }


    tasks =
        personalTasks;


    renderPersonalTasks();


    if (
        el("personalTaskCount")
    ) {

        el(
            "personalTaskCount"
        ).textContent =
            personalTasks.length;

    }


    const dueSoon =
        personalTasks.filter(
            task => {

                if (!task.due_date)
                    return false;

                const due =
                    new Date(
                        task.due_date
                    );

                const now =
                    new Date();

                const difference =
                    due - now;

                return (
                    difference >= 0 &&
                    difference <=
                    7 *
                    24 *
                    60 *
                    60 *
                    1000
                );

            }
        );


    if (
        el("personalDueCount")
    ) {

        el(
            "personalDueCount"
        ).textContent =
            dueSoon.length;

    }


    const completed =
        personalTasks.filter(
            task =>
                task.status ===
                "completed"
        ).length;


    const progress =
        personalTasks.length
            ? Math.round(
                (
                    completed /
                    personalTasks.length
                ) * 100
            )
            : 0;


    if (
        el("personalProgress")
    ) {

        el(
            "personalProgress"
        ).textContent =
            `${progress}%`;

    }

}



/* =========================================================
   PERSONAL TASK RENDER
========================================================= */

function renderPersonalTasks() {

    const list =
        el("personalTaskList");

    const empty =
        el("personalTaskEmpty");


    if (!list)
        return;


    list.innerHTML = "";


    if (!tasks.length) {

        empty
            ?.classList
            .remove("hidden");

        return;

    }


    empty
        ?.classList
        .add("hidden");


    tasks.forEach(
        task => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "task-item";


            item.innerHTML = `

                <div class="task-item-main">

                    <div class="task-item-title">
                        ${escapeHtml(
                            task.title ||
                            task.name ||
                            "Untitled Task"
                        )}
                    </div>

                    <div class="task-item-project">
                        ${escapeHtml(
                            task.project_name ||
                            "Project"
                        )}
                    </div>

                </div>

                <span class="task-status">
                    ${escapeHtml(
                        task.status ||
                        "pending"
                    )}
                </span>

            `;


            list.appendChild(
                item
            );

        }
    );

}



/* =========================================================
   ADMIN PENDING APPROVALS
========================================================= */

async function loadPending() {

    const list =
        el("pendingList");

    const empty =
        el("pendingEmpty");

    const countEl =
        el("pendingCount");


    if (!list)
        return;


    const {
        data,
        error
    } =
        await sb
            .from("profiles")
            .select(`
                id,
                email,
                created_at,
                team_id,
                teams (
                    name
                )
            `)
            .eq(
                "status",
                "pending"
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    list.innerHTML = "";


    if (
        error ||
        !data ||
        data.length === 0
    ) {

        empty
            ?.classList
            .remove("hidden");

        if (countEl)
            countEl.textContent =
                "0 waiting";

        return;

    }


    empty
        ?.classList
        .add("hidden");


    if (countEl)
        countEl.textContent =
            `${data.length} waiting`;


    data.forEach(
        row => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "pending-item";


            item.innerHTML = `

                <div>

                    <div class="pending-email">
                        ${escapeHtml(
                            row.email
                        )}
                    </div>

                    <div class="pending-team">
                        Team:
                        ${escapeHtml(
                            row.teams?.name ||
                            "Unknown"
                        )}
                    </div>

                </div>


                <div class="pending-actions">

                    <button
                        class="approve-btn"
                        data-id="${row.id}"
                    >
                        Approve
                    </button>

                    <button
                        class="reject-btn"
                        data-id="${row.id}"
                    >
                        Reject
                    </button>

                </div>

            `;


            item
                .querySelector(
                    ".approve-btn"
                )
                ?.addEventListener(
                    "click",
                    () =>
                        updateUserStatus(
                            row.id,
                            "approved"
                        )
                );


            item
                .querySelector(
                    ".reject-btn"
                )
                ?.addEventListener(
                    "click",
                    () =>
                        updateUserStatus(
                            row.id,
                            "rejected"
                        )
                );


            list.appendChild(
                item
            );

        }
    );

}



/* =========================================================
   UPDATE USER STATUS
========================================================= */

async function updateUserStatus(
    userId,
    status
) {

    const {
        error
    } =
        await sb
            .from("profiles")
            .update({
                status
            })
            .eq(
                "id",
                userId
            );


    if (error) {

        console.error(
            "Status update error:",
            error
        );

        alert(
            error.message
        );

        return;

    }


    loadPending();

}



/* =========================================================
   ACTIVITY
========================================================= */

async function loadActivity() {

    const list =
        el("activityList");

    const empty =
        el("activityEmpty");


    if (!list)
        return;


    /*
       If an activity table exists,
       load it.
    */

    try {

        const {
            data,
            error
        } =
            await sb
                .from("activities")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(10);


        if (
            error ||
            !data ||
            !data.length
        ) {

            empty
                ?.classList
                .remove("hidden");

            return;

        }


        empty
            ?.classList
            .add("hidden");


        list.innerHTML = "";


        data.forEach(
            activity => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "activity-item";


                item.innerHTML = `

                    <strong>
                        ${escapeHtml(
                            activity.title ||
                            "Activity"
                        )}
                    </strong>

                    <p>
                        ${escapeHtml(
                            activity.description ||
                            ""
                        )}
                    </p>

                `;


                list.appendChild(
                    item
                );

            }
        );

    }

    catch (error) {

        empty
            ?.classList
            .remove("hidden");

    }

}



/* =========================================================
   DATE
========================================================= */

function formatDate(
    value
) {

    if (!value)
        return "";


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    )
        return value;


    return date.toLocaleDateString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}



/* =========================================================
   HTML ESCAPE
========================================================= */

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
   INITIALIZATION
========================================================= */

async function initDashboard() {

    startClock();

    initTheme();

    initNavigation();

    initProjectModal();


    const authenticated =
        await checkAuthentication();


    if (!authenticated)
        return;


    await loadProfile();

    await loadProjects();

    await loadActivity();

}



/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initDashboard
);