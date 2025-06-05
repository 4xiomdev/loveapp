import { 
  collection, 
  doc, 
  writeBatch, 
  serverTimestamp, 
  increment,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';

/**
 * Creates a new coupon
 */
export async function createCoupon(db, fromUserId, toUserId, couponData) {
  // Validate required parameters
  if (!db || !fromUserId || !toUserId || !couponData || !couponData.title) {
    throw new Error('Missing required parameters');
  }

  try {
    const couponRef = collection(db, 'coupons');
    const newCoupon = {
      title: couponData.title,
      description: couponData.description || '',
      starCost: couponData.starCost || 5,
      color: couponData.color || '#FFE4E1',
      gradient: couponData.gradient || 'linear-gradient(135deg, #FFE4E1, #FFF0F5)',
      fromUser: fromUserId,
      forUser: toUserId,
      participants: [fromUserId, toUserId],
      used: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(couponRef, newCoupon);
    return { success: true, couponId: docRef.id };
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw new Error('Failed to create coupon');
  }
}

/**
 * Redeems a coupon and updates star balance
 */
export async function redeemCoupon(db, couponId, userId, partnerId) {
  if (!couponId || !userId) {
    throw new Error('Missing required parameters');
  }

  const batch = writeBatch(db);

  // Update coupon status
  const couponRef = doc(db, 'coupons', couponId);
  batch.update(couponRef, {
    used: true,
    redeemedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Create transaction record
  const transactionRef = doc(collection(db, 'transactions'));
  batch.set(transactionRef, {
    type: 'REDEEM_COUPON',
    couponId,
    from: userId,
    to: partnerId,
    participants: [userId, partnerId].filter(Boolean),
    createdAt: serverTimestamp()
  });

  await batch.commit();
  return { success: true };
}

/**
 * Deletes a coupon
 */
export async function deleteCoupon(db, couponId, userId) {
  if (!couponId || !userId) {
    throw new Error('Missing required parameters');
  }

  try {
    const couponRef = doc(db, 'coupons', couponId);
    await deleteDoc(couponRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw new Error('Failed to delete coupon');
  }
}

/**
 * Gets all coupons for a user
 */
export async function getUserCoupons(db, userId) {
  if (!userId) {
    throw new Error('Missing required parameters');
  }

  try {
    const couponsRef = collection(db, 'coupons');
    const q = query(
      couponsRef,
      where('participants', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting coupons:', error);
    throw new Error('Failed to get coupons');
  }
} 