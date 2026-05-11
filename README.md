# QUADRA 5.0 - Intercollegiate Sports Tournament Management System

A modern, real-time tournament management system for **QUADRA 5.0** - the premier multi-sports event organized by **Government Medical College Alappuzha** from **May 15-17, 2026**, hosted by **SATTVA College Union**.

![QUADRA 5.0](https://img.shields.io/badge/QUADRA-5.0-00E5FF?style=for-the-badge)
![Status](https://img.shields.io/badge/status-production--ready-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

## 🏟️ Features

### Public User Panel
- **Live Scores**: Real-time match updates via Socket.io - no page refresh needed
- **Leaderboard**: Overall and sport-wise college rankings with points calculation
- **Sports Navigation**: Browse by sport with Men/Women tabs
- **Match Details**: Detailed scoreboard with team names, scores, and status
- **Fully Responsive**: Works perfectly on all devices (mobile, tablet, desktop)

### Admin Panel (`/realadmin`)
- **Password Protected**: Secure admin access with token-based authentication
- **College Management**: Add, edit, delete participating colleges
- **Match Management**: Create and schedule matches with sport, gender, teams, venue
- **Live Score Control**: Real-time score updates with +1/-1 buttons
- **Status Management**: Mark matches as Upcoming/Live/Completed
- **Winner Declaration**: Automatic winner detection on match completion

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + GSAP + Socket.io-client
- **Backend**: Node.js + Express + Socket.io
- **Database**: SQLite (better-sqlite3)
- **Styling**: Custom dark theme with electric blue neon (#00E5FF), glassmorphism

## 🎨 Design Features

- **Neon Topographic Background**: Animated canvas with glowing contour lines
- **Custom Stencil Logo**: SVG-based "QUADRA 5.0" with cyberpunk aesthetic
- **Electric Blue Theme**: Primary color #00E5FF with purple (#B300FF) and orange (#FF5500) accents
- **Glassmorphism**: Modern glass-effect cards with backdrop blur
- **Fully Responsive**: Mobile-first design with Tailwind breakpoints

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd "c:/Users/jaisi/OneDrive/Desktop/web2.o/justin-sports/Collage event"
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment (optional)**
   - The `.env` file is pre-configured
   - Default admin password: `quadra2026`
   - To change: edit `.env` and set `ADMIN_PASSWORD=yourpassword`

4. **Start the development server**
   ```bash
   npm run dev
   ```
   This starts:
   - Backend server on `http://localhost:3001`
   - Frontend dev server on `http://localhost:5173`

5. **Access the application**
   - **Public Site**: http://localhost:5173
   - **Admin Panel**: http://localhost:5173/realadmin

### Production Build

```bash
# Build frontend
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3001`

## 🌐 Deploy to the Internet (Render)

Want to host your tournament online so anyone can access it? Follow our **[Render Deployment Guide](./RENDER_DEPLOYMENT.md)** - it takes just 15-20 minutes!

**Benefits:**
- ✅ Free hosting with Render
- ✅ No technical knowledge needed
- ✅ Automatic updates when you push to GitHub
- ✅ Your tournament goes live instantly

[👉 Click here for deployment steps](./RENDER_DEPLOYMENT.md)

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

## 🎮 Sports Supported

| Sport | Icon | Gender Categories |
|-------|------|-------------------|
| Football | ⚽ | Men (11-a-side), Women (5-a-side) |
| Cricket | 🏏 | Men, Women |
| Basketball | 🏀 | Men, Women |
| Badminton | 🏸 | Men, Women |
| Volleyball | 🏐 | Men, Women |
| Kho Kho | 🏃 | Men, Women |
| Table Tennis | 🏓 | Men, Women |
| Chess | ♟️ | Mixed |

## 🔐 Admin Credentials

- **URL**: `/realadmin`
- **Password**: `quadra2026` (configurable in `.env`)

## 📱 Responsive Design

The application is fully responsive:
- **Mobile**: 320px - 480px (touch-friendly, stacked layouts)
- **Tablet**: 768px - 1024px (two-column layouts)
- **Desktop**: 1280px+ (full layouts with sidebars)

## 🔄 Real-Time Updates

The application uses Socket.io for instant updates:
- Admin updates scores → All connected users see changes immediately
- No page refresh required
- Automatic reconnection handling
- Live match indicators with pulsing animations

## 📊 Points System

- **Win**: 3 points
- **Draw**: 1 point
- **Loss**: 0 points

Leaderboard is automatically calculated based on completed matches.

## 📄 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/colleges` | List all colleges |
| GET | `/api/matches` | List matches (filter by sport, status, gender) |
| GET | `/api/matches/:id` | Get match details |
| GET | `/api/leaderboard/overall` | Overall standings |
| GET | `/api/leaderboard/sport/:sport` | Sport-wise standings |
| GET | `/api/sports` | List all sports |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/verify` | Verify admin token |
| POST | `/api/admin/logout` | Admin logout |
| POST | `/api/colleges` | Add college |
| PUT | `/api/colleges/:id` | Update college |
| DELETE | `/api/colleges/:id` | Delete college |
| POST | `/api/matches` | Create match |
| PUT | `/api/matches/:id` | Update match |
| DELETE | `/api/matches/:id` | Delete match |

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `update-score` | Client → Server | Update match score (admin only) |
| `update-status` | Client → Server | Update match status (admin only) |
| `score-updated` | Server → Client | Broadcast score change |
| `status-updated` | Server → Client | Broadcast status change |
| `matches-updated` | Server → Client | Broadcast match list change |
| `leaderboard-update` | Server → Client | Broadcast leaderboard change |

## 🏗️ Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   ├── StencilLogo.jsx
│   │   │   └── TopographicBackground.jsx
│   │   ├── context/        # React context
│   │   │   └── SocketContext.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── admin/      # Admin pages
│   │   │   ├── Home.jsx
│   │   │   ├── Sports.jsx
│   │   │   ├── MatchDetail.jsx
│   │   │   └── Leaderboard.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server.js               # Express + Socket.io server
├── package.json            # Root package.json
├── .env                    # Environment variables
└── README.md
```

## 🤝 Contributing

This project is built for QUADRA 5.0 - Government Medical College Alappuzha.

## 📞 Contact

- **Sports Secretary**: Lal Krishnan AR
- **Phone**: 7025760870
- **Instagram**: [@quadra.tdmc](https://instagram.com/quadra.tdmc)
- **Website**: Coming soon

## 📜 License

MIT License - Built for educational purposes.

---

**QUADRA 5.0** • May 15-17, 2026 • Government Medical College Alappuzha

**IGNITE · INSPIRE**