# SDD Progress Ledger — Plan 1: EmDash Fork + Branding

## Status
- Task 1: COMPLETE (fork already at github.com/perkup-wolf/mct-cms, cloned to mct-cms/)
- Task 2: COMPLETE (commits 13b87b70..41c68c03, review clean)
- Task 3: COMPLETE (commits 41c68c03..303555b8, review clean)
- Task 4: COMPLETE (commit 4f2172bb, review clean — added logo-default.svg, favicon.svg, wired both in astro.config.mjs)
- Task 5: COMPLETE (commit 2596f29e, review clean — R2 logo API at /_brand/logo, LogoSettings.tsx, settings page, dynamic logo config)
- Task 6: COMPLETE (commit 51a9130d, review clean — 7 EmDash fallback strings changed to MCT CMS across 6 auth/email API routes)
- Task 7: COMPLETE (commit f6fd94cf, review clean — locale+translation_of fields added to posts and pages collections)
- Task 8: COMPLETE (commit 7c678eac, review clean — scripts/deploy-client.sh provisions D1+R2+Worker per client)

## Notes
- BrandLogo/BrandIcon components already accept logoUrl prop (packages/admin/src/components/Logo.tsx)
- Colors use Kumo design system theme overrides (packages/admin/src/styles.css)
- Email templates inline in packages/auth/src/ (invite.ts, magic-link/index.ts, signup.ts)
- Seed field format uses 'slug' not 'name'
