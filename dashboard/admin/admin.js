/* =========================================================
   RiGiD ADMIN WORKSPACE
   FRONTEND / MOCK DATA VERSION

   Includes:
   - Re / iQube / Garage
   - Teams
   - Domains
   - Team add/edit/delete
   - Domain add/edit/delete
   - Pending requests
   - Workspace overview
   - Design / Prototype / Paper statistics
   - Forum filter
   - Live clock
   - Header controls
========================================================= */


/* =========================================================
   ADMIN DATA
========================================================= */

const adminData = {

    name:
        "Gentleman",

    email:
        "admin@kct.ac.in"

};


/* =========================================================
   FORUM DATA
========================================================= */

const forums = {


    /* =====================================================
       RE
    ====================================================== */

    re: {

        name:
            "Re",

        teams: [

            {
                id:
                    1,

                name:
                    "Sulal",

                description:
                    "Renewable energy and sustainable technology team."
            },

            {
                id:
                    2,

                name:
                    "Team Alpha",

                description:
                    "Advanced engineering research and development."
            }

        ],


        domains: [

            {
                id:
                    101,

                name:
                    "Renewable Energy",

                description:
                    "Development of renewable energy technologies and sustainable power systems."
            },

            {
                id:
                    102,

                name:
                    "Automotive Research",

                description:
                    "Research and development in automotive systems, mobility and vehicle technology."
            },

            {
                id:
                    103,

                name:
                    "Power Systems",

                description:
                    "Research involving electrical power generation, transmission, distribution and grid systems."
            }

        ]

    },


    /* =====================================================
       IQUBE
    ====================================================== */

    iqube: {

        name:
            "iQube",

        teams: [

            {
                id:
                    3,

                name:
                    "Aerial Robotics",

                description:
                    "Autonomous aerial systems and robotics."
            },

            {
                id:
                    4,

                name:
                    "Team Vision",

                description:
                    "Technology innovation and intelligent systems."
            }

        ],


        domains: [

            {
                id:
                    104,

                name:
                    "Mechanical",

                description:
                    "Mechanical design, manufacturing, mechanisms and engineering systems."
            },

            {
                id:
                    105,

                name:
                    "Robotics",

                description:
                    "Robotic systems, automation, control and intelligent machines."
            },

            {
                id:
                    106,

                name:
                    "Artificial Intelligence",

                description:
                    "AI, machine learning, intelligent systems and data-driven technologies."
            }

        ]

    },


    /* =====================================================
       GARAGE
    ====================================================== */

    garage: {

        name:
            "Garage",

        teams: [

            {
                id:
                    5,

                name:
                    "Sea Sakthi",

                description:
                    "Marine engineering and sustainable ocean technology."
            },

            {
                id:
                    6,

                name:
                    "Incraft",

                description:
                    "Creative engineering and prototype development."
            },

            {
                id:
                    7,

                name:
                    "Renew",

                description:
                    "Sustainable products and renewable technology."
            }

        ],


        domains: [

            {
                id:
                    107,

                name:
                    "Mechanical",

                description:
                    "Mechanical design, manufacturing, mechanisms and engineering systems."
            },

            {
                id:
                    108,

                name:
                    "Robotics",

                description:
                    "Robotic systems, automation, control and intelligent machines."
            },

            {
                id:
                    109,

                name:
                    "Artificial Intelligence",

                description:
                    "AI, machine learning, intelligent systems and data-driven technologies."
            }

        ]

    }

};


/* =========================================================
   PENDING REQUESTS
========================================================= */

let pendingRequests = [

    {
        id:
            1,

        email:
            "student1@kct.ac.in",

        forum:
            "Re",

        team:
            "Sulal",

        date:
            "16 Aug 2026"

    },

    {
        id:
            2,

        email:
            "student2@kct.ac.in",

        forum:
            "iQube",

        team:
            "Aerial Robotics",

        date:
            "16 Aug 2026"

    },

    {
        id:
            3,

        email:
            "student3@kct.ac.in",

        forum:
            "Garage",

        team:
            "Incraft",

        date:
            "15 Aug 2026"

    }

];


