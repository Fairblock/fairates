jest.mock("ts-ibe", () => ({
  timelockEncrypt: jest.fn(),
}));

import { getErrorMessage } from "./context/AppContext";

test("formats user-rejected wallet errors", () => {
  expect(getErrorMessage({ code: 4001, message: "User rejected the request" })).toBe(
    "Transaction cancelled",
  );
});
