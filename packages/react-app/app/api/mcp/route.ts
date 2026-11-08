// app/api/mcp/route.ts
//
// MCP server (Streamable HTTP transport, stateless JSON responses) for the
// Earnbase Human Feedback Agent.
//
// Why this exists: 8004scan's "Try agent" (and any MCP client) connects with
// POST + JSON-RPC. A static /.well-known/mcp.json only answers GET, which is
// why the server returned HTTP 405. This route answers both:
//   GET  -> the discovery manifest (so the well-known URL keeps working)
//   POST -> JSON-RPC 2.0: initialize, ping, tools/*, prompts/*, resources/*
//
// IMPORTANT: adjust the three UPSTREAM paths below to match your real REST
// endpoints. Payment (x402) is enforced by those endpoints; this route only
// forwards the X-PAYMENT header and relays the result.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ORIGIN = process.env.EARNBASE_ORIGIN ?? "https://earnbase.vercel.app";
const API_BASE = process.env.EARNBASE_API_BASE ?? `${ORIGIN}/api`;

// >>> CHANGE THESE to your actual internal REST routes <<<
const UPSTREAM = {
  submit: () => `${API_BASE}/feedback/request`, // POST
  status: (id: string) => `${API_BASE}/feedback/${encodeURIComponent(id)}/status`, // GET
  results: (id: string) => `${API_BASE}/feedback/${encodeURIComponent(id)}/results`, // GET
};

const SERVER_INFO = {
  name: "earnbase-human-feedback-agent",
  title: "Earnbase Human Feedback Agent",
  version: "1.0.0",
};

const SUPPORTED_PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const LATEST_PROTOCOL = SUPPORTED_PROTOCOLS[0];

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, X-PAYMENT, Mcp-Session-Id, MCP-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, X-PAYMENT-RESPONSE",
  "Access-Control-Max-Age": "86400",
};

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const SUBTASK_TYPES = [
  "MULTIPLE_CHOICE",
  "TEXT_INPUT",
  "FILE_UPLOAD",
  "CHOICE_SELECTION",
  "RATING",
] as const;

