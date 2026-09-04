/* =========================================================================
   RiGiD LOGIN.JS
   =========================================================================

   Supports:

   - Email/password login
   - Email signup
   - Email verification
   - Google OAuth signup
   - Google profile setup
   - Multiple forum selection
   - Multiple team selection
   - Multiple domain selection
   - Access request
   - Admin pending/approved/rejected states
   - Google password creation
   - Theme toggle
   - Live clock
   - Google Drive connection test

   Database membership model:

       profiles
           |
           +---- forum_members
           |
           +---- team_members
           |
           +---- domain_members

   Profile creation:
       auth.users
            ↓
       handle_new_user()
            ↓
       public.profiles

   Missing profile recovery:
       ensure_my_profile()

   ========================================================================= */


/* =========================================================================
   CONFIGURATION
   ========================================================================= */

const LOGIN_CONFIG = {

  ALLOWED_EMAIL_DOMAIN:
    "@kct.ac.in",

  ADMIN_DASHBOARD_URL:
    "../dashboard/admin/admin.html",

  PERSONAL_DASHBOARD_URL:
    "../dashboard/personal/personal.html",

  LOGIN_REDIRECT_URL:
    `${window.location.origin}/login/login.html`,

  ACCESS_REQUEST_RPC:
    "submit_access_request"

};


/* =========================================================================
   SUPABASE CHECK
   ========================================================================= */

if (
  typeof sb === "undefined" ||
  !sb
) {

  console.error(
    "RiGiD: Supabase client 'sb' was not found."
  );

}


/* =========================================================================
   GLOBAL DATA
   ========================================================================= */

let forums = [];
let teams = [];
let domains = [];

let selectedForums = new Set();
let googleSelectedForums = new Set();

let resendCountdownTimer = null;
let verificationTimer = null;


/* =========================================================================
   HELPER
   ========================================================================= */

function el(id) {

  return document.getElementById(id);

}


/* =========================================================================
   HTML ESCAPE
   ========================================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================================
   CLOCK
   ========================================================================= */

function startClock() {

  const clock =
    el("liveClock");

  if (!clock) {
    return;
  }

  function updateClock() {

    const now =
      new Date();

    clock.textContent =
      now.toLocaleDateString(
        undefined,
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      ) +
      " — " +
      now.toLocaleTimeString();

  }

  updateClock();

  setInterval(
    updateClock,
    1000
  );

}


/* =========================================================================
   THEME
   ========================================================================= */

function initTheme() {

  const button =
    el("themeToggle");

  if (!button) {
    return;
  }

  button.addEventListener(
    "click",
    () => {

      const isDark =
        document.documentElement
          .classList
          .toggle("dark");

      localStorage.setItem(
        "logbook-theme",
        isDark
          ? "dark"
          : "light"
      );

      updateThemeIcon();

    }
  );

  updateThemeIcon();

}


function updateThemeIcon() {

  const icon =
    el("themeIcon");

  if (!icon) {
    return;
  }

  const isDark =
    document.documentElement
      .classList
      .contains("dark");

  icon.textContent =
    isDark
      ? "☀"
      : "☾";

}


/* =========================================================================
   MESSAGE
   ========================================================================= */

function showMessage(
  message,
  type = "error"
) {

  const box =
    el("authMessage");

  if (!box) {

    console.error(message);

    return;

  }

  box.textContent =
    message;

  box.classList.remove(
    "hidden",
    "auth-message-error",
    "auth-message-ok"
  );

  box.classList.add(
    type === "ok"
      ? "auth-message-ok"
      : "auth-message-error"
  );

}


function clearMessage() {

  const box =
    el("authMessage");

  if (!box) {
    return;
  }

  box.textContent =
    "";

  box.classList.add(
    "hidden"
  );

}


/* =========================================================================
   VERIFICATION STATUS
   ========================================================================= */

function setVerificationStatus(
  message,
  type = "ok"
) {

  const status =
    el("verificationStatus");

  if (!status) {
    return;
  }

  status.textContent =
    message;

  status.classList.remove(
    "hidden",
    "verification-status-ok",
    "verification-status-error"
  );

  status.classList.add(
    type === "ok"
      ? "verification-status-ok"
      : "verification-status-error"
  );

}


/* =========================================================================
   LOAD FORUMS / TEAMS / DOMAINS
   ========================================================================= */

async function loadForumData() {

  try {

    const [
      forumsResult,
      teamsResult,
      domainsResult
    ] =
      await Promise.all([

        sb
          .from("forums")
          .select("id, name")
          .order("name"),

        sb
          .from("teams")
          .select(`
            id,
            name,
            forum_id
          `)
          .order("name"),

        sb
          .from("domains")
          .select(`
            id,
            name,
            forum_id
          `)
          .order("name")

      ]);


    if (forumsResult.error) {

      console.error(
        "Forums error:",
        forumsResult.error
      );

      showMessage(
        "Unable to load forums."
      );

      return false;

    }


    if (teamsResult.error) {

      console.error(
        "Teams error:",
        teamsResult.error
      );

      showMessage(
        "Unable to load teams."
      );

      return false;

    }


    if (domainsResult.error) {

      console.error(
        "Domains error:",
        domainsResult.error
      );

      showMessage(
        "Unable to load domains."
      );

      return false;

    }


    forums =
      forumsResult.data || [];

    teams =
      teamsResult.data || [];

    domains =
      domainsResult.data || [];


    console.log(
      "Forums:",
      forums
    );

    console.log(
      "Teams:",
      teams
    );

    console.log(
      "Domains:",
      domains
    );


    populateForumSelect(
      "signupForum"
    );

    populateForumSelect(
      "googleForum"
    );


    return true;

  }

  catch (error) {

    console.error(
      "loadForumData() failed:",
      error
    );

    showMessage(
      "Unable to load forum information."
    );

    return false;

  }

}


/* =========================================================================
   POPULATE FORUM SELECT
   ========================================================================= */

