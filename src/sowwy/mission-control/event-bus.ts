/**
 * Inter-Persona Event Bus
 *
 * Pub/sub system for persona-to-persona communication.
 * Events are stored in a ring buffer for late subscribers and logged to audit store.
 */

import type { AuditStore } from "./store.js";
import { getChildLogger } from "../../logging/logger.js";

export interface EventBusEvent {
  topic: string;
  payload: unknown;
  fromPersona?: string;
  timestamp: number;
}

type EventHandler = (payload: unknown, fromPersona?: string) => void;

export class EventBus {
  private readonly log = getChildLogger({ subsystem: "event-bus" });
  private subscribers: Map<string, Set<EventHandler>> = new Map();
  private ringBuffer: EventBusEvent[] = [];
  private maxRingBufferSize: number;
  private auditStore: AuditStore | null = null;

  constructor(opts?: { maxRingBufferSize?: number; auditStore?: AuditStore }) {
    this.maxRingBufferSize = opts?.maxRingBufferSize ?? 100;
    this.auditStore = opts?.auditStore ?? null;
  }

  /**
   * Publish an event to all subscribers
   */
  publish(topic: string, payload: unknown, fromPersona?: string): void {
    const event: EventBusEvent = {
      topic,
      payload,
      fromPersona,
      timestamp: Date.now(),
    };

    // Add to ring buffer
    this.ringBuffer.push(event);
    if (this.ringBuffer.length > this.maxRingBufferSize) {
      this.ringBuffer.shift();
    }

    // Notify subscribers
    const handlers = this.subscribers.get(topic);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload, fromPersona);
        } catch (err) {
          this.log.error(`Handler error for topic ${topic}`, { error: err, topic });
        }
      }
    }

    // Log to audit store if available
    if (this.auditStore) {
      void this.auditStore
        .append({
          taskId: "system",
          action: "event_bus.publish",
          details: {
            topic,
            fromPersona,
            payloadType: typeof payload,
          },
          performedBy: fromPersona ?? "system",
        })
        .catch((err) => {
          this.log.warn("Failed to log to audit store", { error: err });
        });
    }
  }

  /**
   * Subscribe to events on a topic
   */
  subscribe(topic: string, handler: EventHandler): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    const handlers = this.subscribers.get(topic)!;
    handlers.add(handler);

    // Deliver recent events from ring buffer
    for (const event of this.ringBuffer) {
      if (event.topic === topic) {
        try {
          handler(event.payload, event.fromPersona);
        } catch (err) {
          this.log.error("Handler error delivering buffered event", { error: err, topic });
        }
      }
    }

    // Return unsubscribe function
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(topic);
      }
    };
  }

  /**
   * Unsubscribe a handler from a topic
   */
  unsubscribe(topic: string, handler: EventHandler): void {
    const handlers = this.subscribers.get(topic);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(topic);
      }
    }
  }

  /**
   * Get recent events for a topic (from ring buffer)
   */
  getRecentEvents(topic: string, limit: number = 10): EventBusEvent[] {
    return this.ringBuffer
      .filter((e) => e.topic === topic)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get all topics with active subscribers
   */
  getActiveTopics(): string[] {
    return Array.from(this.subscribers.keys());
  }
}
