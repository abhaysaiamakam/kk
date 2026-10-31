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
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  deleteDoc,
  arrayRemove,
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
  addDoc,
  onSnapshot
} from 'firebase/firestore';
import { Language, PatientProfile } from '../types';
import { calculateAgeFromDob } from '../utils/ageUtils';

export interface AuthSuccessResult {
  user: FirebaseUser;
  profile: UserProfileDocument | null;
  isNewUser: boolean;
}

export interface CaregiverConnectionRequest {
  id: string;
  requestId: string;
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
    if (!formattedId) return null;

    try {
      // 1. Direct document check in patients collection
      const patientRef = doc(firestore, 'patients', formattedId);
      const patientSnap = await getDoc(patientRef);
      if (patientSnap.exists()) {
        const pData = patientSnap.data();
        return {
          uid: pData.patientUid || pData.uid || formattedId,
          fullName: pData.name || pData.fullName || 'Patient',
          phone: pData.phone,
          photoURL: pData.avatar || pData.photoURL
        };
      }

      // 2. Query patients collection by id field
      const qPatients = query(collection(firestore, 'patients'), where('id', '==', formattedId));
      const pSnap = await getDocs(qPatients);
      if (!pSnap.empty) {
        const pData = pSnap.docs[0].data();
        return {
          uid: pData.patientUid || pData.uid || formattedId,
          fullName: pData.name || pData.fullName || 'Patient',
          phone: pData.phone,
          photoURL: pData.avatar || pData.photoURL
        };
      }

      // 3. Query users collection by patientId
      const qUsers = query(
        collection(firestore, 'users'),
        where('patientId', '==', formattedId)
      );
      const uSnap = await getDocs(qUsers);
      if (!uSnap.empty) {
        const uData = uSnap.docs[0].data();
        return {
          uid: uData.uid,
          fullName: uData.fullName,
          phone: uData.phone,
          photoURL: uData.photoURL
        };
      }

      return null;
    } catch (error) {
      console.warn('findPatientById lookup note:', error);
      return null;
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
      requestId: requestId,
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
    const formattedPatientId = params.patientId.trim().toUpperCase();
    console.log('[CaregiverConnection] Verifying Patient ID:', formattedPatientId);

    // 1. Verify Patient ID exists
    const targetPatient = await this.findPatientById(formattedPatientId);
    if (!targetPatient) {
      console.warn('[CaregiverConnection] Patient ID not found:', formattedPatientId);
      throw new Error(`Patient ID "${formattedPatientId}" does not exist. Please check the ID and try again.`);
    }

    console.log('[CaregiverConnection] Patient ID verified successfully:', targetPatient);

    // 2. Check if caregiver is already connected to this patient
    const caregiverProfile = await this.getUserProfile(params.caregiverUid);
    if (caregiverProfile?.connectedPatientIds?.includes(formattedPatientId)) {
      throw new Error(`You are already connected to patient "${targetPatient.fullName}".`);
    }

    // 3. Check if a request is already pending
    const existingPending = await this.getPendingRequestsForPatient(targetPatient.uid, formattedPatientId);
    const hasPendingFromMe = existingPending.some(r => r.caregiverUid === params.caregiverUid);
    if (hasPendingFromMe) {
      throw new Error(`A connection request is already pending for patient "${targetPatient.fullName}".`);
    }

    const now = new Date().toISOString();
    const requestId = `req-${params.caregiverUid.slice(0, 6)}-${Date.now()}`;
    const connectionRequest: CaregiverConnectionRequest = {
      id: requestId,
      requestId: requestId,
      caregiverUid: params.caregiverUid,
      caregiverName: params.caregiverName,
      caregiverPhone: params.caregiverPhone,
      caregiverEmail: params.caregiverEmail,
      caregiverPhotoURL: params.caregiverPhotoURL,
      patientId: formattedPatientId,
      patientUid: targetPatient.uid,
      patientName: targetPatient.fullName,
      status: 'pending',
      createdAt: now
    };

    const reqPath = `caregiverRequests/${requestId}`;
    try {
      console.log('[CaregiverConnection] Creating connection request document:', requestId, connectionRequest);
      await setDoc(doc(firestore, 'caregiverRequests', requestId), connectionRequest);
      
      // Update caregiver user profile pendingPatientIds
      await updateDoc(doc(firestore, 'users', params.caregiverUid), {
        pendingPatientIds: arrayUnion(formattedPatientId)
      });
      console.log('[CaregiverConnection] Connection request sent successfully to patient UID:', targetPatient.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, reqPath);
    }

    return { connectionRequest, patientName: targetPatient.fullName };
  },

