# The Sehat Buddy 🏥

**The Sehat Buddy** is a modern, full-stack healthcare platform connecting patients with top medical specialists, verified hospitals, clinical services, and corporate wellness programs with real-time updates and responsive device support.

## 🚀 Key Features

- **Specialist & Doctor Discovery**: Search, filter, and view detailed profiles with career timelines, awards, patient reviews, and educational video reels.
- **Hospital Network & Clinical Rosters**: Explore accredited hospitals, departments, vacant beds, ambulance/ER contacts, and live-navigated routing.
- **Real-Time Cross-Tab Synchronization**: Dynamic availability statuses (`Available`, `In Surgery / Busy`, `On Leave`) synced instantly between Doctor and Hospital dashboards without page refresh.
- **Dedicated Portals**:
  - **Doctor Portal**: Manage availability, consultation hours, credentials, and appointments.
  - **Hospital Portal**: Manage hospital profile, emergency beds, wards, doctors, and star doctor badges.
  - **Admin Panel**: Full platform control, CMS front page editor, branding manager, and directory moderation.
- **Fully Responsive**: Optimized fluid experience across smartphones (320px–480px), tablets (768px–1024px), laptops, and high-res desktop monitors.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/) (v19)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Maps & Routing**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Styles**: Modular CSS with CSS Variables & Responsive Media Queries

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with Mongoose ODM
- **Authentication**: JWT & Bcrypt password hashing
- **Media Storage**: Cloudinary integration for doctor/hospital uploads

## 📁 Project Structure

```text
The-Sehat-Buddy/
├── backend/                  # Express REST API
│   ├── config/               # Database and Cloudinary configuration
│   ├── controllers/          # Business logic (admin, doctor, hospital, user)
│   ├── data/                 # Seed datasets and initial templates
│   ├── middleware/           # Auth and error middleware
│   ├── models/               # Mongoose schemas (Doctor, Hospital, User, etc.)
│   ├── routes/               # API route definitions
│   ├── scripts/              # Database seeding and migration utilities
│   ├── utils/                # Token generation and mail helpers
│   └── server.js             # Express entry point
├── src/                      # React frontend
│   ├── assets/               # Production icons and images
│   ├── components/           # Feature-based modular UI components
│   │   ├── admin/            # Admin dashboard and modals
│   │   ├── auth/             # Login and onboarding flow
│   │   ├── common/           # Error boundary, buttons, section headers
│   │   ├── content/          # Health articles and newsletter cards
│   │   ├── corporate/        # Corporate tieups marquee section
│   │   ├── doctor-dashboard/ # Clinical doctor workspace
│   │   ├── doctors/          # Doctor cards, list, and profile view
│   │   ├── hero/             # Hero banner and quick stats
│   │   ├── hospital-dashboard/# Hospital bed & roster management
│   │   ├── hospitals/        # Hospital cards, profile, and map routing
│   │   ├── insurance/        # Cashless insurance check modals
│   │   ├── layout/           # Navbar, Footer, Container
│   │   ├── reviews/          # Review submission modal
│   │   ├── search/           # Global specialty and location search bar
│   │   ├── services/         # Healthcare services grid
│   │   ├── specialities/     # Medical procedures & treatments
│   │   └── why/              # Value proposition and feature items
│   ├── context/              # Centralized data store and real-time sync
│   ├── data/                 # Default mock data fallbacks
│   ├── services/             # API clients and OSM routing proxy
│   └── styles/               # Global CSS and theme design tokens
├── public/                   # Static favicon and vector assets
├── package.json              # Root dependencies and unified scripts
└── vite.config.js            # Vite configuration
```

## 📜 Available Scripts

In the project root:

- `npm run dev`: Starts the Vite frontend dev server at `http://localhost:5173`.
- `npm run server`: Runs the backend API at `http://localhost:5000`.
- `npm run server:dev`: Runs the backend API with auto-reload (`node --watch`).
- `npm run server:seed`: Seeds MongoDB Atlas with doctors and hospitals dataset.
- `npm run build`: Compiles production frontend bundle to `dist/`.
- `npm run lint`: Runs Oxlint code verification.
- `npm run preview`: Previews the production build locally.

## 📄 License

Proprietary © The Sehat Buddy. All rights reserved.