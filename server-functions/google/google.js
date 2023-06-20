"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvents = exports.getCalendars = exports.authorize = void 0;
const files_1 = require("../files");
const googleapis_1 = require("googleapis");
const local_auth_1 = require("@google-cloud/local-auth");
const databases_1 = require("../databases");
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly'
];
const CREDENTIAL_PATH = path.resolve(__dirname, './credentials.json');
const getClient = async (email) => {
    const query = `
        SELECT * 
        FROM GoogleTokens
        WHERE email = ?
    `;
    let c = await databases_1.DB.get(query, [email]);
    // console.log(c.token);
    return c ? googleapis_1.google.auth.fromJSON(JSON.parse(c.token)) : null;
};
const saveCredentials = (email, credentials) => {
    const client = (0, files_1.getJSONSync)(CREDENTIAL_PATH);
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
    databases_1.DB.run(query, [email, JSON.stringify(credentials, null, 4)]);
};
const authorize = async (email) => {
    let client = await getClient(email);
    if (!client) {
        client = await (0, local_auth_1.authenticate)({
            scopes: SCOPES,
            keyfilePath: CREDENTIAL_PATH
        });
        if (client.credentials) {
            saveCredentials(email, client);
        }
    }
    return client;
};
exports.authorize = authorize;
const getCalendars = async (email) => {
    const auth = await (0, exports.authorize)(email);
    // get list of calendars
    const calendar = googleapis_1.google.calendar({ version: 'v3', auth });
    const calendars = await calendar.calendarList.list();
    const query = `
        INSERT INTO Calendars (id, email, name, alias, authenticated)
        VALUES (?, ?, ?, ?, ?)
    `;
    if (calendars.data.items) {
        calendars.data.items.forEach((c) => {
            const key = new Array(32).fill(0).map(uuid_1.v4).join('').replace(/-/g, '');
            databases_1.DB.run(query, [c.id, email, c.summary, key, false]);
        });
    }
    return calendars.data.items;
};
exports.getCalendars = getCalendars;
const getEvents = async (calendarId, from, to) => {
    const query = `
        SELECT *
        FROM Calendars
        WHERE id = ?
    `;
    const c = await databases_1.DB.get(query, [calendarId]);
    if (!c)
        return [];
    const auth = await (0, exports.authorize)(c.email);
    const calendar = googleapis_1.google.calendar({ version: 'v3', auth });
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
};
exports.getEvents = getEvents;