  /**
   * Get pending caregiver requests for a patient by UID or Patient ID
   */
  async getPendingRequestsForPatient(patientUid: string, patientId?: string): Promise<CaregiverConnectionRequest[]> {
    const path = `caregiverRequests?patientUid=${patientUid}`;
    try {
      const results: CaregiverConnectionRequest[] = [];
      const seenIds = new Set<string>();

      // Query by patientUid
      if (patientUid) {
        const qUid = query(
          collection(firestore, 'caregiverRequests'),
          where('patientUid', '==', patientUid),
          where('status', '==', 'pending')
        );
        const snapUid = await getDocs(qUid);
        for (const docSnap of snapUid.docs) {
          const data = docSnap.data() as CaregiverConnectionRequest;
          if (!seenIds.has(data.id)) {
            seenIds.add(data.id);
            results.push(data);
          }
        }
      }

      // Query by patientId if available
      if (patientId) {
        const qId = query(
          collection(firestore, 'caregiverRequests'),
          where('patientId', '==', patientId.toUpperCase()),
          where('status', '==', 'pending')
        );
        const snapId = await getDocs(qId);
        for (const docSnap of snapId.docs) {
          const data = docSnap.data() as CaregiverConnectionRequest;
          if (!seenIds.has(data.id)) {
            seenIds.add(data.id);
            results.push(data);
          }
        }
      }

      return results;
    } catch (error) {
      console.warn('getPendingRequestsForPatient note:', error);
      return [];
    }
  },

