import { describe, expect, it } from "vitest";
import { ACTION_RESULT, actionResult } from "./ticket-actions";

describe("actionResult", () => {
  it("returns mapped title and tone for known actions", () => {
    expect(actionResult("Review")).toEqual(ACTION_RESULT.Review);
    expect(actionResult("Escalate")).toEqual(ACTION_RESULT.Escalate);
  });

  it("returns a default result for unknown actions", () => {
    expect(actionResult("Archive")).toEqual({
      title: "Archive done",
      tone: "default",
    });
  });
});
