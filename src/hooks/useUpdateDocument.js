import { useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useFirestoreMutation } from "./useFirestoreMutation";

export const useUpdateDocument = (docCollection) => {
  const operation = useCallback(
    async (id, data) => {
      await updateDoc(doc(db, docCollection, id), data);
      return true;
    },
    [docCollection]
  );

  const { mutate: updateDocument, response } = useFirestoreMutation(operation, false);

  return { updateDocument, response };
};
