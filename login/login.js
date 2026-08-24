/* =========================================================================
   RiGiD LOGIN
   login.js

   Responsibilities:
   - Login
   - Signup
   - Team loading
   - Email verification
   - Access request
   - Approval status
   - Theme
   - Clock

   Does NOT contain dashboard logic.
   ========================================================================= */


/* =========================================================================
   CONFIGURATION
   ========================================================================= */

const LOGIN_CONFIG = {

  ALLOWED_EMAIL_DOMAIN: "@kct.ac.in",

  DASHBOARD_URL:
    "../dashboard/admin/admin.html"

};


/* =========================================================================
   HELPERS
   ========================================================================= */

function el(id) {
  return document.getElementById(id);
}


/* =========================================================================
   CLOCK
   ========================================================================= */

function startClock() {

  const clock = el("liveClock");

  if (!clock) return;

  function updateClock() {

    const now = new Date();

    clock.textContent =
      now.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }) +
      " — " +
      now.toLocaleTimeString();

  }

  updateClock();

  setInterval(updateClock, 1000);
}


/* =========================================================================
   THEME
   ========================================================================= */

function initTheme() {

  const button = el("themeToggle");

  if (!button) return;

  button.addEventListener("click", () => {

    const dark =
      document.documentElement
        .classList
        .toggle("dark");

    localStorage.setItem(
      "logbook-theme",
      dark ? "dark" : "light"
    );

    updateThemeIcon();

  });

  updateThemeIcon();
}


function updateThemeIcon() {

  const icon = el("themeIcon");

  if (!icon) return;

  const isDark =
    document.documentElement
      .classList
      .contains("dark");

  icon.textContent =
    isDark ? "☀" : "☾";
}


/* =========================================================================
   AUTH MESSAGE
   ========================================================================= */

function showMessage(message, type = "error") {

  const box = el("authMessage");

  if (!box) return;

  box.textContent = message;

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

  const box = el("authMessage");

  if (!box) return;

  box.classList.add("hidden");

}


/* =========================================================================
   VERIFICATION STATUS
   ========================================================================= */