/* =========================================================
   WORKSPACE OVERVIEW DATA
   ---------------------------------------------------------
   Temporary frontend values.
   Backend will replace these later.
========================================================= */

const overviewStats = {

    re: {

        design: {
            ongoing: 4,
            completed: 8
        },

        prototype: {
            ongoing: 5,
            completed: 11
        },

        paper: {
            ongoing: 3,
            completed: 7
        }

    },


    iqube: {

        design: {
            ongoing: 6,
            completed: 12
        },

        prototype: {
            ongoing: 4,
            completed: 9
        },

        paper: {
            ongoing: 5,
            completed: 10
        }

    },


    garage: {

        design: {
            ongoing: 3,
            completed: 6
        },

        prototype: {
            ongoing: 7,
            completed: 13
        },

        paper: {
            ongoing: 2,
            completed: 5
        }

    }

};


/* =========================================================
   MODAL STATE
========================================================= */

let modalMode =
    "team";


let modalForum =
    null;


let editingDomainId =
    null;


let editingTeamId =
    null;


/* =========================================================
   ELEMENT HELPER
========================================================= */

function el(id) {

    return document.getElementById(
        id
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


/* =========================================================
   CLOCK
========================================================= */

function startClock() {

    const clock =
        el(
            "liveClock"
        );


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
                    weekday:
                        "short",

                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric"
                }
            );


        const time =
            now.toLocaleTimeString();


        clock.textContent =
            `${date}  /  ${time}`;

    }


    updateClock();


    setInterval(
        updateClock,
        1000
    );

}


/* =========================================================
   ADMIN INFO
========================================================= */

function loadAdminInfo() {

    const nameElement =
        el(
            "adminName"
        );


    const emailElement =
        el(
            "adminEmail"
        );


    if (nameElement) {

        nameElement.textContent =
            adminData.name;

    }


    if (emailElement) {

        emailElement.textContent =
            adminData.email;

    }

}


/* =========================================================
   RENDER ALL FORUMS
========================================================= */

function renderForums() {

    renderForum(
        "re",
        "reTeams",
        "reDomains",
        "reTeamCount",
        "reDomainCount"
    );


    renderForum(
        "iqube",
        "iqubeTeams",
        "iqubeDomains",
        "iqubeTeamCount",
        "iqubeDomainCount"
    );


    renderForum(
        "garage",
        "garageTeams",
        "garageDomains",
        "garageTeamCount",
        "garageDomainCount"
    );

}


/* =========================================================
   RENDER ONE FORUM
========================================================= */

