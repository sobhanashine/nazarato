---
name: Mobile Touch Target Accessibility Constraint
description: All interactive links, buttons, and icons must be at least 44x44px.
metadata:
  type: project
---
# Mobile Touch Target Accessibility Constraint

**Why:**
Playwright audits and automated mobile accessibility checks fail if touch targets (buttons, links, interactive icons) are smaller than 44x44px, leading to poor mobile user experience.

**How to apply:**
Ensure that all interactive elements, particularly footer links, header navigation items, and small icons, have a minimum height and width of 44px (`w-11 h-11` or `min-h-11` or padded appropriately).
