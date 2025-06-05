// src/pages/StarsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment,
  runTransaction,
  writeBatch,
  limit
} from "firebase/firestore";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Alert,
  Stack,
  Snackbar
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { usePartnerData } from '../hooks/usePartnerData';
import NoPartnerState from '../components/NoPartnerState';
import { formatDistanceToNow } from 'date-fns';
import { awardStarsToPartner, redeemStarsForCoupon, approveStarAward } from '../utils/starOperations';

const STAR_CATEGORIES = [
  { value: 'achievement', label: 'Achievement', icon: '🏆' },
  { value: 'kindness', label: 'Act of Kindness', icon: '💝' },
  { value: 'support', label: 'Support & Care', icon: '🤗' },
  { value: 'surprise', label: 'Pleasant Surprise', icon: '✨' },
  { value: 'growth', label: 'Personal Growth', icon: '🌱' },
  { value: 'milestone', label: 'Relationship Milestone', icon: '💑' },
  { value: 'effort', label: 'Extra Effort', icon: '💪' },
  { value: 'creativity', label: 'Creative Expression', icon: '🎨' },
  { value: 'other', label: 'Other', icon: '⭐' },
  { value: 'habit_completion', label: 'Habit Completion', icon: '🎯' },
];

const TRANSACTION_FILTERS = [
  { value: 'all', label: 'All Transactions', icon: '🌟' },
  { value: 'awarded_by_partner', label: 'Awarded by Partner', icon: '💝' },
  { value: 'given_to_partner', label: 'Given to Partner', icon: '🎁' },
  { value: 'habit_completion', label: 'Habit Achievements', icon: '🎯' }
];

/**
 * StarsPage:
 * - The user can award stars to their partner (NOT themselves).
 * - Shows a ledger of all transactions (involving me).
 * - Real-time from Firestore "transactions" collection.
 * - On awarding, increments partner's star count in /users/{partnerId}.
 */