function setVerificationStatus(
  message,
  type = "ok"
) {

  const status = el("verificationStatus");

  if (!status) return;

  status.textContent = message;

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
   LOAD TEAMS
   ========================================================================= */

async function loadTeams() {

  const select = el("signupTeam");

  if (!select) return;


  const {
    data,
    error
  } = await sb
    .from("teams")
    .select("id, name")
    .order("name");


  if (error) {

    console.error(
      "Team loading error:",
      error
    );

    select.innerHTML = `
      <option value="" disabled selected>
        Unable to load teams
      </option>
    `;

    return;
  }


  if (!data || data.length === 0) {

    select.innerHTML = `
      <option value="" disabled selected>
        No teams available
      </option>
    `;

    return;
  }


  select.innerHTML = `
    <option value="" disabled selected>
      Select your team
    </option>
  `;


  data.forEach(team => {

    const option =
      document.createElement("option");

    option.value = team.id;

    option.textContent = team.name;

    select.appendChild(option);

  });

}


/* =========================================================================
   TAB SWITCHING
   ========================================================================= */

function initTabs() {

  const loginTab = el("tabLogin");
  const signupTab = el("tabSignup");

  const loginForm = el("loginForm");
  const signupForm = el("signupForm");


  loginTab.addEventListener(
    "click",
    () => {

      loginTab.classList.add("is-active");
      signupTab.classList.remove("is-active");

      loginForm.classList.remove("hidden");
      signupForm.classList.add("hidden");

      clearMessage();

    }
  );


  signupTab.addEventListener(
    "click",
    () => {

      signupTab.classList.add("is-active");
      loginTab.classList.remove("is-active");

      signupForm.classList.remove("hidden");
      loginForm.classList.add("hidden");

      clearMessage();

    }
  );

}


/* =========================================================================
   SEND VERIFICATION LINK
   ========================================================================= */

async function sendVerificationLink() {

  clearMessage();


  const email =
    el("signupEmail")
      .value
      .trim()
      .toLowerCase();

  const teamId =
    el("signupTeam").value;

  const password =
    el("signupPassword").value;

  const password2 =
    el("signupPassword2").value;


  /* ---------------------------------------------------------
     Validate KCT email
     --------------------------------------------------------- */

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


  /* ---------------------------------------------------------
     Validate team
     --------------------------------------------------------- */

  if (!teamId) {

    showMessage(
      "Please select your team."
    );

    return;

  }


  /* ---------------------------------------------------------
     Validate password
     --------------------------------------------------------- */

  if (password.length < 8) {

    showMessage(
      "Password must contain at least 8 characters."
    );

    return;

  }


  if (password !== password2) {

    showMessage(
      "Passwords do not match."
    );

    return;

  }


  const button =
    el("sendVerificationBtn");


  button.disabled = true;

  button.textContent =
    "Sending…";


  try {

    /* -------------------------------------------------------
       Check whether the user is already signed in
       ------------------------------------------------------- */

    const {
      data: {
        session
      }
    } = await sb.auth.getSession();


    if (session) {

      showMessage(
        "You are already signed in. Please use your existing account instead of creating a new account."
      );

      return;
    }


    /* -------------------------------------------------------
       Check whether this email already exists in profiles
       
       IMPORTANT:
       We compare ONLY the email.
       Password and team are ignored.
       ------------------------------------------------------- */

    const {
      data: signupStatus,
      error: statusError
    } = await sb.rpc(
      "check_signup_email",
      {
        check_email: email
      }
    );


    if (statusError) {

      console.error(
        "Signup email status error:",
        statusError
      );

      showMessage(
        "Unable to check your account status. Please try again."
      );

      return;
    }


    /* -------------------------------------------------------
       Existing pending account
       ------------------------------------------------------- */

    if (signupStatus === "pending") {

      showMessage(
        "Your access request is already pending. Please wait for an administrator to approve your account.",
        "ok"
      );

      return;
    }


    /* -------------------------------------------------------
       Existing approved account
       ------------------------------------------------------- */

    if (signupStatus === "approved") {

      showMessage(
        "This account is already approved. Please log in instead of signing up.",
        "ok"
      );

      return;
    }


    /* -------------------------------------------------------
       Existing rejected account
       ------------------------------------------------------- */

    if (signupStatus === "rejected") {

      showMessage(
        "Your previous access request was rejected. Please contact an administrator."
      );

      return;
    }


    /* -------------------------------------------------------
       Only NEW email reaches signUp()
       ------------------------------------------------------- */

    if (signupStatus !== "not_found") {

      showMessage(
        "This account already exists. Please log in or contact an administrator."
      );

      return;
    }


    /* -------------------------------------------------------
       Create NEW Supabase account
       ------------------------------------------------------- */

    const { data, error } =
      await sb.auth.signUp({

        email,
        password,

        options: {

          emailRedirectTo:
            `${window.location.origin}/login/login.html`,

          data: {
            team_id: teamId
          }

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
        "Unable to create the account. Please try again."
      );

      return;
    }


    /* -------------------------------------------------------
       Display success
       ------------------------------------------------------- */

    setVerificationStatus(
      "✓ Verification link sent. Check your KCT email and click the link.",
      "ok"
    );


    const resendBox =
      el("resendVerificationBox");

    if (resendBox) {

      resendBox.classList.remove(
        "hidden"
      );

    }


    startResendCooldown();


    showMessage(
      "Verification email sent. Check your inbox.",
      "ok"
    );


    button.textContent =
      "Verification Link Sent";


    /* -------------------------------------------------------
       Check verification periodically
       ------------------------------------------------------- */

    startVerificationWatcher();


  } catch (error) {

    console.error(
      "Verification error:",
      error
    );

    showMessage(
      "Something went wrong. Please try again."
    );

  } finally {

    button.disabled = false;

    if (
      button.textContent !==
      "Verification Link Sent"
    ) {

      button.textContent =
        "Send Verification Link";

    }

  }

}
async function resendVerificationLink() {

  clearMessage();
  /* ---------------------------------------------------------
   Check whether the user is already signed in
   --------------------------------------------------------- */

  const {
    data: {
      session
    }
  } = await sb.auth.getSession();


  if (session) {

    showMessage(
      "You are already signed in. Please use your existing account instead of creating a new account."
    );

    return;
  }

  const email =
    el("signupEmail").value.trim().toLowerCase();

  if (!email) {

    showMessage(
      "Enter your KCT email address first."
    );

    return;
  }


  if (!email.endsWith("@kct.ac.in")) {

    showMessage(
      "Please use your @kct.ac.in email address."
    );

    return;
  }


  const button =
    el("resendVerificationBtn");


  if (!button) {
    return;
  }


  button.disabled = true;

  button.textContent =
    "Sending...";


  try {

    const { error } =
      await sb.auth.resend({
        type: "signup",
        email: email,

        options: {
          emailRedirectTo:
            `${window.location.origin}/login/login.html`
        }
      });


    if (error) {
      throw error;
    }


    showMessage(
      "Verification link resent successfully.",
      "ok"
    );


    /* -----------------------------------------------------
       Start 60-second cooldown
       ----------------------------------------------------- */

    startResendCooldown();


  } catch (error) {

    console.error(
      "Resend verification error:",
      error
    );


    showMessage(
      error.message ||
      "Unable to resend verification link."
    );


    button.disabled = false;

    button.textContent =
      "Resend verification link";
  }

}

/* =============================================================
   RESEND VERIFICATION COUNTDOWN
   ============================================================= */

let resendCountdownTimer = null;


function startResendCooldown() {

  const button =
    el("resendVerificationBtn");


  if (!button) {
    return;
  }


  /* ---------------------------------------------------------
     Clear an existing timer
     --------------------------------------------------------- */

  if (resendCountdownTimer) {

    clearInterval(
      resendCountdownTimer
    );

    resendCountdownTimer = null;
  }


  let seconds = 60;


  /* ---------------------------------------------------------
     Disable resend button
     --------------------------------------------------------- */

  button.disabled = true;

  button.textContent =
    `Resend in ${seconds}s`;


  /* ---------------------------------------------------------
     Start countdown
     --------------------------------------------------------- */

  resendCountdownTimer =
    setInterval(() => {

      seconds--;


      if (seconds <= 0) {

        clearInterval(
          resendCountdownTimer
        );

        resendCountdownTimer = null;


        button.disabled = false;

        button.textContent =
          "Resend verification link";

        return;
      }


      button.textContent =
        `Resend in ${seconds}s`;

    }, 1000);

}


/* =========================================================================
   VERIFY CURRENT USER
   ========================================================================= */

async function checkEmailVerification() {

  try {

    const {
      data: {
        user
      }
    } = await sb.auth.getUser();


    if (!user) {
      return false;
    }


    if (user.email_confirmed_at) {

      markEmailVerified();

      return true;

    }


  } catch (error) {

    console.error(
      "Verification check failed:",
      error
    );

  }


  return false;
}


/* =========================================================================
   VERIFICATION WATCHER
   ========================================================================= */

let verificationTimer = null;


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

          verificationTimer = null;

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

    button.textContent =
      "✓ Email Verified";

    button.disabled = true;

    button.classList.add(
      "verification-complete"
    );

  }


  if (requestButton) {

    requestButton.disabled = false;

  }

}


