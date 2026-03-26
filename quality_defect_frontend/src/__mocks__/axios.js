'use strict';

/**
 * Manual Jest mock for axios.
 *
 * CRA/react-scripts' Jest setup does not transpile ESM dependencies in node_modules.
 * axios v1+ is ESM, which breaks Jest in CRA unless axios is mocked (or Jest is reconfigured).
 *
 * This mock implements only the subset used by this app:
 * - axios.create({ ... }) -> returns a client with interceptors and HTTP methods
 * - client.interceptors.request/response.use(...)
 * - client.get/post/patch/delete(...)
 */
function createAxiosInstance() {
  const instance = {
    defaults: {},
    interceptors: {
      request: {
        use: jest.fn()
      },
      response: {
        use: jest.fn()
      }
    },
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} }))
  };

  return instance;
}

const axios = {
  create: jest.fn(() => createAxiosInstance()),
  // Optional top-level methods (not used directly right now but useful to avoid surprises)
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
};

module.exports = axios;
