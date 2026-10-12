# FitConnect

> **Live Deployment:** [https://fitconnect-eosin.vercel.app/](https://fitconnect-eosin.vercel.app/)

FitConnect is a Next.js-based community fitness platform that connects users, trainers, and admins in a comprehensive fitness ecosystem.

## Features

- **Multi-Role Authentication**: Secure JWT-based login/registration for Users, Trainers, and Admins
- **Personalized Dashboards**: Role-specific dashboards with calendar views, streak tracking, and quick feature access
- **Event Management**: Create, edit, approve, and view fitness events; public event discovery
- **Messaging System**: Direct messaging and threaded conversations between users and trainers
- **Trainer-Client Relationships**: Send/receive trainer invitations and requests; manage client portfolios
- **Workout Routines & Plans**: Create and assign 7-day workout routines; track exercise completion
- **Progress Tracking**: Monitor workout streaks, performance metrics, and routine history
- **Community Feed**: Share posts, comments, and fitness content with the community
- **Notifications**: Real-time alerts for messages, events, and platform updates
- **File Uploads**: Upload profile avatars and images for posts/messages
- **Admin Moderation**: Approve pending events; access analytics, reports, and platform metrics
- **Trainer Earnings**: Track and manage session-based earnings and client payments
- **Profile Management**: Update personal profiles, settings, certifications, and preferences
- **Calendar Integration**: Visual workout and event scheduling with interactive calendars
- **Streak System**: Track and display workout consistency with detailed streak history

## Prerequisites

- Node.js (v18 or higher)
- npm
- PostgreSQL database (configured via Supabase)

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd community-fitness-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://postgres.ozfltmyavyqqtjvynifv:Dinho.210380@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
   JWT_SECRET=change-this-to-a-long-random-secret
   SUPABASE_URL=https://ozfltmyavyqqtjvynifv.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96Zmx0bXlhdnlxcXRqdnluaWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxOTc3OSwiZXhwIjoyMDg4OTk1Nzc5fQ.GYK3blFM9seWTYgsoIBXerfCUUTz-6DWYkS3DXE3EyQ
   ```

4. **Generate Prisma client**:
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations** (optional, will not be needed as migrations will already be cloned, just run generate command):
   ```bash
   npm run prisma:migrate
   ```

## Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at:
- Local: http://localhost:3000
- Network: http://0.0.0.0:3000 (accessible from other devices on the same network)

## Testing Features

1. **Authentication**:
   - Register new accounts at `/auth/register` (test User, Trainer, Admin roles)
   - Login at `/auth/login`
   - Verify role-based access and JWT token handling

2. **User Dashboard** (`/user/dashboard`):
   - View personalized dashboard with calendar, active routines, and streaks
   - Track workout progress and completion status
   - Access community feed, events, messages, and trainer connections

3. **Trainer Features** (`/trainer/dashboard`):
   - Manage client lists and view their progress/routines
   - Create and assign 7-day workout plans (`/trainer/clients/[clientId]/plan`)
   - Monitor client streaks and earnings
   - Handle trainer requests and invitations

4. **Admin Features** (`/admin/dashboard`):
   - Approve pending events (`/admin/events`)
   - Access analytics and reports (`/admin/analytics`, `/admin/reports`)
   - Moderate platform content and user management

5. **Event Management**:
   - Create events via modal or `/events` page
   - Edit existing events
   - View public upcoming events (`/events`)
   - Admin approval workflow for new events

6. **Messaging System**:
   - Send direct messages (`/messages`)
   - Create threaded conversations (`/messages/threads`)
   - Message specific users (`/messages/with/[userId]`)

7. **Workout Routines**:
   - View active 7-day routines with exercise details
   - Track completion and progress (`/progress`)
   - Request new routines (`/routines/request`)
   - Continue existing routines (`/routines/[id]/continue`)

8. **Community Features**:
   - Post and comment on community feed (`/community`)
   - Share fitness content and interact with posts

9. **Notifications**:
   - Receive real-time notifications (`/notifications`)
   - Mark notifications as read

10. **File Uploads**:
    - Upload profile avatars (`/profile-settings`)
    - Attach images to posts and messages (`/upload`)

11. **API Testing**:
    - Test all endpoints with Postman or curl:
      - `/api/auth/*` (login, register, me)
      - `/api/events/*` (CRUD operations, public events)
      - `/api/messages/*` (threads, direct messaging)
      - `/api/notifications/*` (mark read)
      - `/api/posts/*` (community feed)
      - `/api/progress/*` (workout tracking)
      - `/api/routines/*` (create, continue, request)
      - `/api/trainer-invitations/*` (invitations)
      - `/api/trainer-requests/*` (requests)
      - `/api/trainers/*` (trainer management)
      - `/api/upload/*` (file uploads)
      - `/api/users/*` (user profiles)
      - `/api/workout-plans/*` (plans)

12. **Database**:
    - Check Prisma Studio: `npx prisma studio`
    - Verify data integrity in Supabase dashboard
    - Test migrations and schema relationships

## Building & Hosting

### Deploying to Render

1. Push your repository to **GitHub**.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** &rarr; **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm run start`
   - **Node Version:** Add Environment Variable `NODE_VERSION` = `20`
5. Under **Environment Variables**, add the values from your `.env`:
   - `DATABASE_URL` (Supabase transaction pooler URI)
   - `DIRECT_URL` (Supabase session URI)
   - `JWT_SECRET`
   - `SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional)
6. Click **Deploy Web Service**!

### Local Production Build

```bash
npm run build
npm run start
```

## Additional Commands

- **Linting**: `npm run lint`
- **Prisma Generate**: `npm run prisma:generate`
- **Prisma Migrate**: `npm run prisma:migrate`

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **Storage**: Supabase

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is private and proprietary.