const TOOLS = [
  {
    name: "submit_feedback_request",
    title: "Submit human feedback request",
    description:
      "Submit a new human feedback task. Payment is settled on-chain via x402 (USDC on Celo) before the task is created; send the payment in the X-PAYMENT header. Total cost = (participants × rewardPerParticipant) + 1% platform fee. Returns taskId and requestId for polling.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", maxLength: 100, description: "Short title for the task (max 100 chars)" },
        description: { type: "string", description: "An explanation of the title of the task" },
        constraints: {
          type: "object",
          properties: {
            participants: { type: "number", minimum: 1, description: "Number of human contributors needed" },
            rewardPerParticipant: {
              type: "string",
              description: "USDC reward per contributor (minimum '0.01'), e.g. '0.50'",
            },
            countryRestriction: { type: "boolean" },
            countries: {
              type: "array",
              items: { type: "string" },
              description: "ISO 3-letter country codes, e.g. ['KEN','USA']",
            },
            ageRestriction: { type: "boolean" },
            minAge: { type: "number" },
            maxAge: { type: "number" },
            genderRestriction: { type: "boolean" },
            gender: { type: "string", enum: ["M", "F"] },
          },
          required: ["participants", "rewardPerParticipant"],
        },
        subtasks: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              prompt: { type: "string", description: "Question or instruction shown to contributors" },
              type: { type: "string", enum: [...SUBTASK_TYPES] },
              required: { type: "boolean" },
              order: { type: "number" },
              options: { type: "array", items: { type: "string" } },
              fileTypes: { type: "array", items: { type: "string" } },
            },
            required: ["prompt", "type"],
          },
        },
        requestId: {
          type: "string",
          description: "Optional idempotency key, use to safely retry without creating duplicate tasks",
        },
      },
      required: ["title", "description", "constraints", "subtasks"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "get_feedback_status",
    title: "Get feedback request status",
    description:
      "Poll the status of a submitted feedback request. Returns status (pending, active, completed, cancelled) and participant progress.",
    inputSchema: {
      type: "object",
      properties: {
        requestId: { type: "string", description: "The taskId or requestId returned by submit_feedback_request" },
      },
      required: ["requestId"],
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  {
    name: "get_feedback_results",
    title: "Get feedback results",
    description:
      "Retrieve completed human feedback results. Only returns data when status is completed. Includes structured responses and aggregated results.",
    inputSchema: {
      type: "object",
      properties: {
        requestId: { type: "string", description: "The taskId or requestId to retrieve results for" },
      },
      required: ["requestId"],
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
];

const PROMPTS = [
  { name: "human_feedback", description: "When human intelligence is needed, get it from human contributors via Earnbase" },
  { name: "content_moderation", description: "Submit content for human safety and quality review" },
  { name: "rlhf_collection", description: "Collect human preference data for reinforcement learning from human feedback" },
  { name: "data_labeling", description: "Send data items to human contributors for annotation and classification" },
];

const PROMPT_TEXT: Record<string, string> = {
  human_feedback:
    "I need human judgment on a question. Use submit_feedback_request to create a task with clear subtasks, then poll get_feedback_status and fetch get_feedback_results when completed.",
  content_moderation:
    "Review the following content for safety. Create a CHOICE_SELECTION subtask with options like 'Safe', 'Unsafe - violence', 'Unsafe - hate speech', 'Unsafe - other' and submit it with at least 3 participants.",
  rlhf_collection:
    "Collect preference data between two AI responses. Create a MULTIPLE_CHOICE subtask with options 'Response A', 'Response B', 'Both equally good', 'Neither is good' and submit it with at least 5 participants.",
  data_labeling:
    "Label the following data items. Create one subtask per item (or one multi-option subtask) of type CHOICE_SELECTION or TEXT_INPUT and submit it.",
};

const RESOURCES = [
  {
    uri: `${ORIGIN}/schemas/feedbackRequest.schema.json`,
    name: "Feedback Request Schema",
    mimeType: "application/json",
  },
  {
    uri: `${ORIGIN}/schemas/feedbackResult.schema.json`,
    name: "Feedback Result Schema",
    mimeType: "application/json",
  },
];

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type JsonRpcId = string | number | null;
interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, any>;
}

const ok = (id: JsonRpcId, result: unknown) => ({ jsonrpc: "2.0" as const, id, result });
const err = (id: JsonRpcId, code: number, message: string, data?: unknown) => ({
  jsonrpc: "2.0" as const,
  id,
  error: { code, message, ...(data !== undefined ? { data } : {}) },
});

const toolText = (text: string, structured?: unknown, isError = false) => ({
  content: [{ type: "text", text }],
  ...(structured !== undefined ? { structuredContent: structured } : {}),
  isError,
});

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...CORS, ...extra } });
}

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

function validateSubmit(a: any): string | null {
  if (!a || typeof a !== "object") return "Arguments must be an object.";
  if (typeof a.title !== "string" || !a.title.trim()) return "title is required.";
  if (a.title.length > 100) return "title must be 100 characters or fewer.";
  if (typeof a.description !== "string" || !a.description.trim()) return "description is required.";
  const c = a.constraints;
  if (!c || typeof c !== "object") return "constraints is required.";
  if (!Number.isFinite(c.participants) || c.participants < 1) return "constraints.participants must be a number >= 1.";
  const reward = Number(c.rewardPerParticipant);
  if (typeof c.rewardPerParticipant !== "string" || !Number.isFinite(reward) || reward < 0.01)
    return "constraints.rewardPerParticipant must be a string of at least '0.01'.";
  if (!Array.isArray(a.subtasks) || a.subtasks.length === 0) return "subtasks must be a non-empty array.";
  for (const [i, s] of a.subtasks.entries()) {
    if (!s || typeof s.prompt !== "string" || !s.prompt.trim()) return `subtasks[${i}].prompt is required.`;
    if (!SUBTASK_TYPES.includes(s.type)) return `subtasks[${i}].type must be one of ${SUBTASK_TYPES.join(", ")}.`;
    if ((s.type === "MULTIPLE_CHOICE" || s.type === "CHOICE_SELECTION") && (!Array.isArray(s.options) || s.options.length < 2))
      return `subtasks[${i}].options needs at least 2 entries for ${s.type}.`;
  }
  if (c.countryRestriction && (!Array.isArray(c.countries) || c.countries.length === 0))
    return "constraints.countries is required when countryRestriction is true.";
  return null;
}

