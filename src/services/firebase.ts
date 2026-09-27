import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AttendanceRecord, LeaveRequest, UserRole } from '../types';

// Initialize Firebase SDK
export const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with the database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test required by Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return false;
  }
}

// Run connection validation on app boot
testFirestoreConnection();

// Google Sign-In with Firebase Auth
export async function signInWithGoogle(intendedRole: UserRole = 'student'): Promise<{
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    // Check if user already exists in Firestore users collection
    const userDocRef = doc(db, 'users', fbUser.uid);
    let userRole = intendedRole;

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        userRole = data.role || intendedRole;
        await updateDoc(userDocRef, {
          lastLoginAt: new Date().toISOString(),
          photoURL: fbUser.photoURL || undefined,
        });
      } else {
        await setDoc(userDocRef, {
          id: fbUser.uid,
          email: fbUser.email,
          fullName: fbUser.displayName || 'Google User',
          role: intendedRole,
          photoURL: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
      }
    } catch (fsErr) {
      handleFirestoreError(fsErr, OperationType.WRITE, `users/${fbUser.uid}`);
    }

    return {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      role: userRole,
    };
  } catch (error: any) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

// Sign-Out
export async function logOutFromFirebase(): Promise<void> {
  await signOut(auth);
}

// Firestore Attendance Persistence
export async function persistAttendanceToFirestore(
  records: Omit<AttendanceRecord, 'id' | 'createdAt'>[]
): Promise<void> {
  const timestamp = new Date().toISOString();
  for (const rec of records) {
    const docId = `att_${rec.studentId}_${rec.subjectId}_${rec.date}_${rec.timeSlot.replace(/[^a-zA-Z0-9]/g, '_')}`;
    try {
      await setDoc(doc(db, 'attendance', docId), {
        ...rec,
        id: docId,
        createdAt: timestamp,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `attendance/${docId}`);
    }
  }
}

// Firestore Leave Request Persistence
export async function persistLeaveToFirestore(
  leave: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'> & { id: number; status: string; appliedAt: string }
): Promise<void> {
  const docId = `leave_${leave.id}`;
  try {
    await setDoc(doc(db, 'leaves', docId), leave);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `leaves/${docId}`);
  }
}
