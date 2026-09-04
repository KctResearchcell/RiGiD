import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";


const corsHeaders = {

  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS"

};


const DRIVE_API =
  "https://www.googleapis.com/drive/v3/files";

const GOOGLE_UPLOAD_API =
  "https://www.googleapis.com/upload/drive/v3/files";


const GOOGLE_TOKEN_API =
  "https://oauth2.googleapis.com/token";


function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {

  return new Response(

    JSON.stringify(body),

    {

      status,

      headers: {

        ...corsHeaders,

        "Content-Type":
          "application/json"

      }

    }

  );

}


/* =========================================================
   REFRESH GOOGLE ACCESS TOKEN
========================================================= */

async function refreshGoogleAccessToken(
  refreshToken: string
) {

  const clientId =
    Deno.env.get(
      "GOOGLE_CLIENT_ID"
    );


  const clientSecret =
    Deno.env.get(
      "GOOGLE_CLIENT_SECRET"
    );


  if (
    !clientId ||
    !clientSecret
  ) {

    throw new Error(
      "Google OAuth credentials are missing."
    );

  }


  const response =
    await fetch(

      GOOGLE_TOKEN_API,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/x-www-form-urlencoded"

        },

        body:

          new URLSearchParams({

            client_id:
              clientId,

            client_secret:
              clientSecret,

            refresh_token:
              refreshToken,

            grant_type:
              "refresh_token"

          })

        }

    );


  const data =
    await response.json();


  if (
    !response.ok ||
    !data.access_token
  ) {

    throw new Error(

      data?.error_description ||

      data?.error ||

      "Unable to refresh Google access token"

    );

  }


  return {

    accessToken:
      data.access_token as string,

    expiresIn:
      Number(
        data.expires_in || 3600
      )

  };

}


/* =========================================================
   GOOGLE DRIVE REQUEST
========================================================= */

async function googleDriveRequest(
  url: string,
  accessToken: string,
  options: RequestInit = {}
) {

  return await fetch(

    url,

    {

      ...options,

      headers: {

        Authorization:
          `Bearer ${accessToken}`,

        ...(options.headers || {})

      }

    }

  );

}


/* =========================================================
   FIND rigid-data.json
========================================================= */

async function findRigidDataFile(
  accessToken: string,
  folderId: string
) {

  const query =

    `name = 'rigid-data.json'` +

    ` and '${folderId}' in parents` +

    ` and trashed = false`;


  const url =

    `${DRIVE_API}` +

    `?q=${encodeURIComponent(query)}` +

    `&fields=files(id,name)`;


  const response =
    await googleDriveRequest(
      url,
      accessToken
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(

      data?.error?.message ||

      "Unable to search Google Drive"

    );

  }


  return (
    data.files?.[0] ||
    null
  );

}


/* =========================================================
   MAIN FUNCTION
========================================================= */

