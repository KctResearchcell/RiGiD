/* =========================================================
   RiGiD — PERSONAL WORKSPACE
   personal.js

   FRONTEND VERSION
   Corrected / Updated Version
========================================================= */


/* =========================================================
   1. USER PROFILE
   REAL SUPABASE PROFILE
========================================================= */

const personalUser = {

    id: "",

    name: "",

    email: "",

    profileImage: "",

    role: "",

    status: "",

    bio: "",

    details: [],

    forums: [],

    teams: [],

    domains: []

};

/* =========================================================
   2. REAL PERSONAL DATA
   Loaded from Supabase for the logged-in user only.
========================================================= */

let workItems = [];

let accolades = [];

let dailyBlogs = {};

let reminders = [];

let personalLinks = [];

let extraActivities = [];

let uploadedFiles = [];

/* =========================================================
   7. CALENDAR STATE
========================================================= */

let calendarDate = new Date();

let selectedDate = new Date();


/* =========================================================
   8. CREATE STATE
========================================================= */

let currentCreateType = "project";

let toastTimer = null;

let profile = {
    name: "",
    email: "",

    githubUrl: "",
    githubUsername: "",

    linkedinUrl: "",
    linkedinUsername: ""
};

/* =========================================================
   9. INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);


async function initializeDashboard() {

    await loadPersonalWorkspaceData();

    await loadProfile();

    initializeClock();

    initializeProfilePhoto();

    initializeProfileEditing();

    initializeProfileDetails();

    initializeSocialURL();

    initializeStatistics();

    initializeStatFilters();

    initializeQuickCreate();

    initializeCreateModal();

    initializeReminderModal();

    initializeLinkModal();

    initializeUpload();

    initializeSettings();

    initializeAccolades();

    initializeTheme();

    initializeHeader();

    initializeCalendar();

    initializeDailyBlog();


    /* =================================================
       RENDER REAL DATA
    ================================================= */

    renderAllTimelines();

    renderWorkCategoryColumns();

    renderCalendar();

    loadSelectedDateActivities();

}


/* =========================================================
   10. BASIC HELPERS
========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


function getInputValue(id) {

    const element = getElement(id);

    if (!element) {
        return "";
    }

    return String(element.value || "").trim();

}


function setInput(element, value) {

    if (element) {
        element.value = value || "";
    }

}


function setText(id, value) {

    const element = getElement(id);

    if (element) {
        element.textContent = value;
    }

}


function capitalize(value) {

    if (!value) {
        return "";
    }

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function isValidURL(value) {

    try {

        new URL(value);

        return true;

    } catch {

        return false;

    }

}


/* =========================================================
   11. PROFILE
========================================================= */

/* =========================================================
   11. PROFILE
   LOAD REAL DATA FROM SUPABASE
========================================================= */
/* =========================================================
   10B. LOAD PERSONAL WORKSPACE DATA
========================================================= */

async function loadPersonalWorkspaceData() {

    try {

        /* =================================================
           CURRENT USER
        ================================================= */

        const {
            data: { user },
            error: authError
        } = await sb.auth.getUser();


        if (authError) {
            throw authError;
        }


        if (!user) {

            console.error(
                "No authenticated user."
            );

            return false;

        }


        /* =================================================
           LOAD ALL PERSONAL TABLES
        ================================================= */

        const [
            workResult,
            blogResult,
            reminderResult,
            accoladeResult,
            linkResult
        ] = await Promise.all([

            sb
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
                .eq("profile_id", user.id)
                .order("created_at", {
                    ascending: false
                }),


            sb
                .from("daily_blogs")
                .select(`
                    id,
                    profile_id,
                    date,
                    content,
                    created_at,
                    updated_at
                `)
                .eq("profile_id", user.id)
                .order("date", {
                    ascending: false
                }),


            sb
                .from("personal_reminders")
                .select(`
                    id,
                    profile_id,
                    title,
                    date,
                    hour,
                    minute,
                    description,
                    created_at
                `)
                .eq("profile_id", user.id)
                .order("date", {
                    ascending: false
                }),


            sb
                .from("personal_accolades")
                .select(`
                    id,
                    profile_id,
                    title,
                    date,
                    description,
                    url,
                    created_at
                `)
                .eq("profile_id", user.id)
                .order("date", {
                    ascending: false
                }),


            sb
                .from("personal_links")
                .select(`
                    id,
                    profile_id,
                    title,
                    url,
                    description,
                    created_at
                `)
                .eq("profile_id", user.id)
                .order("created_at", {
                    ascending: false
                })

        ]);


        /* =================================================
           ERROR CHECK
        ================================================= */

        if (workResult.error) {
            throw workResult.error;
        }

        if (blogResult.error) {
            throw blogResult.error;
        }

        if (reminderResult.error) {
            throw reminderResult.error;
        }

        if (accoladeResult.error) {
            throw accoladeResult.error;
        }

        if (linkResult.error) {
            throw linkResult.error;
        }


        /* =================================================
           PERSONAL WORK
        ================================================= */

        workItems =
            (workResult.data || []).map(item => ({

                id:
                    item.id,

                type:
                    String(item.category || "")
                        .toLowerCase(),

                title:
                    item.title,

                description:
                    item.description || "",

                status:
                    item.status || "ongoing",

                startDate:
                    item.start_date,

                endDate:
                    item.end_date || "",

                createdAt:
                    item.created_at,

                updatedDate:
                    item.updated_at
                        ? item.updated_at.slice(0, 10)
                        : item.start_date,

                forumId:
                    item.forum_id,

                teamId:
                    item.team_id,

                domainId:
                    item.domain_id

            }));


        /* =================================================
           DAILY BLOGS
           Convert rows → existing date-keyed structure
        ================================================= */

        dailyBlogs = {};


        (blogResult.data || []).forEach(blog => {

            dailyBlogs[blog.date] =
                blog.content;

        });


        /* =================================================
           REMINDERS
        ================================================= */

        reminders =
            (reminderResult.data || []).map(reminder => ({

                id:
                    reminder.id,

                title:
                    reminder.title,

                date:
                    reminder.date,

                hour:
                    Number(reminder.hour),

                minute:
                    Number(reminder.minute),

                description:
                    reminder.description || "",

                createdAt:
                    reminder.created_at

            }));


        /* =================================================
           ACCOLADES
        ================================================= */

        accolades =
            (accoladeResult.data || []).map(accolade => ({

                id:
                    accolade.id,

                title:
                    accolade.title,

                date:
                    accolade.date,

                description:
                    accolade.description || "",

                url:
                    accolade.url || "",

                createdAt:
                    accolade.created_at

            }));


        /* =================================================
           LINKS
        ================================================= */

        personalLinks =
            (linkResult.data || []).map(link => ({

                id:
                    link.id,

                title:
                    link.title,

                url:
                    link.url,

                description:
                    link.description || "",

                createdAt:
                    link.created_at

            }));


        /* =================================================
           EXTRA ACTIVITIES
           
           IMPORTANT:
           We are NOT generating fake activities.
           Real uploads/Drive activity will be connected
           separately.
        ================================================= */

        extraActivities = [];


        console.log(
            "Personal workspace loaded:",
            {
                workItems,
                dailyBlogs,
                reminders,
                accolades,
                personalLinks
            }
        );


        return true;

    }
    catch (error) {

        console.error(
            "Failed to load personal workspace:",
            error
        );

        return false;

    }

}

function getProfileInitials(name, email) {

    const value =
        String(name || email || "").trim();

    if (!value) {
        return "?";
    }

    const parts =
        value
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length >= 2) {

        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();

    }

    return value
        .substring(0, 2)
        .toUpperCase();

}

async function loadProfile() {

    try {

        /* =================================================
           GET CURRENT LOGGED-IN USER
        ================================================= */

        const {
            data: { user },
            error: authError
        } = await sb.auth.getUser();


        if (authError) {

            console.error(
                "Auth user error:",
                authError
            );

            return;

        }


        if (!user) {

            console.error(
                "No authenticated user."
            );

            return;

        }


        /* =================================================
           LOAD PROFILE
        ================================================= */

        const {
            data: profile,
            error: profileError
        } = await sb
            .from("profiles")
            .select(`
                id,
                full_name,
                email,
                role,
                status,
                bio,
                avatar_url
            `)
            .eq("id", user.id)
            .single();


        if (profileError) {

            console.error(
                "Profile loading error:",
                profileError
            );

            return;

        }


        /* =================================================
           BASIC PROFILE
        ================================================= */

        personalUser.id =
            profile.id;

        personalUser.name =
            profile.full_name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User";

        personalUser.email =
            profile.email ||
            user.email ||
            "";

        personalUser.role =
            profile.role ||
            "";

        updateWorkspaceButton();

        personalUser.status =
            profile.status ||
            "";

        personalUser.bio =
            profile.bio ||
            "";

        personalUser.profileImage =
            profile.avatar_url ||
            "";

        const profilePlaceholder =
            getElement("profilePlaceholder");

        if (profilePlaceholder) {

            profilePlaceholder.textContent =
                getProfileInitials(
                    personalUser.name,
                    personalUser.email
                );

        }

        /* =================================================
           FORUM MEMBERSHIPS
        ================================================= */

        const {
            data: forumMemberships,
            error: forumError
        } = await sb
            .from("forum_members")
            .select(`
                forum_id,
                forums (
                    id,
                    name,
                    description
                )
            `)
            .eq("profile_id", user.id);


        if (forumError) {

            console.error(
                "Forum membership error:",
                forumError
            );

        }


        personalUser.forums =
            (forumMemberships || [])
                .map(row => row.forums)
                .filter(Boolean);


        /* =================================================
           TEAM MEMBERSHIPS
        ================================================= */

        const {
            data: teamMemberships,
            error: teamError
        } = await sb
            .from("team_members")
            .select(`
                team_id,
                teams (
                    id,
                    name,
                    description,
                    forum_id
                )
            `)
            .eq("profile_id", user.id);


        if (teamError) {

            console.error(
                "Team membership error:",
                teamError
            );

        }


        personalUser.teams =
            (teamMemberships || [])
                .map(row => row.teams)
                .filter(Boolean);


        /* =================================================
           DOMAIN MEMBERSHIPS
        ================================================= */

        const {
            data: domainMemberships,
            error: domainError
        } = await sb
            .from("domain_members")
            .select(`
                domain_id,
                domains (
                    id,
                    name,
                    description,
                    forum_id
                )
            `)
            .eq("profile_id", user.id);


        if (domainError) {

            console.error(
                "Domain membership error:",
                domainError
            );

        }


        personalUser.domains =
            (domainMemberships || [])
                .map(row => row.domains)
                .filter(Boolean);


        /* =================================================
           BUILD DETAILS
        ================================================= */

        personalUser.details = [];


        if (personalUser.role) {

            personalUser.details.push({

                id: "role",

                label: "Role",

                value:
                    capitalize(
                        personalUser.role
                    ),

                icon: "◉"

            });

        }


        if (personalUser.forums.length) {

            personalUser.details.push({

                id: "forum",

                label: "Forum",

                value:
                    personalUser.forums
                        .map(forum => forum.name)
                        .join(", "),

                icon: "◈"

            });

        }


        if (personalUser.teams.length) {

            personalUser.details.push({

                id: "team",

                label: "Team",

                value:
                    personalUser.teams
                        .map(team => team.name)
                        .join(", "),

                icon: "◆"

            });

        }


        if (personalUser.domains.length) {

            personalUser.details.push({

                id: "domain",

                label: "Domain",

                value:
                    personalUser.domains
                        .map(domain => domain.name)
                        .join(", "),

                icon: "◎"

            });

        }


        /* =================================================
           UPDATE HEADER
        ================================================= */

        setText(
            "profileName",
            personalUser.name
        );

        setText(
            "profileEmail",
            personalUser.email
        );


        /* =================================================
           UPDATE LOCKED EMAIL
        ================================================= */

        setText(
            "lockedProfileEmail",
            personalUser.email
        );


        setText(
            "editProfileEmail",
            personalUser.email
        );


        /* =================================================
           UPDATE PROFILE DETAILS
        ================================================= */

        renderProfileDetails();


        /* =================================================
           UPDATE SOCIAL LINKS
        ================================================= */

        updateSocialDisplay("github");

        updateSocialDisplay("linkedin");


        /* =================================================
           PROFILE IMAGE
        ================================================= */

        const profileImage =
            getElement("profileImage");


        if (personalUser.profileImage) {

            if (profileImage) {

                profileImage.src =
                    personalUser.profileImage;

                profileImage.classList.remove(
                    "hidden"
                );

            }

            if (profilePlaceholder) {

                profilePlaceholder.classList.add(
                    "hidden"
                );

            }

        } else {

            if (profileImage) {

                profileImage.classList.add(
                    "hidden"
                );

            }

            if (profilePlaceholder) {

                profilePlaceholder.classList.remove(
                    "hidden"
                );

            }

        }


        console.log(
            "REAL PROFILE:",
            personalUser
        );

    }
    catch (error) {

        console.error(
            "Profile initialization error:",
            error
        );

    }

}

