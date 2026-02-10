# AGENTS.md - YouTube Downloader Project

## Project Structure
- Next.js 15.3.5 app using TypeScript and Tailwind CSS
- Working directory: `/Users/TH33_ORACL3/AZ Labs/1 - Development/YT/youtube-downloader`

## Build/Test Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint (no test scripts available)

## Tech Stack
- Next.js 15 with React 19, TypeScript, Tailwind CSS
- shadcn/ui components with Radix UI primitives
- Backend service integration with yt-dlp

## Code Style Guidelines
- Use TypeScript with strict mode enabled
- Import paths: Use `@/` for relative imports (configured in tsconfig.json)
- Components: Export both named component and any variants/utilities
- Interfaces: Use PascalCase, define in separate types files when shared
- File naming: kebab-case for components, camelCase for services/utils
- CSS: Tailwind utility classes, use `cn()` helper for conditional classes

## Key Patterns
- shadcn/ui component structure with forwardRef and displayName
- Services use class-based patterns with Promise-based async methods
- Error handling with try/catch and proper Error objects
- Type interfaces defined per module with clear property definitions