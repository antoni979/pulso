# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pulso** is a nutrition tracking web application built with Vue 3, TypeScript, Vite, Pinia, Tailwind CSS, and Supabase. Users can register meals, track calories and macronutrients (protein, carbs, fats), and view their daily progress against personalized goals.

## Tech Stack

- **Frontend Framework**: Vue 3.5+ with Composition API and `<script setup>` syntax
- **Backend**: Supabase (PostgreSQL database, authentication, Row Level Security)
- **State Management**: Pinia 3.0+
- **Routing**: Vue Router 4.5+
- **Build Tool**: Vite 7.1+
- **Language**: TypeScript 5.9+ with strict mode enabled
- **Styling**: Tailwind CSS 3.4+
- **Type Checking**: vue-tsc for Vue component type checking

## Development Commands

```bash
# Start development server
npm run dev

# Build for production (includes type checking)
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── main.ts           # Application entry point, Pinia + Router initialization
├── App.vue           # Root component with RouterView
├── router/
│   └── index.ts      # Vue Router configuration with auth guards
├── stores/
│   ├── auth.ts       # Authentication store (login, signup, session)
│   └── meals.ts      # Meals store (CRUD operations, daily totals)
├── lib/
│   └── supabase.ts   # Supabase client configuration and type definitions
├── views/
│   ├── AuthView.vue      # Login/Register page
│   └── DashboardView.vue # Main dashboard with meal tracking
├── components/       # Reusable Vue components
├── assets/           # Static assets (images, etc.)
└── style.css         # Global styles (includes Tailwind directives)
```

## TypeScript Configuration

The project uses a strict TypeScript configuration with:
- Strict mode enabled
- Unused locals and parameters checking
- No fallthrough cases in switch statements
- Erasable syntax only mode

TypeScript config is split across:
- `tsconfig.json` - Root config that references app and node configs
- `tsconfig.app.json` - Application code configuration (src/**/*.ts, src/**/*.vue)
- `tsconfig.node.json` - Build tooling configuration

## Key Architecture Notes

### Supabase Backend
- **Database Schema**: See `SUPABASE_SETUP.md` for complete schema and setup instructions
- **Tables**: `user_profiles`, `meals`, `foods`
- **Authentication**: Email/password via Supabase Auth
- **RLS Policies**: Row Level Security enforced on all tables
- **Client**: Configured in `src/lib/supabase.ts` with environment variables

### Pinia State Management
Two main stores:
- **auth.ts**: User authentication, session management, profile CRUD
- **meals.ts**: Meal tracking, daily totals calculation, meal CRUD operations

Stores use the composition API pattern with `ref()` and `computed()`.

### Vue Router
- **Guards**: Authentication guards in `src/router/index.ts`
- **Routes**:
  - `/auth` - Login/Register (guest only)
  - `/` - Dashboard (authenticated only)
- The auth store is initialized before routing to ensure proper redirects

### Vue Components
- Use `<script setup lang="ts">` syntax for all new components
- Components use TypeScript for type safety
- Path alias `@/` points to `src/` directory

### Styling
- **Design System**: Modern gradients (purple, pink, orange), rounded corners, shadows
- **Tailwind**: Configured to scan all Vue, JS, TS, JSX, and TSX files in `src/`
- **Global styles**: Imported in `src/main.ts` via `style.css`
- **Component styles**: Use `<style scoped>` for component-specific styles

## Specialized Sub-Agents

This project has access to specialized Claude Code sub-agents. Use them proactively when appropriate:

### vue-feature-builder
**When to use**: Creating new features or components in this Vue 3 + Vite + Pinia project.

**Examples**:
- "Create a meal history view showing past 7 days"
- "Add a food search feature with autocomplete"
- "Build a settings page to update nutrition goals"
- "Implement a weekly nutrition summary chart"

**How to invoke**: Use the Task tool with `subagent_type: "vue-feature-builder"` when building new Vue features.

### supabase-backend-optimizer
**When to use**: When database schema changes, optimizations, or new backend features are needed.

**Examples**:
- "Add indexes to improve meal query performance"
- "Create a new table for tracking water intake"
- "Optimize the meals query to include food details"
- "Add a new RLS policy for shared meal plans"
- "Create database functions for weekly nutrition stats"

**How to invoke**: Use the Task tool with `subagent_type: "supabase-backend-optimizer"` when:
- New database tables or columns are needed
- Performance issues are detected in queries
- Complex SQL operations or functions are required
- RLS policies need to be added or modified

### security-auditor
**When to use**: ONLY when explicitly requested to audit code for security vulnerabilities.

**Examples**:
- "Audit the authentication flow for security issues"
- "Check the API endpoints for vulnerabilities"
- "Review the Supabase RLS policies for security"

**How to invoke**: Use the Task tool with `subagent_type: "security-auditor"` only when the user explicitly asks for a security review.

## Build Process

The build command (`npm run build`) runs two steps:
1. Type checking with `vue-tsc -b`
2. Production build with `vite build`

Both must pass for a successful build.

## Environment Variables

Required environment variables (see `.env.example`):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
