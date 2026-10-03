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
   - Automatic Google Drive connection / reconnect

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

   Google Drive:

       Google Login
            ↓
       RiGiD profile setup
            ↓
       User clicks "Connect Google Drive"
            ↓
       Google Drive OAuth
            ↓
       connect-google-drive
            ↓
       login.html?google_drive=connected
            ↓
       Drive connected → continue

   ========================================================================= */


/* =========================================================================
   CONFIGURATION
   ========================================================================= */

const LOGIN_CONFIG = {

  // No email-domain restriction.
  // Any valid email address may create an account.
  ADMIN_DASHBOARD_URL:
    "../dashboard/admin/admin.html",

  PERSONAL_DASHBOARD_URL:
    "../dashboard/personal/personal.html",

  LOGIN_REDIRECT_URL:
    `${window.location.origin}/login/login.html`,

  ACCESS_REQUEST_RPC:
    "submit_access_request",

  GOOGLE_DRIVE_FUNCTION_URL:
    "https://mmmsmncmskvuqyhaqcne.supabase.co/functions/v1/google-drive",

  CONNECT_GOOGLE_DRIVE_FUNCTION_URL:
    "https://mmmsmncmskvuqyhaqcne.supabase.co/functions/v1/connect-google-drive"

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

// Prevent Google OAuth from being started more than once
let googleOAuthInProgress = false;
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


  // Email signup is open to any valid email address.
  // Google signup is also open to any Google account.


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
      "✓ Verification link sent. Check your email.",
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
      "Enter your email address first."
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
        "Unable to submit your access request."

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


    if (!profile) {



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


    if (
      profile.status === "pending"
    ) {

      await sb.auth.signOut();

      showMessage(
        "Your account is waiting for admin approval."
      );

      return;

    }


    if (
      profile.status === "rejected"
    ) {

      await sb.auth.signOut();

      showMessage(
        "Your access request was rejected."
      );

      return;

    }


    if (
      profile.status === "approved"
    ) {

      routeApprovedUser(
        profile
      );

      return;

    }


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

  // HARD LOCK:
  // Prevent multiple OAuth requests from being launched.
  if (googleOAuthInProgress) {
    console.log("Google OAuth already in progress.");
    return;
  }

  googleOAuthInProgress = true;

  clearMessage();

  const button = el("googleSignupBtn");

  if (!button) {
    googleOAuthInProgress = false;

    showMessage(
      "Google sign-in button was not found."
    );

    return;
  }

  // Disable immediately before doing anything async
  button.disabled = true;

  button.innerHTML = `
    <span class="google-icon">
      G
    </span>
    Connecting to Google…
  `;

  try {

    const {
      data,
      error
    } = await sb.auth.signInWithOAuth({

      provider: "google",

       options: {
         redirectTo:
          LOGIN_CONFIG.LOGIN_REDIRECT_URL,

        // Request only access to files RiGiD creates or opens itself.
        scopes:
          "https://www.googleapis.com/auth/drive.file",

        // The existing Edge Function completes the durable, server-side
        // Drive connection after the Supabase OAuth callback.
        queryParams: {
          access_type: "offline",
          prompt: "consent"
        }
      }

    });

    if (error) {

      console.error(
        "Google OAuth:",
        error
      );

      googleOAuthInProgress = false;

      button.disabled = false;

      button.innerHTML = `
        <span class="google-icon">
          G
        </span>
        Continue with Google
      `;

      showMessage(
        error.message ||
        "Unable to connect to Google."
      );

      return;
    }

    /*
     * IMPORTANT:
     *
     * If OAuth succeeds, the browser is redirected
     * away from this page.
     *
     * Do NOT reset googleOAuthInProgress here.
     */

  }

  catch (error) {

    console.error(
      "Google sign-in:",
      error
    );

    googleOAuthInProgress = false;

    button.disabled = false;

    button.innerHTML = `
      <span class="google-icon">
        G
      </span>
      Continue with Google
    `;

    showMessage(
      error.message ||
      "Unable to connect to Google."
    );

  }

}


/* =========================================================================
   GOOGLE DRIVE CONNECTION UI
   ========================================================================= */

function setGoogleDriveConnectedUI() {

  const box =
    el("googleDriveConnectionBox");

  const button =
    el("connectGoogleDriveBtn");

  if (!box || !button) {
    return;
  }

  box.classList.add("google-drive-connected");

  const info =
    box.querySelector(".google-drive-info");

  if (info) {

    info.innerHTML = `
      <strong>
        Google Drive Connected ✓
      </strong>

      <p>
        Your Google Drive is connected and RiGiD file storage is ready.
      </p>
    `;

  }

  button.disabled = true;
  button.textContent = "Google Drive Connected ✓";

}


function setGoogleDriveDisconnectedUI() {

  const box =
    el("googleDriveConnectionBox");

  const button =
    el("connectGoogleDriveBtn");

  if (!box || !button) {
    return;
  }

  box.classList.remove("google-drive-connected");

  const info =
    box.querySelector(".google-drive-info");

  if (info) {

    info.innerHTML = `
      <strong>
        Google Drive
      </strong>

      <p>
        Connect your Google Drive to enable RiGiD file storage.
      </p>
    `;

  }

  button.disabled = false;
  button.textContent = "Connect Google Drive";

}


/* =========================================================================
   CHECK GOOGLE DRIVE CONNECTION
   ========================================================================= */

async function checkGoogleDriveConnection() {

  try {

    const {
      data: {
        user
      },
      error: userError
    } =
      await sb.auth.getUser();

    if (userError || !user) {
      return false;
    }

    const {
      data: connection,
      error: connectionError
    } =
      await sb
        .from("google_drive_connections")
        .select("user_id, root_folder_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (connectionError) {

      console.error(
        "Google Drive connection lookup failed:",
        connectionError
      );

      return false;

    }

    const connected =
      Boolean(
        connection &&
        connection.root_folder_id
      );

    if (connected) {
      setGoogleDriveConnectedUI();
    } else {
      setGoogleDriveDisconnectedUI();
    }

    return connected;

  }

  catch (error) {

    console.error(
      "checkGoogleDriveConnection:",
      error
    );

    return false;

  }

}


/* =========================================================================
   EXPLICIT GOOGLE DRIVE CONNECTION
   ========================================================================= */

async function connectGoogleDrive() {

  clearMessage();

  const button =
    el("connectGoogleDriveBtn");

  if (!button) {

    showMessage(
      "Google Drive connection button was not found."
    );

    return;

  }

  try {

    const {
      data: {
        session
      },
      error: sessionError
    } =
      await sb.auth.getSession();

    if (
      sessionError ||
      !session ||
      !session.access_token
    ) {

      showMessage(
        "Your Google session has expired. Please sign in again."
      );

      return;

    }

    const alreadyConnected =
      await checkGoogleDriveConnection();

    if (alreadyConnected) {

      showMessage(
        "Google Drive is already connected.",
        "ok"
      );

      return;

    }

    button.disabled = true;
    button.textContent = "Connecting…";

    const response =
      await fetch(
        LOGIN_CONFIG.CONNECT_GOOGLE_DRIVE_FUNCTION_URL,
        {
          method: "POST",

          headers: {
            "Authorization":
              `Bearer ${session.access_token}`,

            "Content-Type":
              "application/json"
          }
        }
      );

    let result = null;

    try {
      result = await response.json();
    }

    catch {
      result = null;
    }

    if (
      !response.ok ||
      !result?.success ||
      !result?.authorization_url
    ) {

      console.error(
        "Unable to start Google Drive authorization:",
        {
          status: response.status,
          result
        }
      );

      showMessage(
        result?.error ||
        "Unable to connect Google Drive."
      );

      setGoogleDriveDisconnectedUI();

      return;

    }

    /*
     * The existing connect-google-drive Edge Function
     * handles the OAuth state, Google authorization,
     * token exchange, RiGiD Drive folder creation,
     * database connection, and callback redirect.
     */
    window.location.href =
      result.authorization_url;

  }

  catch (error) {

    console.error(
      "connectGoogleDrive:",
      error
    );

    showMessage(
      error?.message ||
      "Unable to connect Google Drive."
    );

    setGoogleDriveDisconnectedUI();

  }

}


/* =========================================================================
   GOOGLE DRIVE OAUTH CALLBACK
   ========================================================================= */

async function handleGoogleDriveCallback() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const status =
    params.get("google_drive");

  if (!status) {
    return false;
  }

  /*
   * Remove the callback parameter immediately so a refresh
   * cannot accidentally process it again.
   */
  const cleanUrl =
    window.location.origin +
    window.location.pathname;

  window.history.replaceState(
    {},
    document.title,
    cleanUrl
  );

  if (status === "connected") {

    /*
     * The Edge Function has already completed the
     * database connection before redirecting here.
     */
    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          300
        )
    );

    const connected =
      await checkGoogleDriveConnection();

    if (connected) {

      showMessage(
        "Google Drive connected successfully.",
        "ok"
      );

      return true;

    }

    showMessage(
      "Google Drive authorization completed, but the connection could not be verified."
    );

    return false;

  }

  if (status === "error") {

    setGoogleDriveDisconnectedUI();

    showMessage(
      "Google Drive authorization was not completed. You can try again."
    );

    return false;

  }

  return false;

}


