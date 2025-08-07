import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { queryKeys } from '@/lib/queryKeys';

async function fetchReminders(uid) {
  if (!uid) return [];
  const q = query(
    collection(db, 'reminders'),
    where('owner', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function useRemindersQuery(uid) {
  return useQuery({
    queryKey: queryKeys.reminders.list(uid),
    queryFn: () => fetchReminders(uid),
    enabled: !!uid,
  });
}

async function fetchPartnerReminders(partnerId) {
  if (!partnerId) return [];
  const q = query(
    collection(db, 'reminders'),
    where('owner', '==', partnerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function usePartnerRemindersQuery(partnerId) {
  return useQuery({
    queryKey: queryKeys.reminders.partnerList(partnerId),
    queryFn: () => fetchPartnerReminders(partnerId),
    enabled: !!partnerId,
  });
}


