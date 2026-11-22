/** Keep the test opening's original latest-MVU, character preset and chat/worldbook semantics. */
export function createOpeningBridge(sourceMessageId: number) {
  const listeners = new Set<EventOnReturn>();
  let disposed = false;

  return {
    initialize(target: Window) {
      const hostWindow = $('#chat')[0].ownerDocument.defaultView! as Window & { TavernHelper: Record<string, unknown> };
      const helper = hostWindow.TavernHelper;
      const scopedEventOn: typeof eventOn = (event, listener) => {
        const subscription = eventOn(event, listener);
        if (disposed) subscription.stop();
        else listeners.add(subscription);
        return subscription;
      };
      const sharedGlobals = globalThis as typeof globalThis & { Mvu?: typeof Mvu; EjsTemplate?: unknown };
      return {
        ...helper,
        TavernHelper: helper,
        SillyTavern,
        _,
        toastr,
        Mvu: sharedGlobals.Mvu,
        EjsTemplate: sharedGlobals.EjsTemplate,
        getCurrentMessageId: () => sourceMessageId,
        getIframeName: () => `bp-opening-renderer-${sourceMessageId}`,
        getScriptId,
        eventOn: scopedEventOn,
        iframe_events,
        tavern_events,
        waitGlobalInitialized: async (name: string) => {
          await waitGlobalInitialized(name);
          if (!disposed) Object.assign(target, { [name]: (globalThis as Record<string, unknown>)[name] });
        },
      };
    },
    dispose() {
      disposed = true;
      listeners.forEach(listener => listener.stop());
      listeners.clear();
    },
  };
}
