# Question of the Day Generator

A Next.js application for generating and spinning through customizable questions with filtering capabilities.

## Features

- 🎯 Spinning wheel interface for random question selection
- 🏷️ Category-based filtering system
- 📊 Seriousness level filtering (1-5 scale)
- 📝 Customizable question quantity
- 💾 SQLite database with Prisma ORM
- 🎨 Modern UI with Tailwind CSS and Framer Motion

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **UI Components**: Custom component library with variant system

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx tsx prisma/seed.ts  # Seed database with sample data
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with Next.js config

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
├── components/       # Reusable React components
│   ├── Filters/      # Question filtering components
│   ├── QuestionDisplay/  # Question display components
│   ├── Wheel/        # Spinning wheel components
│   └── ui/           # Base UI components (Button, etc.)
├── context/          # React context providers (Filter, Wheel)
├── lib/              # Utility libraries (prisma, utils)
├── types/            # TypeScript type definitions
└── utils/            # Utility functions (api, storage, wheelMath)
```

## Database Schema

The application uses SQLite with Prisma ORM. The schema includes:
- **Questions**: text content with seriousness levels (1-5)
- **Categories**: named categories with colors
- **QuestionCategory**: Many-to-many relationship

## Development Guidelines

- Follow code style guidelines in `AGENTS.md`
- Use absolute imports with `@/` prefix
- Run `npm run lint` before committing
- TypeScript strict mode enabled

## Database Seeding

The seed script creates default categories:
- Wildcard (Rose)
- Desert Island (Amber)
- Favorites & Firsts (Blue)
- What If (Violet)
- Hot Takes (Pink)
- Origin Story (Emerald)
- Real Talk (Red)
