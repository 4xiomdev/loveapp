// src/pages/CouponsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePartnerData } from "../hooks/usePartnerData";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  orderBy,
  getDocs,
  increment
} from "firebase/firestore";
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  alpha,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Skeleton,
  Avatar,
  useTheme
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LockIcon from "@mui/icons-material/Lock";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { USER_IDS } from "../config/userConfig";
import styled from "@emotion/styled";
import AddIcon from '@mui/icons-material/Add';
import RedeemIcon from '@mui/icons-material/Redeem';
import StarIcon from '@mui/icons-material/Star';
import NoPartnerState from '../components/NoPartnerState';
import DeleteIcon from '@mui/icons-material/Delete';
import SoloModeState from '../components/SoloModeState';
import HistoryIcon from '@mui/icons-material/History';
import { createCoupon, redeemCoupon, deleteCoupon } from '../utils/couponOperations';

// Add these styled components at the top
const GlowingText = styled(Typography)(({ theme, color = '#fff' }) => ({
  fontWeight: 800,
  color: color,
  textShadow: `0 0 20px ${alpha(color, 0.5)}`,
  transition: 'all 0.3s ease',
}));

const CouponCardWrapper = styled(motion.div)(({ theme }) => ({
  perspective: '1000px',
}));

// Update color options with more pastel choices
const COLOR_OPTIONS = [
  { value: "#FFE4E1", label: "Misty Rose", gradient: "linear-gradient(135deg, #FFE4E1, #FFF0F5)" },
  { value: "#E0FFFF", label: "Light Cyan", gradient: "linear-gradient(135deg, #E0FFFF, #F0FFFF)" },
  { value: "#F0FFF0", label: "Honeydew", gradient: "linear-gradient(135deg, #F0FFF0, #F5FFFA)" },
  { value: "#FFE4B5", label: "Moccasin", gradient: "linear-gradient(135deg, #FFE4B5, #FFDEAD)" },
  { value: "#E6E6FA", label: "Lavender", gradient: "linear-gradient(135deg, #E6E6FA, #F8F8FF)" },
  { value: "#FFF0F5", label: "Pink", gradient: "linear-gradient(135deg, #FFF0F5, #FFB6C1)" }
];

/**
 * CouponsPage:
 * - My coupons (I can redeem) vs. Partner coupons (coupons I created for partner)
 * - Create coupon with a color theme
 * - Redeem triggers confetti, star subtraction
 * - Accordion for collapsible sections
 * - Show date/time, coupon numbering, and a more playful star display
 */
