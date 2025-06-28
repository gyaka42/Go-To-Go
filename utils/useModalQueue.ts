import { useEffect, useRef } from "react";
import { InteractionManager } from "react-native";

/**
 * Returns a function for opening modals sequentially. If another modal
 * is currently visible, it will be closed first and the requested modal
 * will open after all modals have unmounted.
 */
export default function useModalQueue(
  visibilities: (() => boolean)[],
  closeAll: () => void,
  wait = 300
) {
  const queued = useRef<(() => void) | null>(null);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  const tryOpen = () => {
    if (queued.current && visibilities.every((fn) => !fn())) {
      const action = queued.current;
      queued.current = null;
      action();
    }
  };

  return (open: () => void) => {
    if (visibilities.every((fn) => !fn())) {
      open();
    } else {
      queued.current = open;
      closeAll();
      if (timeout.current) clearTimeout(timeout.current);
      InteractionManager.runAfterInteractions(() => {
        timeout.current = setTimeout(tryOpen, wait);
      });
    }
  };
}