function renderForum(
    forumId,
    teamContainerId,
    domainContainerId,
    teamCountId,
    domainCountId
) {

    const forum =
        forums[
            forumId
        ];


    if (!forum) {

        return;

    }


    const teamContainer =
        el(
            teamContainerId
        );


    const domainContainer =
        el(
            domainContainerId
        );


    if (
        !teamContainer ||
        !domainContainer
    ) {

        return;

    }


    teamContainer.innerHTML =
        "";


    domainContainer.innerHTML =
        "";


    /* =====================================================
       COUNTS
    ====================================================== */

    const teamCount =
        el(
            teamCountId
        );


    const domainCount =
        el(
            domainCountId
        );


    if (teamCount) {

        teamCount.textContent =
            forum.teams.length;

    }


    if (domainCount) {

        domainCount.textContent =
            forum.domains.length;

    }


    /* =====================================================
       TEAMS
    ====================================================== */

    forum.teams.forEach(
        (
            team,
            index
        ) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "team-card";


            card.dataset.id =
                team.id;


            card.dataset.forum =
                forumId;


            card.innerHTML = `

                <div>

                    <div class="team-card-top">

                        <span class="team-index">

                            TEAM
                            ${String(
                                index + 1
                            ).padStart(
                                2,
                                "0"
                            )}

                        </span>


                        <div class="team-actions">

                            <button
                                class="team-action edit-team"
                                title="Edit team"
                                type="button"
                            >
                                ✎
                            </button>


                            <button
                                class="team-action delete-team"
                                title="Delete team"
                                type="button"
                            >
                                ×
                            </button>

                        </div>

                    </div>


                    <h3>

                        ${escapeHTML(
                            team.name
                        )}

                    </h3>


                    <p>

                        ${escapeHTML(
                            team.description ||
                            "No description provided."
                        )}

                    </p>

                </div>


                <div class="team-footer">

                    <span>
                        Team Workspace
                    </span>


                    <span class="open-team">
                        Open →
                    </span>

                </div>

            `;


            /* =================================================
               EDIT TEAM
            ================================================== */

            const editButton =
                card.querySelector(
                    ".edit-team"
                );


            if (editButton) {

                editButton.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        openEditTeam(
                            forumId,
                            team.id
                        );

                    }
                );

            }


            /* =================================================
               DELETE TEAM
            ================================================== */

            const deleteButton =
                card.querySelector(
                    ".delete-team"
                );


            if (deleteButton) {

                deleteButton.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        deleteTeam(
                            forumId,
                            team.id
                        );

                    }
                );

            }


            /* =================================================
               OPEN TEAM
            ================================================== */

            card.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            ".team-actions"
                        )
                    ) {

                        return;

                    }


                    openTeam(
                        forumId,
                        team.id
                    );

                }
            );


            teamContainer.appendChild(
                card
            );

        }
    );


    /* =====================================================
       DOMAINS
    ====================================================== */

    forum.domains.forEach(
        domain => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "domain-card";


            card.dataset.id =
                domain.id;


            card.dataset.forum =
                forumId;


            card.innerHTML = `

                <div>

                    <div class="domain-main">

                        <span class="domain-dot">
                        </span>


                        <span class="domain-name">

                            ${escapeHTML(
                                domain.name
                            )}

                        </span>

                    </div>


                    <p class="domain-description">

                        ${escapeHTML(
                            domain.description ||
                            "No description provided."
                        )}

                    </p>


                    <div class="domain-label">
                        DOMAIN
                    </div>

                </div>


                <div class="domain-actions">

                    <button
                        class="domain-action edit-domain"
                        title="Edit domain"
                        type="button"
                    >
                        ✎
                    </button>


                    <button
                        class="domain-action delete-domain"
                        title="Delete domain"
                        type="button"
                    >
                        ×
                    </button>

                </div>

            `;


            /* =================================================
               EDIT DOMAIN
            ================================================== */

            card
                .querySelector(
                    ".edit-domain"
                )
                .addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        openEditDomain(
                            forumId,
                            domain.id
                        );

                    }
                );


            /* =================================================
               DELETE DOMAIN
            ================================================== */

            card
                .querySelector(
                    ".delete-domain"
                )
                .addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        deleteDomain(
                            forumId,
                            domain.id
                        );

                    }
                );


            domainContainer.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   OPEN TEAM
========================================================= */

function openTeam(
    forumId,
    teamId
) {

    const forum =
        forums[
            forumId
        ];


    if (!forum) {

        return;

    }


    const team =
        forum.teams.find(
            item =>
                item.id ===
                teamId
        );


    if (!team) {

        return;

    }


    alert(
        `Opening ${team.name} workspace`
    );

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


                        openItemModal(
                            action,
                            forum
                        );

                    }
                );

            }
        );

}


/* =========================================================
   OPEN ADD MODAL
========================================================= */

