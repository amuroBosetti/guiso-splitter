# guiso-splitter Backlog

## Technical Debt

### Authentication & User Management
- [ ] **Replace database function with backend service for user signup**
  - **Problem**: Currently using a PostgreSQL function (`handle_new_user`) to create user profiles, which is not ideal for maintainability and security.
  - **Solution**: Implement a backend service (e.g., using Supabase Edge Functions or a separate API) to handle user registration and profile creation.
  - **Impact**: Improves security, makes the system more maintainable, and provides better error handling and logging.
  - **Effort**: Medium

## Product Vision
A simple, frictionless PWA for organizing and splitting expenses for group food gatherings, with features tailored to our specific needs.

---

## Epics & User Stories

### 1. Event Creation & Management
- [x] As a user, I want to create an event with a date and a list of guests, so we can plan gatherings together.
- [x] As a user, I want to propose a location and a meal for the event, so everyone knows where and what we’ll eat.
- [x] As a user, I want to list all ingredients needed for the meal, so we can organize who brings what.

### 2. Ingredient Assignment & Expense Tracking
- [x] As a user, I want to claim responsibility for bringing specific ingredients, so we can divide shopping duties.
- [x] As a user, I want to record how much I spent on ingredients, either individually or as a group of items, so expenses are tracked accurately.
- [x] As a user, I want to see a summary of who spent what, so we can split costs fairly.

### 3. Dietary Preferences & Exclusions
- As a user, I want to be excluded from certain categories of items (e.g., meat, alcohol), so my share reflects my dietary choices.

### 4. Group Inventory Management
- As a user, I want to mark leftover or unused items as "in stock" for future gatherings, so we can keep track of group inventory and avoid waste.

### 5. Usability & Adoption
- As a user, I want the app to be easy to use and accessible from both desktop and mobile, so everyone in the group can participate with minimal friction.
- As a user, I want to install the app on my phone if I prefer, so I can access it quickly like a native app.

---

## Future Ideas (Nice-to-haves)
- Notifications/reminders for upcoming events or missing ingredients.
- Integration with shopping lists or grocery delivery.
- Analytics on group spending over time.

---

## Non-Functional Requirements
- Must be a PWA: installable, offline-capable, responsive UI.
- No login required: The app displays all possible groups. After selecting a group, the user selects who they are from the list of group members.
- Privacy is not a priority for now; all data is visible to anyone using the app.

---

## Tech Stack & Architecture

- **Frontend:** React (with Vite or Create React App), PWA features enabled
- **UI Library (optional):** Material-UI (MUI), Chakra UI, or Ant Design
- **Hosting:** Vercel or Netlify (free tier)
- **Backend & Database:** Supabase (Postgres)
  - Chosen because it's a new technology to explore and provides a relational database (Postgres), which fits the project's needs.

### Authentication Plan
- No authentication required initially (user selects themselves after choosing a group)
- The stack should make it easy to add authentication later
- **Supabase** offers simple, robust authentication that can be added with minimal changes when needed.
