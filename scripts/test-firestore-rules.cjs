// Run through the Firebase CLI emulator, never against a deployed project:
// firebase emulators:exec --only firestore --project demo-miniblog-review "node scripts/test-firestore-rules.cjs"
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase/app');
const {
  collection, connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs,
  getFirestore, serverTimestamp, setDoc, setLogLevel, terminate, Timestamp, updateDoc,
} = require('firebase/firestore');

const projectId = process.env.GCLOUD_PROJECT || 'demo-miniblog-review';
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
assert(projectId.startsWith('demo-'), 'Use a demo- project for these tests.');
assert(emulatorHost, 'Run this script with firebase emulators:exec --only firestore.');
const endpoint = new URL(`http://${emulatorHost}`);
assert(['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname), 'Use a local Firestore emulator.');
setLogLevel('silent');

const clients = [];
function client(name, uid) {
  const app = initializeApp({ projectId }, name);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, endpoint.hostname, Number(endpoint.port), uid ? { mockUserToken: { sub: uid } } : undefined);
  clients.push({ app, db });
  return db;
}

let checks = 0;
async function allowed(action, description) {
  await action;
  checks += 1;
  console.log(`PASS ${description}`);
}
async function denied(action, description) {
  await assert.rejects(action, (error) => error.code === 'permission-denied', description);
  checks += 1;
  console.log(`PASS ${description}`);
}

async function main() {
  const owner = client('rules-owner', 'author-1');
  const other = client('rules-other', 'author-2');
  const guest = client('rules-public');
  const postId = `rules-test-${Date.now()}`;
  const post = (db) => doc(db, 'post', postId);
  const data = {
    title: 'Post de teste', image: 'https://example.com/image.jpg', body: 'Conteúdo de teste',
    tagsArray: ['teste'], uid: 'author-1', createdBy: 'Autora', createdAt: serverTimestamp(),
  };

  try {
    await allowed(setDoc(post(owner), data), 'owner creates a post with server timestamp');
    await allowed(getDoc(post(guest)), 'public reads a post');
    await allowed(getDocs(collection(guest, 'post')), 'public lists posts');
    await denied(setDoc(doc(guest, 'post', `${postId}-guest`), data), 'guest cannot create');
    await denied(setDoc(doc(other, 'post', `${postId}-forged`), data), 'cannot create for another uid');
    await denied(updateDoc(post(guest), { title: 'Alterado' }), 'guest cannot edit');
    await denied(deleteDoc(post(guest)), 'guest cannot delete');
    await denied(updateDoc(post(other), { title: 'Alterado' }), 'another author cannot edit');
    await denied(deleteDoc(post(other)), 'another author cannot delete');
    await allowed(updateDoc(post(owner), { title: 'Título atualizado', tagsArray: ['react', 'firebase'] }), 'owner edits content');
    await denied(updateDoc(post(owner), { uid: 'author-2' }), 'uid is immutable');
    await denied(updateDoc(post(owner), { createdAt: Timestamp.fromMillis(1) }), 'creation time is immutable');
    await denied(updateDoc(post(owner), { createdBy: 'Outra pessoa' }), 'author name is immutable');
    await denied(updateDoc(post(owner), { admin: true }), 'unknown fields are rejected');
    await denied(updateDoc(post(owner), { title: '' }), 'empty titles are rejected');
    await denied(updateDoc(post(owner), { title: 'x'.repeat(201) }), 'long titles are rejected');
    await denied(updateDoc(post(owner), { body: 'x'.repeat(50001) }), 'long content is rejected');
    await denied(updateDoc(post(owner), { image: 'javascript:alert(1)' }), 'unsafe image protocols are rejected');
    await denied(updateDoc(post(owner), { tagsArray: [] }), 'empty tags are rejected');
    await denied(updateDoc(post(owner), { tagsArray: ['react', 'react'] }), 'duplicate tags are rejected');
    await denied(updateDoc(post(owner), { tagsArray: [{ injected: true }] }), 'non-string tags are rejected');
    await denied(updateDoc(post(owner), { tagsArray: ['x'.repeat(51)] }), 'long tags are rejected');
    await denied(updateDoc(post(owner), { tagsArray: Array.from({ length: 21 }, (_, index) => `tag${index}`) }), 'too many tags are rejected');
    await denied(updateDoc(post(owner), { tagsArray: [...Array.from({ length: 19 }, (_, index) => `tag${index}`), 42] }), 'last tag is validated');
    await denied(setDoc(doc(owner, 'post', `${postId}-clock`), { ...data, createdAt: Timestamp.fromMillis(1) }), 'forged creation time is rejected');
    await denied(getDoc(doc(guest, 'private', postId)), 'other collections are private');
    await denied(setDoc(doc(owner, 'private', postId), { value: true }), 'other collections cannot be written');
    await allowed(deleteDoc(post(owner)), 'owner deletes own post');
    console.log(`${checks} Firestore security checks passed.`);
  } finally {
    await deleteDoc(post(owner)).catch(() => {});
    for (const { app, db } of clients) {
      await terminate(db);
      await deleteApp(app);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
