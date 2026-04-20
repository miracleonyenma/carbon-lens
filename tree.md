.
├── README.md
├── app
│   ├── (app)
│   │   ├── dashboard
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (auth)
│   │   ├── auth
│   │   │   ├── error
│   │   │   │   └── page.tsx
│   │   │   └── success
│   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   ├── login
│   │   │   └── page.tsx
│   │   └── register
│   │       └── page.tsx
│   ├── api
│   │   └── v1
│   │       ├── auth
│   │       │   ├── login
│   │       │   │   └── route.ts
│   │       │   ├── logout
│   │       │   │   └── route.ts
│   │       │   ├── magic-link
│   │       │   │   ├── request
│   │       │   │   │   └── route.ts
│   │       │   │   └── verify
│   │       │   │       └── route.ts
│   │       │   ├── otp
│   │       │   │   ├── request
│   │       │   │   │   └── route.ts
│   │       │   │   └── verify
│   │       │   │       └── route.ts
│   │       │   ├── register
│   │       │   │   └── route.ts
│   │       │   └── session
│   │       │       └── route.ts
│   │       └── payid
│   │           ├── kyc
│   │           │   ├── retry
│   │           │   │   └── [sessionId]
│   │           │   │       └── route.ts
│   │           │   ├── status
│   │           │   │   ├── [sessionId]
│   │           │   │   │   └── route.ts
│   │           │   │   └── route.ts
│   │           │   └── verify
│   │           │       └── route.ts
│   │           ├── oauth
│   │           │   ├── callback
│   │           │   │   └── route.ts
│   │           │   ├── initiate
│   │           │   │   └── route.ts
│   │           │   └── token
│   │           │       └── refresh
│   │           │           └── route.ts
│   │           └── userinfo
│   │               └── route.ts
│   ├── callback
│   │   └── payid
│   │       └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── Auth
│   │   └── Form.tsx
│   ├── app-sidebar.tsx
│   ├── nav-main.tsx
│   ├── nav-projects.tsx
│   ├── nav-user.tsx
│   ├── page-header.tsx
│   ├── providers
│   │   └── auth-provider.tsx
│   ├── search-command.tsx
│   ├── team-switcher.tsx
│   ├── theme-toggle.tsx
│   └── ui
│       ├── aevr
│       │   ├── blurred-background.tsx
│       │   ├── button.tsx
│       │   ├── country-dropdown.tsx
│       │   ├── currency-select.tsx
│       │   ├── info-box.tsx
│       │   ├── loader.tsx
│       │   ├── multistep.tsx
│       │   ├── phone-input.tsx
│       │   └── responsive-dialog.tsx
│       ├── avatar.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── field.tsx
│       ├── input-group.tsx
│       ├── input-otp.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── popover.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
├── components.json
├── eslint.config.mjs
├── hooks
│   ├── aevr
│   │   ├── use-media-query.ts
│   │   ├── use-persisted-state.ts
│   │   └── use-status.ts
│   └── use-mobile.ts
├── lib
│   ├── crypto.ts
│   ├── models
│   │   ├── OAuthSession.ts
│   │   ├── User.ts
│   │   └── VerificationToken.ts
│   ├── mongodb.ts
│   ├── payid.ts
│   ├── session.ts
│   └── utils.ts
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── img
│   │   ├── android-chrome-192x192.png
│   │   ├── android-chrome-512x512.png
│   │   ├── apple-touch-icon.png
│   │   ├── favicon-16x16.png
│   │   ├── favicon-32x32.png
│   │   ├── favicon.ico
│   │   └── tree.jpg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── test-email.ts
├── tree.md
├── tsconfig.json
├── tsconfig.tsbuildinfo
└── utils
    ├── aevr
    │   ├── http-client.ts
    │   ├── number-formatter.ts
    │   └── variants.ts
    ├── auth
    │   ├── index.ts
    │   └── types.ts
    ├── email
    │   └── index.ts
    └── payid
        ├── index.ts
        ├── payid-service.ts
        └── types.ts

54 directories, 114 files
