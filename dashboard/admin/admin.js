/* =========================================================
   RiGiD ADMINISTRATOR WORKSPACE
   MANY-TO-MANY ARCHITECTURE

   Forum
      ├── Members
      ├── Teams
      │      └── Members
      └── Domains
             └── Members

   User
      ├── Multiple Forums
      ├── Multiple Teams
      └── Multiple Domains

   Workspace
      ├── Study
      ├── Paper
      ├── Simulation
      ├── Project
      ├── Design
      └── Prototype

   Tasks
      ├── Ongoing
      └── Completed
========================================================= */


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let currentProfile = null;

let forums = [];
let teams = [];
let domains = [];
let profiles = [];
let tasks = [];
let workItems = [];
let pendingRequests = [];
let supportReports = [];

let selectedForum = "all";

let activePanel = null;

const TASK_CATEGORIES = [
    "study",
    "paper",
    "simulation",
    "project",
    "design",
    "prototype"
];

const TASK_STATUSES = [
    "ongoing",
    "completed"
];


/* =========================================================
   ELEMENT HELPER
========================================================= */

function el(id) {
    return document.getElementById(id);
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {

    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

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
   FORMAT CATEGORY
========================================================= */

function formatCategory(value) {

    if (!value) {
        return "";
    }

    return String(value)
        .charAt(0)
        .toUpperCase() +
        String(value)
            .slice(1);

}


/* =========================================================
   CLOCK
========================================================= */

function startClock() {

    const clock = el("liveClock");

    if (!clock) {
        return;
    }

    function updateClock() {

        const now = new Date();

        const date =
            now.toLocaleDateString(
                undefined,
                {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

        const time =
            now.toLocaleTimeString();

        clock.textContent =
            `${date} / ${time}`;

    }

    updateClock();

    setInterval(
        updateClock,
        1000
    );

}


/* =========================================================
   SUPABASE CHECK
========================================================= */

function checkSupabaseClient() {

    if (
        typeof sb === "undefined" ||
        !sb
    ) {

        console.error(
            "Supabase client 'sb' is unavailable."
        );

        alert(
            "Supabase is not connected."
        );

        return false;

    }

    return true;

}


/* =========================================================
   REDIRECT LOGIN
========================================================= */

function redirectToLogin() {

    window.location.replace(
        "../../login/login.html"
    );

}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    try {

        const {
            data,
            error
        } =
            await sb.auth.getSession();

        if (error) {
            throw error;
        }

        if (!data.session) {

            redirectToLogin();

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

        redirectToLogin();

        return false;

    }

}


/* =========================================================
   LOAD ADMIN PROFILE
========================================================= */

async function loadAdminProfile() {

    try {

        const {
            data,
            error
        } =
            await sb
                .from("profiles")
                .select(`
                    id,
                    email,
                    full_name,
                    role,
                    status
                `)
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {

            alert(
                "Administrator profile not found."
            );

            await sb.auth.signOut();

            redirectToLogin();

            return false;

        }

        currentProfile =
            data;


        /* -----------------------------------------------------
           ADMIN SECURITY
        ----------------------------------------------------- */

        if (
            currentProfile.role !==
            "admin"
        ) {

            alert(
                "Access denied. This account is not an administrator."
            );

            await sb.auth.signOut();

            redirectToLogin();

            return false;

        }


        if (
            currentProfile.status !==
            "approved"
        ) {

            alert(
                "Your administrator account is not approved."
            );

            await sb.auth.signOut();

            redirectToLogin();

            return false;

        }


        const name =
            currentProfile.full_name ||
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            "Administrator";


        if (el("adminName")) {

            el("adminName").textContent =
                name;

        }


        if (el("adminEmail")) {

            el("adminEmail").textContent =
                currentProfile.email ||
                currentUser.email ||
                "";

        }


        return true;

    }

    catch (error) {

        console.error(
            "Admin profile error:",
            error
        );

        alert(
            error.message ||
            "Unable to load administrator profile."
        );

        return false;

    }

}


/* =========================================================
   LOAD FORUMS
========================================================= */

async function loadForums() {

    const {
        data,
        error
    } =
        await sb
            .from("forums")
            .select(`
                id,
                name,
                description,
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            "Forum loading error:",
            error
        );

        throw error;

    }

    forums =
        data || [];

}


/* =========================================================
   LOAD TEAMS
========================================================= */

async function loadTeams() {

    const {
        data,
        error
    } =
        await sb
            .from("teams")
            .select(`
                id,
                name,
                description,
                forum_id,
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            "Team loading error:",
            error
        );

        throw error;

    }

    teams =
        data || [];

}


/* =========================================================
   LOAD DOMAINS
========================================================= */

async function loadDomains() {

    const {
        data,
        error
    } =
        await sb
            .from("domains")
            .select(`
                id,
                name,
                description,
                forum_id,
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            "Domain loading error:",
            error
        );

        throw error;

    }

    domains =
        data || [];

}


/* =========================================================
   LOAD PROFILES
========================================================= */

async function loadProfiles() {

    const {
        data,
        error
    } =
        await sb
            .from("profiles")
            .select(`
                id,
                email,
                full_name,
                role,
                status
            `)
            .order(
                "full_name",
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            "Profile loading error:",
            error
        );

        throw error;

    }

    profiles =
        data || [];

}


/* =========================================================
   LOAD TASKS
========================================================= */

async function loadTasks() {

    const {
        data,
        error
    } =
        await sb
            .from("tasks")
            .select(`
                id,
                title,
                description,
                category,
                status,
                forum_id,
                team_id,
                domain_id,
                created_by,
                created_at,
                updated_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            "Task loading error:",
            error
        );

        /*
         * Don't kill the entire admin page if
         * task RLS is not configured yet.
         */

        console.warn(
            "Tasks could not be loaded. Configure tasks RLS."
        );

        tasks = [];

        return;

    }

    tasks =
        data || [];

}

async function loadWorkItems() {
    const { data, error } = await sb
        .from("personal_work")
        .select(`
            id,
            profile_id,
            forum_id,
            team_id,
            domain_id,
            title,
            description,
            category,
            status,
            start_date,
            end_date,
            created_at,
            updated_at
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Work loading error:", error);
        throw error;
    }

    workItems = data || [];


}

async function loadSupportReports() {

    const { data, error } = await sb
        .from("support_reports")
        .select(`
            id,
            profile_id,
            message,
            status,
            created_at
        `)
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error("Support reports loading error:", error);
        throw error;
    }

    supportReports = data || [];
}

function renderSupportReports() {

    const container =
        document.getElementById("supportReports");

    const badge =
        document.getElementById("reportsBadge");

    if (!container) {
        console.warn("supportReports container not found.");
        return;
    }

    if (badge) {
        badge.textContent = supportReports.length;
    }

    if (!supportReports.length) {

        container.innerHTML = `
            <div class="support-reports-empty">
                No reports or suggestions have been submitted.
            </div>
        `;

        return;
    }


    container.innerHTML = supportReports.map(report => {

        const profile =
            profiles.find(
                profile =>
                    String(profile.id) ===
                    String(report.profile_id)
            );


        const username =
            profile?.full_name ||
            "Unknown member";


        const email =
            profile?.email ||
            "No email available";


        const created =
            new Date(report.created_at);


        const date =
            created.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );


        const time =
            created.toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );


        const status =
            String(
                report.status ||
                "noted"
            )
                .toLowerCase();


        return `

            <div
                class="support-report-row"
                data-report-id="${escapeHTML(report.id)}"
            >

                <!-- MEMBER -->

                <div class="support-report-member">

                    <div class="support-report-name">
                        ${escapeHTML(username)}
                    </div>

                    <div class="support-report-email">
                        ${escapeHTML(email)}
                    </div>

                </div>


                <!-- REPORT -->

                <div class="support-report-message">

                    ${escapeHTML(
            report.message
        )}

                </div>


                <!-- DATE / TIME -->

                <div class="support-report-date">

                    <div>
                        ${escapeHTML(date)}
                    </div>

                    <div>
                        ${escapeHTML(time)}
                    </div>

                </div>


                <!-- STATUS -->

                <div class="support-report-status">

                    <label>
                        <input
                            type="radio"
                            name="report-status-${escapeHTML(report.id)}"
                            value="noted"
                            ${status === "noted" ? "checked" : ""}
                            onchange="updateSupportReportStatus('${escapeHTML(report.id)}', 'noted')"
                        >
                        <span>Noted</span>
                    </label>


                    <label>
                        <input
                            type="radio"
                            name="report-status-${escapeHTML(report.id)}"
                            value="solved"
                            ${status === "solved" ? "checked" : ""}
                            onchange="updateSupportReportStatus('${escapeHTML(report.id)}', 'solved')"
                        >
                        <span>Solved</span>
                    </label>


                    <label>
                        <input
                            type="radio"
                            name="report-status-${escapeHTML(report.id)}"
                            value="negligible"
                            ${status === "negligible" ? "checked" : ""}
                            onchange="updateSupportReportStatus('${escapeHTML(report.id)}', 'negligible')"
                        >
                        <span>Negligible</span>
                    </label>

                </div>

            </div>

        `;

    }).join("");
}

async function updateSupportReportStatus(reportId, newStatus) {

    try {

        const { error } = await sb
            .from("support_reports")
            .update({
                status: newStatus
            })
            .eq("id", reportId);

        if (error) {
            console.error(
                "Support report status update error:",
                error
            );

            alert("Failed to update report status.");

            // Reload the current data so the UI
            // returns to the actual database state.
            await loadSupportReports();
            renderSupportReports();

            return;
        }

        // Update local data immediately
        const report = supportReports.find(
            item =>
                String(item.id) ===
                String(reportId)
        );

        if (report) {
            report.status = newStatus;
        }

    } catch (error) {

        console.error(
            "Unexpected support report status error:",
            error
        );

        alert("Something went wrong while updating the report.");

        await loadSupportReports();
        renderSupportReports();
    }
}
/* =========================================================
   LOAD ALL DATA
========================================================= */

async function loadAllData() {

    await Promise.all([
        loadForums(),
        loadTeams(),
        loadDomains(),
        loadProfiles(),
        loadTasks(),
        loadWorkItems(),
        loadSupportReports()
    ]);

    renderSupportReports();
}

function populateForumFilter() {

    const filter = el("forumFilter");

    if (!filter) {
        return;
    }

    const currentValue =
        filter.value || "all";

    filter.innerHTML = `
        <option value="all">
            All Forums
        </option>

        ${forums.map(forum => `
            <option value="${forum.id}">
                ${escapeHTML(forum.name)}
            </option>
        `).join("")}
    `;

    const stillExists =
        currentValue === "all" ||
        forums.some(
            forum =>
                String(forum.id) ===
                String(currentValue)
        );

    filter.value =
        stillExists
            ? currentValue
            : "all";

}

/* =========================================================
   PEN ICON
========================================================= */

function editIconHTML(
    type,
    id
) {

    return `
        <button
            type="button"
            class="rigid-edit-icon ${type === "team" || type === "domain"
            ? "rigid-entity-edit-icon"
            : ""}"
            title="Edit ${escapeHTML(type)}"
            data-edit-${type}="${escapeHTML(id)}"
        >
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    d="M12 20h9"
                ></path>

                <path
                    d="M16.5 3.5
                       a2.121 2.121 0 0 1 3 3
                       L7 19
                       l-4 1
                       l1-4
                       Z"
                ></path>
            </svg>
        </button>
    `;
}

/* =========================================================
   GET FORUM
========================================================= */

function getForum(
    forumId
) {

    return forums.find(
        forum =>
            String(forum.id) ===
            String(forumId)
    );

}


/* =========================================================
   GET TEAM
========================================================= */

function getTeam(
    teamId
) {

    return teams.find(
        team =>
            String(team.id) ===
            String(teamId)
    );

}


/* =========================================================
   GET DOMAIN
========================================================= */

function getDomain(
    domainId
) {

    return domains.find(
        domain =>
            String(domain.id) ===
            String(domainId)
    );

}


/* =========================================================
   GET FORUM TEAMS
========================================================= */

function getForumTeams(
    forumId
) {

    return teams.filter(
        team =>
            String(team.forum_id) ===
            String(forumId)
    );

}


/* =========================================================
   GET FORUM DOMAINS
========================================================= */

function getForumDomains(
    forumId
) {

    return domains.filter(
        domain =>
            String(domain.forum_id) ===
            String(forumId)
    );

}


/* =========================================================
   DYNAMIC STYLE
========================================================= */

function injectAdminDynamicStyles() {

    if (
        document.getElementById(
            "rigidAdminDynamicStyles"
        )
    ) {

        return;

    }

    const style =
        document.createElement("style");

    style.id =
        "rigidAdminDynamicStyles";

    style.textContent = `

        .rigid-clickable {
            cursor: pointer;
        }

        .rigid-member-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 10px;
            background: rgba(255,255,255,.03);
            color: inherit;
            cursor: pointer;
            transition: .2s ease;
        }

        .rigid-member-button:hover {
            border-color: rgba(155,92,255,.8);
            color: #b887ff;
            background: rgba(155,92,255,.08);
        }

        .rigid-admin-actions {
            display: flex;
            gap: 7px;
            flex-wrap: wrap;
            margin-top: 12px;
        }

        .rigid-mini-button {
            border: 1px solid rgba(255,255,255,.10);
            background: rgba(255,255,255,.025);
            color: inherit;
            padding: 7px 10px;
            border-radius: 8px;
            cursor: pointer;
            font: inherit;
        }

        .rigid-mini-button:hover {
            border-color: rgba(155,92,255,.8);
            color: #b887ff;
        }

        .rigid-delete-button:hover {
            border-color: rgba(255,80,100,.8);
            color: #ff7185;
        }

        .rigid-forum-description {
            margin-top: 8px;
            opacity: .65;
            line-height: 1.5;
        }

        .rigid-detail-card {
            padding: 18px;
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 14px;
            background: rgba(255,255,255,.025);
            margin-bottom: 12px;
        }

        .rigid-detail-card h4 {
            margin: 0 0 7px;
        }

        .rigid-detail-card p {
            margin: 0;
            opacity: .7;
            line-height: 1.5;
        }

        .rigid-modal {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0,0,0,.78);
            backdrop-filter: blur(8px);
        }

        .rigid-modal.hidden {
            display: none;
        }

        .rigid-modal-box {
            width: min(760px, 100%);
            max-height: 88vh;
            overflow-y: auto;
            background: #090b10;
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 18px;
            box-shadow: 0 30px 80px rgba(0,0,0,.55);
            padding: 24px;
        }

        .rigid-modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 20px;
        }

        .rigid-modal-header h3 {
            margin: 4px 0 0;
        }

        .rigid-modal-eyebrow {
            font-size: 10px;
            letter-spacing: .18em;
            opacity: .5;
        }

        .rigid-close {
            width: 34px;
            height: 34px;
            border-radius: 9px;
            border: 1px solid rgba(255,255,255,.10);
            background: transparent;
            color: inherit;
            cursor: pointer;
            font-size: 20px;
        }

        .rigid-form-grid {
            display: grid;
            gap: 14px;
        }

        .rigid-form-group {
            display: grid;
            gap: 7px;
        }

        .rigid-form-group label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .12em;
            opacity: .6;
        }

        .rigid-form-group input,
        .rigid-form-group textarea,
        .rigid-form-group select {
            width: 100%;
            box-sizing: border-box;
            padding: 11px 12px;
            border-radius: 9px;
            border: 1px solid rgba(255,255,255,.10);
            background: rgba(255,255,255,.035);
            color: inherit;
            outline: none;
        }

        .rigid-form-group textarea {
            min-height: 100px;
            resize: vertical;
        }

        .rigid-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 9px;
            margin-top: 20px;
        }

        .rigid-primary {
            border: 1px solid rgba(155,92,255,.65);
            background: rgba(155,92,255,.12);
            color: #c69cff;
            padding: 10px 15px;
            border-radius: 9px;
            cursor: pointer;
        }

        .rigid-secondary {
            border: 1px solid rgba(255,255,255,.10);
            background: transparent;
            color: inherit;
            padding: 10px 15px;
            border-radius: 9px;
            cursor: pointer;
        }

        .rigid-member-list {
            display: grid;
            gap: 8px;
            margin-top: 12px;
        }

        .rigid-member-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 11px 12px;
            border: 1px solid rgba(255,255,255,.07);
            border-radius: 10px;
            background: rgba(255,255,255,.02);
        }

        .rigid-member-main {
            min-width: 0;
        }

        .rigid-member-name {
            font-weight: 600;
        }

        .rigid-member-email {
            font-size: 12px;
            opacity: .55;
            overflow-wrap: anywhere;
        }

        .rigid-empty {
            padding: 25px 12px;
            text-align: center;
            opacity: .45;
        }

        .rigid-tabs {
            display: flex;
            gap: 6px;
            border-bottom: 1px solid rgba(255,255,255,.08);
            margin-bottom: 18px;
            overflow-x: auto;
        }

        .rigid-tab {
            border: 0;
            border-bottom: 2px solid transparent;
            padding: 10px 12px;
            background: transparent;
            color: inherit;
            opacity: .55;
            cursor: pointer;
            white-space: nowrap;
        }

        .rigid-tab.active {
            opacity: 1;
            border-bottom-color: #a66cff;
            color: #c59aff;
        }

