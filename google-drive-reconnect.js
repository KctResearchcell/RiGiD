/* =========================================================
   RiGiD — AUTOMATIC GOOGLE DRIVE RECONNECT
   google-drive-reconnect.js
========================================================= */

const RIGID_GOOGLE_DRIVE_CONFIG = {

    FUNCTIONS_URL:
        "https://mmmsmncmskvuqyhaqcne.supabase.co/functions/v1",

    GET_WORK_DATA:
        "get-rigid-work-data",

    CONNECT_GOOGLE_DRIVE:
        "connect-google-drive",

    RETURN_PAGE_KEY:
        "rigid_google_drive_return_page",

    REDIRECT_LOCK_KEY:
        "rigid_google_drive_redirect_lock",

    REDIRECT_LOCK_DURATION:
        10 * 60 * 1000

};


/* =========================================================
   STATE
========================================================= */

let rigidGoogleDriveReconnectRunning = false;


/* =========================================================
   GET SUPABASE CLIENT
========================================================= */

function getRiGiDSupabase() {

    if (
        window.sb &&
        window.sb.auth &&
        typeof window.sb.auth.getSession === "function"
    ) {
        return window.sb;
    }

    if (
        window.supabaseClient &&
        window.supabaseClient.auth &&
        typeof window.supabaseClient.auth.getSession === "function"
    ) {
        return window.supabaseClient;
    }

    return null;
}


/* =========================================================
   GET SESSION
========================================================= */

async function getRiGiDSession() {

    const client =
        getRiGiDSupabase();

    if (!client) {

        console.error(
            "RiGiD Google Drive: Supabase client not found."
        );

        return null;
    }

    try {

        const {
            data,
            error
        } = await client.auth.getSession();

        if (error) {

            console.error(
                "RiGiD Google Drive: session error:",
                error
            );

            return null;
        }

        return data?.session || null;

    }
    catch (error) {

        console.error(
            "RiGiD Google Drive: unable to get session:",
            error
        );

        return null;
    }
}


/* =========================================================
   CHECK WORK DATA URL
========================================================= */

function isRiGiDWorkDataRequest(input) {

    try {

        let url = "";

        if (
            typeof input === "string"
        ) {
            url = input;
        }
        else if (
            input &&
            typeof input.url === "string"
        ) {
            url = input.url;
        }

        return url.includes(
            `/${RIGID_GOOGLE_DRIVE_CONFIG.GET_WORK_DATA}`
        );

    }
    catch {

        return false;
    }
}


/* =========================================================
   SAVE CURRENT PAGE
========================================================= */

function saveRiGiDReturnPage() {

    try {

        /*
         * Never save login.html as the workspace return page.
         */

        if (
            window.location.pathname
                .toLowerCase()
                .includes("/login/")
        ) {
            return;
        }

        sessionStorage.setItem(
            RIGID_GOOGLE_DRIVE_CONFIG.RETURN_PAGE_KEY,
            window.location.href
        );

    }
    catch (error) {

        console.warn(
            "RiGiD Google Drive: unable to save return page:",
            error
        );

    }
}


/* =========================================================
   GET RETURN PAGE
========================================================= */

function getRiGiDReturnPage() {

    try {

        return sessionStorage.getItem(
            RIGID_GOOGLE_DRIVE_CONFIG.RETURN_PAGE_KEY
        );

    }
    catch {

        return null;
    }
}


/* =========================================================
   CLEAR RETURN PAGE
========================================================= */

function clearRiGiDReturnPage() {

    try {

        sessionStorage.removeItem(
            RIGID_GOOGLE_DRIVE_CONFIG.RETURN_PAGE_KEY
        );

    }
    catch {

        /* Ignore */
    }
}


/* =========================================================
   REDIRECT LOCK
========================================================= */

function hasRiGiDRedirectLock() {

    try {

        const value =
            sessionStorage.getItem(
                RIGID_GOOGLE_DRIVE_CONFIG.REDIRECT_LOCK_KEY
            );

        if (!value) {
            return false;
        }

        const timestamp =
            Number(value);

        if (
            !Number.isFinite(timestamp)
        ) {

            sessionStorage.removeItem(
                RIGID_GOOGLE_DRIVE_CONFIG.REDIRECT_LOCK_KEY
            );

            return false;
        }

        if (
            Date.now() - timestamp >
            RIGID_GOOGLE_DRIVE_CONFIG.REDIRECT_LOCK_DURATION
        ) {

            sessionStorage.removeItem(
                RIGID_GOOGLE_DRIVE_CONFIG.REDIRECT_LOCK_KEY
            );

            return false;
        }

        return true;

    }
    catch {

        return false;
    }
}


/* =========================================================
   SET REDIRECT LOCK
========================================================= */

function setRiGiDRedirectLock() {

    try {

        sessionStorage.setItem(
            RIGID_GOOGLE_DRIVE_CONFIG.REDIRECT_LOCK_KEY,
            String(Date.now())
        );

    }
    catch {

        /* Ignore */
    }
}


/* =========================================================
   CLEAR REDIRECT LOCK
========================================================= */

function clearRiGiDRedirectLock() {

    try {

        sessionStorage.removeItem(
            RIGID_GOOGLE_DRIVE_CONFIG.REDIRECT_LOCK_KEY
        );

    }
    catch {

        /* Ignore */
    }
}


/* =========================================================
   START AUTOMATIC RECONNECT
========================================================= */

