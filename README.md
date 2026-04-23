# 🏢 Izhar SMS — Society Management System

A modern, full-featured **Society Management System** built for residential apartments and housing communities. Izhar SMS provides dedicated dashboards for administrators and residents to manage parking, payments, complaints, and notices — all from a single, beautifully designed platform.

---

## ✨ Features

| Module | Description |
|---|---|
| **Admin Dashboard** | Overview of society stats, resident count, recent activity, and quick actions |
| **Resident Dashboard** | Personalized view for residents with their payments, complaints, and notices |
| **Parking Management** | Register vehicles, allocate parking slots, and track availability |
| **Payment Management** | Track maintenance fees, generate payment records, and view history |
| **Complaint System** | Residents can file complaints; admins can track, respond, and resolve them |
| **Notice Board** | Publish and manage society-wide announcements and notices |
| **Role-Based Access** | Automatic sidebar visibility based on user role (Admin / Resident) |
| **Authentication** | Firebase-powered login and registration with role management |

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **UI Framework:** Bootstrap 5
- **Icons:** Font Awesome 6
- **Charts:** Chart.js
- **Backend:** Node.js + Express.js
- **Authentication & Database:** Firebase (Auth + Realtime Database)
- **Deployment:** Vercel (serverless-ready)

---

## 📁 Project Structure

```
izhar-sms/
├── index.html                 # Landing page (home)
├── server.js                  # Express server entry point
├── package.json               # Node.js dependencies and scripts
├── vercel.json                # Vercel deployment configuration
├── .env.example               # Environment variable template
├── .gitignore
│
├── pages/                     # Application pages
│   ├── login.html             # Login & Registration page
│   ├── admin-dashboard.html   # Admin dashboard
│   ├── resident-dashboard.html# Resident dashboard
│   ├── parking.html           # Parking management
│   ├── payments.html          # Payment management
│   ├── complaints.html        # Complaint system
│   └── notices.html           # Notice board
│
├── public/                    # Static assets
│   ├── css/
│   │   └── style.css          # Global stylesheet
│   ├── js/
│   │   ├── main.js            # Core application logic
│   │   └── firebase-config.js # Firebase configuration
│   └── images/                # Image assets
│
├── backend/                   # Server-side modules
│   └── auth.js                # Authentication API routes
│
└── api/                       # Vercel serverless functions
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16 or higher — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- A **Firebase** project with Authentication and Realtime Database enabled

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/izhar-sms.git
cd izhar-sms
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
PORT=3000
```

### 4. Configure Firebase

Update the Firebase configuration in `public/js/firebase-config.js` with your own project credentials:

```javascript
window.SMS_FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
  databaseURL: 'https://YOUR_PROJECT.firebasedatabase.app/',
  measurementId: 'YOUR_MEASUREMENT_ID'
};
```

#### Firebase Setup Checklist

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project (or use an existing one).
2. Enable **Authentication** → Sign-in method → **Email/Password**.
3. Enable **Realtime Database** and set the following security rules for development:
   ```json
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null"
     }
   }
   ```
4. Copy your project's web config into `firebase-config.js`.

### 5. Start the Development Server

```bash
npm start
```

The server will start at **http://localhost:3000**.

---

## 🌐 Deployment (Vercel)

This project is pre-configured for **Vercel** deployment.

### Deploy via CLI

```bash
npm i -g vercel
vercel
```

### Deploy via GitHub

1. Push your code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Set the environment variables (`FIREBASE_API_KEY`, `PORT`) in the Vercel project settings.
4. Deploy — Vercel will automatically detect the configuration from `vercel.json`.

### Clean URLs

The `vercel.json` configuration provides clean URL rewrites:

| URL | Page |
|---|---|
| `/` | Landing page |
| `/login` | Login page |
| `/admin` | Admin Dashboard |
| `/resident` | Resident Dashboard |
| `/parking` | Parking Management |
| `/payments` | Payment Management |
| `/complaints` | Complaint System |
| `/notices` | Notice Board |

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Admin** | Full access — all dashboards, management modules, and notice creation |
| **Resident** | Resident dashboard, parking, payments, complaints, and notice viewing |

The sidebar and navigation automatically adapt based on the logged-in user's role.

---

## 🎨 Design System

- **Primary Color:** `#cb997e` (warm terracotta)
- **Font:** [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)
- **Sidebar:** White/cream, 230px width, with animated transitions
- **Navbar:** Fixed top bar with avatar dropdown
- **Layout:** Responsive with mobile sidebar drawer and backdrop overlay

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start the production server |
| `npm test` | Run tests (placeholder) |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 🙏 Acknowledgments

- [Bootstrap 5](https://getbootstrap.com/) — UI framework
- [Font Awesome](https://fontawesome.com/) — Icon library
- [Chart.js](https://www.chartjs.org/) — Data visualization
- [Firebase](https://firebase.google.com/) — Authentication & Database
- [Vercel](https://vercel.com/) — Hosting & Deployment

---

<p align="center">
  Built with ❤️ by the Izhar SMS Team
</p>
