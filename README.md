# School Facility Condition Reporting & Repair Tracking Portal

A full-stack web application built to report, monitor, and resolve physical infrastructure issues in schools (broken furniture, unsafe classrooms, sanitation, electrical hazards). This portal increases accountability and bridges the communication gap between parents, teachers, and school administrations.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, React Router, Lucide Icons, HTML5, Vanilla CSS3 (Custom design tokens, glassmorphism theme, responsiveness).
- **Backend**: Node.js, Express.js REST API.
- **Database**: MongoDB (via Mongoose schemas) with a **Local JSON File Fallback DB** to allow running the app out-of-the-box without installing MongoDB.
- **Authentication**: Secure JWT Token-based authentication.

---

## 🚀 Getting Started

### 📋 Prerequisites

- [Node.js](https://nodejs.org/) installed (v18+ recommended)

### 📥 Setup Instructions

1. **Clone or Open the Workspace** in your IDE.
2. The folder structure should contain:
   - `client/` - React frontend application.
   - `server/` - Express backend API.

3. **Install Dependencies**:
   
   Run in the `client` directory:
   ```bash
   cd client
   npm install
   ```

   Run in the `server` directory:
   ```bash
   cd server
   npm install
   ```

### ⚡ Running the Application

To run the full-stack portal locally, you need to start both the backend server and the frontend client.

#### 1. Start the Backend Server:
```bash
cd server
npm start
```
*Note: The server runs on port `5000` by default. If no `MONGO_URI` is supplied in the `.env` file, the server will automatically create and connect to a local database file at `server/data/db.json` and work immediately.*

#### 2. Start the Frontend Client:
```bash
cd client
npm run dev
```
*The client runs on port `3000` and automatically proxies `/api` calls to the backend server.*

Now, open your browser and navigate to: **`http://localhost:3000`**

---

## 👤 Demo & Sample Accounts

For easy testing, the following pre-configured demo accounts are available:

### 🔑 Demo Credentials
* **School Administrator (Admin)**:
  - **Email**: `admin@school.org`
  - **Password**: `admin123`
  - **School ID**: `SCH-90210`
* **Parent / Teacher (User)**:
  - **Email**: `parent@school.org`
  - **Password**: `parent123`
  - **School ID**: `SCH-90210`

### 🧪 Manual Testing Workflows
Follow these instructions to test the different user roles:

### Workflow A: Reporting an Issue (Parent/Teacher Flow)
1. Navigate to `http://localhost:3000/login` and click **"Register Now"**.
2. Create an account with the role **Parent** or **Teacher**. Use School ID: `SCH-90210`.
3. Fill out the **"Report Issue"** form (e.g., "Water Leak in Washroom" or "Broken Classroom Desks").
4. Upload a photo of the condition (supports file selector with preview) and submit.
5. You can view your reported issue on the **Dashboard** and click **"Track Progress"** to view its timeline.

### Workflow B: Resolving the Issue (Admin Flow)
1. Click **"Log Out"** in the navbar.
2. Click **"Register Now"** to create a new account with the role **School Administrator** (Admin). Use the same School ID: `SCH-90210`.
3. Once logged in, you will be taken to the **Admin Panel**.
4. View overall metrics (resolved rate, reports count chart).
5. Locate the reported issue in the directory table and click **"Manage"**.
6. On the details page, use the **Admin Action Center** to:
   - Change Status to **In Progress** or **Resolved**.
   - Assign repair staff (e.g. "Electrician Bob").
   - Set estimated resolution time (e.g. "3 hours").
   - Input repair notes.
7. Click **"Commit Repair Update"** to save.

### Workflow C: Verification of Status Alerts (User Flow)
1. Log out of the admin panel and sign back into the Parent/Teacher account created in Workflow A.
2. Check the **"Alerts"** page or look at the navigation bar bell icon.
3. You will see a notification alert indicating that the reported issue status was updated.
4. Click **"Track"** to view the timeline showing the administrator's updates, assigned staff, and resolution time.
5. In the Admin Panel, administrators can also click **"Export Repair Report (CSV)"** to instantly download a spreadsheet of the repair logs.

---

## 📂 Architecture Details

### Database Fallback Strategy (`server/config/db.js`)
If `MONGO_URI` is defined in `server/.env`, Mongoose connects to MongoDB. Otherwise, the database client initializes a local JSON file (`server/data/db.json`) and replicates standard schema operations:
- `db.users.create` / `db.users.findOne`
- `db.issues.create` / `db.issues.find` / `db.issues.findByIdAndUpdate`
- `db.notifications.create` / `db.notifications.find` / `db.notifications.findByIdAndUpdate`

This allows seamless setup and full database capabilities locally.
