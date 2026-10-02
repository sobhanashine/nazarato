/** Voice input was retired; old clients must not record or forward audio. */
export function POST() {
  return new Response(null, { status: 410 });
}