function updateWorkspaceButton() {

    const button =
        getElement("personalWorkspaceBtn");

    const icon =
        getElement("workspaceBtnIcon");

    const text =
        getElement("workspaceBtnText");


    if (!button || !text) {
        return;
    }


    const isAdmin =
        personalUser.role === "admin";


    if (isAdmin) {

        if (icon) {
            icon.textContent = "⚙";
        }

        text.textContent =
            "Administration";


        button.onclick = () => {

            window.location.href =
                "../admin/admin.html";

        };

    }
    else {

        if (icon) {
            icon.textContent = "⌂";
        }

        text.textContent =
            "Personal Workspace";


        button.onclick = () => {

            window.location.href =
                "personal.html";

        };

    }

}


/* =========================================================
   12. PROFILE DETAILS
========================================================= */

function renderProfileDetails() {

    const container =
        getElement("profileDetails");

    if (!container) {
        return;
    }

    container.innerHTML = "";


    personalUser.details.forEach(detail => {

        const element =
            document.createElement("div");

        element.className =
            "profile-detail editable-profile-detail";

        element.dataset.detailId =
            detail.id;


        element.innerHTML = `

            <span class="detail-icon">
                ${escapeHTML(detail.icon)}
            </span>

            <span
                class="profile-detail-value"
                title="${escapeHTML(detail.label)}"
            >
                ${escapeHTML(detail.value)}
            </span>

            <button
                class="edit-profile-field"
                type="button"
                data-edit-detail="${escapeHTML(detail.id)}"
                title="Edit"
            >
                ✎
            </button>

            <button
                class="delete-profile-detail"
                type="button"
                data-delete-detail="${escapeHTML(detail.id)}"
                title="Delete"
            >
                ×
            </button>

        `;

        container.appendChild(element);

    });


    const addButton =
        document.createElement("button");

    addButton.className =
        "add-profile-detail-btn";

    addButton.id =
        "addProfileDetailBtn";

    addButton.type =
        "button";

    addButton.innerHTML = `
        <span>+</span>
        Add detail
    `;


    container.appendChild(addButton);


    addButton.addEventListener(
        "click",
        openAddProfileDetailModal
    );


    container
        .querySelectorAll("[data-edit-detail]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editProfileDetail(
                        button.dataset.editDetail
                    );

                }
            );

        });


    container
        .querySelectorAll("[data-delete-detail]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteProfileDetail(
                        button.dataset.deleteDetail
                    );

                }
            );

        });

}


/* =========================================================
   13. EDIT PROFILE DETAIL
========================================================= */

function editProfileDetail(id) {

    const detail =
        personalUser.details.find(
            item => item.id === id
        );

    if (!detail) {
        return;
    }


    const newValue =
        window.prompt(
            `Edit ${detail.label}`,
            detail.value
        );


    if (newValue === null) {
        return;
    }


    const cleaned =
        newValue.trim();


    if (!cleaned) {

        showToast(
            "Value cannot be empty."
        );

        return;

    }


    detail.value = cleaned;

    renderProfileDetails();

    showToast(
        `${detail.label} updated.`
    );

}


/* =========================================================
   14. DELETE PROFILE DETAIL
========================================================= */

function deleteProfileDetail(id) {

    const index =
        personalUser.details.findIndex(
            item => item.id === id
        );

    if (index === -1) {
        return;
    }


    const detail =
        personalUser.details[index];


    const confirmed =
        window.confirm(
            `Delete "${detail.label}" from your profile?`
        );


    if (!confirmed) {
        return;
    }


    personalUser.details.splice(
        index,
        1
    );


    renderProfileDetails();

    showToast(
        `${detail.label} removed.`
    );

}


/* =========================================================
   15. ADD PROFILE DETAIL
========================================================= */

function initializeProfileDetails() {

    const form =
        getElement("addProfileDetailForm");

    const close =
        getElement("closeAddProfileDetailModal");

    const cancel =
        getElement("cancelAddProfileDetailModal");


    if (form) {

        form.addEventListener(
            "submit",
            saveNewProfileDetail
        );

    }


    if (close) {

        close.addEventListener(
            "click",
            closeAddProfileDetailModal
        );

    }


    if (cancel) {

        cancel.addEventListener(
            "click",
            closeAddProfileDetailModal
        );

    }

}


function openAddProfileDetailModal() {

    setInput(
        getElement("newDetailName"),
        ""
    );

    setInput(
        getElement("newDetailValue"),
        ""
    );


    const modal =
        getElement("addProfileDetailModal");


    if (modal) {

        modal.classList.remove("hidden");

    }


    setTimeout(() => {

        const input =
            getElement("newDetailName");

        if (input) {
            input.focus();
        }

    }, 50);

}


function saveNewProfileDetail(event) {

    event.preventDefault();


    const label =
        getInputValue("newDetailName");

    const value =
        getInputValue("newDetailValue");


    if (!label || !value) {

        showToast(
            "Please enter both detail name and value."
        );

        return;

    }


    personalUser.details.push({

        id:
            `custom-${Date.now()}`,

        label:
            label,

        value:
            value,

        icon:
            "◆"

    });


    renderProfileDetails();

    closeAddProfileDetailModal();

    showToast(
        `${label} added to your profile.`
    );

}


function closeAddProfileDetailModal() {

    const modal =
        getElement("addProfileDetailModal");

    if (modal) {

        modal.classList.add("hidden");

    }

}


/* =========================================================
   16. PROFILE EDIT
========================================================= */

function initializeProfileEditing() {

    const form =
        getElement("profileEditForm");

    const close =
        getElement("closeProfileEditModal");

    const cancel =
        getElement("cancelProfileEditModal");


    if (form) {

        form.addEventListener(
            "submit",
            saveProfile
        );

    }


    if (close) {

        close.addEventListener(
            "click",
            closeProfileEditModal
        );

    }


    if (cancel) {

        cancel.addEventListener(
            "click",
            closeProfileEditModal
        );

    }


    const editButton =
        document.querySelector(
            ".profile-information > .profile-name-row .edit-profile-field"
        );


    if (editButton) {

        editButton.addEventListener(
            "click",
            openProfileEditModal
        );

    }

}


function openProfileEditModal() {

    setInput(
        getElement("editProfileName"),
        personalUser.name
    );


    setInput(
        getElement("editProfileDepartment"),
        getDetailValue("Department")
    );

    setInput(
        getElement("editProfileForum"),
        getDetailValue("Forum")
    );

    setInput(
        getElement("editProfileTeam"),
        getDetailValue("Team")
    );

    setInput(
        getElement("editProfileDomain"),
        getDetailValue("Domain")
    );


    /* =================================================
       GITHUB
    ================================================== */

    setInput(
        getElement("editGithubUsername"),
        profile.githubUsername
    );

    setInput(
        getElement("editGithubUrl"),
        profile.githubUrl
    );


    /* =================================================
       LINKEDIN
    ================================================== */

    setInput(
        getElement("editLinkedinUsername"),
        profile.linkedinUsername
    );

    setInput(
        getElement("editLinkedinUrl"),
        profile.linkedinUrl
    );


    setText(
        "editProfileEmail",
        personalUser.email
    );


    const modal =
        getElement("profileEditModal");


    if (modal) {

        modal.classList.remove("hidden");

    }

}


function getDetailValue(label) {

    const detail =
        personalUser.details.find(
            item =>
                item.label.toLowerCase() ===
                label.toLowerCase()
        );


    return detail ? detail.value : "";

}


function saveProfile(event) {

    event.preventDefault();


    const name =
        getInputValue("editProfileName");


    if (!name) {

        showToast(
            "Name cannot be empty."
        );

        return;

    }


    /* =================================================
       BASIC PROFILE
    ================================================== */

    personalUser.name =
        name;


    /* =================================================
       PROFILE DETAILS
    ================================================== */

    updateStandardDetail(
        "Department",
        getInputValue("editProfileDepartment")
    );


    updateStandardDetail(
        "Forum",
        getInputValue("editProfileForum")
    );


    updateStandardDetail(
        "Team",
        getInputValue("editProfileTeam")
    );


    updateStandardDetail(
        "Domain",
        getInputValue("editProfileDomain")
    );


    /* =================================================
       GITHUB
    ================================================== */

    profile.githubUsername =
        getInputValue("editGithubUsername");

    profile.githubUrl =
        getInputValue("editGithubUrl");


    /* =================================================
       LINKEDIN
    ================================================== */

    profile.linkedinUsername =
        getInputValue("editLinkedinUsername");

    profile.linkedinUrl =
        getInputValue("editLinkedinUrl");


    /* =================================================
       UPDATE UI
    ================================================== */

    loadProfile();


    closeProfileEditModal();


    showToast(
        "Profile updated."
    );

}


function updateStandardDetail(label, value) {

    const detail =
        personalUser.details.find(
            item =>
                item.label.toLowerCase() ===
                label.toLowerCase()
        );


    if (detail) {

        if (value) {
            detail.value = value;
        }

    } else if (value) {

        personalUser.details.push({

            id:
                label.toLowerCase(),

            label:
                label,

            value:
                value,

            icon:
                "◆"

        });

    }

}


function closeProfileEditModal() {

    const modal =
        getElement("profileEditModal");

    if (modal) {

        modal.classList.add("hidden");

    }

}


/* =========================================================
   17. PROFILE PHOTO
========================================================= */

function initializeProfilePhoto() {

    const button =
        getElement("profileUploadBtn");

    const input =
        getElement("profilePhotoInput");


    if (!button || !input) {
        return;
    }


    button.addEventListener(
        "click",
        () => input.click()
    );


    input.addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            if (!file.type.startsWith("image/")) {

                showToast(
                    "Please select an image."
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload = event => {

                personalUser.profileImage =
                    event.target.result;


                const image =
                    getElement("profileImage");


                if (image) {

                    image.src =
                        event.target.result;

                    image.classList.remove("hidden");

                }


                if (placeholder) {

                    placeholder.classList.add("hidden");

                }


                showToast(
                    "Profile photo updated."
                );

            };


            reader.readAsDataURL(file);

        }
    );

}




function saveSocialProfile(event) {

    event.preventDefault();


    const url =
        getInputValue("socialProfileURL");


    if (!url) {

        showToast(
            "Please enter a profile URL."
        );

        return;

    }


    try {

        new URL(url);

    } catch {

        showToast(
            "Please enter a valid URL."
        );

        return;

    }


    personalUser[currentSocialType] =
        url;


    updateSocialDisplay(
        currentSocialType
    );


    closeSocialModal();


    showToast(
        `${capitalize(currentSocialType)} profile updated.`
    );

}


function updateSocialDisplay(type) {

    const link =
        document.getElementById(`${type}Link`);

    const username =
        document.getElementById(`${type}Username`);

    if (!link) {
        return;
    }

    let url = "";
    let displayName = "";

    if (type === "github") {

        url = profile.githubUrl;

        displayName =
            profile.githubUsername ||
            "GITHUB";
    }

    if (type === "linkedin") {

        url = profile.linkedinUrl;

        displayName =
            profile.linkedinUsername ||
            "LINKEDIN";
    }

    if (username) {

        username.textContent =
            displayName;
    }

    link.dataset.hasProfile =
        url ? "true" : "false";
}

/* =========================================================
   SOCIAL PROFILE URL
========================================================= */

let currentSocialType = "";


function initializeSocialURL() {

    const github =
        document.getElementById("githubLink");

    const linkedin =
        document.getElementById("linkedinLink");

    const close =
        document.getElementById("closeSocialUrlModal");

    const cancel =
        document.getElementById("cancelSocialUrl");

    const form =
        document.getElementById("socialUrlForm");


    /* GitHub */

    if (github) {

        github.addEventListener(
            "click",
            function () {

                handleSocialClick("github");

            }
        );

    }


    /* LinkedIn */

    if (linkedin) {

        linkedin.addEventListener(
            "click",
            function () {

                handleSocialClick("linkedin");

            }
        );

    }


    /* Close */

    if (close) {

        close.addEventListener(
            "click",
            closeSocialURLModal
        );

    }


    /* Cancel */

    if (cancel) {

        cancel.addEventListener(
            "click",
            closeSocialURLModal
        );

    }


    /* Save */

    if (form) {

        form.addEventListener(
            "submit",
            saveSocialURL
        );

    }

}


function handleSocialClick(type) {

    let url = "";


    if (type === "github") {

        url =
            profile.githubUrl;

    }


    if (type === "linkedin") {

        url =
            profile.linkedinUrl;

    }


    /* =================================================
       URL EXISTS
    ================================================== */

    if (url) {

        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );

        return;

    }


    /* =================================================
       URL DOES NOT EXIST
    ================================================== */

    currentSocialType =
        type;


    openSocialURLModal();

}


function openSocialURLModal() {

    const modal =
        document.getElementById(
            "socialUrlModal"
        );

    const title =
        document.getElementById(
            "socialUrlTitle"
        );

    const input =
        document.getElementById(
            "socialProfileUrl"
        );


    if (!modal) {
        return;
    }


    if (
        currentSocialType ===
        "github"
    ) {

        title.textContent =
            "GitHub Profile";

        input.placeholder =
            "https://github.com/yourusername";

        input.value =
            profile.githubUrl || "";

    }


    if (
        currentSocialType ===
        "linkedin"
    ) {

        title.textContent =
            "LinkedIn Profile";

        input.placeholder =
            "https://www.linkedin.com/in/yourusername";

        input.value =
            profile.linkedinUrl || "";

    }


    modal.classList.remove(
        "hidden"
    );


    setTimeout(
        function () {

            input.focus();

        },
        100
    );

}


