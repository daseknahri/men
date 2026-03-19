# Seller Bundle Pipeline

This file defines the best practical seller-only workflow for turning a restaurant's raw assets into a reviewable website bundle.

## Goal

Input:

- menu PDF or menu images
- logo
- restaurant / venue photos
- optional seller notes

Output:

- a reviewable bundle that can be applied to the current website schema
- reusable approved media saved locally for future restaurant projects

## Core Decision

Do not use one giant prompt for everything.

Use a staged job pipeline.

Reason:

- each stage has a different failure mode
- each stage benefits from a different model or prompt style
- retries become cheaper
- validation becomes clearer
- seller review can happen before anything touches the live site

## What AI Can Realistically Do From Menu + Logo + Venue Photos

Strong first-pass results:

- menu item extraction
- price extraction
- category and super-category grouping
- FR / EN / AR translation drafts
- preset / color / tone suggestions from logo and venue visuals
- hero and generic gallery image generation
- first-pass homepage copy and short brand positioning

Weak or high-risk areas if fully automated:

- exact dish-image coverage for every item
- perfect ingredient accuracy from low-quality menu photos
- subtle cultural translation quality without review
- strong brand-story copy when seller notes are missing

So the right product is:

- AI builds the draft bundle
- seller reviews and corrects
- only then the bundle is applied

## Recommended Stage Flow

### Stage 1. Intake Job

Create a local seller job folder.

Recommended structure:

```text
seller-jobs/
  <job-id>/
    input/
    extraction/
    branding/
    media/
    review/
    final/
```

Save:

- uploaded menu files
- uploaded logo
- uploaded venue photos
- seller notes
- job metadata

This makes every run reproducible.

### Stage 2. Menu Extraction Draft

Goal:

- convert menu files into structured menu/category/super-category data

Output:

- raw structured extraction draft
- extraction warnings

Rules:

- use structured JSON output
- never write directly to live restaurant data
- always preserve uncertainty as warnings/blockers

### Stage 3. Normalization And Translation Completion

Goal:

- convert raw extraction into the exact live restaurant schema
- complete FR / EN / AR translation buckets

Output:

- normalized `restaurantData`
- translation confidence notes

Rules:

- fill missing translation buckets where confidence is reasonable
- do not invent contact data, hours, maps, or social links

### Stage 4. Brand And Website Pack

Goal:

- produce first-pass branding from logo, venue photos, cuisine hint, and seller notes

Output:

- preset suggestion
- color tokens
- short tagline
- homepage copy draft
- hero/gallery generation prompts

Rules:

- this is a website-quality pack, not only a menu extraction
- brand choices should stay editable after review

### Stage 5. Product Image Resolution

Goal:

- assign the best available image source to each item

Resolution order:

1. client-provided dish photo
2. approved local library match
3. curated stock / curated local seed
4. AI generation only for uncovered high-value items
5. managed placeholder only as last resort

Rules:

- do not auto-generate all missing items by default
- generate only for featured / promo / high-value uncovered items
- save generated outputs into the local seller library
- require seller approval before future auto-reuse

### Stage 6. Review Gate

Goal:

- stop bad bundles before apply

Review outputs:

- blockers
- warnings
- media coverage summary
- translation coverage summary
- missing-image summary
- diff against current live restaurant data

Rules:

- apply only after seller confirmation
- allow partial apply later if useful: menu only, branding only, media only

### Stage 7. Apply To Site

Goal:

- materialize the reviewed bundle into the live project

Rules:

- copy selected reusable assets into site-facing paths or uploads
- keep the private seller library separate from public delivery paths
- save through the normal persisted restaurant schema

### Stage 8. Learn And Reuse

Goal:

- every approved asset should improve the next project

Rules:

- approved generated or curated assets stay in the seller library
- recipe keys and match metadata are stored locally
- next restaurant imports should reuse approved exact matches before generating

## Model Role Split

Use different model roles for different stages.

### Extraction / multimodal parsing

Use a multimodal text model that accepts images and PDFs.

This stage should handle:

- menu photos
- menu PDFs
- logo understanding
- venue-photo context

### Normalization / repair / translation completion

Use a stronger text model only when the first extraction is incomplete or ambiguous.

Do not spend premium reasoning cost on every job if the first pass is already clean.

### Image generation

Use the current GPT Image family for:

- hero images
- gallery images
- selective product-image generation

Do not make image generation the first source for menu items.

## Why This Is Better Than A Single Mega Request

Because the job becomes controllable:

- extraction can be retried without regenerating images
- translation repair can run without touching branding
- media generation can be reviewed separately
- one weak stage does not invalidate the entire job
- you can measure cost by stage

## What The Client Admin Should See

The client admin should stay simple:

- logo
- restaurant name
- hero images
- about / history content
- contact info
- hours
- menu corrections

The client admin should not become:

- an importer console
- a generation studio
- a seller media library

Those flows are seller-only.

## Best Immediate Road

1. Keep the current AI importer as the first extraction stage.
2. Add PDF ingestion.
3. Add seller-job folders and saved draft artifacts.
4. Add product-image resolution against the local media library.
5. Add selective AI generation jobs for uncovered featured items.
6. Add seller-only capability gating so advanced tooling stays out of client admin by default.

That is the clearest road to a reliable product bundle workflow.