.rigid-task-row {
    display: flex;
    align-items: center;
    gap: 14px;

    width: 100%;
    box-sizing: border-box;

    padding: 8px 12px;

    border: 1px solid rgba(255,255,255,.07);
    border-radius: 10px;

    margin-bottom: 6px;

    background: rgba(255,255,255,.02);

    cursor: pointer;

    min-height: 0;
}

.rigid-task-row:hover {
    border-color: rgba(155,92,255,.45);
    background: rgba(255,255,255,.035);
}

.rigid-task-row strong {
    font-size: 13px;
    line-height: 1.2;
    white-space: nowrap;
}

.rigid-task-title {
    font-size: 13px;
    line-height: 1.2;
    opacity: .75;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 80px;
}

.rigid-task-meta {
    display: flex;
    align-items: center;
    gap: 7px;

    margin: 0;

    font-size: 10px;
    line-height: 1.2;

    opacity: .55;

    white-space: nowrap;
}

.rigid-badge {
    display: inline-flex;
    align-items: center;

    padding: 2px 6px;

    border-radius: 999px;

    border: 1px solid rgba(255,255,255,.08);

    font-size: 9px;
    line-height: 1.2;

    white-space: nowrap;
}

        .rigid-number-click {
            cursor: pointer;
            user-select: none;
        }

        .rigid-number-click:hover {
            color: #bd8dff;
        }

        .rigid-card-actions {
            display: flex;
            gap: 6px;
            margin-top: 12px;
        }

        .rigid-forum-members {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .rigid-count {
            font-size: 11px;
            opacity: .55;
        }

        .rigid-member-picker {
            max-height: 300px;
            overflow-y: auto;
            display: grid;
            gap: 6px;
        }

        .rigid-picker-item {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 9px;
            border: 1px solid rgba(255,255,255,.07);
            border-radius: 8px;
        }

        .rigid-picker-item input {
            width: auto;
        }

        .rigid-danger {
            color: #ff7888;
        }

        @media(max-width:650px) {

    .rigid-task-row {
        flex-wrap: wrap;
        gap: 6px 10px;
    }

    .rigid-task-meta {
        width: 100%;
        flex-wrap: wrap;
    }

    .rigid-task-row .rigid-count {
        margin-left: auto !important;
    }

    .rigid-modal-box {
        padding: 18px;
    }

}

    `;

    document.head.appendChild(style);

}


/* =========================================================
   GENERIC MODAL
========================================================= */

function createModal(
    id,
    eyebrow,
    title
) {

    closeModal(id);

    const modal =
        document.createElement("div");

    modal.id = id;

    modal.className =
        "rigid-modal";

    modal.innerHTML = `

        <div class="rigid-modal-box">

            <div class="rigid-modal-header">

                <div>

                    <div class="rigid-modal-eyebrow">
                        ${escapeHTML(eyebrow)}
                    </div>

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                </div>

                <button
                    type="button"
                    class="rigid-close"
                    data-close-modal="${id}"
                >
                    ×
                </button>

            </div>

            <div class="rigid-modal-content"></div>

        </div>

    `;

    document.body.appendChild(modal);

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal ||
                event.target.closest(
                    `[data-close-modal="${id}"]`
                )
            ) {

                closeModal(id);

            }

        }
    );

    return modal;
}


function closeModal(
    id
) {

    const modal =
        document.getElementById(id);

    if (modal) {
        modal.remove();
    }

}


/* =========================================================
   FORUM MEMBER COUNT
========================================================= */

async function getForumMemberCount(
    forumId
) {

    const {
        count,
        error
    } =
        await sb
            .from("forum_members")
            .select(
                "profile_id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "forum_id",
                forumId
            );

    if (error) {

        console.error(
            "Forum member count:",
            error
        );

        return 0;

    }

    return count || 0;

}


/* =========================================================
   TEAM MEMBER COUNT
========================================================= */

async function getTeamMemberCount(
    teamId
) {

    const {
        count,
        error
    } =
        await sb
            .from("team_members")
            .select(
                "profile_id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "team_id",
                teamId
            );

    if (error) {

        console.error(
            "Team member count:",
            error
        );

        return 0;

    }

    return count || 0;

}


/* =========================================================
   DOMAIN MEMBER COUNT
========================================================= */

async function getDomainMemberCount(
    domainId
) {

    const {
        count,
        error
    } =
        await sb
            .from("domain_members")
            .select(
                "profile_id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "domain_id",
                domainId
            );

    if (error) {

        console.error(
            "Domain member count:",
            error
        );

        return 0;

    }

    return count || 0;

}


/* =========================================================
   LOAD MEMBER IDS
========================================================= */

async function getMembership(
    type,
    id
) {

    let table;
    let column;

    if (type === "forum") {

        table =
            "forum_members";

        column =
            "forum_id";

    }

    else if (type === "team") {

        table =
            "team_members";

        column =
            "team_id";

    }

    else if (type === "domain") {

        table =
            "domain_members";

        column =
            "domain_id";

    }

    else {
        return [];
    }


    const {
        data,
        error
    } =
        await sb
            .from(table)
            .select("profile_id")
            .eq(
                column,
                id
            );

    if (error) {

        console.error(
            `${type} membership:`,
            error
        );

        return [];

    }

    return (
        data || []
    ).map(
        row =>
            row.profile_id
    );

}


/* =========================================================
   LOAD MEMBERS
========================================================= */

async function getMembers(
    type,
    id
) {

    const ids =
        await getMembership(
            type,
            id
        );

    return profiles.filter(
        profile =>
            ids.includes(
                profile.id
            )
    );

}


/* =========================================================
   RENDER FORUMS
========================================================= */

async function renderForums() {

    const container =
        el("forumsContainer");

    if (!container) {
        return;
    }

    container.innerHTML =
        "";


    for (
        const forum of forums
    ) {

        if (
            selectedForum !== "all" &&
            String(forum.id) !==
            String(selectedForum)
        ) {

            continue;

        }


        const forumTeams =
            getForumTeams(
                forum.id
            );

        const forumDomains =
            getForumDomains(
                forum.id
            );

        const memberCount =
            await getForumMemberCount(
                forum.id
            );


        const section =
            document.createElement(
                "section"
            );

        section.className =
            "forum-section";

        section.dataset.forumId =
            forum.id;


        section.innerHTML = `

            <div class="forum-header">

                <div class="forum-title-block">

                    <div class="forum-eyebrow">
                        FORUM
                    </div>

                    <h2>
                        ${escapeHTML(
            forum.name
        )}
                    </h2>

                    ${forum.description
                ? `
                                <p class="rigid-forum-description">
                                    ${escapeHTML(
                    forum.description
                )}
                                </p>
                              `
                : ""
            }

                </div>


                <div class="rigid-forum-members">

    <span class="rigid-count">
        ${memberCount} members
    </span>

    <button
        type="button"
        class="rigid-member-button"
        title="View forum members"
        data-forum-members="${forum.id}"
    >
        👥
    </button>

    ${editIconHTML(
                "forum",
                forum.id
            )}

</div>

            </div>


            <div class="forum-content">

                <div class="forum-column">

                    <div class="column-header">

                        <div>

                            <span class="column-label">
                                TEAMS
                            </span>

                            <span class="column-count">
                                ${forumTeams.length}
                            </span>

                        </div>

                        <button
                            type="button"
                            class="add-btn"
                            data-add-team="${forum.id}"
                        >
                            <strong>+</strong>
                            <span>Add Team</span>
                        </button>

                    </div>


                    <div class="card-grid">

                        ${forumTeams.length
                ? forumTeams.map(
                    team =>
                        renderTeamCard(
                            team
                        )
                ).join("")
                : `
                                <div class="rigid-empty">
                                    No teams in this forum.
                                </div>
                              `
            }

                    </div>

                </div>


                <div class="forum-column">

                    <div class="column-header">

                        <div>

                            <span class="column-label">
                                DOMAINS
                            </span>

                            <span class="column-count">
                                ${forumDomains.length}
                            </span>

                        </div>

                        <button
                            type="button"
                            class="add-btn"
                            data-add-domain="${forum.id}"
                        >
                            <strong>+</strong>
                            <span>Add Domain</span>
                        </button>

                    </div>


                    <div class="card-grid">

                        ${forumDomains.length
                ? forumDomains.map(
                    domain =>
                        renderDomainCard(
                            domain
                        )
                ).join("")
                : `
                                <div class="rigid-empty">
                                    No domains in this forum.
                                </div>
                              `
            }

                    </div>

                </div>

            </div>

        `;


        container.appendChild(
            section
        );

    }


    attachForumEvents();

}


/* =========================================================
   TEAM CARD
========================================================= */

function renderTeamCard(
    team
) {

    const forum =
        getForum(
            team.forum_id
        );

    return `

        <article
            class="team-card rigid-clickable"
            data-team-id="${team.id}"
        >

            <div>

                <div class="team-card-top">

    <span class="team-index">
        TEAM
    </span>

    ${editIconHTML(
        "team",
        team.id
    )}

</div>

                <h3>
                    ${escapeHTML(
        team.name
    )}
                </h3>

                <p>
                    ${escapeHTML(
        team.description ||
        "No description added."
    )}
                </p>

            </div>

            <div class="team-footer">

                <span>
                    ${escapeHTML(
        forum?.name || ""
    )}
                </span>

                <span>
                    ${formatDate(
        team.created_at
    )}
                </span>

            </div>

        </article>

    `;

}


/* =========================================================
   DOMAIN CARD
========================================================= */

function renderDomainCard(
    domain
) {

    const forum =
        getForum(
            domain.forum_id
        );

    return `

        <article
            class="team-card rigid-clickable"
            data-domain-id="${domain.id}"
        >

            <div>

               <div class="team-card-top">

    <span class="team-index">
        DOMAIN
    </span>

    ${editIconHTML(
        "domain",
        domain.id
    )}

</div>

                <h3>
                    ${escapeHTML(
        domain.name
    )}
                </h3>

                <p>
                    ${escapeHTML(
        domain.description ||
        "No description added."
    )}
                </p>

            </div>

            <div class="team-footer">

                <span>
                    ${escapeHTML(
        forum?.name || ""
    )}
                </span>

                <span>
                    ${formatDate(
        domain.created_at
    )}
                </span>

            </div>

        </article>

    `;

}


/* =========================================================
   FORUM EVENTS
========================================================= */

function attachForumEvents() {

    document
        .querySelectorAll(
            "[data-member-profile-id]"
        )
        .forEach(
            row => {

                row.addEventListener(
                    "click",
                    event => {

                        /*
                         * Do not navigate when the
                         * admin clicks Remove.
                         */
                        if (
                            event.target.closest(
                                "[data-remove-member]"
                            )
                        ) {
                            return;
                        }


                        const profileId =
                            row.dataset
                                .memberProfileId;


                        if (!profileId) {
                            return;
                        }


                        window.location.href =
                            `../personal/personal.html?profile=${encodeURIComponent(
                                profileId
                            )}`;

                    }
                );

            }
        );

    document
        .querySelectorAll(
            "[data-forum-members]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        openMembersPanel(
                            "forum",
                            button.dataset.forumMembers
                        );

                    }
                );

            }
        );
    /* =====================================================
FORUM EDIT ICON
===================================================== */

    document
        .querySelectorAll(
            "[data-edit-forum]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        const forum =
                            getForum(
                                button.dataset.editForum
                            );

                        if (forum) {

                            openForumForm(
                                forum
                            );

                        }

                    }
                );

            }
        );


    /* =====================================================
       TEAM EDIT ICON
    ===================================================== */

    document
        .querySelectorAll(
            "[data-edit-team]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        const team =
                            getTeam(
                                button.dataset.editTeam
                            );

                        if (team) {

                            openTeamForm(
                                team
                            );

                        }

                    }
                );

            }
        );


    /* =====================================================
       DOMAIN EDIT ICON
    ===================================================== */

    document
        .querySelectorAll(
            "[data-edit-domain]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        const domain =
                            getDomain(
                                button.dataset.editDomain
                            );

                        if (domain) {

                            openDomainForm(
                                domain
                            );

                        }

                    }
                );

            }
        );

    document
        .querySelectorAll(
            "[data-add-team]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openTeamForm(
                            null,
                            button.dataset.addTeam
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-add-domain]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openDomainForm(
                            null,
                            button.dataset.addDomain
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-team-id]"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target.closest(
                                "[data-edit-team]"
                            )
                        ) {
                            return;
                        }

                        openEntityDetails(
                            "team",
                            card.dataset.teamId
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-domain-id]"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target.closest(
                                "[data-edit-domain]"
                            )
                        ) {
                            return;
                        }

                        openEntityDetails(
                            "domain",
                            card.dataset.domainId
                        );

                    }
                );

            }
        );

}



/* =========================================================
   FORUM FORM
========================================================= */

function openForumForm(
    forum = null
) {

    const editing =
        Boolean(forum);


    const modal =
        createModal(
            "rigidForumFormModal",
            editing
                ? "EDIT FORUM"
                : "NEW FORUM",
            editing
                ? "Edit Forum"
                : "Create Forum"
        );


    const content =
        modal.querySelector(
            ".rigid-modal-content"
        );


    content.innerHTML = `

        <form id="rigidForumForm">

            <div class="rigid-form-grid">

                <div class="rigid-form-group">

                    <label>
                        Forum Name
                    </label>

                    <input
                        id="rigidForumName"
                        type="text"
                        value="${escapeHTML(
        forum?.name || ""
    )}"
                        required
                    >

                </div>


                <div class="rigid-form-group">

                    <label>
                        Description
                    </label>

                    <textarea
                        id="rigidForumDescription"
                        placeholder="Describe this forum..."
                    >${escapeHTML(
        forum?.description || ""
    )}</textarea>

                </div>

            </div>


            <div class="rigid-modal-actions">

    <button
        type="button"
        class="rigid-secondary"
        data-close-modal="rigidForumFormModal"
    >
        Cancel
    </button>

    <button
        type="submit"
        class="rigid-primary"
    >
        ${editing
            ? "Save Changes"
            : "Create Forum"}
    </button>

