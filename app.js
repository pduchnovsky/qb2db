/* Variables */
const _environment = 'sandbox'
const _server_host = 'localhost'
const _server_port = '3000'
const _redirectUri = `http://${_server_host}:${_server_port}/callback`
const _startDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 3,
    new Date().getDate()
).toISOString().substring(0, 10);
const _end_date = new Date().toISOString().substring(0, 10)
let oauth2_token_json = null;
let oauthClient = null;

/* Secrets */
const _db_ip = process.env._db_ip 
const _db_name = process.env._db_name
const _db_user = process.env._db_user
const _db_pass = process.env._db_pass
const _qb_username = process.env._qb_username
const _qb_password = process.env._qb_password
const _qb_clientId = process.env._qb_clientId
const _qb_clientSecret = process.env._qb_clientSecret

/* Requirements */
const express = require('express');
const { Pool } = require('pg');
const app = express();
const path = require('path');
const OAuthClient = require('intuit-oauth');
const bodyParser = require('body-parser');
const { Builder, By, Key, until } = require('selenium-webdriver');
require('chromedriver');
const chrome = require('selenium-webdriver/chrome');

/* Prepare webpage */
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));
app.set('view engine', 'html');
app.use(bodyParser.json());
app.get('/', function (req, res) {
    res.render('index');
});

/* Define Authorize */
app.get('/authUri', function (req, res) {
    oauthClient = new OAuthClient({
        clientId: _qb_clientId,
        clientSecret: _qb_clientSecret,
        environment: _environment,
        redirectUri: _redirectUri,
    });

    const authUri = oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting],
        state: 'intuit-test',
    });
    res.send(authUri);
});

/* Define Callback */
app.get('/callback', function (req, res) {
    oauthClient
        .createToken(req.url)
        .then(function (authResponse) {
            oauth2_token_json = JSON.stringify(authResponse.getJson(), null, 2);
            _apiCall();
        })
        .catch(function (e) {
            console.error(e);
        });
    res.send('');
    server.close();
});

/* Start Server */
const server = app.listen(_server_port, () => {
    console.log('Server is up');
    _logIn();
});

/* User Login */
var _logIn = async function () {
    const driver = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options()
            .windowSize({ width: 800, height: 600 })
            /* .headless() */
        )
        .build();
    let inpUsername = By.id('ius-userid');
    let inpPassword = By.id('ius-password');
    let btnLogin = By.id('authorizeUri');
    let btnLogin2 = By.id('ius-sign-in-actions');
    var enterCredentialsAndLogin = async function () {
        await driver.wait(until.elementLocated(btnLogin2), 10 * 1000);
        console.log('Login screen loaded.');
        console.log('Entering credentials...');
        await driver.findElement(inpUsername).sendKeys(_qb_username);
        await driver.findElement(inpPassword).sendKeys(_qb_password);
        await driver.findElement(btnLogin2).click();
        await driver.wait(until.urlContains(`${_redirectUri}`));
        console.log('Logged in.');
        await driver.quit();
    }
    await driver.get(`http://${_server_host}:${_server_port}`);
    await driver.wait(until.elementLocated(btnLogin), 10 * 1000);
    await driver.findElement(btnLogin).click();
    await enterCredentialsAndLogin();
}

/* API Call */
function _apiCall() {
    console.log('Making API Call');
    const companyID = oauthClient.getToken().realmId;
    const url =
        oauthClient.environment == 'sandbox'
            ? OAuthClient.environment.sandbox
            : OAuthClient.environment.production;
    oauthClient
        .makeApiCall({
            url: `${url}v3/company/${companyID}/reports/ProfitAndLoss?minorversion=54&start_date=${_startDate}&end_date=${_end_date}&customer=1`,
            method: 'GET',
        })
        .then(function (authResponse) {
            queryText = 'INSERT INTO profitandloss(time, value) VALUES($1, $2) RETURNING *';
            queryValues = [
                new Date().toISOString(),
                JSON.parse(authResponse.response.body).Rows.Row[1].Summary.ColData[1].value
            ];
            _dbQuery(queryText, queryValues);
        })
        .catch(function (e) {
            console.error(e);
        });
};

/* DB Query */
function _dbQuery(queryText, queryValues) {
    console.log('Making DB Query');
    const pool = new Pool({
        user: _db_user,
        host: _db_ip,
        database: _db_name,
        password: _db_pass,
        port: 5432,
    });
    pool.query(queryText, queryValues, (res) => {
        console.log('Result written to database')
        pool.end()
    });
};
