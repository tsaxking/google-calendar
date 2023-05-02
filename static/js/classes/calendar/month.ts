class CalendarMonth extends CalendarElement {
    static get months() {
        return [
            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
            'October', 'November', 'December'
        ]
    }

    static fromMonth(month: string, year: number): CalendarMonth {
        const date = new Date(year, this.months.indexOf(month));
        const length = new Date(year, this.months.indexOf(month) + 1, 0).getDate();
        return new CalendarMonth(date);
    }

    days: CalendarDay[];
    startDay: Date;
    weeks: CalendarWeek[];
    events: CalendarEvent[];

    constructor(startDay: Date, events: CalendarEvent[] = []) { // because calendar.getEvents() could return void
        super();
        this.startDay = startDay;
        this.events = events; // now at this point all events are CalendarEvents

        const length = new Date(startDay.getFullYear(), startDay.getMonth() + 1, 0).getDate();


        const a = new Array(length).fill(0);
        this.days = a.map((_, i) => {
            const date = new Date(startDay);
            date.setDate(i + 1);
            return new CalendarDay(date);
        });

        const weeks = new Array(Math.ceil(length / 7)).fill(0);
        this.weeks = weeks.map((_, i) => {
            const date = new Date(startDay);
            date.setDate(startDay.getDate() + (i * 7));

            // get all events that start or end in this week
            const events = this.events.filter(getEventInTime(7 * 24 * 60 * 60 * 1000, date));

            return new CalendarWeek(date, events);
        });
    }

    get length() {
        return this.days.length;
    }

    render() {
        for (const week of this.weeks) {
            this.el.appendChild(week.render(CalendarView.MONTH));

            for (const day of week.days) {
                if (day.date.getMonth() !== this.startDay.getMonth()) {
                    day.blank = true;
                }
            }
        }

        return this.el;
    }
}