import { useAuth } from '../contexts/AuthContext';

export function useUserAndPartnerData() {
  const { userData, partnerData, loading: dataLoading, error } = useAuth();
  const isSoloMode = userData?.settings?.mode === 'SOLO';

  return {
    userData,
    partnerData,
    loading: dataLoading,
    error,
    isSoloMode
  };
} 