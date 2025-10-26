# ConnLink

A lightweight, wholesome social app built as a full‑stack reference: Vue 3 + Vite frontend, Node/Express backend, MongoDB persistence, Cloudinary for media, and Socket.IO for realtime chat.

## Overview
ConnLink provides core social features in a compact, extensible codebase: user accounts, feed with media, likes/comments/bookmarks, notifications, and 1:1 realtime chat with persisted messages. Designed as a starter or learning project for building social features and realtime interactions.

## Features
- User accounts: register, login, profile management (JWT-based).
- Social feed: create, edit, delete posts; image uploads via Cloudinary.
- Interactions: like, comment, bookmark posts.
- Notifications: server-driven notifications for interactions.
- Real-time chat: Socket.IO powered 1:1 messaging with message persistence.
- Search & discovery: basic user/feed lookup.
- Client state: Pinia stores for auth, posts, notifications, socket.
- Styling: Tailwind CSS with diagnostic utilities for development.

## Tech Stack
- Frontend: Vue 3, Vite, Vue Router, Pinia, Tailwind CSS
- Backend: Node.js, Express
- Realtime: Socket.IO
- Database: MongoDB (Mongoose)
- Storage: Cloudinary
- Auth: JWT tokens (client-side storage)

## Quick Links (key files)
- Frontend entry: frontend/src/main.js
- Router: frontend/src/router.js
- Pinia stores: frontend/src/stores/
- Tailwind test util: frontend/src/utils/tailwind-test.js
- Backend entry: backend/index.js
- Socket server: backend/socket/socket.js
- Models: backend/models/ (User, Post, Comment, Message, Notification)
- Controllers: backend/controllers/ (user, post, message, notification)
- Routes: backend/routes/

## Setup (local)
1. Backend
   - cd backend
   - copy .env.example -> .env and set MONGODB_URI, CLOUDINARY keys, JWT_SECRET, PORT
   - npm install
   - npm run dev (or node index.js)
2. Frontend
   - cd frontend
   - npm install
   - npm run dev

Default ports:
- Backend API: http://localhost:3000
- Frontend dev server: http://localhost:5173

## API (overview)
- /api/v1/user/* — register, login, profile
- /api/v1/post/* — create/read/update/delete posts
- /api/v1/message/* — send/fetch messages
- /api/v1/notification/* — notifications

## Notes
- Auth tokens handled client-side (see frontend/src/stores/auth.js).
- Tailwind diagnostics can be run from the browser console (window.tailwindTest.runTailwindDiagnostics()).
- Useful components: frontend/src/components/HomeFeed.vue, Post.vue, ChatPage.vue.

## Contributing
Fork, create a feature branch, run the dev servers, and open a PR. Keep components focused and reuse Pinia stores.

## License
Choose a license (e.g., MIT) and add LICENSE file.
