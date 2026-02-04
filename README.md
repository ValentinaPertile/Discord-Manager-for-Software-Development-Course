# Discord Dashboard Manager (DiscordPAGE) 🤖🌐

A professional, scalable, and responsive web interface designed to serve as a centralized management dashboard for a custom Discord Bot. This platform bridges the gap between server administrators and bot configuration through a seamless web experience.

## Project Overview
The **DiscordPAGE** system provides a robust administrative interface where users can authenticate via **Discord OAuth2**. Once logged in, administrators can manage servers where they have elevated permissions, enabling them to invite, configure, and monitor the bot's activities in real-time.

### Key Technical Features:
- **Secure Authentication:** Implements the **OAuth2 protocol** for safe and reliable user identity verification via Discord.
- [cite_start]**Real-Time Synchronization:** Utilizes **WebSockets (ws)** to maintain a persistent connection between the web frontend and the bot backend, ensuring live status updates[cite: 2].
- [cite_start]**Dynamic Data Visualization:** Leverages modern frontend tools to display server metrics, member counts, and audit logs dynamically[cite: 2].
- [cite_start]**Scalable Architecture:** Designed with a clear separation between the **React-based frontend** and the **Node.js backend**, allowing for independent scaling of services[cite: 2].

## Tech Stack
- [cite_start]**Frontend:** React 19 + Vite (for high-performance HMR)[cite: 2].
- [cite_start]**Backend:** Node.js with **Discord.js v14** for core bot interactions[cite: 2].
- [cite_start]**Communication:** WebSockets (WS) for bidirectional real-time data flow[cite: 2].
- [cite_start]**State & Routing:** React Router v7 for seamless client-side navigation[cite: 2].
- [cite_start]**Environment Management:** Dotenv for secure handling of sensitive credentials like `DISCORD_BOT_TOKEN`[cite: 2, 3].

## System Architecture
- [cite_start]`bot.js`: The core engine handling Discord events (Guild joins, Audit logs, and Commands) and WebSocket broadcasting[cite: 2].
- [cite_start]`src/`: React frontend source code, including the administration dashboard[cite: 2].
- [cite_start]`.env`: Secure storage for bot tokens and environment variables[cite: 3].
- [cite_start]`package.json`: Orchestrates dependencies including `discord.js`, `react`, and `vite`[cite: 2].

## Installation & Setup
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/ValentinaPertile/DiscordPAGE.git](https://github.com/ValentinaPertile/DiscordPAGE.git)

2. Create a .env file in the root directory and add your bot token:
DISCORD_BOT_TOKEN=your_token_here

3. npm install

4. Start the Bot/Backend: node bot.js
Start the Web Dashboard: npm run dev


##Development Team
- Valentina Pértile de la Vega
- Valentino Chaippini
- Juan Ignacio Wilt
- Luana Suarez