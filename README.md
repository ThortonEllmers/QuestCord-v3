# QuestCord

A Discord RPG bot that transforms servers into a virtual world where users can complete quests, battle bosses, and compete on a global leaderboard.

## Features

- **Daily Quest System**: 5 unique quests per server, rotating daily at midnight NZ time
- **Boss Battles**: Random boss spawns across servers with team-based combat
- **Economy System**: Earn currency and gems from quests and bosses
- **Global Leaderboard**: Monthly competition with rewards for top 3 players
- **Web Dashboard**: Professional landing page with live activity feed
- **Server Management**: Opt-in/opt-out system for server owners
- **Role-Based Staff System**: Automatic staff role synchronization from support server

## Technology Stack

- **Backend**: Node.js with Discord.js v14
- **Database**: SQLite with better-sqlite3 (local, stable, corruption-resistant)
- **Web Server**: Express with EJS templating
- **Real-time Updates**: WebSockets for live activity feed
- **Scheduling**: node-cron for quest rotation and boss spawns
- **Timezone**: moment-timezone for NZ timezone support

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- Discord Bot Token
- Discord Application Client ID

### Setup Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd "QuestCord V3"
```

2. Install dependencies:
```bash
npm install
```

3. Create your `.env` file:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
SUPPORT_SERVER_ID=1404523107544469545
OWNER_ID=your_discord_id_here
SESSION_SECRET=random_secret_here
NODE_ENV=development
```

5. Configure `config.json` as needed (ports, rewards, timings, etc.)

6. Register slash commands:
```bash
node src/bot/deploy-commands.js
```

7. Start the bot:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Configuration

### Port Configuration

- **Development**: Port 3000 (default)
- **Production**: Port 80 (configurable in `config.json`)

The application automatically uses the correct port based on `NODE_ENV`.

### Quest System

- **Quests per server**: 5 (configurable)
- **Rotation time**: Midnight NZ time (Pacific/Auckland timezone)
- **Quest types**: Combat, Gathering, Exploration, Delivery, Social

### Boss System

- **Max concurrent bosses**: 1
- **Spawn duration**: 60 minutes
- **Cooldown**: 10 minutes
- **Spawn delay range**: 30-120 minutes (randomized)

### Leaderboard

- **Reset day**: 1st of each month
- **Top 3 rewards**: Configurable in `config.json`

## Commands

### User Commands

- `/help` - View all available commands
- `/tutorial` - Interactive tutorial for new users
- `/quests` - View available quests in current server
- `/complete <quest>` - Complete a quest
- `/travel` - View available servers to travel to
- `/attack` - Attack the active boss
- `/boss` - View current boss status
- `/profile [user]` - View user profile and stats
- `/balance` - Check currency and gems
- `/leaderboard` - View global leaderboard
- `/rank` - Check your current rank

### Server Owner Commands

- `/optin` - Enable quests in your server
- `/optout` - Disable quests in your server

### Staff Commands

Staff members with the Developer or Staff role in the support server can use:

- `/admin wipe-user <user>` - Completely delete a user's data (Developer only, irreversible)
- `/admin reset-user <user>` - Reset user progress to defaults
- `/admin give-currency <user> <amount>` - Give currency to a user
- `/admin give-gems <user> <amount>` - Give gems to a user
- `/admin set-level <user> <level>` - Set a user's level
- `/admin view-user <user>` - View detailed user information

All admin actions are logged to the console for audit purposes.

## Database

### Automatic Features

- **Corruption Protection**: WAL mode enabled, automatic integrity checks
- **Automatic Backups**: Daily backups at 3 AM (keeps 7 days)
- **Optimization**: Runs every 6 hours automatically
- **Migrations**: Automatic migration system for easy updates

### Database Location

- Database file: `data/questcord.db`
- Backups: `backups/` directory

### Adding New Features

To add new database features:

1. Create a migration file:
```bash
node -e "require('./src/database/utils').MigrationManager.prototype.createMigration('feature-name')"
```

