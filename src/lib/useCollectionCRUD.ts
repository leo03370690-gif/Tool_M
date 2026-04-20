import { useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import i18n from '../i18n/config';

export function useCollectionCRUD<T extends Record<string, unknown>>(collectionName: string) {
  const { addToast } = useToast();

  const add = useCallback(async (data: Partial<T>): Promise<boolean> => {
    try {
      await addDoc(collection(db, collectionName), data);
      return true;
    } catch (err) {
      console.error(`Error adding to ${collectionName}:`, err);
      addToast(i18n.t('crud.addError'), 'error');
      return false;
    }
  }, [collectionName, addToast]);

  const update = useCallback(async (id: string, data: Partial<T>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, collectionName, id), data as Record<string, unknown>);
      return true;
    } catch (err) {
      console.error(`Error updating ${collectionName}:`, err);
      addToast(i18n.t('crud.updateError'), 'error');
      return false;
    }
  }, [collectionName, addToast]);

  const remove = useCallback(async (id: string, undoData?: Partial<T>): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      if (undoData) {
        addToast(i18n.t('crud.deleted'), 'success', {
          label: i18n.t('crud.undo'),
          onClick: () => addDoc(collection(db, collectionName), undoData),
        });
      }
      return true;
    } catch (err) {
      console.error(`Error deleting from ${collectionName}:`, err);
      addToast(i18n.t('crud.deleteError'), 'error');
      return false;
    }
  }, [collectionName, addToast]);

  return { add, update, remove };
}
