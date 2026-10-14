import { useCallback } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useFirestoreMutation } from "./useFirestoreMutation";

export const useInsertDocument = (docCollection) => {
  const operation = useCallback(
    (document) =>
      addDoc(collection(db, docCollection), {
        ...document,
        createdAt: serverTimestamp(),
      }),
    [docCollection]
  );

  const { mutate: insertDocument, response } = useFirestoreMutation(operation, null);

  return { insertDocument, response };
};
