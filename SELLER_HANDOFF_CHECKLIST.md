# Seller Handoff Checklist

This file is the operational workflow for turning the codebase into a deliverable restaurant website instance.

Use it together with:

- [README.md](./README.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [PRODUCTIZATION_ROADMAP.md](./PRODUCTIZATION_ROADMAP.md)
- [MEDIA_IMPORT_BASIS.md](./MEDIA_IMPORT_BASIS.md)

## 1. Confirm The Sale Scope

Before touching setup, confirm what was sold:

- this : basic restaurant website
- restaurant website + QR menu
- restaurant website + support/update package

Also confirm what is not included yet:

- internal AI onboarding
- automated PDF/image import
- custom code-level template changes beyond the agreed package

## 2. Gather Client Inputs

Collect:

- restaurant name
- short brand name if different
- logo
- hero/cover image if available
- phone
- WhatsApp
- address
- map URL
- social links
- opening hours
- payment methods such as Cash and TPE
- facilities such as parking, terrace, WiFi, accessibility, family area
- menu source: PDF, photos, spreadsheet, or text
- restaurant photos
- preferred tone or style
- preferred languages and copy expectations

## 3. Create Or Clone The Instance

Recommended current workflow:

1. Start from the current white-label base.
2. Export a clean JSON backup from the source instance if cloning from an existing one.
3. Import into the target instance when needed.
4. Apply the closest `Quick Launch Preset`.
5. Replace all brand identity data immediately.

Replace:

- restaurant name
- short name
- logo
- hero image
- theme colors
- contact details
- hours

## 4. Configure The Website Properly

From admin, review and fill:

- branding
- landing/homepage copy
- about content
- events/services content
- footer note and rights text
- section visibility
- section order
- payment/facilities
- gallery

Do not leave demo-looking placeholders if client assets already exist.

## 5. Build The Menu Carefully

Before publishing the menu:

- normalize categories
- use super-categories only when they improve navigation
- confirm prices
- confirm promo flags
- confirm featured flags
- confirm images

If item images are missing:

- use admin `Data Tools` -> `Menu Image Suggestions` to assign managed local placeholders quickly
- treat those placeholders as an internal delivery aid, not a final substitute for strong client-specific visuals

For each item, review:

- default name
- default description
- FR name and description
- EN name and description
- AR name and description

If translations are not client-approved yet, use the best available reviewed version and note the remaining content review work.

## 6. Media Quality Review

Priority order:

1. real restaurant photos
2. curated placeholders
3. AI-generated visuals only where necessary

Check:

- hero looks professional
- logo is crisp
- gallery has no broken items
- dish images feel consistent
- missing images degrade gracefully
- if using temporary static media, keep it aligned with the current preset/theme and log what still needs client-specific replacement

## 7. Security And Admin Review

Before handoff:

- open the admin security section
- change default credentials
- verify the default-credentials warning is gone
- confirm login still works after the change
- confirm the deployment uses `AUTH_FILE=/app/data/auth.json` so future password changes persist across redeploys
- export a fresh final backup

Never deliver with fallback credentials still active.

## 8. Pre-Launch Validation

Run locally or against the deployment as appropriate:

```bash
npm run check
npm run smoke
```

Manual review list:

- admin `Data Tools` launch-readiness audit
- admin `Data Tools` handoff summary generation
- admin `Data Tools` handoff summary download
- admin `Data Tools` menu image suggestions when dish media is incomplete
- homepage
- menu landing
- category navigation
- one item detail view
- cart/order flow
- gallery
- history/ticket flow
- contact actions
- admin branding save
- admin menu save
- admin backup export

## 9. Delivery Package

Deliver:

- website URL
- admin URL
- admin username
- admin password
- final backup export

Operational note:

- if the client changes credentials later from the Security tab, the saved auth file becomes the active login source and overrides the original Coolify `ADMIN_USER` / `ADMIN_PASS` values

Explain what the client can safely edit:

- logo
- hero image
- hours
- phone
- address
- menu items
- gallery
- homepage copy

Explain what should stay under your control:

- deployment
- domain and DNS
- backups strategy
- code-level template changes
- future AI-assisted import/onboarding tooling

## 10. Internal Notes After Delivery

Record:

- client package sold
- preset used
- missing assets
- manual fixes made
- translation quality concerns
- future upsell opportunities
- whether this client is a good future importer/launcher test case

## Current Practical Recommendation

At this stage of the product:

- use the admin for normal client edits
- use export/import for cloning and recovery
- keep AI workflows private and internal
- keep importer job artifacts private and local under the seller workflow
- keep one deployable instance per restaurant

That is the safest and fastest way to sell the first wave of websites while the internal launcher and importer are still being designed.
