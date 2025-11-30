# AQW Skins Frontend

Frontend React application for AQW Skins Loot Box System.

## Features

- 🎨 Modern UI with TailwindCSS
- 🌍 Multi-language support (EN, PT-BR, ES, FIL)
- 💰 Multi-currency display
- 🎲 Animated loot box openings
- 📦 Inventory management
- 🔄 Item exchanger
- 💳 Deposit system
- 🎫 Support tickets
- 👑 Admin dashboard

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Environment Variables

Create `.env` file:

```
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

## Structure

```
src/
├── components/     # Reusable components
├── pages/          # Page components
├── hooks/          # Custom hooks
├── services/       # API services
├── stores/         # Zustand stores
├── utils/          # Utilities
├── locales/        # i18n translations
└── assets/         # Static assets
```
