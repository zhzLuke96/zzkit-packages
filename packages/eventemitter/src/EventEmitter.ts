export type EventMap = Record<string | symbol, (...args: any[]) => any>;
export type EventOff = () => void;
export type ListenerOptions = { signal?: AbortSignal };

export class EventEmitter<Events extends EventMap> {
  /**
   * Creates an iterator for the specified event emitter and event name.
   *
   * @param {EventEmitter<Events>} eventEmitter - The event emitter to create the iterator for.
   * @param {EventName} eventName - The name of the event to listen for.
   * @param {ListenerOptions} [options] - Optional listener options.
   * @return {AsyncIterator<Parameters<Events[EventName]>, any>} The iterator object.
   */
  static iterator<Events extends EventMap, EventName extends keyof Events>(
    eventEmitter: EventEmitter<Events>,
    eventName: EventName,
    options?: ListenerOptions
  ) {
    const queue: Parameters<Events[EventName]>[] = [];
    const val_ee = new EventEmitter<{
      value: () => void;
    }>();
    let done = false;

    const iterator = {
      async next(): Promise<
        IteratorResult<Parameters<Events[EventName]>, any>
      > {
        if (queue.length > 0) {
          return {
            value: queue.shift() as Parameters<Events[EventName]>,
            done,
          };
        }

        return new Promise<IteratorResult<Parameters<Events[EventName]>, any>>(
          (resolve) => {
            val_ee.once("value", () => {
              resolve({
                value: queue.shift() as Parameters<Events[EventName]>,
                done,
              });
            });
          }
        );
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };

    eventEmitter.on(eventName, ((...args) => {
      queue.push(args as any);
      val_ee.emit("value");
    }) as any);

    if (options?.signal) {
      options?.signal.addEventListener("abort", () => {
        done = true;
        val_ee.emit("value");
        val_ee.removeAllListeners();
      });
    }

    return iterator;
  }

  private events: Map<keyof Events, Function[]> = new Map();
  private maxListeners: number = Infinity;
  private signal?: AbortSignal;

  constructor(options?: { maxListeners?: number; signal?: AbortSignal }) {
    this.maxListeners = options?.maxListeners ?? Infinity;
    this.signal = options?.signal;
  }

  private emitNewListener<EventName extends keyof Events>(
    eventName: EventName,
    listener: Events[EventName]
  ) {
    // @ts-ignore
    this.emit("__new_listener__", eventName, listener);
  }

  private emitRemoveListener<EventName extends keyof Events>(
    eventName: EventName,
    listener: Events[EventName]
  ) {
    // @ts-ignore
    this.emit("__remove_listener__", eventName, listener);
  }

  /**
   * Adds a listener for the specified event.
   *
   * @param {EventName} eventName - The name of the event.
   * @param {Events[EventName]} listener - The listener function to be added.
   * @param {ListenerOptions} [options] - Optional listener options.
   * @return {EventOff} A function to remove the listener.
   */
  addListener<EventName extends keyof Events>(
    eventName: EventName,
    listener: Events[EventName],
    options?: ListenerOptions
  ): EventOff {
    return this.on(eventName, listener, options);
  }

  /**
   * Emits an event with the specified name and arguments.
   *
   * @param {EventName} eventName - The name of the event to emit.
   * @param {...Parameters<Events[EventName]>} args - The arguments to pass to the event listeners.
   * @return {boolean} Returns true if the event was emitted and there were listeners, false otherwise.
   */
  emit<EventName extends keyof Events>(
    eventName: EventName,
    ...args: Parameters<Events[EventName]>
  ): boolean {
    const listeners = this.events.get(eventName);
    if (!listeners) return false;
    listeners.forEach((listener) => listener(...args));
    return true;
  }

  /**
   * Returns an array of event names that have listeners registered.
   *
   * @return {(keyof Events)[]} An array of event names.
   */
  eventNames(): (keyof Events)[] {
    return Array.from(this.events.keys());
  }

  /**
   * Returns the maximum number of listeners allowed for this object.
   *
   * @return {number} The maximum number of listeners allowed.
   */
  getMaxListeners(): number {
    return this.maxListeners;
  }

  /**
   * Returns the number of listeners for a given event.
   *
   * @param {EventName} eventName - The name of the event.
   * @return {number} The number of listeners for the event. Returns 0 if no listeners are registered.
   */
  listenerCount<EventName extends keyof Events>(eventName: EventName): number {
    const listeners = this.events.get(eventName);
    return listeners ? listeners.length : 0;
  }

  /**
   * Returns an array of listeners for the specified event.
   *
   * @param {EventName} eventName - The name of the event.
   * @return {Events[EventName][]} An array of listeners for the event. Returns an empty array if no listeners are registered.
   */
  listeners<EventName extends keyof Events>(
    eventName: EventName
  ): Events[EventName][] {
    return (this.events.get(eventName) as any) || [];
  }

  /**
   * Removes a listener for the specified event.
   *
   * @param {EventName} eventName - The name of the event.
   * @param {Events[EventName]} listener - The listener function to be removed.
   * @return {this} The current instance of the class.
   */
  off<EventName extends keyof Events>(
    eventName: EventName,
    listener: Events[EventName]
  ): this {
    return this.removeListener(eventName, listener);
  }

  /**
   * Adds a listener for the specified event.
   *
   * @param {EventName} eventName - The name of the event.
   * @param {Events[EventName]} listener - The listener function to be added.
   * @param {ListenerOptions} [options] - Optional listener options.
   * @return {EventOff} A function to remove the listener.
   */
  on<EventName extends keyof Events>(
    eventName: EventName,
    listener: Events[EventName],
    options?: ListenerOptions
  ): EventOff {
    if (this.listenerCount(eventName) >= this.maxListeners) {
      console.warn(
        `Max listeners (${this.maxListeners}) for event '${String(
          eventName
        )}' exceeded!`
      );
    }
    this.emitNewListener(eventName, listener);
    let listeners = this.events.get(eventName);
    if (!listeners) {
      listeners = [];
      this.events.set(eventName, listeners);
    }
    listeners.push(listener);

    const signals = [options?.signal, this.signal].filter(
      Boolean
    ) as AbortSignal[];

    if (signals.length !== 0) {
      const mergedSignal = new AbortController();
      signals.forEach((signal) =>
        signal.addEventListener("abort", () => mergedSignal.abort())
      );

      mergedSignal.signal.addEventListener("abort", () => {
        this.removeListener(eventName, listener);
      });
    }

    return () => this.removeListener(eventName, listener);
  }

  /**
   * Adds a listener for the specified event that will be executed only once.
   *
   * @param {EventName} eventName - The name of the event.
   * @param {Events[EventName]} listener - The listener function to be added.
   * @return {EventOff} A function to remove the listener.
   */
  once<EventName extends keyof Events>(
    eventName: EventName,
    listener: Events[EventName]
  ): EventOff {
    const onceWrapper = (...args: Parameters<Events[EventName]>) => {
      listener(...args);
      this.removeListener(eventName, onceWrapper as any);
    };
    return this.on(eventName, onceWrapper as any);
  }

  /**
   * Adds a listener for the specified event at the beginning of the listeners array.
   *
   * @param {EventName} eventName - The name of the event.
   * @param {Events[EventName]} listener - The listener function to be added.
   * @return {EventOff} A function to remove the listener.
   */
  prependListener<EventName extends keyof Events>(
    eventName: EventName,
    listener: Events[EventName]
  ): EventOff {
    let listeners = this.events.get(eventName);
    if (!listeners) {
      listeners = [];
      this.events.set(eventName, listeners);
    }
    listeners.unshift(listener);
    this.emitNewListener(eventName, listener);
    return () => this.removeListener(eventName, listener);
  }

  /**
   * Adds a listener for the specified event at the beginning of the listeners array, which will be executed only once.
   *
   * @param {EventName} eventName - The name of the event.
   * @param {Events[EventName]} listener - The listener function to be added.
   * @return {EventOff} A function to remove the listener.
   */
  prependOnceListener<EventName extends keyof Events>(
    eventName: EventName,
    listener: Events[EventName]
  ): EventOff {
    const onceWrapper = (...args: Parameters<Events[EventName]>) => {
      listener(...args);
      this.removeListener(eventName, onceWrapper as any);
    };
    return this.prependListener(eventName, onceWrapper as any);
  }

  /**
   * Removes all listeners for the specified event or all events.
   *
   * @param {EventName} [eventName] - Optional. The name of the event to remove listeners for. If not provided, all events and their listeners will be removed.
   * @return {this} The current instance of the EventEmitter.
   */
  removeAllListeners<EventName extends keyof Events>(
    eventName?: EventName
  ): this {
    if (eventName) {
      const listeners = this.events.get(eventName);
      if (listeners) {
        listeners.forEach((listener) =>
          this.emitRemoveListener(eventName, listener as Events[EventName])
        );
        this.events.delete(eventName);
      }
    } else {
      this.events.forEach((listeners, event) => {
        listeners.forEach((listener) =>
          this.emitRemoveListener(event, listener as Events[typeof event])
        );
      });
      this.events.clear();
    }
    return this;
  }

  /**
   * Removes a specific listener for a given event.
   *
   * @param {EventName} eventName - The name of the event.
   * @param {Events[EventName]} listener - The listener function to remove.
   * @return {this} The current instance of the EventEmitter.
   */
  removeListener<EventName extends keyof Events>(
    eventName: EventName,
    listener: Events[EventName]
  ): this {
    const listeners = this.events.get(eventName);
    if (listeners) {
      this.events.set(
        eventName,
        listeners.filter((l) => l !== listener)
      );
      this.emitRemoveListener(eventName, listener);
    }
    return this;
  }

  /**
   * Sets the maximum number of listeners allowed for this object.
   *
   * @param {number} n - The maximum number of listeners to set.
   * @return {this} The current instance of the object.
   */
  setMaxListeners(n: number): this {
    this.maxListeners = n;
    return this;
  }
}
