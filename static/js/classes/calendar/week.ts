class CalendarWeek extends CalendarElement {
    public days: CalendarDay[];
    public events: CalendarEvent[];

    constructor(day: Date, events: CalendarEvent[] = []) {
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

    public render(view: CalendarView) {
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

    private renderWeek() {
        this.el = document.createElement('div');
        this.el.classList.add('position-relative');

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

            const daynum = th.querySelector('#daynum') as HTMLSpanElement;

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




    private renderMonth() {
        this.el = document.createElement('div');

        const row = document.createElement('div');
        row.classList.add('d-flex', 'mb-1');

        for (const day of this.days) {
            row.appendChild(day.render(CalendarView.MONTH));
        }

        return row;
    }
}