/* =========================================================================
   REQUEST ACCESS
   ========================================================================= */

async function requestAccess(event) {

  event.preventDefault();

  clearMessage();


  const requestButton =
    el("requestAccessBtn");


  /* ---------------------------------------------------------
     Confirm email verification
     --------------------------------------------------------- */

  const {
    data: {
      user
    }
  } = await sb.auth.getUser();


  i/* ---------------------------------------------------------
   User is already signed in
   --------------------------------------------------------- */

  if (user) {

    showMessage(
      "You are already signed in. Please use your existing account instead of creating a new account."
    );

    requestButton.disabled = true;

    requestButton.textContent =
      "Already Signed In";

    return;
  }


  if (!user.email_confirmed_at) {

    showMessage(
      "Please click the verification link sent to your email first."
    );

    return;

  }


  /* ---------------------------------------------------------
     Get profile
     --------------------------------------------------------- */

  const {
    data: profile,
    error
  } = await sb
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single();


  if (error || !profile) {

    console.error(
      "Profile lookup error:",
      error
    );

    showMessage(
      "Your profile could not be found. Please contact an administrator."
    );

    return;

  }


  /* ---------------------------------------------------------
     Already approved
     --------------------------------------------------------- */

  if (
    profile.status === "approved"
  ) {

    showMessage(
      "Your account is already approved. You can log in.",
      "ok"
    );

    await sb.auth.signOut();

    return;

  }


  /* ---------------------------------------------------------
     Already pending
     --------------------------------------------------------- */
  const justVerified =
    Boolean(user.email_confirmed_at);
  if (
    profile.status === "pending"
  ) {

    showMessage(
      "Your access request has already been submitted and is waiting for admin approval.",
      "ok"
    );

    await sb.auth.signOut();

    return;

  }


  /* ---------------------------------------------------------
     Rejected
     --------------------------------------------------------- */

  if (
    profile.status === "rejected"
  ) {

    showMessage(
      "Your previous access request was rejected. Please contact an administrator."
    );

    await sb.auth.signOut();

    return;

  }


  /* ---------------------------------------------------------
     Submit request
     --------------------------------------------------------- */

  requestButton.disabled = true;

  requestButton.textContent =
    "Submitting…";


  /*
     The trigger already created the profile with:

     role   = member
     status = pending

     Therefore we don't need to update the profile here.

     This is safer because normal users should not have
     permission to change their own status.
  */


  await sb.auth.signOut();


  requestButton.textContent =
    "Request Submitted";


  showMessage(
    "Access request submitted successfully. An administrator must approve your account before you can log in.",
    "ok"
  );

}