</div>


${editing
            ? `
        <div class="rigid-danger-zone">

            <div class="rigid-danger-zone-title">
                FORUM MANAGEMENT
            </div>

            <div class="rigid-danger-zone-text">
                Manage the teams and domains belonging to this forum.
            </div>


            <!-- TEAMS -->

            <div class="column-label">
                TEAMS
            </div>

            <div class="rigid-management-list">

                ${getForumTeams(forum.id).length
                ? getForumTeams(forum.id)
                    .map(
                        team => `
                                    <div
                                        class="rigid-management-row"
                                    >

                                        <div>
                                            <div class="rigid-management-name">
                                                ${escapeHTML(
                            team.name
                        )}
                                            </div>

                                            <div class="rigid-management-type">
                                                Team
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            class="rigid-mini-button rigid-delete-button"
                                            data-forum-delete-team="${escapeHTML(
                            team.id
                        )}"
                                        >
                                            Delete
                                        </button>

                                    </div>
                                `
                    )
                    .join("")
                : `
                            <div class="rigid-empty">
                                No teams in this forum.
                            </div>
                        `
            }

            </div>


            <!-- DOMAINS -->

            <div
                class="column-label"
                style="margin-top:18px;"
            >
                DOMAINS
            </div>

            <div class="rigid-management-list">

                ${getForumDomains(forum.id).length
                ? getForumDomains(forum.id)
                    .map(
                        domain => `
                                    <div
                                        class="rigid-management-row"
                                    >

                                        <div>
                                            <div class="rigid-management-name">
                                                ${escapeHTML(
                            domain.name
                        )}
                                            </div>

                                            <div class="rigid-management-type">
                                                Domain
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            class="rigid-mini-button rigid-delete-button"
                                            data-forum-delete-domain="${escapeHTML(
                            domain.id
                        )}"
                                        >
                                            Delete
                                        </button>

                                    </div>
                                `
                    )
                    .join("")
                : `
                            <div class="rigid-empty">
                                No domains in this forum.
                            </div>
                        `
            }

            </div>


            <!-- DELETE FORUM -->

            <button
                type="button"
                class="rigid-danger-full-button"
                data-forum-delete="${escapeHTML(
                forum.id
            )}"
            >
                Delete This Forum
            </button>

        </div>
      `
            : ""
        }

        </form>

    `;


    content
        .querySelector("form")
        .addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const name =
                    el("rigidForumName")
                        .value
                        .trim();

                const description =
                    el("rigidForumDescription")
                        .value
                        .trim();


                try {

                    if (editing) {

                        const {
                            error
                        } =
                            await sb.rpc(
                                "admin_update_forum",
                                {
                                    p_forum_id:
                                        forum.id,

                                    p_name:
                                        name,

                                    p_description:
                                        description || null
                                }
                            );

                        if (error) {
                            throw error;
                        }

                    }

                    else {

                        const {
                            error
                        } =
                            await sb.rpc(
                                "admin_create_forum",
                                {
                                    p_name:
                                        name,

                                    p_description:
                                        description || null
                                }
                            );

                        if (error) {
                            throw error;
                        }

                    }


                    closeModal(
                        "rigidForumFormModal"
                    );

                    await refreshData();

                }

                catch (error) {

                    alert(
                        error.message ||
                        "Unable to save forum."
                    );

                }

            }
        );

    /* =====================================================
DELETE TEAM FROM FORUM EDITOR
====================================================== */

    content
        .querySelectorAll(
            "[data-forum-delete-team]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await deleteTeam(
                            button.dataset
                                .forumDeleteTeam
                        );

                        closeModal(
                            "rigidForumFormModal"
                        );

                        await openForumForm(
                            getForum(
                                forum.id
                            )
                        );

                    }
                );

            }
        );


    /* =====================================================
       DELETE DOMAIN FROM FORUM EDITOR
    ====================================================== */

    content
        .querySelectorAll(
            "[data-forum-delete-domain]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await deleteDomain(
                            button.dataset
                                .forumDeleteDomain
                        );

                        closeModal(
                            "rigidForumFormModal"
                        );

                        const updatedForum =
                            getForum(
                                forum.id
                            );

                        if (updatedForum) {

                            openForumForm(
                                updatedForum
                            );

                        }

                    }
                );

            }
        );


    /* =====================================================
       DELETE FORUM FROM FORUM EDITOR
    ====================================================== */

    const deleteForumButton =
        content.querySelector(
            "[data-forum-delete]"
        );

    if (deleteForumButton) {

        deleteForumButton.addEventListener(
            "click",
            async () => {

                closeModal(
                    "rigidForumFormModal"
                );

                await deleteForum(
                    forum.id
                );

            }
        );

    }

}


/* =========================================================
   DELETE FORUM
========================================================= */

async function deleteForum(
    forumId
) {

    const forum =
        getForum(
            forumId
        );

    if (!forum) {
        return;
    }


    const childTeams =
        getForumTeams(
            forumId
        );

    const childDomains =
        getForumDomains(
            forumId
        );


    const confirmed =
        window.confirm(
            `Delete "${forum.name}"?\n\n` +
            `${childTeams.length} team(s) and ` +
            `${childDomains.length} domain(s) are attached to this forum. ` +
            `Their memberships/tasks may also be affected.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await sb.rpc(
                "admin_delete_forum",
                {
                    p_forum_id:
                        forumId
                }
            );

        if (error) {
            throw error;
        }

        await refreshData();

    }

    catch (error) {

        alert(
            error.message ||
            "Unable to delete forum."
        );

    }

}


