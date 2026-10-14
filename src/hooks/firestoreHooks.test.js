import { StrictMode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useDeleteDocument } from "./useDeleteDocument";
import { useFetchDocument } from "./useFetchDocument";
import { useFetchDocuments } from "./useFetchDocuments";
import { useInsertDocument } from "./useInsertDocuments";
import { useUpdateDocument } from "./useUpdateDocument";

jest.mock("../firebase/config", () => ({ db: { name: "test-db" } }));
jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const snapshot = (id, data) => ({
  id,
  exists: () => true,
  data: () => data,
});

beforeEach(() => {
  jest.resetAllMocks();
  collection.mockImplementation((database, path) => ({ path }));
  doc.mockImplementation((database, path, id) => ({ path, id }));
  query.mockImplementation((reference, ...constraints) => ({ reference, constraints }));
  orderBy.mockImplementation((...args) => ({ orderBy: args }));
  where.mockImplementation((...args) => ({ where: args }));
  onSnapshot.mockReturnValue(jest.fn());
  serverTimestamp.mockReturnValue({ serverTimestamp: true });
});

test("the feed waits for the snapshot and requests the newest posts first", () => {
  const unsubscribe = jest.fn();
  onSnapshot.mockReturnValue(unsubscribe);
  const { result, unmount } = renderHook(() => useFetchDocuments("post"));

  expect(result.current).toEqual({ documents: null, loading: true, error: null, fromCache: false });
  expect(orderBy).toHaveBeenCalledWith("createdAt", "desc");
  expect(onSnapshot).toHaveBeenCalledTimes(1);
  expect(onSnapshot.mock.calls[0][1]).toEqual({ includeMetadataChanges: true });

  act(() => {
    onSnapshot.mock.calls[0][2]({
      docs: [snapshot("real-id", { id: "untrusted-id", title: "Newest" })],
    });
  });

  expect(result.current).toEqual({
    documents: [{ id: "real-id", title: "Newest" }],
    loading: false,
    error: null,
    fromCache: false,
  });
  unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});

test("an empty cache snapshot remains distinguishable from a server-confirmed empty query", () => {
  const { result } = renderHook(() => useFetchDocuments("post"));
  const listener = onSnapshot.mock.calls[0][2];
  const docs = [];

  act(() => listener({ docs, metadata: { fromCache: true } }));
  expect(result.current).toEqual({
    documents: [],
    loading: false,
    error: null,
    fromCache: true,
  });

  act(() => listener({ docs, metadata: { fromCache: false } }));
  expect(result.current).toEqual({
    documents: [],
    loading: false,
    error: null,
    fromCache: false,
  });
});

test("metadata-only updates expose when cached posts have been confirmed by the server", () => {
  const { result } = renderHook(() => useFetchDocuments("post"));
  const listener = onSnapshot.mock.calls[0][2];
  const docs = [snapshot("cached", { title: "Cached post" })];

  act(() => listener({ docs, metadata: { fromCache: true } }));
  expect(result.current.fromCache).toBe(true);
  expect(result.current.documents).toEqual([{ id: "cached", title: "Cached post" }]);

  act(() => listener({ docs, metadata: { fromCache: false } }));
  expect(result.current).toEqual({
    documents: [{ id: "cached", title: "Cached post" }],
    loading: false,
    error: null,
    fromCache: false,
  });
});

test("filter changes remove the old listener and ignore its late callbacks", () => {
  const unsubscribe = jest.fn();
  onSnapshot.mockReturnValue(unsubscribe);
  const { result, rerender } = renderHook(
    ({ tag }) => useFetchDocuments("post", tag),
    { initialProps: { tag: "react" } }
  );
  const oldListener = onSnapshot.mock.calls[0];
  act(() => oldListener[2]({
    docs: [snapshot("old", { title: "Old" })],
    metadata: { fromCache: true },
  }));
  expect(result.current.fromCache).toBe(true);

  rerender({ tag: "firebase" });
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  expect(result.current).toEqual({ documents: null, loading: true, error: null, fromCache: false });
  expect(where).toHaveBeenLastCalledWith("tagsArray", "array-contains", "firebase");

  act(() => {
    oldListener[2]({ docs: [snapshot("stale", {})], metadata: { fromCache: true } });
    oldListener[3](new Error("stale error"));
  });
  expect(result.current).toEqual({ documents: null, loading: true, error: null, fromCache: false });

  act(() => onSnapshot.mock.calls[1][2]({ docs: [] }));
  expect(result.current).toEqual({ documents: [], loading: false, error: null, fromCache: false });
});

test("the owner filter creates a single ordered subscription", () => {
  renderHook(() => useFetchDocuments("post", null, "owner-1"));

  expect(where).toHaveBeenCalledWith("uid", "==", "owner-1");
  expect(orderBy).toHaveBeenCalledWith("createdAt", "desc");
  expect(onSnapshot).toHaveBeenCalledTimes(1);
});

