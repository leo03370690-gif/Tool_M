import { useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from 'react-i18next';

export function useCollectionCRUD<T extends Record<string, unknown>>(collectionName: string) {
  const { addToast } = useToast();
  const { t } = useTranslation();

  const add = useCallback(async (data: Partial<T>): Promise<boolean> => {
    try {
      await addDoc(collection(db, collectionName), data);
      return true;
    } catch (err) {
      console.error(`Error adding to ${collectionName}:`, err);
      addToast(t('crud.addFailed'), 'error');
      return false;
    }
  }, [collectionName, addToast, t]);

  const update = useCallback(async (id: string, data: Partial<T>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, collectionName, id), data as Record<string, unknown>);
      return true;
    } catch (err) {
      console.error(`Error updating ${collectionName}:`, err);
      addToast(t('crud.updateFailed'), 'error');
      return false;
    }
  }, [collectionName, addToast, t]);

  const remove = useCallback(async (id: string, undoData?: Partial<T>): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      if (undoData) {
        addToast(t('crud.deleted'), 'success', {
          label: t('common.undo'),
          onClick: () => addDoc(collection(db, collectionName), undoData),
        });
      }
      return true;
    } catch (err) {
      console.error(`Error deleting from ${collectionName}:`, err);
      addToast(t('crud.deleteFailed'), 'error');
      return false;
    }
  }, [collectionName, addToast, t]);

  return { add, update, remove };
}
