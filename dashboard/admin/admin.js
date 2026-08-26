/* =========================================================
   RiGiD ADMIN WORKSPACE
   SUPABASE BACKEND VERSION

   Connected to:

   - Supabase Auth
   - public.profiles
   - public.teams

   Features:

   - Authentication check
   - Approved admin verification
   - Real logged-in name/email
   - Real teams from Supabase
   - Add team
   - Edit team
   - Delete team
   - Real pending requests
   - Approve users
   - Reject users
   - Sign out
   - Live clock
   - Team/forum filter
   - Existing UI controls

   NOTE:
   Domains / Design / Prototype / Paper statistics
   are NOT fabricated here because no corresponding
   backend tables were provided yet.
========================================================= */


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;

let currentProfile = null;

let currentTeam = null;

let teams = [];

let domains = [];

let forums = [];

let pendingRequests = [];

let selectedForum = "all";

let editingTeamId = null;

let modalForum = null;

let modalForumId = null;

let editingForumId = null;


/* =========================================================
   ELEMENT HELPER
========================================================= */

function el(id) {

    return document.getElementById(id);

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(value) {

    if (!value) {

        return "";

    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

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
   CLOCK
========================================================= */

function startClock() {

    const clock =
        el("liveClock");

    if (!clock) {

        return;

    }


    function updateClock() {

        const now =
            new Date();


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
        typeof sb ===
        "undefined"
    ) {

        console.error(
            "Supabase client 'sb' is not available."
        );


        alert(
            "Supabase is not connected.\n\n" +
            "Check supabase-client.js and the script order in admin.html."
        );


        return false;

    }


    return true;

}


/* =========================================================
   REDIRECT TO LOGIN
========================================================= */

function redirectToLogin() {

    /*
       admin.html
       ↓
       ../login/login.html

       dashboard/admin/
       dashboard/login/
    */

    window.location.replace(
        "../../login/login.html"
    );

}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    if (
        !checkSupabaseClient()
    ) {

        return false;

    }


    try {

        const {
            data,
            error
        } =
            await sb.auth.getSession();


        if (error) {

            console.error(
                "Supabase session error:",
                error
            );


            redirectToLogin();

            return false;

        }


        if (
            !data ||
            !data.session
        ) {

            console.warn(
                "No active Supabase session."
            );


            redirectToLogin();

            return false;

        }


        currentUser =
            data.session.user;


        console.log(
            "Authenticated user:",
            currentUser
        );


        return true;

    }

    catch (error) {

        console.error(
            "Authentication exception:",
            error
        );


        redirectToLogin();

        return false;

    }

}


/* =========================================================
   LOAD CURRENT USER PROFILE
========================================================= */

async function loadAdminProfile() {

    if (!currentUser) {

        return false;

    }


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
                    status,
                    team_id,
                    created_at,
                    updated_at,
                    teams (
                        id,
                        name,
                        forum
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


            alert(
                "Unable to load your profile.\n\n" +
                error.message
            );


            return false;

        }


        if (!data) {

            console.error(
                "No profile found for:",
                currentUser.id
            );


            alert(
                "Your RiGiD profile could not be found."
            );


            await sb.auth.signOut();

            redirectToLogin();

            return false;

        }


        currentProfile =
            data;


        currentTeam =
            data.teams;


        console.log(
            "Current profile:",
            data
        );


        /* =================================================
           ADMIN SECURITY CHECK
        ================================================== */

        if (
            data.role !==
            "admin"
        ) {

            alert(
                "Access denied.\n\n" +
                "This account is not an administrator."
            );


            await sb.auth.signOut();

            redirectToLogin();

            return false;

        }


        if (
            data.status !==
            "approved"
        ) {

            alert(
                "Your administrator account is not approved."
            );


            await sb.auth.signOut();

            redirectToLogin();

            return false;

        }


        /* =================================================
           REAL EMAIL
        ================================================== */

        const email =
            data.email ||
            currentUser.email ||
            "Unknown";


        /* =================================================
           REAL NAME

           Priority:

           1. profiles.full_name
           2. Supabase Auth full_name
           3. email username
           4. Administrator
        ================================================== */

        const metadataName =
            currentUser
                ?.user_metadata
                ?.full_name;


        const name = "Gentlemen";


        /* =================================================
           UPDATE HEADER
        ================================================== */

        const nameElement =
            el("adminName");


        const emailElement =
            el("adminEmail");


        if (nameElement) {

            nameElement.textContent =
                name;

        }


        if (emailElement) {

            emailElement.textContent =
                email;

        }


        console.log(
            "Admin identity:",
            {
                name,
                email,
                role: data.role,
                status: data.status,
                team: currentTeam?.name || null
            }
        );


        return true;

    }

    catch (error) {

        console.error(
            "Unexpected profile error:",
            error
        );


        alert(
            "Unexpected error while loading your profile."
        );


        return false;

    }

}

/* =========================================================
   LOAD FORUMS FROM DATABASE
========================================================= */

async function loadForums() {

    try {

        const {
            data,
            error
        } = await sb
            .from("forums")
            .select(`
                id,
                name,
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
                "Forums loading error:",
                error
            );

            alert(
                "Unable to load forums.\n\n" +
                error.message
            );

            return;

        }


        forums =
            data || [];


        console.log(
            "Forums loaded:",
            forums
        );


        renderForumFilter();

    }

    catch (error) {

        console.error(
            "Unexpected forum loading error:",
            error
        );

    }

}

/* =========================================================
   RENDER FORUM FILTER
========================================================= */

function renderForumFilter() {

    const filter =
        el("forumFilter");


    if (!filter) {

        return;

    }


    filter.innerHTML = `

        <option value="all">
            All Forums
        </option>

    `;


    forums.forEach(
        forum => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                forum.id;


            option.textContent =
                forum.name;


            filter.appendChild(
                option
            );

        }
    );


    if (
        selectedForum !== "all" &&
        forums.some(
            forum =>
                forum.id ===
                selectedForum
        )
    ) {

        filter.value =
            selectedForum;

    }

    else {

        selectedForum =
            "all";

        filter.value =
            "all";

    }

}

/* =========================================================
   CREATE FORUM
========================================================= */

async function createForum() {

    const input =
        el("forumName");


    const name =
        input
            ?.value
            .trim();


    if (!name) {

        showForumMessage(
            "Please enter a forum name."
        );

        return;

    }


    try {

        const {
            data,
            error
        } = await sb
            .from("forums")
            .insert({
                name: name
            })
            .select(`
                id,
                name,
                created_at
            `)
            .single();


        if (error) {

            console.error(
                "Create forum error:",
                error
            );


            showForumMessage(
                error.message
            );


            return;

        }


        console.log(
            "Forum created:",
            data
        );


        forums.push(
            data
        );


        closeForumModal();


        renderForumFilter();


        /* Select newly created forum */

        selectedForum =
            data.id;


        const filter =
            el("forumFilter");


        if (filter) {

            filter.value =
                data.id;

        }


        updateOverview();


        alert(
            `Forum "${data.name}" created successfully.`
        );

    }

    catch (error) {

        console.error(
            "Unexpected create forum error:",
            error
        );


        showForumMessage(
            "Unable to create forum."
        );

    }

}

/* =========================================================
   FORUM MODAL
========================================================= */

function openCreateForumModal() {

    editingForumId =
        null;


    const modal =
        el("forumModal");


    const input =
        el("forumName");


    const message =
        el("forumMessage");


    if (input) {

        input.value =
            "";

    }


    if (message) {

        message.textContent =
            "";

        message.classList.add(
            "hidden"
        );

    }


    if (modal) {

        modal.classList.remove(
            "hidden"
        );

    }


    input?.focus();

}


/* =========================================================
   CLOSE FORUM MODAL
========================================================= */

function closeForumModal() {

    const modal =
        el("forumModal");


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }


    editingForumId =
        null;

}


/* =========================================================
   FORUM MODAL MESSAGE
========================================================= */

function showForumMessage(
    message
) {

    const box =
        el("forumMessage");


    if (!box) {

        alert(
            message
        );

        return;

    }


    box.textContent =
        message;


    box.classList.remove(
        "hidden"
    );

}

/* =========================================================
   LOAD TEAMS FROM DATABASE
========================================================= */

/* =========================================================
   LOAD TEAMS FROM DATABASE
========================================================= */

async function loadTeams() {

    try {

        const {
            data,
            error
        } = await sb
            .from("teams")
            .select(`
                id,
                name,
                forum,
                forum_id,
                created_at,
                forums (
                    id,
                    name
                )
            `)
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


        if (error) {

            console.error(
                "Teams loading error:",
                error
            );


            alert(
                "Unable to load teams.\n\n" +
                error.message
            );


            return;

        }


        teams =
            data || [];


        console.log(
            "Teams loaded:",
            teams
        );


        renderTeams();


        updateOverview();

    }

    catch (error) {

        console.error(
            "Unexpected team loading error:",
            error
        );

    }

}

/* =========================================================
   LOAD DOMAINS FROM DATABASE
========================================================= */

async function loadDomains() {

    try {

        const {
            data,
            error
        } = await sb
            .from("domains")
            .select(`
                id,
                name,
                forum_id,
                created_at,
                forums (
                    id,
                    name
                )
            `)
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


        if (error) {

            console.error(
                "Domains loading error:",
                error
            );

            alert(
                "Unable to load domains.\n\n" +
                error.message
            );

            return;

        }


        domains =
            data || [];


        console.log(
            "Domains loaded:",
            domains
        );

    }

    catch (error) {

        console.error(
            "Unexpected domain loading error:",
            error
        );

    }

}

/* =========================================================
   RENDER DOMAINS
========================================================= */


/* =========================================================
   GET TEAMS FOR FORUM
========================================================= */

function getForumTeams(
    forum
) {

    return teams.filter(
        team =>
            team.forum ===
            forum
    );

}


/* =========================================================
   RENDER TEAMS
========================================================= */

/* =========================================================
   RENDER FORUMS
   Forum → Teams + Domains
========================================================= */

function renderTeams() {

    const container =
        el("forumsContainer");


    if (!container) {

        console.error(
            "forumsContainer not found."
        );

        return;

    }


    container.innerHTML = "";


    forums.forEach(
        forum => {

            const forumSection =
                document.createElement(
                    "section"
                );


            forumSection.className =
                "forum-section";


            forumSection.dataset.forumId =
                forum.id;


            const forumTeams =
                teams.filter(
                    team =>
                        team.forum_id ===
                        forum.id
                );


            const forumDomains =
                domains.filter(
                    domain =>
                        domain.forum_id ===
                        forum.id
                );


            forumSection.innerHTML = `

                <div class="forum-header">

                    <div>

                        <div class="forum-eyebrow">
                            FORUM
                        </div>

                        <h2>
                            ${escapeHTML(
                                forum.name
                            )}
                        </h2>

                    </div>

                </div>


                <div class="forum-content">

                    <!-- =========================
                         TEAMS
                    ========================== -->

                    <div class="forum-column">

                        <div class="column-header">

                            <div>

                                <span class="column-label">
                                    TEAMS
                                </span>

                                <span
                                    class="column-count"
                                >
                                    ${forumTeams.length}
                                </span>

                            </div>


                            <button
                                class="add-btn add-team-btn"
                                type="button"
                                data-forum-id="${forum.id}"
                            >
                                <strong>+</strong>
                                <span>Add Team</span>
                            </button>

                        </div>


                        <div
                            class="team-list"
                            data-team-container="${forum.id}"
                        >

                            ${
                                forumTeams.length
                                    ? forumTeams
                                        .map(
                                            team =>
                                                renderTeamCard(
                                                    team
                                                )
                                        )
                                        .join("")
                                    : `
                                        <div class="empty-state">
                                            No teams yet.
                                        </div>
                                    `
                            }

                        </div>

                    </div>


                    <!-- =========================
                         DOMAINS
                    ========================== -->

                    <div class="forum-column">

                        <div class="column-header">

                            <div>

                                <span class="column-label">
                                    DOMAINS
                                </span>

                                <span
                                    class="column-count"
                                >
                                    ${forumDomains.length}
                                </span>

                            </div>


                            <button
                                class="add-btn add-domain-btn"
                                type="button"
                                data-forum-id="${forum.id}"
                            >
                                <strong>+</strong>
                                <span>Add Domain</span>
                            </button>

                        </div>


                        <div
                            class="team-list domain-list"
                            data-domain-container="${forum.id}"
                        >

                            ${
                                forumDomains.length
                                    ? forumDomains
                                        .map(
                                            domain =>
                                                renderDomainCard(
                                                    domain
                                                )
                                        )
                                        .join("")
                                    : `
                                        <div class="empty-state">
                                            No domains yet.
                                        </div>
                                    `
                            }

                        </div>

                    </div>

                </div>

            `;


            container.appendChild(
                forumSection
            );

        }
    );


    /*
       Attach Add Team / Add Domain buttons
    */

    container
        .querySelectorAll(
            ".add-team-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openAddTeamDynamic(
                            button.dataset.forumId
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            ".add-domain-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openAddDomainDynamic(
                            button.dataset.forumId
                        );

                    }
                );

            }
        );


    applyForumFilter();

}

/* =========================================================
   RENDER TEAM CARD
========================================================= */

function renderTeamCard(
    team
) {

    return `

        <article
            class="team-card"
            data-id="${team.id}"
        >

            <div>

                <div class="team-card-top">

                    <span class="team-index">
                        TEAM
                    </span>

                </div>


                <h3>
                    ${escapeHTML(
                        team.name
                    )}
                </h3>


                <p>
                    ${escapeHTML(
                        team.forums?.name ||
                        team.forum ||
                        ""
                    )}
                </p>

            </div>


            <div class="team-footer">

                <span>
                    Created
                    ${escapeHTML(
                        formatDate(
                            team.created_at
                        )
                    )}
                </span>

            </div>

        </article>

    `;

}

/* =========================================================
   RENDER DOMAIN CARD
========================================================= */

function renderDomainCard(
    domain
) {

    return `

        <article
            class="team-card"
            data-id="${domain.id}"
        >

            <div>

                <div class="team-card-top">

                    <span class="team-index">
                        DOMAIN
                    </span>

                </div>


                <h3>
                    ${escapeHTML(
                        domain.name
                    )}
                </h3>


                <p>
                    ${escapeHTML(
                        domain.forums?.name ||
                        ""
                    )}
                </p>

            </div>


            <div class="team-footer">

                <span>
                    Created
                    ${escapeHTML(
                        formatDate(
                            domain.created_at
                        )
                    )}
                </span>

            </div>

        </article>

    `;

}

/* =========================================================
   DYNAMIC ADD TEAM
========================================================= */

function openAddTeamDynamic(
    forumId
) {

    const forum =
        forums.find(
            item =>
                item.id ===
                forumId
        );


    if (!forum) {

        alert(
            "Forum not found."
        );

        return;

    }


    modalForum =
        forum.name;


    modalForumId =
        forum.id;


    editingTeamId =
        null;


    const modal =
        el("itemModal");


    el("modalEyebrow").textContent =
        "NEW TEAM";


    el("modalTitle").textContent =
        "Add Team";


    el("nameLabel").textContent =
        "Team Name";


    el("modalForum").value =
        forum.name;


    el("itemName").value =
        "";


    el("itemDescription").value =
        "";


    el("itemDescription").placeholder =
        "Describe this team...";


    el("descriptionGroup")
        ?.classList
        .remove("hidden");


    el("modalMessage")
        ?.classList
        .add("hidden");


    const saveButton =
        document.querySelector(
            ".save-btn"
        );


    if (saveButton) {

        saveButton.textContent =
            "Add Team";

    }


    if (modal) {

        modal.dataset.mode =
            "team";

        modal.classList.remove(
            "hidden"
        );

    }


    el("itemName")?.focus();

}

/* =========================================================
   DYNAMIC ADD DOMAIN
========================================================= */

function openAddDomainDynamic(
    forumId
) {

    const forum =
        forums.find(
            item =>
                item.id ===
                forumId
        );


    if (!forum) {

        alert(
            "Forum not found."
        );

        return;

    }


    modalForum =
        forum.name;


    modalForumId =
        forum.id;


    const modal =
        el("itemModal");


    el("modalEyebrow").textContent =
        "NEW DOMAIN";


    el("modalTitle").textContent =
        "Add Domain";


    el("nameLabel").textContent =
        "Domain Name";


    el("modalForum").value =
        forum.name;


    el("itemName").value =
        "";


    el("itemDescription").value =
        "";


    el("itemDescription").placeholder =
        "Describe this domain...";


    el("descriptionGroup")
        ?.classList
        .remove("hidden");


    el("modalMessage")
        ?.classList
        .add("hidden");


    const saveButton =
        document.querySelector(
            ".save-btn"
        );


    if (saveButton) {

        saveButton.textContent =
            "Add Domain";

    }


    if (modal) {

        modal.dataset.mode =
            "domain";

        modal.classList.remove(
            "hidden"
        );

    }


    el("itemName")?.focus();

}


/* =========================================================
   OPEN TEAM
========================================================= */

function openTeam(
    team
) {

    console.log(
        "Selected team:",
        team
    );


    /*
       The team workspace pages can be connected
       later when their backend structure is ready.
    */

    alert(
        `Team selected: ${team.name}`
    );

}


/* =========================================================
   OPEN ADD TEAM MODAL
========================================================= */

/* =========================================================
   OPEN ADD TEAM MODAL
========================================================= */



/* =========================================================
   CREATE TEAM
========================================================= */

/* =========================================================
   CREATE TEAM
========================================================= */

async function createTeam() {

    const name =
        el(
            "itemName"
        )
            ?.value
            .trim();


    if (!name) {

        showModalMessage(
            "Please enter a team name."
        );

        return;

    }


    if (!modalForumId) {

        showModalMessage(
            "Forum information is missing."
        );

        return;

    }


    try {

        const {
            data,
            error
        } =
            await sb
                .from("teams")
                .insert({

                    name: name,

                    /*
                       Keep the old forum column for
                       compatibility for now.
                    */

                    forum: modalForum,

                    /*
                       New proper relationship.
                    */

                    forum_id:
                        modalForumId

                })
                .select(`
                    id,
                    name,
                    forum,
                    forum_id,
                    created_at,
                    forums (
                        id,
                        name
                    )
                `)
                .single();


        if (error) {

            console.error(
                "Create team error:",
                error
            );


            showModalMessage(
                error.message
            );


            return;

        }


        console.log(
            "Team created:",
            data
        );


        teams.push(
            data
        );


        closeItemModal();


        renderTeams();


        updateOverview();


    }

    catch (error) {

        console.error(
            "Unexpected create team error:",
            error
        );


        showModalMessage(
            "Unable to create team."
        );

    }

}


/* =========================================================
   OPEN EDIT TEAM
========================================================= */

function openEditTeam(
    team
) {

    editingTeamId =
        team.id;


    modalForum =
        team.forum;


    el(
        "modalEyebrow"
    ).textContent =
        "EDIT TEAM";


    el(
        "modalTitle"
    ).textContent =
        "Edit Team";


    el(
        "nameLabel"
    ).textContent =
        "Team Name";


    el(
        "modalForum"
    ).value =
        team.forum;


    el(
        "itemName"
    ).value =
        team.name;


    el(
        "itemDescription"
    ).value =
        "";


    el(
        "itemDescription"
    ).placeholder =
        "Team description is not stored in the current database schema.";


    el(
        "descriptionGroup"
    )
        ?.classList
        .remove(
            "hidden"
        );


    el(
        "modalMessage"
    )
        ?.classList
        .add(
            "hidden"
        );


    const saveButton =
        document.querySelector(
            ".save-btn"
        );


    if (saveButton) {

        saveButton.textContent =
            "Save Changes";

    }


    el(
        "itemModal"
    )
        ?.classList
        .remove(
            "hidden"
        );


    el(
        "itemName"
    )?.focus();

}


/* =========================================================
   UPDATE TEAM
========================================================= */

async function updateTeam() {

    const name =
        el(
            "itemName"
        )
            ?.value
            .trim();


    if (!name) {

        showModalMessage(
            "Please enter a team name."
        );

        return;

    }


    if (!editingTeamId) {

        showModalMessage(
            "No team selected."
        );

        return;

    }


    try {

        const {
            data,
            error
        } =
            await sb
                .from("teams")
                .update({
                    name: name
                })
                .eq(
                    "id",
                    editingTeamId
                )
                .select(`
                    id,
                    name,
                    forum,
                    created_at
                `)
                .single();


        if (error) {

            console.error(
                "Update team error:",
                error
            );


            showModalMessage(
                error.message
            );


            return;

        }


        teams =
            teams.map(
                team =>
                    team.id ===
                        editingTeamId
                        ? data
                        : team
            );


        closeItemModal();


        renderTeams();


        updateOverview();


    }

    catch (error) {

        console.error(
            "Unexpected update team error:",
            error
        );


        showModalMessage(
            "Unable to update team."
        );

    }

}


/* =========================================================
   DELETE TEAM
========================================================= */

async function deleteTeam(
    team
) {

    const confirmed =
        confirm(
            `Delete team "${team.name}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const {
            error
        } =
            await sb
                .from("teams")
                .delete()
                .eq(
                    "id",
                    team.id
                );


        if (error) {

            console.error(
                "Delete team error:",
                error
            );


            alert(
                "Unable to delete team.\n\n" +
                error.message
            );


            return;

        }


        teams =
            teams.filter(
                item =>
                    item.id !==
                    team.id
            );


        renderTeams();


        updateOverview();


    }

    catch (error) {

        console.error(
            "Unexpected delete team error:",
            error
        );


        alert(
            "Unable to delete team."
        );

    }

}


/* =========================================================
   LOAD PENDING REQUESTS
========================================================= */

async function loadPendingRequests() {

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
                    status,
                    role,
                    team_id,
                    created_at,
                    teams (
                        id,
                        name,
                        forum
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


        if (error) {

            console.error(
                "Pending request error:",
                error
            );


            alert(
                "Unable to load pending requests.\n\n" +
                error.message
            );


            return;

        }


        pendingRequests =
            data || [];


        console.log(
            "Pending requests:",
            pendingRequests
        );


        renderPendingRequests();

    }

    catch (error) {

        console.error(
            "Unexpected pending request error:",
            error
        );

    }

}


/* =========================================================
   RENDER PENDING REQUESTS
========================================================= */

function renderPendingRequests() {

    const container =
        el(
            "pendingRequests"
        );


    const badge =
        el(
            "pendingBadge"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (badge) {

        badge.textContent =
            pendingRequests.length;

    }


    if (
        pendingRequests.length ===
        0
    ) {

        container.innerHTML = `

            <div
                style="
                    padding: 30px;
                    text-align: center;
                    color: #8997aa;
                "
            >
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


            const displayName =
                request.full_name?.trim() ||
                request.email;


            const forum =
                request
                    .teams
                    ?.forum ||
                "No Forum";


            const team =
                request
                    .teams
                    ?.name ||
                "No Team";


            item.innerHTML = `

                <div>

                    <div class="pending-email">

                        ${escapeHTML(
                displayName
            )}

                    </div>


                    <div class="pending-meta">

                        ${escapeHTML(
                request.email
            )}

                    </div>

                </div>


                <div class="pending-meta">

                    <span class="pending-forum">

                        ${escapeHTML(
                forum
            )}

                    </span>

                    /

                    ${escapeHTML(
                team
            )}

                    <br>

                    Applied:

                    ${escapeHTML(
                formatDate(
                    request.created_at
                )
            )}

                </div>


                <div class="pending-actions">

                    <button
                        class="approve-btn"
                        type="button"
                    >
                        Approve
                    </button>


                    <button
                        class="reject-btn"
                        type="button"
                    >
                        Reject
                    </button>

                </div>

            `;


            const approveButton =
                item.querySelector(
                    ".approve-btn"
                );


            const rejectButton =
                item.querySelector(
                    ".reject-btn"
                );


            approveButton?.addEventListener(
                "click",
                () => {

                    updateUserStatus(
                        request.id,
                        "approved"
                    );

                }
            );


            rejectButton?.addEventListener(
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
   UPDATE USER STATUS
========================================================= */

async function updateUserStatus(
    userId,
    status
) {

    if (!userId) {

        return;

    }


    const action =
        status ===
            "approved"
            ? "approve"
            : "reject";


    const confirmed =
        confirm(
            `Are you sure you want to ${action} this account?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const updateData = {

            status: status

        };


        if (
            status ===
            "approved"
        ) {

            updateData.approved_at =
                new Date().toISOString();


            updateData.approved_by =
                currentUser.id;

        }


        else {

            updateData.approved_at =
                null;


            updateData.approved_by =
                null;

        }


        const {
            error
        } =
            await sb
                .from("profiles")
                .update(
                    updateData
                )
                .eq(
                    "id",
                    userId
                );


        if (error) {

            console.error(
                "Profile status update error:",
                error
            );


            alert(
                "Unable to update account.\n\n" +
                error.message
            );


            return;

        }


        await loadPendingRequests();

    }

    catch (error) {

        console.error(
            "Unexpected status update error:",
            error
        );


        alert(
            "Unable to update account."
        );

    }

}


/* =========================================================
   OVERVIEW
   ---------------------------------------------------------
   Since the current backend schema only contains
   teams and profiles, real Design / Prototype / Paper
   statistics cannot be calculated yet.

   Therefore this function does NOT use fake numbers.
========================================================= */

function updateOverview() {

    const selected =
        selectedForum ||
        "all";


    const stats = {

        design: {
            ongoing: 0,
            completed: 0
        },

        prototype: {
            ongoing: 0,
            completed: 0
        },

        paper: {
            ongoing: 0,
            completed: 0
        }

    };


    /*
       These values intentionally remain zero until
       the project/work-item backend tables exist.
    */


    updateNumber(
        "designOngoing",
        stats.design.ongoing
    );


    updateNumber(
        "designCompleted",
        stats.design.completed
    );


    updateNumber(
        "prototypeOngoing",
        stats.prototype.ongoing
    );


    updateNumber(
        "prototypeCompleted",
        stats.prototype.completed
    );


    updateNumber(
        "paperOngoing",
        stats.paper.ongoing
    );


    updateNumber(
        "paperCompleted",
        stats.paper.completed
    );


    const selectedForumData =
        forums.find(
            forum =>
                forum.id ===
                selected
        );


    const label =
        el(
            "overviewFilterLabel"
        );


    if (label) {

        if (
            selected === "all"
        ) {

            label.textContent =
                "Showing All Forums";

        }

        else if (
            selectedForumData
        ) {

            label.textContent =
                `Showing ${selectedForumData.name}`;

        }

        else {

            label.textContent =
                "Showing All Forums";

        }

    }

}


/* =========================================================
   UPDATE NUMBER
========================================================= */

function updateNumber(
    id,
    value
) {

    const element =
        el(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   FORUM FILTER
========================================================= */

function initOverviewFilter() {

    const filter =
        el(
            "forumFilter"
        );


    if (!filter) {

        return;

    }


    filter.addEventListener(
        "change",
        () => {

            selectedForum =
                filter.value ||
                "all";


            applyForumFilter();

            updateOverview();

        }
    );


    selectedForum =
        filter.value ||
        "all";


    applyForumFilter();

    updateOverview();

}


/* =========================================================
   APPLY FORUM FILTER
========================================================= */

/* =========================================================
   APPLY FORUM FILTER
========================================================= */

function applyForumFilter() {

    const container =
        el("forumsContainer");


    if (!container) {

        return;

    }


    const sections =
        container.querySelectorAll(
            ".forum-section"
        );


    sections.forEach(
        section => {

            const forumId =
                section.dataset.forumId;


            if (
                selectedForum === "all"
            ) {

                section.style.display =
                    "";

                return;

            }


            section.style.display =
                forumId === selectedForum
                    ? ""
                    : "none";

        }
    );

}

/* =========================================================
   OPEN ADD DOMAIN
========================================================= */



/* =========================================================
   CREATE DOMAIN
========================================================= */

async function createDomain() {

    const name =
        el("itemName")
            ?.value
            .trim();


    if (!name) {

        showModalMessage(
            "Please enter a domain name."
        );

        return;

    }


    const forum =
        forums.find(
            item =>
                item.name ===
                modalForum
        );


    if (!forum) {

        showModalMessage(
            "Forum could not be found."
        );

        return;

    }


    try {

        const {
            data,
            error
        } = await sb
            .from("domains")
            .insert({
                name: name,
                forum_id: forum.id
            })
            .select(`
                id,
                name,
                forum_id,
                created_at,
                forums (
                    id,
                    name
                )
            `)
            .single();


        if (error) {

            console.error(
                "Create domain error:",
                error
            );

            showModalMessage(
                error.message
            );

            return;

        }


        domains.push(
    data
);

closeItemModal();

renderTeams();

updateOverview();


        alert(
            `Domain "${data.name}" created successfully.`
        );

    }

    catch (error) {

        console.error(
            "Unexpected create domain error:",
            error
        );

        showModalMessage(
            "Unable to create domain."
        );

    }

}

/* =========================================================
   ADD BUTTONS
========================================================= */

function initAddButtons() {

    document
        .querySelectorAll(
            ".add-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const action =
                            button.dataset.action;


                        const forum =
                            button.dataset.forum;


                        if (
                            action ===
                            "add-team"
                        ) {

                            openAddTeam(
                                forum
                            );

                            return;

                        }


                        /*
                           Domains are not connected because
                           no domains table was included in the
                           backend schema yet.
                        */

                        if (
                            action ===
                            "add-domain"
                        ) {

                            openAddDomain(
                                forum
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   MODAL
========================================================= */

/* =========================================================
   FORUM BUTTON
========================================================= */

function initForumControls() {

    const createButton =
        el("createForumBtn");


    const closeButton =
        el("closeForumModal");


    const cancelButton =
        el("cancelForumModal");


    const modal =
        el("forumModal");


    const form =
        el("forumForm");


    createButton?.addEventListener(
        "click",
        openCreateForumModal
    );


    closeButton?.addEventListener(
        "click",
        closeForumModal
    );


    cancelButton?.addEventListener(
        "click",
        closeForumModal
    );


    form?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await createForum();

        }
    );


    modal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                closeForumModal();

            }

        }
    );

}

function initModal() {

    const closeButton =
        el(
            "closeModal"
        );


    const cancelButton =
        el(
            "cancelModal"
        );


    const form =
        el(
            "itemForm"
        );


    const itemModal =
        el(
            "itemModal"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeItemModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeItemModal
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                if (
                    itemModal.dataset.mode ===
                    "domain"
                ) {

                    await createDomain();

                }

                else if (
                    editingTeamId
                ) {

                    await updateTeam();

                }

                else {

                    await createTeam();

                }

            }
        );

    }


    if (itemModal) {

        itemModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    itemModal
                ) {

                    closeItemModal();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeItemModal();

            }

        }
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeItemModal() {

    const modal =
        el(
            "itemModal"
        );


    if (modal) {

        modal.dataset.mode =
            "";

        modal.classList.add(
            "hidden"
        );

    }


    editingTeamId =
        null;


    modalForum =
        null;


    modalForumId =
        null;


    const message =
        el(
            "modalMessage"
        );


    if (message) {

        message.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   MODAL MESSAGE
========================================================= */

function showModalMessage(
    message
) {

    const box =
        el(
            "modalMessage"
        );


    if (!box) {

        alert(
            message
        );

        return;

    }


    box.textContent =
        message;


    box.classList
        .remove(
            "hidden"
        );

}


/* =========================================================
   THEME TOGGLE
========================================================= */

function initTheme() {

    const button =
        el("themeToggle");

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "light-theme"
            );


            const isLight =
                document.body.classList.contains(
                    "light-theme"
                );


            /* Change icon */

            button.textContent =
                isLight
                    ? "☾"
                    : "☼";


            /* Change tooltip */

            button.title =
                isLight
                    ? "Switch to dark theme"
                    : "Switch to light theme";

        }
    );

}