export default function CouponsPage() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const { partnerData, loading: partnerLoading, error: partnerError, isSoloMode } = usePartnerData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receivedCoupons, setReceivedCoupons] = useState([]);
  const [createdCoupons, setCreatedCoupons] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    title: '',
    description: '',
    starCost: 5,
    color: COLOR_OPTIONS[0].value,
    gradient: COLOR_OPTIONS[0].gradient
  });

  // Force /login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    setLoading(false);
  }, [user, navigate]);

  const [showConfetti, setShowConfetti] = useState(false);
  
  // States for coupons
  const [myCoupons, setMyCoupons] = useState([]);
  const [partnerCoupons, setPartnerCoupons] = useState([]);
  const [stars, setStars] = useState(0);

  // Create states
  const [openCreate, setOpenCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newColor, setNewColor] = useState("#ffd1dc");
  
  // Delete states
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [couponToDelete, setCouponToDelete] = useState(null);

  // Add missing resetForm function
  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewCost("");
    setNewColor("#ffd1dc");
  };

  // Update coupons query to use userData.partnerId
  useEffect(() => {
    let unsubReceived = null;
    let unsubCreated = null;
    let isMounted = true;

    const setupSubscriptions = async () => {
      try {
        // Early return if not ready or in solo mode
        if (!user?.uid || !userData?.partnerId || isSoloMode) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // Subscribe to received coupons
        const receivedQuery = query(
          collection(db, 'coupons'),
          where('participants', 'array-contains', user.uid),
          orderBy('createdAt', 'desc')
        );

        unsubReceived = onSnapshot(receivedQuery, (snapshot) => {
          if (!isMounted) return;
          const coupons = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).filter(coupon => 
            coupon.forUser === user.uid // Only filter by forUser, not by used status
          );
          setReceivedCoupons(coupons);
        }, (err) => {
          console.error('Error fetching received coupons:', err);
          if (isMounted) {
            setError('Failed to load received coupons');
          }
        });

        // Subscribe to created coupons
        const createdQuery = query(
          collection(db, 'coupons'),
          where('participants', 'array-contains', user.uid),
          orderBy('createdAt', 'desc')
        );

        unsubCreated = onSnapshot(createdQuery, (snapshot) => {
          if (!isMounted) return;
          const coupons = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).filter(coupon => coupon.fromUser === user.uid);
          setCreatedCoupons(coupons);
          setLoading(false);
        }, (err) => {
          console.error('Error fetching created coupons:', err);
          if (isMounted) {
            setError('Failed to load created coupons');
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Error setting up subscriptions:', err);
        if (isMounted) {
          setError('Failed to set up coupon subscriptions');
          setLoading(false);
        }
      }
    };

    setupSubscriptions();

    return () => {
      isMounted = false;
      if (unsubReceived) unsubReceived();
      if (unsubCreated) unsubCreated();
    };
  }, [user?.uid, userData?.partnerId, isSoloMode]);

  // Add stars sync effect
  useEffect(() => {
    if (!user?.uid) return;
    let isMounted = true;

    const userRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists() && isMounted) {
        setStars(snap.data().stars ?? 0);
      }
    }, (error) => {
      console.error("Error fetching user stars:", error);
      if (isMounted) setError("Failed to load star count");
    });

    return () => {
      isMounted = false;
      unsubUser();
    };
  }, [user?.uid]);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!user?.uid || !userData?.partnerId || !newCoupon.title.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const couponData = {
        title: newCoupon.title.trim(),
        description: newCoupon.description.trim(),
        starCost: newCoupon.starCost,
        color: newCoupon.color,
        gradient: newCoupon.gradient,
        fromUser: user.uid,
        forUser: userData.partnerId,
        participants: [user.uid, userData.partnerId],
        used: false,
        createdAt: serverTimestamp()
      };

      await createCoupon(db, user.uid, userData.partnerId, couponData);
      setDialogOpen(false);
      setNewCoupon({
        title: '',
        description: '',
        starCost: 5,
        color: COLOR_OPTIONS[0].value,
        gradient: COLOR_OPTIONS[0].gradient
      });
    } catch (error) {
      console.error('Error creating coupon:', error);
      setError(error.message || 'Failed to create coupon');
    }
  };

  const handleRedeemCoupon = async (coupon) => {
    if (!user?.uid || !userData?.partnerId) return;

    try {
      await redeemCoupon(db, coupon.id, user.uid, userData.partnerId);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (error) {
      console.error('Error redeeming coupon:', error);
      setError(error.message || 'Failed to redeem coupon');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!user?.uid) return;

    try {
      await deleteCoupon(db, couponId, user.uid);
    } catch (error) {
      console.error('Error deleting coupon:', error);
      setError(error.message || 'Failed to delete coupon');
    }
  };

  if (loading || partnerLoading) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header Skeleton */}
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
        
        {/* Coupons Grid Skeleton */}
        <Grid container spacing={3}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton 
                variant="rounded" 
                height={200} 
                sx={{ borderRadius: 4 }}
              />
            </Grid>
          ))}
        </Grid>
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

  if (isSoloMode) {
    return (
      <SoloModeState message="Coupons are only available in partner mode. Switch back to partner mode to share love coupons with your partner!" />
    );
  }

  if (!userData?.partnerId) {
    return (
      <NoPartnerState message="Link with a partner to start creating and sharing love coupons!" />
    );
  }

  return (
    <Box sx={{ color: "#fff", p: { xs: 1.5, sm: 2, md: 3 } }}>
      {showConfetti && <Confetti style={{ zIndex: 9999 }} />}
      
      {/* Header Section */}
      <Box sx={{ 
        textAlign: 'center',
        mb: { xs: 3, sm: 4 }
      }}>
        <GlowingText 
          variant="h3" 
          sx={{ 
            fontWeight: 700,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            mb: { xs: 1, sm: 2 },
            background: 'linear-gradient(45deg, #fff, #f0f0f0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Coupons
        </GlowingText>
      </Box>

      {/* Star Balance Card */}
      <Paper
        sx={{
          p: { xs: 2.5, sm: 3 },
          mt: { xs: 2, sm: 3 },
          mb: { xs: 3, sm: 4 },
          borderRadius: 3,
          backdropFilter: "blur(20px)",
          backgroundColor: alpha("#ffffff", 0.08),
          border: `1px solid ${alpha('#ffffff', 0.1)}`,
          textAlign: "center",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: { xs: 2, sm: 2.5 }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1.5,
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            You have{" "}
            <motion.span
              initial={{ scale: 1 }}
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 1
              }}
              style={{ 
                display: "inline-block", 
                fontSize: "1.4em", 
                margin: "0 6px",
                color: "#FFD700"
              }}
            >
              ⭐ {stars}
            </motion.span>{" "}
            stars
          </Typography>
        </Box>

        <Typography 
          sx={{ 
            color: alpha('#fff', 0.8),
            mt: { xs: 0.5, sm: 1 },
            fontStyle: "italic",
            fontSize: { xs: '0.9rem', sm: '1rem' },
            maxWidth: '600px'
          }}
        >
          Create special moments with custom love coupons
        </Typography>

        <Button
          variant="contained"
          onClick={() => setDialogOpen(true)}
          sx={{
            mt: { xs: 1, sm: 2 },
            fontWeight: 700,
            borderRadius: 2,
            px: { xs: 3, sm: 4 },
            py: { xs: 1.25, sm: 1.5 },
            width: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.95rem', sm: '1rem' },
            background: 'linear-gradient(45deg, #FF69B4, #FFB6C1)',
            '&:hover': {
              background: 'linear-gradient(45deg, #FF1493, #FF69B4)',
            }
          }}
        >
          Create Coupon
        </Button>
      </Paper>

      {/* Accordions Section */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 2, sm: 3 }
      }}>
        {/* Active Coupons */}
        <Accordion
          defaultExpanded
          sx={{ 
            borderRadius: '16px !important',
            backgroundColor: alpha("#ffffff", 0.08),
            backdropFilter: "blur(20px)",
            border: `1px solid ${alpha('#ffffff', 0.1)}`,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              minHeight: { xs: '48px', sm: '56px' },
              px: { xs: 2, sm: 3 }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 1.5 }
            }}>
              <RedeemIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                Active Coupons
              </Typography>
              <Chip 
                label={receivedCoupons.filter(c => !c.used).length}
                size="small"
                sx={{ 
                  ml: 1, 
                  bgcolor: alpha('#fff', 0.1),
                  height: { xs: '20px', sm: '24px' },
                  '& .MuiChip-label': {
                    px: { xs: 1, sm: 1.5 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }
                }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: { xs: 1.5, sm: 2 } }}>
            <AnimatePresence>
              {receivedCoupons.filter(c => !c.used).length === 0 ? (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: alpha('#fff', 0.7),
                    textAlign: 'center',
                    py: { xs: 2, sm: 3 },
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}
                >
                  No active coupons yet. Time to earn some stars!
                </Typography>
              ) : (
                receivedCoupons.filter(c => !c.used).map((coupon, index) => (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <CouponCard
                      key={coupon.id}
                      index={index}
                      title={coupon.title}
                      description={coupon.description}
                      cost={coupon.starCost}
                      color={coupon.color}
                      gradient={coupon.gradient}
                      createdAt={coupon.createdAt}
                      owner="me"
                      used={coupon.used}
                      onRedeem={() => handleRedeemCoupon(coupon)}
                      onDelete={() => handleDeleteCoupon(coupon.id)}
                    />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </AccordionDetails>
        </Accordion>

        {/* Used Coupons */}
        <Accordion
          sx={{ 
            borderRadius: '16px !important',
            backgroundColor: alpha("#ffffff", 0.08),
            backdropFilter: "blur(20px)",
            border: `1px solid ${alpha('#ffffff', 0.1)}`,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              minHeight: { xs: '48px', sm: '56px' },
              px: { xs: 2, sm: 3 }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 1.5 }
            }}>
              <HistoryIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                Used Coupons
              </Typography>
              <Chip 
                label={receivedCoupons.filter(c => c.used).length}
                size="small"
                sx={{ 
                  ml: 1, 
                  bgcolor: alpha('#fff', 0.1),
                  height: { xs: '20px', sm: '24px' },
                  '& .MuiChip-label': {
                    px: { xs: 1, sm: 1.5 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }
                }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: { xs: 1.5, sm: 2 } }}>
            <AnimatePresence>
              {receivedCoupons.filter(c => c.used).length === 0 ? (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: alpha('#fff', 0.7),
                    textAlign: 'center',
                    py: { xs: 2, sm: 3 },
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}
                >
                  No used coupons yet.
                </Typography>
              ) : (
                receivedCoupons.filter(c => c.used).map((coupon, index) => (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <CouponCard
                      key={coupon.id}
                      index={index}
                      title={coupon.title}
                      description={coupon.description}
                      cost={coupon.starCost}
                      color={coupon.color}
                      gradient={coupon.gradient}
                      createdAt={coupon.createdAt}
                      owner="me"
                      used={coupon.used}
                      onDelete={() => handleDeleteCoupon(coupon.id)}
                    />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </AccordionDetails>
        </Accordion>

        {/* Partner's Coupons */}
        <Accordion
          defaultExpanded
          sx={{ 
            borderRadius: '16px !important',
            backgroundColor: alpha("#ffffff", 0.08),
            backdropFilter: "blur(20px)",
            border: `1px solid ${alpha('#ffffff', 0.1)}`,
            '&:before': { display: 'none' },
            mb: { xs: 3, sm: 4 }
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              minHeight: { xs: '48px', sm: '56px' },
              px: { xs: 2, sm: 3 }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 1.5 }
            }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                Partner's Coupons
              </Typography>
              <Chip 
                label={createdCoupons.length}
                size="small"
                sx={{ 
                  ml: 1, 
                  bgcolor: alpha('#fff', 0.1),
                  height: { xs: '20px', sm: '24px' },
                  '& .MuiChip-label': {
                    px: { xs: 1, sm: 1.5 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }
                }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: { xs: 1.5, sm: 2 } }}>
            <AnimatePresence>
              {createdCoupons.length === 0 ? (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: alpha('#fff', 0.7),
                    textAlign: 'center',
                    py: { xs: 2, sm: 3 },
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}
                >
                  Create some coupons for your partner!
                </Typography>
              ) : (
                createdCoupons.map((coupon, index) => (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <CouponCard
                      key={coupon.id}
                      index={index}
                      title={coupon.type}
                      description={coupon.description}
                      cost={coupon.starCost}
                      color={coupon.color}
                      gradient={coupon.gradient}
                      createdAt={coupon.createdAt}
                      owner="partner"
                      used={coupon.used}
                      onDelete={() => handleDeleteCoupon(coupon.id)}
                    />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </AccordionDetails>
        </Accordion>
      </Box>
      
      {/* CREATE COUPON MODAL */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            backgroundColor: alpha('#fff', 0.05),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha('#fff', 0.1)}`
          }
        }}
      >
        <DialogTitle>Create a New Love Coupon</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={newCoupon.title}
            onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
            placeholder="Enter a special title for your coupon"
          />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={newCoupon.description}
            onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="Describe what this coupon offers..."
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Theme Color</InputLabel>
            <Select
              value={newCoupon.color}
              onChange={(e) => {
                const selectedColor = COLOR_OPTIONS.find(c => c.value === e.target.value);
                setNewCoupon({ 
                  ...newCoupon, 
                  color: e.target.value,
                  gradient: selectedColor.gradient
                });
              }}
              label="Theme Color"
            >
              {COLOR_OPTIONS.map((color) => (
                <MenuItem 
                  key={color.value} 
                  value={color.value}
                  sx={{ 
                    background: color.gradient,
                    '&:hover': {
                      background: color.gradient,
                      filter: 'brightness(0.95)'
                    }
                  }}
                >
                  {color.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            type="number"
            label="Star Cost"
            value={newCoupon.starCost}
            onChange={(e) => setNewCoupon({ ...newCoupon, starCost: parseInt(e.target.value) || 0 })}
            InputProps={{ 
              inputProps: { min: 1 },
              startAdornment: <StarIcon sx={{ mr: 1, color: '#FFD700' }} />
            }}
            helperText={`You have ${stars} stars available`}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateCoupon}
            disabled={!newCoupon.title.trim() || !newCoupon.description.trim() || newCoupon.starCost < 1}
            sx={{
              background: newCoupon.gradient || 'linear-gradient(45deg, #FF69B4, #FFB6C1)',
              '&:hover': {
                background: newCoupon.gradient || 'linear-gradient(45deg, #FF1493, #FF69B4)',
                filter: 'brightness(0.95)'
              }
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog 
        open={deleteDialog} 
        onClose={() => {
          setDeleteDialog(false);
          setDeletePassword("");
        }}
        PaperProps={{
          sx: {
            backgroundColor: alpha('#fff', 0.05),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha('#fff', 0.1)}`
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <LockIcon /> Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Please enter your password to confirm deletion:
          </Typography>
          <TextField
            fullWidth
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': {
                  borderColor: alpha('#fff', 0.3)
                },
                '&:hover fieldset': {
                  borderColor: alpha('#fff', 0.5)
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#24c6dc'
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => {
              setDeleteDialog(false);
              setDeletePassword("");
            }}
            sx={{ color: alpha('#fff', 0.7) }}
          >
            Cancel
          </Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={handleDeleteCoupon}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/**
 * A playful "CouponCard" with:
 * - Pastel background
 * - Dashed border
 * - #Numbering
 * - Created date/time
 * - Redeem button if it's "my" coupon
 */
function CouponCard({ 
  index, 
  title, 
  description, 
  cost, 
  color,
  gradient,
  createdAt, 
  owner, 
  used,
  onRedeem,
  onDelete 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();

  let dateString = "";
  if (createdAt?.seconds) {
    const d = new Date(createdAt.seconds * 1000);
    dateString = d.toLocaleString();
  }

  const colorTheme = COLOR_OPTIONS.find(c => c.value === color) || COLOR_OPTIONS[0];

  return (
    <CouponCardWrapper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ 
        scale: 1.02,
        rotateX: 2,
        rotateY: 2,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          mb: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          position: "relative",
          overflow: "visible",
          backgroundColor: alpha(colorTheme.value, 0.08),
          border: `1px solid ${alpha(colorTheme.value, 0.2)}`,
          color: "#333",
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: alpha(colorTheme.value, 0.12),
            transform: 'translateY(-2px)'
          }
        }}
      >
        <Box
          sx={{
            padding: { xs: 1.5, sm: 2 },
            border: `2px dashed ${alpha('#000', 0.2)}`,
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: alpha('#fff', 0.05),
            zIndex: 2
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            gap: 1
          }}>
            {/* Left side: Title and Description */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 0.5 
              }}>
                <Box
                  sx={{
                    width: { xs: 20, sm: 24 },
                    height: { xs: 20, sm: 24 },
                    borderRadius: '50%',
                    backgroundColor: alpha('#000', 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    fontWeight: 700
                  }}
                >
                  #{index + 1}
                </Box>
                {used && (
                  <Chip 
                    label="Used"
                    size="small"
                    sx={{ 
                      backgroundColor: alpha('#4CAF50', 0.1),
                      color: '#4CAF50',
                      fontWeight: 600,
                      height: { xs: 20, sm: 24 },
                      '& .MuiChip-label': {
                        px: { xs: 1, sm: 1.5 },
                        fontSize: { xs: '0.65rem', sm: '0.75rem' }
                      }
                    }}
                  />
                )}
              </Box>

              <Typography
                variant="h6"
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  mb: 0.5,
                  color: alpha('#000', 0.8)
                }}
              >
                {title}
              </Typography>

              {description && (
                <Typography
                  variant="body2"
                  sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    color: alpha('#000', 0.6),
                    mb: 1,
                    lineHeight: 1.4
                  }}
                >
                  {description}
                </Typography>
              )}

              <Typography 
                variant="caption" 
                sx={{ 
                  display: "block",
                  color: alpha('#000', 0.5),
                  fontSize: { xs: '0.65rem', sm: '0.75rem' }
                }}
              >
                Created: {dateString}
              </Typography>
            </Box>

            {/* Right side: Stars and Actions */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 1,
              ml: 1
            }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  backgroundColor: alpha('#fff', 0.2),
                  borderRadius: '12px',
                  padding: '4px 12px'
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ 
                    fontWeight: 800,
                    color: alpha('#000', 0.8),
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  {cost} <span style={{ fontSize: '0.9em' }}>⭐</span>
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 0.5,
                alignItems: 'flex-end'
              }}>
                {owner === "me" && onRedeem && !used && (
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="contained" 
                      onClick={onRedeem}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        backgroundColor: alpha(colorTheme.value, 0.8),
                        color: '#000',
                        px: { xs: 1.5, sm: 2 },
                        py: { xs: 0.5, sm: 0.75 },
                        minWidth: { xs: '100px', sm: '120px' },
                        fontSize: { xs: '0.8rem', sm: '0.9rem' },
                        borderRadius: '8px',
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: alpha(colorTheme.value, 0.9)
                        }
                      }}
                    >
                      Redeem Now
                    </Button>
                  </motion.div>
                )}

                {onDelete && (
                  <motion.div 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconButton
                      onClick={onDelete}
                      size="small"
                      sx={{
                        color: alpha('#000', 0.6),
                        backgroundColor: alpha('#fff', 0.1),
                        p: { xs: 0.5, sm: 0.75 },
                        '&:hover': {
                          backgroundColor: alpha('#ff4444', 0.1),
                          color: '#ff4444'
                        }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
                    </IconButton>
                  </motion.div>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </CouponCardWrapper>
  );
}