/* =========================================================================
   LOGIN
   ========================================================================= */

async function loginUser(event) {

  event.preventDefault();

  clearMessage();


  const email =
    el("loginEmail")
      .value
      .trim()
      .toLowerCase();

  const password =
    el("loginPassword")
      .value;


  const button =
    el("loginForm")
      .querySelector(
        "button[type='submit']"
      );


  button.disabled = true;

  button.textContent =
    "Logging in…";


  try {

    const {
      data,
      error
    } = await sb.auth.signInWithPassword({

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


    /* -------------------------------------------------------
       Check email verification
       ------------------------------------------------------- */

    if (!user.email_confirmed_at) {

      await sb.auth.signOut();

      showMessage(
        "Please verify your email before logging in."
      );

      return;

    }


    /* -------------------------------------------------------
       Load profile
       ------------------------------------------------------- */

    const {
      data: profile,
      error: profileError
    } = await sb
      .from("profiles")
      .select(
        "id, email, role, status, team_id"
      )
      .eq(
        "id",
        user.id
      )
      .single();


    if (
      profileError ||
      !profile
    ) {

      await sb.auth.signOut();

      console.error(
        "Profile error:",
        profileError
      );

      showMessage(
        "Your account profile could not be found."
      );

      return;

    }


    /* -------------------------------------------------------
       Pending
       ------------------------------------------------------- */

    if (
      profile.status === "pending"
    ) {

      await sb.auth.signOut();

      showMessage(
        "Your account is waiting for admin approval."
      );

      return;

    }


    /* -------------------------------------------------------
       Rejected
       ------------------------------------------------------- */

    if (
      profile.status === "rejected"
    ) {

      await sb.auth.signOut();

      showMessage(
        "Your access request was rejected. Please contact an administrator."
      );

      return;

    }


    /* -------------------------------------------------------
       Approved
       ------------------------------------------------------- */

    if (
      profile.status === "approved"
    ) {

      window.location.href =
        LOGIN_CONFIG.DASHBOARD_URL;

      return;

    }


    /* -------------------------------------------------------
       Unknown status
       ------------------------------------------------------- */

    await sb.auth.signOut();

    showMessage(
      "Your account has an invalid status. Contact an administrator."
    );


  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    showMessage(
      "Something went wrong while logging in."
    );

  } finally {

    button.disabled = false;

    button.textContent =
      "Log In";

  }

}


/* =========================================================================
   EXISTING SESSION
   ========================================================================= */

async function checkExistingSession() {

  try {

    const {
      data: {
        session
      }
    } = await sb.auth.getSession();


    if (!session) {
      return;
    }


    const {
      data: {
        user
      }
    } = await sb.auth.getUser();


    if (!user) {
      return;
    }


    /* -------------------------------------------------------
       GOOGLE USER
       ------------------------------------------------------- */

    const isGoogleUser =
      user.app_metadata?.provider === "google";


    if (isGoogleUser) {

      /* -------------------------------------------------------
         Google signup should always return to Sign Up tab
         ------------------------------------------------------- */

      const signupTab =
        el("tabSignup");

      if (signupTab) {
        signupTab.click();
      }


      await setupGoogleUser(user);

      return;
    }


    /* -------------------------------------------------------
       If user has just returned from email verification,
       check the confirmed email.
       ------------------------------------------------------- */

    /* -------------------------------------------------------
    EMAIL VERIFICATION RETURN
    ------------------------------------------------------- */

    if (user.email_confirmed_at) {

      /*
         The user has just returned from the
         verification link.
  
         Make sure the Sign Up section is visible
         so the verification result can be seen.
      */

      const signupTab =
        el("tabSignup");

      if (signupTab) {
        signupTab.click();
      }


      /*
         Show the verified state.
      */

      markEmailVerified();

    }

    /* -------------------------------------------------------
       Check profile
       ------------------------------------------------------- */

    const {
      data: profile
    } = await sb
      .from("profiles")
      .select("status")
      .eq(
        "id",
        user.id
      )
      .single();


    /* -------------------------------------------------------
   Check profile status
   ------------------------------------------------------- */

    if (profile) {

      /* -----------------------------------------------------
         Already approved
         ----------------------------------------------------- */

      if (
        profile.status === "approved"
      ) {

        window.location.href =
          LOGIN_CONFIG.DASHBOARD_URL;

        return;
      }


      /* -----------------------------------------------------
         Access request already pending
         ----------------------------------------------------- */

      if (
        profile.status === "pending"
      ) {

        showMessage(
          "Your access request is already pending. Please wait for an administrator to approve your account.",
          "ok"
        );


        /* -----------------------------------------------
           Prevent creating another request
           ----------------------------------------------- */

        const requestButton =
          el("requestAccessBtn");

        if (requestButton) {

          requestButton.disabled = true;

          requestButton.textContent =
            "Request Already Submitted";
        }


        /* -----------------------------------------------
           Sign out after displaying the message
           ----------------------------------------------- */

        await sb.auth.signOut();

        return;
      }


      /* -----------------------------------------------------
         Previously rejected
         ----------------------------------------------------- */

      if (
        profile.status === "rejected"
      ) {

        showMessage(
          "Your previous access request was rejected. Please contact an administrator."
        );

        await sb.auth.signOut();

        return;
      }
    }

  } catch (error) {

    console.error(
      "Session check failed:",
      error
    );

  }

}


/* =========================================================================
   INITIALIZATION
   ========================================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    startClock();

    initTheme();

    initTabs();

    await loadTeams();

    await checkExistingSession();


    /* -------------------------------------------------------
       Login
       ------------------------------------------------------- */

    el("loginForm")
      .addEventListener(
        "submit",
        loginUser
      );


    /* -------------------------------------------------------
       Signup
       ------------------------------------------------------- */

    el("signupForm")
      .addEventListener(
        "submit",
        requestAccess
      );


    /* -------------------------------------------------------
       Verification
       ------------------------------------------------------- */

    el("sendVerificationBtn")
      .addEventListener(
        "click",
        sendVerificationLink
      );

    el("resendVerificationBtn")
      ?.addEventListener(
        "click",
        resendVerificationLink
      );

    el("googleSignupBtn")
      .addEventListener(
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

  }
);

/* =========================================================================
   USE A DIFFERENT GOOGLE ACCOUNT
   ========================================================================= */

async function useDifferentGoogleAccount() {

  clearMessage();

  const button =
    el("googleUseDifferentAccountBtn");

  if (button) {
    button.disabled = true;
    button.textContent = "Signing out…";
  }

  try {

    await sb.auth.signOut();

  } catch (error) {

    console.error(
      "Sign out error:",
      error
    );

  }


  /*
   * Reset the Google profile setup box back to empty.
   */

  const teamSelect = el("googleTeam");
  if (teamSelect) {
    teamSelect.value = "";
    teamSelect.disabled = false;
  }

  const password = el("googlePassword");
  if (password) password.value = "";

  const password2 = el("googlePassword2");
  if (password2) password2.value = "";

  el("googlePasswordBox")
    ?.classList.remove("hidden");

  const requestBtn = el("googleRequestAccessBtn");
  if (requestBtn) {
    requestBtn.disabled = false;
    requestBtn.textContent = "Request Access";
  }


  /*
   * Hide the Google profile box, show the normal
   * signup controls again.
   */

  el("googleProfileSetup")
    ?.classList.add("hidden");

  el("emailSignupFields")
    ?.classList.remove("hidden");

  el("googleDivider")
    ?.classList.remove("hidden");

  el("sendVerificationBtn")
    ?.classList.remove("hidden");

  el("verificationStatus")
    ?.classList.add("hidden");

  const googleBtn = el("googleSignupBtn");
  if (googleBtn) {
    googleBtn.classList.remove("hidden");
    googleBtn.disabled = false;
    googleBtn.innerHTML = `
            <span class="google-icon">G</span>
            Continue with Google
        `;
  }

  el("requestAccessBtn")
    ?.classList.remove("hidden");

  if (button) {
    button.disabled = false;
    button.textContent = "Not you? Use a different Google account";
  }

  clearMessage();

}


/* =========================================================================
   GOOGLE SIGN-UP
   ========================================================================= */

async function signUpWithGoogle() {

  clearMessage();

  const button = el("googleSignupBtn");

  button.disabled = true;
  button.textContent = "Connecting to Google…";

  try {

    const { data, error } = await sb.auth.signInWithOAuth({

      provider: "google",

      options: {

        redirectTo:
          `${window.location.origin}/login/login.html`

      }

    });


    if (error) {

      console.error(
        "Google OAuth error:",
        error
      );

      showMessage(
        error.message ||
        "Unable to connect to Google."
      );

      button.disabled = false;
      button.innerHTML = `
                <span class="google-icon">G</span>
                Continue with Google
            `;

      return;
    }


    /*
     * Supabase redirects the browser to Google.
     *
     * We don't manually redirect here.
     */

  } catch (error) {

    console.error(
      "Google sign-up error:",
      error
    );

    showMessage(
      "Unable to connect to Google."
    );

    button.disabled = false;

    button.innerHTML = `
            <span class="google-icon">G</span>
            Continue with Google
        `;

  }

}
/* =========================================================================
   GOOGLE PROFILE SETUP
   ========================================================================= */

async function setupGoogleUser(user) {

  if (!user) {
    return;
  }


  const email =
    (user.email || "")
      .trim()
      .toLowerCase();


  /* ---------------------------------------------------------
     Google account must be a KCT account
     --------------------------------------------------------- */




  /* ---------------------------------------------------------
     Get existing profile
     --------------------------------------------------------- */

  const {
    data: profile,
    error
  } = await sb
    .from("profiles")
    .select(
      "id, email, full_name, team_id, role, status"
    )
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
      "Unable to load your profile."
    );

    return;

  }


  /* ---------------------------------------------------------
     Existing approved user
     --------------------------------------------------------- */

  if (
    profile &&
    profile.status === "approved"
  ) {

    window.location.href =
      LOGIN_CONFIG.DASHBOARD_URL;

    return;

  }


  /* ---------------------------------------------------------
     Existing pending user with team
     --------------------------------------------------------- */

  if (
    profile &&
    profile.status === "pending" &&
    profile.team_id
  ) {

    showGooglePendingState(
      user,
      profile
    );

    return;

  }


  /* ---------------------------------------------------------
     New Google user
     OR
     Existing profile without team
     --------------------------------------------------------- */

  showGoogleTeamSelection(user);

}
function showGoogleTeamSelection(user) {

  const setup = el("googleProfileSetup");
  const name = el("googleUserName");
  const email = el("googleUserEmail");
  const teamSelect = el("googleTeam");

  if (!setup || !teamSelect) {
    console.error("Google team selection elements not found.");
    return;
  }

  setup.classList.remove("hidden");

  if (name) {
    name.textContent =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "Google User";
  }

  if (email) {
    email.textContent =
      user.email || "";
  }

  /*
   * Copy the already-loaded team options.
   * Do NOT call loadTeams() again here.
   */

  const signupTeam = el("signupTeam");

  if (signupTeam) {

    teamSelect.innerHTML =
      signupTeam.innerHTML;

  }

  /*
   * Hide the normal signup controls.
   */

  el("emailSignupFields")
    ?.classList.add("hidden");

  el("googleDivider")
    ?.classList.add("hidden");

  el("sendVerificationBtn")
    ?.classList.add("hidden");

  el("verificationStatus")
    ?.classList.add("hidden");

  el("googleSignupBtn")
    ?.classList.add("hidden");

  el("requestAccessBtn")
    ?.classList.add("hidden");
}
/* =========================================================================
   GOOGLE REQUEST ACCESS
   ========================================================================= */