test("snapshot errors are exposed instead of being treated as an empty result", () => {
  const { result } = renderHook(() => useFetchDocuments("post"));

  act(() => onSnapshot.mock.calls[0][2]({ docs: [], metadata: { fromCache: true } }));
  act(() => onSnapshot.mock.calls[0][3](new Error("The query requires an index.")));

  expect(result.current).toEqual({
    documents: null,
    loading: false,
    error: "The query requires an index.",
    fromCache: false,
  });
});

test("synchronous Firestore setup failures stop loading", () => {
  collection.mockImplementationOnce(() => {
    throw new Error("Invalid collection");
  });
  const { result } = renderHook(() => useFetchDocuments(""));

  expect(result.current).toEqual({
    documents: null,
    loading: false,
    error: "Invalid collection",
    fromCache: false,
  });
});

test("StrictMode leaves only its current subscription active", () => {
  const unsubscribe = jest.fn();
  onSnapshot.mockReturnValue(unsubscribe);
  const { result, unmount } = renderHook(() => useFetchDocuments("post"), {
    wrapper: StrictMode,
  });

  expect(onSnapshot).toHaveBeenCalledTimes(2);
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  act(() => onSnapshot.mock.calls[0][2]({ docs: [snapshot("old", {})] }));
  expect(result.current.loading).toBe(true);
  act(() => onSnapshot.mock.calls[1][2]({ docs: [] }));
  expect(result.current.documents).toEqual([]);
  unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(2);
});

test("an older document request cannot replace the current post", async () => {
  const oldRequest = deferred();
  const newRequest = deferred();
  getDoc.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
  const { result, rerender } = renderHook(
    ({ id }) => useFetchDocument("post", id),
    { initialProps: { id: "old" } }
  );

  rerender({ id: "new" });
  await act(async () => newRequest.resolve(snapshot("new", { title: "Current" })));
  await act(async () => oldRequest.resolve(snapshot("old", { title: "Stale" })));

  expect(result.current).toEqual({
    document: { id: "new", title: "Current" },
    loading: false,
    error: null,
  });
});

test("changing document ids clears the previous document while loading", async () => {
  getDoc.mockResolvedValueOnce(snapshot("first", { title: "First" }));
  getDoc.mockReturnValueOnce(new Promise(() => {}));
  const { result, rerender } = renderHook(
    ({ id }) => useFetchDocument("post", id),
    { initialProps: { id: "first" } }
  );
  await waitFor(() => expect(result.current.document?.title).toBe("First"));

  rerender({ id: "second" });
  expect(result.current).toEqual({ document: null, loading: true, error: null });
});

test("a nonexistent document is distinct from a failed request and stops loading", async () => {
  getDoc.mockResolvedValue({ exists: () => false });
  const { result } = renderHook(() => useFetchDocument("post", "missing"));
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current).toEqual({
    document: null,
    loading: false,
    error: null,
  });
});

test("Firestore errors are translated instead of exposing SDK details", () => {
  const { result } = renderHook(() => useFetchDocuments("post"));
  act(() => onSnapshot.mock.calls[0][3]({
    code: "permission-denied",
    message: "Missing or insufficient permissions.",
  }));
  expect(result.current.error).toBe("Você não tem permissão para realizar esta ação.");
  expect(result.current.loading).toBe(false);
});

test("document request errors reset when a new request starts", async () => {
  getDoc.mockRejectedValueOnce(new Error("Permission denied"));
  getDoc.mockReturnValueOnce(new Promise(() => {}));
  const { result, rerender } = renderHook(
    ({ id }) => useFetchDocument("post", id),
    { initialProps: { id: "first" } }
  );
  await waitFor(() => expect(result.current.error).toBe("Permission denied"));

  rerender({ id: "second" });
  expect(result.current).toEqual({ document: null, loading: true, error: null });
});

test("insert returns the created reference and uses a server timestamp", async () => {
  const reference = { id: "created" };
  const payload = { title: "New post", createdAt: "client-provided" };
  addDoc.mockResolvedValue(reference);
  const { result } = renderHook(() => useInsertDocument("post"));
  let returned;

  await act(async () => {
    returned = await result.current.insertDocument(payload);
  });

  expect(returned).toBe(reference);
  expect(addDoc).toHaveBeenCalledWith(
    { path: "post" },
    { title: "New post", createdAt: { serverTimestamp: true } }
  );
  expect(payload.createdAt).toBe("client-provided");
  expect(result.current.response).toEqual({ loading: false, error: null });
});

