# Guiso Splitter

Hey! This is a small app that solves my group of friends issue of sharing grocery responsibilities wheen hanging out. It lets you create gathering plans with meals, assigning who buys what and then spliting bills evenly.

To avoid having to write down grocery lists manually, it uses an AI agent (a simple prompt, really) built with Langgraph to fetch ingredients out of a recipe name. Cool!

You can refer to [BACKLOG.md](/BACKLOG.md) for future ideas

## AI Integration

The project leverages:
- 🤖 **LangChain Agents**: Intelligent meal planning and ingredient suggestions
- 🧠 **Large Language Models**: Smart understanding of meal descriptions and dietary requirements
- 🔄 **Real-time AI Processing**: Dynamic adaptation to user preferences and group needs

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **AI Layer**: LangChain + Custom Agents

## Project Structure

```
├── client/          # React frontend application
├── supabase/        # Supabase configuration and migrations
│   ├── functions/   # Edge Functions (Deno)
│   └── migrations/  # Database migrations
└── ai/              # LangChain agents and AI integration
    └── langchain/   # Custom LangChain implementation
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Supabase CLI
- Deno (for Supabase Edge Functions)
- Python 3.9+ and pipenv (for LangChain agents)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd guiso-splitter
   ```

2. **Frontend Setup**
   ```bash
   cd client
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the `client` directory:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **AI Layer Setup**
   ```bash
   cd ai
   pipenv install
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

### Supabase Setup

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase**
   ```bash
   supabase init
   ```

3. **Start Local Development**
   ```bash
   supabase start
   ```

4. **Apply Migrations**
   ```bash
   supabase db reset
   ```

## Development

### Available Scripts

In the client directory:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

In the ai directory:
- `pipenv run langgraph dev --allow-blocking` - Start the LangChain agent server
- `pipenv run uvicorn agent.server:app --reload --port 8000` - Start the HTTP server to send requests to the agent