function copyTeamsToGoogleSelect() {

  const source =
    el("signupTeam");

  const target =
    el("googleTeam");

  if (!source || !target) {
    return;
  }

  target.innerHTML =
    source.innerHTML;
}

function showGooglePendingState(user, profile) {

  const setup = el("googleProfileSetup");
  const name = el("googleUserName");
  const email = el("googleUserEmail");
  const teamSelect = el("googleTeam");
  const button = el("googleRequestAccessBtn");

  if (!setup) {
    showMessage(
      "Your access request is already waiting for admin approval.",
      "ok"
    );
    return;
  }

  setup.classList.remove("hidden");

  if (name) {
    name.textContent =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "Google User";
  }

  if (email) {
    email.textContent = user.email || "";
  }

  copyTeamsToGoogleSelect();

  if (teamSelect) {
    teamSelect.value = profile.team_id || "";
    teamSelect.disabled = true;
  }

  /*
   * Password was already set the first time they went
   * through this flow — don't ask again.
   */

  const passwordBox =
    el("googlePasswordBox");

  if (passwordBox) {
    passwordBox.classList.add("hidden");
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Request Already Submitted";
  }

  el("emailSignupFields")
    ?.classList.add("hidden");

  el("googleDivider")
    ?.classList.add("hidden");

  el("sendVerificationBtn")
    ?.classList.add("hidden");

  el("resendVerificationBtn")
    ?.addEventListener(
      "click",
      resendVerificationLink
    );

  el("verificationStatus")
    ?.classList.add("hidden");

  el("googleSignupBtn")
    ?.classList.add("hidden");

  el("requestAccessBtn")
    ?.classList.add("hidden");

  showMessage(
    "Your access request is already submitted and is waiting for admin approval.",
    "ok"
  );
}