function closeSocialURLModal() {

    const modal =
        document.getElementById(
            "socialUrlModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }


    currentSocialType =
        "";

}


function saveSocialURL(event) {

    event.preventDefault();


    const input =
        document.getElementById(
            "socialProfileUrl"
        );


    const url =
        input.value.trim();


    if (!url) {

        return;

    }


    /* Validate URL */

    try {

        const parsedURL =
            new URL(url);


        if (
            parsedURL.protocol !==
            "http:" &&
            parsedURL.protocol !==
            "https:"
        ) {

            throw new Error();

        }

    }
    catch {

        showToast(
            "Please enter a valid profile URL."
        );

        return;

    }


    /* =================================================
       SAVE GITHUB
    ================================================== */

    if (
        currentSocialType ===
        "github"
    ) {

        profile.githubUrl =
            url;


        /*
         * If no username is stored,
         * automatically take it from URL.
         */

        if (
            !profile.githubUsername
        ) {

            try {

                const parts =
                    new URL(url)
                        .pathname
                        .split("/")
                        .filter(Boolean);


                if (parts.length > 0) {

                    profile.githubUsername =
                        parts[0];

                }

            }
            catch {

                // Ignore parsing error

            }

        }

    }


    /* =================================================
       SAVE LINKEDIN
    ================================================== */

    if (
        currentSocialType ===
        "linkedin"
    ) {

        profile.linkedinUrl =
            url;


        if (
            !profile.linkedinUsername
        ) {

            try {

                const parts =
                    new URL(url)
                        .pathname
                        .split("/")
                        .filter(Boolean);


                if (parts.length > 0) {

                    profile.linkedinUsername =
                        parts[
                        parts.length - 1
                        ];

                }

            }
            catch {

                // Ignore parsing error

            }

        }

    }


    /* Update cards */

    updateSocialDisplay(
        "github"
    );

    updateSocialDisplay(
        "linkedin"
    );


    closeSocialURLModal();


    showToast(
        "Profile URL saved."
    );

}


function closeSocialModal() {

    const modal =
        getElement("socialEditModal");

    if (modal) {

        modal.classList.add("hidden");

    }

}


/* =========================================================
   19. STATISTICS
========================================================= */

function initializeStatistics() {

    loadStatistics();

}


function loadStatistics() {

    const categories = {

        project: [
            "projectsCompleted",
            "projectsOngoing"
        ],

        design: [
            "designsCompleted",
            "designsOngoing"
        ],

        prototype: [
            "prototypesCompleted",
            "prototypesOngoing"
        ],

        paper: [
            "papersCompleted",
            "papersOngoing"
        ]

    };


    Object.entries(categories).forEach(
        ([type, ids]) => {

            const completed =
                workItems.filter(
                    item =>
                        item.type === type &&
                        item.status === "completed"
                ).length;


            const ongoing =
                workItems.filter(
                    item =>
                        item.type === type &&
                        item.status === "ongoing"
                ).length;


            setText(
                ids[0],
                completed
            );

            setText(
                ids[1],
                ongoing
            );

        }
    );

}


/* =========================================================
   20. STAT FILTERS
========================================================= */

function initializeStatFilters() {

    document
        .querySelectorAll(".stat-filter-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showWorkList(
                        button.dataset.filterType,
                        button.dataset.filterStatus
                    );

                }
            );

        });

}


function showWorkList(type, status) {

    const items =
        workItems.filter(
            item =>
                item.type === type &&
                item.status === status
        );


    createWorkListModal();


    const modal =
        getElement("workListModal");

    const title =
        getElement("workListTitle");

    const list =
        getElement("workList");

    const count =
        getElement("workListCount");


    if (title) {

        title.textContent =
            `${capitalize(status)} ${capitalize(type)}s`;

    }


    if (count) {

        count.textContent =
            `${items.length} item${items.length !== 1 ? "s" : ""}`;

    }


    if (list) {

        list.innerHTML = "";


        if (!items.length) {

            list.innerHTML = `
                <div class="no-activity">
                    No ${status} ${type}s found.
                </div>
            `;

        } else {

            items.forEach(item => {

                const element =
                    document.createElement("div");

                element.className =
                    "work-list-item";


                element.innerHTML = `

                    <div class="work-list-icon">
                        ${getActivityIcon(item.type)}
                    </div>

                    <div class="work-list-info">

                        <strong>
                            ${escapeHTML(item.title)}
                        </strong>

                        <small>
                            ${escapeHTML(item.description)}
                        </small>

                        <span>
                            Started:
                            ${escapeHTML(
                    formatDate(item.startDate)
                )}
                        </span>

                    </div>

                    <div class="work-list-status ${escapeHTML(item.status)}">
                        ${capitalize(item.status)}
                    </div>

                `;


                element.addEventListener(
                    "click",
                    () => {

                        closeWorkListModal();

                        showWorkItemDetails(item);

                    }
                );


                list.appendChild(element);

            });

        }

    }


    if (modal) {

        modal.classList.remove("hidden");

    }

}


/* =========================================================
   21. WORK LIST MODAL
========================================================= */

function createWorkListModal() {

    if (getElement("workListModal")) {
        return;
    }


    const modal =
        document.createElement("div");


    modal.className =
        "personal-modal hidden";

    modal.id =
        "workListModal";


    modal.innerHTML = `

        <div class="personal-modal-box work-list-modal-box">

            <div class="modal-header">

                <div>

                    <span class="modal-eyebrow">
                        WORK ITEMS
                    </span>

                    <h3 id="workListTitle">
                        Work
                    </h3>

                    <small
                        id="workListCount"
                        class="work-list-count"
                    >
                        0 items
                    </small>

                </div>

                <button
                    class="modal-close"
                    id="closeWorkListModal"
                    type="button"
                >
                    ×
                </button>

            </div>

            <div
                class="work-list"
                id="workList"
            ></div>

        </div>

    `;


    document.body.appendChild(modal);


    const close =
        getElement("closeWorkListModal");


    if (close) {

        close.addEventListener(
            "click",
            closeWorkListModal
        );

    }


    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {

                closeWorkListModal();

            }

        }
    );

}


function closeWorkListModal() {

    const modal =
        getElement("workListModal");

    if (modal) {

        modal.classList.add("hidden");

    }

}


/* =========================================================
   22. QUICK CREATE
========================================================= */

function initializeQuickCreate() {

    const button =
        getElement("quickCreateBtn");

    const menuSection =
        getElement("quickCreateMenuSection");

    const menu =
        getElement("quickCreateMenu");


    if (!button || !menuSection || !menu) {
        return;
    }


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            if (
                menuSection.classList.contains("hidden")
            ) {

                openQuickCreate();

            } else {

                closeQuickCreate();

            }

        }
    );


    menu
        .querySelectorAll(".quick-create-option")
        .forEach(option => {

            option.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    const type =
                        option.dataset.create;


                    if (!type) {
                        return;
                    }


                    closeQuickCreate();


                    if (type === "reminder") {

    showUnderConstruction();

} else {

    openCreateModal(type);

}

                }
            );

        });


    document.addEventListener(
        "click",
        event => {

            if (
                !event.target.closest("#quickCreateBtn") &&
                !event.target.closest("#quickCreateMenuSection")
            ) {

                closeQuickCreate();

            }

        }
    );

}


function openQuickCreate() {

    const menu =
        getElement("quickCreateMenuSection");

    const button =
        getElement("quickCreateBtn");


    if (menu) {

        menu.classList.remove("hidden");

    }


    if (button) {

        button.setAttribute(
            "aria-expanded",
            "true"
        );

    }

}