/* =========================================================================
   AUTOMATIC GOOGLE DRIVE RECONNECT
   ========================================================================= */

async function startAutomaticGoogleDriveReconnect(
  session
) {

  if (
    !session ||
    !session.access_token
  ) {

    console.warn(
      "Cannot reconnect Google Drive: Supabase session is unavailable."
    );

    return {
      connected: false,
      redirected: false
    };

  }


  /*
   * Check whether we just returned from the Google Drive
   * OAuth callback.
   *
   * connect-google-drive redirects to:
   *
   * login.html?google_drive=connected
   *
   * We MUST NOT immediately start OAuth again.
   */

  const params =
    new URLSearchParams(
      window.location.search
    );


  const googleDriveStatus =
    params.get(
      "google_drive"
    );


  if (
    googleDriveStatus ===
    "connected"
  ) {

    /*
        * Remove the query parameter from the address bar
        * without reloading the page.
        */

    const cleanUrl =
      window.location.origin +
      window.location.pathname;


    window.history.replaceState(
      {},
      document.title,
      cleanUrl
    );


    /*
     * Give the callback/database update a moment to
     * complete before continuing.
     */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          300
        )
    );


    return {
      connected: true,
      redirected: false,
      justConnected: true
    };

  }


  /*
   * If OAuth reported an error, don't create an endless
   * redirect loop.
   */

  if (
    googleDriveStatus ===
    "error"
  ) {

    console.error(
      "Google Drive authorization returned an error."
    );


    const cleanUrl =
      window.location.origin +
      window.location.pathname;


    window.history.replaceState(
      {},
      document.title,
      cleanUrl
    );


    showMessage(
      "Google Drive authorization was not completed. Please try signing in again."
    );


    return {
      connected: false,
      redirected: false
    };

  }


  /* ---------------------------------------------------------
     CHECK DATABASE CONNECTION
     --------------------------------------------------------- */

  try {

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

      console.warn(
        "Unable to identify current user for Google Drive connection."
      );

      return {
        connected: false,
        redirected: false
      };

    }


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
        "Google Drive connection lookup failed:",
        connectionError
      );

      return {
        connected: false,
        redirected: false
      };

    }


    /*
     * A complete permanent connection exists.
     */

    if (
      connection &&
      connection.google_refresh_token &&
      connection.root_folder_id
    ) {

      return {
        connected: true,
        redirected: false
      };

    }


    /*
     * No permanent connection exists.
     *
     * Start the existing connect-google-drive OAuth flow.
     */

    const response =
      await fetch(
        LOGIN_CONFIG.CONNECT_GOOGLE_DRIVE_FUNCTION_URL,
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


    let result = null;


    try {

      result =
        await response.json();

    }

    catch {

      result = null;

    }


    if (
      !response.ok ||
      !result?.success ||
      !result?.authorization_url
    ) {

      console.error(
        "Unable to start Google Drive authorization:",
        {
          status:
            response.status,

          result
        }
      );


      showMessage(
        result?.error ||
        "Unable to reconnect Google Drive automatically."
      );


      return {
        connected: false,
        redirected: false
      };

    }

    window.location.href =
      result.authorization_url;


    return {
      connected: false,
      redirected: true
    };

  }

  catch (error) {

    console.error(
      "Automatic Google Drive reconnect failed:",
      error
    );


    showMessage(
      error?.message ||
      "Unable to reconnect Google Drive."
    );


    return {
      connected: false,
      redirected: false
    };

  }

}