function populateForumSelect(
  selectId
) {

  const select =
    el(selectId);

  if (!select) {

    console.warn(
      `Element #${selectId} not found.`
    );

    return;

  }


  select.innerHTML = `
    <option
      value=""
      selected
      disabled
    >
      Select your forum
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

      select.appendChild(
        option
      );

    }
  );

}


/* =========================================================================
   FORUM SELECTION
   ========================================================================= */

function initForumSelection() {

  const signupForum =
    el("signupForum");

  const googleForum =
    el("googleForum");


  /* ---------------------------------------------------------
     NORMAL SIGNUP
     --------------------------------------------------------- */

  signupForum?.addEventListener(
    "change",
    () => {

      const forumId =
        signupForum.value;

      if (!forumId) {
        return;
      }


      selectedForums.add(
        String(forumId)
      );


      signupForum.value =
        "";


      renderSelectedForums(
        selectedForums,
        "selectedForumsContainer",
        "selectedTeams",
        "selectedDomains"
      );

    }
  );


  /* ---------------------------------------------------------
     GOOGLE SIGNUP
     --------------------------------------------------------- */

  googleForum?.addEventListener(
    "change",
    () => {

      const forumId =
        googleForum.value;

      if (!forumId) {
        return;
      }


      googleSelectedForums.add(
        String(forumId)
      );


      googleForum.value =
        "";


      renderSelectedForums(
        googleSelectedForums,
        "googleSelectedForumsContainer",
        "googleSelectedTeams",
        "googleSelectedDomains"
      );

    }
  );

}


/* =========================================================================
   RENDER SELECTED FORUMS
   ========================================================================= */

function renderSelectedForums(
  selectedSet,
  containerId,
  teamInputName,
  domainInputName
) {

  const container =
    el(containerId);

  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  selectedSet.forEach(
    forumId => {

      const forum =
        forums.find(
          forumItem =>
            String(
              forumItem.id
            ) ===
            String(
              forumId
            )
        );


      if (!forum) {
        return;
      }


      const forumTeams =
        teams.filter(
          team =>
            String(
              team.forum_id
            ) ===
            String(
              forum.id
            )
        );


      const forumDomains =
        domains.filter(
          domain =>
            String(
              domain.forum_id
            ) ===
            String(
              forum.id
            )
        );


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "selected-forum-card";


      card.dataset.forumId =
        forum.id;


      card.innerHTML = `

        <div class="selected-forum-header">

          <div>

            <span class="selected-forum-label">
              FORUM
            </span>

            <h3>
              ${escapeHTML(
        forum.name
      )}
            </h3>

          </div>

          <button
            type="button"
            class="remove-forum-btn"
            data-forum-id="${escapeHTML(
        forum.id
      )}"
          >
            ×
          </button>

        </div>


        <div class="forum-selection-group">

          <label>
            Teams
            <span>
              Select any
            </span>
          </label>

          ${forumTeams.length > 0

          ? forumTeams
            .map(
              team => `

                    <label
                      class="selection-option"
                    >

                      <input
                        type="checkbox"
                        name="${escapeHTML(
                teamInputName
              )}"
                        value="${escapeHTML(
                team.id
              )}"
                        data-forum-id="${escapeHTML(
                forum.id
              )}"
                      >

                      <span>
                        ${escapeHTML(
                team.name
              )}
                      </span>

                    </label>

                  `
            )
            .join("")

          : `
                <p class="selection-empty">
                  No teams available.
                </p>
              `
        }

        </div>


        <div class="forum-selection-group">

          <label>
            Domains
            <span>
              Select any
            </span>
          </label>

          ${forumDomains.length > 0

          ? forumDomains
            .map(
              domain => `

                    <label
                      class="selection-option"
                    >

                      <input
                        type="checkbox"
                        name="${escapeHTML(
                domainInputName
              )}"
                        value="${escapeHTML(
                domain.id
              )}"
                        data-forum-id="${escapeHTML(
                forum.id
              )}"
                      >

                      <span>
                        ${escapeHTML(
                domain.name
              )}
                      </span>

                    </label>

                  `
            )
            .join("")

          : `
                <p class="selection-empty">
                  No domains available.
                </p>
              `
        }

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );


  /* ---------------------------------------------------------
     REMOVE FORUM
     --------------------------------------------------------- */

  container
    .querySelectorAll(
      ".remove-forum-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const forumId =
              String(
                button.dataset.forumId
              );


            selectedSet.delete(
              forumId
            );


            renderSelectedForums(
              selectedSet,
              containerId,
              teamInputName,
              domainInputName
            );

          }
        );

      }
    );

}


/* =========================================================================
   COLLECT SELECTED MEMBERSHIPS
   ========================================================================= */

function collectSelections(
  selectedSet,
  containerId,
  teamInputName,
  domainInputName
) {

  const container =
    el(containerId);


  const forumIds =
    Array.from(
      selectedSet
    );


  const teamIds =
    container

      ? Array.from(
        container.querySelectorAll(
          `input[name="${teamInputName}"]:checked`
        )
      ).map(
        input =>
          input.value
      )

      : [];


  const domainIds =
    container

      ? Array.from(
        container.querySelectorAll(
          `input[name="${domainInputName}"]:checked`
        )
      ).map(
        input =>
          input.value
      )

      : [];


  return {

    forumIds,

    teamIds,

    domainIds

  };

}


/* =========================================================================
   VALIDATE FORUMS
   ========================================================================= */

function validateForumSelection(
  selectedSet
) {

  if (
    !selectedSet ||
    selectedSet.size === 0
  ) {

    showMessage(
      "Please select at least one forum."
    );

    return false;

  }

  return true;

}


/* =========================================================================
   VALIDATE MEMBERSHIP RELATIONSHIPS
   ========================================================================= */

function validateSelections(
  forumIds,
  teamIds,
  domainIds
) {

  /* ---------------------------------------------------------
     Teams must belong to selected forums
     --------------------------------------------------------- */

  for (
    const teamId of teamIds
  ) {

    const team =
      teams.find(
        item =>
          String(item.id) ===
          String(teamId)
      );


    if (!team) {

      showMessage(
        "One of the selected teams is invalid."
      );

      return false;

    }


    if (
      !forumIds.includes(
        String(team.forum_id)
      )
    ) {

      showMessage(
        "A selected team does not belong to one of your selected forums."
      );

      return false;

    }

  }


  /* ---------------------------------------------------------
     Domains must belong to selected forums
     --------------------------------------------------------- */

  for (
    const domainId of domainIds
  ) {

    const domain =
      domains.find(
        item =>
          String(item.id) ===
          String(domainId)
      );


    if (!domain) {

      showMessage(
        "One of the selected domains is invalid."
      );

      return false;

    }


    if (
      !forumIds.includes(
        String(domain.forum_id)
      )
    ) {

      showMessage(
        "A selected domain does not belong to one of your selected forums."
      );

      return false;

    }

  }


  return true;

}