/* =========================================================
   TEAM FORM
========================================================= */

function openTeamForm(
    team = null,
    defaultForumId = null
) {

    const editing =
        Boolean(team);


    const modal =
        createModal(
            "rigidTeamFormModal",
            editing
                ? "EDIT TEAM"
                : "NEW TEAM",
            editing
                ? "Edit Team"
                : "Create Team"
        );


    const content =
        modal.querySelector(
            ".rigid-modal-content"
        );


    content.innerHTML = `

        <form id="rigidTeamForm">

            <div class="rigid-form-grid">

                ${editing
            ? `
        <input
            id="rigidTeamForum"
            type="hidden"
            value="${escapeHTML(
                team?.forum_id || ""
            )}"
        >
      `
            : `
        <div class="rigid-form-group">

            <label>
                Forum
            </label>

            <select
                id="rigidTeamForum"
                required
            >

                ${forums.map(
                forum => `
                        <option
                            value="${forum.id}"
                            ${String(
                    defaultForumId
                ) ===
                        String(
                            forum.id
                        )
                        ? "selected"
                        : ""
                    }
                        >
                            ${escapeHTML(
                        forum.name
                    )}
                        </option>
                    `
            ).join("")}

            </select>

        </div>
      `
        }


                <div class="rigid-form-group">

                    <label>
                        Team Name
                    </label>

                    <input
                        id="rigidTeamName"
                        value="${escapeHTML(
            team?.name || ""
        )}"
                        required
                    >

                </div>


                <div class="rigid-form-group">

                    <label>
                        Description
                    </label>

                    <textarea
                        id="rigidTeamDescription"
                    >${escapeHTML(
            team?.description || ""
        )}</textarea>

                </div>

            </div>


            <div class="rigid-modal-actions">

                <button
                    type="button"
                    class="rigid-secondary"
                    data-close-modal="rigidTeamFormModal"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="rigid-primary"
                >
                    ${editing
            ? "Save Changes"
            : "Create Team"}
                </button>

            </div>

        </form>

    `;


    content
        .querySelector("form")
        .addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const forumId =
                    el("rigidTeamForum")
                        .value;

                const name =
                    el("rigidTeamName")
                        .value
                        .trim();

                const description =
                    el("rigidTeamDescription")
                        .value
                        .trim();


                try {

                    if (editing) {

                        const {
                            error
                        } =
                            await sb.rpc(
                                "admin_update_team",
                                {
                                    p_team_id:
                                        team.id,

                                    p_forum_id:
                                        forumId,

                                    p_name:
                                        name,

                                    p_description:
                                        description || null
                                }
                            );

                        if (error) {
                            throw error;
                        }

                    }

                    else {

                        const {
                            data,
                            error
                        } = await sb.rpc(
                            "admin_create_team",
                            {
                                p_forum_id: forumId,
                                p_name: name,
                                p_description: description || null
                            }
                        );

                        if (error) {
                            console.error("admin_create_team FULL ERROR:", error);
                            throw error;
                        }

                    }


                    closeModal(
                        "rigidTeamFormModal"
                    );

                    await refreshData();

                }

                catch (error) {

                    alert(
                        error.message ||
                        "Unable to save team."
                    );

                }

            }
        );

}


/* =========================================================
   DOMAIN FORM
========================================================= */

function openDomainForm(
    domain = null,
    defaultForumId = null
) {

    const editing =
        Boolean(domain);


    const modal =
        createModal(
            "rigidDomainFormModal",
            editing
                ? "EDIT DOMAIN"
                : "NEW DOMAIN",
            editing
                ? "Edit Domain"
                : "Create Domain"
        );


    const content =
        modal.querySelector(
            ".rigid-modal-content"
        );


    content.innerHTML = `

        <form id="rigidDomainForm">

            <div class="rigid-form-grid">

                ${editing
            ? `
        <input
            id="rigidDomainForum"
            type="hidden"
            value="${escapeHTML(
                domain?.forum_id || ""
            )}"
        >
      `
            : `
        <div class="rigid-form-group">

            <label>
                Forum
            </label>

            <select
                id="rigidDomainForum"
                required
            >

                ${forums.map(
                forum => `
                        <option
                            value="${forum.id}"
                            ${String(
                    defaultForumId
                ) ===
                        String(
                            forum.id
                        )
                        ? "selected"
                        : ""
                    }
                        >
                            ${escapeHTML(
                        forum.name
                    )}
                        </option>
                    `
            ).join("")}

            </select>

        </div>
      `
        }


                <div class="rigid-form-group">

                    <label>
                        Domain Name
                    </label>

                    <input
                        id="rigidDomainName"
                        value="${escapeHTML(
            domain?.name || ""
        )}"
                        required
                    >

                </div>


                <div class="rigid-form-group">

                    <label>
                        Description
                    </label>

                    <textarea
                        id="rigidDomainDescription"
                    >${escapeHTML(
            domain?.description || ""
        )}</textarea>

                </div>

            </div>


            <div class="rigid-modal-actions">

                <button
                    type="button"
                    class="rigid-secondary"
                    data-close-modal="rigidDomainFormModal"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="rigid-primary"
                >
                    ${editing
            ? "Save Changes"
            : "Create Domain"}
                </button>

            </div>

        </form>

    `;


    content
        .querySelector("form")
        .addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const forumId =
                    el("rigidDomainForum")
                        .value;

                const name =
                    el("rigidDomainName")
                        .value
                        .trim();

                const description =
                    el("rigidDomainDescription")
                        .value
                        .trim();


                try {

                    if (editing) {

                        const {
                            error
                        } =
                            await sb.rpc(
                                "admin_update_domain",
                                {
                                    p_domain_id:
                                        domain.id,

                                    p_forum_id:
                                        forumId,

                                    p_name:
                                        name,

                                    p_description:
                                        description || null
                                }
                            );

                        if (error) {
                            throw error;
                        }

                    }

                    else {

                        const {
                            error
                        } =
                            await sb.rpc(
                                "admin_create_domain",
                                {
                                    p_forum_id:
                                        forumId,

                                    p_name:
                                        name,

                                    p_description:
                                        description || null
                                }
                            );

                        if (error) {
                            throw error;
                        }

                    }


                    closeModal(
                        "rigidDomainFormModal"
                    );

                    await refreshData();

                }

                catch (error) {

                    alert(
                        error.message ||
                        "Unable to save domain."
                    );

                }

            }
        );

}


