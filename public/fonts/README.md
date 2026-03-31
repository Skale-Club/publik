# KDP Font Files Directory

This directory contains TTF font files for embedding in PDFs generated for Amazon KDP.

## Current Implementation

For v1, fonts are loaded from CDN URLs in `src/lib/pdf/font-registration.ts`. This approach:
- Avoids bundling large font files in the application
- Uses fonts from `@react-pdf/core` package
- Provides fully embedded fonts for KDP compliance

## Font Families

The following font families are registered for KDP compliance:

### Times Roman Family (Body Text)
- Times-Roman
- Times-Italic
- Times-Bold
- Times-BoldItalic

### Helvetica Family (Headings/UI)
- Helvetica
- Helvetica-Oblique
- Helvetica-Bold
- Helvetica-BoldOblique

### Courier Family (Code Blocks)
- Courier
- Courier-Oblique
- Courier-Bold
- Courier-BoldOblique

## Using Local Fonts

To use local TTF files instead of CDN:

1. Download TTF files from a trusted source (e.g., Google Fonts, Adobe Fonts)
2. Place them in this directory (`/public/fonts/`)
3. Update `src/lib/pdf/font-registration.ts` to use local paths:

```typescript
Font.register({
  family: "Times-Roman",
  fonts: [
    { src: "/fonts/Times-Roman.ttf" },
    // ...
  ],
})
```

## KDP Requirements

Amazon KDP requires:
- All fonts to be fully embedded (not subset)
- No system font references
- Standard KDP-approved fonts or licensed fonts

The current implementation using CDN URLs satisfies these requirements.
