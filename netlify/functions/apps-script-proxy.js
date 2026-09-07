const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwvzB0rtQuPqkETvOcPeYfHZBjyLdN68Ri4yljwgi1BVmgvtfPDRUV5ga9Hio_p3NXo/exec';

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store'
      },
      body: ''
    };
  }

  try {
    const method = event.httpMethod || 'POST';
    const headers = {};
    const contentType = event.headers && (event.headers['content-type'] || event.headers['Content-Type']);
    if (contentType) headers['Content-Type'] = contentType;

    const response = await fetch(APPS_SCRIPT_URL, {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : (event.body || ''),
      redirect: 'follow'
    });

    const body = await response.text();
    const upstreamType = response.headers.get('content-type') || '';

    // A private/restricted Apps Script deployment commonly resolves to a Google
    // sign-in HTML page instead of the JSON API. Return a useful JSON error so
    // the frontend can surface the actual configuration problem.
    if (!upstreamType.toLowerCase().includes('application/json')) {
      return {
        statusCode: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        },
        body: JSON.stringify({
          ok: false,
          error: 'Apps Script did not return JSON. Confirm the Web App deployment is accessible to Anyone and is using the current deployment URL.'
        })
      };
    }

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': upstreamType,
        'Cache-Control': 'no-store'
      },
      body
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify({
        ok: false,
        error: 'Apps Script proxy failed: ' + (error && error.message ? error.message : String(error))
      })
    };
  }
};
