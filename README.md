# Dashboard System
Dashboard system that has login with other features, built in Node.js v16 and React.js v18

## How to run locally

### Setting up project
- All that needs to be added is the `.env` file, which inherits from the provided `env.template` file. This file must be located in the root directory of your server and looks like this:
```env
# Mysql Database
DATABASE_HOST="127.0.0.1"
DATABASE_USER="root"
DATABASE_PASSWORD="password"
DATABASE_NAME="voidDashboard"

# Server (API) port
SERVER_PORT=9001

# Session settings
SESSION_SECRETS="SECRET_1 SECRET_2 SECRET_3 SECRET_4"
```

### Installation & Run
1. Install the dependencies and start the server:
```bash
cd client && npm install && cd ../server && npm install && node .
```

2. To start the client, open the second console from the root directory and run:
```bash
cd client && npm start
```
