# Importer Payload Spec

This file defines the concrete payload that a future seller-side PDF/image importer should produce.

The goal is simple:

- map extracted restaurant/menu information into the existing live schema
- keep review metadata separate from persisted website data
- make importer output directly usable by a future private launcher or onboarding tool

## Contract Overview

The importer should output one object with two layers:

1. `restaurantData`
2. `review`

`restaurantData` is the part that can be saved to the live product after human review.

`review` is seller-only metadata and must not be written directly into `data.json` or the public/admin runtime.

## Top-Level Shape

```json
{
  "restaurantData": {
    "menu": [],
    "catEmojis": {},
    "wifi": { "ssid": "", "pass": "" },
    "social": {
      "instagram": "",
      "facebook": "",
      "tiktok": "",
      "tripadvisor": "",
      "whatsapp": ""
    },
    "guestExperience": {
      "paymentMethods": [],
      "facilities": []
    },
    "sectionVisibility": {},
    "sectionOrder": [],
    "branding": {},
    "contentTranslations": {
      "fr": {},
      "en": {},
      "ar": {}
    },
    "promoId": null,
    "promoIds": [],
    "superCategories": [],
    "hours": [],
    "hoursNote": "",
    "gallery": [],
    "landing": {
      "location": {
        "address": "",
        "url": ""
      },
      "phone": ""
    }
  },
  "review": {
    "sourceFiles": [],
    "summary": "",
    "blockers": [],
    "warnings": [],
    "missingMediaSlots": [],
    "untranslatedItems": [],
    "confidence": {
      "menuExtraction": "unknown",
      "translations": "unknown",
      "mediaMatching": "unknown"
    }
  }
}
```

## `restaurantData` Rules

This object should match the current admin save payload as closely as possible.

### Required Before Human Review

- `menu`
- `branding.restaurantName`
- `branding.shortName`
- `contentTranslations`
- `landing.location.address`
- `landing.phone`

These can still be incomplete drafts, but they must exist as fields.

### Branding

Expected shape:

```json
{
  "presetId": "core|fast_food|cafe|traditional",
  "restaurantName": "",
  "shortName": "",
  "tagline": "",
  "logoMark": "",
  "primaryColor": "#000000",
  "secondaryColor": "#000000",
  "accentColor": "#000000",
  "surfaceColor": "#000000",
  "surfaceMuted": "#000000",
  "textColor": "#000000",
  "textMuted": "#000000",
  "menuBackground": "#000000",
  "menuSurface": "#000000",
  "heroImage": "",
  "heroSlides": ["", "", ""],
  "logoImage": ""
}
```

Notes:

- `heroSlides[0]` should match `heroImage`
- importer may leave `logoImage` or extra hero slides empty if not available
- preset choice can be inferred, but should remain reviewable

### Content Translations

Use the existing multilingual content buckets:

```json
{
  "fr": {},
  "en": {},
  "ar": {}
}
```

At minimum, the importer should try to fill homepage/about copy keys that already exist in the product when enough source material is available.

If confidence is low, prefer leaving keys empty and recording a warning in `review`.

### Menu Items

Each menu item should follow this shape:

```json
{
  "id": "import-001",
  "cat": "Plats",
  "name": "Poulet grille",
  "desc": "Servi avec legumes et sauce maison.",
  "price": 72,
  "img": "",
  "images": [],
  "ingredients": [],
  "featured": false,
  "badge": "",
  "translations": {
    "fr": { "name": "", "desc": "" },
    "en": { "name": "", "desc": "" },
    "ar": { "name": "", "desc": "" }
  }
}
```

Rules:

- always include `translations.fr`, `translations.en`, and `translations.ar`
- prefer stable string IDs during import; final normalization can convert or preserve them
- `img` should match the first entry in `images` when an image is assigned
- keep unknown fields out unless the live schema already supports them

### Categories And Super-Categories

- `catEmojis` should contain one emoji per discovered category when possible
- `superCategories` should group categories only when there is a clear meal-time or logical grouping
- if grouping confidence is weak, keep categories flat and record a warning

### Landing / Contact

Use:

```json
{
  "landing": {
    "location": {
      "address": "",
      "url": ""
    },
    "phone": ""
  }
}
```

Use `social` for:

- Instagram
- Facebook
- TikTok
- TripAdvisor
- WhatsApp

Use `wifi` only if the restaurant explicitly wants WiFi shown publicly.

### Media Fields

The importer should write only to these live media targets:

- `branding.logoImage`
- `branding.heroImage`
- `branding.heroSlides[1]`
- `branding.heroSlides[2]`
- `gallery[]`
- `promoIds[]`
- `menu[].featured`
- `menu[].img`
- `menu[].images[]`

