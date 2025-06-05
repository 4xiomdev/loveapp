import { 
  collection, 
  doc, 
  writeBatch, 
  serverTimestamp, 
  increment 
} from 'firebase/firestore';

/**
 * Awards stars to a partner and creates a transaction record
 */
export async function awardStarsToPartner(db, fromUserId, toUserId, amount, reason, category) {
  if (!fromUserId || !toUserId || !amount) {
    throw new Error('Missing required parameters');
  }

  const batch = writeBatch(db);

  // Update partner's star count
  const partnerRef = doc(db, 'users', toUserId);
  batch.update(partnerRef, {
    stars: increment(amount),
    updatedAt: serverTimestamp()
  });

  // Create transaction record
  const transactionRef = doc(collection(db, 'transactions'));
  batch.set(transactionRef, {
    from: fromUserId,
    to: toUserId,
    amount,
    reason,
    category,
    type: 'AWARD',
    participants: [fromUserId, toUserId],
    createdAt: serverTimestamp()
  });

  await batch.commit();
  return { success: true };
}

/**
 * Awards stars to self for completing weekly habit goal
 */
export async function awardStarsToSelf(db, userId, amount, reason, weekStartDate, weekEndDate) {
  if (!userId || !amount) {
    throw new Error('Missing required parameters');
  }

  const batch = writeBatch(db);

  // Update user's star count using increment
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, {
    stars: increment(amount),
    updatedAt: serverTimestamp()
  });

  // Create transaction record
  const transactionRef = doc(collection(db, 'transactions'));
  batch.set(transactionRef, {
    from: userId,
    to: userId,
    amount,
    reason,
    category: 'habit_completion',
    type: 'HABIT_COMPLETION',
    status: 'completed',
    participants: [userId],
    weekStartDate,
    weekEndDate,
    createdAt: serverTimestamp()
  });

  await batch.commit();
  return { success: true };
}

/**
 * Handles star redemption for coupons
 */
export async function redeemStarsForCoupon(db, userId, partnerId, amount, couponType) {
  if (!userId || !amount || !couponType) {
    throw new Error('Missing required parameters');
  }

  const batch = writeBatch(db);

  // Deduct stars from user
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, {
    stars: increment(-amount),
    updatedAt: serverTimestamp()
  });

  // Create coupon record
  const couponRef = doc(collection(db, 'coupons'));
  batch.set(couponRef, {
    userId,
    partnerId,
    type: couponType,
    cost: amount,
    isRedeemed: false,
    createdAt: serverTimestamp()
  });

  // Create transaction record
  const transactionRef = doc(collection(db, 'transactions'));
  batch.set(transactionRef, {
    from: userId,
    to: userId,
    amount: -amount,
    type: 'REDEEM',
    reason: `Redeemed for ${couponType} coupon`,
    participants: [userId, partnerId].filter(Boolean),
    createdAt: serverTimestamp()
  });

  await batch.commit();
  return { success: true };
}

/**
 * Approves a pending star award (for habit completion)
 */
export async function approveStarAward(db, transactionId, userId) {
  if (!transactionId || !userId) {
    throw new Error('Missing required parameters');
  }

  const batch = writeBatch(db);

  // Update transaction status
  const transactionRef = doc(db, 'transactions', transactionId);
  batch.update(transactionRef, {
    status: 'approved',
    updatedAt: serverTimestamp()
  });

  // Update user's star count
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, {
    stars: increment(1),
    updatedAt: serverTimestamp()
  });

  await batch.commit();
  return { success: true };
} 