function openItemModal(
    type,
    forumId
) {

    modalMode =
        type ===
        "add-domain"
            ?
            "domain"
            :
            "team";


    modalForum =
        forumId;


    editingDomainId =
        null;


    editingTeamId =
        null;


    const forum =
        forums[
            forumId
        ];


    if (!forum) {

        return;

    }


    el(
        "modalForum"
    ).value =
        forum.name;


    el(
        "itemName"
    ).value =
        "";


    el(
        "itemDescription"
    ).value =
        "";


    el(
        "modalMessage"
    )
        .classList
        .add(
            "hidden"
        );


    if (
        modalMode ===
        "team"
    ) {

        el(
            "modalEyebrow"
        ).textContent =
            "NEW TEAM";


        el(
            "modalTitle"
        ).textContent =
            "Add Team";


        el(
            "nameLabel"
        ).textContent =
            "Team Name";


        el(
            "itemName"
        ).placeholder =
            "Enter team name";


        el(
            "itemDescription"
        ).placeholder =
            "Describe this team...";


        el(
            "descriptionGroup"
        )
            .classList
            .remove(
                "hidden"
            );


        document
            .querySelector(
                ".save-btn"
            )
            .textContent =
            "Add Team";

    }


    else {

        el(
            "modalEyebrow"
        ).textContent =
            "NEW DOMAIN";


        el(
            "modalTitle"
        ).textContent =
            "Add Domain";


        el(
            "nameLabel"
        ).textContent =
            "Domain Name";


        el(
            "itemName"
        ).placeholder =
            "Enter domain name";


        el(
            "itemDescription"
        ).placeholder =
            "Describe this domain...";


        el(
            "descriptionGroup"
        )
            .classList
            .remove(
                "hidden"
            );


        document
            .querySelector(
                ".save-btn"
            )
            .textContent =
            "Add Domain";

    }


    el(
        "itemModal"
    )
        .classList
        .remove(
            "hidden"
        );


    el(
        "itemName"
    ).focus();

}


/* =========================================================
   CLOSE ITEM MODAL
========================================================= */

function closeItemModal() {

    const modal =
        el(
            "itemModal"
        );


    if (!modal) {

        return;

    }


    modal
        .classList
        .add(
            "hidden"
        );


    modalMode =
        "team";


    modalForum =
        null;


    editingDomainId =
        null;


    editingTeamId =
        null;

}


/* =========================================================
   SAVE TEAM / DOMAIN
========================================================= */