Deno.serve(
  async (req: Request) => {


    if (req.method === "OPTIONS") {

      return new Response(
        "ok",
        {
          headers:
            corsHeaders
        }
      );

    }


    if (req.method !== "POST") {

      return jsonResponse(
        {
          success: false,
          error:
            "Only POST requests are supported."
        },
        405
      );

    }


    try {


      /* ===================================================
         AUTHENTICATION
      =================================================== */

      const authHeader =
        req.headers.get(
          "Authorization"
        );


      if (
        !authHeader ||
        !authHeader.startsWith(
          "Bearer ")
      ) {

        return jsonResponse(
          {
            success: false,
            error:
              "Missing authentication."
          },
          401
        );

      }


      const supabase =
        createClient(

          Deno.env.get(
            "SUPABASE_URL"
          ) ?? "",

          Deno.env.get(
            "SUPABASE_ANON_KEY"
          ) ?? "",

          {

            global: {

              headers: {

                Authorization:
                  authHeader

              }

            }

          }

        );


      const {
        data: {
          user
        },
        error:
          userError
      } =

        await supabase
          .auth
          .getUser();


      if (
        userError ||
        !user
      ) {

        return jsonResponse(
          {
            success: false,
            error:
              "Invalid authentication."
          },
          401
        );

      }


      /* ===================================================
         ADMIN CLIENT
      =================================================== */

      const serviceRoleKey =
        Deno.env.get(
          "SERVICE_ROLE_KEY"
        );


      if (!serviceRoleKey) {

        throw new Error(
          "SERVICE_ROLE_KEY is missing."
        );

      }


      const supabaseAdmin =
        createClient(

          Deno.env.get(
            "SUPABASE_URL"
          ) ?? "",

          serviceRoleKey,

          {

            auth: {

              autoRefreshToken:
                false,

              persistSession:
                false

            }

          }

        );


      /* ===================================================
         REQUEST BODY
      =================================================== */

      const body =
        await req.json();


      const workId =
        String(
          body.work_id || ""
        ).trim();


      const updatedData =
        body.data;


      if (!workId) {

        return jsonResponse(
          {
            success: false,
            error:
              "Work ID is required."
          },
          400
        );

      }


      if (
        !updatedData ||
        typeof updatedData !== "object"
      ) {

        return jsonResponse(
          {
            success: false,
            error:
              "Updated data is required."
          },
          400
        );

      }


      /* ===================================================
         VERIFY WORK OWNERSHIP
      =================================================== */

      const {
        data: work,
        error: workError
      } =

        await supabaseAdmin

          .from(
            "personal_work"
          )

          .select(
            `
              id,
              profile_id,
              drive_folder_id
            `
          )

          .eq(
            "id",
            workId
          )

          .eq(
            "profile_id",
            user.id
          )

          .maybeSingle();


      if (
        workError ||
        !work
      ) {

        return jsonResponse(
          {
            success: false,
            error:
              "Work item was not found."
          },
          404
        );

      }


      if (!work.drive_folder_id) {

        return jsonResponse(
          {
            success: false,
            error:
              "Google Drive folder is not connected."
          },
          400
        );

      }


      /* ===================================================
         GET GOOGLE DRIVE CONNECTION
      =================================================== */

      const {
        data: driveConnection,
        error: driveError
      } =

        await supabaseAdmin

          .from(
            "google_drive_connections"
          )

          .select(
            `
              google_access_token,
              google_refresh_token,
              google_token_expires_at
            `
          )

          .eq(
            "user_id",
            user.id
          )

          .maybeSingle();


      if (
        driveError ||
        !driveConnection
      ) {

        throw new Error(
          "Google Drive connection not found."
        );

      }


      let accessToken =
        driveConnection.google_access_token;


      const refreshToken =
        driveConnection.google_refresh_token;


      const tokenExpiresAt =
        driveConnection.google_token_expires_at

          ? new Date(
              driveConnection.google_token_expires_at
            )

          : null;


      const shouldRefresh =

        !accessToken ||

        !tokenExpiresAt ||

        tokenExpiresAt.getTime() <=
          Date.now() +
          5 * 60 * 1000;


      if (shouldRefresh) {

        if (!refreshToken) {

          return jsonResponse(
            {
              success: false,
              error:
                "Google Drive authorization expired."
            },
            401
          );

        }


        const refreshed =
          await refreshGoogleAccessToken(
            refreshToken
          );


        accessToken =
          refreshed.accessToken;


        const newExpiry =
          new Date(

            Date.now() +
            refreshed.expiresIn * 1000

          );


        const {
          error: tokenUpdateError
        } =

          await supabaseAdmin

            .from(
              "google_drive_connections"
            )

            .update({

              google_access_token:
                accessToken,

              google_token_expires_at:
                newExpiry.toISOString(),

              updated_at:
                new Date().toISOString()

            })

            .eq(
              "user_id",
              user.id
            );


        if (tokenUpdateError) {

          throw tokenUpdateError;

        }

      }


      /* ===================================================
         FIND rigid-data.json
      =================================================== */

      const rigidDataFile =
        await findRigidDataFile(

          accessToken,

          work.drive_folder_id

        );


      if (!rigidDataFile) {

        return jsonResponse(
          {
            success: false,
            error:
              "rigid-data.json was not found."
          },
          404
        );

      }


      /* ===================================================
         UPDATE METADATA
      =================================================== */

      if (!updatedData.workspace) {

        updatedData.workspace =
          {};

      }


      updatedData.workspace.updatedAt =
        new Date().toISOString();


      /* ===================================================
         UPDATE FILE CONTENT
      =================================================== */

      const updateResponse =
    await googleDriveRequest(

        `${GOOGLE_UPLOAD_API}/${rigidDataFile.id}?uploadType=media`,

        accessToken,

        {

            method:
                "PATCH",

            headers: {

                "Content-Type":
                    "application/json"

            },

            body:
                JSON.stringify(
                    updatedData,
                    null,
                    2
                )

        }

    );


      const updateResult =
        await updateResponse.json();


      if (!updateResponse.ok) {

        throw new Error(

          updateResult?.error?.message ||

          "Unable to update rigid-data.json"

        );

      }


      /* ===================================================
         SUCCESS
      =================================================== */

      return jsonResponse({

        success:
          true,

        updated_at:
          updatedData.workspace.updatedAt

      });


    }

    catch (error) {

      console.error(
        "update-rigid-work-data error:",
        error
      );


      return jsonResponse(

        {

          success:
            false,

          error:

            error instanceof Error

              ? error.message

              : "Unknown error"

        },

        500

      );

    }

  }

);