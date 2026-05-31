const fs = require('fs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const qs = require('querystring');

// ---------------- CONFIG ----------------
const ACCOUNT_ID = '4054670-sb1';
const RESTLET_URL = 'https://4054670-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=4758&deploy=1';

const TOKEN_URL = `https://${ACCOUNT_ID}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`;
const CLIENT_ID = '3fd3188b87e73d3c8cdd190d1295bf02bf7f0a95951cc7fa2d4dc5cf0b76e98d';
const KEY_ID = 'i_IGzQHYITqjE9pDd9UT1viKXX-g7I85zteCGwxwQ9c';

// ---------------- JWT ----------------
const privateKey = fs.readFileSync('private.pem');

function generateJwt() {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iss: CLIENT_ID,
      scope: 'restlets',
      iat: now,
      exp: now + 3600,
      aud: TOKEN_URL
    },
    privateKey,
    {
      algorithm: 'ES256',
      header: { alg: 'ES256', typ: 'JWT', kid: KEY_ID }
    }
  );
}

// ---------------- ACCESS TOKEN ----------------
async function getAccessToken() {
  const jwtToken = generateJwt();
  const payload = qs.stringify({
    grant_type: 'client_credentials',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: jwtToken
  });

  const response = await axios.post(TOKEN_URL, payload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data.access_token;
}

// ---------------- RUN ----------------
(async () => {
  try {
    const accessToken = await getAccessToken();
    console.log('Access token received.');

    console.log(`Calling RESTlet via GET...`);

    const response = await axios.get(RESTLET_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('RESTlet called successfully! (Status:', response.status + ')');
    console.log('Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (err) {
    console.error('Error calling RESTlet:');
    if (err.response && err.response.data) {
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
})();