2. Edit the generated migration file in `migrations/` directory
3. Run the application - migrations run automatically on startup

## Web Dashboard

The web dashboard is accessible at:
- Development: `http://localhost:3000`
- Production: `http://your-domain.com`

### Features

- Real-time server statistics
- Global leaderboard display
- Live activity feed (WebSocket-powered)
- Staff team display
- FAQ section
- Professional theme matching questcord.fun

## Staff System

Staff roles are automatically synchronized from the support server:
- Developer role: 1404561244555448381
- Staff role: 1404563334354960494

Staff members are displayed on the website with their respective roles.

## Security Features

- Rate limiting on API endpoints
- Helmet.js security headers
- CORS protection
- Input validation and sanitization
- Secure WebSocket connections

## Maintenance

### Manual Database Maintenance

Access the maintenance functions in your code:
```javascript
const { DatabaseMaintenance } = require('./src/database/maintenance');
const result = DatabaseMaintenance.runManualMaintenance();
```

### Viewing Statistics

Database statistics are logged automatically and accessible via:
```javascript
const { DatabaseUtils } = require('./src/database/utils');
const stats = DatabaseUtils.getStats();
```

## Troubleshooting

### Bot not responding to commands

1. Ensure commands are registered: `node src/bot/deploy-commands.js`
2. Check bot has necessary permissions in Discord Developer Portal
3. Verify bot token in `.env` is correct

### Database errors

1. Check database integrity: Run the application - integrity checks run automatically
2. Restore from backup if needed (backups in `backups/` directory)
3. Ensure `data/` directory has write permissions

### WebSocket connection issues

1. Check firewall settings for WebSocket connections
2. Verify correct protocol (ws:// for http, wss:// for https)
3. Check browser console for connection errors

## Project Structure

```
QuestCord V3/
├── src/
│   ├── bot/
│   │   ├── commands/        # Slash commands
│   │   ├── events/          # Discord event handlers
│   │   ├── utils/           # Bot utilities (quest/boss managers)
│   │   └── index.js         # Bot client
│   ├── database/
│   │   ├── models.js        # Database models
│   │   ├── schema.js        # Database schema
│   │   ├── utils.js         # Database utilities
│   │   └── maintenance.js   # Automatic maintenance
│   ├── web/
│   │   ├── routes/          # Express routes
│   │   ├── views/           # EJS templates
│   │   ├── middleware/      # Express middleware
│   │   └── server.js        # Web server
│   ├── utils/               # Shared utilities
│   └── index.js             # Main entry point
├── public/
│   ├── css/                 # Stylesheets
│   └── js/                  # Client-side JavaScript
├── migrations/              # Database migrations
├── data/                    # SQLite database
├── backups/                 # Database backups
├── config.json              # Application configuration
├── .env                     # Environment variables
└── package.json             # Dependencies

```

## Deployment

### Digital Ocean VPS

This project is fully compatible with Digital Ocean. See [DIGITALOCEAN.md](DIGITALOCEAN.md) for complete deployment instructions.

Quick deploy on Digital Ocean:
1. Create Ubuntu 22.04 droplet
2. Install Node.js 18+
3. Install PM2: `npm install -g pm2`
4. Clone project and run `npm install`
5. Configure `.env` file
6. Start with PM2: `pm2 start ecosystem.config.js --env production`

### IP Banning

Website includes IP banning system to prevent abuse:

**Via Discord:**
- `/ipban add <ip> <reason>` - Ban an IP
- `/ipban remove <ip>` - Unban an IP
- `/ipban list` - View all bans
- `/ipban check <ip>` - Check ban status

**Features:**
- Automatic threat detection on 404 pages
- Permanent or temporary bans
- Custom ban reasons
- Shows banned users who banned them and why
- All bans logged for audit

**Banned users see:**
- Professional banned page
- Ban reason
- Who banned them
- Ban duration (permanent or expiry time)
- Contact information

## Contributing

This is a private project for QuestCord. For issues or suggestions, contact the developers.

## Credits

Made with care by CUB and Scarlett

## License

ISC