/* =========================================================
   DELETE TEAM
========================================================= */

async function deleteTeam(
    teamId
) {

    const team =
        getTeam(
            teamId
        );

    if (!team) {
        return;
    }


    if (
        !confirm(
            `Delete team "${team.name}"?`
        )
    ) {
        return;
    }


    try {

        const {
            error
        } =
            await sb.rpc(
                "admin_delete_team",
                {
                    p_team_id:
                        teamId
                }
            );

        if (error) {
            throw error;
        }

        await refreshData();

    }

    catch (error) {

        alert(
            error.message ||
            "Unable to delete team."
        );

    }

}


/* =========================================================
   DELETE DOMAIN
========================================================= */

async function deleteDomain(
    domainId
) {

    const domain =
        getDomain(
            domainId
        );

    if (!domain) {
        return;
    }


    if (
        !confirm(
            `Delete domain "${domain.name}"?`
        )
    ) {
        return;
    }


    try {

        const {
            error
        } =
            await sb.rpc(
                "admin_delete_domain",
                {
                    p_domain_id:
                        domainId
                }
            );

        if (error) {
            throw error;
        }

        await refreshData();

    }

    catch (error) {

        alert(
            error.message ||
            "Unable to delete domain."
        );

    }

}


/* =========================================================
   ENTITY DETAILS
========================================================= */

async function openEntityDetails(
    type,
    id
) {

    let entity;
    let eyebrow;

    if (type === "team") {

        entity =
            getTeam(id);

        eyebrow =
            "TEAM";

    }

    else {

        entity =
            getDomain(id);

        eyebrow =
            "DOMAIN";

    }


    if (!entity) {
        return;
    }


    const modal =
        createModal(
            `rigid${type}Details`,
            eyebrow,
            entity.name
        );


    const content =
        modal.querySelector(
            ".rigid-modal-content"
        );


    const members =
        await getMembers(
            type,
            id
        );


    content.innerHTML = `

        <p class="rigid-forum-description">
            ${escapeHTML(
        entity.description ||
        "No description added."
    )}
        </p>


        <div class="rigid-admin-actions">

            <button
                type="button"
                class="rigid-mini-button"
                data-detail-edit
            >
                Edit ${type === "team"
            ? "Team"
            : "Domain"}
            </button>

            <button
                type="button"
                class="rigid-mini-button rigid-delete-button"
                data-detail-delete
            >
                Delete
            </button>

        </div>


        <div style="margin-top:22px">

            <div class="column-label">
                MEMBERS
                (${members.length})
            </div>


            <div class="rigid-member-list">

                ${members.length
            ? members.map(
                profile =>
                    memberRowHTML(
                        profile,
                        type,
                        id
                    )
            ).join("")
            : `
                        <div class="rigid-empty">
                            No members yet.
                        </div>
                      `
        }

            </div>

        </div>


        <div class="rigid-modal-actions">

            <button
                type="button"
                class="rigid-primary"
                data-manage-members
            >
                Manage Members
            </button>

        </div>

    `;


    content
        .querySelector(
            "[data-detail-edit]"
        )
        .addEventListener(
            "click",
            () => {

                closeModal(
                    `rigid${type}Details`
                );

                if (type === "team") {

                    openTeamForm(
                        entity
                    );

                }

                else {

                    openDomainForm(
                        entity
                    );

                }

            }
        );


    content
        .querySelector(
            "[data-detail-delete]"
        )
        .addEventListener(
            "click",
            async () => {

                closeModal(
                    `rigid${type}Details`
                );

                if (type === "team") {

                    await deleteTeam(
                        id
                    );

                }

                else {

                    await deleteDomain(
                        id
                    );

                }

            }
        );


    content
        .querySelector(
            "[data-manage-members]"
        )
        .addEventListener(
            "click",
            () => {

                closeModal(
                    `rigid${type}Details`
                );

                openMembersPanel(
                    type,
                    id
                );

            }
        );


    content
        .querySelectorAll(
            "[data-remove-member]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        removeMember(
                            type,
                            id,
                            button.dataset.removeMember
                        );

                    }
                );

            }
        );

}


/* =========================================================
   MEMBER ROW
========================================================= */

function memberRowHTML(
    profile,
    type,
    entityId
) {

    return `

        <div
            class="rigid-member-row rigid-member-clickable"
            data-member-profile-id="${escapeHTML(profile.id)}"
        >

            <div class="rigid-member-main">

                <div class="rigid-member-name">
                    ${escapeHTML(
        profile.full_name ||
        "Unnamed user"
    )}
                </div>

                <div class="rigid-member-email">
                    ${escapeHTML(
        profile.email ||
        ""
    )}
                </div>

            </div>


            <button
                type="button"
                class="rigid-mini-button rigid-delete-button"
                data-remove-member="${escapeHTML(profile.id)}"
            >
                Remove
            </button>

        </div>

    `;

}


/* =========================================================
   FORUM MEMBERS PANEL
========================================================= */

async function openMembersPanel(
    type,
    entityId
) {

    let entity;

    if (type === "forum") {
        entity = getForum(entityId);
    }

    else if (type === "team") {
        entity = getTeam(entityId);
    }

    else {
        entity = getDomain(entityId);
    }


    if (!entity) {
        return;
    }


    const title =
        entity.name;


    const modal =
        createModal(
            `rigidMembersPanel`,
            `${type.toUpperCase()} MEMBERS`,
            title
        );


    const content =
        modal.querySelector(
            ".rigid-modal-content"
        );


    const members =
        await getMembers(
            type,
            entityId
        );


    content.innerHTML = `

        <div class="rigid-admin-actions">

            <button
                type="button"
                class="rigid-primary"
                data-add-member
            >
                + Add Member
            </button>

        </div>


        <div class="rigid-member-list">

            ${members.length
            ? members.map(
                profile =>
                    memberRowHTML(
                        profile,
                        type,
                        entityId
                    )
            ).join("")
            : `
                    <div class="rigid-empty">
                        No members registered here.
                    </div>
                  `
        }

        </div>

    `;


    content
        .querySelector(
            "[data-add-member]"
        )
        .addEventListener(
            "click",
            () => {

                openMemberPicker(
                    type,
                    entityId
                );

            }
        );


    content
        .querySelectorAll(
            "[data-remove-member]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await removeMember(
                            type,
                            entityId,
                            button.dataset.removeMember
                        );

                    }
                );

            }
        );

}


/* =========================================================
   MEMBER PICKER
========================================================= */

async function openMemberPicker(
    type,
    entityId
) {

    const currentIds =
        await getMembership(
            type,
            entityId
        );


    const available =
        profiles.filter(
            profile =>
                !currentIds.includes(
                    profile.id
                ) &&
                profile.status ===
                "approved"
        );


    const modal =
        createModal(
            "rigidMemberPicker",
            "MEMBER MANAGEMENT",
            "Add Member"
        );


    const content =
        modal.querySelector(
            ".rigid-modal-content"
        );


    content.innerHTML = `

        <div class="rigid-member-picker">

            ${available.length
            ? available.map(
                profile => `

                        <label class="rigid-picker-item">

                            <input
                                type="checkbox"
                                value="${profile.id}"
                            >

                            <span>

                                <strong>
                                    ${escapeHTML(
                    profile.full_name ||
                    "Unnamed user"
                )}
                                </strong>

                                <br>

                                <small>
                                    ${escapeHTML(
                    profile.email
                )}
                                </small>

                            </span>

                        </label>

                    `
            ).join("")
            : `
                    <div class="rigid-empty">
                        No available approved users.
                    </div>
                  `
        }

        </div>


        <div class="rigid-modal-actions">

            <button
                type="button"
                class="rigid-secondary"
                data-close-modal="rigidMemberPicker"
            >
                Cancel
            </button>

            <button
                type="button"
                class="rigid-primary"
                data-save-members
            >
                Add Selected
            </button>

        </div>

    `;


    content
        .querySelector(
            "[data-save-members]"
        )
        .addEventListener(
            "click",
            async () => {

                const selected =
                    Array.from(
                        content.querySelectorAll(
                            "input[type='checkbox']:checked"
                        )
                    ).map(
                        input =>
                            input.value
                    );


                if (!selected.length) {

                    alert(
                        "Select at least one member."
                    );

                    return;

                }


                try {

                    for (
                        const profileId
                        of selected
                    ) {

                        await addMember(
                            type,
                            entityId,
                            profileId
                        );

                    }


                    closeModal(
                        "rigidMemberPicker"
                    );

                    await openMembersPanel(
                        type,
                        entityId
                    );

                }

                catch (error) {

                    alert(
                        error.message ||
                        "Unable to add members."
                    );

                }

            }
        );

}


/* =========================================================
   ADD MEMBER
========================================================= */

async function addMember(
    type,
    entityId,
    profileId
) {

    let rpc;
    let params;


    if (type === "forum") {

        rpc =
            "admin_add_forum_member";

        params = {
            p_forum_id:
                entityId,

            p_profile_id:
                profileId
        };

    }

    else if (type === "team") {

        rpc =
            "admin_add_team_member";

        params = {
            p_team_id:
                entityId,

            p_profile_id:
                profileId
        };

    }

    else {

        rpc =
            "admin_add_domain_member";

        params = {
            p_domain_id:
                entityId,

            p_profile_id:
                profileId
        };

    }


    const {
        error
    } =
        await sb.rpc(
            rpc,
            params
        );


    if (error) {
        throw error;
    }

}


/* =========================================================
   REMOVE MEMBER
========================================================= */

async function removeMember(
    type,
    entityId,
    profileId
) {

    if (
        !confirm(
            "Remove this member?"
        )
    ) {
        return;
    }


    let rpc;
    let params;


    if (type === "forum") {

        rpc =
            "admin_remove_forum_member";

        params = {
            p_forum_id:
                entityId,

            p_profile_id:
                profileId
        };

    }

    else if (type === "team") {

        rpc =
            "admin_remove_team_member";

        params = {
            p_team_id:
                entityId,

            p_profile_id:
                profileId
        };

    }

    else {

        rpc =
            "admin_remove_domain_member";

        params = {
            p_domain_id:
                entityId,

            p_profile_id:
                profileId
        };

    }


    try {

        const {
            error
        } =
            await sb.rpc(
                rpc,
                params
            );

        if (error) {
            throw error;
        }


        closeModal(
            "rigidMembersPanel"
        );


        await refreshData();


        await openMembersPanel(
            type,
            entityId
        );

    }

    catch (error) {

        alert(
            error.message ||
            "Unable to remove member."
        );

    }

}


/* =========================================================
   TASK OVERVIEW
========================================================= */

function getFilteredTasks() {

    if (
        selectedForum ===
        "all"
    ) {

        return tasks;

    }

    return tasks.filter(
        task =>
            String(task.forum_id) ===
            String(selectedForum)
    );

}

