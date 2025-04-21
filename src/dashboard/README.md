# Network Forensics - Suricata Monitor

A real-time monitoring application for Suricata IDS (Intrusion Detection System) logs, providing visualization and analysis tools for network security events.

## Features

- Real-time log monitoring and visualization
- Event filtering and searching
- Statistical analysis of network traffic and security events
- Interactive dashboard with charts and graphs
- Socket-based real-time updates

## Tech Stack

- **Frontend**: React, TypeScript, Chakra UI, Recharts, React Query
- **Backend**: Node.js, Express, Socket.io
- **Build Tools**: Vite, TypeScript
- **Styling**: TailwindCSS

## Prerequisites

- Node.js (v16+)
- npm or yarn
- **Suricata IDS** must be installed and running on the system with logs at `/var/log/suricata/eve.json`

## Installation

Clone the repository:
```bash
git clone https://github.com/Black1hp/Network-Forensics.git
cd Network-Forensics
```

Install dependencies:
```bash
npm install
```

## Suricata Configuration

**IMPORTANT: This application requires Suricata to be installed and running with logs configured at `/var/log/suricata/eve.json`.**

1. If you haven't already, install Suricata:
```bash
sudo apt-get update
sudo apt-get install suricata
```

2. Configure Suricata using the provided configuration file:
```bash
sudo cp backend/suricata.yaml /etc/suricata/
sudo systemctl restart suricata
```

3. Verify Suricata is running and generating logs:
```bash
sudo systemctl status suricata
ls -la /var/log/suricata/eve.json
```

## Usage

### Development

Start the backend server:
```bash
npm run backend
```

Start the frontend development server:
```bash
npm run dev
```

### Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

- `/src` - Frontend React application
  - `/components` - React components
  - `/hooks` - Custom React hooks
  - `/services` - API service functions
  - `/types` - TypeScript type definitions
  - `/utils` - Utility functions
- `/backend` - Node.js server
  - `server.js` - Express server setup and socket logic
  - `suricata.yaml` - Sample Suricata configuration

## License

See the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request