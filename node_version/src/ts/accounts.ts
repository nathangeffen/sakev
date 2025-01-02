import { Request, Response } from 'express';
import { app, db, cookieParser, nodemailer, nunjucks } from "./server.js";
import { getSetting } from "./settings.js";
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Result } from './components/result.js';
import * as EmailValidator from 'email-validator';
import { stripHtml } from "string-strip-html";
import { dbDeleteExpiredGameSearch } from './sakev.js';

const ACCOUNTS_ROOT = getSetting("ACCOUNTS_ROOT", () => "", false);
const ACCOUNTS_URL_ROOT = join("/", ACCOUNTS_ROOT);

const loginURL = join(ACCOUNTS_URL_ROOT, '/login');
const loginView = join(ACCOUNTS_ROOT, '/login.html');
const alreadyLoggedInView = join(ACCOUNTS_ROOT, '/already_logged_in.html');
const logoutURL = join(ACCOUNTS_URL_ROOT, '/logout');
const logoutView = join(ACCOUNTS_ROOT, '/logout.html');
const forceLogoutURL = join(ACCOUNTS_URL_ROOT, '/force_logout');
const deleteExpiredRegistrationsURL = join(ACCOUNTS_URL_ROOT, '/deleteregistrations');
const deleteExpiredRegistrationsView = join(ACCOUNTS_ROOT, '/deleteregistrations.html');


const emailLoginTemplate = join(ACCOUNTS_ROOT, '/email-login.html');
const secretLinkBase = join(ACCOUNTS_ROOT, '/secret/');

const cookieParms: any = {
  maxAge: 100 * 365 * 84600,
  signed: true,
  secure: true,
  httpOnly: true,
  sameSite: "lax"
};

const getRandomString = (size = 64) => {
  return randomBytes(size).toString('hex');
}
const SECRET_KEY = getSetting("SECRET_KEY", getRandomString, true);
app.use(cookieParser(SECRET_KEY));

const isAnonymousUser = function(username: string) {
  if (username.startsWith('anonymous-')) return true;
  return false;
}

export const dbDeleteExpiredRegistrations = () => {
  db.prepare("DELETE FROM registration WHERE created <= datetime('now','-60 minute')")
    .run();
}

const dbUserExists = function(user: string, key: string) {
  const row = db.prepare(`
              SELECT A.username
              FROM users A, sessions B
              WHERE A.username = ?
                    AND B.username = A.username
                    AND key = ?)`).get(user, key);
  if (row) return true;
  return false;
}

const dbCreateRegistration = function(email: string, key: string) {
  db.prepare(`
        INSERT INTO registration (email, key)
        VALUES (?, ?)
        `).run(email, key)
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
      INSERT INTO sessions (username, key, identifying_info, active)
      VALUES (?, ?, ?, true)
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
    'user': getUser(req),
    'post': false,
    'error': "",
    'email': ""
  });
});

app.post(loginURL, (req, res) => {
  const email = req.body?.email;
  if (EmailValidator.validate(email) === true) {
    const key = getRandomString(128);
    dbCreateRegistration(email, key);
    let message = nunjucks.render(emailLoginTemplate, {
      'url': join(getSetting('BASE_URL', () => "http://localhost:3000/"), secretLinkBase),
      'secretPartOfUrl': key
    });
    sendmail({
      from: getSetting("EMAIL_FROM",
        () => { throw new Error("Please create an EMAIL_FROM setting") }, false),
      to: email,
      subject: "Sakev login/register email",
      text: stripHtml(message).result,
      html: message
    });
    res.render(loginView, {
      'user': getUser(req),
      'post': true,
      'error': '',
      'email': email
    });
  } else {
    res.render(loginView, {
      'user': getUser(req),
      'post': false,
      'error': 'Please use a valid email address.',
      'email': req.body.email
    });
  }
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

app.get(deleteExpiredRegistrationsURL, (req, res) => {
  dbDeleteExpiredRegistrations();
  res.render(deleteExpiredRegistrationsView, {});
});

/**********************/

type MailInfo = {
  from: string,
  to: string,
  subject: string,
  text: string,
  html: string
};

const sendmail = async (mailInfo: MailInfo) => {

  let message = {
    from: mailInfo.from,
    to: mailInfo.to,
    subject: mailInfo.subject,
    text: mailInfo.text,
    html: mailInfo.html
  };
  let mailConfig;
  if (process.env.NODE_ENV === 'production') {
    // all emails are delivered to destination
    mailConfig = {
      host: getSetting('SMTP', () => {
        throw new Error("Please create an SMTP setting");
      }, false),
      port: 587,
      auth: {
        user: getSetting("EMAIL_SENDER", () => {
          throw new Error("Please create an EMAIL_SENDER setting");
        }, false),
        pass: getSetting("EMAIL_PASS", () => {
          throw Error("Please create an EMAIL_PASS setting");
        }, false),
      }
    };
    let transporter = nodemailer.createTransport(mailConfig);
    transporter.sendMail(message, (err: Error, info: any) => {
      if (err) {
        console.error('Error occurred. ' + err.message);
        return;
      }
    });
  } else {
    nodemailer.createTestAccount((err: any, account: any) => {
      if (err) {
        console.error('Failed to create a testing account. ' + err.message);
        return;
      }

      // Create a SMTP transporter object
      let transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass
        }
      });

      transporter.sendMail(message, (err: any, info: any) => {
        if (err) {
          console.error('Error occurred. ' + err.message);
          return process.exit(1);
        }

        console.info('Message sent: %s', info.messageId);
        console.info('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      });
    });
  }
}

app.get('/testemail', (_, res) => {
  sendmail({
    from: 'nathan@example.com',
    to: 'peter@example.com',
    subject: 'This is the subject',
    text: 'This is plain text',
    html: ''
  }).then(() => {
    res.setHeader("Content-Type", "text/html")
    res.send(`<h1>Email test: ${new Date().toString()}</h1>`);
  });
});
