import { useEffect, useState } from 'react';

export function useClientOnlyValue<T>(value: T, fallback: T): T {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? value : fallback;
}
