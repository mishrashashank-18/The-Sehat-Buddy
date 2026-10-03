# The Sehat Buddy - Backend API

Standalone Node.js / Express backend service managing doctors, hospitals, and front-page website content.

## Directory Structure

```
backend/
├── server.js               # Main Express entry point
├── store.js                # JSON database store & transactional file operations
├── data/
│   ├── doctors.json        # Verified doctors dataset
│   ├── hospitals.json      # Registered hospitals & medical facilities
│   └── content.json        # Front-page headlines, services, features, and articles
└── routes/
    ├── doctorRoutes.js     # /api/doctors (CRUD)
    ├── hospitalRoutes.js   # /api/hospitals (CRUD)
    └── contentRoutes.js    # /api/content (Front-page CMS endpoints)
```

## Configuration (.env)

The backend uses a `.env` file located in `backend/.env`. A template is provided in `backend/.env.example`:

```env
# Server Port Configuration
PORT=5000

# Environment: 'development', 'production', or 'test'
NODE_ENV=development

# Allowed Frontend Client URL for CORS
CLIENT_URL=http://localhost:5173
```

## Running the Backend

From the project root:
```bash
npm run server
# or with file watching:
npm run server:dev
```

Or from inside the `backend` folder:
```bash
cd backend
npm run dev
# or for production:
npm start
```

The server will read your `.env` configuration and start on `http://localhost:${PORT}` (default `5000`).

## API Endpoints

### Doctors
- `GET /api/doctors` — List all registered doctors
- `GET /api/doctors/:id` — Get single doctor profile
- `POST /api/doctors` — Add a new doctor
- `PUT /api/doctors/:id` — Update doctor profile
- `DELETE /api/doctors/:id` — Remove doctor

### Hospitals
- `GET /api/hospitals` — List all registered hospitals
- `GET /api/hospitals/:id` — Get single hospital center
- `POST /api/hospitals` — Register a new hospital
- `PUT /api/hospitals/:id` — Update hospital facilities & beds
- `DELETE /api/hospitals/:id` — Remove hospital

### Front Page Content
- `GET /api/content` — Get hero headlines, services, features, and articles
- `PUT /api/content/hero` — Update hero section & trust metrics
- `PUT /api/content/services` — Update services cards
- `PUT /api/content/features` — Update "Why Choose Us" pillars
- `PUT /api/content/articles` — Update health articles & tips

### System & Health
- `GET /api/health` — Check server status
- `GET /api/stats` — Overall statistics (total doctors, beds, hospitals)
