let requestTimes = [],
    totalLoadTime = 0;
async function requestFromServer({
    url,
    method = 'POST',
    func,
    headers,
    body,
    params,
    noHeaders,
    receive = 'JSON'
}) {
    const requestStart = Date.now();
    const originalUrl = url;
    if (!url) {
        console.error('Error: No URL provided, no request sent');
        return;
    }
    if ((method.toUpperCase() == "GET" || method.toUpperCase() == "HEAD") && body != undefined) {
        console.error('Cannot have body in GET or HEAD request, no request sent');
        return;
    }

    let _headers = {};
    if (body && !noHeaders) _headers = {...headers,
        "Content-Type": "application/json",
    };
    headers = _headers
    headers['Accept'] = "application/json";

    // iterates through params and puts them on the urlString as an encodedURI Variable
    if (params) {
        url += '?'
        Object.keys(params).forEach(param => {
            url += encodeURI(`${param}=${params[param]}&`);
        });
        url = url.slice(0, url.length - 1);
    }
    console.log(`${method} Request: ${url}`);
    let options = {
        method: method.toUpperCase(),
        body: JSON.stringify(body),
        headers: headers,
    }
    return fetch(url, options).then(res => {
        if (receive == 'JSON') return res.json();
        if (receive == 'TEXT') return res.text();
        if (receive == 'BLOB') return res.blob();
    }).then(async(data) => {
        console.log(data);

        if (data.status == 'epic-failure') return;

        // Creates notification
        const { status, title, msg, url, wait, clearCart, notificationLength } = data;
        if (msg) {
            createNotification(title, msg, status, notificationLength);
        }

        if (url) setTimeout(() => { navigateTo(url, false, true); }, wait ? wait * 1000 : 0);

        if (func) {
            if (func.constructor.name == 'AsyncFunction') await func(data);
            else func(data);
        }
        if (clearCart) window.localStorage.removeItem('cart'); // specific to my code
        const requestEnd = Date.now();
        const requestDelta = requestEnd - requestStart;
        console.log(`Time for ${method} - ${originalUrl}: ${requestDelta}`);
        totalLoadTime += requestDelta;
        console.log(`Total Load Time: ${totalLoadTime}`);
        requestTimes.push({
            url: originalUrl,
            start: requestStart,
            end: requestEnd,
            delta: requestDelta,
            totalTime: totalLoadTime
        });
        return data;
    });
}