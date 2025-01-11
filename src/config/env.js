const dotenv = require('dotenv');

dotenv.config()

const ENV = {
    discord: {
        token: process.env.CLIENT_TOKEN || "discord token"
    }
}

export default ENV