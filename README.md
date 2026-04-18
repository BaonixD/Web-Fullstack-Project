# OneTake

OneTake is a web application for managing media production requests inside a team. Users can create photo, video, or design orders, attach a cover image, set a deadline, and discuss the work in an order chat. Methodists can publish news, review interview applications, assign team members, and update order statuses.

## Team

- Amzekhan Ilyas
- Askarova Akbota
- Bakhytzhan Amir

## Features

- User registration and login with username/email and password.
- User roles: guest, member, and methodist.
- Order creation with title, description, service type, deadline, and cover image.
- Order list with status-based filtering.
- Member assignment for orders.
- Order status updates with status history.
- Order chat through REST and WebSocket.
- File attachments in chat messages.
- News posts with images and videos.
- Interview applications with portfolio links, approval, rejection, and feedback.
- Notifications for assignments, messages, status updates, and interview decisions.
- User profile with avatar upload.
- Light and dark UI themes.

## Tech Stack

### Backend

- Python
- Django 5
- Django REST Framework
- Django Channels
- Token Authentication
- SQLite for local development

### Frontend

- Angular 21
- TypeScript
- RxJS
- Angular Router
- Standalone components
- CSS

## Project Structure

```text
.
├── backend/              # Django backend
│   ├── core/             # Project settings, URLs, ASGI/WSGI
│   ├── production/       # App models, API views, serializers, WebSocket logic
│   └── manage.py
├── frontend/             # Angular frontend
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── proxy.conf.json
├── requirements.txt      # Python dependencies
└── README.md
```

## Requirements

- Python 3.12+
- Node.js LTS
- npm

Use an LTS version of Node.js for Angular development. Odd-numbered, non-LTS Node.js versions can make the Angular builder unstable.

## Quick Start

### 1. Backend

Open the project root:

```bash
cd /Users/baonix/PycharmProjects/Web-Fullstack-Project
```

Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Apply database migrations:

```bash
python backend/manage.py migrate
```

Create an admin user if you need access to Django Admin:

```bash
python backend/manage.py createsuperuser
```

Run the backend server:

```bash
python backend/manage.py runserver 127.0.0.1:8000
```

The API will be available at:

```text
http://127.0.0.1:8000/api/
```

### 2. Frontend

Open a second terminal and go to the frontend directory:

```bash
cd /Users/baonix/PycharmProjects/Web-Fullstack-Project/frontend
```

Install frontend dependencies:

```bash
npm install
```

Run the Angular development server:

```bash
npm start
```

Open the app in your browser:

```text
http://localhost:4200/
```

## Common Commands

### Backend

```bash
python backend/manage.py check
python backend/manage.py makemigrations
python backend/manage.py migrate
python backend/manage.py runserver
```

### Frontend

```bash
cd frontend
npm start
npm run build
npm test
```

## API Overview

Main backend endpoints:

```text
POST   /api/register/                         register a user
POST   /api/login/                            log in
GET    /api/me/                               get current user
PATCH  /api/me/                               update avatar

GET    /api/orders/                           list orders
POST   /api/orders/                           create an order
GET    /api/orders/<id>/                      get order details
PUT    /api/orders/<id>/                      update an order
DELETE /api/orders/<id>/                      delete an order

GET    /api/orders/<id>/messages/             list order messages
POST   /api/orders/<id>/messages/             send an order message
GET    /api/orders/<id>/status-log/           get order status history

GET    /api/news/                             list news posts
POST   /api/news/                             create a news post
PUT    /api/news/<id>/                        update a news post
DELETE /api/news/<id>/                        delete a news post

GET    /api/members/                          list members
GET    /api/members/<id>/                     get member profile
DELETE /api/members/<id>/                     downgrade a member to guest

GET    /api/interviews/                       list interview applications
POST   /api/interviews/                       create an interview application
POST   /api/interviews/<id>/approve/          approve an interview application
POST   /api/interviews/<id>/reject/           reject an interview application

GET    /api/notifications/                    list notifications
POST   /api/notifications/<id>/read/          mark a notification as read
POST   /api/notifications/read-all/           mark all notifications as read
```

Order chat WebSocket:

```text
ws://127.0.0.1:8000/ws/orders/<order_id>/chat/?token=<token>
```

## Roles

- Guest: can register, create orders, and submit interview applications.
- Member: can view assigned orders and participate in order chats.
- Methodist: can manage orders, assign executors, update statuses, publish news, and review interview applications.

## Recommended Improvements

- Move `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, and CORS settings to environment variables.
- Add `Pillow` to dependencies because the project uses Django `ImageField`.
- Add file type and file size validation for uploads.
- Add status choices and transition validation for orders.
- Prevent regular users from setting `executor` or arbitrary `status` values when creating orders.
- Add backend tests for permissions, orders, interviews, notifications, and chat.
- Replace `InMemoryChannelLayer` with Redis for production.
- Make the WebSocket URL environment-based instead of hardcoding `127.0.0.1`.

## Status

The project is under active development.