/* =========================================================================
   TABS
   ========================================================================= */

function initTabs() {

  const loginTab =
    el("tabLogin");

  const signupTab =
    el("tabSignup");

  const loginForm =
    el("loginForm");

  const signupForm =
    el("signupForm");


  if (
    !loginTab ||
    !signupTab ||
    !loginForm ||
    !signupForm
  ) {

    console.error(
      "Login tabs/forms not found."
    );

    return;

  }


  loginTab.addEventListener(
    "click",
    () => {

      loginTab.classList.add(
        "is-active"
      );

      signupTab.classList.remove(
        "is-active"
      );


      loginForm.classList.remove(
        "hidden"
      );

      signupForm.classList.add(
        "hidden"
      );


      clearMessage();

    }
  );


  signupTab.addEventListener(
    "click",
    () => {

      signupTab.classList.add(
        "is-active"
      );

      loginTab.classList.remove(
        "is-active"
      );


      signupForm.classList.remove(
        "hidden"
      );

      loginForm.classList.add(
        "hidden"
      );


      clearMessage();

    }
  );

}


/* =========================================================================
   EMAIL SIGNUP — SEND VERIFICATION
   ========================================================================= */

async function sendVerificationLink() {

  clearMessage();


  const emailInput =
    el("signupEmail");

  const passwordInput =
    el("signupPassword");

  const password2Input =
    el("signupPassword2");

  const button =
    el("sendVerificationBtn");


  if (
    !emailInput ||
    !passwordInput ||
    !password2Input ||
    !button
  ) {

    showMessage(
      "Signup form is incomplete."
    );

    return;

  }


  const email =
    emailInput.value
      .trim()
      .toLowerCase();


  const password =
    passwordInput.value;


  const password2 =
    password2Input.value;


  if (
    !validateForumSelection(
      selectedForums
    )
  ) {

    return;

  }


  if (
    !email.endsWith(
      LOGIN_CONFIG.ALLOWED_EMAIL_DOMAIN
    )
  ) {

    showMessage(
      "Please use your @kct.ac.in email address."
    );

    return;

  }


  if (
    password.length < 8
  ) {

    showMessage(
      "Password must contain at least 8 characters."
    );

    return;

  }


  if (
    password !== password2
  ) {

    showMessage(
      "Passwords do not match."
    );

    return;

  }


  button.disabled =
    true;

  button.textContent =
    "Sending…";


  try {

    /* -----------------------------------------------------
       Existing account check
       ----------------------------------------------------- */

    const {
      data: signupStatus,
      error: statusError
    } =
      await sb.rpc(
        "check_signup_email",
        {
          check_email:
            email
        }
      );


    if (statusError) {

      console.error(
        "check_signup_email:",
        statusError
      );

      showMessage(
        statusError.message ||
        "Unable to check your account."
      );

      return;

    }


    if (
      signupStatus === "approved"
    ) {

      showMessage(
        "This account is already approved. Please log in.",
        "ok"
      );

      return;

    }


    if (
      signupStatus === "pending"
    ) {

      showMessage(
        "Your access request is already pending.",
        "ok"
      );

      return;

    }


    if (
      signupStatus === "rejected"
    ) {

      showMessage(
        "Your previous access request was rejected. Please contact an administrator."
      );

      return;

    }


    /* -----------------------------------------------------
       Create auth user
       ----------------------------------------------------- */

    const {
      data,
      error
    } =
      await sb.auth.signUp({

        email,

        password,

        options: {

          emailRedirectTo:
            LOGIN_CONFIG.LOGIN_REDIRECT_URL

        }

      });


    if (error) {

      console.error(
        "Signup error:",
        error
      );

      showMessage(
        error.message ||
        "Unable to create your account."
      );

      return;

    }


    if (!data.user) {

      showMessage(
        "Unable to create your account."
      );

      return;

    }


    setVerificationStatus(
      "✓ Verification link sent. Check your KCT email.",
      "ok"
    );


    el("resendVerificationBox")
      ?.classList.remove(
        "hidden"
      );


    startResendCooldown();

    startVerificationWatcher();


    showMessage(
      "Verification email sent successfully.",
      "ok"
    );


    button.textContent =
      "Verification Link Sent";

  }

  catch (error) {

    console.error(
      "Verification signup error:",
      error
    );

    showMessage(
      error.message ||
      "Something went wrong."
    );

  }

  finally {

    if (
      button.textContent !==
      "Verification Link Sent"
    ) {

      button.disabled =
        false;

      button.textContent =
        "Send Verification Link";

    }

  }

}


/* =========================================================================
   RESEND VERIFICATION
   ========================================================================= */

async function resendVerificationLink() {

  clearMessage();


  const email =
    el("signupEmail")
      ?.value
      .trim()
      .toLowerCase();


  if (!email) {

    showMessage(
      "Enter your KCT email address first."
    );

    return;

  }


  const button =
    el("resendVerificationBtn");


  if (!button) {
    return;
  }


  button.disabled =
    true;

  button.textContent =
    "Sending…";


  try {

    const {
      error
    } =
      await sb.auth.resend({

        type:
          "signup",

        email,

        options: {

          emailRedirectTo:
            LOGIN_CONFIG.LOGIN_REDIRECT_URL

        }

      });


    if (error) {
      throw error;
    }


    showMessage(
      "Verification link resent successfully.",
      "ok"
    );


    startResendCooldown();

  }

  catch (error) {

    console.error(
      "Resend error:",
      error
    );

    showMessage(
      error.message ||
      "Unable to resend verification link."
    );


    button.disabled =
      false;

    button.textContent =
      "Resend verification link";

  }

}


/* =========================================================================
   RESEND COOLDOWN
   ========================================================================= */