function getFilteredWorkItems() {
    if (selectedForum === "all") {
        return workItems;
    }

    return workItems.filter(
        work => String(work.forum_id) === String(selectedForum)
    );
}

/* =========================================================
   UPDATE OVERVIEW
========================================================= */

function updateOverview() {





    let filteredWorks = workItems;

    if (selectedForum !== "all") {

        filteredWorks =
            workItems.filter(
                work =>
                    String(work.forum_id) ===
                    String(selectedForum)
            );

    }

    TASK_CATEGORIES.forEach(
        category => {

            TASK_STATUSES.forEach(
                status => {

                    const count =
                        filteredWorks.filter(
                            work => {

                                const workCategory =
                                    String(
                                        work.category ||
                                        ""
                                    )
                                        .toLowerCase()
                                        .trim();


                                const rawStatus =
                                    String(
                                        work.status ||
                                        ""
                                    )
                                        .toLowerCase()
                                        .trim();


                                const workStatus =
                                    (
                                        rawStatus ===
                                        "in-progress" ||

                                        rawStatus ===
                                        "in_progress"
                                    )
                                        ? "ongoing"
                                        : rawStatus;


                                return (
                                    workCategory ===
                                    category &&

                                    workStatus ===
                                    status
                                );

                            }
                        ).length;


                    const id =
                        `${category}${capitalizeFirst(
                            status
                        )}`;


                    const element =
                        el(id);

                    if (element) {

                        element.textContent =
                            count;

                    }

                }
            );

        }
    );

}


/* =========================================================
   CAPITALIZE
========================================================= */

function capitalizeFirst(
    value
) {

    return value
        .charAt(0)
        .toUpperCase() +
        value.slice(1);

}


/* =========================================================
   OVERVIEW CLICK EVENTS
========================================================= */

function attachOverviewClicks() {

    TASK_CATEGORIES.forEach(category => {

        TASK_STATUSES.forEach(status => {

            const id =
                `${category}${capitalizeFirst(status)}`;

            const element =
                el(id);

            if (!element) {
                console.warn(
                    "Overview element not found:",
                    id
                );
                return;
            }

            element.style.cursor = "pointer";

            element.onclick = function (event) {

                event.preventDefault();
                event.stopPropagation();


                openWorkList(
                    category,
                    status
                );

            };

        });

    });

}

function openWorkList(category, status) {

    let filteredWorks = workItems;

    if (selectedForum !== "all") {
        filteredWorks = workItems.filter(
            work =>
                String(work.forum_id) ===
                String(selectedForum)
        );
    }

    const works = filteredWorks.filter(work => {

        const workCategory =
            String(work.category || "")
                .toLowerCase()
                .trim();

        const rawStatus =
            String(work.status || "")
                .toLowerCase()
                .trim();

        const workStatus =
            rawStatus === "in-progress" ||
                rawStatus === "in_progress"
                ? "ongoing"
                : rawStatus;

        return (
            workCategory === category &&
            workStatus === status
        );
    });


    const modal = createModal(
        "rigidWorkListModal",
        `${formatCategory(status)} / ${formatCategory(category)}`,
        `${formatCategory(category)} — ${formatCategory(status)}`
    );


    const content =
        modal.querySelector(
            ".rigid-modal-content"
        );


    content.innerHTML = `

        <div class="rigid-count" style="margin-bottom:16px;">
            ${works.length}
            ${works.length === 1 ? "work" : "works"}
        </div>

        <div class="rigid-member-list">

            ${works.length
            ? works.map(
                work =>
                    renderWorkPersonRow(work)
            ).join("")
            : `
                        <div class="rigid-empty">
                            No matching work found.
                        </div>
                      `
        }

        </div>

    `;

    content
    .querySelectorAll(".rigid-task-row")
    .forEach(row => {

        row.addEventListener(
            "click",
            () => {

                const work =
                    works.find(
                        item =>
                            String(item.id) ===
                            String(row.dataset.workId)
                    );

                if (!work) {
                    return;
                }

                const targetPage =
                    {
                        study:
                            "../study/study.html",

                        paper:
                            "../paper/paper.html",

                        simulation:
                            "../simulation/simulation.html",

                        project:
                            "../project/project.html",

                        design:
                            "../design/design.html",

                        prototype:
                            "../prototype/prototype.html"
                    }[String(work.category).toLowerCase()];

                if (!targetPage) {
                    alert(
                        "No workspace page is configured for this work type."
                    );
                    return;
                }

                window.location.href =
                    `${targetPage}?work_id=${encodeURIComponent(work.id)}`;

            }
        );

    });
}

function renderWorkPersonRow(work) {

    const profile =
        profiles.find(
            profile =>
                String(profile.id) ===
                String(work.profile_id)
        );

    const forum =
        getForum(work.forum_id);

    const team =
        getTeam(work.team_id);

    const domain =
        getDomain(work.domain_id);


    const personName =
        profile?.full_name ||
        profile?.email ||
        "Unknown member";


    return `

        <div
    class="rigid-task-row"
    data-work-id="${escapeHTML(work.id)}"
>

            <!-- MEMBER -->

            <strong>
                ${escapeHTML(personName)}
            </strong>


            <!-- WORK TITLE -->

            <span class="rigid-task-title">
                ${escapeHTML(
                    work.title ||
                    "Untitled work"
                )}
            </span>


            <!-- CATEGORY -->

            <div class="rigid-task-meta">

                <span class="rigid-badge">
                    ${escapeHTML(
                        formatCategory(
                            work.category
                        )
                    )}
                </span>


                <!-- FORUM -->

                ${forum
                    ? `
                        <span>
                            Forum:
                            ${escapeHTML(
                                forum.name
                            )}
                        </span>
                    `
                    : ""
                }


                <!-- TEAM -->

                ${team
                    ? `
                        <span>
                            Team:
                            ${escapeHTML(
                                team.name
                            )}
                        </span>
                    `
                    : ""
                }


                <!-- DOMAIN -->

                ${domain
                    ? `
                        <span>
                            Domain:
                            ${escapeHTML(
                                domain.name
                            )}
                        </span>
                    `
                    : ""
                }

            </div>


            <!-- DATE -->

            <div
                class="rigid-count"
                style="
                    margin-left:auto;
                    white-space:nowrap;
                "
            >

                ${formatDate(
                    work.created_at
                )}

            </div>

        </div>

    `;
}

function renderWorkRow(work) {

    const forum =
        getForum(work.forum_id);

    const team =
        getTeam(work.team_id);

    const domain =
        getDomain(work.domain_id);

    const profile =
        profiles.find(
            profile =>
                String(profile.id) ===
                String(work.profile_id)
        );


    return `

        <div class="rigid-task-row">

            <div>

                <strong>
                    ${escapeHTML(
        work.title ||
        "Untitled"
    )}
                </strong>


                <div class="rigid-task-meta">

                    <span class="rigid-badge">
                        ${escapeHTML(
        formatCategory(
            work.category
        )
    )}
                    </span>


                    <span class="rigid-badge">
                        ${escapeHTML(
        formatCategory(
            work.status
        )
    )}
                    </span>


                    ${forum
            ? `
                            <span>
                                Forum:
                                ${escapeHTML(
                forum.name
            )}
                            </span>
                          `
            : ""
        }


                    ${team
            ? `
                            <span>
                                Team:
                                ${escapeHTML(
                team.name
            )}
                            </span>
                          `
            : ""
        }


                    ${domain
            ? `
                            <span>
                                Domain:
                                ${escapeHTML(
                domain.name
            )}
                            </span>
                          `
            : ""
        }


                    ${profile
            ? `
                            <span>
                                Member:
                                ${escapeHTML(
                profile.full_name ||
                profile.email ||
                "Unnamed user"
            )}
                            </span>
                          `
            : ""
        }

                </div>

            </div>


            <div class="rigid-count">

                ${formatDate(
            work.created_at
        )}

            </div>

        </div>

    `;

}

/* =========================================================
   TASK LIST
========================================================= */

