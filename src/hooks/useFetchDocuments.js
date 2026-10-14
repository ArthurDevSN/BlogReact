import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { firestoreError } from "../utils/firestoreError";

export const useFetchDocuments = (docCollection, search = null, uid = null) => {
  const [documents, setDocuments] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe;

    setDocuments(null);
    setError(null);
    setLoading(true);
    setFromCache(false);

    const handleError = (fetchError) => {
      if (!active) return;
      setDocuments(null);
      setError(firestoreError(fetchError, "Não foi possível carregar os posts. Tente novamente."));
      setLoading(false);
      setFromCache(false);
    };

    try {
      const constraints = [];

      if (search) {
        constraints.push(where("tagsArray", "array-contains", search));
      } else if (uid) {
        constraints.push(where("uid", "==", uid));
      }

      constraints.push(orderBy("createdAt", "desc"));

      const documentsQuery = query(collection(db, docCollection), ...constraints);
      unsubscribe = onSnapshot(
        documentsQuery,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!active) return;

          setDocuments(
            snapshot.docs.map((document) => ({
              ...document.data(),
              id: document.id,
            }))
          );
          setError(null);
          setLoading(false);
          setFromCache(Boolean(snapshot.metadata?.fromCache));
        },
        handleError
      );
    } catch (fetchError) {
      handleError(fetchError);
    }

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, [docCollection, search, uid]);

  return { documents, loading, error, fromCache };
};
