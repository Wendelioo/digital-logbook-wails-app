System overview

This project is a small desktop/web hybrid application built with Go (backend) and a modern TypeScript/React frontend. It uses Wails to bridge the Go backend with a web-based UI so you get a native-feeling app with familiar web tooling.

Core parts

- Backend: Written in Go. Key files include `main.go`, `app.go`, and `config.go`. Wails configuration is in `wails.json`. The Go code exposes application logic and APIs that the frontend calls.

- Frontend: Located under the `frontend/` folder. It’s a Vite-powered React + TypeScript app using Tailwind for styling. Entry points are `src/main.tsx` and `src/App.tsx`. The frontend bundles into assets that Wails serves inside the native shell.

- Database: SQL schema and seed data live in the `database/` folder (`logbookschema.sql`, `seed.sql`). The app uses these scripts to initialize or seed the datastore used by the backend.

- Assets and build outputs: Static images and illustrations are under `assets/`. Build artifacts and platform-specific packages land in `build/`, with subfolders for macOS, Windows, and other targets.

- Generated runtime glue: The `wailsjs/` folder contains generated JavaScript/TypeScript bindings and runtime code used by the frontend to call Go functions and to integrate with the Wails runtime.

How it runs (quick)

- Development frontend: From `frontend/` run the usual Node workflow (`npm install` then `npm run dev`) to develop the UI in a browser or Vite dev server.
- Backend: Run the Go app normally (`go run .` or `go build`) — Wails makes it easy to bundle both pieces for a native build.
- Full native app: Use the Wails build flow (the repository already includes `wails.json` and platform build folders) to produce native installers and binaries.

Intent and conventions

This repo keeps backend Go code and frontend web code side-by-side so teams can iterate on UI and native behaviors independently. Database scripts are separated for clarity, and build outputs are staged under `build/` to keep source artifacts distinct from generated packages.

If you want, I can add a short "Getting Started" section with exact commands for Windows (PowerShell) and for adding a local dev DB. Would you like that?