function startResendCooldown() {

  const button =
    el("resendVerificationBtn");


  if (!button) {
    return;
  }


  if (resendCountdownTimer) {

    clearInterval(
      resendCountdownTimer
    );

  }


  let seconds =
    60;


  button.disabled =
    true;


  button.textContent =
    `Resend in ${seconds}s`;


  resendCountdownTimer =
    setInterval(
      () => {

        seconds--;


        if (
          seconds <= 0
        ) {

          clearInterval(
            resendCountdownTimer
          );

          resendCountdownTimer =
            null;


          button.disabled =
            false;


          button.textContent =
            "Resend verification link";


          return;

        }


        button.textContent =
          `Resend in ${seconds}s`;

      },
      1000
    );

}


/* =========================================================================
   CHECK EMAIL VERIFICATION
   ========================================================================= */

async function checkEmailVerification() {

  try {

    const {
      data: {
        user
      }
    } =
      await sb.auth.getUser();


    if (
      user &&
      user.email_confirmed_at
    ) {

      markEmailVerified();

      return true;

    }

  }

  catch (error) {

    console.error(
      "Verification check:",
      error
    );

  }


  return false;

}


/* =========================================================================
   VERIFICATION WATCHER
   ========================================================================= */

function startVerificationWatcher() {

  if (verificationTimer) {

    clearInterval(
      verificationTimer
    );

  }


  verificationTimer =
    setInterval(
      async () => {

        const verified =
          await checkEmailVerification();


        if (verified) {

          clearInterval(
            verificationTimer
          );

          verificationTimer =
            null;

        }

      },
      3000
    );

}


/* =========================================================================
   MARK EMAIL VERIFIED
   ========================================================================= */

function markEmailVerified() {

  const button =
    el("sendVerificationBtn");

  const requestButton =
    el("requestAccessBtn");


  setVerificationStatus(
    "✓ Email verified successfully. You can now request access.",
    "ok"
  );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "✓ Email Verified";

  }


  if (requestButton) {

    requestButton.disabled =
      false;

  }

}


/* =========================================================================
   SUBMIT ACCESS REQUEST
   ========================================================================= */

async function submitAccessRequest(
  selections
) {

  const {
    forumIds,
    teamIds,
    domainIds
  } =
    selections;


  if (
    !forumIds ||
    forumIds.length === 0
  ) {

    return {

      success: false,

      error:
        "Please select at least one forum."

    };

  }


  if (
    !validateSelections(
      forumIds,
      teamIds,
      domainIds
    )
  ) {

    return {

      success: false,

      error:
        "Invalid forum, team, or domain selection."

    };

  }


  try {

    console.log(
      "Submitting access request:",
      {
        forum_ids:
          forumIds,

        team_ids:
          teamIds,

        domain_ids:
          domainIds
      }
    );


    const {
      data,
      error
    } =
      await sb.rpc(
        LOGIN_CONFIG.ACCESS_REQUEST_RPC,
        {

          forum_ids:
            forumIds,

          team_ids:
            teamIds,

          domain_ids:
            domainIds

        }
      );


    if (error) {

      console.error(
        "submit_access_request error:",
        error
      );


      return {

        success: false,

        error:
          error.message ||
          "Unable to submit access request."

      };

    }


    return {

      success: true,

      data

    };

  }

  catch (error) {

    console.error(
      "submitAccessRequest:",
      error
    );


    return {

      success: false,

      error:
        error.message ||
        "Unable to submit access request."

    };

  }

}


/* =========================================================================
   NORMAL EMAIL ACCESS REQUEST
   ========================================================================= */

async function requestAccess(event) {

  event.preventDefault();

  clearMessage();


  const button =
    el("requestAccessBtn");


  const selections =
    collectSelections(
      selectedForums,
      "selectedForumsContainer",
      "selectedTeams",
      "selectedDomains"
    );


  if (
    !validateForumSelection(
      selectedForums
    )
  ) {

    return;

  }


  button.disabled =
    true;

  button.textContent =
    "Submitting…";


  try {

    const {
      data: {
        user
      },
      error
    } =
      await sb.auth.getUser();


    if (error) {
      throw error;
    }


    if (!user) {

      showMessage(
        "Please verify your email before requesting access."
      );

      return;

    }


    if (
      !user.email_confirmed_at
    ) {

      showMessage(
        "Please click the verification link sent to your email first."
      );

      return;

    }


    /* -----------------------------------------------------
       Check profile
       ----------------------------------------------------- */

    let {
      data: profile,
      error: profileError
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
          user.id
        )
        .maybeSingle();


    if (profileError) {

      console.error(
        "Profile lookup:",
        profileError
      );

      showMessage(
        profileError.message ||
        "Unable to check your profile."
      );

      return;

    }


    if (!profile) {

      console.log(
        "Profile missing. Calling ensure_my_profile()..."
      );


      const {
        data: ensuredProfile,
        error: ensureError
      } =
        await sb.rpc(
          "ensure_my_profile"
        );


      if (
        ensureError ||
        !ensuredProfile
      ) {

        console.error(
          "ensure_my_profile failed:",
          ensureError
        );

        showMessage(
          ensureError?.message ||
          "Unable to create your RiGiD profile. Please contact an administrator."
        );

        return;

      }


      profile =
        ensuredProfile;

    }


    if (
      profile.status === "approved"
    ) {

      await sb.auth.signOut();

      showMessage(
        "Your account is already approved. Please log in.",
        "ok"
      );

      return;

    }


    if (
      profile.status === "rejected"
    ) {

      await sb.auth.signOut();

      showMessage(
        "Your previous access request was rejected."
      );

      return;

    }


    if (
      profile.status !== "pending"
    ) {

      showMessage(
        "Your account is not currently eligible for an access request."
      );

      return;

    }


    /* -----------------------------------------------------
       Submit
       ----------------------------------------------------- */

    const result =
      await submitAccessRequest(
        selections
      );


    if (!result.success) {

      showMessage(
        result.error
      );

      return;

    }


    await sb.auth.signOut();


    button.disabled =
      true;

    button.textContent =
      "Request Submitted";


    showMessage(
      "Access request submitted successfully. An administrator must approve your account.",
      "ok"
    );

  }

  catch (error) {

    console.error(
      "requestAccess:",
      error
    );

    showMessage(
      error.message ||
      "Unable to submit your access request."
    );

  }

  finally {

    if (
      button.textContent !==
      "Request Submitted"
    ) {

      button.disabled =
        false;

      button.textContent =
        "Request Access";

    }

  }

}


