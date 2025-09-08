# AO Place: The First Hyperbeam Game

A collaborative pixel art canvas running on AO's Hyperbeam - a decentralized game engine for real-time multiplayer experiences.

## Features

- **Real-time Collaborative Canvas**: Place pixels and create art with other users in real-time
- **Sticker System**: Design custom 3x3 stickers and place them on the canvas
- **Wallet Integration**: Connect your Arweave wallet to participate
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modular Architecture**: Clean, maintainable codebase with reusable components

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Styling**: CSS Modules for component-scoped styles
- **Backend**: AO Hyperbeam Network
- **Blockchain**: Arweave for decentralized storage
- **Code Quality**: ESLint + Prettier for consistent formatting

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Arweave wallet (for placing pixels)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Place

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Canvas/          # Main canvas component
│   ├── CanvasGrid/      # Grid display component
│   ├── ColorPicker/     # Color selection component
│   └── StickerEditor/   # Sticker creation component
├── hooks/               # Custom React hooks
│   ├── useCanvas.ts     # Canvas operations hook
│   └── useSticker.ts    # Sticker management hook
└── types/               # TypeScript type definitions
```

## How to Play

1. **Connect Your Wallet**: Use an Arweave wallet to participate
2. **Choose Your Mode**: Select between single pixel placement or sticker creation
3. **Select Colors**: Pick from the color palette
4. **Create & Place**: Click to place pixels or design and apply stickers

## Architecture Highlights

- **Modular Components**: Canvas functionality split into focused, reusable components
- **Custom Hooks**: Business logic separated into custom hooks for better testability
- **Type Safety**: Full TypeScript coverage for better development experience
- **Performance**: Optimized with React 19 and efficient state management
- **Clean Code**: ESLint and Prettier ensure consistent code quality

## Deployment

For deployment instructions, see the [Deployment Guide](docs/deployment.md).

## Contributing

Contributions are welcome! Please ensure your code follows the established patterns:

1. Use TypeScript for all new files
2. Follow the existing component structure
3. Run `npm run lint` and `npm run format` before committing
4. Add proper type definitions for new features

## License

See [LICENSE](LICENSE) for more information.
