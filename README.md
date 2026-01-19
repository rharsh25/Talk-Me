💬 Talk Me – Personal Chat App (Web + Mobile)

A secure personal chat application built with Web (Next.js) and Mobile (React Native) using an AI-assisted workflow.
The app focuses on privacy, real-time messaging, QR-based login, backup, and offline sync.

🚀 Tech Stack
🌐 Web App
Next.js (App Router)
Socket.IO Client
Axios
CryptoJS (Encryption)

📱 Mobile App
React Native (Expo)
Socket.IO Client
Axios
Expo Camera (QR Scanner)

🖥 Backend
Node.js + Express
MongoDB
Socket.IO
JWT Authentication

📦 How to Run the Project
🔧 Backend
cd backend
npm install
npm run dev

Server runs on:
http://localhost:4000

🌐 Web App
cd web
npm install
npm run dev

Open in browser:
http://localhost:3000

📱 Mobile App
cd mobile
npm install
npx expo start

Scan QR from Expo Go.

🔑 How to Use
✅ Register & Login (Web)
Register using email and password.

Login redirects to the chat screen.
📷 Login on Mobile Using QR

Login on Web.
Click Login via QR button.

QR code appears on screen.
Open Mobile App → Tap Login with QR.
Scan QR code → Mobile logs in automatically.

✔ Single-use token
✔ Short expiry
✔ Secure

💬 Chat (Web + Mobile)
Real-time messaging.
Messages sync between Web and Mobile.

🔐 End-to-End Encryption
Messages are encrypted on the client before sending.
Only user devices can decrypt messages.
Server never reads plaintext messages.

🔄 Session Handling
JWT-based authentication.
Session restore on refresh.
Token refresh supported.

💾 Backup & Restore
Export chat history as .txt file.
Import backup to restore messages.

🤖 AI Usage

AI tools were used for:
Architecture planning
Debugging and optimization
Encryption flow design
QR login workflow
UI/UX improvements

All logic was reviewed and customized manually.

🎥 Video Walkthrough

📌 Part 1 
👉 https://drive.google.com/file/d/1zDgeOCvoRoW_9EiStYf9XUJ1ObGyCihG/view?usp=drive_link

📌 Part 2 
👉 https://drive.google.com/file/d/1jwuEa8vy3L_7wbN4yYfoUQnWzmSy7Wfl/view?usp=drive_link

📂 GitHub Repository
📌 Repository Link:
👉 https://github.com/rharsh25/Talk-Me
