import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../mission-control/schema.js";
import type { ExtensionFoundation } from "./integration.js";
import { TwilioSMSExtension } from "./twilio-sms.js";

// Mock Twilio – default export must have Twilio so "const { Twilio } = pkg" works
vi.mock("twilio", () => {
  function MockTwilio() {
    return {
      messages: {
        create: vi.fn().mockResolvedValue({ sid: "MM123" }),
      },
    };
  }
  return {
    Twilio: MockTwilio,
    default: { Twilio: MockTwilio },
  };
});

describe("TwilioSMSExtension", () => {
  let extension: TwilioSMSExtension;
  let mockFoundation: ExtensionFoundation;
  let mockBreaker: { execute: (fn: () => Promise<unknown>) => Promise<unknown> };
  let mockExecutor: {
    execute: (
      task: Task,
      context: { audit: { log: (e: unknown) => Promise<void> } },
    ) => Promise<unknown>;
  };
  let registerCircuitBreaker: ReturnType<typeof vi.fn>;
  let registerPersonaExecutor: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    extension = new TwilioSMSExtension();
    mockBreaker = {
      execute: vi.fn().mockImplementation((op: () => Promise<unknown>) => op()),
    };
    registerCircuitBreaker = vi.fn().mockReturnValue(mockBreaker);
    registerPersonaExecutor = vi.fn().mockImplementation((_p: string, e: unknown) => {
      mockExecutor = e as typeof mockExecutor;
    });
    mockFoundation = {
      registerCircuitBreaker,
      registerPersonaExecutor,
    } as unknown as ExtensionFoundation;

    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "token123";
    process.env.TWILIO_PHONE_NUMBER = "+1234567890";
  });

  it("initializes and registers executors", async () => {
    await extension.initialize(mockFoundation);
    expect(registerCircuitBreaker).toHaveBeenCalledWith("twilio");
    expect(registerPersonaExecutor).toHaveBeenCalledWith("Dev", expect.anything());
    expect(registerPersonaExecutor).toHaveBeenCalledWith("Sowwy", expect.anything());
  });

  it("sends SMS successfully", async () => {
    await extension.initialize(mockFoundation);

    const mockTask = {
      taskId: "t1",
      command: "sms.send",
      payload: { to: "+0987654321", body: "Hello from Sowwy" },
    } as unknown as Task;

    const mockContext = {
      audit: { log: vi.fn().mockResolvedValue(undefined) },
    };

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
    } as unknown as Task;

    const mockContext = {
      audit: { log: vi.fn() },
    };

    const result = await mockExecutor.execute(mockTask, mockContext);

    expect(result.success).toBe(false);
    expect(result.outcome).toBe("INVALID_PAYLOAD");
  });
});
