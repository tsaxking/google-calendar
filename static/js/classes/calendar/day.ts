class CalendarDay extends CalendarElement {
    public date: Date;
    public events: CalendarEvent[];
    // client side timeout
    animate: boolean = false;

    constructor(date: Date, events: CalendarEvent[] = []) {
        super();
        this.date = date;
        this.events = events;
        this.el.classList.add('p-0', 'm-1');
    }


    render(type: CalendarView) {
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

    private renderWeek() {
        this.el = document.createElement('div');
        // this.el.classList.add('position-absolute', 'h-100', 'overflow-hidden');

        const container = document.createElement('div');
        container.classList.add('position-absolute', 'overflow-hidden');
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
            cardContainer.style.top = `${(event.start.getTime() - date.getTime()) / (1000 * 60) + 60}px`;
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
                if (!this.animate) return;
                setTime();
                update();
            });
        }

        this.animate = true;
        update();


        // this.el.appendChild(container);

        return container;
    }

    private renderDay() {
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

        const daynum = td.querySelector('#daynum') as HTMLSpanElement;

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

    private renderMonth() {
        this.el = document.createElement('div');
        const container = document.createElement('div');
        container.classList.add('container-fluid');

        const date = new Date(this.date);
        date.setHours(0, 0, 0, 0);
        const endDate = new Date(this.date);
        endDate.setHours(23, 59, 59, 999);


        const dateCol = document.createElement('div');
        dateCol.classList.add('row', 'd-flex', 'flex-column', 'w-100', 'flex-row-reverse', 'align-items-center', 'p-1', 'rounded', 'shadow', 'h-100', 'date');
        if (date.getDay() == 0 || date.getDay() == 6) dateCol.style.backgroundColor = '#a6a6a6';
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


        if (isToday) dateEl.classList.add('bg-primary', 'text-white');

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

    public set blank(blank: boolean) {
        if (blank) this.el.querySelector('.date')?.classList.add('bg-secondary');
        else this.el.querySelector('.date')?.classList.remove('bg-secondary');
    }


    private renderList() {

        
        return this.el;
    }
}