async function relay(url: string, init: RequestInit) {
  const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(25_000) });
  const raw = await res.text();
  let data: any = raw;
  try {
    data = JSON.parse(raw);
  } catch {
    /* non-JSON body */
  }
  return { res, data };
}

async function callTool(name: string, args: any, req: NextRequest) {
  try {
    if (name === "submit_feedback_request") {
      const bad = validateSubmit(args);
      if (bad) return toolText(`Invalid arguments: ${bad}`, { error: bad }, true);

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const payment = req.headers.get("x-payment");
      if (payment) headers["X-PAYMENT"] = payment;

      const { res, data } = await relay(UPSTREAM.submit(), {
        method: "POST",
        headers,
        body: JSON.stringify(args),
      });

      if (res.status === 402) {
        return toolText(
          "Payment required (x402). Resend this request with a valid X-PAYMENT header: USDC on Celo (chainId 42220), token 0xcebA9300f2b948710d2653dD7B07f33A8B32118C. Total = (participants × rewardPerParticipant) + 1% platform fee.",
          { status: 402, paymentRequirements: data },
          true,
        );
      }
      if (!res.ok) return toolText(`Request failed (HTTP ${res.status}).`, { status: res.status, body: data }, true);
      return toolText(JSON.stringify(data, null, 2), typeof data === "object" ? data : { result: data });
    }

    if (name === "get_feedback_status" || name === "get_feedback_results") {
      const id = args?.requestId;
      if (typeof id !== "string" || !id.trim()) return toolText("requestId is required.", { error: "requestId is required." }, true);
      const url = name === "get_feedback_status" ? UPSTREAM.status(id) : UPSTREAM.results(id);
      const { res, data } = await relay(url, { method: "GET", headers: { Accept: "application/json" } });
      if (res.status === 404) return toolText(`No request found for id "${id}".`, { status: 404 }, true);
      if (!res.ok) return toolText(`Request failed (HTTP ${res.status}).`, { status: res.status, body: data }, true);
      return toolText(JSON.stringify(data, null, 2), typeof data === "object" ? data : { result: data });
    }

    return null; // unknown tool
  } catch (e: any) {
    return toolText(`Upstream error: ${e?.message ?? "unknown error"}`, undefined, true);
  }
}

// ---------------------------------------------------------------------------
// JSON-RPC dispatch
// ---------------------------------------------------------------------------