test("delete waits for Firestore, returns true, and clears its loading state", async () => {
  const request = deferred();
  deleteDoc.mockReturnValue(request.promise);
  const { result } = renderHook(() => useDeleteDocument("post"));
  let operation;

  act(() => {
    operation = result.current.deleteDocument("post-1");
  });
  expect(result.current.response.loading).toBe(true);
  expect(deleteDoc).toHaveBeenCalledWith({ path: "post", id: "post-1" });

  await act(async () => request.resolve());
  expect(await operation).toBe(true);
  expect(result.current.response).toEqual({ loading: false, error: null });
});

test("update returns true only after persisting the provided fields", async () => {
  updateDoc.mockResolvedValue(undefined);
  const { result } = renderHook(() => useUpdateDocument("post"));
  let returned;

  await act(async () => {
    returned = await result.current.updateDocument("post-1", { title: "Updated" });
  });

  expect(returned).toBe(true);
  expect(updateDoc).toHaveBeenCalledWith(
    { path: "post", id: "post-1" },
    { title: "Updated" }
  );
  expect(result.current.response).toEqual({ loading: false, error: null });
});

test.each([
  ["insert", useInsertDocument, "insertDocument", addDoc, null, [{ title: "New" }]],
  ["update", useUpdateDocument, "updateDocument", updateDoc, false, ["post-1", {}]],
  ["delete", useDeleteDocument, "deleteDocument", deleteDoc, false, ["post-1"]],
])("%s returns an explicit failure result and exposes its error", async (
  name,
  useMutation,
  method,
  firestoreMethod,
  failureResult,
  args
) => {
  firestoreMethod.mockRejectedValue(new Error("Permission denied"));
  const { result } = renderHook(() => useMutation("post"));
  let returned;

  await act(async () => {
    returned = await result.current[method](...args);
  });

  expect(returned).toBe(failureResult);
  expect(result.current.response).toEqual({ loading: false, error: "Permission denied" });
});

test("a retry clears the previous mutation error while it is pending", async () => {
  updateDoc.mockRejectedValueOnce(new Error("Temporary error"));
  const retry = deferred();
  updateDoc.mockReturnValueOnce(retry.promise);
  const { result } = renderHook(() => useUpdateDocument("post"));
  await act(async () => result.current.updateDocument("post-1", {}));
  expect(result.current.response.error).toBe("Temporary error");

  let operation;
  act(() => {
    operation = result.current.updateDocument("post-1", {});
  });
  expect(result.current.response).toEqual({ loading: true, error: null });
  await act(async () => retry.resolve());
  expect(await operation).toBe(true);
});

test("an older mutation cannot overwrite a newer operation's loading state", async () => {
  const older = deferred();
  const newer = deferred();
  updateDoc.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
  const { result } = renderHook(() => useUpdateDocument("post"));
  let oldOperation;
  let newOperation;

  act(() => {
    oldOperation = result.current.updateDocument("post-1", { title: "Older" });
    newOperation = result.current.updateDocument("post-1", { title: "Newer" });
  });
  await act(async () => older.reject(new Error("Old failure")));
  expect(await oldOperation).toBe(false);
  expect(result.current.response).toEqual({ loading: true, error: null });

  await act(async () => newer.resolve());
  expect(await newOperation).toBe(true);
  expect(result.current.response).toEqual({ loading: false, error: null });
});

test("collection changes reset mutations and ignore old request completions", async () => {
  const request = deferred();
  updateDoc.mockReturnValue(request.promise);
  const { result, rerender } = renderHook(
    ({ path }) => useUpdateDocument(path),
    { initialProps: { path: "first" } }
  );
  let operation;
  act(() => {
    operation = result.current.updateDocument("post-1", {});
  });

  rerender({ path: "second" });
  expect(result.current.response).toEqual({ loading: false, error: null });
  await act(async () => request.reject(new Error("Old collection error")));
  expect(await operation).toBe(false);
  expect(result.current.response).toEqual({ loading: false, error: null });
});

test("a mutation callback retained after unmount does not write to Firestore", async () => {
  const { result, unmount } = renderHook(() => useDeleteDocument("post"));
  const deleteDocument = result.current.deleteDocument;
  unmount();

  expect(await deleteDocument("post-1")).toBe(false);
  expect(deleteDoc).not.toHaveBeenCalled();
});

test("mutation hooks remain usable after the StrictMode effect replay", async () => {
  deleteDoc.mockResolvedValue(undefined);
  const { result } = renderHook(() => useDeleteDocument("post"), { wrapper: StrictMode });
  let returned;

  await act(async () => {
    returned = await result.current.deleteDocument("post-1");
  });

  expect(returned).toBe(true);
  expect(deleteDoc).toHaveBeenCalledTimes(1);
  expect(result.current.response).toEqual({ loading: false, error: null });
});
