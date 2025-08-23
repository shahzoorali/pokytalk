# Pokytalk - Voice Chat with Random People

A real-time voice chat application that connects you with random people around the world. Built with Next.js, Node.js, Socket.io, and WebRTC.

## Features

- 🎤 **Voice-only chat** - High-quality audio conversations
- 🌍 **Random matching** - Connect with people worldwide
- 📱 **Mobile-first design** - Works perfectly on all devices
- 💬 **Text chat sidebar** - Optional text messaging during calls
- 🎛️ **Audio controls** - Mute/unmute and audio level indicators
- 🔍 **Smart filtering** - Age and country-based matching
- ⚡ **Real-time stats** - Live user count and active calls
- 🚀 **Fast connections** - Optimized WebRTC peer connections

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Socket.io Client** - Real-time communication
- **Simple-Peer** - WebRTC peer connections
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **TypeScript** - Type-safe development
- **Axios** - HTTP client for location detection

### Infrastructure
- **WebRTC** - Peer-to-peer audio streaming
- **STUN Servers** - NAT traversal
- **Docker** - Containerization
- **Monorepo** - Shared types and utilities

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pokytalk
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Build shared package**
   ```bash
   cd shared && npm run build && cd ..
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

### Docker Development

1. **Build and start services**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Project Structure

```
pokytalk/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
│   └── public/             # Static assets
├── backend/                 # Express server
│   ├── src/
│   │   ├── index.ts        # Server entry point
│   │   ├── socketManager.ts # Socket.io handlers
│   │   ├── userManager.ts  # User management
│   │   ├── callManager.ts  # Call sessions
│   │   └── statsManager.ts # Server statistics
│   └── Dockerfile
├── shared/                  # Shared types and utilities
│   ├── src/
│   │   └── types.ts        # TypeScript interfaces
│   └── package.json
├── docker-compose.yml       # Docker services
└── README.md
```

## Usage

### Starting a Call

1. **Open the application** in your browser
2. **Allow microphone access** when prompted
3. **Set optional filters** (age, country)
4. **Click "Start Voice Chat"**
5. **Wait for matching** with another user
6. **Start talking!**

### During a Call

- **Mute/Unmute**: Click the microphone button
- **End Call**: Click the red X button to skip to next person
- **Text Chat**: Click the message icon to open text chat sidebar
- **Audio Levels**: Monitor your and your partner's audio levels

### Features

- **Age Filtering**: Select your birth year for age-based matching
- **Country Filtering**: Choose specific countries for location-based matching
- **Real-time Stats**: See online users and active calls
- **Session Persistence**: Text messages persist for the entire call session
- **Mobile Responsive**: Works perfectly on mobile devices

## Environment Variables

### Backend (.env)
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and statistics.

### Location Detection
```
GET /api/location
```
Returns user's country based on IP address.

## WebSocket Events

### Client to Server
- `user:connect` - Connect user with age/country
- `call:request` - Request a call with optional filters
- `call:end` - End current call
- `chat:message` - Send text message
- `webrtc:offer/answer/ice-candidate` - WebRTC signaling

### Server to Client
- `user:connect` - User connected confirmation
- `call:matched` - Call partner found
- `call:ended` - Call ended notification
- `chat:message` - Receive text message
- `stats:update` - Server statistics update

## Deployment

### Production Build

1. **Build all packages**
   ```bash
   npm run build
   ```

2. **Start production servers**
   ```bash
   npm run start
   ```

### AWS Deployment

1. **Set up AWS infrastructure** (EC2, ECS, or Lambda)
2. **Configure environment variables**
3. **Set up STUN/TURN servers** for WebRTC
4. **Deploy using your preferred method**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.

---

**Pokytalk** - Connect with the world through voice! 🎤🌍
