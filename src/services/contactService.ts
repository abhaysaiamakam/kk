import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { firestore, handleFirestoreError, OperationType } from './firebase';
import { ContactItem } from '../types';

export const contactService = {
  subscribeToContacts(
    patientIdOrUid: string,
    onUpdate: (contacts: ContactItem[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!patientIdOrUid) {
      onUpdate([]);
      return () => {};
    }

    const formattedId = patientIdOrUid.trim().toUpperCase();
    console.log(`[ContactService] Subscribing to contacts for: "${formattedId}"`);

    const q = query(collection(firestore, 'contacts'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ContactItem[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const docPatientId = (data.patientId || '').toString().trim().toUpperCase();
          const docPatientUid = (data.patientUid || '').toString().trim();
          const docCaregiverUid = (data.caregiverUid || '').toString().trim();

          if (
            docPatientId === formattedId || 
            docPatientUid === patientIdOrUid || 
            docPatientId === patientIdOrUid.toUpperCase() ||
            docCaregiverUid === patientIdOrUid
          ) {
            list.push({
              id: data.id || docSnap.id,
              patientId: data.patientId,
              patientUid: data.patientUid,
              caregiverUid: data.caregiverUid,
              name: data.name || 'Family Member',
              relationship: data.relationship || 'Family',
              phone: data.phone || '+91 98765 43210',
              avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
              isQuickCall: data.isQuickCall ?? true,
              birthday: data.birthday,
              videoEnabled: data.videoEnabled ?? true
            });
          }
        });

        console.log(`[ContactService] Received ${list.length} real contact(s) from Firestore.`);
        onUpdate(list);
      },
      (error) => {
        console.error('[ContactService] Contacts snapshot error:', error);
        if (onError) {
          onError(error);
        } else {
          handleFirestoreError(error, OperationType.LIST, 'contacts');
        }
      }
    );

    return unsubscribe;
  },

  async createContact(contact: ContactItem): Promise<void> {
    const contactId = contact.id || `contact-${Date.now()}`;
    const path = `contacts/${contactId}`;

    const payload = {
      ...contact,
      id: contactId,
      patientId: contact.patientId ? contact.patientId.toUpperCase() : ''
    };

    try {
      await setDoc(doc(firestore, 'contacts', contactId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateContact(contactId: string, updates: Partial<ContactItem>): Promise<void> {
    const path = `contacts/${contactId}`;

    try {
      await updateDoc(doc(firestore, 'contacts', contactId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteContact(contactId: string): Promise<void> {
    const path = `contacts/${contactId}`;

    try {
      await deleteDoc(doc(firestore, 'contacts', contactId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