/* =========================================================================
   ROUTE APPROVED USER
   ========================================================================= */

function routeApprovedUser(
  profile
) {

  if (!profile) {
    return false;
  }


  if (
    profile.status !==
    "approved"
  ) {

    return false;

  }


  if (
    profile.role ===
    "admin"
  ) {

    window.location.href =
      LOGIN_CONFIG.ADMIN_DASHBOARD_URL;

  }

  else {

    window.location.href =
      LOGIN_CONFIG.PERSONAL_DASHBOARD_URL;

  }


  return true;

}


/* =========================================================================
   LOGIN
   ========================================================================= */

async function loginUser(event) {

  event.preventDefault();

  clearMessage();


  const email =
    el("loginEmail")
      ?.value
      .trim()
      .toLowerCase();


  const password =
    el("loginPassword")
      ?.value;


  const button =
    el("loginForm")
      ?.querySelector(
        "button[type='submit']"
      );


  if (
    !email ||
    !password
  ) {

    showMessage(
      "Please enter your email and password."
    );

    return;

  }


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Logging in…";

  }


  try {

    const {
      data,
      error
    } =
      await sb.auth.signInWithPassword({

        email,

        password

      });


    if (error) {

      showMessage(
        error.message ||
        "Invalid email or password."
      );

      return;

    }


    const user =
      data.user;


    if (!user) {

      showMessage(
        "Unable to retrieve your account."
      );

      return;

    }


    if (
      !user.email_confirmed_at
    ) {

      await sb.auth.signOut();

      showMessage(
        "Please verify your email before logging in."
      );

      return;

    }


    /* -----------------------------------------------------
       Profile
       ----------------------------------------------------- */

    let {
      data: profile,
      error: profileError
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
          user.id
        )
        .maybeSingle();


    if (profileError) {

      console.error(
        "Login profile error:",
        profileError
      );

      await sb.auth.signOut();

      showMessage(
        profileError.message ||
        "Unable to load your profile."
      );

      return;

    }


    /* -----------------------------------------------------
       Recover missing profile
       ----------------------------------------------------- */

    if (!profile) {

      console.log(
        "Login profile missing. Calling ensure_my_profile()..."
      );


      const {
        data: ensuredProfile,
        error: ensureError
      } =
        await sb.rpc(
          "ensure_my_profile"
        );


      if (
        ensureError ||
        !ensuredProfile
      ) {

        console.error(
          "ensure_my_profile failed:",
          ensureError
        );

        await sb.auth.signOut();

        showMessage(
          ensureError?.message ||
          "Your account exists, but your RiGiD profile could not be created."
        );

        return;

      }


      profile =
        ensuredProfile;

    }


    /* -----------------------------------------------------
       Pending
       ----------------------------------------------------- */

    if (
      profile.status === "pending"
    ) {

      await sb.auth.signOut();

      showMessage(
        "Your account is waiting for admin approval."
      );

      return;

    }


    /* -----------------------------------------------------
       Rejected
       ----------------------------------------------------- */

    if (
      profile.status === "rejected"
    ) {

      await sb.auth.signOut();

      showMessage(
        "Your access request was rejected."
      );

      return;

    }


    /* -----------------------------------------------------
       Approved
       ----------------------------------------------------- */

    if (
      routeApprovedUser(
        profile
      )
    ) {

      return;

    }


    /* -----------------------------------------------------
       Invalid status
       ----------------------------------------------------- */

    await sb.auth.signOut();

    showMessage(
      "Your account has an invalid status."
    );

  }

  catch (error) {

    console.error(
      "Login error:",
      error
    );

    showMessage(
      error.message ||
      "Something went wrong while logging in."
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Log In";

    }

  }

}


/* =========================================================================
   GOOGLE SIGN-IN
   ========================================================================= */

async function signUpWithGoogle() {

  clearMessage();


  const button =
    el("googleSignupBtn");


  if (!button) {

    showMessage(
      "Google sign-in button was not found."
    );

    return;

  }


  button.disabled =
    true;

  button.textContent =
    "Connecting to Google…";


  try {

    const {
      data,
      error
    } =
      await sb.auth.signInWithOAuth({

        provider:
          "google",

        options: {

          redirectTo:
            LOGIN_CONFIG.LOGIN_REDIRECT_URL,

          scopes:
            "https://www.googleapis.com/auth/drive.file",

          queryParams: {

            access_type:
              "offline",

            prompt:
              "consent"

          }

        }

      });


    if (error) {

      console.error(
        "Google OAuth:",
        error
      );

      showMessage(
        error.message ||
        "Unable to connect to Google."
      );


      button.disabled =
        false;


      button.innerHTML = `
        <span class="google-icon">
          G
        </span>
        Continue with Google
      `;

      return;

    }


    console.log(
      "Google OAuth started:",
      data
    );

  }

  catch (error) {

    console.error(
      "Google sign-in:",
      error
    );

    showMessage(
      error.message ||
      "Unable to connect to Google."
    );


    button.disabled =
      false;


    button.innerHTML = `
      <span class="google-icon">
        G
      </span>
      Continue with Google
    `;

  }

}


/* =========================================================================
   GOOGLE USER SETUP
   ========================================================================= */