/* =========================================================
   PERSONAL WORKSPACE
========================================================= */

function initPersonalWorkspace() {

    const button =
        el(
            "personalWorkspaceBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            window.location.href =
                "../personal/personal.html";

        }
    );

}


/* =========================================================
   TEAM SETTINGS
========================================================= */

function initSettings() {

    const openButton =
        el(
            "teamSettingsBtn"
        );


    const modal =
        el(
            "settingsModal"
        );


    const closeButton =
        el(
            "closeSettings"
        );


    if (
        openButton &&
        modal
    ) {

        openButton.addEventListener(
            "click",
            () => {

                modal
                    .classList
                    .remove(
                        "hidden"
                    );

            }
        );

    }


    if (
        closeButton &&
        modal
    ) {

        closeButton.addEventListener(
            "click",
            () => {

                modal
                    .classList
                    .add(
                        "hidden"
                    );

            }
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    modal
                        .classList
                        .add(
                            "hidden"
                        );

                }

            }
        );

    }

}


/* =========================================================
   SIGN OUT
========================================================= */

async function signOut() {

    const confirmed =
        confirm(
            "Are you sure you want to sign out?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const {
            error
        } =
            await sb.auth.signOut();


        if (error) {

            console.error(
                "Sign out error:",
                error
            );


            alert(
                "Unable to sign out.\n\n" +
                error.message
            );


            return;

        }


        /*
           IMPORTANT:

           admin.html
           ↓
           ../login/login.html

           Because:

           dashboard/admin/
           dashboard/login/
        */

        window.location.replace(
            "../../login/login.html"
        );

    }

    catch (error) {

        console.error(
            "Unexpected sign out error:",
            error
        );


        alert(
            "Something went wrong while signing out."
        );

    }

}


