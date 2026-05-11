# QUADRA 5.0 - Intercollegiate Sports Tournament Management System

A modern, real-time tournament management system for QUADRA 5.0 - the premier multi-sports event organized by Government Medical College Alappuzha.

## 🏟️ Features

### Public User Panel
- **Live Scores**: Real-time match updates without page refresh
- **Leaderboard**: Overall and sport-wise college rankings
- **Sports Navigation**: Browse by sport (Men/Women categories)
- **Match Details**: Detailed view of each match with scores
- **Responsive Design**: Works on all devices

### Admin Panel (`/realadmin`)
- **Password Protected**: Secure admin access
- **College Management**: Add, edit, delete participating colleges
- **Match Management**: Create and schedule matches
- **Live Score Control**: Real-time score updates with Socket.io
- **Status Management**: Mark matches as Upcoming/Live/Completed

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + GSAP
- **Backend**: Node.js + Express
- **Real-time**: Socket.io
- **Database**: SQLite (better-sqlite3)
- **Styling**: Custom dark neon theme with glassmorphism

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment**
   - The `.env` file is already configured with default settings
   - Default admin password: `quadra2026`

4. **Start the development server**
   ```bash
   npm run dev
   ```
   This will start both the backend (port 3001) and frontend (port 5173).

5. **Access the application**
   - **Public Site**: http://localhost:5173
   - **Admin Panel**: http://localhost:5173/realadmin

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```
   The application will be available at http://localhost:3001

## 📋 Default Data

The application comes pre-loaded with sample colleges:
- Government Medical College Alappuzha (GMC Alappuzha)
- Amrita Institute of Medical Sciences (Amrita)
- Government Medical College Kottayam (GMC Kottayam)
- Government Medical College Thiruvananthapuram (GMC TVM)
- Kerala Institute of Medical Sciences (KIMS)
- Travancore Medical College (TMC)
- Sree Gokulam Medical College (SGMC)
- Jubilee Mission Medical College (Jubilee)

## 🎨 Design Features

- **Dark Neon Theme**: Inspired by the official QUADRA Instagram aesthetic
- **Glassmorphism**: Modern glass-effect cards and panels
- **Scroll Animation**: Football player kicks ball that transforms into CTA buttons
- **Live Indicators**: Pulsing animations for live matches
- **Neon Glow Effects**: Cyan, purple, and orange accents

## 📊 Sports Supported

1. ⚽ Football
2. 🏏 Cricket
3. 🏀 Basketball
4. 🏸 Badminton
5. 🏐 Volleyball
6. 🏃 Kho Kho
7. 🏓 Table Tennis
8. ♟️ Chess

## 🔐 Admin Credentials

- **URL**: `/realadmin`
- **Password**: `quadra2026` (configurable in `.env`)

## 📱 Mobile Responsive

The application is fully responsive and works on:
- Desktop (1920px+)
- Tablet (768px - 1024px)
- Mobile (320px - 767px)

## 🔄 Real-time Updates

The application uses Socket.io for real-time communication:
- Admin updates scores → All connected users see updates instantly
- No page refresh required
- Automatic reconnection handling

## 📄 API Endpoints

### Public
- `GET /api/colleges` - List all colleges
- `GET /api/matches` - List matches (with filters)
- `GET /api/matches/:id` - Get match details
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/leaderboard/overall` - Get overall leaderboard
- `GET /api/sports` - List all sports

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/verify` - Verify admin token
- `POST /api/colleges` - Add college
- `PUT /api/colleges/:id` - Update college
- `DELETE /api/colleges/:id` - Delete college
- `POST /api/matches` - Create match
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match

## 🤝 Contributing

This project is built for QUADRA 5.0 - Government Medical College Alappuzha.

## 📞 Contact

- **Sports Secretary**: Lal Krishnan AR - 7025760870
- **Instagram**: [@quadra.tdmc](https://instagram.com/quadra.tdmc)

## 📜 License

MIT License - Built for educational purposes.

---

**IGNITE · INSPIRE**