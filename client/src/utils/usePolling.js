// Custom hook that calls a function on a set interval
// Used by MessagesPage to fetch new messages
// Cleans up interval on component unmount
import { useEffect, useRef } from "react";

const usePolling = (callback, interval = 5000, enabled = true) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    callbackRef.current();
    const id = setInterval(() => callbackRef.current(), interval);
    return () => clearInterval(id);
  }, [interval, enabled]);
};

export default usePolling;