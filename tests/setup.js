// Global test setup - mocks config/db before any test runs
// This ensures the mock is active from the start, regardless of test file order

jest.mock("../config/db", () => ({
	query: jest.fn(),
	execute: jest.fn(),
	end: jest.fn(),
}));
