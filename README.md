# Pulari Restaurant Website

A modern, responsive restaurant website built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- 🍽️ **Interactive Menu** - Kerala cuisine menu with images and allergen information
- 🛒 **Shopping Cart** - Production-ready cart with localStorage persistence
- 📱 **Fully Responsive** - Optimized for all screen sizes
- 💬 **WhatsApp Integration** - Floating chat button for direct customer contact
- 🎨 **Beautiful UI** - Gradient designs, animations, and smooth transitions
- 🔐 **Authentication Ready** - User account system with Supabase integration

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (configured)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

## Deployment on Vercel

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository: `ANSHU-Ireland/fais-hotel-2`
4. Vercel will auto-detect Vite configuration
5. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables (Optional)

If using Supabase features, add these in Vercel dashboard:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

## Project Structure

```
src/
├── components/       # Reusable components (Navigation, etc.)
├── contexts/        # React contexts (Auth, Cart)
├── pages/          # Page components (Home, Menu, Cart, etc.)
├── lib/            # Utilities and configurations
└── assets/         # Images and static files
```

## Configuration Files

- `vercel.json` - Vercel deployment configuration with SPA routing
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS customization
- `tsconfig.json` - TypeScript configuration

## Restaurant Information

- **Name**: Pulari Restaurant
- **Location**: Temple Street, Dublin 2, Ireland
- **Phone**: 087 973 8186
- **Hours**: Monday - Sunday, 11:00 AM - 3:00 AM
- **Email**: info@pularirestaurant.ie

## License

© 2025 Pulari Restaurant. All rights reserved.