function saveItem(
    event
) {

    event.preventDefault();


    const name =
        el(
            "itemName"
        )
            .value
            .trim();


    const description =
        el(
            "itemDescription"
        )
            .value
            .trim();


    if (!name) {

        showModalMessage(
            "Please enter a name."
        );

        return;

    }


    if (!modalForum) {

        showModalMessage(
            "Forum information is missing."
        );

        return;

    }


    const forum =
        forums[
            modalForum
        ];


    if (!forum) {

        showModalMessage(
            "Forum not found."
        );

        return;

    }


    /* =====================================================
       EDIT DOMAIN
    ====================================================== */

    if (
        editingDomainId !==
        null
    ) {

        const domain =
            forum.domains.find(
                item =>
                    item.id ===
                    editingDomainId
            );


        if (domain) {

            domain.name =
                name;


            domain.description =
                description ||
                "No description provided.";

        }


        closeItemModal();

        renderForums();

        return;

    }


    /* =====================================================
       EDIT TEAM
    ====================================================== */

    if (
        editingTeamId !==
        null
    ) {

        const team =
            forum.teams.find(
                item =>
                    item.id ===
                    editingTeamId
            );


        if (team) {

            team.name =
                name;


            team.description =
                description ||
                "No description provided.";

        }


        closeItemModal();

        renderForums();

        return;

    }


    /* =====================================================
       ADD TEAM
    ====================================================== */

    if (
        modalMode ===
        "team"
    ) {

        forum.teams.push({

            id:
                Date.now(),

            name:
                name,

            description:
                description ||
                "No description provided."

        });

    }


    /* =====================================================
       ADD DOMAIN
    ====================================================== */

    else {

        forum.domains.push({

            id:
                Date.now(),

            name:
                name,

            description:
                description ||
                "No description provided."

        });

    }


    closeItemModal();

    renderForums();

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
   EDIT DOMAIN
========================================================= */

function openEditDomain(
    forumId,
    domainId
) {

    const forum =
        forums[
            forumId
        ];


    if (!forum) {

        return;

    }


    const domain =
        forum.domains.find(
            item =>
                item.id ===
                domainId
        );


    if (!domain) {

        return;

    }


    modalMode =
        "domain";


    modalForum =
        forumId;


    editingDomainId =
        domainId;


    editingTeamId =
        null;


    el(
        "modalEyebrow"
    ).textContent =
        "EDIT DOMAIN";


    el(
        "modalTitle"
    ).textContent =
        "Edit Domain";


    el(
        "nameLabel"
    ).textContent =
        "Domain Name";


    el(
        "modalForum"
    ).value =
        forum.name;


    el(
        "itemName"
    ).value =
        domain.name;


    el(
        "itemDescription"
    ).value =
        domain.description ||
        "";


    el(
        "itemDescription"
    ).placeholder =
        "Describe this domain...";


    el(
        "descriptionGroup"
    )
        .classList
        .remove(
            "hidden"
        );


    el(
        "modalMessage"
    )
        .classList
        .add(
            "hidden"
        );


    document
        .querySelector(
            ".save-btn"
        )
        .textContent =
        "Save Changes";


    el(
        "itemModal"
    )
        .classList
        .remove(
            "hidden"
        );


    el(
        "itemName"
    ).focus();

}


/* =========================================================
   EDIT TEAM
========================================================= */

function openEditTeam(
    forumId,
    teamId
) {

    const forum =
        forums[
            forumId
        ];


    if (!forum) {

        return;

    }


    const team =
        forum.teams.find(
            item =>
                item.id ===
                teamId
        );


    if (!team) {

        return;

    }


    modalMode =
        "team";


    modalForum =
        forumId;


    editingDomainId =
        null;


    editingTeamId =
        teamId;


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
        forum.name;


    el(
        "itemName"
    ).value =
        team.name;


    el(
        "itemDescription"
    ).value =
        team.description ||
        "";


    el(
        "itemDescription"
    ).placeholder =
        "Describe this team...";


    el(
        "descriptionGroup"
    )
        .classList
        .remove(
            "hidden"
        );


    el(
        "modalMessage"
    )
        .classList
        .add(
            "hidden"
        );


    document
        .querySelector(
            ".save-btn"
        )
        .textContent =
        "Save Changes";


    el(
        "itemModal"
    )
        .classList
        .remove(
            "hidden"
        );


    el(
        "itemName"
    ).focus();

}


/* =========================================================
   DELETE DOMAIN
========================================================= */

function deleteDomain(
    forumId,
    domainId
) {

    const forum =
        forums[
            forumId
        ];


    if (!forum) {

        return;

    }


    const domain =
        forum.domains.find(
            item =>
                item.id ===
                domainId
        );


    if (!domain) {

        return;

    }


    const confirmed =
        confirm(
            `Delete domain "${domain.name}"?`
        );


    if (!confirmed) {

        return;

    }


    forum.domains =
        forum.domains.filter(
            item =>
                item.id !==
                domainId
        );


    renderForums();

}


/* =========================================================
   DELETE TEAM
========================================================= */

function deleteTeam(
    forumId,
    teamId
) {

    const forum =
        forums[
            forumId
        ];


    if (!forum) {

        return;

    }


    const team =
        forum.teams.find(
            item =>
                item.id ===
                teamId
        );


    if (!team) {

        return;

    }


    const confirmed =
        confirm(
            `Delete team "${team.name}"?`
        );


    if (!confirmed) {

        return;

    }


    forum.teams =
        forum.teams.filter(
            item =>
                item.id !==
                teamId
        );


    renderForums();

}


/* =========================================================
   PENDING REQUESTS
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


            item.innerHTML = `

                <div>

                    <div class="pending-email">

                        ${escapeHTML(
                            request.email
                        )}

                    </div>

                </div>


                <div class="pending-meta">

                    <span class="pending-forum">

                        ${escapeHTML(
                            request.forum
                        )}

                    </span>

                    /

                    ${escapeHTML(
                        request.team
                    )}

                    <br>

                    ${escapeHTML(
                        request.date
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


            item
                .querySelector(
                    ".approve-btn"
                )
                .addEventListener(
                    "click",
                    () => {

                        approveRequest(
                            request.id
                        );

                    }
                );


            item
                .querySelector(
                    ".reject-btn"
                )
                .addEventListener(
                    "click",
                    () => {

                        rejectRequest(
                            request.id
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
   APPROVE REQUEST
========================================================= */

function approveRequest(
    requestId
) {

    const request =
        pendingRequests.find(
            item =>
                item.id ===
                requestId
        );


    if (!request) {

        return;

    }


    const confirmed =
        confirm(
            `Approve ${request.email}?`
        );


    if (!confirmed) {

        return;

    }


    pendingRequests =
        pendingRequests.filter(
            item =>
                item.id !==
                requestId
        );


    renderPendingRequests();


    alert(
        `${request.email} approved.`
    );

}


/* =========================================================
   REJECT REQUEST
========================================================= */

function rejectRequest(
    requestId
) {

    const request =
        pendingRequests.find(
            item =>
                item.id ===
                requestId
        );


    if (!request) {

        return;

    }


    const confirmed =
        confirm(
            `Reject ${request.email}?`
        );


    if (!confirmed) {

        return;

    }


    pendingRequests =
        pendingRequests.filter(
            item =>
                item.id !==
                requestId
        );


    renderPendingRequests();

}


/* =========================================================
   WORKSPACE OVERVIEW
========================================================= */

function initOverview() {

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

            updateOverview(
                filter.value
            );

        }
    );


    updateOverview(
        filter.value ||
        "all"
    );

}