function closeQuickCreate() {

    const menu =
        getElement("quickCreateMenuSection");

    const button =
        getElement("quickCreateBtn");


    if (menu) {

        menu.classList.add("hidden");

    }


    if (button) {

        button.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}

function initializeCreateModal() {

    const form =
        getElement("createForm");

    const close =
        getElement("closeCreateModal");

    const cancel =
        getElement("cancelCreateModal");

    const forumSelect =
        getElement("createForum");

    const targetSelect =
        getElement("createTarget");


    /* =================================================
       FORM SUBMIT
    ================================================= */

    if (form) {

        form.addEventListener(
            "submit",
            handleCreateSubmit
        );

    }


    /* =================================================
       CLOSE
    ================================================= */

    if (close) {

        close.addEventListener(
            "click",
            closeCreateModal
        );

    }


    if (cancel) {

        cancel.addEventListener(
            "click",
            closeCreateModal
        );

    }


    /* =================================================
       FORUM CHANGE
    ================================================= */

    if (forumSelect) {

        forumSelect.addEventListener(
            "change",
            () => {

                populateCreateTargets();

            }
        );

    }


    /* =================================================
       TARGET CHANGE
    ================================================= */

    if (targetSelect) {

        targetSelect.addEventListener(
            "change",
            () => {

                updateCreateTargetState();

            }
        );

    }


    /* =================================================
       INITIAL LOAD
    ================================================= */

    populateCreateForums();

}


/* =========================================================
   POPULATE FORUMS
========================================================= */
async function populateCreateForums() {

    const select =
        getElement("createForum");

    const targetSelect =
        getElement("createTarget");


    if (!select) {
        return;
    }


    /* =================================================
       RESET
    ================================================= */

    select.innerHTML = `
        <option value="">
            Loading joined forums...
        </option>
    `;

    select.disabled = true;


    if (targetSelect) {

        targetSelect.innerHTML = `
            <option value="">
                Select Team/Domain
            </option>
        `;

        targetSelect.disabled = true;

    }


    /* =================================================
       GET CURRENT USER
    ================================================= */

    const {
        data: { user },
        error: authError
    } = await sb.auth.getUser();


    if (authError || !user) {

        console.error(
            "Unable to identify current user:",
            authError
        );

        select.innerHTML = `
            <option value="">
                Please log in
            </option>
        `;

        return;

    }


    /* =================================================
       LOAD ONLY FORUMS THE USER HAS JOINED
    ================================================= */

    const {
        data: memberships,
        error
    } = await sb
        .from("forum_members")
        .select(`
            forum_id,
            forums (
                id,
                name,
                description
            )
        `)
        .eq(
            "profile_id",
            user.id
        );


    if (error) {

        console.error(
            "Create Forum membership loading error:",
            error
        );

        select.innerHTML = `
            <option value="">
                Unable to load your forums
            </option>
        `;

        select.disabled = true;

        showToast(
            "Unable to load your joined forums."
        );

        return;

    }


    /* =================================================
       EXTRACT JOINED FORUMS
    ================================================= */

    const joinedForums =
        (memberships || [])
            .map(row => row.forums)
            .filter(Boolean);


    /* =================================================
       NO JOINED FORUMS
    ================================================= */

    if (!joinedForums.length) {

        select.innerHTML = `
            <option value="">
                You have not joined any forum
            </option>
        `;

        select.disabled = true;

        if (targetSelect) {

            targetSelect.innerHTML = `
                <option value="">
                    Join a forum first
                </option>
            `;

            targetSelect.disabled = true;

        }

        return;

    }


    /* =================================================
       POPULATE ONLY JOINED FORUMS
    ================================================= */

    select.innerHTML = `
        <option value="">
            Select forum
        </option>
    `;


    joinedForums
        .sort(
            (a, b) =>
                String(a.name || "")
                    .localeCompare(
                        String(b.name || "")
                    )
        )
        .forEach(forum => {

            const option =
                document.createElement("option");

            option.value =
                forum.id;

            option.textContent =
                forum.name;

            select.appendChild(
                option
            );

        });


    select.disabled = false;


    console.log(
        "Create modal — joined forums only:",
        joinedForums
    );

}


/* =========================================================
   POPULATE TEAM + DOMAIN
========================================================= */

async function populateCreateTargets() {

    const forumSelect =
        getElement("createForum");

    const targetSelect =
        getElement("createTarget");


    if (
        !forumSelect ||
        !targetSelect
    ) {
        return;
    }


    const forumId =
        forumSelect.value;


    targetSelect.innerHTML = `
        <option value="">
            Select Team/Domain
        </option>
    `;

    targetSelect.disabled =
        true;


    if (!forumId) {
        return;
    }


    /* =================================================
       GET CURRENT USER
    ================================================= */

    const {
        data: { user },
        error: authError
    } = await sb.auth.getUser();


    if (authError || !user) {

        console.error(
            "Unable to identify current user:",
            authError
        );

        return;

    }


    /* =================================================
       VERIFY USER IS A MEMBER OF SELECTED FORUM
    ================================================= */

    const {
        data: forumMembership,
        error: forumMembershipError
    } = await sb
        .from("forum_members")
        .select("forum_id")
        .eq(
            "profile_id",
            user.id
        )
        .eq(
            "forum_id",
            forumId
        )
        .maybeSingle();


    if (
        forumMembershipError ||
        !forumMembership
    ) {

        console.warn(
            "User is not a member of this forum."
        );

        targetSelect.innerHTML = `
            <option value="">
                You are not a member of this forum
            </option>
        `;

        targetSelect.disabled = true;

        showToast(
            "You can only create work under a forum you have joined."
        );

        return;

    }


    /* =================================================
       LOAD ONLY USER'S JOINED TEAMS
       UNDER THIS FORUM
    ================================================= */

    const {
        data: teamMemberships,
        error: teamMembershipError
    } = await sb
        .from("team_members")
        .select(`
            team_id,
            teams (
                id,
                name,
                description,
                forum_id
            )
        `)
        .eq(
            "profile_id",
            user.id
        );


    /* =================================================
       LOAD ONLY USER'S JOINED DOMAINS
       UNDER THIS FORUM
    ================================================= */

    const {
        data: domainMemberships,
        error: domainMembershipError
    } = await sb
        .from("domain_members")
        .select(`
            domain_id,
            domains (
                id,
                name,
                description,
                forum_id
            )
        `)
        .eq(
            "profile_id",
            user.id
        );


    if (teamMembershipError) {

        console.error(
            "Error loading joined teams:",
            teamMembershipError
        );

    }


    if (domainMembershipError) {

        console.error(
            "Error loading joined domains:",
            domainMembershipError
        );

    }


    /* =================================================
       FILTER TEAMS
       ONLY:
       - User is a member
       - Team belongs to selected forum
    ================================================= */

    const joinedTeams =
        (teamMemberships || [])
            .map(row => row.teams)
            .filter(
                team =>
                    team &&
                    String(team.forum_id) ===
                    String(forumId)
            );


    /* =================================================
       FILTER DOMAINS
       ONLY:
       - User is a member
       - Domain belongs to selected forum
    ================================================= */

    const joinedDomains =
        (domainMemberships || [])
            .map(row => row.domains)
            .filter(
                domain =>
                    domain &&
                    String(domain.forum_id) ===
                    String(forumId)
            );


    /* =================================================
       ADD JOINED TEAMS
    ================================================= */

    joinedTeams
        .sort(
            (a, b) =>
                String(a.name || "")
                    .localeCompare(
                        String(b.name || "")
                    )
        )
        .forEach(team => {

            const option =
                document.createElement("option");

            option.value =
                `team:${team.id}`;

            option.textContent =
                `Team — ${team.name}`;

            targetSelect.appendChild(
                option
            );

        });


    /* =================================================
       ADD JOINED DOMAINS
    ================================================= */

    joinedDomains
        .sort(
            (a, b) =>
                String(a.name || "")
                    .localeCompare(
                        String(b.name || "")
                    )
        )
        .forEach(domain => {

            const option =
                document.createElement("option");

            option.value =
                `domain:${domain.id}`;

            option.textContent =
                `Domain — ${domain.name}`;

            targetSelect.appendChild(
                option
            );

        });


    /* =================================================
       NOTHING AVAILABLE
    ================================================= */

    if (
        joinedTeams.length === 0 &&
        joinedDomains.length === 0
    ) {

        targetSelect.innerHTML = `
            <option value="">
                No joined team/domain in this forum
            </option>
        `;

        targetSelect.disabled = true;

        showToast(
            "You have not joined a team or domain under this forum."
        );

        return;

    }


    /* =================================================
       ENABLE TARGET SELECT
    ================================================= */

    targetSelect.disabled = false;


    console.log(
        "Create targets — joined only:",
        {
            forumId,
            teams: joinedTeams,
            domains: joinedDomains
        }
    );

}


/* =========================================================
   TEAM / DOMAIN STATE
========================================================= */

function updateCreateTargetState() {

    const forumSelect =
        getElement("createForum");

    const targetSelect =
        getElement("createTarget");


    if (
        !forumSelect ||
        !targetSelect
    ) {
        return;
    }


    targetSelect.disabled =
        !forumSelect.value;

}


/* =========================================================
   OPEN CREATE MODAL
========================================================= */

async function openCreateModal(type) {

    currentCreateType =
        type || "";


    updateCreateModalTitle(
        currentCreateType
    );


    /* =================================================
       RESET FORM FIELDS
    ================================================= */

    setInput(
        getElement("createName"),
        ""
    );


    setInput(
        getElement("createDescription"),
        ""
    );


    setInput(
        getElement("createDate"),
        getDateKey(new Date())
    );


    setInput(
        getElement("createEndDate"),
        ""
    );


    /* =================================================
       STATUS
    ================================================= */

    const statusSelect =
        getElement("createStatus");


    if (statusSelect) {

        statusSelect.value =
            "ongoing";

    }


    /* =================================================
       FORUM
    ================================================= */

    const forumSelect =
        getElement("createForum");


    if (forumSelect) {

        forumSelect.value = "";

    }


    /* =================================================
       TEAM / DOMAIN
       SINGLE SELECT
    ================================================= */

    const targetSelect =
        getElement("createTarget");


    if (targetSelect) {

        targetSelect.innerHTML = `
            <option value="">
                Select Team/Domain
            </option>
        `;

        targetSelect.disabled = true;

    }


    /* =================================================
       POPULATE FORUMS
    ================================================= */

    await populateCreateForums();


    /* =================================================
       OPEN MODAL
    ================================================= */

    const modal =
        getElement("createModal");


    if (modal) {

        modal.classList.remove(
            "hidden"
        );

    }


    /* =================================================
       FOCUS TITLE
    ================================================= */

    setTimeout(() => {

        const input =
            getElement("createName");

        if (input) {

            input.focus();

        }

    }, 50);

}


/* =========================================================
   UPDATE MODAL TITLE
========================================================= */

function updateCreateModalTitle(type) {

    const config = {

        project: {
            eyebrow: "NEW PROJECT",
            title: "Create Project"
        },

        design: {
            eyebrow: "NEW DESIGN",
            title: "Create Design"
        },

        prototype: {
            eyebrow: "NEW PROTOTYPE",
            title: "Create Prototype"
        },

        simulation: {
            eyebrow: "NEW SIMULATION",
            title: "Create Simulation"
        },

        paper: {
            eyebrow: "NEW PAPER",
            title: "Create Paper"
        },

        study: {
            eyebrow: "NEW STUDY",
            title: "Create Study"
        }

    };


    const selected =
        config[type] ||
        {
            eyebrow: "NEW WORK",
            title: "Create Work"
        };


    setText(
        "createModalEyebrow",
        selected.eyebrow
    );


    setText(
        "createModalTitle",
        selected.title
    );


    const label =
        getElement("createNameLabel");


    if (label) {

        label.textContent =
            `${capitalize(type || "Work")} Title`;

    }

}


/* =========================================================
   SUBMIT CREATE
========================================================= */

async function handleCreateSubmit(event) {

    event.preventDefault();


    /* =================================================
       CURRENT USER
    ================================================= */

    const {
        data: { user },
        error: authError
    } = await sb.auth.getUser();


    if (
        authError ||
        !user
    ) {

        showToast(
            "You must be logged in."
        );

        return;

    }


    /* =================================================
       VALUES
    ================================================= */

    const type =
        currentCreateType;

    const forumId =
        getInputValue("createForum");

    const target =
        getInputValue("createTarget");

    const title =
        getInputValue("createName");

    const description =
        getInputValue("createDescription");

    const startDate =
        getInputValue("createDate");

    const endDate =
        getInputValue("createEndDate");

    const status =
        getInputValue("createStatus") ||
        "ongoing";
    let teamId = null;
    let domainId = null;


    if (target.startsWith("team:")) {

        teamId =
            target.substring(5);

    }


    if (target.startsWith("domain:")) {

        domainId =
            target.substring(7);

    }

    /* =================================================
       VALIDATION
    ================================================= */

    if (!type) {

        showToast(
            "Please select what you want to create."
        );

        return;

    }


    if (!forumId) {

        showToast(
            "Please select exactly one forum."
        );

        return;

    }


    const hasTeam =
        Boolean(teamId);

    const hasDomain =
        Boolean(domainId);


    /*
     * EXACTLY ONE TARGET
     */

    if (
        hasTeam === hasDomain
    ) {

        showToast(
            "Select exactly one team OR one domain."
        );

        return;

    }


    if (!title) {

        showToast(
            "Please enter a title."
        );

        return;

    }


    if (!startDate) {

        showToast(
            "Please select a start date."
        );

        return;

    }


    if (
        endDate &&
        endDate < startDate
    ) {

        showToast(
            "End date cannot be before start date."
        );

        return;

    }



    /* =================================================
       VERIFY TEAM / DOMAIN BELONGS TO FORUM
    ================================================= */

    if (hasTeam) {

       /* =================================================
   VERIFY USER BELONGS TO SELECTED TEAM
================================================= */

const {
    data: teamMembership,
    error: teamMembershipError
} = await sb
    .from("team_members")
    .select("team_id")
    .eq("profile_id", user.id)
    .eq("team_id", teamId)
    .maybeSingle();


if (
    teamMembershipError ||
    !teamMembership
) {

    console.error(
        "Team membership validation failed:",
        teamMembershipError
    );

    showToast(
        "You are not a member of the selected team."
    );

    return;

}

    }


    if (hasDomain) {

       /* =================================================
   VERIFY USER BELONGS TO SELECTED DOMAIN
================================================= */

const {
    data: domainMembership,
    error: domainMembershipError
} = await sb
    .from("domain_members")
    .select("domain_id")
    .eq("profile_id", user.id)
    .eq("domain_id", domainId)
    .maybeSingle();


if (
    domainMembershipError ||
    !domainMembership
) {

    console.error(
        "Domain membership validation failed:",
        domainMembershipError
    );

    showToast(
        "You are not a member of the selected domain."
    );

    return;

}

    }


    /* =================================================
       INSERT INTO SUPABASE
    ================================================= */
    console.log(
        "Create work user:",
        user
    );

    const payload = {

        profile_id:
            user.id,

        forum_id:
            forumId,

        team_id:
            hasTeam
                ? teamId
                : null,

        domain_id:
            hasDomain
                ? domainId
                : null,

        title:
            title,

        description:
            description || null,

        category:
            type,

        status:
            status,

        start_date:
            startDate,

        end_date:
            endDate || null

    };
    console.log(
        "Create work payload:",
        payload
    );


    const {
        data,
        error
    } = await sb
        .from("personal_work")
        .insert(payload)
        .select()
        .single();


    if (error) {

        console.error(
            "Create work error:",
            error
        );

        showToast(
            error.message ||
            "Unable to create work."
        );

        return;

    }
/* =================================================
   CREATE GOOGLE DRIVE WORK FOLDER
================================================= */

try {

    const {
        data: {
            session
        }
    } =
        await sb.auth.getSession();


    if (
        !session
    ) {

        throw new Error(
            "No active session."
        );

    }


    const driveResponse =
        await fetch(

            "https://mmmsmncmskvuqyhaqcne.supabase.co/functions/v1/create-rigid-drive-item",

            {

                method:
                    "POST",

                headers: {

                    "Authorization":
                        `Bearer ${session.access_token}`,

                    "Content-Type":
                        "application/json"

                },

                body:

                    JSON.stringify({

                        type:
                            data.category,

                        title:
                            data.title,

                        work_id:
                            data.id

                    })

            }

        );


    const driveResult =
        await driveResponse.json();


    if (
        !driveResponse.ok ||
        !driveResult.success
    ) {

        console.error(
            "Google Drive folder creation failed:",
            driveResult
        );


        showToast(
            "Work was created, but its Drive folder could not be created."
        );

    }

    else {

        console.log(
            "RiGiD Drive folder created:",
            driveResult
        );

    }

}

catch (
    driveError
) {

    console.error(
        "Drive creation error:",
        driveError
    );


    showToast(
        "Work was created, but Drive folder creation failed."
    );

}

    /* =================================================
       ADD REAL DATABASE RECORD TO MEMORY
    ================================================= */

    workItems.unshift({

        id:
            data.id,

        type:
            data.category,

        title:
            data.title,

        description:
            data.description || "",

        status:
            data.status,

        startDate:
            data.start_date,

        endDate:
            data.end_date || "",

        updatedDate:
            data.updated_at
                ? data.updated_at.slice(0, 10)
                : data.start_date,

        createdAt:
            data.created_at,

        forumId:
            data.forum_id,

        teamId:
            data.team_id,

        domainId:
            data.domain_id

    });


    /* =================================================
       REFRESH UI
    ================================================= */

    renderWorkCategoryColumns();

    renderAllTimelines();

    renderCalendar();

    loadSelectedDateActivities();

    loadStatistics();


    closeCreateModal();


    showToast(
        `${capitalize(type)} created successfully.`
    );

}


/* =========================================================
   CLOSE CREATE MODAL
========================================================= */

function closeCreateModal() {

    const modal =
        getElement("createModal");


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}

/* =========================================================
   24. REFRESH EVERYTHING
========================================================= */

function refreshWorkspace() {

    loadStatistics();

    renderWorkCategoryColumns();

    renderAllTimelines();

    renderCalendar();

    loadSelectedDateActivities();

}


/* =========================================================
   25. WORK CATEGORY COLUMNS
========================================================= */

function renderWorkCategoryColumns() {

    const categories = [
        "study",
        "project",
        "prototype",
        "design",
        "simulation",
        "paper",
        "reminder"
    ];


    categories.forEach(type => {

        const container =
            getElement(
                `${type}CategoryItems`
            );


        if (!container) {
            return;
        }


        container.innerHTML = "";


        const countElement =
            getElement(
                `${type}CategoryCount`
            );


        /* =================================================
           REMINDERS
        ================================================= */

        if (type === "reminder") {

            const sortedReminders =
                reminders
                    .slice()
                    .sort(
                        (a, b) =>
                            new Date(
                                `${b.date}T00:00:00`
                            ) -
                            new Date(
                                `${a.date}T00:00:00`
                            )
                    );


            if (countElement) {

                countElement.textContent =
                    sortedReminders.length;

            }


            if (!sortedReminders.length) {

                container.innerHTML = `
                    <div class="work-category-empty">
                        No reminders
                    </div>
                `;

                return;

            }


            sortedReminders.forEach(reminder => {

                createWorkCategoryButton(
                    container,
                    reminder.title,
                    reminder.date,
                    reminder
                );

            });


            return;

        }


        /* =================================================
           WORK ITEMS
        ================================================= */

        const items =
            workItems
                .filter(
                    item =>
                        item.type === type
                )
                .sort(
                    (a, b) =>
                        new Date(
                            `${b.createdAt || b.startDate}T00:00:00`
                        ) -
                        new Date(
                            `${a.createdAt || a.startDate}T00:00:00`
                        )
                );


        if (countElement) {

            countElement.textContent =
                items.length;

        }


        if (!items.length) {

            container.innerHTML = `
                <div class="work-category-empty">
                    No ${capitalize(type)} items
                </div>
            `;

            return;

        }


        items.forEach(item => {

            createWorkCategoryButton(
                container,
                item.title,
                item.startDate,
                item
            );

        });

    });

}


/* =========================================================
   26. CATEGORY BUTTON
========================================================= */

function createWorkCategoryButton(
    container,
    title,
    date,
    item
) {

    const button =
        document.createElement("button");


    button.type =
        "button";


    button.className =
        "work-category-item";


    button.innerHTML = `

        <span
            class="work-category-item-title"
            title="${escapeHTML(title)}"
        >
            ${escapeHTML(title)}
        </span>

        <span class="work-category-item-date">
            ${escapeHTML(
        formatDate(date)
    )}
        </span>

    `;


    button.addEventListener(
        "click",
        () => {

            if (!item) {
                return;
            }

            /* REMINDER */
            if (item.type === "reminder") {

                showReminderDetails(item);

                return;
            }


            /* CATEGORY PAGE */
            const pageMap = {

                study:
                    "study/study.html",

                paper:
                    "paper/paper.html",

                simulation:
                    "simulation/simulation.html",

                project:
                    "project/project.html",

                design:
                    "design/design.html",

                prototype:
                    "prototype/prototype.html",

                design:
                    "design/design.html",

                remainder:
                    "remainder/remainder.html"

            };


            const targetPage =
                pageMap[item.type];


            if (targetPage) {

                window.location.href =
                    `${targetPage}?work_id=${encodeURIComponent(item.id)}`;

            }

        }
    );


    container.appendChild(button);

}


/* =========================================================
   27. MAIN TIMELINE
========================================================= */

function renderMainTimeline() {

    const container =
        getElement("timelineGraph");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const timelineItems = [

        ...workItems,

        ...extraActivities
            .filter(
                item =>
                    [
                        "simulation",
                        "reminder"
                    ].includes(item.type)
            )
            .map(
                item => ({
                    ...item,
                    startDate: item.date
                })
            ),

        ...reminders.map(
            reminder => ({
                ...reminder,
                type: "reminder",
                startDate: reminder.date,
                title: reminder.title,
                description: reminder.description
            })
        )

    ]
        .filter(item => item.startDate)
        .sort(
            (a, b) =>
                new Date(
                    `${a.startDate}T00:00:00`
                ) -
                new Date(
                    `${b.startDate}T00:00:00`
                )
        );


    if (!timelineItems.length) {

        container.innerHTML = `
            <div class="no-activity">
                No timeline activity yet.
            </div>
        `;

        return;

    }


    const line =
        document.createElement("div");

    line.className =
        "timeline-line";


    container.appendChild(line);


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "timeline-items";


    timelineItems.forEach(
        (item, index) => {

            const element =
                document.createElement("div");


            element.className =
                `timeline-item timeline-${item.type}`;


            if (item.status === "completed") {

                element.classList.add(
                    "completed"
                );

            }


            const content =
                document.createElement("div");

            content.className =
                "timeline-content";


            content.innerHTML = `

                <div class="timeline-date">
                    ${escapeHTML(
                formatDate(item.startDate)
            )}
                </div>

                <strong>
                    ${escapeHTML(item.title)}
                </strong>

                <small>
                    ${escapeHTML(
                capitalize(item.type)
            )}
                    ${item.status
                    ? " • " +
                    capitalize(item.status)
                    : ""
                }
                </small>

            `;


            const dot =
                document.createElement("div");

            dot.className =
                "timeline-dot";


            element.addEventListener(
                "click",
                () => {

                    if (item.type === "reminder") {

                        showReminderDetails(item);

                    } else {

                        showWorkItemDetails(item);

                    }

                }
            );


            if (index % 2 === 0) {

                element.appendChild(content);

                element.appendChild(dot);

            } else {

                element.appendChild(dot);

                element.appendChild(content);

            }


            wrapper.appendChild(element);

        }
    );


    container.appendChild(wrapper);

}


/* =========================================================
   28. CATEGORY TIMELINES
========================================================= */

function renderCategoryTimeline(type) {

    const container =
        getElement(`${type}Timeline`);

    const countElement =
        getElement(`${type}TimelineCount`);


    if (!container) {
        return;
    }


    const items =
        workItems
            .filter(
                item =>
                    item.type === type
            )
            .sort(
                (a, b) =>
                    new Date(
                        `${a.startDate}T00:00:00`
                    ) -
                    new Date(
                        `${b.startDate}T00:00:00`
                    )
            );


    if (countElement) {

        countElement.textContent =
            items.length;

    }


    container.innerHTML = "";


    if (!items.length) {

        container.innerHTML = `
            <div class="category-empty">
                No ${capitalize(type)} items yet.
            </div>
        `;

        return;

    }


    const line =
        document.createElement("div");

    line.className =
        "category-timeline-line";


    container.appendChild(line);


    const track =
        document.createElement("div");

    track.className =
        "category-timeline-track";


    items.forEach(item => {

        const node =
            document.createElement("div");

        node.className =
            `category-timeline-node node-${type}`;


        if (item.status === "completed") {

            node.classList.add(
                "node-completed"
            );

        }


        node.innerHTML = `

            <div class="category-node-dot"></div>

            <div class="category-node-card">

                <span class="category-node-date">
                    ${escapeHTML(
            formatDate(item.startDate)
        )}
                </span>

                <strong>
                    ${escapeHTML(item.title)}
                </strong>

                <small>
                    ${escapeHTML(
            capitalize(item.status)
        )}
                </small>

            </div>

        `;


        node.addEventListener(
            "click",
            () => {

                showWorkItemDetails(item);

            }
        );


        track.appendChild(node);

    });


    container.appendChild(track);

}


/* =========================================================
   29. ALL TIMELINES
========================================================= */

function renderAllTimelines() {

    renderMainTimeline();

    renderCategoryTimeline("project");

    renderCategoryTimeline("design");

    renderCategoryTimeline("prototype");

    renderCategoryTimeline("paper");

}


/* =========================================================
   30. WORK ITEM DETAILS
========================================================= */

function showWorkItemDetails(item) {

    const modal =
        document.createElement("div");


    modal.className =
        "personal-modal";


    modal.innerHTML = `

        <div class="personal-modal-box work-detail-modal">

            <div class="modal-header">

                <div>

                    <span class="modal-eyebrow">
                        ${escapeHTML(
        capitalize(item.type)
    )}
                    </span>

                    <h3>
                        ${escapeHTML(item.title)}
                    </h3>

                </div>

                <button
                    class="modal-close"
                    type="button"
                >
                    ×
                </button>

            </div>


            <div class="work-detail-content">

                <div
                    class="work-detail-status
                    ${escapeHTML(item.status)}"
                >
                    ${escapeHTML(
        capitalize(item.status)
    )}
                </div>


                <p>
                    ${escapeHTML(
        item.description ||
        "No description provided."
    )}
                </p>


                <div class="work-detail-meta">

                    <div>

                        <span>
                            Started
                        </span>

                        <strong>
                            ${escapeHTML(
        formatDate(item.startDate)
    )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Updated
                        </span>

                        <strong>
                            ${escapeHTML(
        formatDate(
            item.updatedDate
        )
    )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Completed
                        </span>

                        <strong>
                            ${item.endDate
            ? escapeHTML(
                formatDate(
                    item.endDate
                )
            )
            : "—"
        }
                        </strong>

                    </div>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    const close =
        modal.querySelector(".modal-close");


    if (close) {

        close.addEventListener(
            "click",
            () => modal.remove()
        );

    }


    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {

                modal.remove();

            }

        }
    );

}


/* =========================================================
   31. REMINDER DETAILS
========================================================= */

function showReminderDetails(reminder) {

    const modal =
        document.createElement("div");


    modal.className =
        "personal-modal";


    modal.innerHTML = `

        <div class="personal-modal-box work-detail-modal">

            <div class="modal-header">

                <div>

                    <span class="modal-eyebrow">
                        REMINDER
                    </span>

                    <h3>
                        ${escapeHTML(reminder.title)}
                    </h3>

                </div>

                <button
                    class="modal-close"
                    type="button"
                >
                    ×
                </button>

            </div>


            <div class="work-detail-content">

                <div class="work-detail-status ongoing">
                    Reminder
                </div>


                <p>
                    ${escapeHTML(
        reminder.description ||
        "No note provided."
    )}
                </p>


                <div class="work-detail-meta">

                    <div>

                        <span>
                            Date
                        </span>

                        <strong>
                            ${escapeHTML(
        formatDate(reminder.date)
    )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Time
                        </span>

                        <strong>
                            ${escapeHTML(
        `${reminder.hour}:${reminder.minute}`
    )}
                        </strong>

                    </div>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    const close =
        modal.querySelector(".modal-close");


    if (close) {

        close.addEventListener(
            "click",
            () => modal.remove()
        );

    }


    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {

                modal.remove();

            }

        }
    );

}