async function setupGoogleUser(
  user
) {

  if (!user) {
    return;
  }


  console.log(
    "Google user:",
    user
  );


  /* ---------------------------------------------------------
     PROFILE CHECK
     --------------------------------------------------------- */

  let {
    data: profile,
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
        user.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Google profile lookup error:",
      error
    );

    showMessage(
      error.message ||
      "Unable to check your RiGiD profile."
    );

    return;

  }


  /* ---------------------------------------------------------
     PROFILE MISSING
     --------------------------------------------------------- */

  if (!profile) {

    console.log(
      "Profile missing. Calling ensure_my_profile()..."
    );


    const {
      data: ensuredProfile,
      error: ensureError
    } =
      await sb.rpc(
        "ensure_my_profile"
      );


    if (
      ensureError ||
      !ensuredProfile
    ) {

      console.error(
        "ensure_my_profile failed:",
        ensureError
      );

      showMessage(
        ensureError?.message ||
        "Unable to create your RiGiD profile. Please contact an administrator."
      );

      return;

    }


    console.log(
      "RiGiD profile created/recovered:",
      ensuredProfile
    );


    profile =
      ensuredProfile;

  }


  /* ---------------------------------------------------------
     APPROVED
     --------------------------------------------------------- */

  if (
    profile.status === "approved"
  ) {

    routeApprovedUser(
      profile
    );

    return;

  }


  /* ---------------------------------------------------------
     REJECTED
     --------------------------------------------------------- */

  if (
    profile.status === "rejected"
  ) {

    showMessage(
      "Your previous access request was rejected. Please contact an administrator."
    );

    return;

  }


  /* ---------------------------------------------------------
     PENDING
     --------------------------------------------------------- */

  if (
    profile.status === "pending"
  ) {

    /*
     * If the user has no memberships yet,
     * allow them to complete the request.
     *
     * If memberships already exist,
     * show pending state.
     */

    const [
      forumResult,
      teamResult,
      domainResult
    ] =
      await Promise.all([

        sb
          .from("forum_members")
          .select(
            "forum_id",
            {
              count: "exact",
              head: true
            }
          )
          .eq(
            "profile_id",
            user.id
          ),

        sb
          .from("team_members")
          .select(
            "team_id",
            {
              count: "exact",
              head: true
            }
          )
          .eq(
            "profile_id",
            user.id
          ),

        sb
          .from("domain_members")
          .select(
            "domain_id",
            {
              count: "exact",
              head: true
            }
          )
          .eq(
            "profile_id",
            user.id
          )

      ]);


    const existingMemberships =
      (
        (forumResult.count || 0) +
        (teamResult.count || 0) +
        (domainResult.count || 0)
      ) > 0;


    if (
      existingMemberships
    ) {

      showGooglePendingState(
        user,
        profile
      );

      return;

    }


    showGoogleProfileSetup(
      user,
      profile
    );

    return;

  }


  showGoogleProfileSetup(
    user,
    profile
  );

}


/* =========================================================================
   SHOW GOOGLE PROFILE SETUP
   ========================================================================= */

function showGoogleProfileSetup(
  user,
  profile
) {

  const setup =
    el("googleProfileSetup");

  const name =
    el("googleUserName");

  const email =
    el("googleUserEmail");

  const button =
    el("googleRequestAccessBtn");


  if (!setup) {

    console.error(
      "googleProfileSetup not found."
    );

    showMessage(
      "Google sign-in succeeded, but the Google access form is missing from the page."
    );

    return;

  }


  setup.classList.remove(
    "hidden"
  );


  if (name) {

    name.textContent =
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "Google User";

  }


  if (email) {

    email.textContent =
      profile?.email ||
      user.email ||
      "";

  }


  /* ---------------------------------------------------------
     Hide normal signup
     --------------------------------------------------------- */

  el("emailSignupFields")
    ?.classList.add(
      "hidden"
    );

  el("googleDivider")
    ?.classList.add(
      "hidden"
    );

  el("googleSignupBtn")
    ?.classList.add(
      "hidden"
    );

  el("requestAccessBtn")
    ?.classList.add(
      "hidden"
    );

  el("sendVerificationBtn")
    ?.classList.add(
      "hidden"
    );

  el("resendVerificationBox")
    ?.classList.add(
      "hidden"
    );

  el("verificationStatus")
    ?.classList.add(
      "hidden"
    );


  /* ---------------------------------------------------------
     Reset Google selections
     --------------------------------------------------------- */

  googleSelectedForums.clear();


  el("googleSelectedForumsContainer")
    ?.replaceChildren();


  const googleForum =
    el("googleForum");


  if (googleForum) {

    googleForum.value =
      "";

  }


  /* ---------------------------------------------------------
     Password
     --------------------------------------------------------- */

  el("googlePasswordBox")
    ?.classList.remove(
      "hidden"
    );


  const password =
    el("googlePassword");

  const password2 =
    el("googlePassword2");


  if (password) {
    password.value = "";
  }


  if (password2) {
    password2.value = "";
  }


  if (button) {

    button.disabled =
      false;

    button.textContent =
      "Request Access";

  }


  clearMessage();

}


/* =========================================================================
   GOOGLE PENDING STATE
   ========================================================================= */

function showGooglePendingState(
  user,
  profile
) {

  const setup =
    el("googleProfileSetup");

  const name =
    el("googleUserName");

  const email =
    el("googleUserEmail");

  const button =
    el("googleRequestAccessBtn");


  if (!setup) {

    showMessage(
      "Your access request is already pending.",
      "ok"
    );

    return;

  }


  setup.classList.remove(
    "hidden"
  );


  if (name) {

    name.textContent =
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "Google User";

  }


  if (email) {

    email.textContent =
      profile?.email ||
      user.email ||
      "";

  }


  el("googlePasswordBox")
    ?.classList.add(
      "hidden"
    );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Request Already Submitted";

  }


  el("emailSignupFields")
    ?.classList.add(
      "hidden"
    );

  el("googleDivider")
    ?.classList.add(
      "hidden"
    );

  el("googleSignupBtn")
    ?.classList.add(
      "hidden"
    );

  el("requestAccessBtn")
    ?.classList.add(
      "hidden"
    );

  el("sendVerificationBtn")
    ?.classList.add(
      "hidden"
    );


  showMessage(
    "Your access request is already submitted and is waiting for admin approval.",
    "ok"
  );

}


/* =========================================================================
   GOOGLE REQUEST ACCESS
   ========================================================================= */