/* =========================================================
   UPDATE OVERVIEW
========================================================= */

function updateOverview(
    selectedForum
) {

    let data;


    /* =====================================================
       ALL FORUMS
    ====================================================== */

    if (
        selectedForum ===
        "all"
    ) {

        data =
            combineOverviewStats();

    }


    /* =====================================================
       SINGLE FORUM
    ====================================================== */

    else {

        data =
            overviewStats[
                selectedForum
            ];

    }


    if (!data) {

        return;

    }


    updateOverviewNumber(
        "designOngoing",
        data.design.ongoing
    );


    updateOverviewNumber(
        "designCompleted",
        data.design.completed
    );


    updateOverviewNumber(
        "prototypeOngoing",
        data.prototype.ongoing
    );


    updateOverviewNumber(
        "prototypeCompleted",
        data.prototype.completed
    );


    updateOverviewNumber(
        "paperOngoing",
        data.paper.ongoing
    );


    updateOverviewNumber(
        "paperCompleted",
        data.paper.completed
    );


    /* =====================================================
       FILTER LABEL
    ====================================================== */

    const labels = {

        all:
            "Showing All Forums",

        re:
            "Showing Re",

        iqube:
            "Showing iQube",

        garage:
            "Showing Garage"

    };


    const label =
        labels[
            selectedForum
        ] ||
        labels.all;


    const labelElement =
        el(
            "overviewFilterLabel"
        );


    if (labelElement) {

        labelElement.textContent =
            label;

    }

}


/* =========================================================
   UPDATE OVERVIEW NUMBER
========================================================= */