/* =========================================================
   32. CALENDAR INITIALIZATION
========================================================= */

function initializeCalendar() {

    const previous =
        getElement("previousMonth");

    const next =
        getElement("nextMonth");


    if (previous) {

        previous.addEventListener(
            "click",
            () => {

                calendarDate =
                    new Date(
                        calendarDate.getFullYear(),
                        calendarDate.getMonth() - 1,
                        1
                    );

                renderCalendar();

            }
        );

    }


    if (next) {

        next.addEventListener(
            "click",
            () => {

                calendarDate =
                    new Date(
                        calendarDate.getFullYear(),
                        calendarDate.getMonth() + 1,
                        1
                    );

                renderCalendar();

            }
        );

    }

}


/* =========================================================
   33. CALENDAR RENDER
========================================================= */

function renderCalendar() {

    const container =
        getElement("calendarDays");

    const monthLabel =
        getElement("calendarMonth");

    const yearLabel =
        getElement("calendarYear");


    if (!container) {

        console.error(
            "Calendar container #calendarDays not found."
        );

        return;

    }


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    /* =================================================
       MONTH / YEAR
    ================================================= */

    if (monthLabel) {

        monthLabel.textContent =
            calendarDate.toLocaleDateString(
                undefined,
                {
                    month: "long"
                }
            );

    }


    if (yearLabel) {

        yearLabel.textContent =
            year;

    }


    /* =================================================
       CLEAR OLD DATES
    ================================================= */

    container.innerHTML = "";


    /* =================================================
       FIRST DAY OF MONTH

       Monday = 0
       Sunday = 6
    ================================================= */

    let firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    firstDay =
        firstDay === 0
            ? 6
            : firstDay - 1;


    /* =================================================
       NUMBER OF DAYS
    ================================================= */

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    /* =================================================
       PREVIOUS MONTH DATES
    ================================================= */

    const previousMonthDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    for (
        let i = firstDay - 1;
        i >= 0;
        i--
    ) {

        const date =
            new Date(
                year,
                month - 1,
                previousMonthDays - i
            );


        container.appendChild(
            createCalendarDay(
                date,
                true
            )
        );

    }


    /* =================================================
       CURRENT MONTH DATES
    ================================================= */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        container.appendChild(
            createCalendarDay(
                date,
                false
            )
        );

    }


    /* =================================================
       NEXT MONTH DATES
    ================================================= */

    const totalCells =
        container.children.length;


    const remaining =
        (
            Math.ceil(
                totalCells / 7
            ) * 7
        ) -
        totalCells;


    for (
        let day = 1;
        day <= remaining;
        day++
    ) {

        const date =
            new Date(
                year,
                month + 1,
                day
            );


        container.appendChild(
            createCalendarDay(
                date,
                true
            )
        );

    }


    console.log(
        "Calendar rendered:",
        year,
        month + 1,
        "dates:",
        container.children.length
    );

}


/* =========================================================
   34. CALENDAR DAY
========================================================= */

function createCalendarDay(date, otherMonth) {

    const button =
        document.createElement("button");


    button.type =
        "button";


    button.className =
        "calendar-day";


    if (otherMonth) {

        button.classList.add(
            "other-month"
        );

    }


    const key =
        getDateKey(date);


    if (
        key ===
        getDateKey(new Date())
    ) {

        button.classList.add(
            "today"
        );

    }


    if (
        key ===
        getDateKey(selectedDate)
    ) {

        button.classList.add(
            "selected"
        );

    }


    if (
        hasActivityOnDate(key)
    ) {

        button.classList.add(
            "has-activity"
        );

    }


    button.textContent =
        date.getDate();


    button.addEventListener(
        "click",
        () => {

            selectedDate =
                new Date(date);


            calendarDate =
                new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    1
                );


            renderCalendar();

            loadSelectedDateActivities();

        }
    );


    return button;

}


/* =========================================================
   35. DATE KEY
========================================================= */