/* =========================================================
   SIGN OUT BUTTON
========================================================= */

function initSignOut() {

    const button =
        el(
            "signOutBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        signOut
    );

}


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

function initAuthListener() {

    if (
        typeof sb ===
        "undefined"
    ) {

        return;

    }


    sb.auth.onAuthStateChange(
        (
            event,
            session
        ) => {

            console.log(
                "Auth event:",
                event
            );


            if (
                event ===
                "SIGNED_OUT" ||
                !session
            ) {

                /*
                   Avoid repeatedly redirecting during
                   initial page loading.
                */

                if (
                    window.location.pathname
                        .includes(
                            "/admin/"
                        )
                ) {

                    redirectToLogin();

                }

            }

        }
    );

}


/* =========================================================
   INITIALIZE ADMIN
========================================================= */

async function initAdmin() {

    console.log(
        "RiGiD Admin Workspace starting..."
    );


    /* =====================================================
       BASIC UI
    ====================================================== */

    startClock();

    initTheme();

    initPersonalWorkspace();

    initSettings();

    initSignOut();

    initAddButtons();

    initForumControls();

    initModal();

    initOverviewFilter();


    /* =====================================================
       SUPABASE
    ====================================================== */

    if (
        !checkSupabaseClient()
    ) {

        return;

    }


    initAuthListener();


    /* =====================================================
       CHECK LOGIN
    ====================================================== */

    const authenticated =
        await checkAuthentication();


    if (!authenticated) {

        return;

    }


    /* =====================================================
       LOAD ADMIN
    ====================================================== */

    const adminLoaded =
        await loadAdminProfile();


    if (!adminLoaded) {

        return;

    }


    /* =====================================================
       LOAD REAL DATABASE DATA
    ====================================================== */

    await loadForums();

    await loadTeams();

    await loadDomains();

    await loadPendingRequests();


    console.log(
        "===================================="
    );

    console.log(
        "RiGiD Admin Workspace connected."
    );

    console.log(
        "User:",
        currentUser.email
    );

    console.log(
        "Role:",
        currentProfile.role
    );

    console.log(
        "Status:",
        currentProfile.status
    );

    console.log(
        "Teams:",
        teams.length
    );

    console.log(
        "Pending:",
        pendingRequests.length
    );

    console.log(
        "===================================="

    );

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initAdmin
);