import { useCallback } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useFirestoreMutation } from "./useFirestoreMutation";

export const useDeleteDocument = (docCollection) => {
  const operation = useCallback(
    async (id) => {
      await deleteDoc(doc(db, docCollection, id));
      return true;
    },
    [docCollection]
  );

  const { mutate: deleteDocument, response } = useFirestoreMutation(operation, false);

  return { deleteDocument, response };
};
