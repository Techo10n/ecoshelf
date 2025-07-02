# EcoShelf

### A Chrome Extension for online shopping that calculates the emissions produced from shipping a product, recommending more sustainable alternatives with similar price points.

Instead of telling consumers to completely change what they're shopping for, our project aims to help users sort through the dozens of near identical products on sites such as Amazon and allow them to prioritize sustainability without sacrificing on functionality or price. When users find a product they like, our extension will notify them of any other vendors selling the same product that would produce less emissions when shipping it, making sure to stay within a similar price point range.

## Project Structure

This project is now organized into two separate Node.js projects:

- **`backend/`** - Express.js API server that handles OpenAI integration
- **`frontend/`** - WXT-based browser extension with React components

## Development Setup

### Backend Server

```bash
cd backend
npm install
npm run dev
```

The server will run on `http://localhost:8000` and provides the `/api/trim-title` endpoint.

### Frontend Extension

```bash
cd frontend
npm install
npm run dev
```

This will start the WXT development server and load the extension in development mode.

### Running Both Together

You can run both the backend server and frontend extension simultaneously. The extension will communicate with the backend API for OpenAI functionality.

## Environment Variables

Make sure to create a `.env` file in the `backend/` directory with:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

The built extension will be in `frontend/wxt-build/`.Shelf

### A Chrome Extension for online shopping that calculates the emissions produced from shipping a product, recommending more sustainable alternatives with similar price points.

Instead of telling consumers to completely change what they’re shopping for, our project aims to help users sort through the dozens of near identical products on sites such as Amazon and allow them to prioritize sustainability without sacrificing on functionality or price. When users find a product they like, our extension will notify them of any other vendors selling the same product that would produce less emissions when shipping it, making sure to stay within a similar price point range.
