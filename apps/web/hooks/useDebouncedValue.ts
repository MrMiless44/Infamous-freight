import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(() => value);

  useEffect(() => {
    if (delayMs <= 0) {
      setDebounced(() => value);
      return;
    }
    const handle = setTimeout(() => setDebounced(() => value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

export default useDebouncedValue;
