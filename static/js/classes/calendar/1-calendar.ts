enum CalendarView {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    LIST = 'list'
}

class CalendarElement {
    el: HTMLDivElement;
    constructor() {
        this.el = document.createElement('div');
        this.el.classList.add('container-fluid');
    }
}


const getEventInTime = (timeSlot: number, date: Date) => (e: CalendarEvent) => {
    const eventStart = e.start.getTime();
    const eventEnd = e.end.getTime();

    const dateStart = date.getTime();
    const dateEnd = date.getTime() + timeSlot;


    const ifStart = eventStart >= dateStart && eventStart < dateEnd;
    const ifEnd = eventEnd >= dateStart && eventEnd < dateEnd;

    // note: the entire event doens't have to be in the slot
    // just if it starts or ends in the slot
    // if an event starts the slot before but ends in this slot, it's included

    return ifStart || ifEnd;
};





class Calendar extends CalendarElement {
    id: string;

    #from?: Date;
    #to?: Date;

    eventCache: CalendarEvent[] = [];

    constructor(id: string) {
        super();
        this.id = id;
    }

    get from() {
        return this.#from;
    }

    set from(from: Date|undefined) {
        this.#from = from;
    }

    get to() {
        return this.#to;
    }

    set to(to: Date|undefined) {
        this.#to = to;
    }

    async getEvents() {
        // return [];

        if (!(this.from && this.to)) return console.error('From and to must be set');

        const events: GoogleEvent[] = await fetch('/get-events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                calendarId: this.id,
                from: this.from?.getTime(),
                to: this.to?.getTime()
            })
        })
        .then(res => res.json())
        .catch(console.error);

        return events.map((e) => new CalendarEvent(e));
    }

    async render(view: CalendarView, date: Date = new Date()) {
        console.log('rendering:', view);
        this.el.innerHTML = '';

        this.from = new Date(date);
        this.from.setHours(0, 0, 0, 0);
        this.to = new Date(date);
        this.to.setHours(23, 59, 59, 999);

        let el: HTMLElement;

        switch (view) {
            case CalendarView.DAY:
                el = await this.renderDay();
                break;



            case CalendarView.WEEK:
                this.from.setDate(date.getDate() - date.getDay());
                this.to.setDate(date.getDate() + (6 - date.getDay()));
                el = await this.renderWeek();
                break;





            case CalendarView.MONTH:
                this.from.setDate(1);
                this.to.setMonth(date.getMonth() + 1);
                this.to.setDate(0);
                el = await this.renderMonth();
                break;




            case CalendarView.LIST:
                // list events in the next 2 weeks
                this.to.setDate(date.getDate() + 14);
                el = await this.renderList();
                break;


            default:
                console.error('Invalid view');
                return { error: 'Invalid view' };
        };

        this.el.appendChild(el);

        return this.el;
    }

    async renderDay() {
        const events = await this.getEvents();

        const day = new CalendarDay(this.from as Date, events || []);

        return day.render(CalendarView.DAY);
    }

    async renderWeek() {
        const events = await this.getEvents();

        const week = new CalendarWeek(this.from as Date, events || []);

        return week.render(CalendarView.WEEK);
    }

    async renderMonth() {
        console.log('Rendering month');
        const events = await this.getEvents();

        // at this point this.from and this.to are set
        const month = new CalendarMonth(this.from as Date, events || []);
        return month.render();
    }

    async renderList() {
        const events = await this.getEvents();

        return document.createElement('div');
    }
}