function openTaskList(
    category,
    status
) {

    const filtered =
        getFilteredTasks()
            .filter(
                task =>
                    task.category ===
                    category &&
                    task.status ===
                    status
            );


    const modal =
        createModal(
            "rigidTaskListModal",
            `${formatCategory(
                status
            )} / ${formatCategory(
                category
            )}`,
            `${formatCategory(
                category
            )} Tasks`
        );


    const content =
        modal.querySelector(
            ".rigid-modal-content"
        );


    content.innerHTML = `

        <div class="rigid-count">
            ${filtered.length}
            task${filtered.length === 1 ? "" : "s"}
        </div>

        <div style="margin-top:14px">

            ${filtered.length
            ? filtered.map(
                task =>
                    renderTaskRow(
                        task
                    )
            ).join("")
            : `
                    <div class="rigid-empty">
                        No ${status} ${category} tasks.
                    </div>
                  `
        }

        </div>


        <div class="rigid-modal-actions">

            <button
                type="button"
                class="rigid-primary"
                data-create-task
            >
                + Create Task
            </button>

        </div>

    `;


    content
        .querySelector(
            "[data-create-task]"
        )
        .addEventListener(
            "click",
            () => {

                closeModal(
                    "rigidTaskListModal"
                );

                openTaskForm(
                    null,
                    category,
                    status
                );

            }
        );


    content
        .querySelectorAll(
            "[data-task-id]"
        )
        .forEach(
            row => {

                row.addEventListener(
                    "click",
                    () => {

                        const task =
                            tasks.find(
                                item =>
                                    item.id ===
                                    row.dataset.taskId
                            );

                        if (task) {

                            closeModal(
                                "rigidTaskListModal"
                            );

                            openTaskDetails(
                                task
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   TASK ROW
========================================================= */

function renderTaskRow(
    task
) {

    const forum =
        getForum(
            task.forum_id
        );

    const team =
        getTeam(
            task.team_id
        );

    const domain =
        getDomain(
            task.domain_id
        );


    return `

        <div
            class="rigid-task-row"
            data-task-id="${task.id}"
        >

            <div>

                <strong>
                    ${escapeHTML(
        task.title
    )}
                </strong>

                <div class="rigid-task-meta">

                    <span class="rigid-badge">
                        ${escapeHTML(
        formatCategory(
            task.category
        )
    )}
                    </span>

                    ${forum
            ? `
                            <span>
                                ${escapeHTML(
                forum.name
            )}
                            </span>
                          `
            : ""
        }

                    ${team
            ? `
                            <span>
                                ${escapeHTML(
                team.name
            )}
                            </span>
                          `
            : ""
        }

                    ${domain
            ? `
                            <span>
                                ${escapeHTML(
                domain.name
            )}
                            </span>
                          `
            : ""
        }

                </div>

            </div>


            <div class="rigid-count">
                ${formatDate(
            task.created_at
        )}
            </div>

        </div>

    `;

}


/* =========================================================
   TASK DETAILS
========================================================= */

async function openTaskDetails(
    task
) {

    const modal =
        createModal(
            "rigidTaskDetails",
            "TASK",
            task.title
        );


    const content =
        modal.querySelector(
            ".rigid-modal-content"
        );


    const members =
        await getTaskMembers(
            task.id
        );


    const forum =
        getForum(
            task.forum_id
        );

    const team =
        getTeam(
            task.team_id
        );

    const domain =
        getDomain(
            task.domain_id
        );


    /* =====================================================
       TASK DETAILS HTML
    ====================================================== */

    content.innerHTML = `

        <div class="rigid-detail-card">

            <h4>
                Description
            </h4>

            <p>
                ${escapeHTML(
        task.description ||
        "No description."
    )}
            </p>

        </div>


        <div class="rigid-detail-card">

            <h4>
                Classification
            </h4>

            <p>
                ${escapeHTML(
        formatCategory(
            task.category
        )
    )}

                ·

                ${escapeHTML(
        formatCategory(
            task.status
        )
    )}
            </p>


            <p style="margin-top:8px">

                ${forum
            ? `Forum: ${escapeHTML(
                forum.name
            )}<br>`
            : ""
        }

                ${team
            ? `Team: ${escapeHTML(
                team.name
            )}<br>`
            : ""
        }

                ${domain
            ? `Domain: ${escapeHTML(
                domain.name
            )}`
            : ""
        }

            </p>

        </div>


        <!-- =================================================
             MEMBERS
        ================================================== -->

        <div class="rigid-detail-card">

            <h4>
                Members (${members.length})
            </h4>


            <div class="rigid-member-list">

                ${members.length

            ? members.map(
                profile => `

                                <div
                                    class="rigid-member-row"
                                >

                                    <div
                                        class="rigid-member-main"
                                    >

                                        <div
                                            class="rigid-member-name"
                                        >
                                            ${escapeHTML(
                    profile.full_name ||
                    "Unnamed user"
                )}
                                        </div>


                                        <div
                                            class="rigid-member-email"
                                        >
                                            ${escapeHTML(
                    profile.email ||
                    ""
                )}
                                        </div>

                                    </div>


                                    <button
                                        type="button"
                                        class="rigid-mini-button rigid-delete-button"
                                        data-remove-task-member="${profile.id}"
                                    >
                                        Remove
                                    </button>

                                </div>

                            `
            ).join("")

            : `

                            <div class="rigid-empty">
                                No task members.
                            </div>

                        `
        }

            </div>

        </div>


        <!-- =================================================
             TASK ACTIONS
        ================================================== -->

        <div class="rigid-admin-actions">

            <button
                type="button"
                class="rigid-mini-button"
                data-edit-task
            >
                Edit Task
            </button>


            <button
                type="button"
                class="rigid-mini-button"
                data-manage-task-members
            >
                Manage Members
            </button>


            <button
                type="button"
                class="rigid-mini-button rigid-delete-button"
                data-delete-task
            >
                Delete Task
            </button>

        </div>

    `;


    /* =====================================================
       REMOVE TASK MEMBER
    ====================================================== */

    content
        .querySelectorAll(
            "[data-remove-task-member]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const profileId =
                            button.dataset
                                .removeTaskMember;


                        if (
                            !confirm(
                                "Remove this member from the task?"
                            )
                        ) {

                            return;

                        }


                        try {

                            const {
                                error
                            } =
                                await sb.rpc(
                                    "admin_remove_task_member",
                                    {
                                        p_task_id:
                                            task.id,

                                        p_profile_id:
                                            profileId
                                    }
                                );


                            if (error) {
                                throw error;
                            }


                            closeModal(
                                "rigidTaskDetails"
                            );


                            await openTaskDetails(
                                task
                            );

                        }

                        catch (error) {

                            console.error(
                                "Remove task member error:",
                                error
                            );


                            alert(
                                error.message ||
                                "Unable to remove task member."
                            );

                        }

                    }
                );

            }
        );


    /* =====================================================
       EDIT TASK
    ====================================================== */

    content
        .querySelector(
            "[data-edit-task]"
        )
        .addEventListener(
            "click",
            () => {

                closeModal(
                    "rigidTaskDetails"
                );


                openTaskForm(
                    task
                );

            }
        );


    /* =====================================================
       DELETE TASK
    ====================================================== */

    content
        .querySelector(
            "[data-delete-task]"
        )
        .addEventListener(
            "click",
            async () => {

                closeModal(
                    "rigidTaskDetails"
                );


                await deleteTask(
                    task.id
                );

            }
        );


    /* =====================================================
       MANAGE TASK MEMBERS
    ====================================================== */

    content
        .querySelector(
            "[data-manage-task-members]"
        )
        .addEventListener(
            "click",
            () => {

                closeModal(
                    "rigidTaskDetails"
                );


                openTaskMemberPicker(
                    task
                );

            }
        );

}


/* =========================================================
   TASK MEMBERS
========================================================= */

async function getTaskMembership(
    taskId
) {

    const {
        data,
        error
    } =
        await sb
            .from("task_members")
            .select(
                "profile_id"
            )
            .eq(
                "task_id",
                taskId
            );

    if (error) {

        console.error(
            "Task membership:",
            error
        );

        return [];

    }

    return (
        data || []
    ).map(
        row =>
            row.profile_id
    );

}


async function getTaskMembers(
    taskId
) {

    const ids =
        await getTaskMembership(
            taskId
        );

    return profiles.filter(
        profile =>
            ids.includes(
                profile.id
            )
    );

}


/* =========================================================
   TASK MEMBER PICKER
========================================================= */

async function openTaskMemberPicker(
    task
) {

    const currentIds =
        await getTaskMembership(
            task.id
        );


    const available =
        profiles.filter(
            profile =>
                !currentIds.includes(
                    profile.id
                ) &&
                profile.status ===
                "approved"
        );


    const modal =
        createModal(
            "rigidTaskMemberPicker",
            "TASK MEMBERS",
            task.title
        );


    const content =
        modal.querySelector(
            ".rigid-modal-content"
        );


    content.innerHTML = `

        <div class="rigid-member-picker">

            ${available.length
            ? available.map(
                profile => `

                        <label class="rigid-picker-item">

                            <input
                                type="checkbox"
                                value="${profile.id}"
                            >

                            <span>

                                <strong>
                                    ${escapeHTML(
                    profile.full_name ||
                    "Unnamed user"
                )}
                                </strong>

                                <br>

                                <small>
                                    ${escapeHTML(
                    profile.email
                )}
                                </small>

                            </span>

                        </label>

                    `
            ).join("")
            : `
                    <div class="rigid-empty">
                        No available approved users.
                    </div>
                  `
        }

        </div>


        <div class="rigid-modal-actions">

            <button
                type="button"
                class="rigid-primary"
                data-add-task-members
            >
                Add Selected
            </button>

        </div>

    `;


    content
        .querySelector(
            "[data-add-task-members]"
        )
        .addEventListener(
            "click",
            async () => {

                const selected =
                    Array.from(
                        content.querySelectorAll(
                            "input:checked"
                        )
                    ).map(
                        input =>
                            input.value
                    );


                try {

                    for (
                        const profileId
                        of selected
                    ) {

                        const {
                            error
                        } =
                            await sb.rpc(
                                "admin_add_task_member",
                                {
                                    p_task_id:
                                        task.id,

                                    p_profile_id:
                                        profileId
                                }
                            );

                        if (error) {
                            throw error;
                        }

                    }


                    closeModal(
                        "rigidTaskMemberPicker"
                    );

                    await openTaskDetails(
                        task
                    );

                }

                catch (error) {

                    alert(
                        error.message ||
                        "Unable to add task members."
                    );

                }

            }
        );

}


/* =========================================================
   TASK FORM
========================================================= */

function openTaskForm(
    task = null,
    defaultCategory = "project",
    defaultStatus = "ongoing"
) {

    const editing =
        Boolean(task);


    const modal =
        createModal(
            "rigidTaskFormModal",
            editing
                ? "EDIT TASK"
                : "NEW TASK",
            editing
                ? "Edit Task"
                : "Create Task"
        );


    const content =
        modal.querySelector(
            ".rigid-modal-content"
        );


    content.innerHTML = `

        <form id="rigidTaskForm">

            <div class="rigid-form-grid">

                <div class="rigid-form-group">

                    <label>
                        Title
                    </label>

                    <input
                        id="rigidTaskTitle"
                        value="${escapeHTML(
        task?.title || ""
    )}"
                        required
                    >

                </div>


                <div class="rigid-form-group">

                    <label>
                        Description
                    </label>

                    <textarea
                        id="rigidTaskDescription"
                    >${escapeHTML(
        task?.description || ""
    )}</textarea>

                </div>


                <div class="rigid-form-group">

                    <label>
                        Category
                    </label>

                    <select
                        id="rigidTaskCategory"
                    >

                        ${TASK_CATEGORIES.map(
        category => `
                                <option
                                    value="${category}"
                                    ${(
                task?.category ||
                defaultCategory
            ) ===
                category
                ? "selected"
                : ""
            }
                                >
                                    ${formatCategory(
                category
            )}
                                </option>
                            `
    ).join("")}

                    </select>

                </div>


                <div class="rigid-form-group">

                    <label>
                        Status
                    </label>

                    <select
                        id="rigidTaskStatus"
                    >

                        ${TASK_STATUSES.map(
        status => `
                                <option
                                    value="${status}"
                                    ${(
                task?.status ||
                defaultStatus
            ) ===
                status
                ? "selected"
                : ""
            }
                                >
                                    ${formatCategory(
                status
            )}
                                </option>
                            `
    ).join("")}

                    </select>

                </div>


                <div class="rigid-form-group">

                    <label>
                        Forum
                    </label>

                    <select
                        id="rigidTaskForum"
                    >

                        <option value="">
                            No Forum
                        </option>

                        ${forums.map(
        forum => `
                                <option
                                    value="${forum.id}"
                                    ${String(
            task?.forum_id || ""
        ) ===
                String(
                    forum.id
                )
                ? "selected"
                : ""
            }
                                >
                                    ${escapeHTML(
                forum.name
            )}
                                </option>
                            `
    ).join("")}

                    </select>

                </div>


                <div class="rigid-form-group">

                    <label>
                        Team
                    </label>

                    <select
                        id="rigidTaskTeam"
                    >

                        <option value="">
                            No Team
                        </option>

                        ${teams.map(
        team => `
                                <option
                                    value="${team.id}"
                                    ${String(
            task?.team_id || ""
        ) ===
                String(
                    team.id
                )
                ? "selected"
                : ""
            }
                                >
                                    ${escapeHTML(
                team.name
            )}
                                </option>
                            `
    ).join("")}

                    </select>

                </div>


                <div class="rigid-form-group">

                    <label>
                        Domain
                    </label>

                    <select
                        id="rigidTaskDomain"
                    >

                        <option value="">
                            No Domain
                        </option>

                        ${domains.map(
        domain => `
                                <option
                                    value="${domain.id}"
                                    ${String(
            task?.domain_id || ""
        ) ===
                String(
                    domain.id
                )
                ? "selected"
                : ""
            }
                                >
                                    ${escapeHTML(
                domain.name
            )}
                                </option>
                            `
    ).join("")}

                    </select>

                </div>

            </div>


            <div class="rigid-modal-actions">

                <button
                    type="button"
                    class="rigid-secondary"
                    data-close-modal="rigidTaskFormModal"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="rigid-primary"
                >
                    ${editing
            ? "Save Changes"
            : "Create Task"}
                </button>

            </div>

        </form>

    `;


    const form =
        content.querySelector(
            "form"
        );


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const payload = {

                p_title:
                    el("rigidTaskTitle")
                        .value
                        .trim(),

                p_description:
                    el("rigidTaskDescription")
                        .value
                        .trim() ||
                    null,

                p_category:
                    el("rigidTaskCategory")
                        .value,

                p_status:
                    el("rigidTaskStatus")
                        .value,

                p_forum_id:
                    el("rigidTaskForum")
                        .value ||
                    null,

                p_team_id:
                    el("rigidTaskTeam")
                        .value ||
                    null,

                p_domain_id:
                    el("rigidTaskDomain")
                        .value ||
                    null

            };


            try {

                if (editing) {

                    const {
                        error
                    } =
                        await sb.rpc(
                            "admin_update_task",
                            {
                                p_task_id:
                                    task.id,

                                ...payload
                            }
                        );

                    if (error) {
                        throw error;
                    }

                }

                else {

                    const {
                        error
                    } =
                        await sb.rpc(
                            "admin_create_task",
                            payload
                        );

                    if (error) {
                        throw error;
                    }

                }


                closeModal(
                    "rigidTaskFormModal"
                );

                await refreshData();

            }

            catch (error) {

                alert(
                    error.message ||
                    "Unable to save task."
                );

            }

        }
    );

}


/* =========================================================
   DELETE TASK
========================================================= */

async function deleteTask(
    taskId
) {

    const task =
        tasks.find(
            item =>
                item.id ===
                taskId
        );

    if (!task) {
        return;
    }


    if (
        !confirm(
            `Delete "${task.title}"?`
        )
    ) {
        return;
    }


    try {

        const {
            error
        } =
            await sb.rpc(
                "admin_delete_task",
                {
                    p_task_id:
                        taskId
                }
            );

        if (error) {
            throw error;
        }

        await refreshData();

    }

    catch (error) {

        alert(
            error.message ||
            "Unable to delete task."
        );

    }

}


/* =========================================================
   PENDING REQUESTS
========================================================= */

async function loadPendingRequests() {

    const {
        data,
        error
    } =
        await sb
            .from("profiles")
            .select(`
                id,
                email,
                full_name,
                role,
                status,
                created_at
            `)
            .eq(
                "role",
                "member"
            )
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

    if (error) {

        console.error(
            "Pending requests:",
            error
        );

        return;

    }

    pendingRequests =
        data || [];

    renderPendingRequests();

}


/* =========================================================
   RENDER PENDING
========================================================= */

function renderPendingRequests() {

    const container =
        el("pendingRequests");

    const badge =
        el("pendingBadge");


    if (!container) {
        return;
    }


    if (badge) {

        badge.textContent =
            pendingRequests.length;

    }


    container.innerHTML =
        "";


    if (
        pendingRequests.length ===
        0
    ) {

        container.innerHTML = `

            <div class="rigid-empty">
                No pending requests.
            </div>

        `;

        return;

    }


    pendingRequests.forEach(
        request => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "pending-item";


            item.innerHTML = `

                <div>

                    <div class="pending-email">
                        ${escapeHTML(
                request.full_name ||
                "Unnamed user"
            )}
                    </div>

                    <div class="pending-meta">
                        ${escapeHTML(
                request.email
            )}
                    </div>

                </div>


                <div class="pending-meta">

                    Applied:
                    ${escapeHTML(
                formatDate(
                    request.created_at
                )
            )}

                </div>


                <div class="pending-actions">

                    <button
                        type="button"
                        class="approve-btn"
                        data-approve
                    >
                        Approve
                    </button>

                    <button
                        type="button"
                        class="reject-btn"
                        data-reject
                    >
                        Reject
                    </button>

                </div>

            `;


            item
                .querySelector(
                    "[data-approve]"
                )
                .addEventListener(
                    "click",
                    () => {

                        updateUserStatus(
                            request.id,
                            "approved"
                        );

                    }
                );


            item
                .querySelector(
                    "[data-reject]"
                )
                .addEventListener(
                    "click",
                    () => {

                        updateUserStatus(
                            request.id,
                            "rejected"
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
   APPROVE / REJECT
========================================================= */

async function updateUserStatus(
    userId,
    status
) {

    const label =
        status === "approved"
            ? "approve"
            : "reject";


    if (
        !confirm(
            `Are you sure you want to ${label} this account?`
        )
    ) {

        return;

    }


    try {

        const {
            error
        } =
            await sb
                .from("profiles")
                .update({

                    status,

                    approved_at:
                        status ===
                            "approved"
                            ? new Date().toISOString()
                            : null,

                    approved_by:
                        status ===
                            "approved"
                            ? currentUser.id
                            : null,

                    updated_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    userId
                );


        if (error) {
            throw error;
        }


        await loadPendingRequests();

        await loadProfiles();

    }

    catch (error) {

        alert(
            error.message ||
            `Unable to ${label} account.`
        );

    }

}


/* =========================================================
   FORUM FILTER
========================================================= */

function initOverviewFilter() {

    const filter =
        el("forumFilter");

    if (!filter) {
        return;
    }


    filter.addEventListener(
        "change",
        async () => {

            selectedForum =
                filter.value ||
                "all";

            await renderForums();

            updateOverview();

        }
    );

}


/* =========================================================
   CREATE FORUM BUTTON
========================================================= */

function initCreateForum() {

    const button =
        el("createForumBtn");

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            openForumForm();

        }
    );

}


/* =========================================================
   TEAM SETTINGS
========================================================= */

function initSettings() {

    const open =
        el("teamSettingsBtn");

    const modal =
        el("settingsModal");

    const close =
        el("closeSettings");


    open?.addEventListener(
        "click",
        () => {

            modal?.classList.remove(
                "hidden"
            );

        }
    );


    close?.addEventListener(
        "click",
        () => {

            modal?.classList.add(
                "hidden"
            );

        }
    );


    modal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                modal.classList.add(
                    "hidden"
                );

            }

        }
    );

}


/* =========================================================
   PERSONAL WORKSPACE
========================================================= */

function initPersonalWorkspace() {

    el("personalWorkspaceBtn")
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../personal/personal.html";

            }
        );

}


/* =========================================================
   THEME
========================================================= */

function initTheme() {

    const button =
        el("themeToggle");

    if (!button) {
        return;
    }


    const saved =
        localStorage.getItem(
            "rigid-admin-theme"
        );


    if (
        saved ===
        "light"
    ) {

        document.body.classList.add(
            "light-theme"
        );

        button.textContent =
            "☾";

    }


    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "light-theme"
            );


            const light =
                document.body.classList.contains(
                    "light-theme"
                );


            localStorage.setItem(
                "rigid-admin-theme",
                light
                    ? "light"
                    : "dark"
            );


            button.textContent =
                light
                    ? "☾"
                    : "☼";

        }
    );

}


