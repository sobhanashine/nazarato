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
 * Renders nothing if env vars are missing (e.g. local dev without secrets).
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
            __html: `window.smflowSettings = ${JSON.stringify(identity)};`,
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
