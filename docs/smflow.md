To add the SMFlow AI Assistant to your website, copy the code below and paste it before the closing body tag of your website HTML.

HTML Snippet
Copy snippet
<script src="https://staging.smflow.io/widget.js" data-business-id="d8d67a59-c4c9-4b36-b739-13e8f07d3097" defer></script>
How it works
It creates an isolated floating widget on your site.
Your website's CSS won't conflict with or break the chat design (Industry standard Iframe setup).
Works automatically with your current AI knowledge base!
Identify your visitors

Skip the email gate for logged-in users on your site. Render this snippet on every page so the widget knows who's chatting.

Identify snippet (HTML)
Copy snippet
<!-- Identify the visitor (server-side rendered, hash computed with your widget secret) -->
<script>
  window.smflowSettings = {
    email: 'CURRENT_USER_EMAIL',
    name:  'CURRENT_USER_NAME',
    // hash = HMAC-SHA256(email, widget_secret), lowercase hex.
    // Compute SERVER-SIDE — never expose the secret to the browser.
    hash:  'COMPUTED_ON_YOUR_SERVER',
  }
</script>
<script src="https://staging.smflow.io/widget.js" data-business-id="d8d67a59-c4c9-4b36-b739-13e8f07d3097" defer></script>
Your widget secret
Keep this on your server only. Use it to compute the HMAC-SHA256 of the visitor's email. Never expose it in client-side code.

Show
2e9d4f…e0d5
Copy snippet
How to use the identify snippet
Replace the placeholders with the currently logged-in user's email and name (rendered by your backend).
Compute the hash on your server: HMAC-SHA256(email, widget_secret), lowercase hex. Omit the hash to send the visitor as unverified.
Place this snippet ABOVE the smflow widget loader on every page where you want identification.
