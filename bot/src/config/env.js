const dotenv = require('dotenv');

dotenv.config()

const ENV = {
    discord: {
        token: process.env.CLIENT_TOKEN || "discord token"
    },
    verify: {
        studentLink: process.env.VERIFY_STUDENT_LINK || "https://example.com/verify/",
        authToken: process.env.VERIFY_AUTH_TOKEN || "token"
    }
}

module.exports = ENV;