function getDateKey(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


/* =========================================================
   36. DATE ACTIVITY CHECK
========================================================= */

function hasActivityOnDate(date) {

    if (dailyBlogs[date]) {
        return true;
    }


    if (
        workItems.some(
            item =>
                item.startDate === date ||
                item.endDate === date ||
                item.updatedDate === date
        )
    ) {
        return true;
    }


    if (
        extraActivities.some(
            item =>
                item.date === date
        )
    ) {
        return true;
    }


    if (
        reminders.some(
            item =>
                item.date === date
        )
    ) {
        return true;
    }


    return false;

}


/* =========================================================
   37. DAILY BLOG
========================================================= */

function initializeDailyBlog() {

    const save =
        getElement("saveBlogBtn");

    const textarea =
        getElement("dailyBlog");


    if (save) {

        save.addEventListener(
            "click",
            saveDailyBlog
        );

    }


    if (textarea) {

        textarea.addEventListener(
            "input",
            () => {

                setText(
                    "blogSaveStatus",
                    "Unsaved changes"
                );

            }
        );

    }

}


function loadSelectedDateActivities() {

    const date =
        getDateKey(selectedDate);


    setText(
        "selectedDate",
        selectedDate.toLocaleDateString(
            undefined,
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        )
    );


    const textarea =
        getElement("dailyBlog");


    if (textarea) {

        textarea.value =
            dailyBlogs[date] || "";

    }


    setText(
        "blogSaveStatus",
        dailyBlogs[date]
            ? "Saved"
            : "No changes"
    );


    const activities =
        getActivitiesForDate(date);


    setText(
        "dayActivityCount",
        `${activities.length} ACTIVIT${activities.length === 1
            ? "Y"
            : "IES"
        }`
    );


    renderDateActivities(activities);

}


function saveDailyBlog() {

    const textarea =
        getElement("dailyBlog");


    if (!textarea) {
        return;
    }


    const date =
        getDateKey(selectedDate);


    const value =
        textarea.value.trim();


    if (value) {

        dailyBlogs[date] =
            value;

    } else {

        delete dailyBlogs[date];

    }


    renderCalendar();

    loadSelectedDateActivities();


    showToast(
        "Daily blog saved."
    );

}


/* =========================================================
   38. GET DATE ACTIVITIES
========================================================= */

function getActivitiesForDate(date) {

    const activities = [];


    if (dailyBlogs[date]) {

        activities.push({

            type:
                "blog",

            title:
                "Daily Blog",

            description:
                dailyBlogs[date]

        });

    }


    workItems.forEach(item => {

        if (item.startDate === date) {

            activities.push({

                type:
                    item.type,

                title:
                    item.title,

                description:
                    `Started — ${capitalize(
                        item.status
                    )}`,

                workItem:
                    item

            });

        }


        if (item.endDate === date) {

            activities.push({

                type:
                    item.type,

                title:
                    item.title,

                description:
                    "Completed",

                workItem:
                    item

            });

        }


        if (
            item.updatedDate === date &&
            item.startDate !== date &&
            item.endDate !== date
        ) {

            activities.push({

                type:
                    item.type,

                title:
                    item.title,

                description:
                    "Updated",

                workItem:
                    item

            });

        }

    });


    extraActivities.forEach(item => {

        if (item.date === date) {

            activities.push(item);

        }

    });


    reminders.forEach(reminder => {

        if (reminder.date === date) {

            activities.push({

                type:
                    "reminder",

                title:
                    reminder.title,

                description:
                    `${reminder.hour}:${reminder.minute} — ${reminder.description || ""
                    }`,

                reminder:
                    reminder

            });

        }

    });


    return activities;

}


/* =========================================================
   39. RENDER DATE ACTIVITIES
========================================================= */

function renderDateActivities(activities) {

    const container =
        getElement("dateActivityList");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!activities.length) {

        container.innerHTML = `
            <div class="no-activity">
                No activity recorded for this date.
            </div>
        `;

        return;

    }


    activities.forEach(activity => {

        const element =
            document.createElement("div");


        element.className =
            "date-activity-item";


        element.innerHTML = `

            <div class="date-activity-icon">
                ${getActivityIcon(activity.type)}
            </div>

            <div class="date-activity-info">

                <strong>
                    ${escapeHTML(activity.title)}
                </strong>

                <small>
                    ${escapeHTML(
            activity.description || ""
        )}
                </small>

            </div>

            <span class="date-activity-type">
                ${escapeHTML(
            capitalize(activity.type)
        )}
            </span>

        `;


        element.addEventListener(
            "click",
            () => {

                if (activity.workItem) {

                    showWorkItemDetails(
                        activity.workItem
                    );

                } else if (activity.reminder) {

                    showReminderDetails(
                        activity.reminder
                    );

                }

            }
        );


        container.appendChild(element);

    });

}


/* =========================================================
   40. REMINDERS
========================================================= */

function initializeReminderModal() {

    const form =
        getElement("reminderForm");

    const close =
        getElement("closeReminderModal");

    const cancel =
        getElement("cancelReminderModal");


    if (form) {

        form.addEventListener(
            "submit",
            saveReminder
        );

    }


    if (close) {

        close.addEventListener(
            "click",
            closeReminderModal
        );

    }


    if (cancel) {

        cancel.addEventListener(
            "click",
            closeReminderModal
        );

    }

}


function openReminderModal() {

    setInput(
        getElement("reminderTitle"),
        ""
    );

    setInput(
        getElement("reminderDate"),
        getDateKey(new Date())
    );

    setInput(
        getElement("reminderHour"),
        ""
    );

    setInput(
        getElement("reminderMinute"),
        ""
    );

    setInput(
        getElement("reminderDescription"),
        ""
    );


    const modal =
        getElement("reminderModal");


    if (modal) {

        modal.classList.remove("hidden");

    }

}


function saveReminder(event) {

    event.preventDefault();


    const title =
        getInputValue("reminderTitle");

    const date =
        getInputValue("reminderDate");

    const hour =
        getInputValue("reminderHour");

    const minute =
        getInputValue("reminderMinute");

    const description =
        getInputValue("reminderDescription");


    if (
        !title ||
        !date ||
        hour === "" ||
        minute === ""
    ) {

        showToast(
            "Please complete the reminder details."
        );

        return;

    }


    reminders.push({

        id:
            Date.now(),

        title:
            title,

        date:
            date,

        hour:
            hour,

        minute:
            minute,

        description:
            description,

        createdAt:
            date

    });


    refreshWorkspace();


    closeReminderModal();


    showToast(
        `Reminder set for ${date} at ${hour}:${minute}.`
    );

}


function closeReminderModal() {

    const modal =
        getElement("reminderModal");

    if (modal) {

        modal.classList.add("hidden");

    }

}


/* =========================================================
   41. LINK
========================================================= */

function initializeLinkModal() {

    const form =
        getElement("linkForm");

    const close =
        getElement("closeLinkModal");

    const cancel =
        getElement("cancelLinkModal");


    if (form) {

        form.addEventListener(
            "submit",
            saveLink
        );

    }


    if (close) {

        close.addEventListener(
            "click",
            closeLinkModal
        );

    }


    if (cancel) {

        cancel.addEventListener(
            "click",
            closeLinkModal
        );

    }

}


function openLinkModal() {

    setInput(
        getElement("linkTitle"),
        ""
    );

    setInput(
        getElement("linkURL"),
        ""
    );

    setInput(
        getElement("linkDescription"),
        ""
    );


    const modal =
        getElement("linkModal");


    if (modal) {

        modal.classList.remove("hidden");

    }

}


function saveLink(event) {

    event.preventDefault();


    const title =
        getInputValue("linkTitle");

    const url =
        getInputValue("linkURL");


    if (!title || !url) {

        showToast(
            "Please enter title and URL."
        );

        return;

    }


    try {

        new URL(url);

    } catch {

        showToast(
            "Please enter a valid URL."
        );

        return;

    }


    extraActivities.push({

        id:
            `link-${Date.now()}`,

        date:
            getDateKey(selectedDate),

        type:
            "link",

        title:
            title,

        description:
            getInputValue("linkDescription"),

        url:
            url

    });


    closeLinkModal();

    renderCalendar();

    loadSelectedDateActivities();


    showToast(
        "Link added."
    );

}


function closeLinkModal() {

    const modal =
        getElement("linkModal");

    if (modal) {

        modal.classList.add("hidden");

    }

}


/* =========================================================
   42. UPLOAD
========================================================= */

function initializeUpload() {

    const button =
        getElement("uploadMenuBtn");

    const menu =
        getElement("uploadMenu");

    const input =
        getElement("generalUploadInput");


    /*
       These elements are not currently present
       in personal.html, so simply skip safely.
    */

    if (!button || !menu) {
        return;
    }


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            menu.classList.toggle("hidden");

            button.setAttribute(
                "aria-expanded",
                String(
                    !menu.classList.contains("hidden")
                )
            );

        }
    );


    document
        .querySelectorAll(".upload-option")
        .forEach(option => {

            option.addEventListener(
                "click",
                () => {

                    const type =
                        option.dataset.upload;


                    if (type === "link") {

                        closeUploadMenu();

                        openLinkModal();

                    } else {

                        openFilePicker(type);

                        closeUploadMenu();

                    }

                }
            );

        });


    if (input) {

        input.addEventListener(
            "change",
            handleFileSelection
        );

    }


    document.addEventListener(
        "click",
        event => {

            if (
                !event.target.closest(".upload-section")
            ) {

                closeUploadMenu();

            }

        }
    );

}


function openFilePicker(type) {

    const input =
        getElement("generalUploadInput");


    if (!input) {
        return;
    }


    if (type === "photo") {

        input.accept =
            "image/*";

    } else if (type === "document") {

        input.accept =
            ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt";

    } else if (type === "video") {

        input.accept =
            "video/*";

    } else {

        input.accept =
            "*/*";

    }


    input.value = "";

    input.click();

}


function handleFileSelection(event) {

    const files =
        Array.from(
            event.target.files || []
        );


    if (!files.length) {
        return;
    }


    files.forEach(file => {

        uploadedFiles.push(file);


        extraActivities.push({

            id:
                `upload-${Date.now()}-${Math.random()}`,

            date:
                getDateKey(selectedDate),

            type:
                "upload",

            title:
                file.name,

            description:
                `${formatFileType(file.type)} • ${formatFileSize(file.size)
                }`

        });

    });


    renderCalendar();

    loadSelectedDateActivities();


    showToast(
        `${files.length} file${files.length > 1 ? "s" : ""
        } added.`
    );

}


function closeUploadMenu() {

    const menu =
        getElement("uploadMenu");

    const button =
        getElement("uploadMenuBtn");


    if (menu) {

        menu.classList.add("hidden");

    }


    if (button) {

        button.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}


/* =========================================================
   43. SETTINGS
========================================================= */

function initializeSettings() {

    const button =
        getElement("settingsBtn");

    const modal =
        getElement("settingsModal");

    const close =
        getElement("closeSettings");


    if (button && modal) {

        button.addEventListener(
            "click",
            () => {

                modal.classList.remove("hidden");

            }
        );

    }


    if (close && modal) {

        close.addEventListener(
            "click",
            () => {

                modal.classList.add("hidden");

            }
        );

    }


    const edit =
        getElement("editProfileBtn");


    if (edit) {

        edit.addEventListener(
            "click",
            () => {

                if (modal) {
                    modal.classList.add("hidden");
                }

                openProfileEditModal();

            }
        );

    }


    const account =
        getElement("accountSettingsBtn");


    if (account) {

        account.addEventListener(
            "click",
            () => {

                showToast(
                    "Account settings will be connected later."
                );

            }
        );

    }


    const privacy =
        getElement("privacySettingsBtn");


    if (privacy) {

        privacy.addEventListener(
            "click",
            () => {

                showToast(
                    "Privacy settings will be connected later."
                );

            }
        );

    }

}


/* =========================================================
   44. THEME
========================================================= */

function initializeTheme() {

    const button =
        getElement("themeToggle");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "theme-dim"
            );


            showToast(
                document.body.classList.contains(
                    "theme-dim"
                )
                    ? "Dim theme enabled."
                    : "Standard theme enabled."
            );

        }
    );

}


/* =========================================================
   45. HEADER
========================================================= */

function initializeHeader() {

    const signout =
        getElement("signOutBtn");

    if (!signout) {

        console.error(
            "Sign Out button not found: #signOutBtn"
        );

        return;

    }


    signout.addEventListener(
        "click",
        async () => {

            const confirmed =
                window.confirm(
                    "Are you sure you want to sign out?"
                );

            if (!confirmed) {
                return;
            }


            console.log(
                "Sign out button clicked."
            );


            try {

                /*
                 * Sign out from Supabase
                 */

                const {
                    error
                } = await sb.auth.signOut();


                if (error) {

                    console.error(
                        "Supabase sign out failed:",
                        error
                    );

                    alert(
                        "Sign out failed: " +
                        error.message
                    );

                    return;

                }


                console.log(
                    "Supabase sign out successful."
                );


                /*
                 * Go directly to login page
                 */

                window.location.href =
                    "../../login/login.html";

            }

            catch (error) {

                console.error(
                    "Sign out error:",
                    error
                );

                alert(
                    "Unable to sign out."
                );

            }

        }
    );

}


/* =========================================================
   46. CLOCK
========================================================= */