export default function StarsPage() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const { partnerData, loading: partnerLoading, error: partnerError, isSoloMode } = usePartnerData();
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState([]);
  const [myStars, setMyStars] = useState(0);
  const [partnerStars, setPartnerStars] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Award Dialog States
  const [openAward, setOpenAward] = useState(false);
  const [awardAmount, setAwardAmount] = useState(5);
  const [awardReason, setAwardReason] = useState("");
  const [awardCategory, setAwardCategory] = useState("kindness");
  const [isAwarding, setIsAwarding] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalAwarded: 0,
    totalReceived: 0,
    mostCommonReason: '',
    largestAward: 0
  });

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [transactionFilter, setTransactionFilter] = useState('all');

  // Add filtered ledger computation
  const filteredLedger = ledger.filter(transaction => {
    switch (transactionFilter) {
      case 'awarded_by_partner':
        return transaction.from === userData?.partnerId;
      case 'given_to_partner':
        return transaction.from === user.uid;
      case 'habit_completion':
        return transaction.type === 'HABIT_COMPLETION';
      default:
        return true;
    }
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!userData?.partnerId || isSoloMode) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let unsubTransactions = null;
    let unsubUser = null;
    let unsubPartner = null;
    let unsubApprovals = null;

    const setupSubscriptions = async () => {
      try {
        // Query for transactions
        const q = query(
          collection(db, "transactions"),
          where("participants", "array-contains", user.uid),
          orderBy("createdAt", "desc"),
          limit(10)
        );

        unsubTransactions = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;
          const transactionsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setLedger(transactionsList);

          // Calculate stats
          const stats = transactionsList.reduce((acc, transaction) => {
            if (transaction.from === user.uid) {
              acc.totalAwarded += transaction.amount;
            } else {
              acc.totalReceived += transaction.amount;
            }
            acc.largestAward = Math.max(acc.largestAward, transaction.amount);
            return acc;
          }, {
            totalAwarded: 0,
            totalReceived: 0,
            largestAward: 0
          });

          setStats(stats);
          setLoading(false);
        }, (err) => {
          console.error("Error fetching transactions:", err);
          if (isMounted) {
            setError("Failed to load transactions");
            setLoading(false);
          }
        });

        // Fetch star counts
        unsubUser = onSnapshot(doc(db, "users", user.uid), (doc) => {
          if (!isMounted) return;
          if (doc.exists()) {
            setMyStars(doc.data().stars || 0);
          }
        }, (err) => {
          console.error("Error fetching user stars:", err);
          if (isMounted) {
            setError("Failed to fetch your star count");
          }
        });

        unsubPartner = onSnapshot(doc(db, "users", userData.partnerId), (doc) => {
          if (!isMounted) return;
          if (doc.exists()) {
            setPartnerStars(doc.data().stars || 0);
          }
        }, (err) => {
          console.error("Error fetching partner stars:", err);
          if (isMounted) {
            setError("Failed to fetch partner's star count");
          }
        });

        // Add subscription for pending habit completion approvals
        if (userData?.partnerId) {
          const approvalsQuery = query(
            collection(db, "transactions"),
            where("type", "==", "HABIT_COMPLETION"),
            where("to", "==", user.uid),
            where("status", "==", "pending"),
            limit(10)
          );

          unsubApprovals = onSnapshot(approvalsQuery, (snapshot) => {
            if (!isMounted) return;
            const approvals = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setPendingApprovals(approvals);
          });
        }
      } catch (err) {
        console.error("Error setting up subscriptions:", err);
        if (isMounted) {
          setError("Failed to set up star tracking");
          setLoading(false);
        }
      }
    };

    setupSubscriptions();

    return () => {
      isMounted = false;
      if (unsubTransactions) unsubTransactions();
      if (unsubUser) unsubUser();
      if (unsubPartner) unsubPartner();
      if (unsubApprovals) unsubApprovals();
    };
  }, [user?.uid, userData?.partnerId, isSoloMode, navigate]);

  const handleGiveStars = async () => {
    if (!user?.uid) {
      setError('You must be logged in to award stars');
      return;
    }

    if (!userData?.partnerId) {
      setError('Could not find partner information');
      return;
    }

    if (!awardAmount || awardAmount < 1) {
      setError('Please select a valid amount of stars');
      return;
    }

    if (!awardReason.trim()) {
      setError('Please provide a reason for awarding stars');
      return;
    }

    if (!awardCategory) {
      setError('Please select a category');
      return;
    }

    setIsAwarding(true);
    try {
      await awardStarsToPartner(
        db,
        user.uid,  // from current user
        userData.partnerId,  // to partner
        awardAmount,
        awardReason.trim(),
        awardCategory
      );

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setSuccess(`Successfully awarded ${awardAmount} stars to ${partnerData?.displayName || 'your partner'}!`);
      setOpenAward(false);
      setAwardAmount(5);
      setAwardReason('');
      setAwardCategory('kindness');
    } catch (error) {
      console.error('Error awarding stars:', error);
      setError(error.message || 'Failed to award stars');
    } finally {
      setIsAwarding(false);
    }
  };

  const handleRedeemStars = async (couponType, cost) => {
    if (!user?.uid || !userData?.partnerId) return;

    try {
      await redeemStarsForCoupon(
        db,
        user.uid,
        userData.partnerId,
        cost,
        couponType
      );
      setSuccess('Successfully redeemed stars for coupon!');
    } catch (error) {
      console.error('Error redeeming stars:', error);
      setError(error.message || 'Failed to redeem stars');
    }
  };

  const handleApproveHabitStar = async (transaction) => {
    if (!user?.uid || !transaction?.id) return;

    try {
      await approveStarAward(db, transaction.id, transaction.to);
      setSuccess('Successfully approved habit completion reward');
    } catch (error) {
      console.error('Error approving habit star:', error);
      setError(error.message || 'Failed to approve habit completion reward');
    }
  };

  const handleDeclineHabitStar = async (transaction) => {
    if (!user?.uid) return;
    
    try {
      const transactionRef = doc(db, 'transactions', transaction.id);
      await updateDoc(transactionRef, {
        status: 'declined',
        updatedAt: serverTimestamp()
      });
      setSuccess('Successfully declined habit completion reward');
    } catch (error) {
      console.error('Error declining habit star:', error);
      setError('Failed to decline habit completion reward');
    }
  };

  if (loading || partnerLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || partnerError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || partnerError}
        </Alert>
      </Box>
    );
  }

  if (!userData?.partnerId) {
    return <NoPartnerState message="Link with your partner to start awarding and receiving stars!" />;
  }

  return (
    <Box sx={{ 
      color: "#fff", 
      p: { xs: 2, sm: 3, md: 4 },  // Increased padding
      maxWidth: { sm: '900px', lg: '1000px' },  // Reduced max width
      mx: 'auto',
      width: '100%'
    }}>
      {showConfetti && <Confetti />}
      
      <Typography 
        variant="h4" 
        sx={{ 
          mb: { xs: 2, sm: 3, md: 4 },
          fontWeight: 700,
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        Star Balance
      </Typography>

      <Box sx={{ 
        display: 'grid', 
        gap: { xs: 2, sm: 3, md: 4 },  // Increased gap
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)' 
        },
        width: '100%'
      }}>
        {/* My Balance Card - More compact */}
        <Paper sx={{
          p: { xs: 1.5, sm: 2, md: 2.5 },
          borderRadius: { xs: 2, sm: 3 },
          background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.05))',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#FFD700', 0.2)}`,
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1, sm: 1.5 }
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.75, sm: 1 }
          }}>
            <StarIcon sx={{ 
              color: '#FFD700', 
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }} />
            <Typography variant="h5" sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              My Balance
            </Typography>
          </Box>
          <Typography variant="h3" sx={{ 
            fontWeight: 800,
            color: '#FFD700',
            textShadow: '0 0 20px rgba(255,215,0,0.3)',
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            {myStars} ⭐
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 0.75, sm: 1 },
            flexWrap: 'wrap',
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}>
            <Chip 
              icon={<TrendingUpIcon />} 
              label={`Earned: ${stats.totalReceived}`}
              sx={{ 
                bgcolor: alpha('#FFD700', 0.1), 
                color: '#FFD700',
                height: { xs: '24px', sm: '28px' },
                '& .MuiChip-label': {
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  px: { xs: 1, sm: 1.5 }
                },
                '& .MuiChip-icon': {
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }
              }}
            />
            <Chip 
              icon={<AccountBalanceIcon />} 
              label={`Given: ${stats.totalAwarded}`}
              sx={{ 
                bgcolor: alpha('#FFD700', 0.1), 
                color: '#FFD700',
                height: { xs: '24px', sm: '28px' },
                '& .MuiChip-label': {
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  px: { xs: 1, sm: 1.5 }
                },
                '& .MuiChip-icon': {
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }
              }}
            />
          </Box>
        </Paper>

        {/* Partner's Balance Card - More compact */}
        <Paper sx={{
          p: { xs: 1.5, sm: 2, md: 2.5 },
          borderRadius: { xs: 2, sm: 3 },
          background: 'linear-gradient(135deg, rgba(255,182,193,0.1), rgba(255,182,193,0.05))',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#FFB6C1', 0.2)}`,
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1, sm: 1.5 }
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.75, sm: 1 }
          }}>
            <StarIcon sx={{ 
              color: '#FFB6C1', 
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }} />
            <Typography variant="h5" sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              {partnerData?.displayName || 'Partner'}'s Balance
            </Typography>
          </Box>
          <Typography variant="h3" sx={{ 
            fontWeight: 800,
            color: '#FFB6C1',
            textShadow: '0 0 20px rgba(255,182,193,0.3)',
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            {partnerStars} ⭐
          </Typography>
          <Button
            variant="contained"
            onClick={() => setOpenAward(true)}
            sx={{
              background: 'linear-gradient(45deg, #FFB6C1, #FF69B4)',
              color: '#fff',
              fontWeight: 600,
              py: { xs: 0.75, sm: 1 },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              alignSelf: { xs: 'center', sm: 'flex-start' },
              minWidth: { xs: '120px', sm: '140px' },
              '&:hover': {
                background: 'linear-gradient(45deg, #FF69B4, #FFB6C1)',
              }
            }}
          >
            Award Stars
          </Button>
        </Paper>
      </Box>

      {/* Award Dialog */}
      <Dialog 
        open={openAward} 
        onClose={() => setOpenAward(false)}
        PaperProps={{
          sx: {
            backgroundColor: alpha('#1a1a1a', 0.95),
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: `1px solid ${alpha('#fff', 0.1)}`,
            minWidth: { xs: '90%', sm: 400 }
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Award Stars to {partnerData?.displayName || 'Partner'}
        </DialogTitle>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleGiveStars();
        }}>
          <DialogContent>
            <Stack spacing={3}>
              <Box>
                <Typography gutterBottom>Amount: {awardAmount} ⭐</Typography>
                <Slider
                  value={awardAmount}
                  onChange={(e, newValue) => setAwardAmount(newValue)}
                  min={1}
                  max={20}
                  marks
                  valueLabelDisplay="auto"
                  sx={{
                    color: '#FFD700',
                    '& .MuiSlider-mark': {
                      backgroundColor: alpha('#FFD700', 0.3),
                    },
                    '& .MuiSlider-rail': {
                      backgroundColor: alpha('#FFD700', 0.3),
                    },
                  }}
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel sx={{ color: alpha('#fff', 0.7) }}>Category</InputLabel>
                <Select
                  value={awardCategory}
                  onChange={(e) => setAwardCategory(e.target.value)}
                  label="Category"
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha('#fff', 0.3),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha('#fff', 0.5),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFD700',
                    },
                    '& .MuiSvgIcon-root': {
                      color: alpha('#fff', 0.7),
                    },
                  }}
                >
                  {STAR_CATEGORIES.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason"
                value={awardReason}
                onChange={(e) => setAwardReason(e.target.value)}
                placeholder="Why are you awarding these stars?"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: alpha('#fff', 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha('#fff', 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FFD700',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: alpha('#fff', 0.7),
                    '&.Mui-focused': {
                      color: '#FFD700'
                    }
                  },
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setOpenAward(false)}
              sx={{ color: alpha('#fff', 0.7) }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isAwarding || !awardReason.trim()}
              startIcon={isAwarding ? <CircularProgress size={20} /> : <StarIcon />}
              sx={{
                color: '#FFD700',
                '&:hover': {
                  backgroundColor: alpha('#FFD700', 0.1)
                }
              }}
            >
              {isAwarding ? 'Awarding...' : 'Award Stars'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add PendingApprovals component before transaction history */}
      {!isSoloMode && (
        <PendingApprovals
          transactions={pendingApprovals}
          onApprove={handleApproveHabitStar}
          onDecline={handleDeclineHabitStar}
        />
      )}

      {/* Transaction History - More compact */}
      <Accordion
        defaultExpanded
        sx={{
          mt: { xs: 2, sm: 3 },
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#fff', 0.1)}`,
          borderRadius: '12px !important',
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            borderRadius: '12px',
            minHeight: { xs: '40px', sm: '48px' },
            p: { xs: 1, sm: 1.5 }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            width: '100%', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 0.75, sm: 0 }
          }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              Transaction History
            </Typography>
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: '100%', sm: '180px' }
              }}
            >
              <Select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  color: '#fff',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  height: { xs: '32px', sm: '36px' },
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha('#fff', 0.3),
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha('#fff', 0.5),
                  },
                  '.MuiSvgIcon-root': {
                    color: alpha('#fff', 0.7),
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }
                }}
              >
                {TRANSACTION_FILTERS.map((filter) => (
                  <MenuItem 
                    key={filter.value} 
                    value={filter.value}
                    sx={{
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    {filter.icon} {filter.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: { xs: 0.75, sm: 1.5 } }}>
          <AnimatePresence>
            {filteredLedger.length === 0 ? (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: alpha('#fff', 0.7),
                  textAlign: 'center',
                  py: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                No transactions found for the selected filter.
              </Typography>
            ) : (
              filteredLedger.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <TransactionItem
                    transaction={transaction}
                    currentUserId={user.uid}
                    partnerName={partnerData?.displayName || 'Partner'}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </AccordionDetails>
      </Accordion>

      {/* Success/Error Alerts */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccess(null)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

const TransactionItem = ({ transaction, currentUserId, partnerName }) => {
  const { from, to, amount, reason, category, createdAt, type } = transaction;

  const isSent = (from === currentUserId);
  const isHabitCompletion = type === 'HABIT_COMPLETION';
  
  let category_info;
  if (isHabitCompletion) {
    category_info = { value: 'habit_completion', label: 'Habit Achievement', icon: '🎯' };
  } else {
    category_info = STAR_CATEGORIES.find(cat => cat.value === category) || STAR_CATEGORIES[8];
  }

  let dateString = "";
  if (createdAt?.seconds) {
    const d = new Date(createdAt.seconds * 1000);
    dateString = formatDistanceToNow(d, { addSuffix: true });
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 1.5,
        borderRadius: 2,
        backgroundColor: alpha('#fff', 0.08),
        border: `1px solid ${alpha('#fff', 0.1)}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: alpha('#fff', 0.12),
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: 1
        }}>
          {/* Left side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(
                  isHabitCompletion ? '#4CAF50' : isSent ? '#FFD700' : '#FFB6C1',
                  0.15
                ),
                fontSize: '1rem'
              }}
            >
              {isHabitCompletion ? '🎯' : isSent ? '💝' : '✨'}
            </Box>
            <Box>
              <Typography 
                sx={{ 
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: alpha('#fff', 0.9),
                  lineHeight: 1.2
                }}
              >
                {isHabitCompletion 
                  ? 'Habit Achievement'
                  : isSent 
                    ? 'Awarded to Partner' 
                    : 'Received from Partner'}
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: '0.7rem',
                  color: alpha('#fff', 0.5),
                  mt: 0.25
                }}
              >
                {category_info.icon} {category_info.label}
              </Typography>
            </Box>
          </Box>

          {/* Right side - Star amount */}
          <Typography sx={{ 
            fontWeight: 700,
            color: isHabitCompletion ? '#4CAF50' : isSent ? '#FFD700' : '#FFB6C1',
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
            {amount}
            <Box 
              component="span" 
              sx={{ 
                fontSize: '0.9em',
                filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.3))'
              }}
            >
              ⭐
            </Box>
          </Typography>
        </Box>

        {/* Reason */}
        <Typography 
          sx={{ 
            fontSize: '0.8rem',
            color: alpha('#fff', 0.75),
            fontStyle: 'italic',
            mb: 0.75,
            pl: '38px'
          }}
        >
          "{reason}"
        </Typography>

        {/* Timestamp */}
        <Typography 
          sx={{ 
            fontSize: '0.7rem',
            color: alpha('#fff', 0.4),
            pl: '38px'
          }}
        >
          {dateString}
        </Typography>
      </Box>
    </Box>
  );
};

// Add new component for pending approvals
const PendingApprovals = ({ transactions, onApprove, onDecline }) => {
  if (!transactions.length) return null;

  return (
    <Accordion
      sx={{
        mt: 4,
        background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.05))',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha('#FFD700', 0.1)}`,
        borderRadius: '16px !important',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">
          Pending Habit Completion Rewards
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {transactions.map((transaction) => (
            <Paper
              key={transaction.id}
              sx={{
                p: 2,
                background: alpha('#fff', 0.05),
                borderRadius: 2,
                border: `1px solid ${alpha('#fff', 0.1)}`
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">
                  {transaction.reason}
                </Typography>
                <Typography variant="h6" sx={{ color: '#FFD700' }}>
                  {transaction.amount} ⭐
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), display: 'block', mb: 2 }}>
                Week of {new Date(transaction.weekStartDate).toLocaleDateString()} to {new Date(transaction.weekEndDate).toLocaleDateString()}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onApprove(transaction)}
                  sx={{
                    bgcolor: alpha('#4CAF50', 0.1),
                    color: '#4CAF50',
                    '&:hover': { bgcolor: alpha('#4CAF50', 0.2) }
                  }}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onDecline(transaction)}
                  sx={{
                    bgcolor: alpha('#f44336', 0.1),
                    color: '#f44336',
                    '&:hover': { bgcolor: alpha('#f44336', 0.2) }
                  }}
                >
                  Decline
                </Button>
              </Box>
            </Paper>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};