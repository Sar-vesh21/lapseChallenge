# Social Feed Web Client

This is a React-based web client for testing the Social Feed API implementation. It provides a simple interface to view and interact with the feed.

## Features

- Infinite scroll feed implementation
- Real-time feed item marking as read
- Responsive design
- TypeScript support
- Modern UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Docker

To run the web client using Docker:

```bash
docker build -t social-feed-web .
docker run -p 5173:5173 social-feed-web
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Project Structure

```
src/
  ├── App.tsx        # Main application component
  ├── main.tsx       # Application entry point
  ├── index.css      # Global styles
  └── types/         # TypeScript type definitions
```

### API Integration

The web client expects the backend API to be available at `http://localhost:3000` and implements the following endpoints:

1. Get Feed Items:
   - `GET /api/feed?cursor={cursor}&limit={limit}`

2. Mark Item as Read:
   - `POST /api/feed/items/:itemId/read`

The Vite development server is configured to proxy these requests to the backend. 