async function submitGoogleAccessRequest() {

  clearMessage();


  const button =
    el("googleRequestAccessBtn");


  if (!button) {

    showMessage(
      "Google Request Access button was not found."
    );

    return;

  }


  /* ---------------------------------------------------------
     Get current user
     --------------------------------------------------------- */

  const {
    data: {
      user
    },
    error: userError
  } =
    await sb.auth.getUser();


  if (userError) {

    console.error(
      "Google current-user error:",
      userError
    );

    showMessage(
      userError.message ||
      "Unable to verify your Google session."
    );

    return;

  }


  if (!user) {

    showMessage(
      "Your Google session has expired. Please sign in again."
    );

    return;

  }


  /* ---------------------------------------------------------
     CHECK PROFILE
     --------------------------------------------------------- */

  let {
    data: profile,
    error: profileError
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
        user.id
      )
      .maybeSingle();


  if (profileError) {

    console.error(
      "Google profile lookup:",
      profileError
    );

    showMessage(
      profileError.message ||
      "Unable to check your profile."
    );

    return;

  }


  if (!profile) {

    console.log(
      "Profile missing before Google request. Calling ensure_my_profile()..."
    );


    const {
      data: ensuredProfile,
      error: ensureError
    } =
      await sb.rpc(
        "ensure_my_profile"
      );


    if (
      ensureError ||
      !ensuredProfile
    ) {

      console.error(
        "ensure_my_profile failed:",
        ensureError
      );

      showMessage(
        ensureError?.message ||
        "Unable to create your RiGiD profile."
      );

      return;

    }


    profile =
      ensuredProfile;

  }


  if (
    profile.status !== "pending"
  ) {

    showMessage(
      `Your account status is "${profile.status}".`
    );

    return;

  }


  /* ---------------------------------------------------------
     Collect selections
     --------------------------------------------------------- */

  const selections =
    collectSelections(
      googleSelectedForums,
      "googleSelectedForumsContainer",
      "googleSelectedTeams",
      "googleSelectedDomains"
    );


  if (
    !validateForumSelection(
      googleSelectedForums
    )
  ) {

    return;

  }


  if (
    !validateSelections(
      selections.forumIds,
      selections.teamIds,
      selections.domainIds
    )
  ) {

    return;

  }


  /* ---------------------------------------------------------
     Password
     --------------------------------------------------------- */

  const passwordBox =
    el("googlePasswordBox");


  const settingPassword =
    passwordBox &&
    !passwordBox.classList.contains(
      "hidden"
    );


  if (settingPassword) {

    const password =
      el("googlePassword")
        ?.value || "";


    const password2 =
      el("googlePassword2")
        ?.value || "";


    if (
      password.length < 8
    ) {

      showMessage(
        "Password must contain at least 8 characters."
      );

      return;

    }


    if (
      password !== password2
    ) {

      showMessage(
        "Passwords do not match."
      );

      return;

    }

  }


  button.disabled =
    true;

  button.textContent =
    "Submitting…";


  try {

    /* -----------------------------------------------------
       Set password
       ----------------------------------------------------- */

    if (settingPassword) {

      const password =
        el("googlePassword")
          ?.value || "";


      const {
        error: passwordError
      } =
        await sb.auth.updateUser({

          password

        });


      if (passwordError) {

        console.error(
          "Google password update:",
          passwordError
        );

        showMessage(
          passwordError.message ||
          "Unable to set your password."
        );

        return;

      }

    }


    /* -----------------------------------------------------
       Submit membership request
       ----------------------------------------------------- */

    const result =
      await submitAccessRequest(
        selections
      );


    if (!result.success) {

      showMessage(
        result.error
      );

      return;

    }


    /* -----------------------------------------------------
       Sign out after request
       ----------------------------------------------------- */

    await sb.auth.signOut();


    button.disabled =
      true;

    button.textContent =
      "Request Submitted";


    showMessage(
      "Access request submitted successfully. An administrator must approve your account.",
      "ok"
    );

  }

  catch (error) {

    console.error(
      "Google access request:",
      error
    );

    showMessage(
      error.message ||
      "Unable to submit your access request."
    );

  }

  finally {

    if (
      button.textContent !==
      "Request Submitted"
    ) {

      button.disabled =
        false;

      button.textContent =
        "Request Access";

    }

  }

}


/* =========================================================================
   USE DIFFERENT GOOGLE ACCOUNT
   ========================================================================= */

async function useDifferentGoogleAccount() {

  clearMessage();


  const button =
    el(
      "googleUseDifferentAccountBtn"
    );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Signing out…";

  }


  try {

    await sb.auth.signOut();

  }

  catch (error) {

    console.error(
      "Google signout:",
      error
    );

  }


  /* ---------------------------------------------------------
     Clear selections
     --------------------------------------------------------- */

  googleSelectedForums.clear();


  el("googleSelectedForumsContainer")
    ?.replaceChildren();


  const googleForum =
    el("googleForum");


  if (googleForum) {

    googleForum.value =
      "";

  }


  const password =
    el("googlePassword");

  const password2 =
    el("googlePassword2");


  if (password) {
    password.value = "";
  }


  if (password2) {
    password2.value = "";
  }


  /* ---------------------------------------------------------
     Restore normal signup
     --------------------------------------------------------- */

  el("emailSignupFields")
    ?.classList.remove(
      "hidden"
    );

  el("googleDivider")
    ?.classList.remove(
      "hidden"
    );

  el("googleSignupBtn")
    ?.classList.remove(
      "hidden"
    );

  el("requestAccessBtn")
    ?.classList.remove(
      "hidden"
    );

  el("sendVerificationBtn")
    ?.classList.remove(
      "hidden"
    );


  el("googleProfileSetup")
    ?.classList.add(
      "hidden"
    );


  el("googlePasswordBox")
    ?.classList.remove(
      "hidden"
    );


  const googleButton =
    el("googleSignupBtn");


  if (googleButton) {

    googleButton.disabled =
      false;

    googleButton.innerHTML = `
      <span class="google-icon">
        G
      </span>
      Continue with Google
    `;

  }


  const requestButton =
    el("googleRequestAccessBtn");


  if (requestButton) {

    requestButton.disabled =
      false;

    requestButton.textContent =
      "Request Access";

  }


  if (button) {

    button.disabled =
      false;

    button.textContent =
      "Not you? Use a different Google account";

  }

}


/* =========================================================================
   EXISTING SESSION
   ========================================================================= */
/* =========================================================================
   ENSURE PERMANENT GOOGLE DRIVE CONNECTION
   ========================================================================= */