function updateOverviewNumber(
    id,
    value
) {

    const element =
        el(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   COMBINE ALL FORUM STATS
========================================================= */

function combineOverviewStats() {

    return {

        design: {

            ongoing:
                overviewStats.re.design.ongoing
                +
                overviewStats.iqube.design.ongoing
                +
                overviewStats.garage.design.ongoing,

            completed:
                overviewStats.re.design.completed
                +
                overviewStats.iqube.design.completed
                +
                overviewStats.garage.design.completed

        },


        prototype: {

            ongoing:
                overviewStats.re.prototype.ongoing
                +
                overviewStats.iqube.prototype.ongoing
                +
                overviewStats.garage.prototype.ongoing,

            completed:
                overviewStats.re.prototype.completed
                +
                overviewStats.iqube.prototype.completed
                +
                overviewStats.garage.prototype.completed

        },


        paper: {

            ongoing:
                overviewStats.re.paper.ongoing
                +
                overviewStats.iqube.paper.ongoing
                +
                overviewStats.garage.paper.ongoing,

            completed:
                overviewStats.re.paper.completed
                +
                overviewStats.iqube.paper.completed
                +
                overviewStats.garage.paper.completed

        }

    };

}


/* =========================================================
   THEME
========================================================= */

function initTheme() {

    const themeButton =
        el(
            "themeToggle"
        );


    if (!themeButton) {

        return;

    }


    themeButton.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "theme-dim"
            );

        }
    );

}


/* =========================================================
   HEADER
========================================================= */

function initHeader() {


    /* =====================================================
       PERSONAL WORKSPACE
    ====================================================== */

    const personalButton =
        el(
            "personalWorkspaceBtn"
        );


    if (personalButton) {

        personalButton.addEventListener(
            "click",
            () => {

                window.location.href =
                "../personal/personal.html";

            }
        );

    }


    /* =====================================================
       TEAM SETTINGS
    ====================================================== */

    const settingsButton =
        el(
            "teamSettingsBtn"
        );


    const settingsModal =
        el(
            "settingsModal"
        );


    const closeSettings =
        el(
            "closeSettings"
        );


    if (
        settingsButton &&
        settingsModal
    ) {

        settingsButton.addEventListener(
            "click",
            () => {

                settingsModal
                    .classList
                    .remove(
                        "hidden"
                    );

            }
        );

    }


    if (
        closeSettings &&
        settingsModal
    ) {

        closeSettings.addEventListener(
            "click",
            () => {

                settingsModal
                    .classList
                    .add(
                        "hidden"
                    );

            }
        );

    }


    /* =====================================================
       SIGN OUT
    ====================================================== */

    const signOutButton =
        el(
            "signOutBtn"
        );


    if (signOutButton) {

        signOutButton.addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Are you sure you want to sign out?"
                    );


                if (!confirmed) {

                    return;

                }


                /*
                   Supabase sign-out will be
                   connected later.
                */

                alert(
                    "Sign out will be connected to Supabase later."
                );

            }
        );

    }

}


/* =========================================================
   MODAL INITIALIZATION
========================================================= */

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


    const settingsModal =
        el(
            "settingsModal"
        );


    /* =====================================================
       CLOSE
    ====================================================== */

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


    /* =====================================================
       FORM
    ====================================================== */

    if (form) {

        form.addEventListener(
            "submit",
            saveItem
        );

    }


    /* =====================================================
       OUTSIDE CLICK
    ====================================================== */

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


    if (settingsModal) {

        settingsModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    settingsModal
                ) {

                    settingsModal
                        .classList
                        .add(
                            "hidden"
                        );

                }

            }
        );

    }


    /* =====================================================
       ESCAPE
    ====================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeItemModal();


                if (settingsModal) {

                    settingsModal
                        .classList
                        .add(
                            "hidden"
                        );

                }

            }

        }
    );

}


/* =========================================================
   INITIALIZE ADMIN
========================================================= */

function initAdmin() {

    startClock();

    loadAdminInfo();

    renderForums();

    renderPendingRequests();

    initAddButtons();

    initModal();

    initTheme();

    initHeader();

    initOverview();

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initAdmin
);