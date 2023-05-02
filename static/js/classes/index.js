"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _Calendar_from, _Calendar_to;
var CalendarView;
(function (CalendarView) {
    CalendarView["DAY"] = "day";
    CalendarView["WEEK"] = "week";
    CalendarView["MONTH"] = "month";
    CalendarView["LIST"] = "list";
})(CalendarView || (CalendarView = {}));
class CalendarElement {
    constructor() {
        this.el = document.createElement('div');
        this.el.classList.add('container-fluid');
    }
}
const getEventInTime = (timeSlot, date) => (e) => {
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
    constructor(id) {
        super();
        _Calendar_from.set(this, void 0);
        _Calendar_to.set(this, void 0);
        this.eventCache = [];
        this.id = id;
    }
    get from() {
        return __classPrivateFieldGet(this, _Calendar_from, "f");
    }
    set from(from) {
        __classPrivateFieldSet(this, _Calendar_from, from, "f");
    }
    get to() {
        return __classPrivateFieldGet(this, _Calendar_to, "f");
    }
    set to(to) {
        __classPrivateFieldSet(this, _Calendar_to, to, "f");
    }
    async getEvents() {
        // return [];
        var _a, _b;
        if (!(this.from && this.to))
            return console.error('From and to must be set');
        const events = await fetch('/get-events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                calendarId: this.id,
                from: (_a = this.from) === null || _a === void 0 ? void 0 : _a.getTime(),
                to: (_b = this.to) === null || _b === void 0 ? void 0 : _b.getTime()
            })
        })
            .then(res => res.json())
            .catch(console.error);
        return events.map((e) => new CalendarEvent(e));
    }
    async render(view, date = new Date()) {
        console.log('rendering:', view);
        this.el.innerHTML = '';
        this.from = new Date(date);
        this.from.setHours(0, 0, 0, 0);
        this.to = new Date(date);
        this.to.setHours(23, 59, 59, 999);
        let el;
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
        }
        ;
        this.el.appendChild(el);
        return this.el;
    }
    async renderDay() {
        const events = await this.getEvents();
        const day = new CalendarDay(this.from, events || []);
        return day.render(CalendarView.DAY);
    }
    async renderWeek() {
        const events = await this.getEvents();
        const week = new CalendarWeek(this.from, events || []);
        return week.render(CalendarView.WEEK);
    }
    async renderMonth() {
        console.log('Rendering month');
        const events = await this.getEvents();
        // at this point this.from and this.to are set
        const month = new CalendarMonth(this.from, events || []);
        return month.render();
    }
    async renderList() {
        const events = await this.getEvents();
        return document.createElement('div');
    }
}
_Calendar_from = new WeakMap(), _Calendar_to = new WeakMap();
class CalendarDay extends CalendarElement {
    constructor(date, events = []) {
        super();
        // client side timeout
        this.animate = false;
        this.date = date;
        this.events = events;
        this.el.classList.add('p-0', 'm-1');
    }
    render(type) {
        this.animate = false;
        switch (type) {
            case CalendarView.MONTH:
                return this.renderMonth();
            case CalendarView.WEEK:
                return this.renderWeek();
            case CalendarView.DAY:
                return this.renderDay();
            case CalendarView.LIST:
                return this.renderList();
        }
    }
    renderWeek() {
        this.el = document.createElement('div');
        this.el.classList.add('position-absolute', 'h-100', 'overflow-hidden');
        const container = document.createElement('div');
        container.classList.add('position-relative', 'overflow-hidden');
        container.style.height = 60 * 24 + 'px'; // 60 minutes * 24 hours
        const date = new Date(this.date);
        date.setHours(0, 0, 0, 0);
        const endDate = new Date(this.date);
        endDate.setHours(23, 59, 59, 999);
        for (const event of this.events) {
            // 1px = 1 minute
            const cardContainer = document.createElement('div');
            cardContainer.classList.add('position-absolute', 'w-100', 'p-1', 'm-0');
            // start - date / minutes + 60px (offset for header)
            cardContainer.style.top = `${(event.start.getTime() - date.getTime()) / (1000 * 60)}px`;
            // end - start / minutes + 60px (offset for header)
            // console.log((event.end.getTime() - event.start.getTime()) / (1000 * 60));
            cardContainer.style.height = `${(event.end.getTime() - event.start.getTime()) / (1000 * 60)}px`;
            const card = document.createElement('div');
            card.classList.add('w-100', 'bg-primary', 'rounded', 'shadow', 'text-white', 'p-0', 'ps-1', 'm-0', 'card', 'border-0', 'h-100');
            const cardBody = document.createElement('div');
            cardBody.classList.add('card-body', 'p-0', 'm-0');
            cardBody.innerHTML = event.googleEvent.summary;
            card.appendChild(cardBody);
            cardContainer.appendChild(card);
            container.appendChild(cardContainer);
        }
        const now = new Date();
        const nowLine = document.createElement('hr'); // horizontal line
        nowLine.classList.add('position-absolute', 'w-100', 'shadow', 'p-0', 'm-0');
        const setTime = () => nowLine.style.top = `${(now.getTime() - date.getTime()) / (1000 * 60) + 60}px`;
        nowLine.style.height = '5px';
        nowLine.style.border = 'none';
        nowLine.style.backgroundColor = 'green';
        container.appendChild(nowLine);
        const update = () => {
            requestAnimationFrame(() => {
                if (!this.animate)
                    return;
                setTime();
                update();
            });
        };
        this.animate = true;
        update();
        this.el.appendChild(container);
        return this.el;
    }
    renderDay() {
        const today = new Date();
        const table = document.createElement('table');
        table.classList.add('table', 'table-striped', 'm-0', 'p-0', 'table-bordered');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const th = document.createElement('th');
        th.classList.add('text-center');
        headerRow.appendChild(th);
        const td = document.createElement('td');
        td.classList.add('p-1');
        td.innerHTML = `
            <div class="d-flex justify-content-center text-center">
                <div class="d-flex flex-column">
                    <span class="fw-bold">${this.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span id="daynum">${this.date.getDate()}</span>
                </div>
            </div>
        `;
        const daynum = td.querySelector('#daynum');
        daynum.classList.add('fw-bold');
        daynum.style.borderRadius = '50%';
        if (this.date.getDate() === today.getDate() && this.date.getMonth() == today.getMonth() && this.date.getFullYear() == today.getFullYear()) {
            daynum.classList.add('bg-primary', 'text-light');
        }
        headerRow.appendChild(td);
        thead.appendChild(headerRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        tbody.classList.add('overflow-scroll');
        new Array(24).fill(null).forEach((_, i) => {
            const row = document.createElement('tr');
            const th = document.createElement('td');
            th.classList.add('p-1', 'text-center');
            th.style.width = '10%';
            th.style.minWidth = '10%';
            th.style.maxWidth = '10%';
            th.style.height = '60px';
            // time
            const hours = i % 12 || 12;
            const ampm = i < 12 ? 'AM' : 'PM';
            th.innerHTML = hours + ampm;
            row.appendChild(th);
            // column index 1 through 7, hence starting at 1 and not 0
            const td = document.createElement('td');
            td.classList.add('p-1');
            td.style.height = '60px';
            td.style.width = '90%';
            td.style.minWidth = '90%';
            td.style.maxWidth = '90%';
            row.appendChild(td);
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        const dayEl = this.renderWeek();
        dayEl.style.top = '0';
        dayEl.style.left = `10%`;
        dayEl.style.width = '90%';
        dayEl.style.minWidth = '90%';
        dayEl.style.maxWidth = '90%';
        dayEl.style.height = '100%';
        const tableContainer = document.createElement('div');
        tableContainer.classList.add('position-relative', 'w-100', 'h-100', 'overflow-hidden');
        tableContainer.appendChild(table);
        tableContainer.appendChild(dayEl);
        return tableContainer;
    }
    renderMonth() {
        this.el = document.createElement('div');
        const container = document.createElement('div');
        container.classList.add('container-fluid');
        const date = new Date(this.date);
        date.setHours(0, 0, 0, 0);
        const endDate = new Date(this.date);
        endDate.setHours(23, 59, 59, 999);
        const dateCol = document.createElement('div');
        dateCol.classList.add('row', 'd-flex', 'flex-column', 'w-100', 'flex-row-reverse', 'align-items-center', 'p-1', 'rounded', 'shadow', 'h-100', 'date');
        if (date.getDay() == 0 || date.getDay() == 6)
            dateCol.style.backgroundColor = '#a6a6a6';
        dateCol.dataset.bsToggle = 'tooltip';
        dateCol.dataset.bsPlacement = 'top';
        // TODO: Implement Tooltips
        // $(dateCol).tooltip('enable');
        const dateEl = document.createElement('p');
        const today = new Date();
        const isToday = today.getFullYear() === this.date.getFullYear() && today.getMonth() === this.date.getMonth() && today.getDate() === this.date.getDate();
        dateEl.classList.add('text-center', 'p-0', 'm-0');
        dateEl.innerText = date.getDate().toString();
        dateEl.style.borderRadius = '50%';
        dateEl.style.height = '24px';
        dateEl.style.width = '24px';
        if (isToday)
            dateEl.classList.add('bg-primary', 'text-white');
        const eventRow = document.createElement('div');
        eventRow.classList.add('d-flex', 'flex-wrap-start', 'align-items-end');
        for (const event of this.events) {
            const eventEl = document.createElement('div');
            eventEl.classList.add('event', 'p-1', 'm-1');
            eventEl.style.borderRadius = `50%`;
            eventEl.classList.add('bg-dark');
            dateCol.title += `${event.googleEvent.summary}\n`;
            eventRow.appendChild(eventEl);
        }
        dateCol.appendChild(dateEl);
        dateCol.appendChild(eventRow);
        container.appendChild(dateCol);
        return container;
    }
    set blank(blank) {
        var _a, _b;
        if (blank)
            (_a = this.el.querySelector('.date')) === null || _a === void 0 ? void 0 : _a.classList.add('bg-secondary');
        else
            (_b = this.el.querySelector('.date')) === null || _b === void 0 ? void 0 : _b.classList.remove('bg-secondary');
    }
    renderList() {
        return this.el;
    }
}
class CalendarEvent extends CalendarElement {
    constructor(event) {
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
class CalendarMonth extends CalendarElement {
    static get months() {
        return [
            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
            'October', 'November', 'December'
        ];
    }
    static fromMonth(month, year) {
        const date = new Date(year, this.months.indexOf(month));
        const length = new Date(year, this.months.indexOf(month) + 1, 0).getDate();
        return new CalendarMonth(date);
    }
    constructor(startDay, events = []) {
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
class CalendarWeek extends CalendarElement {
    constructor(day, events = []) {
        super();
        const start = new Date(day).getDay();
        this.events = events;
        this.days = new Array(7).fill(null).map((_, i) => {
            const date = new Date(day);
            date.setDate(date.getDate() + i - start);
            // get all events that start or end in this week
            const events = this.events.filter(getEventInTime(24 * 60 * 60 * 1000, date));
            return new CalendarDay(date, events);
        });
    }
    render(view) {
        this.el.innerHTML = '';
        switch (view) {
            case CalendarView.WEEK:
                return this.renderWeek();
            case CalendarView.MONTH:
                return this.renderMonth();
            // These won't happen, but this is to avoid type errors
            case CalendarView.DAY:
                console.error('Cannot render week in day view');
                return this.el;
            case CalendarView.LIST:
                console.error('Cannot render week in list view');
                return this.el;
        }
    }
    renderWeek() {
        this.el = document.createElement('div');
        const today = new Date();
        const table = document.createElement('table');
        table.classList.add('table', 'table-striped', 'm-0', 'p-0', 'table-bordered');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const th = document.createElement('th');
        th.classList.add('text-center');
        headerRow.appendChild(th);
        for (const day of this.days) {
            const th = document.createElement('td');
            th.classList.add('p-1');
            th.innerHTML = `
                <div class="d-flex justify-content-center text-center">
                    <div class="d-flex flex-column">
                        <span class="fw-bold">${day.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span id="daynum">${day.date.getDate()}</span>
                    </div>
                </div>
            `;
            const daynum = th.querySelector('#daynum');
            daynum.classList.add('fw-bold');
            daynum.style.borderRadius = '50%';
            if (day.date.getDate() === today.getDate() && day.date.getMonth() == today.getMonth() && day.date.getFullYear() == today.getFullYear()) {
                daynum.classList.add('bg-primary', 'text-light');
            }
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        tbody.classList.add('overflow-scroll');
        new Array(24).fill(null).forEach((_, i) => {
            const row = document.createElement('tr');
            const th = document.createElement('td');
            th.classList.add('p-1', 'text-center');
            th.style.width = '12.5%';
            th.style.minWidth = '12.5%';
            th.style.maxWidth = '12.5%';
            th.style.height = '60px';
            // time
            const hours = i % 12 || 12;
            const ampm = i < 12 ? 'AM' : 'PM';
            th.innerHTML = hours + ampm;
            row.appendChild(th);
            // column index 1 through 7, hence starting at 1 and not 0
            for (let i = 1; i < 8; i++) {
                const td = document.createElement('td');
                td.classList.add('p-1');
                td.style.height = '60px';
                td.style.width = '12.5%';
                td.style.minWidth = '12.5%';
                td.style.maxWidth = '12.5%';
                if (i == 1 || i == 7) {
                    td.classList.add('bg-secondary');
                }
                row.appendChild(td);
            }
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        for (const [i, day] of this.days.entries()) {
            // dayEl is a position-absolute div
            const dayEl = day.render(CalendarView.WEEK);
            dayEl.style.top = '0';
            dayEl.style.left = `${(i + 1) * 12.5}%`;
            dayEl.style.width = '12.5%';
            dayEl.style.minWidth = '12.5%';
            dayEl.style.maxWidth = '12.5%';
            dayEl.style.height = '100%';
            this.el.appendChild(dayEl);
        }
        this.el.appendChild(table);
        return this.el;
    }
    renderMonth() {
        this.el = document.createElement('div');
        const row = document.createElement('div');
        row.classList.add('d-flex', 'mb-1');
        for (const day of this.days) {
            row.appendChild(day.render(CalendarView.MONTH));
        }
        return row;
    }
}
