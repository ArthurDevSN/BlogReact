import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { firestoreError } from "../utils/firestoreError";

export const useFetchDocument = (docCollection, id) => {
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setDocument(null);
    setError(null);
    setLoading(true);

    const loadDocument = async () => {
      try {
        if (!id) return;

        const snapshot = await getDoc(doc(db, docCollection, id));
        if (!active) return;

        if (!snapshot.exists()) return;

        setDocument({ ...snapshot.data(), id: snapshot.id });
      } catch (fetchError) {
        if (!active) return;
        setError(firestoreError(fetchError, "Não foi possível carregar o post. Tente novamente."));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDocument();

    return () => {
      active = false;
    };
  }, [docCollection, id]);

  return { document, loading, error };
};
