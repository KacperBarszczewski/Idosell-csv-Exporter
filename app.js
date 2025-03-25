const express = require('express');
const basicAuth = require('express-basic-auth');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

let ordersData = [];

app.use(basicAuth({
    users: { [process.env.AUTH_NAME || 'admin']: process.env.AUTH_PASS || 'password' },
    challenge: true,
}));

const fetchOrders = async () => {
    try {
        let allOrders = [];
        let page = 0;
        let hasMorePages = true;

        if (!process.env.API_KEY) {
            throw new Error('Brak klucza API. Ustaw zmienną środowiskową API_KEY.');
        }

        const options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'X-API-KEY': process.env.API_KEY,
            }
        };

        while (hasMorePages) {
            const body = JSON.stringify({ params: { ordersStatuses: ['finished'], resultsPage: page } });
            const response = await fetch('https://zooart6.yourtechnicaldomain.com/api/admin/v5/orders/orders/search', {
                ...options,
                body
            });

            if (!response.ok) throw new Error(response.status, response.statusText);

            const data = await response.json().catch(() => {
                throw new Error('Odpowiedź serwera nie jest poprawnym JSONem');
            });

            const processedOrders = data.Results.map(order => ({
                orderID: order.orderId,
                products: order.orderDetails.productsResults.map(product => ({
                    productID: product.productId,
                    quantity: product.productQuantity,
                })),
                orderWorth: order.orderDetails.payments.orderBaseCurrency.orderProductsCost,
            }));

            allOrders = allOrders.concat(processedOrders);
            page++;

            if (data.resultsNumberPage <= page) {
                hasMorePages = false;
            }

        }

        ordersData = allOrders;
        console.log('Pobrano wszystkie zamówienia.');

    } catch (error) {
        console.error('Błąd podczas pobierania zamówień:', error.message);
    }
};

const scheduleDailyTask = (hour, minute) => {
    const now = new Date();
    let firstRunTime = new Date(now);

    firstRunTime.setHours(hour, minute, 0, 0);

    if (now > firstRunTime) {
        firstRunTime.setDate(now.getDate() + 1);
    }

    const delay = firstRunTime - now;

    setTimeout(() => {
        fetchOrders();
        setInterval(fetchOrders, 86400000);
    }, delay);
};

scheduleDailyTask(1, 0);

app.get('/orders', (req, res) => {
    try {
        const { minWorth, maxWorth } = req.query;
        let filteredOrders = ordersData;

        if (minWorth) {
            filteredOrders = filteredOrders.filter(order => order.orderWorth >= Number(minWorth));
        }
        if (maxWorth) {
            filteredOrders = filteredOrders.filter(order => order.orderWorth <= Number(maxWorth));
        }

        const maxProducts = Math.max(...filteredOrders.map(order => order.products.length), 0);

        let header = ['Order ID', 'Order Worth'];
        for (let i = 1; i <= maxProducts; i++) {
            header.push(`Product ID ${i}`, `Quantity ${i}`);
        }

        const rows = filteredOrders.map(order => {
            let row = [order.orderID, order.orderWorth.toString().replace('.', ',')];

            order.products.forEach(product => {
                row.push(product.productID, product.quantity);
            });

            while (row.length < header.length) {
                row.push('');
            }

            return row.join(';');
        });

        const csvContent = [header.join(';'), ...rows].join('\n');

        const csvBuffer = Buffer.from(csvContent, 'utf8');

        res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.send(csvBuffer);
    }
    catch (error) {
        console.error('Błąd podczas tworzenia lub pobierania csv', error.message);
        res.status(500).send('Błąd podczas tworzenia lub pobierania csv');
    }

});

app.get('/orders/:id', (req, res) => {
    const order = ordersData.find(o => o.orderID === req.params.id);
    if (!order) return res.status(404).send('Zamówienie nie znalezione.');
    res.json(order);
});

app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
    fetchOrders();
});

