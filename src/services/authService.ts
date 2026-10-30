import {
  auth,
  firestore,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile,
  handleFirestoreError,
  OperationType,
  UserProfileDocument,
  FirebaseUser
} from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Language } from '../types';

export interface AuthSuccessResult {
  user: FirebaseUser;
  profile: UserProfileDocument | null;
  isNewUser: boolean;
}

export const authService = {
  /**
   * Set persistence based on "Remember Me"
   */
  async configurePersistence(rememberMe: boolean): Promise<void> {
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
    } catch (error) {
      console.warn('Failed to configure auth persistence:', error);
    }
  },

  /**
   * Real Google Authentication with account chooser
   */
  async signInWithGoogle(rememberMe: boolean = true): Promise<AuthSuccessResult> {
    await this.configurePersistence(rememberMe);

    // Prompt user to pick/authenticate their Google account
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user document already exists in Firestore
    const profile = await this.getUserProfile(user.uid);

    return {
      user,
      profile,
      isNewUser: !profile
    };
  },

  /**
   * Email and Password login
   */
  async signInWithEmail(
    emailOrUsername: string,
    password: string,
    rememberMe: boolean = true
  ): Promise<AuthSuccessResult> {
    const trimmedInput = emailOrUsername.trim();

    // Check if input looks like an email address
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedInput);
    if (!isEmail) {
      throw new Error(
        'Please enter a valid email address (e.g. name@example.com). MindCare requires email for secure password authentication.'
      );
    }

    await this.configurePersistence(rememberMe);
    const userCredential = await signInWithEmailAndPassword(auth, trimmedInput, password);
    const user = userCredential.user;

    const profile = await this.getUserProfile(user.uid);

    return {
      user,
      profile,
      isNewUser: !profile
    };
  },

  /**
   * Create new account with Email & Password
   */
  async registerWithEmail(params: {
    email: string;
    password: string;
    fullName: string;
    role: 'patient' | 'caregiver';
    preferredLanguage: Language;
    photoURL?: string;
  }): Promise<{ user: FirebaseUser; profile: UserProfileDocument }> {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      params.email.trim(),
      params.password
    );
    const user = userCredential.user;

    // Update Firebase Auth profile
    try {
      await updateProfile(user, {
        displayName: params.fullName.trim(),
        photoURL: params.photoURL || undefined
      });
    } catch (err) {
      console.warn('Could not update Auth displayName:', err);
    }

    // Create Firestore User Document
    const now = new Date().toISOString();
    const profile: UserProfileDocument = {
      uid: user.uid,
      fullName: params.fullName.trim(),
      email: params.email.trim(),
      role: params.role,
      preferredLanguage: params.preferredLanguage,
      photoURL: params.photoURL || user.photoURL || undefined,
      patientId: params.role === 'patient' ? `P-${user.uid.slice(0, 6).toUpperCase()}` : undefined,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };

    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(firestore, 'users', user.uid), profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }

    return { user, profile };
  },

  /**
   * Initialize profile in Firestore for new Google users
   */
  async createGoogleUserProfile(
    user: FirebaseUser,
    role: 'patient' | 'caregiver',
    preferredLanguage: Language
  ): Promise<UserProfileDocument> {
    const now = new Date().toISOString();
    const profile: UserProfileDocument = {
      uid: user.uid,
      fullName: user.displayName || 'MindCare User',
      email: user.email || '',
      role,
      preferredLanguage,
      photoURL: user.photoURL || undefined,
      patientId: role === 'patient' ? `P-${user.uid.slice(0, 6).toUpperCase()}` : undefined,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };

    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(firestore, 'users', user.uid), profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }

    return profile;
  },

  /**
   * Retrieve user profile from Firestore
   */
  async getUserProfile(uid: string): Promise<UserProfileDocument | null> {
    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(firestore, 'users', uid));
      if (snap.exists()) {
        return snap.data() as UserProfileDocument;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  /**
   * Send Password Reset Email
   */
  async sendPasswordReset(email: string): Promise<void> {
    const trimmed = email.trim();
    if (!trimmed) {
      throw new Error('Please enter your registered email address.');
    }
    await sendPasswordResetEmail(auth, trimmed);
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }
};