/* =========================================================
   SIGN OUT
========================================================= */

function initSignOut() {

    el("signOutBtn")
        ?.addEventListener(
            "click",
            async () => {

                if (
                    !confirm(
                        "Are you sure you want to sign out?"
                    )
                ) {

                    return;

                }


                const {
                    error
                } =
                    await sb.auth.signOut();


                if (error) {

                    alert(
                        error.message
                    );

                    return;

                }


                redirectToLogin();

            }
        );

}


/* =========================================================
   AUTH LISTENER
========================================================= */

function initAuthListener() {

    sb.auth.onAuthStateChange(
        (
            event,
            session
        ) => {

            if (
                event ===
                "SIGNED_OUT" ||
                !session
            ) {

                redirectToLogin();

            }

        }
    );

}


/* =========================================================
   REFRESH DATA
========================================================= */

async function refreshData() {

    try {

        await loadAllData();

        populateForumFilter();

        await renderForums();

        updateOverview();

        attachOverviewClicks();

        await loadPendingRequests();

    }

    catch (error) {

        console.error(
            "Refresh error:",
            error
        );

        alert(
            error.message ||
            "Unable to refresh administrator data."
        );

    }

}


/* =========================================================
   TASK RLS NOTICE
========================================================= */

function checkTaskAccess() {

    /*
     * This does not modify security.
     * It only reports task loading problems.
     */

    if (!tasks) {
        tasks = [];
    }

}

/* =========================================================
   MEMBER ROW → PERSONAL PAGE
========================================================= */

document.addEventListener(
    "click",
    event => {

        const row =
            event.target.closest(
                "[data-member-profile-id]"
            );

        if (!row) {
            return;
        }


        /*
         * Do nothing when the Remove button
         * itself is clicked.
         */
        if (
            event.target.closest(
                "[data-remove-member]"
            )
        ) {
            return;
        }


        const profileId =
            row.dataset.memberProfileId;


        if (!profileId) {
            return;
        }


        window.location.href =
            `../personal/personal.html?profile=${encodeURIComponent(
                profileId
            )}`;

    }
);

/* =========================================================
   INITIALIZE
========================================================= */

async function initAdmin() {


    injectAdminDynamicStyles();

    startClock();

    initTheme();

    initPersonalWorkspace();

    initSettings();

    initSignOut();

    initOverviewFilter();

    initCreateForum();


    if (
        !checkSupabaseClient()
    ) {

        return;

    }


    initAuthListener();


    const authenticated =
        await checkAuthentication();


    if (!authenticated) {
        return;
    }


    const adminLoaded =
        await loadAdminProfile();


    if (!adminLoaded) {
        return;
    }


    try {

        await loadAllData();

        populateForumFilter();

        checkTaskAccess();

        await renderForums();

        updateOverview();

        attachOverviewClicks();

        await loadPendingRequests();

    }

    catch (error) {

        console.error(
            "Admin initialization error:",
            error
        );

        alert(
            error.message ||
            "Unable to initialize administrator workspace."
        );

    }

}


/* =========================================================
   ESCAPE KEY
========================================================= */

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
                ".rigid-modal"
            )
            .forEach(
                modal => {
                    modal.remove();
                }
            );


        el("settingsModal")
            ?.classList
            .add(
                "hidden"
            );

    }
);


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initAdmin
);

