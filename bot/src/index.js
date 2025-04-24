require('dotenv').config();
const fs = require('fs');
const DiscordBot = require('./client/DiscordBot');
const { database_prisma_setup } = require('./utils/Database');

fs.writeFileSync('./terminal.log', '', 'utf-8');
const client = new DiscordBot();

// เริ่มการเชื่อมต่อฐานข้อมูล
database_prisma_setup();

module.exports = client;

client.connect();

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);