async function startRiGiDGoogleDriveReconnect() {

    if (
        rigidGoogleDriveReconnectRunning
    ) {
        return;
    }

    if (
        hasRiGiDRedirectLock()
    ) {
        return;
    }

    rigidGoogleDriveReconnectRunning =
        true;

    try {

        const session =
            await getRiGiDSession();

        if (
            !session ||
            !session.access_token
        ) {

            console.warn(
                "RiGiD Google Drive: no authenticated session."
            );

            rigidGoogleDriveReconnectRunning =
                false;

            return;
        }


        /*
         * Remember exactly where the user currently is.
         */

        saveRiGiDReturnPage();


        /*
         * Prevent duplicate OAuth redirects.
         */

        setRiGiDRedirectLock();

        const response =
            await fetch(

                `${RIGID_GOOGLE_DRIVE_CONFIG.FUNCTIONS_URL}/${RIGID_GOOGLE_DRIVE_CONFIG.CONNECT_GOOGLE_DRIVE}`,

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
                "RiGiD Google Drive: reconnect request failed.",
                {
                    status:
                        response.status,

                    result
                }
            );


            clearRiGiDRedirectLock();

            rigidGoogleDriveReconnectRunning =
                false;

            return;
        }

        /*
         * Send the browser to Google's OAuth page.
         */

        window.location.assign(
            result.authorization_url
        );

    }
    catch (error) {

        console.error(
            "RiGiD Google Drive: reconnect error:",
            error
        );


        clearRiGiDRedirectLock();

        rigidGoogleDriveReconnectRunning =
            false;
    }
}


/* =========================================================
   PROCESS WORK-DATA RESPONSE
========================================================= */

async function processRiGiDWorkDataResponse(
    response
) {

    /*
     * Only 401 responses can request reconnect.
     */

    if (
        response.status !== 401
    ) {
        return;
    }


    let result = null;

    try {

        /*
         * Clone is important.
         *
         * It lets study.js / paper.js / project.js continue
         * reading the original response body.
         */

        result =
            await response.clone().json();

    }
    catch {

        return;
    }


    /*
     * This is the exact error code returned by
     * get-rigid-work-data.
     */

    if (
        result?.code !==
        "GOOGLE_RECONNECT_REQUIRED"
    ) {

        return;
    }


    console.warn(
        "RiGiD Google Drive: authorization renewal required."
    );


    await startRiGiDGoogleDriveReconnect();
}


/* =========================================================
   FETCH INTERCEPTOR
========================================================= */

function installRiGiDFetchInterceptor() {

    /*
     * Prevent duplicate installation.
     */

    if (
        window.__RiGiDGoogleDriveFetchInstalled
    ) {
        return;
    }


    window.__RiGiDGoogleDriveFetchInstalled =
        true;


    const originalFetch =
        window.fetch.bind(window);


    window.fetch =
        async function(
            input,
            init
        ) {

            /*
             * IMPORTANT:
             * Wait for the actual response.
             */

            const response =
                await originalFetch(
                    input,
                    init
                );


            /*
             * Ignore every request except
             * get-rigid-work-data.
             */

            if (
                !isRiGiDWorkDataRequest(input)
            ) {

                return response;
            }


            /*
             * Handle the reconnect condition.
             *
             * We await this here so the reconnect process
             * starts immediately when the 401 is received.
             */

            if (
                response.status === 401
            ) {

                await processRiGiDWorkDataResponse(
                    response
                );

            }


            /*
             * Return the ORIGINAL response.
             *
             * Existing workspace code remains unchanged.
             */

            return response;
        };

}


/* =========================================================
   HANDLE SUCCESSFUL GOOGLE CALLBACK
========================================================= */

function handleRiGiDGoogleCallback() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const googleDriveStatus =
        params.get(
            "google_drive"
        );


    if (
        googleDriveStatus !== "connected"
    ) {

        return;
    }



    /*
     * OAuth completed successfully.
     */

    clearRiGiDRedirectLock();


    const returnPage =
        getRiGiDReturnPage();


    /*
     * Remove ?google_drive=connected from login URL.
     */

    try {

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

    }
    catch {

        /* Ignore */
    }


    if (
        !returnPage
    ) {


        return;
    }


    /*
     * Clear it before redirecting.
     */

    clearRiGiDReturnPage();


    /*
     * Give the backend a moment to finish the connection
     * database write before reopening the workspace.
     */

    setTimeout(
        () => {

            window.location.assign(
                returnPage
            );

        },
        1000
    );
}


/* =========================================================
   INITIALIZE
========================================================= */

function initializeRiGiDGoogleDriveReconnect() {

    /*
     * First check whether we're returning from Google.
     */

    handleRiGiDGoogleCallback();


    /*
     * Then install automatic reconnect interception.
     */

    installRiGiDFetchInterceptor();
}


/* =========================================================
   START
========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeRiGiDGoogleDriveReconnect,
        {
            once:
                true
        }
    );

}
else {

    initializeRiGiDGoogleDriveReconnect();
}


/* =========================================================
   PUBLIC API
========================================================= */

window.RiGiDGoogleDriveReconnect = {

    reconnect:
        startRiGiDGoogleDriveReconnect,

    saveReturnPage:
        saveRiGiDReturnPage,

    getReturnPage:
        getRiGiDReturnPage,

    clearReturnPage:
        clearRiGiDReturnPage

};