/* =========================================================================
   EXISTING SESSION
   ========================================================================= */

async function checkExistingSession() {

  try {

    /* =================================================
       GET CURRENT SESSION
    ================================================= */

    const {
      data: {
        session
      }
    } = await sb.auth.getSession();


    if (!session) {
      return;
    }


    /* =================================================
       GET CURRENT USER
    ================================================= */

    const {
      data: {
        user
      }
    } = await sb.auth.getUser();


    if (!user) {
      return;
    }


    const provider =
      user.app_metadata?.provider;


    /* =================================================
       GOOGLE EXISTING SESSION
    ================================================= */

    if (provider === "google") {

      el("tabSignup")?.click();


      const driveConnection =
        await startAutomaticGoogleDriveReconnect(session);

      // The existing secure Drive OAuth flow has redirected to Google.
      if (driveConnection?.redirected) {
        return;
      }

      await setupGoogleUser(user, driveConnection);

      return;
    }


    /* =================================================
       EMAIL USER
    ================================================= */

    if (user.email_confirmed_at) {

      el("tabSignup")?.click();

      markEmailVerified();
    }

  }

  catch (error) {

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

        }

      }

    }
  );

}


/* =========================================================================
   GOOGLE USER SETUP
   ========================================================================= */

async function setupGoogleUser(
  user,
  driveConnection = null
) {

  if (!user) {
    return;
  }




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


  if (!profile) {

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

    showMessage(
      driveConnection?.connected
        ? "Google sign-in and Google Drive authorization are complete. Your account is waiting for admin approval."
        : "Google sign-in is complete, but Google Drive permission is required for RiGiD file storage. Please try Continue with Google again and approve Drive access."
    );

    return;

    /* Legacy profile-setup handling below is intentionally unreachable for
       the simplified Google-only signup. */

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


  googleSelectedForums.clear();


  el("googleSelectedForumsContainer")
    ?.replaceChildren();


  const googleForum =
    el("googleForum");


  if (googleForum) {

    googleForum.value =
      "";

  }


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
   INITIALIZATION
   ========================================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {



    /* -----------------------------------------------------
       UI
       ----------------------------------------------------- */

    startClock();

    initTheme();

    initTabs();

    /* -----------------------------------------------------
       Auth listener
       ----------------------------------------------------- */

    initAuthStateListener();


    /* -----------------------------------------------------
       GOOGLE DRIVE CALLBACK
       ----------------------------------------------------- */

    const googleDriveCallbackStatus =
      new URLSearchParams(window.location.search)
        .get("google_drive");

    await handleGoogleDriveCallback();


    /* -----------------------------------------------------
       Existing session
       ----------------------------------------------------- */

    // A declined Drive consent is already explained by the callback. Do not
    // immediately launch another OAuth redirect in the same page visit.
    if (googleDriveCallbackStatus !== "error") {
      await checkExistingSession();
    }


    /* -----------------------------------------------------
       LOGIN
       ----------------------------------------------------- */

    el("loginForm")
      ?.addEventListener(
        "submit",
        loginUser
      );


    /* -----------------------------------------------------
       GOOGLE
       ----------------------------------------------------- */

    const googleSignupButton = el("googleSignupBtn");

if (googleSignupButton) {

  // Prevent duplicate listeners if initialization
  // happens more than once.
  googleSignupButton.onclick = signUpWithGoogle;

}


  }
);