function initializeClock() {

    const clock =
        getElement("liveClock");


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
            now.toLocaleTimeString(
                undefined,
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );


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
   47. TOAST
========================================================= */

function showToast(message) {

    const toast =
        getElement("personalToast");

    const text =
        getElement("toastMessage");


    if (!toast || !text) {
        return;
    }


    text.textContent =
        message;


    toast.classList.remove("hidden");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(
            () => {

                toast.classList.add(
                    "hidden"
                );

            },
            2800
        );

}


/* =========================================================
   48. DATE FORMAT
========================================================= */

function formatDate(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


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
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   49. ACTIVITY ICON
========================================================= */

function getActivityIcon(type) {

    const icons = {

        project:
            "◈",

        design:
            "◐",

        prototype:
            "⬡",

        simulation:
            "⌁",

        paper:
            "▤",

        study:
            "⌕",

        reminder:
            "◷",

        blog:
            "✎",

        upload:
            "↑",

        link:
            "🔗"

    };


    return (
        icons[type] ||
        "•"
    );

}


/* =========================================================
   50. FILE TYPE
========================================================= */

function formatFileType(mime) {

    if (!mime) {
        return "File";
    }


    if (mime.startsWith("image/")) {
        return "Photo";
    }


    if (mime.startsWith("video/")) {
        return "Video";
    }


    if (mime.includes("pdf")) {
        return "PDF";
    }


    if (
        mime.includes("word") ||
        mime.includes("document")
    ) {
        return "Document";
    }


    if (
        mime.includes("sheet") ||
        mime.includes("excel")
    ) {
        return "Spreadsheet";
    }


    if (
        mime.includes("presentation") ||
        mime.includes("powerpoint")
    ) {
        return "Presentation";
    }


    return "File";

}


/* =========================================================
   51. FILE SIZE
========================================================= */

function formatFileSize(bytes) {

    if (!bytes) {
        return "0 B";
    }


    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.min(
            Math.floor(
                Math.log(bytes) /
                Math.log(1024)
            ),
            units.length - 1
        );


    const size =
        bytes /
        Math.pow(
            1024,
            index
        );


    return `${size.toFixed(
        index === 0 ? 0 : 1
    )} ${units[index]}`;

}


/* =========================================================
   52. ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }


        closeCreateModal();

        closeReminderModal();

        closeLinkModal();

        closeProfileEditModal();

        closeSocialModal();

        closeAddProfileDetailModal();

        closeQuickCreate();

        closeUploadMenu();

        closeWorkListModal();


        const settings =
            getElement("settingsModal");


        if (settings) {

            settings.classList.add("hidden");

        }

    }
);

/* =========================================================
   ACCOLADES
========================================================= */

function initializeAccolades() {

    const button =
        getElement("accoladesBtn");

    const modal =
        getElement("accoladesModal");

    const close =
        getElement("closeAccoladesModal");

    const cancel =
        getElement("cancelAccolade");

    const form =
        getElement("addAccoladeForm");


    if (button) {

        button.addEventListener(
            "click",
            openAccoladesModal
        );

    }


    if (close) {

        close.addEventListener(
            "click",
            closeAccoladesModal
        );

    }


    if (cancel) {

        cancel.addEventListener(
            "click",
            closeAccoladesModal
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            addAccolade
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeAccoladesModal();

                }

            }
        );

    }


    renderAccolades();

}


function openAccoladesModal() {

    const modal =
        getElement("accoladesModal");


    renderAccolades();


    if (modal) {

        modal.classList.remove("hidden");

    }

}


function closeAccoladesModal() {

    const modal =
        getElement("accoladesModal");


    if (modal) {

        modal.classList.add("hidden");

    }

}


function renderAccolades() {

    const container =
        getElement("accoladesList");

    const count =
        getElement("accoladesCount");


    if (!container) {
        return;
    }


    if (count) {

        count.textContent =
            accolades.length;

    }


    container.innerHTML = "";


    if (!accolades.length) {

        container.innerHTML = `

            <div class="accolades-empty">

                No accolades added yet.

            </div>

        `;

        return;

    }


    /*
       Newest accolades first
    */

    const sorted =
        accolades
            .slice()
            .sort(
                (a, b) =>
                    new Date(
                        `${b.date}T00:00:00`
                    ) -
                    new Date(
                        `${a.date}T00:00:00`
                    )
            );


    sorted.forEach(accolade => {

        const item =
            document.createElement("div");


        item.className =
            "accolade-item";


        item.innerHTML = `

            <div class="accolade-icon">
                ★
            </div>


            <div class="accolade-info">

                <strong>
                    ${escapeHTML(
            accolade.title
        )}
                </strong>

                <small>
                     ${escapeHTML(
            accolade.description || ""
        )}
                </small>

            ${accolade.url
                ? `
            <a
                href="${escapeHTML(accolade.url)}"
                class="accolade-link"
                target="_blank"
                rel="noopener noreferrer"
            >
                View Link ↗
            </a>
        `
                : ""
            }

            </div>


            <div>

                <div class="accolade-date">
                    ${escapeHTML(
                formatDate(
                    accolade.date
                )
            )}
                </div>

                <button
                    type="button"
                    class="delete-accolade-btn"
                    title="Delete"
                    data-accolade-id="${accolade.id}"
                >
                    ×
                </button>

            </div>

        `;


        const deleteButton =
            item.querySelector(
                ".delete-accolade-btn"
            );


        if (deleteButton) {

            deleteButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    deleteAccolade(
                        Number(
                            deleteButton.dataset
                                .accoladeId
                        )
                    );

                }
            );

        }


        container.appendChild(item);

    });

}


function addAccolade(event) {

    event.preventDefault();


    const title =
        getInputValue("accoladeTitle");

    const date =
        getInputValue("accoladeDate");

    const description =
        getInputValue(
            "accoladeDescription"
        );

    const urlElement =
        getElement("accoladeUrl");

    const url =
        urlElement
            ? urlElement.value.trim()
            : "";


    if (!title || !date) {

        showToast(
            "Please enter the accolade title and date."
        );

        return;

    }


    accolades.push({

        id:
            Date.now(),

        title:
            title,

        date:
            date,

        description:
            description,

        url:
            url

    });


    renderAccolades();


    const form =
        getElement("addAccoladeForm");


    if (form) {

        form.reset();

    }


    showToast(
        "Accolade added successfully."
    );

}


function deleteAccolade(id) {

    const accolade =
        accolades.find(
            item =>
                item.id === id
        );


    if (!accolade) {
        return;
    }


    const confirmed =
        window.confirm(
            `Delete "${accolade.title}"?`
        );


    if (!confirmed) {
        return;
    }


    accolades =
        accolades.filter(
            item =>
                item.id !== id
        );


    renderAccolades();


    showToast(
        "Accolade removed."
    );

}


/* =========================================================
   53. GLOBAL FUNCTIONS
========================================================= */

window.openCreateModal =
    openCreateModal;

window.closeCreateModal =
    closeCreateModal;

window.openReminderModal =
    openReminderModal;

window.closeReminderModal =
    closeReminderModal;

window.openLinkModal =
    openLinkModal;

window.closeLinkModal =
    closeLinkModal;

window.openProfileEditModal =
    openProfileEditModal;

window.closeProfileEditModal =
    closeProfileEditModal;

window.openAddProfileDetailModal =
    openAddProfileDetailModal;

window.closeAddProfileDetailModal =
    closeAddProfileDetailModal;

window.closeQuickCreate =
    closeQuickCreate;

window.closeUploadMenu =
    closeUploadMenu;

window.saveDailyBlog =
    saveDailyBlog;

window.renderCalendar =
    renderCalendar;

window.renderWorkCategoryColumns =
    renderWorkCategoryColumns;

window.refreshWorkspace =
    refreshWorkspace;

/* =========================================================
   UNDER CONSTRUCTION MESSAGE
========================================================= */

