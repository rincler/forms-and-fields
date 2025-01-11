// eslint-disable-next-line import/no-extraneous-dependencies
const express = require('express');

const app = express();
app.use(express.static('sandbox'));

const SERVER_DELAY = 1500;

const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

app.get('/check-domain', async (req, res) => {
    await sleep(SERVER_DELAY);
    res.json({ isValid: req.query.domain.endsWith('.com') });
});

app.get('/check-login', async (req, res) => {
    await sleep(SERVER_DELAY);
    const regexp = /^[a-z0-9]+$/;
    const isValid = regexp.test(req.query.login);
    res.json({ isValid });
});

app.post('/response-with-success', async (req, res) => {
    await sleep(SERVER_DELAY);
    res.json({ isSuccess: true });
});

app.post('/response-with-error', async (req, res) => {
    await sleep(SERVER_DELAY);
    res.json({ isSuccess: false });
});

app.post('/response-with-http-error', async (req, res) => {
    await sleep(SERVER_DELAY);
    res.status(403).end();
});

app.listen(3000, () => {
    // eslint-disable-next-line no-console
    console.log('Sandbox listening on port 3000');
});
