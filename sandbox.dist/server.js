const express = require('express');

const app = express();
app.use(express.static('sandbox'));

const SERVER_DELAY = 1500;

app.get('/check-login', async (req, res) => {
    await sleep(SERVER_DELAY);
    const regexp = /^[a-z0-9]+$/;
    const isValid = regexp.test(req.query.login);
    res.json({ isValid });
});

app.post('/submit-with-success-response', async (req, res) => {
    await sleep(SERVER_DELAY);
    res.json({ isSuccess: true });
});

app.post('/submit-with-error-response', async (req, res) => {
    await sleep(SERVER_DELAY);
    res.json({ isSuccess: false });
});

app.post('/submit-with-http-error-response', async (req, res) => {
    await sleep(SERVER_DELAY);
    res.status(403).end();
});

app.listen(3000, () => {
    console.log('Sandbox listening on port 3000');
});

const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