async function ensureGoogleDriveConnection(
  session
) {

  try {

    const {
      data: {
        user
      }
    } =
      await sb.auth.getUser();


    if (!user) {

      return {
        connected: false,
        redirected: false
      };

    }


    /* -----------------------------------------------------
       CHECK EXISTING DRIVE CONNECTION
    ----------------------------------------------------- */

    const {
      data: connection,
      error: connectionError
    } =
      await sb
        .from(
          "google_drive_connections"
        )
        .select(
          `
          user_id,
          google_refresh_token,
          root_folder_id
          `
        )
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();


    if (
      connectionError
    ) {

      console.error(
        "Google Drive connection check failed:",
        connectionError
      );

      return {
        connected: false,
        redirected: false
      };

    }


    /* -----------------------------------------------------
       PERMANENT CONNECTION ALREADY EXISTS
    ----------------------------------------------------- */

    if (
      connection &&
      connection.google_refresh_token &&
      connection.root_folder_id
    ) {

      console.log(
        "Permanent Google Drive connection already exists."
      );

      return {
        connected: true,
        redirected: false
      };

    }


    console.log(
      "No permanent Google Drive connection. Starting authorization..."
    );


    /* -----------------------------------------------------
       START PERMANENT DRIVE AUTHORIZATION
    ----------------------------------------------------- */

    const response =
      await fetch(

        "https://mmmsmncmskvuqyhaqcne.supabase.co/functions/v1/connect-google-drive",

        {

          method:
            "POST",

          headers: {

            "Authorization":
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

      console.error(
        "Unable to start permanent Google Drive connection:",
        result
      );

      return {
        connected: false,
        redirected: false
      };

    }


    /*
     * Redirect the user immediately.
     */

    window.location.href =
      result.authorization_url;


    return {
      connected: false,
      redirected: true
    };

  }

  catch (
  error
  ) {

    console.error(
      "ensureGoogleDriveConnection error:",
      error
    );

    return {
      connected: false,
      redirected: false
    };

  }

}

async function checkExistingSession() {

  try {

    /* =================================================
       GET CURRENT SESSION
    ================================================= */

    const {
      data: {
        session
      }
    } =
      await sb.auth.getSession();


    if (
      !session
    ) {

      return;

    }


    /* =================================================
       GET CURRENT USER
    ================================================= */

    const {
      data: {
        user
      }
    } =
      await sb.auth.getUser();


    if (
      !user
    ) {

      return;

    }


    console.log(
      "Existing session:",
      {

        id:
          user.id,

        email:
          user.email,

        provider:
          user.app_metadata?.provider

      }
    );


    const provider =
      user.app_metadata?.provider;


    /* =================================================
       GOOGLE EXISTING SESSION
    ================================================= */

    if (
      provider === "google"
    ) {

      el("tabSignup")
        ?.click();


      console.log(
        "Existing Google session provider token:",
        session.provider_token
          ? "AVAILABLE"
          : "NOT AVAILABLE"
      );


      console.log(
        "Existing Google session refresh token:",
        session.provider_refresh_token
          ? "AVAILABLE"
          : "NOT AVAILABLE"
      );


      if (
        session.provider_token
      ) {

        try {

          console.log(
            "Creating/checking RiGiD Drive..."
          );


          const driveResponse =
            await fetch(

              "https://mmmsmncmskvuqyhaqcne.supabase.co/functions/v1/google-drive",

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

                    access_token:
                      session.provider_token,

                    refresh_token:
                      session.provider_refresh_token ||
                      null

                  })

              }

            );


          const driveResult =
            await driveResponse.json();


          console.log(
            "RiGiD Drive result:",
            driveResult
          );


          if (
            !driveResponse.ok
          ) {

            console.error(
              "Google Drive function returned error:",
              driveResult
            );

          }

        }

        catch (
        driveError
        ) {

          console.error(
            "RiGiD Drive request failed:",
            driveError
          );

        }

      }

      else {

        console.warn(
          "Google provider token is not available."
        );

      }


      await setupGoogleUser(
        user
      );


      return;

    }


    /* =================================================
       EMAIL USER
    ================================================= */

    if (
      user.email_confirmed_at
    ) {

      el("tabSignup")
        ?.click();


      markEmailVerified();

    }

  }

  catch (
  error
  ) {

    console.error(
      "checkExistingSession:",
      error
    );

  }

}


/* =========================================================================
   SUPABASE AUTH STATE CHANGE
   ========================================================================= */

function initAuthStateListener() {

  sb.auth.onAuthStateChange(
    async (
      event,
      session
    ) => {

      console.log(
        "Auth event:",
        event
      );


      if (
        event === "SIGNED_IN" &&
        session?.user
      ) {

        const provider =
          session.user
            .app_metadata
            ?.provider;


        if (
          provider === "google"
        ) {

          console.log(
            "Google SIGNED_IN event received."
          );

        }

      }

    }
  );

}


/* =========================================================================
   INITIALIZATION
   ========================================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "RiGiD login initialization..."
    );


    /* -----------------------------------------------------
       UI
       ----------------------------------------------------- */

    startClock();

    initTheme();

    initTabs();

    initForumSelection();


    /* -----------------------------------------------------
       Load database data
       ----------------------------------------------------- */

    await loadForumData();


    /* -----------------------------------------------------
       Auth listener
       ----------------------------------------------------- */

    initAuthStateListener();


    /* -----------------------------------------------------
       Existing session
       ----------------------------------------------------- */

    await checkExistingSession();


    /* -----------------------------------------------------
       LOGIN
       ----------------------------------------------------- */

    el("loginForm")
      ?.addEventListener(
        "submit",
        loginUser
      );


    /* -----------------------------------------------------
       NORMAL ACCESS REQUEST
       ----------------------------------------------------- */

    el("signupForm")
      ?.addEventListener(
        "submit",
        requestAccess
      );


    /* -----------------------------------------------------
       VERIFICATION
       ----------------------------------------------------- */

    el("sendVerificationBtn")
      ?.addEventListener(
        "click",
        sendVerificationLink
      );


    el("resendVerificationBtn")
      ?.addEventListener(
        "click",
        resendVerificationLink
      );


    /* -----------------------------------------------------
       GOOGLE
       ----------------------------------------------------- */

    el("googleSignupBtn")
      ?.addEventListener(
        "click",
        signUpWithGoogle
      );


    el("googleRequestAccessBtn")
      ?.addEventListener(
        "click",
        submitGoogleAccessRequest
      );


    el("googleUseDifferentAccountBtn")
      ?.addEventListener(
        "click",
        useDifferentGoogleAccount
      );


    console.log(
      "RiGiD login initialized successfully."
    );

  }
);