/** Keep secrets out of URLs and bound upstream latency, including streaming. */
export async function requestGemini(apiKey: string, payload: unknown): Promise<Response> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  if (!/^gemini-[a-z0-9.-]+$/.test(model)) throw new Error("Invalid Gemini model");
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(35_000),
    redirect: "error",
  });
}
