# Secure File Storage System & Role-Based Access Control

A premium, state-of-the-art secure file storage solution featuring military-grade encryption, robust authentication, and fine-grained access control.

## 🚀 Objectives
- **End-to-End Security**: Implement AES-256-GCM encryption for all stored files.
- **Role-Based Access Control (RBAC)**: Manage permissions for Admins, Users, and Viewers.
- **Activity Monitoring**: Track all user actions (uploads, downloads, sharing) via a centralized logging system.
- **Seamless Sharing**: Enable users to share files with specific permissions.
- **Modern User Experience**: Provide a responsive, glassmorphism-inspired UI built with Next.js and Tailwind CSS.

## 🏗️ Architecture
The system follows a modern decoupled architecture:

- **Frontend**: [Next.js](https://nextjs.org/) (React)
  - Responsive design with Tailwind CSS.
  - JWT-based session management.
  - Real-time UI updates for activity logs and file lists.
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
  - Asynchronous request handling.
  - JWT Authentication (OAuth2 with Password Bearer).
  - SQLAlchemy ORM for database interactions.
- **Database**: SQLite (Development) / Scalable to PostgreSQL.
- **Security Layer**:
  - **Encryption**: `pycryptodome` (AES-256-GCM) for file-at-rest protection.
  - **Hashing**: `passlib` (BCrypt) for secure password storage.
  - **Auth**: `python-jose` for JSON Web Token processing.

## 📂 Project Structure
```text
secure-file-storage/
├── backend/                # FastAPI Application
│   ├── auth/               # JWT & Password Utilities
│   ├── config/             # App Settings & Environment
│   ├── database/           # Models & Session Management
│   ├── encryption/         # AES Encryption/Decryption Logic
│   ├── models/             # Pydantic Schemas
│   ├── storage_data/       # (Git Ignored) Encrypted file chunks
│   ├── main.py             # API Entry Point
│   └── requirements.txt    # Python Dependencies
├── frontend/               # Next.js Application
│   ├── src/                # React Components & Pages
│   ├── public/             # Static Assets
│   └── package.json        # Node.js Dependencies
└── run_demo.bat            # Windows Shortcut to start both servers
```

## 🛠️ Commands to Run

### 1. Prerequisites
- Python 3.9+
- Node.js 18+

### 2. Automatic Start (Windows)
Double-click `run_demo.bat` in the `secure-file-storage` folder. This will automatically open two command prompts for the backend and frontend.

### 3. Manual Start

#### **Backend**
```powershell
cd secure-file-storage/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

#### **Frontend**
```powershell
cd secure-file-storage/frontend
npm install
npm run dev
```
- Web Interface: [http://localhost:3000](http://localhost:3000)

## 💡 Learning Points
- **GCM Mode Encryption**: Why using GCM (Galois/Counter Mode) provides both confidentiality and data integrity compared to standard CBC mode.
- **Bearer Token Pattern**: How to securely handle authentication in a decoupled application.
- **SQLAlchemy Relational Mapping**: Understanding the relationship between Users, Files, and Permissions.
- **Next.js Server Components**: Leveraging modern React patterns for better performance and SEO.

## 📝 Demo Instructions
1. Open [http://localhost:3000](http://localhost:3000).
2. Click **"Create Account"** and register as an **Admin**.
3. Log in to access the **Dashboard**.
4. **Upload** a file: It will be encrypted before being saved to the `storage_data` folder on the server.
5. **Share** the file with another user's email.
6. Visit the **Admin Panel** to view system-wide logs and user roles.
