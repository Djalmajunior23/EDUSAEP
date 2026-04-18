import { db, auth } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export type SystemEventType = 
  | 'activity.submitted'
  | 'exam.completed'
  | 'performance.below_threshold'
  | 'intervention.triggered'
  | 'student.enrolled'
  | 'simulation.executed'
  | 'insight.generated';

export interface SystemEventPayload {
  type: SystemEventType;
  userId?: string;
  turmaId?: string;
  data: any;
  metadata?: Record<string, any>;
}

class EventBusService {
  private listeners: Map<SystemEventType, Set<(payload: SystemEventPayload) => void>> = new Map();

  /**
   * Dispatches an event locally and logs it to Firestore for audit and reactive triggers.
   */
  public async dispatch(event: SystemEventPayload) {
    const enrichedEvent = {
      ...event,
      userId: event.userId || auth.currentUser?.uid,
      timestamp: new Date().toISOString(),
    };

    // 1. Local Notification
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      typeListeners.forEach(cb => cb(enrichedEvent));
    }

    // 2. Persistent Log (Audit)
    try {
      await addDoc(collection(db, 'system_events'), {
        ...enrichedEvent,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("[EventBus] Failed to persist event:", err);
    }

    // 3. Webhook Trigger (Block 4: n8n Integration)
    // In a real app, this would check if n8n is active and send a request
    if (event.type === 'performance.below_threshold' || event.type === 'intervention.triggered') {
      this.triggerWebhook(enrichedEvent);
    }
  }

  public subscribe(type: SystemEventType, callback: (payload: SystemEventPayload) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(callback);
    return () => this.listeners.get(type)?.delete(callback);
  }

  private async triggerWebhook(event: any) {
    // Logic to call N8N or other integration endpoints
    console.log(`[EventBus] Triggering automated workflow for ${event.type}`);
  }
}

export const eventBus = new EventBusService();
