// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

/**
 * CRA (react-scripts) Jest does not transpile ESM dependencies in node_modules.
 * axios v1+ is ESM, so importing it in tests fails unless we mock it.
 */
jest.mock("axios");