async function handle(msg: JsonRpcRequest, req: NextRequest) {
  const id = msg.id ?? null;
  const p = msg.params ?? {};

  switch (msg.method) {
    case "initialize": {
      const requested = typeof p.protocolVersion === "string" ? p.protocolVersion : LATEST_PROTOCOL;
      return ok(id, {
        protocolVersion: SUPPORTED_PROTOCOLS.includes(requested) ? requested : LATEST_PROTOCOL,
        capabilities: {
          tools: { listChanged: false },
          prompts: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
        },
        serverInfo: SERVER_INFO,
        instructions:
          "Human Feedback as a Service. Call submit_feedback_request (requires an x402 X-PAYMENT header, USDC on Celo), then poll get_feedback_status and call get_feedback_results once status is 'completed'. Results typically arrive within hours.",
      });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      if (typeof p.name !== "string") return err(id, -32602, "Missing tool name");
      const result = await callTool(p.name, p.arguments ?? {}, req);
      if (result === null) return err(id, -32602, `Unknown tool: ${p.name}`);
      return ok(id, result);
    }
    case "prompts/list":
      return ok(id, { prompts: PROMPTS });
    case "prompts/get": {
      const text = PROMPT_TEXT[p.name];
      if (!text) return err(id, -32602, `Unknown prompt: ${p.name}`);
      return ok(id, {
        description: PROMPTS.find((x) => x.name === p.name)?.description,
        messages: [{ role: "user", content: { type: "text", text } }],
      });
    }
    case "resources/list":
      return ok(id, { resources: RESOURCES });
    case "resources/templates/list":
      return ok(id, { resourceTemplates: [] });
    case "resources/read": {
      const r = RESOURCES.find((x) => x.uri === p.uri);
      if (!r) return err(id, -32002, `Resource not found: ${p.uri}`);
      try {
        const res = await fetch(r.uri, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
        if (!res.ok) return err(id, -32603, `Failed to load resource (HTTP ${res.status})`);
        return ok(id, { contents: [{ uri: r.uri, mimeType: r.mimeType, text: await res.text() }] });
      } catch (e: any) {
        return err(id, -32603, `Failed to load resource: ${e?.message ?? "unknown"}`);
      }
    }
    case "logging/setLevel":
      return ok(id, {});
    default:
      return err(id, -32601, `Method not found: ${msg.method}`);
  }
}

// ---------------------------------------------------------------------------
// HTTP handlers
// ---------------------------------------------------------------------------

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// GET: discovery manifest. Clients asking only for an SSE stream get 405 per
// the MCP spec (this server does not push server-initiated messages).
export async function GET(req: NextRequest) {
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/event-stream") && !accept.includes("application/json")) {
    return new NextResponse(null, { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } });
  }
  return json({
    name: "Earnbase Human Feedback Agent",
    version: "2026-02-19",
    description:
      "Human Feedback as a Service (HFaaS) for AI agents. Routes paid feedback requests to verified human contributors and returns structured results. Supports RLHF, content moderation, data labeling, and market research. Payment via gasless USDC on Celo (x402). Results typically within hours.",
    transport: { type: "streamable-http", endpoint: `${ORIGIN}/api/mcp` },
    protocolVersions: SUPPORTED_PROTOCOLS,
    auth: {
      type: "x402",
      description:
        "Payment via X-PAYMENT header using x402 protocol. USDC on Celo (chainId: 42220). Payment is settled on-chain before the task is created. No API key or account required.",
      header: "X-PAYMENT",
      currency: "USDC",
      chain: "celo",
      chainId: 42220,
      tokenAddress: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    },
    tools: TOOLS,
    prompts: PROMPTS,
    resources: RESOURCES.map((r) => ({ uri: r.uri, name: r.name })),
    integration: {
      note: "No API key or account required. Payment is automatic via x402 USDC on Celo. Total cost = (participants × rewardPerParticipant) + 1% platform fee.",
    },
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(err(null, -32700, "Parse error"), 400);
  }

  const isRequest = (m: any): m is JsonRpcRequest =>
    m && m.jsonrpc === "2.0" && typeof m.method === "string";

  // Batch
  if (Array.isArray(body)) {
    if (body.length === 0) return json(err(null, -32600, "Invalid Request"), 400);
    const out: unknown[] = [];
    for (const m of body) {
      if (!isRequest(m)) {
        out.push(err(null, -32600, "Invalid Request"));
        continue;
      }
      if (m.id === undefined) continue; // notification
      out.push(await handle(m, req));
    }
    return out.length ? json(out) : new NextResponse(null, { status: 202, headers: CORS });
  }

  if (!isRequest(body)) return json(err(null, -32600, "Invalid Request"), 400);

  // Notifications (e.g. notifications/initialized) get 202 with no body
  if (body.id === undefined) return new NextResponse(null, { status: 202, headers: CORS });

  return json(await handle(body, req));
}