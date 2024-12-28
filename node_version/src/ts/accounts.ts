import { Request, Response } from 'express';
import { port, app, server, io, db, cookieParser } from "./server.js";
import { join } from 'node:path';
import { SECRET_KEY, ACCOUNTS_ROOT } from "./local_settings.js";
import { randomBytes } from 'node:crypto';

app.use(cookieParser(SECRET_KEY));

const ACCOUNTS_URL_ROOT = `/${ACCOUNTS_ROOT}`;
const loginURL = join(ACCOUNTS_URL_ROOT, '/login');
const loginView = join(ACCOUNTS_ROOT, '/login.html');
const alreadyLoggedInView = join(ACCOUNTS_ROOT, '/already_logged_in.html');
const logoutURL = join(ACCOUNTS_URL_ROOT, '/logout');
const logoutView = join(ACCOUNTS_ROOT, '/logout.html');
const forceLogoutURL = join(ACCOUNTS_URL_ROOT, '/force_logout');


const cookieParms: any = {
  maxAge: 100 * 365 * 84600,
  signed: true,
  secure: true,
  httpOnly: true,
  sameSite: "lax"
};

const getRandomString = () => {
  return randomBytes(64).toString('hex');
}

const isAnonymousUser = function(username: string) {
  if (username.startsWith('anonymous-')) return true;
  return false;
}

const dbUserExists = function(user: string, key: string) {
  const row = db.prepare(`
              SELECT A.username
              FROM users A, sessions B
              WHERE A.username = ?
                    AND B.username = A.username
                    AND key = ?`).get(user, key);
  if (row) return true;
  return false;
}

const clearUserLoginCookies = (res: Response) => {
  res.clearCookie("user", cookieParms);
  res.clearCookie("key", cookieParms);
}

const dbCreateUser = (username: string, email: string, display: string) => {
  const anonymous = (isAnonymousUser(username)) ? true : false;
  if (anonymous) {
    db.transaction(() => {
      db.prepare(`
      INSERT INTO users(username, email, display, anonymous)
      VALUES(?, ?, ?, ?)
        `).run('', '', '', anonymous ? 1 : 0);
      let id: any = db.prepare("SELECT last_insert_rowid()").get();
      id = id['last_insert_rowid()'];
      username = `${username}${id}`;
      email = (email) ? email : `${username}@example.com`;
      display = (display) ? display : username;
      db.prepare(`
      UPDATE users
      SET username = ?,
          email = ?,
          display = ?
      WHERE rowid = ?
      `).run(username, email, display, id);
    })();
  } else {
    email = (email) ? email : `${username}@example.com`;
    display = (display) ? display : username;
    db.prepare(`
      INSERT INTO users(username, email, display, anonymous)
      VALUES(?, ?, ?)
        `).run(username, email, display, anonymous);
  }
  return username;
}

const dbCreateAnonymousUser = (key: string, identifyingInfo: string) => {
  let username = "";
  db.transaction(() => {
    username = dbCreateUser('anonymous-', '', '');
    db.prepare(`
      INSERT INTO sessions (username, key, identifying_info)
      VALUES (?, ?, ?)
    `).run(username, key, identifyingInfo);
  })();
  return username;
}


const getUser = function(req: Request): string | null {
  if (!('user' in req.signedCookies) || !req.signedCookies.user) return null;
  if (!('key' in req.signedCookies) || !req.signedCookies.key) return null;
  if (!dbUserExists(req.signedCookies.user, req.signedCookies.key))
    return req.signedCookies.user;
  return null;
}

const createAnonymousUser = function(req: Request, res: Response) {
  const key = getRandomString();
  const username = dbCreateAnonymousUser(key, req.get('User-Agent') || "unknown");
  res.cookie('user', username, cookieParms);
  res.cookie('key', key, cookieParms);
  res.locals.user = username;
  res.locals.anonymous = true;
}

app.use((req, res, next) => {
  if (!(req.url in [loginURL, forceLogoutURL, logoutURL])) {
    if (!getUser(req)) {
      createAnonymousUser(req, res);
    }
  }
  next();
});

app.use(function(req: Request, res: Response, next) {
  res.locals.user = req.signedCookies.user || res.locals.user;
  res.locals.anonymous = isAnonymousUser(res.locals.user);
  next();
})

app.get(loginURL, (req, res) => {
  const user = getUser(req);
  if (user && !isAnonymousUser(user)) {
    res.render(alreadyLoggedInView, {
      'user': user
    });
    return;
  }
  res.render(loginView, {
    'user': getUser(req)
  });
});

app.get(logoutURL, (req, res) => {
  let user = getUser(req);
  if (user && !isAnonymousUser(req.signedCookies.user)) {
    clearUserLoginCookies(res);
  }
  res.render(logoutView, {
    'user': user
  });
});

app.get(forceLogoutURL, (req, res) => {
  let user = getUser(req);
  clearUserLoginCookies(res);
  res.render(logoutView, {
    'user': user
  });
});
