import { beforeEach, describe, expect, it, vi } from "vitest";
import { TwilioSMSExtension } from "./twilio-sms.js";

// Mock Twilio
vi.mock("twilio", () => {
  const MockTwilio = vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({ sid: "MM123" }),
    },
  }));
  return {
    Twilio: MockTwilio,
    default: MockTwilio,
  };
});

describe("TwilioSMSExtension", () => {
  let extension: TwilioSMSExtension;
  let mockFoundation: any;
  let mockBreaker: any;
  let mockExecutor: any;

  beforeEach(() => {
    extension = new TwilioSMSExtension();
    mockBreaker = {
      execute: vi.fn().mockImplementation((op) => op()),
    };
    mockFoundation = {
      registerCircuitBreaker: vi.fn().mockReturnValue(mockBreaker),
      registerPersonaExecutor: vi.fn().mockImplementation((p, e) => {
        mockExecutor = e;
      }),
    };

    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "token123";
    process.env.TWILIO_PHONE_NUMBER = "+1234567890";
  });

  it("initializes and registers executors", async () => {
    await extension.initialize(mockFoundation);
    expect(mockFoundation.registerCircuitBreaker).toHaveBeenCalledWith("twilio");
    expect(mockFoundation.registerPersonaExecutor).toHaveBeenCalledWith("Dev", expect.anything());
    expect(mockFoundation.registerPersonaExecutor).toHaveBeenCalledWith("Sowwy", expect.anything());
  });

  it("sends SMS successfully", async () => {
    await extension.initialize(mockFoundation);

    const mockTask = {
      taskId: "t1",
      command: "sms.send",
      payload: { to: "+0987654321", body: "Hello from Sowwy" },
    } as any;

    const mockContext = {
      audit: { log: vi.fn().mockResolvedValue(undefined) },
    } as any;

    const result = await mockExecutor.execute(mockTask, mockContext);

    expect(result.success).toBe(true);
    expect(result.summary).toContain("SID: MM123");
    expect(mockContext.audit.log).toHaveBeenCalled();
  });

  it("fails with invalid payload", async () => {
    await extension.initialize(mockFoundation);

    const mockTask = {
      taskId: "t1",
      command: "sms.send",
      payload: { body: "Missing to" },
    } as any;

    const mockContext = {
      audit: { log: vi.fn() },
    } as any;

    const result = await mockExecutor.execute(mockTask, mockContext);

    expect(result.success).toBe(false);
    expect(result.outcome).toBe("INVALID_PAYLOAD");
  });
});
