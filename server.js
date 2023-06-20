const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
const { getClientIp } = require('request-ip');
const { Session } = require('./server-functions/structure/sessions');
const builder = require('./server-functions/page-builder');
const { detectSpam, emailValidation } = require('./server-functions/middleware/spam-detection');
const { getTemplateSync, getTemplate, log } = require('./server-functions/files');
const { ServerError } = require('./server-functions/structure/error');
const { getCalendars, getEvents } = require('./server-functions/google/google');
const { DB } = require('./server-functions/databases');

require('dotenv').config();
const { PORT, DOMAIN } = process.env;

const [,, env, ...args] = process.argv;


const app = express();

const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('a user connected');
    const s = Session.addSocket(socket);
    if (!s) return;
    // your socket code here

    // ▄▀▀ ▄▀▄ ▄▀▀ █▄▀ ██▀ ▀█▀ ▄▀▀ 
    // ▄█▀ ▀▄▀ ▀▄▄ █ █ █▄▄  █  ▄█▀ 





























    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use('/static', express.static(path.resolve(__dirname, './static')));
app.use('/uploads', express.static(path.resolve(__dirname, './uploads')));

app.use((req, res, next) => {
    req.io = io;
    req.start = Date.now();
    req.ip = getClientIp(req);
    next();
});

function stripHtml(body) {
    let files;

    if (body.files) {
        files = JSON.parse(JSON.stringify(body.files));
        delete body.files;
    }

    let str = JSON.stringify(body);
    str = str.replace(/<[^<>]+>/g, '');

    obj = JSON.parse(str);
    obj.files = files;

    return obj;
}

// logs body of post request
app.post('/*', (req, res, next) => {
    console.log(req.body);
    req.body = stripHtml(req.body);
    next();
});

app.use(Session.middleware);



// production/testing/development middleward


app.use((req, res, next) => {
    switch (env) {
        case 'prod':
            (() => {
                // This code will only run in production


            })();
            break;
        case 'test':
            (() => {
                // this code will only run in testing
                // you could add features like auto-reloading, automatic sign-in, etc.


            })();
            break;
        case 'dev':
            (() => {
                // this code will only run in development
                // you could add features like auto-reloading, automatic sign-in, etc.


            })();
            break;
    }

    next();
});


// spam detection
app.post(detectSpam(['message', 'name', 'email'], {
    onSpam: (req, res, next) => {
        res.json({ error: 'spam' });
    },
    onerror: (req, res, next) => {
        res.json({ error: 'error' });
    }
}));

app.post(emailValidation(['email', 'confirmEmail'], {
    onspam: (req, res, next) => {
        res.json({ error: 'spam' });
    },
    onerror: (req, res, next) => {
        res.json({ error: 'error' });
    }
}));





// █▀▄ ██▀ ▄▀▄ █ █ ██▀ ▄▀▀ ▀█▀ ▄▀▀ 
// █▀▄ █▄▄ ▀▄█ ▀▄█ █▄▄ ▄█▀  █  ▄█▀ 

// this can be used to build pages on the fly and send them to the client
// app.use(builder);


app.post('/get-calendars', async (req, res) => {
    const { email } = req.body;
    req.session.email = email; // apply the amil to the session

    const calendar = await getCalendars(email);

    if (!calendar) {
        return new ServerError({
            status: 404,
            message: 'Calendar not found',
            description: 'The calendar you are looking for does not exist'
        }, req, res).send();
    }

    res.json(calendar);
});

app.post('/get-events', async (req, res) => {
    let { calendarId, from, to } = req.body;

    from = new Date(from);
    to = new Date(to);

    const { events, email } = await getEvents(calendarId, from, to);
    if (req.session.email !== email) {
        return new ServerError(req, {
            status: 401,
            message: 'Email mismatch',
            description: 'The email you are using does not match the email associated with this calendar'
        }, req, res).send();
    }

    res.json(events);
});

app.get('/calendar', async (req, res) => {
    const { calendarId } = req.query;
    const query = `
        SELECT *
        FROM Calendars
        WHERE id = ?
    `;

    const calendar = await DB.get(query, [calendarId]);

    if (!calendar) {
        return new ServerError(req, {
            status: 404,
            message: 'Calendar not found',
            description: 'The calendar you are looking for does not exist'
        }, req, res).send();
    }

    if (req.session.email !== calendar.email) {
        return new ServerError(req, {
            status: 401,
            message: 'Email mismatch',
            description: 'The email you are using does not match the email associated with this calendar'
        }, req, res).send();
    }



    if (!calendar.confirmed) return res.redirect('/calendar-error?calendarId=' + calendarId);

    const html = await getTemplate('ui-order/2-calendar', { alias: calendar?.alias });
    res.send(html);
});

app.post('/confirm-calendar', async (req, res) => {
    const { calendarId } = req.body;
    const selectQuery = `
        SELECT *
        FROM Calendars
        WHERE id = ?
    `;

    const calendar = await DB.get(selectQuery, [calendarId]);

    if (!calendar) {
        return new ServerError({
            status: 404,
            message: 'Calendar not found',
            description: 'The calendar you are looking for does not exist'
        }, req, res).send();
    }



    if (req.session.email !== calendar.email) {
        return new ServerError({
            status: 401,
            message: 'Email mismatch',
            description: 'The email you are using does not match the email used to create this calendar'
        }, req, res).send();
    }

    const updateQuery = `
        UPDATE Calendars
        SET confirmed = 1
        WHERE id = ?
    `;

    await DB.run(updateQuery, [calendarId]);

    res.redirect('/calendar?calendarId=' + calendarId);
});

app.get('/calendar-error', async (req, res) => {
    const { calendarId } = req.query;

    const query = `
        SELECT *
        FROM Calendars
        WHERE id = ?
    `;

    const calendar = await DB.get(query, [calendarId]);
    if (!calendar) {
        return new ServerError(req, { 
            status: 404,
            message: 'Calendar not found',
            description: 'The calendar you are looking for does not exist on our servers'
        }, req, res).send();
    }


    if (req.session.email !== calendar.email) {
        return new ServerError(req, { 
            status: 401, 
            message: 'Email mismatch',
            description: 'Your session email does not match the email associated with this calendar'
        }, req, res).send();
    }

    if (!calendar.confirmed) return res.send(await getTemplate('ui-order/3-calendar-error', calendar));

    // this could cause a redirect loop, but it shouldn't
    res.redirect('/calendar?calendarId=' + calendarId);
});


app.get('/', (req, res, next) => {
    res.send(getTemplateSync('ui-order/1-list-calendars'));
});
















let logCache = [];

// sends logs to client every 10 seconds
setInterval(() => {
    if (logCache.length) {
        io.to('logs').emit('request-logs', logCache);
        logCache = [];
    }
}, 1000 * 10);

app.use((req, res, next) => {
    const csvObj = {
        date: Date.now(),
        duration: Date.now() - req.start,
        ip: req.session.ip,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        userAgent: req.headers['user-agent'],
        body: req.method == 'post' ? JSON.stringify((() => {
            let { body } = req;
            body = JSON.parse(JSON.stringify(body));
            delete body.password;
            delete body.confirmPassword;
            delete body.files;
            return body;
        })()) : '',
        params: JSON.stringify(req.params),
        query: JSON.stringify(req.query)
    };

    logCache.push(csvObj);

    log('requests', csvObj);
});


server.listen(PORT, () => {
    console.log('------------------------------------------------');
    console.log(`Listening on port \x1b[35m${DOMAIN}...\x1b[0m`);
});