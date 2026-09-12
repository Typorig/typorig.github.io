/**
 * Event Bus siêu nhẹ phục vụ kiến trúc Loose-Coupling
 * Thay thế việc các module truy cập trực tiếp biến toàn cục window
 */

type Handler<T = any> = (data: T) => void;

class EventBus {
  private events: Map<string, Set<Handler>> = new Map();

  on<T = any>(event: string, handler: Handler<T>): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);

    // Unsubscribe callback
    return () => {
      this.off(event, handler);
    };
  }

  off<T = any>(event: string, handler: Handler<T>): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  emit<T = any>(event: string, data?: T): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error(`[EventBus] Error on event "${event}":`, err);
        }
      });
    }
  }

  clear(): void {
    this.events.clear();
  }
}

export const eventBus = new EventBus();
