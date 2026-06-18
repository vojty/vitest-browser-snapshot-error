import { describe, it, expect } from "vitest";

describe("repro", () => {
  it("should match snapshot", () => {
    expect({ a: 1 }).toMatchSnapshot(); // external .snap → new Function → CSP blocks it
  });
});