The slot meaning and review states are defined in [MEDIA_IMPORT_BASIS.md](./MEDIA_IMPORT_BASIS.md).

## `review` Rules

`review` is internal metadata for seller-side approval.

Recommended shape:

```json
{
  "sourceFiles": [
    {
      "kind": "pdf|image|text",
      "name": "menu.pdf"
    }
  ],
  "summary": "",
  "blockers": [],
  "warnings": [],
  "missingMediaSlots": [],
  "untranslatedItems": [],
  "confidence": {
    "menuExtraction": "high|medium|low|unknown",
    "translations": "high|medium|low|unknown",
    "mediaMatching": "high|medium|low|unknown"
  }
}
```

### Blockers

Use `blockers` for issues that should stop direct publishing, such as:

- no menu items extracted
- missing restaurant name
- no phone and no usable contact path
- no hero visual
- prices not detected for most items

### Warnings

Use `warnings` for issues that can still go to manual review:

- some translations missing
- gallery coverage is weak
- media slots are still `managed` or `partial`
- category grouping is uncertain
- OCR quality was weak on some pages

## Example Draft

```json
{
  "restaurantData": {
    "menu": [
      {
        "id": "import-plat-001",
        "cat": "Plats",
        "name": "Poulet grille",
        "desc": "Servi avec pommes et salade.",
        "price": 72,
        "img": "images/menu-lib-grill.svg",
        "images": ["images/menu-lib-grill.svg"],
        "ingredients": ["Poulet", "Pommes", "Salade"],
        "featured": true,
        "translations": {
          "fr": { "name": "Poulet grille", "desc": "Servi avec pommes et salade." },
          "en": { "name": "Grilled Chicken", "desc": "Served with potatoes and salad." },
          "ar": { "name": "دجاج مشوي", "desc": "يقدم مع البطاطس والسلطة." }
        }
      }
    ],
    "catEmojis": {
      "Plats": "🍽️"
    },
    "wifi": { "ssid": "", "pass": "" },
    "social": {
      "instagram": "",
      "facebook": "",
      "tiktok": "",
      "tripadvisor": "",
      "whatsapp": ""
    },
    "guestExperience": {
      "paymentMethods": ["cash", "tpe"],
      "facilities": ["wifi"]
    },
    "sectionVisibility": {
      "about": true,
      "payments": true,
      "events": true,
      "gallery": true,
      "hours": true,
      "contact": true
    },
    "sectionOrder": ["about", "payments", "events", "gallery", "hours", "contact"],
    "branding": {
      "presetId": "traditional",
      "restaurantName": "Restaurant Atlas",
      "shortName": "Atlas",
      "tagline": "Cuisine locale et accueil chaleureux",
      "logoMark": "A",
      "primaryColor": "#A63D32",
      "secondaryColor": "#C8873F",
      "accentColor": "#E5C77A",
      "surfaceColor": "#FBF4EA",
      "surfaceMuted": "#F1E2CD",
      "textColor": "#291C18",
      "textMuted": "#78655A",
      "menuBackground": "#151112",
      "menuSurface": "#24191A",
      "heroImage": "images/hero-traditional.svg",
      "heroSlides": ["images/hero-traditional.svg", "", ""],
      "logoImage": ""
    },
    "contentTranslations": {
      "fr": {},
      "en": {},
      "ar": {}
    },
    "promoId": "import-plat-001",
    "promoIds": ["import-plat-001"],
    "superCategories": [],
    "hours": [],
    "hoursNote": "",
    "gallery": [],
    "landing": {
      "location": {
        "address": "Centre-ville, Casablanca",
        "url": ""
      },
      "phone": "+212600000000"
    }
  },
  "review": {
    "sourceFiles": [
      {
        "kind": "pdf",
        "name": "menu.pdf"
      }
    ],
    "summary": "Draft imported from menu PDF with one strong grill match and no gallery assets yet.",
    "blockers": [],
    "warnings": [
      "Hero image still uses a managed preset asset.",
      "Gallery is empty.",
      "Logo file still missing."
    ],
    "missingMediaSlots": [
      "branding.logoImage",
      "gallery[]"
    ],
    "untranslatedItems": [],
    "confidence": {
      "menuExtraction": "high",
      "translations": "medium",
      "mediaMatching": "medium"
    }
  }
}
```

## Implementation Rule

When this importer is built:

- write `restaurantData` into the same payload shape the admin already saves
- keep `review` outside the live website data store
- require a human review step before pushing imported media or copy to a client instance
