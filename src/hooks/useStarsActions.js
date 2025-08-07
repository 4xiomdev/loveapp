import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';

export function useStarsActions() {
  const awardStars = async (toUserId, amount, reason, category) => {
    const fn = httpsCallable(functions, 'awardStars');
    await fn({ toUserId, amount, reason, category });
  };
  return { awardStars };
}