  /**
   * Real-time listener for pending connection requests on the recipient's dashboard (onSnapshot)
   */
  subscribeToPendingRequestsForPatient(
    patientUid: string,
    patientId: string | undefined,
    onUpdate: (requests: CaregiverConnectionRequest[]) => void,
    onError?: (err: any) => void
  ): () => void {
    console.log(`[CaregiverConnection] Starting real-time onSnapshot listener for patientUid: "${patientUid}", patientId: "${patientId}"`);

    const q = query(
      collection(firestore, 'caregiverRequests'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results: CaregiverConnectionRequest[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as CaregiverConnectionRequest;
          const matchesUid = patientUid && data.patientUid === patientUid;
          const matchesId = patientId && data.patientId && data.patientId.toUpperCase() === patientId.toUpperCase();
          if (matchesUid || matchesId) {
            results.push({
              ...data,
              id: data.id || docSnap.id
            });
          }
        });
        console.log(`[CaregiverConnection] Real-time snapshot update: ${results.length} pending request(s) found for patient.`);
        onUpdate(results);
      },
      (error) => {
        console.error('[CaregiverConnection] Snapshot listener error:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  },

  /**
   * Respond to caregiver connection request (Accept or Reject)
   */
  async respondToConnectionRequest(
    request: CaregiverConnectionRequest,
    approve: boolean
  ): Promise<void> {
    const reqPath = `caregiverRequests/${request.id}`;
    const newStatus = approve ? 'accepted' : 'rejected';
    console.log(`[CaregiverConnection] Responding to request ${request.id}: ${newStatus}`);

    try {
      // 1. Update Request Doc
      await updateDoc(doc(firestore, 'caregiverRequests', request.id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      if (approve) {
        // 2. Add caregiver details to Patient profile
        await updateDoc(doc(firestore, 'users', request.patientUid), {
          caregiverIds: arrayUnion(request.caregiverUid),
          caregiverName: request.caregiverName,
          caregiverPhone: request.caregiverPhone
        });

        // 3. Update patient index document
        if (request.patientId) {
          try {
            await updateDoc(doc(firestore, 'patients', request.patientId), {
              caregiverId: request.caregiverUid,
              caregiverName: request.caregiverName,
              caregiverPhone: request.caregiverPhone
            });
          } catch (e) {
            console.warn('Patient index update note:', e);
          }
        }

        // 4. Add patientId to Caregiver profile connectedPatientIds
        await updateDoc(doc(firestore, 'users', request.caregiverUid), {
          connectedPatientIds: arrayUnion(request.patientId)
        });
        console.log(`[CaregiverConnection] Patient-Caregiver relationship established between patient ${request.patientUid} and caregiver ${request.caregiverUid}`);
      } else {
        console.log(`[CaregiverConnection] Request ${request.id} rejected.`);
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
   * Retrieve connected patient profiles for a caregiver from Firestore
   */
  async getPatientsForCaregiver(caregiverUid: string, connectedPatientIds?: string[]): Promise<PatientProfile[]> {
    try {
      const results: PatientProfile[] = [];
      const userProfile = await this.getUserProfile(caregiverUid);
      const patientIds = connectedPatientIds || userProfile?.connectedPatientIds || [];

      if (patientIds.length === 0) {
        return [];
      }

      for (const pId of patientIds) {
        const patientMatch = await this.findPatientById(pId);
        if (patientMatch) {
          const userDoc = await this.getUserProfile(patientMatch.uid);
          const name = userDoc?.fullName || patientMatch.fullName || 'Patient';
          const dobOrAge = userDoc?.dateOfBirth || userDoc?.age || '70';
          const dobStr = typeof dobOrAge === 'string' ? dobOrAge : String(dobOrAge);
          const calculatedAge = calculateAgeFromDob(dobStr);

          results.push({
            id: userDoc?.patientId || pId,
            uid: patientMatch.uid,
            name: name,
            phone: userDoc?.phone || patientMatch.phone || '',
            age: calculatedAge,
            gender: 'Not added yet',
            bloodGroup: userDoc?.bloodGroup || 'Not added yet',
            homeLocation: 'Not added yet',
            liveLocationEnabled: false,
            dateOfBirth: dobStr,
            avatar: userDoc?.photoURL || patientMatch.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
            status: 'all_good',
            streakDays: 0,
            overallCompletion: 0,
            caregiverId: userDoc?.caregiverName ? `${userDoc.caregiverName} (${userDoc.caregiverPhone || 'No phone'})` : 'Not added yet',
            caregiverName: userDoc?.caregiverName,
            caregiverPhone: userDoc?.caregiverPhone
          });
        }
      }
      return results;
    } catch (err) {
      console.warn('getPatientsForCaregiver error:', err);
      return [];
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
   * Securely delete user account: Re-authenticates, deletes Firestore profile & data, cleans relationships, and deletes Auth user
   */
  async deleteAccount(params: {
    password?: string;
    isGoogleUser?: boolean;
  }): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found. Please sign in again.');
    }

    const uid = user.uid;

    // 1. Re-authenticate user
    if (params.isGoogleUser || user.providerData.some(p => p.providerId === 'google.com')) {
      try {
        await reauthenticateWithPopup(user, googleProvider);
      } catch (reauthErr: any) {
        if (reauthErr?.code === 'auth/popup-closed-by-user') {
          throw new Error('Google re-authentication was cancelled. Re-authentication is required before deleting account.');
        }
        // Fallback popup
        await signInWithPopup(auth, googleProvider);
      }
    } else if (params.password) {
      if (!user.email) {
        throw new Error('User email not found for re-authentication.');
      }
      const credential = EmailAuthProvider.credential(user.email, params.password);
      await reauthenticateWithCredential(user, credential);
    } else {
      throw new Error('Re-authentication is required to delete your account.');
    }

    // 2. Fetch User Profile
    const profile = await this.getUserProfile(uid);

    // 3. Delete Firestore Records
    try {
      if (profile) {
        if (profile.role === 'patient' && profile.patientId) {
          // Delete patient document index
          await deleteDoc(doc(firestore, 'patients', profile.patientId));

          // Find & delete pending/approved caregiver requests
          const qReq = query(
            collection(firestore, 'caregiverRequests'),
            where('patientId', '==', profile.patientId)
          );
          const reqSnap = await getDocs(qReq);
          for (const reqDoc of reqSnap.docs) {
            await deleteDoc(doc(firestore, 'caregiverRequests', reqDoc.id));
          }

          // Clean connected/pending patientId from caregiver user profiles
          const qCaregivers = query(
            collection(firestore, 'users'),
            where('role', '==', 'caregiver')
          );
          const cSnap = await getDocs(qCaregivers);
          for (const cDoc of cSnap.docs) {
            const cData = cDoc.data();
            if (
              (cData.connectedPatientIds && cData.connectedPatientIds.includes(profile.patientId)) ||
              (cData.pendingPatientIds && cData.pendingPatientIds.includes(profile.patientId))
            ) {
              await updateDoc(doc(firestore, 'users', cDoc.id), {
                connectedPatientIds: arrayRemove(profile.patientId),
                pendingPatientIds: arrayRemove(profile.patientId)
              });
            }
          }
        } else if (profile.role === 'caregiver') {
          // Delete caregiver's connection requests
          const qReq = query(
            collection(firestore, 'caregiverRequests'),
            where('caregiverUid', '==', uid)
          );
          const reqSnap = await getDocs(qReq);
          for (const reqDoc of reqSnap.docs) {
            await deleteDoc(doc(firestore, 'caregiverRequests', reqDoc.id));
          }
        }
      }

      // Delete User Profile Document
      await deleteDoc(doc(firestore, 'users', uid));
    } catch (firestoreErr) {
      console.warn('Firestore deletion cleanup note:', firestoreErr);
    }

    // 4. Delete Firebase Auth User Account
    await deleteUser(user);
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }
};
