type GoogleEvent = {
    created: string;
    creator: {
        email: string;
    }
    end: {
        date?: string;
        dateTime?: string;
        timeZone?: string;
    }
    etag: string;
    eventType: string;
    htmlLink: string;
    iCalUID: string;
    id: string;
    kind: string;
    organizer: {
        email: string;
        self: boolean;
        displayName: string;
    }
    reminders: {
        useDefault: boolean;
    }
    sequence: number;
    start: {
        date?: string;
        dateTime?: string;
        timeZone?: string;
    }
    status: string;
    summary: string;
    updated: string;
    transparency: string;
}



class CalendarEvent extends CalendarElement {
    googleEvent: GoogleEvent;
    start: Date;
    end: Date;
    
    constructor(event: GoogleEvent) {
        super();
        this.googleEvent = event;

        this.start = (() => {
            if (event.start.date) {
                return new Date(event.start.date);
            }
            if (event.start.dateTime) {
                return new Date(event.start.dateTime);
            }
            return new Date();
        })();

        this.end = (() => {
            if (event.end.date) {
                return new Date(event.end.date);
            }
            if (event.end.dateTime) {
                return new Date(event.end.dateTime);
            }
            return new Date();
        })();
    }
}