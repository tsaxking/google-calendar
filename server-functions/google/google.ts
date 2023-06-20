import { getJSONSync } from "../files";
import { google } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";
import { DB } from "../databases";
import * as path from "path";
import { v4 as uuid } from "uuid";

const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly'
];

const CREDENTIAL_PATH = path.resolve(__dirname, './credentials.json');


const getClient = async (email: string) => {
    const query = `
        SELECT * 
        FROM GoogleTokens
        WHERE email = ?
    `;

    let c = await DB.get(query, [email]);
    // console.log(c.token);

    return c ? google.auth.fromJSON(JSON.parse(c.token)) : null;
}

const saveCredentials = (email: string, credentials: any) => {
    const client = getJSONSync(CREDENTIAL_PATH);
    const { client_secret, client_id, redirect_uris } = client.installed || client.web;
    credentials = {
        type: 'authorized_user',
        client_id,
        client_secret,
        refresh_token: credentials.credentials.refresh_token
    };

    const query = `
        INSERT INTO GoogleTokens (email, token)
        VALUES (?, ?)
    `;

    DB.run(query, [email, JSON.stringify(credentials, null, 4)]);
}

export const authorize = async (email: string) => {
    let client:any = await getClient(email);
    if (!client) {
        client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIAL_PATH
        });
        if (client.credentials) {
            saveCredentials(email, client);
        }
    }
    return client;
}

export const getCalendars = async (email: string) => {
    const auth = await authorize(email);
    // get list of calendars
    const calendar = google.calendar({ version: 'v3', auth });
    const calendars = await calendar.calendarList.list();

    const query = `
        INSERT INTO Calendars (id, email, name, alias, authenticated)
        VALUES (?, ?, ?, ?, ?)
    `;

    if (calendars.data.items) {
        calendars.data.items.forEach((c: any) => {
            const key: string = new Array(32).fill(0).map(uuid).join('').replace(/-/g, '');
            DB.run(query, [c.id, email, c.summary, key, false]);
        });
    }

    return calendars.data.items;
}

export const getEvents = async (calendarId: string, from: Date, to: Date) => {
    const query = `
        SELECT *
        FROM Calendars
        WHERE id = ?
    `;

    const c = await DB.get(query, [calendarId]);

    if (!c) return [];

    const auth = await authorize(c.email);

    const calendar = google.calendar({ version: 'v3', auth });
    const events = await calendar.events.list({
        calendarId,
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
    });

    return {
        events: events.data.items,
        email: c.email
    };
}