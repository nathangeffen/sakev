import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createServer } from 'node:http';
import express from 'express';
export const cookieSession = require('cookie-session')
export const cookieParser = require('cookie-parser');

export const nunjucks = require('nunjucks');
import { Server } from 'socket.io';
import Database from 'better-sqlite3';
export const nodemailer = require('nodemailer');

let __dirname = dirname(fileURLToPath(import.meta.url));
if (__dirname.endsWith('/js')) {
  __dirname = join(__dirname, '..');
};

const database = process.env.DB;

export const port = Number(process.env.PORT || 0);
export const app = express();
export const server = createServer(app);
export const io = new Server(server);
export const db = new Database(database);


app.use(express.json());
app.use(express.urlencoded({ extended: true }))

const viewDir = join(__dirname, 'src/views');

nunjucks.configure(viewDir, {
  autoescape: true,
  express: app
});

app.use(express.static(__dirname));
