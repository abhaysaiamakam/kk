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
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  arrayUnion, 
  addDoc 
} from 'firebase/firestore';
import { Language } from '../types';

export interface AuthSuccessResult {
  user: FirebaseUser;
  profile: UserProfileDocument | null;
  isNewUser: boolean;
}

export interface CaregiverConnectionRequest {
  id: string;
  caregiverUid: string;
  caregiverName: string;
  caregiverPhone: string;
  caregiverEmail: string;
  caregiverPhotoURL?: string;
  patientId: string;
  patientUid: string;
  patientName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
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
   * Generate a unique, permanent Patient ID (e.g. KK-PAT-8X92K)
   */
  async generateUniquePatientId(): Promise<string> {
    let isUnique = false;
    let candidate = '';
    let attempts = 0;

    while (!isUnique && attempts < 15) {
      attempts++;
      const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      candidate = `KK-PAT-${randomCode}`;

      try {
        const q = query(collection(firestore, 'users'), where('patientId', '==', candidate));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          isUnique = true;
        }
      } catch (err) {
        console.warn('Patient ID uniqueness check warn:', err);
        isUnique = true; // Fallback to candidate if offline
      }
    }

    return candidate || `KK-PAT-${Date.now().toString(36).substring(3, 8).toUpperCase()}`;
  },

  /**
   * Find patient by unique Patient ID
   */
  async findPatientById(patientId: string): Promise<{
    uid: string;
    fullName: string;
    phone?: string;
    photoURL?: string;
  } | null> {
    const formattedId = patientId.trim().toUpperCase();
    const path = `users?patientId=${formattedId}`;
    try {
      const q = query(
        collection(firestore, 'users'),
        where('patientId', '==', formattedId),
        where('role', '==', 'patient')
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const docData = snapshot.docs[0].data();
      return {
        uid: docData.uid,
        fullName: docData.fullName,
        phone: docData.phone,
        photoURL: docData.photoURL
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
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
    email: string,
    password: string,
    rememberMe: boolean = true
  ): Promise<AuthSuccessResult> {
    const trimmedInput = email.trim();

    // Check if input looks like a valid email address
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedInput);
    if (!isEmail) {
      throw new Error(
        'Please enter a valid email address (e.g. name@example.com).'
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
   * Register Patient
   */
  async registerPatient(params: {
    user: FirebaseUser;
    fullName: string;
    phone: string;
    ageOrDob: string;
    bloodGroup: string;
    caregiverName: string;
    caregiverPhone: string;
    preferredLanguage: Language;
    photoURL?: string;
  }): Promise<UserProfileDocument> {
    const patientId = await this.generateUniquePatientId();
    const now = new Date().toISOString();

    const profile: UserProfileDocument = {
      uid: params.user.uid,
      fullName: params.fullName.trim(),
      email: params.user.email || '',
      role: 'patient',
      preferredLanguage: params.preferredLanguage,
      patientId,
      phone: params.phone.trim(),
      age: params.ageOrDob.trim(),
      bloodGroup: params.bloodGroup,
      caregiverName: params.caregiverName.trim(),
      caregiverPhone: params.caregiverPhone.trim(),
      createdAt: now,
      updatedAt: now,
      isActive: true
    };
    if (params.photoURL || params.user.photoURL) {
      profile.photoURL = params.photoURL || params.user.photoURL || '';
    }

    const path = `users/${params.user.uid}`;
    try {
      await setDoc(doc(firestore, 'users', params.user.uid), profile);

      const patientDoc: Record<string, any> = {
        id: patientId,
        patientUid: params.user.uid,
        name: params.fullName.trim(),
        phone: params.phone.trim(),
        age: params.ageOrDob.trim(),
        bloodGroup: params.bloodGroup,
        caregiverId: params.caregiverName.trim() || 'pending',
        createdAt: now
      };
      if (params.photoURL || params.user.photoURL) {
        patientDoc.avatar = params.photoURL || params.user.photoURL || '';
      }

      // Also index in patients collection for quick access
      await setDoc(doc(firestore, 'patients', patientId), patientDoc);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }

    return profile;
  },

  /**
   * Register Caregiver
   */
  async registerCaregiver(params: {
    user: FirebaseUser;
    fullName: string;
    phone: string;
    patientId: string;
    preferredLanguage: Language;
    photoURL?: string;
  }): Promise<{ profile: UserProfileDocument; connectionRequest: CaregiverConnectionRequest }> {
    // 1. Verify patient exists
    const targetPatient = await this.findPatientById(params.patientId);
    if (!targetPatient) {
      throw new Error(
        `Patient ID "${params.patientId}" was not found. Please verify the Patient ID with your patient.`
      );
    }

    const now = new Date().toISOString();

    // 2. Create Caregiver User Profile
    const profile: UserProfileDocument = {
      uid: params.user.uid,
      fullName: params.fullName.trim(),
      email: params.user.email || '',
      role: 'caregiver',
      preferredLanguage: params.preferredLanguage,
      phone: params.phone.trim(),
      pendingPatientIds: [params.patientId.toUpperCase()],
      connectedPatientIds: [],
      createdAt: now,
      updatedAt: now,
      isActive: true
    };
    if (params.photoURL || params.user.photoURL) {
      profile.photoURL = params.photoURL || params.user.photoURL || '';
    }

    const userPath = `users/${params.user.uid}`;
    try {
      await setDoc(doc(firestore, 'users', params.user.uid), profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, userPath);
    }

    // 3. Create Caregiver Connection Request for Patient Approval
    const requestId = `req-${params.user.uid.slice(0, 6)}-${Date.now()}`;
    const connectionRequest: CaregiverConnectionRequest = {
      id: requestId,
      caregiverUid: params.user.uid,
      caregiverName: params.fullName.trim(),
      caregiverPhone: params.phone.trim(),
      caregiverEmail: params.user.email || '',
      patientId: params.patientId.toUpperCase(),
      patientUid: targetPatient.uid,
      patientName: targetPatient.fullName,
      status: 'pending',
      createdAt: now
    };
    if (params.photoURL || params.user.photoURL) {
      connectionRequest.caregiverPhotoURL = params.photoURL || params.user.photoURL || '';
    }

    const reqPath = `caregiverRequests/${requestId}`;
    try {
      await setDoc(doc(firestore, 'caregiverRequests', requestId), connectionRequest);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, reqPath);
    }

    return { profile, connectionRequest };
  },

  /**
   * Send Connection Request for Caregiver connecting additional patient
   */
  async requestConnectAdditionalPatient(params: {
    caregiverUid: string;
    caregiverName: string;
    caregiverPhone: string;
    caregiverEmail: string;
    caregiverPhotoURL?: string;
    patientId: string;
  }): Promise<{ connectionRequest: CaregiverConnectionRequest; patientName: string }> {
    const targetPatient = await this.findPatientById(params.patientId);
    if (!targetPatient) {
      throw new Error(
        `Patient ID "${params.patientId}" was not found. Please verify the Patient ID.`
      );
    }

    const now = new Date().toISOString();
    const requestId = `req-${params.caregiverUid.slice(0, 6)}-${Date.now()}`;
    const connectionRequest: CaregiverConnectionRequest = {
      id: requestId,
      caregiverUid: params.caregiverUid,
      caregiverName: params.caregiverName,
      caregiverPhone: params.caregiverPhone,
      caregiverEmail: params.caregiverEmail,
      caregiverPhotoURL: params.caregiverPhotoURL,
      patientId: params.patientId.toUpperCase(),
      patientUid: targetPatient.uid,
      patientName: targetPatient.fullName,
      status: 'pending',
      createdAt: now
    };

    const reqPath = `caregiverRequests/${requestId}`;
    try {
      await setDoc(doc(firestore, 'caregiverRequests', requestId), connectionRequest);
      // Update caregiver user profile pendingPatientIds
      await updateDoc(doc(firestore, 'users', params.caregiverUid), {
        pendingPatientIds: arrayUnion(params.patientId.toUpperCase())
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, reqPath);
    }

    return { connectionRequest, patientName: targetPatient.fullName };
  },

  /**
   * Get pending caregiver requests for a patient
   */
  async getPendingRequestsForPatient(patientUid: string): Promise<CaregiverConnectionRequest[]> {
    const path = `caregiverRequests?patientUid=${patientUid}`;
    try {
      const q = query(
        collection(firestore, 'caregiverRequests'),
        where('patientUid', '==', patientUid),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as CaregiverConnectionRequest);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  /**
   * Respond to caregiver connection request (Approve or Reject)
   */
  async respondToConnectionRequest(
    request: CaregiverConnectionRequest,
    approve: boolean
  ): Promise<void> {
    const reqPath = `caregiverRequests/${request.id}`;
    const newStatus = approve ? 'approved' : 'rejected';

    try {
      // 1. Update Request Doc
      await updateDoc(doc(firestore, 'caregiverRequests', request.id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      if (approve) {
        // 2. Add caregiver to Patient profile
        await updateDoc(doc(firestore, 'users', request.patientUid), {
          caregiverIds: arrayUnion(request.caregiverUid)
        });

        // 3. Add patientId to Caregiver profile connectedPatientIds
        await updateDoc(doc(firestore, 'users', request.caregiverUid), {
          connectedPatientIds: arrayUnion(request.patientId)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, reqPath);
    }
  },

  /**
   * Create new Email & Password Auth Account
   */
  async createAuthAccount(email: string, password: string, fullName: string): Promise<FirebaseUser> {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    try {
      await updateProfile(user, {
        displayName: fullName.trim()
      });
    } catch (err) {
      console.warn('Could not update Auth displayName:', err);
    }

    return user;
  },

  /**
   * Update Profile photo / fields
   */
  async updateUserProfile(uid: string, updates: Partial<UserProfileDocument>): Promise<void> {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(firestore, 'users', uid), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
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
