# Network Topology Visualization

A network topology visualization tool built with React Flow, allowing users to create, visualize, and manage network topologies interactively.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

## Project Structure

The project consists of two main parts:
- Client: React-based frontend using React Flow for topology visualization
- Server: Express.js backend for handling configuration and assets

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Running the Application

The application requires both the client and server to be running.

### Start the Server
```bash
# Development mode with auto-reload
npm run dev:server

# Production mode
npm run start:server
```

### Start the Client
```bash
# Development mode
npm run start:client

# Build for production
npm run build
```

The client will be available at `http://localhost:5173` and the server at `http://localhost:3000`.

## Development

- Client code is in the `src/` directory
- Server code is in the `server/src/` directory
- Network topology components are in `src/components/`
- Server routes are defined in `server/src/routes/`

## Building for Production

To create a production build:

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Features

- Interactive network topology visualization
- Drag-and-drop interface for creating network diagrams
- Custom node types for network devices
- Configuration management
- Icon management for network devices

## Technologies Used

- React
- React Flow
- TypeScript
- Express.js
- Node.js

## url to load config
[text](http://localhost:5173/?restore=/configs/network-config-1739670158423.json)
