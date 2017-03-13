import requestPromise from 'request-promise';

export const GET = url => {
  return requestPromise({
    uri: url,
    resolveWithFullResponse: true,
    // Disable auto rejection if is not 2xx
    simple: false,
    json: true
  });
};
export const POST = (url, body = {}) => {
  return requestPromise({
    method: 'POST',
    uri: url,
    body: body,
    resolveWithFullResponse: true,
    // Disable auto rejection if is not 2xx
    simple: false,
    json: true
  });
};
export const PUT = (url, body = {}) => {
  return requestPromise({
    method: 'PUT',
    uri: url,
    body: body,
    resolveWithFullResponse: true,
    // Disable auto rejection if is not 2xx
    simple: false,
    json: true
  });
};
