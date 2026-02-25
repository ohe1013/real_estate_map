import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const edgeSharedToken = Deno.env.get("EDGE_SHARED_TOKEN");
const kakaoKey = Deno.env.get("KAKAO_REST_API_KEY");

function getCorsHeaders(origin: string | null) {
  const safeOrigin = origin && allowedOrigins.includes(origin) ? origin : "";

  return {
    "Access-Control-Allow-Origin": safeOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-edge-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function isOriginAllowed(origin: string | null) {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

function extractRequestToken(req: Request) {
  const direct = req.headers.get("x-edge-token");
  if (direct) return direct.trim();

  const authorization = req.headers.get("authorization");
  if (!authorization) return "";

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return "";
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (!isOriginAllowed(origin)) {
    return new Response(JSON.stringify({ error: "origin_not_allowed" }), {
      status: 403,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  if (!kakaoKey) {
    return new Response(
      JSON.stringify({ error: "KAKAO_REST_API_KEY is not configured" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (edgeSharedToken) {
    const requestToken = extractRequestToken(req);
    if (!requestToken || requestToken !== edgeSharedToken) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
  }

  try {
    const { query } = await req.json();
    const normalizedQuery = String(query || "").trim();

    if (!normalizedQuery) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const kakaoResponse = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
        normalizedQuery
      )}`,
      {
        headers: {
          Authorization: `KakaoAK ${kakaoKey}`,
        },
      }
    );

    if (!kakaoResponse.ok) {
      const errText = await kakaoResponse.text();
      return new Response(
        JSON.stringify({
          error: `Kakao API Error: ${kakaoResponse.status} ${errText}`,
        }),
        {
          status: kakaoResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await kakaoResponse.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "unknown_error" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
