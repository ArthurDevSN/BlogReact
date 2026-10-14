import { useCallback, useEffect, useRef, useState } from "react";
import { firestoreError } from "../utils/firestoreError";

const idleResponse = { loading: false, error: null };

// Only the latest operation may update state, including after a collection change.
export const useFirestoreMutation = (operation, failureResult) => {
  const [response, setResponse] = useState(idleResponse);
  const mounted = useRef(false);
  const requestId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    setResponse(idleResponse);

    return () => {
      mounted.current = false;
      requestId.current += 1;
    };
  }, [operation]);

  const mutate = useCallback(
    async (...args) => {
      if (!mounted.current) return failureResult;

      const currentRequest = ++requestId.current;
      setResponse({ loading: true, error: null });

      try {
        const result = await operation(...args);

        if (mounted.current && currentRequest === requestId.current) {
          setResponse(idleResponse);
        }

        return result;
      } catch (mutationError) {
        if (mounted.current && currentRequest === requestId.current) {
          setResponse({
            loading: false,
            error: firestoreError(mutationError, "Não foi possível concluir a operação. Tente novamente."),
          });
        }

        return failureResult;
      }
    },
    [operation, failureResult]
  );

  return { mutate, response };
};
