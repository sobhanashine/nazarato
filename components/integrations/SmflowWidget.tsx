import Script from "next/script";
import { getSession } from "@/lib/auth/session";
import {
  buildSmflowIdentity,
  getSmflowConfig,
} from "@/lib/integrations/smflow";
import { SmflowMobileToggle } from "./SmflowMobileToggle";

/**
 * SMFlow chat widget loader. Server component — reads the session and the
 * server-only secret, computes the identify HMAC, and emits two <Script>
 * tags before the widget loader so the in-page `window.smflowSettings` is
 * defined when widget.js boots.
 *
 * Renders nothing when the widget is disabled (default) or env is missing,
 * so this is a safe no-op in local dev and preview deploys.
 */
export async function SmflowWidget() {
  const config = getSmflowConfig();
  if (!config) return null;

  const user = await getSession();
  const identity = user ? buildSmflowIdentity(user, config.secret) : null;

  return (
    <>
      {identity && (
        <Script
          id="smflow-identify"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.smflowSettings = ${escapeForInlineScript(
              identity,
            )};`,
          }}
        />
      )}
      <Script
        id="smflow-widget"
        src="https://staging.smflow.io/widget.js"
        data-business-id={config.businessId}
        strategy="afterInteractive"
      />
      <SmflowMobileToggle />
    </>
  );
}

/**
 * U+2028 (LINE SEPARATOR) and U+2029 (PARAGRAPH SEPARATOR) are valid JSON
 * but illegal in JavaScript string literals — they're treated as line
 * terminators by the JS parser. JSON.stringify happily emits them raw, so
 * we have to escape them before inlining into a <script>. Built with
 * `new RegExp` because the same characters break this file's own parsing
 * if written as a regex literal.
 */
const LINE_PARA_SEP = new RegExp("[\\u2028\\u2029]", "g");

/**
 * Serialize `value` for safe embedding inside an inline `<script>` tag.
 *
 * JSON.stringify alone is **not** safe here: a string field containing
 * `</script>` would close our script tag early and let an attacker inject
 * arbitrary markup. We escape `<` and `>` to their `\u00XX` forms (still
 * valid JSON, harmless to the receiving JSON.parse if any), and finally
 * convert any U+2028 / U+2029 to JS-legal escapes.
 */
function escapeForInlineScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(
      LINE_PARA_SEP,
      (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
    );
}