function showUnderConstruction() {

    /* Prevent duplicate message */
    const existing =
        document.getElementById("underConstructionModal");

    if (existing) {
        return;
    }


    const modal =
        document.createElement("div");

    modal.className =
        "personal-modal";

    modal.id =
        "underConstructionModal";


    modal.innerHTML = `

        <div class="personal-modal-box under-construction-modal">

            <div class="modal-header">

                <div>

                    <span class="modal-eyebrow">
                        REMINDER
                    </span>

                    <h3>
                        Under Construction
                    </h3>

                </div>

                <button
                    class="modal-close"
                    type="button"
                    id="closeUnderConstruction"
                >
                    ×
                </button>

            </div>


            <div
                class="under-construction-content"
                style="
                    text-align:center;
                    padding:35px 20px;
                "
            >

                <div
                    style="
                        font-size:48px;
                        margin-bottom:15px;
                    "
                >
                    🚧
                </div>

                <h3
                    style="
                        margin:0 0 10px;
                    "
                >
                    Under Construction
                </h3>

                <p
                    style="
                        margin:0;
                        opacity:0.7;
                    "
                >
                    The Reminder feature is currently under construction.
                </p>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    /* =================================================
       CLOSE BUTTON
    ================================================= */

    const closeButton =
        document.getElementById(
            "closeUnderConstruction"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );

    }


    /* =================================================
       CLICK OUTSIDE
    ================================================= */

    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {

                modal.remove();

            }

        }
    );


    /* =================================================
       ESCAPE KEY
    ================================================= */

    const escapeHandler =
        event => {

            if (event.key === "Escape") {

                modal.remove();

                document.removeEventListener(
                    "keydown",
                    escapeHandler
                );

            }

        };


    document.addEventListener(
        "keydown",
        escapeHandler
    );

}

async function submitFeedback() {
    const input = document.getElementById("feedbackInput");

    if (!input) return;

    const message = input.value.trim();

    if (!message) {
        showToast("Please enter an issue or suggestion.");
        input.focus();
        return;
    }

    try {
        const {
            data: { user },
            error: authError
        } = await sb.auth.getUser();

        if (authError) {
            console.error("Authentication error:", authError);
            showToast("Unable to identify your account.");
            return;
        }

        if (!user) {
            showToast("Please log in before submitting a report.");
            return;
        }

        const { error } = await sb
            .from("support_reports")
            .insert({
                profile_id: user.id,
                message: message,
                status: "noted"
            });

        if (error) {
            console.error("Support report submission error:", error);
            showToast("Failed to submit the report.");
            return;
        }

        input.value = "";

        showToast("Your report has been submitted.");

    } catch (error) {
        console.error("Unexpected support report error:", error);
        showToast("Something went wrong while submitting the report.");
    }
}


/* =========================================================
   JOIN FORUM
   CURRENT VERSION
   Uses:
   - joinForumBtn
   - joinForumModal
   - joinForumSelect
   - joinTarget
   - joinForumForm

   Team / Domain are handled by ONE dropdown.
========================================================= */

(function initJoinForum() {

    const joinBtn =
        document.getElementById("joinForumBtn");

    const modal =
        document.getElementById("joinForumModal");

    const closeBtn =
        document.getElementById("closeJoinForumModal");

    const cancelBtn =
        document.getElementById("cancelJoinForumModal");

    const joinForm =
        document.getElementById("joinForumForm");

    const forumSelect =
        document.getElementById("joinForumSelect");

    const targetSelect =
        document.getElementById("joinTarget");

    const infoBox =
        document.getElementById("joinForumInfo");

    const submitBtn =
        document.getElementById("submitJoinForum");


    /* =====================================================
       SAFETY CHECK
    ===================================================== */

    if (
        !joinBtn ||
        !modal ||
        !forumSelect ||
        !targetSelect ||
        !joinForm
    ) {

        console.warn(
            "Join Forum: required elements not found."
        );

        return;
    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    joinBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            modal.classList.remove(
                "hidden"
            );

            resetJoinForumForm();

            await loadJoinForums();

        }
    );


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeJoinForumModal() {

        modal.classList.add(
            "hidden"
        );

        resetJoinForumForm();

    }


    closeBtn?.addEventListener(
        "click",
        closeJoinForumModal
    );


    cancelBtn?.addEventListener(
        "click",
        closeJoinForumModal
    );


    /* =====================================================
       CLICK OUTSIDE MODAL
    ===================================================== */

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeJoinForumModal();

            }

        }
    );


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !modal.classList.contains("hidden")
            ) {

                closeJoinForumModal();

            }

        }
    );


    /* =====================================================
       RESET FORM
    ===================================================== */

    function resetJoinForumForm() {

        forumSelect.value = "";

        targetSelect.innerHTML = `
            <option value="">
                Select Team/Domain
            </option>
        `;

        targetSelect.disabled = true;

        if (infoBox) {

            infoBox.textContent =
                "Select a forum and then choose a team or domain.";

            infoBox.classList.add(
                "hidden"
            );

        }

        if (submitBtn) {

            submitBtn.disabled = false;

            submitBtn.textContent =
                "Join Forum";

        }

    }


    /* =====================================================
       LOAD FORUMS
    ===================================================== */

    async function loadJoinForums() {

        forumSelect.disabled = true;

        forumSelect.innerHTML = `
            <option value="">
                Loading forums...
            </option>
        `;


        try {

            const {
                data,
                error
            } = await sb
                .from("forums")
                .select(
                    "id, name, description"
                )
                .order(
                    "name",
                    {
                        ascending: true
                    }
                );


            if (error) {

                console.error(
                    "Failed to load forums:",
                    error
                );

                forumSelect.innerHTML = `
                    <option value="">
                        Unable to load forums
                    </option>
                `;

                if (infoBox) {

                    infoBox.textContent =
                        error.message ||
                        "Unable to load forums.";

                    infoBox.classList.remove(
                        "hidden"
                    );

                }

                return;

            }


            forumSelect.innerHTML = `
                <option value="">
                    Select Forum
                </option>
            `;


            (data || []).forEach(
                forum => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        forum.id;

                    option.textContent =
                        forum.name;

                    forumSelect.appendChild(
                        option
                    );

                }
            );


            forumSelect.disabled = false;


            if (!data || !data.length) {

                if (infoBox) {

                    infoBox.textContent =
                        "No forums are currently available.";

                    infoBox.classList.remove(
                        "hidden"
                    );

                }

            }

        }
        catch (error) {

            console.error(
                "Unexpected forum loading error:",
                error
            );

            forumSelect.innerHTML = `
                <option value="">
                    Unable to load forums
                </option>
            `;

            if (infoBox) {

                infoBox.textContent =
                    "Unable to load forums.";

                infoBox.classList.remove(
                    "hidden"
                );

            }

        }

    }


    /* =====================================================
       FORUM CHANGED
    ===================================================== */

    forumSelect.addEventListener(
        "change",
        async () => {

            const forumId =
                forumSelect.value;


            /* ---------------------------------------------
               RESET TARGET
            --------------------------------------------- */

            targetSelect.innerHTML = `
                <option value="">
                    Select Team/Domain
                </option>
            `;

            targetSelect.disabled =
                true;


            if (infoBox) {

                infoBox.classList.add(
                    "hidden"
                );

            }


            if (!forumId) {

                return;

            }


            if (infoBox) {

                infoBox.textContent =
                    "Loading teams and domains...";

                infoBox.classList.remove(
                    "hidden"
                );

            }


            await loadForumTargets(
                forumId
            );

        }
    );


    /* =====================================================
       LOAD TEAMS + DOMAINS
    ===================================================== */

    async function loadForumTargets(
        forumId
    ) {

        try {

            const [
                teamsResult,
                domainsResult
            ] = await Promise.all([

                sb
                    .from("teams")
                    .select(
                        "id, name, description, forum_id"
                    )
                    .eq(
                        "forum_id",
                        forumId
                    )
                    .order(
                        "name",
                        {
                            ascending: true
                        }
                    ),

                sb
                    .from("domains")
                    .select(
                        "id, name, description, forum_id"
                    )
                    .eq(
                        "forum_id",
                        forumId
                    )
                    .order(
                        "name",
                        {
                            ascending: true
                        }
                    )

            ]);


            /* ---------------------------------------------
               ERROR CHECK
            --------------------------------------------- */

            if (
                teamsResult.error
            ) {

                console.error(
                    "Failed to load teams:",
                    teamsResult.error
                );

            }


            if (
                domainsResult.error
            ) {

                console.error(
                    "Failed to load domains:",
                    domainsResult.error
                );

            }


            const teams =
                teamsResult.data || [];

            const domains =
                domainsResult.data || [];


            /* ---------------------------------------------
               CLEAR OPTIONS
            --------------------------------------------- */

            targetSelect.innerHTML = `
                <option value="">
                    Select Team/Domain
                </option>
            `;


            /* ---------------------------------------------
               TEAMS
            --------------------------------------------- */

            teams.forEach(
                team => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        `team:${team.id}`;

                    option.textContent =
                        `Team — ${team.name}`;

                    targetSelect.appendChild(
                        option
                    );

                }
            );


            /* ---------------------------------------------
               DOMAINS
            --------------------------------------------- */

            domains.forEach(
                domain => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        `domain:${domain.id}`;

                    option.textContent =
                        `Domain — ${domain.name}`;

                    targetSelect.appendChild(
                        option
                    );

                }
            );


            /* ---------------------------------------------
               ENABLE TARGET SELECT
            --------------------------------------------- */

            targetSelect.disabled =
                (
                    teams.length === 0 &&
                    domains.length === 0
                );


            /* ---------------------------------------------
               INFORMATION
            --------------------------------------------- */

            if (
                teams.length === 0 &&
                domains.length === 0
            ) {

                if (infoBox) {

                    infoBox.textContent =
                        "This forum currently has no teams or domains.";

                    infoBox.classList.remove(
                        "hidden"
                    );

                }

                return;

            }


            if (infoBox) {

                infoBox.textContent =
                    "Choose the team or domain you want to join.";

                infoBox.classList.remove(
                    "hidden"
                );

            }

        }
        catch (error) {

            console.error(
                "Failed to load forum targets:",
                error
            );


            targetSelect.innerHTML = `
                <option value="">
                    Unable to load options
                </option>
            `;

            targetSelect.disabled =
                true;


            if (infoBox) {

                infoBox.textContent =
                    "Unable to load teams or domains.";

                infoBox.classList.remove(
                    "hidden"
                );

            }

        }

    }


    /* =====================================================
       TARGET CHANGED
    ===================================================== */

    targetSelect.addEventListener(
        "change",
        () => {

            if (
                targetSelect.value &&
                infoBox
            ) {

                infoBox.classList.add(
                    "hidden"
                );

            }

        }
    );


    /* =====================================================
       SUBMIT JOIN FORUM
    ===================================================== */

    joinForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const forumId =
                forumSelect.value;


            const target =
                targetSelect.value;


            /* ---------------------------------------------
               VALIDATE FORUM
            --------------------------------------------- */

            if (!forumId) {

                if (infoBox) {

                    infoBox.textContent =
                        "Please select a forum.";

                    infoBox.classList.remove(
                        "hidden"
                    );

                }

                return;

            }


            /* ---------------------------------------------
               VALIDATE TARGET
            --------------------------------------------- */

            if (!target) {

                if (infoBox) {

                    infoBox.textContent =
                        "Please select a team or domain.";

                    infoBox.classList.remove(
                        "hidden"
                    );

                }

                return;

            }


            /* ---------------------------------------------
               PARSE TEAM / DOMAIN
            --------------------------------------------- */

            let teamId =
                null;

            let domainId =
                null;


            if (
                target.startsWith(
                    "team:"
                )
            ) {

                teamId =
                    target.substring(
                        5
                    );

            }


            if (
                target.startsWith(
                    "domain:"
                )
            ) {

                domainId =
                    target.substring(
                        7
                    );

            }


            /* ---------------------------------------------
               SAFETY VALIDATION
            --------------------------------------------- */

            if (
                !teamId &&
                !domainId
            ) {

                if (infoBox) {

                    infoBox.textContent =
                        "Invalid team or domain selection.";

                    infoBox.classList.remove(
                        "hidden"
                    );

                }

                return;

            }


            /* ---------------------------------------------
               GET CURRENT USER
            --------------------------------------------- */

            const {
                data: {
                    user
                },
                error: userError
            } =
                await sb.auth.getUser();


            if (
                userError ||
                !user
            ) {

                console.error(
                    "Unable to identify current user:",
                    userError
                );


                if (infoBox) {

                    infoBox.textContent =
                        "Your session has expired. Please log in again.";

                    infoBox.classList.remove(
                        "hidden"
                    );

                }

                return;

            }


            /* ---------------------------------------------
               DISABLE BUTTON
            --------------------------------------------- */

            /* ---------------------------------------------
   CHECK EXISTING MEMBERSHIP
--------------------------------------------- */

if (teamId) {

    const {
        data: existingTeam,
        error: teamCheckError
    } = await sb
        .from("team_members")
        .select("team_id")
        .eq("profile_id", user.id)
        .eq("team_id", teamId)
        .maybeSingle();


    if (teamCheckError) {

        console.error(
            "Team membership check failed:",
            teamCheckError
        );

        if (infoBox) {

            infoBox.textContent =
                "Unable to check your team membership.";

            infoBox.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (existingTeam) {

        if (infoBox) {

            infoBox.textContent =
                "You already exist in this team.";

            infoBox.classList.remove(
                "hidden"
            );

        }

        return;

    }

}


if (domainId) {

    const {
        data: existingDomain,
        error: domainCheckError
    } = await sb
        .from("domain_members")
        .select("domain_id")
        .eq("profile_id", user.id)
        .eq("domain_id", domainId)
        .maybeSingle();


    if (domainCheckError) {

        console.error(
            "Domain membership check failed:",
            domainCheckError
        );

        if (infoBox) {

            infoBox.textContent =
                "Unable to check your domain membership.";

            infoBox.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (existingDomain) {

        if (infoBox) {

            infoBox.textContent =
                "You already exist in this domain.";

            infoBox.classList.remove(
                "hidden"
            );

        }

        return;

    }

}


/* ---------------------------------------------
   CHECK EXISTING FORUM
--------------------------------------------- */

const {
    data: existingForum,
    error: forumCheckError
} = await sb
    .from("forum_members")
    .select("forum_id")
    .eq("profile_id", user.id)
    .eq("forum_id", forumId)
    .maybeSingle();


if (forumCheckError) {

    console.error(
        "Forum membership check failed:",
        forumCheckError
    );

    if (infoBox) {

        infoBox.textContent =
            "Unable to check your forum membership.";

        infoBox.classList.remove(
            "hidden"
        );

    }

    return;

}


if (existingForum) {

    if (infoBox) {

        infoBox.textContent =
            "You already exist in this forum.";

        infoBox.classList.remove(
            "hidden"
        );

    }

    return;

}
            if (submitBtn) {

                submitBtn.disabled =
                    true;

                submitBtn.textContent =
                    "Joining...";

            }


            if (infoBox) {

                infoBox.textContent =
                    "Joining forum...";

                infoBox.classList.remove(
                    "hidden"
                );

            }


            /* ---------------------------------------------
               SUPABASE RPC
            --------------------------------------------- */

            try {

                const {
                    data,
                    error
                } = await sb.rpc(
                    "join_forum_workspace",
                    {
                        p_forum_id:
                            forumId,

                        p_team_id:
                            teamId,

                        p_domain_id:
                            domainId
                    }
                );


                if (error) {

                    console.error(
                        "Join forum error:",
                        error
                    );

                    throw error;

                }


                console.log(
                    "Successfully joined forum:",
                    data
                );


                /* -----------------------------------------
                   CLOSE MODAL
                ----------------------------------------- */

                modal.classList.add(
                    "hidden"
                );


                /* -----------------------------------------
                   SUCCESS MESSAGE
                ----------------------------------------- */

                if (
                    typeof showToast ===
                    "function"
                ) {

                    showToast(
                        "Successfully joined the forum."
                    );

                }


                /* -----------------------------------------
                   REFRESH PROFILE
                ----------------------------------------- */

                if (
                    typeof loadProfile ===
                    "function"
                ) {

                    await loadProfile();

                }


                /* -----------------------------------------
                   REFRESH WORKSPACE
                ----------------------------------------- */

                if (
                    typeof loadPersonalWorkspaceData ===
                    "function"
                ) {

                    await loadPersonalWorkspaceData();

                }


                if (
                    typeof renderWorkCategoryColumns ===
                    "function"
                ) {

                    renderWorkCategoryColumns();

                }


                if (
                    typeof renderAllTimelines ===
                    "function"
                ) {

                    renderAllTimelines();

                }


                if (
                    typeof renderCalendar ===
                    "function"
                ) {

                    renderCalendar();

                }


                if (
                    typeof loadSelectedDateActivities ===
                    "function"
                ) {

                    loadSelectedDateActivities();

                }


                if (
                    typeof loadStatistics ===
                    "function"
                ) {

                    loadStatistics();

                }

            }
            catch (error) {

                console.error(
                    "Join Forum failed:",
                    error
                );


                if (infoBox) {

                    infoBox.textContent =
                        error?.message ||
                        "Unable to join this forum.";

                    infoBox.classList.remove(
                        "hidden"
                    );

                }

            }
            finally {

                if (submitBtn) {

                    submitBtn.disabled =
                        false;

                    submitBtn.textContent =
                        "Join Forum";

                }

            }

        }
    );

})();

const connectGoogleDriveBtn =
    document.getElementById(
        "connectGoogleDriveBtn"
    );


if (
    connectGoogleDriveBtn
) {

    connectGoogleDriveBtn.addEventListener(

        "click",

        async () => {

            try {

                const {
                    data: {
                        session
                    }
                } = await sb.auth.getSession();


                if (
                    !session
                ) {

                    showToast(
                        "You must be logged in."
                    );

                    return;

                }


                connectGoogleDriveBtn.disabled =
                    true;


                const response =
                    await fetch(

                        "https://mmmsmncmskvuqyhaqcne.supabase.co/functions/v1/connect-google-drive",

                        {

                            method:
                                "POST",

                            headers: {

                                Authorization:
                                    `Bearer ${session.access_token}`,

                                "Content-Type":
                                    "application/json"

                            }

                        }

                    );


                const result =
                    await response.json();


                if (

                    !response.ok ||

                    !result.success ||

                    !result.authorization_url

                ) {

                    throw new Error(

                        result.error ||

                        "Unable to start Google Drive connection."

                    );

                }


                window.location.href =
                    result.authorization_url;


            }

            catch (
                error
            ) {

                console.error(

                    "Google Drive connection error:",

                    error

                );


                showToast(

                    error instanceof Error

                        ? error.message

                        : "Unable to connect Google Drive."

                );


                connectGoogleDriveBtn.disabled =
                    false;

            }

        }

    );

}