async function submitGoogleAccessRequest() {

  clearMessage();

  const teamSelect =
    el("googleTeam");

  const button =
    el("googleRequestAccessBtn");


  /* ---------------------------------------------------------
     Validate elements
     --------------------------------------------------------- */

  if (!teamSelect || !button) {

    console.error(
      "Google team or request button not found."
    );

    showMessage(
      "Unable to process the request. Please refresh the page."
    );

    return;
  }


  /* ---------------------------------------------------------
     Get selected team
     --------------------------------------------------------- */

  const teamId =
    teamSelect.value;


  if (!teamId) {

    showMessage(
      "Please select your team."
    );

    return;
  }


  /* ---------------------------------------------------------
     Validate password
     (only required the first time — box is hidden for
     returning pending users who already set one)
     --------------------------------------------------------- */

  const passwordBox =
    el("googlePasswordBox");

  const settingPassword =
    passwordBox &&
    !passwordBox.classList.contains("hidden");

  let password = null;

  if (settingPassword) {

    const passwordInput =
      el("googlePassword");

    const password2Input =
      el("googlePassword2");

    password =
      passwordInput?.value || "";

    const password2 =
      password2Input?.value || "";


    if (password.length < 8) {

      showMessage(
        "Password must contain at least 8 characters."
      );

      return;
    }


    if (password !== password2) {

      showMessage(
        "Passwords do not match."
      );

      return;
    }

  }


  /* ---------------------------------------------------------
     Disable button while processing
     --------------------------------------------------------- */

  button.disabled = true;

  button.textContent =
    "Submitting…";


  try {

    /* -----------------------------------------------------
       Get current Google user
       ----------------------------------------------------- */

    const {
      data: {
        user
      },
      error: userError
    } = await sb.auth.getUser();


    if (userError) {

      console.error(
        "Google user lookup error:",
        userError
      );

      showMessage(
        "Unable to verify your Google session. Please sign in again."
      );

      return;
    }


    if (!user) {

      showMessage(
        "Your Google session has expired. Please sign in again."
      );

      return;
    }


    /* -----------------------------------------------------
       Get Google email
       ----------------------------------------------------- */

    const email =
      (user.email || "")
        .trim()
        .toLowerCase();


    if (!email) {

      showMessage(
        "Unable to determine your Google email address."
      );

      return;
    }


    /* -----------------------------------------------------
       GOOGLE USERS

       Gmail and other Google accounts are allowed.

       No @kct.ac.in restriction here.
       ----------------------------------------------------- */


    /* -----------------------------------------------------
       Update ONLY team_id

       The Supabase RPC should handle the update securely.

       It must NOT allow the user to change:
         role
         status
         email
         id
       ----------------------------------------------------- */

    const {
      error: teamError
    } = await sb.rpc(
      "set_my_team",
      {
        selected_team_id: teamId
      }
    );


    if (teamError) {

      console.error(
        "Google team update error:",
        teamError
      );

      showMessage(
        "Unable to save your team. Please try again."
      );

      return;
    }


    /* -----------------------------------------------------
       Set password

       Google's email is already verified by Google itself,
       so no separate email-verification step is needed here.
       This just lets the user log back in later with their
       email + this password instead of via Google every time.
       ----------------------------------------------------- */

    if (settingPassword) {

      const {
        error: passwordError
      } = await sb.auth.updateUser({
        password: password
      });


      if (passwordError) {

        console.error(
          "Google password set error:",
          passwordError
        );

        showMessage(
          "Unable to set your password. Please try again."
        );

        return;
      }

    }


    /* -----------------------------------------------------
       Access request submitted

       Profile remains:

         role   = member
         status = pending

       The user cannot approve themselves.
       ----------------------------------------------------- */


    await sb.auth.signOut();


    /* -----------------------------------------------------
       Update UI
       ----------------------------------------------------- */

    button.textContent =
      "Request Submitted";


    showMessage(
      "Access request submitted. An administrator must approve your account.",
      "ok"
    );


    /* -----------------------------------------------------
       Keep button disabled after successful submission
       ----------------------------------------------------- */

    button.disabled = true;


  } catch (error) {

    console.error(
      "Google request error:",
      error
    );

    showMessage(
      error.message ||
      "Something went wrong. Please try again."
    );


  } finally {

    /*
     * Only re-enable the button if the request
     * was NOT successfully submitted.
     */

    if (
      button.textContent !==
      "Request Submitted"
    ) {

      button.disabled = false;

      button.textContent =
        "Request Access";
    }

  }

}