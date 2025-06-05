import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePartnerData } from '../hooks/usePartnerData';
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  alpha,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Container
} from "@mui/material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isTomorrow, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import NoPartnerState from '../components/NoPartnerState';
import SoloModeState from '../components/SoloModeState';
import { cleanupFirestoreData } from "../utils/cleanupFirestore";
import { USER_MODES } from "../config/userConfig";
import AddIcon from "@mui/icons-material/Add";
import ReminderItem from '../components/reminders/ReminderItem';
import { GlowingText } from '../components/reminders/StyledComponents';
import { REMINDER_CATEGORIES, VIEW_MODES } from '../constants/reminderConstants';
import { filterReminders, canModifyReminder, groupRemindersByDate } from '../utils/reminderHelpers';
import { useReminderActions } from '../hooks/useReminderActions';





export default function RemindersPage() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const { partnerData, loading: partnerLoading, error: partnerError, isSoloMode } = usePartnerData();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("personal");
  const [newDate, setNewDate] = useState(new Date());
  const [editingReminder, setEditingReminder] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.MY_REMINDERS);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [partnerReminders, setPartnerReminders] = useState([]);

  // Add admin check
  const isAdmin = user?.uid === "XGOegzsmohXhZtJT9ZE2uxaw4J83" || (user?.customClaims?.admin === true);

  // Use the extracted actions hook
  const {
    handleCreateReminder: createReminder,
    handleUpdateReminder: updateReminder,
    handleDeleteReminder,
    handleToggleComplete
  } = useReminderActions(user, userData, setError);

  // Force /login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [user, navigate]);

  // Fetch user's reminders
  useEffect(() => {
    let unsubscribe = null;
    let isMounted = true;

    const setupSubscription = async () => {
      if (!user?.uid) return;

      try {
        // Query for user's reminders
        const reminderQuery = query(
          collection(db, "reminders"),
          where("owner", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        unsubscribe = onSnapshot(reminderQuery, (snapshot) => {
          if (!isMounted) return;
          const remindersList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date || format(new Date(), 'yyyy-MM-dd')
          }));
          setReminders(remindersList);
          setLoading(false);
          setError(null);
        }, (err) => {
          console.error("Error fetching reminders:", err);
          if (isMounted) {
            setError(err.message);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Error setting up subscription:", err);
        if (isMounted) {
          setError("Failed to connect to the reminders service.");
          setLoading(false);
        }
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  // Add new effect for partner's reminders
  useEffect(() => {
    let unsubscribe = null;
    let isMounted = true;

    const setupPartnerSubscription = async () => {
      if (!user?.uid || !userData?.partnerId) return;

      try {
        // Query for partner's reminders
        const partnerQuery = query(
          collection(db, "reminders"),
          where("owner", "==", userData.partnerId),
          orderBy("createdAt", "desc")
        );

        unsubscribe = onSnapshot(partnerQuery, (snapshot) => {
          if (!isMounted) return;
          const partnerList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date || format(new Date(), 'yyyy-MM-dd')
          }));
          setPartnerReminders(partnerList);
        });
      } catch (err) {
        console.error("Error fetching partner's reminders:", err);
      }
    };

    setupPartnerSubscription();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid, userData?.partnerId]);

  // Wrapper functions to handle form logic
  const handleCreateReminderSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const formData = {
      title: newTitle,
      description: newDescription,
      category: newCategory,
      date: newDate
    };

    const success = await createReminder(e, formData);
    if (success) {
      setNewTitle("");
      setNewDescription("");
      setNewCategory("personal");
      setNewDate(new Date());
      setOpenCreate(false);
    }
  };

  const handleUpdateReminderSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const formData = {
      title: newTitle,
      description: newDescription,
      category: newCategory,
      date: newDate
    };

    const success = await updateReminder(e, editingReminder, formData);
    if (success) {
      setEditingReminder(null);
      setNewTitle("");
      setNewDescription("");
      setNewCategory("personal");
      setNewDate(new Date());
    }
  };

  const handleCleanup = async () => {
    try {
      setError(null);
      const result = await cleanupFirestoreData();
      if (result.success) {
        console.log("Cleanup successful");
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
      setError("Failed to clean up data");
    }
  };

  if (loading || partnerLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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

  if (isSoloMode) {
    return (
      <Container>
        {error && (
          <Typography color="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Typography>
        )}
        <Box sx={{ color: "#fff", p: { xs: 2, md: 4 } }}>
          {/* Header */}
          <Box sx={{ 
            mb: { xs: 3, sm: 4 }, 
            textAlign: 'center'
          }}>
            <GlowingText 
              variant="h3" 
              sx={{ 
                mb: 2,
                color: '#fff',
                textShadow: `0 0 20px ${alpha('#fff', 0.3)}`,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' }
              }}
            >
              {viewMode === VIEW_MODES.MY_REMINDERS ? "My To-Do List" : `${partnerData?.displayName || "Partner"}'s To-Do List`}
            </GlowingText>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: alpha('#fff', 0.8),
                maxWidth: 600,
                mx: 'auto',
                mb: 3,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {viewMode === VIEW_MODES.MY_REMINDERS 
                ? "Manage your personal tasks and to-dos"
                : "View and keep track of your partner's tasks"}
            </Typography>
          </Box>

          {/* Admin View Mode Selector */}
          {isAdmin && (
            <Box sx={{ 
              mb: { xs: 3, sm: 4 },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'center',
              gap: { xs: 1.5, sm: 2 }
            }}>
              <Button
                variant={viewMode === VIEW_MODES.MY_REMINDERS ? "contained" : "outlined"}
                onClick={() => setViewMode(VIEW_MODES.MY_REMINDERS)}
                sx={{ 
                  minWidth: { xs: '100%', sm: '200px' },
                  py: { xs: 1.25, sm: 1.5 },
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  ...(viewMode === VIEW_MODES.MY_REMINDERS ? {
                    bgcolor: alpha('#fff', 0.1),
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.15)
                    }
                  } : {
                    color: '#fff',
                    borderColor: alpha('#fff', 0.3),
                    '&:hover': {
                      borderColor: '#fff',
                      bgcolor: alpha('#fff', 0.05)
                    }
                  })
                }}
              >
                My To-Do List
              </Button>
              <Button
                variant={viewMode === VIEW_MODES.PARTNER_REMINDERS ? "contained" : "outlined"}
                onClick={() => setViewMode(VIEW_MODES.PARTNER_REMINDERS)}
                sx={{ 
                  minWidth: { xs: '100%', sm: '200px' },
                  py: { xs: 1.25, sm: 1.5 },
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  color: '#fff',
                  ...(viewMode === VIEW_MODES.PARTNER_REMINDERS ? {
                    bgcolor: alpha('#fff', 0.1),
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.15)
                    }
                  } : {
                    borderColor: alpha('#fff', 0.3),
                    '&:hover': {
                      borderColor: '#fff',
                      bgcolor: alpha('#fff', 0.05)
                    }
                  })
                }}
              >
                Partner's To-Do List
              </Button>
            </Box>
          )}

          {/* Create Button */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: { xs: 3, sm: 4 }
          }}>
            <Button
              variant="contained"
              onClick={() => setOpenCreate(true)}
              sx={{ 
                bgcolor: alpha('#fff', 0.1),
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: { xs: '0.95rem', sm: '1.1rem' },
                px: { xs: 4, sm: 6 },
                py: { xs: 1.25, sm: 1.5 },
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  bgcolor: alpha('#fff', 0.15)
                }
              }}
              startIcon={<AddIcon />}
            >
              Create New Task
            </Button>
          </Box>

          {/* Reminders List */}
          {Object.entries(groupRemindersByDate(reminders)).map(([period, items]) => {
            if (items.length === 0) return null;

            const title = {
              today: "Today",
              tomorrow: "Tomorrow",
              thisWeek: "This Week",
              thisMonth: "This Month",
              later: "Later"
            }[period];

            return (
              <Box key={period} sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <CalendarTodayIcon /> {title}
                </Typography>
                <AnimatePresence>
                  {items.map((reminder) => (
                    <ReminderItem
                      key={reminder.id}
                      reminder={reminder}
                      onToggle={() => handleToggleComplete(reminder)}
                      onEdit={() => {
                        setEditingReminder(reminder);
                        setNewTitle(reminder.title);
                        setNewDescription(reminder.description || "");
                        setNewCategory(reminder.category || "personal");
                        setSelectedDate(parseISO(reminder.date));
                      }}
                      onDelete={() => handleDeleteReminder(reminder.id)}
                      currentUserId={user.uid}
                    />
                  ))}
                </AnimatePresence>
              </Box>
            );
          })}

          {/* Create Dialog */}
          <Dialog 
            open={openCreate} 
            onClose={() => setOpenCreate(false)}
            PaperProps={{
              sx: {
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha('#fff', 0.1)}`,
                borderRadius: '24px',
                minWidth: { xs: '90vw', sm: '500px' }
              }
            }}
          >
            <DialogTitle>Create New Task</DialogTitle>
            <form onSubmit={handleCreateReminderSubmit}>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Title"
                  fullWidth
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: alpha('#fff', 0.3),
                      },
                      '&:hover fieldset': {
                        borderColor: alpha('#fff', 0.5),
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF69B4',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: alpha('#fff', 0.7),
                    },
                  }}
                />
                
                <TextField
                  margin="dense"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: alpha('#fff', 0.3),
                      },
                      '&:hover fieldset': {
                        borderColor: alpha('#fff', 0.5),
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF69B4',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: alpha('#fff', 0.7),
                    },
                  }}
                />

                <FormControl 
                  fullWidth 
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: alpha('#fff', 0.3),
                      },
                      '&:hover fieldset': {
                        borderColor: alpha('#fff', 0.5),
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF69B4',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: alpha('#fff', 0.7),
                    },
                  }}
                >
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    label="Category"
                  >
                    {REMINDER_CATEGORIES.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date"
                    value={selectedDate}
                    onChange={(newValue) => {
                      if (newValue && !isNaN(newValue.getTime())) {
                        setSelectedDate(newValue);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
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
                              borderColor: '#FF69B4',
                            }
                          },
                          '& .MuiInputLabel-root': {
                            color: alpha('#fff', 0.7),
                          },
                          '& .MuiSvgIcon-root': {
                            color: alpha('#fff', 0.7),
                          }
                        }}
                      />
                    )}
                    PopperProps={{
                      sx: {
                        '& .MuiPaper-root': {
                          bgcolor: 'rgba(18, 18, 18, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${alpha('#fff', 0.1)}`,
                          '& .MuiPickersDay-root': {
                            color: '#fff',
                            '&.Mui-selected': {
                              bgcolor: '#FF69B4',
                            },
                            '&:hover': {
                              bgcolor: alpha('#FF69B4', 0.2),
                            }
                          }
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                <Button 
                  onClick={() => setOpenCreate(false)}
                  sx={{ color: alpha('#fff', 0.7) }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained"
                  sx={{
                    bgcolor: alpha('#fff', 0.1),
                    color: '#fff',
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.15)
                    }
                  }}
                >
                  Create Task
                </Button>
              </DialogActions>
            </form>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog 
            open={!!editingReminder} 
            onClose={() => setEditingReminder(null)}
            PaperProps={{
              sx: {
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha('#fff', 0.1)}`,
                borderRadius: '24px',
                minWidth: { xs: '90vw', sm: '500px' }
              }
            }}
          >
            <DialogTitle>Edit Task</DialogTitle>
            <form onSubmit={handleUpdateReminderSubmit}>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Title"
                  fullWidth
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: alpha('#fff', 0.3),
                      },
                      '&:hover fieldset': {
                        borderColor: alpha('#fff', 0.5),
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF69B4',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: alpha('#fff', 0.7),
                    },
                  }}
                />
                
                <TextField
                  margin="dense"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: alpha('#fff', 0.3),
                      },
                      '&:hover fieldset': {
                        borderColor: alpha('#fff', 0.5),
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF69B4',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: alpha('#fff', 0.7),
                    },
                  }}
                />

                <FormControl 
                  fullWidth 
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: alpha('#fff', 0.3),
                      },
                      '&:hover fieldset': {
                        borderColor: alpha('#fff', 0.5),
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF69B4',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: alpha('#fff', 0.7),
                    },
                  }}
                >
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    label="Category"
                  >
                    {REMINDER_CATEGORIES.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date"
                    value={selectedDate}
                    onChange={(newValue) => {
                      if (newValue && !isNaN(newValue.getTime())) {
                        setSelectedDate(newValue);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
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
                              borderColor: '#FF69B4',
                            }
                          },
                          '& .MuiInputLabel-root': {
                            color: alpha('#fff', 0.7),
                          },
                          '& .MuiSvgIcon-root': {
                            color: alpha('#fff', 0.7),
                          }
                        }}
                      />
                    )}
                    PopperProps={{
                      sx: {
                        '& .MuiPaper-root': {
                          bgcolor: 'rgba(18, 18, 18, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${alpha('#fff', 0.1)}`,
                          '& .MuiPickersDay-root': {
                            color: '#fff',
                            '&.Mui-selected': {
                              bgcolor: '#FF69B4',
                            },
                            '&:hover': {
                              bgcolor: alpha('#FF69B4', 0.2),
                            }
                          }
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                <Button 
                  onClick={() => setEditingReminder(null)}
                  sx={{ color: alpha('#fff', 0.7) }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained"
                  sx={{
                    bgcolor: alpha('#fff', 0.1),
                    color: '#fff',
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.15)
                    }
                  }}
                >
                  Save
                </Button>
              </DialogActions>
            </form>
          </Dialog>
        </Box>
      </Container>
    );
  }

  if (!userData?.partnerId) {
    return (
      <NoPartnerState message="Link with a partner to start sharing reminders and keeping each other accountable!" />
    );
  }

  return (
    <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2 } }}>
      {error && (
        <Typography color="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ 
        color: "#fff", 
        py: { xs: 2, sm: 3 },
        px: { xs: 1, sm: 2 }
      }}>
        {/* Header */}
        <Box sx={{ 
          mb: { xs: 3, sm: 4 }, 
          textAlign: 'center'
        }}>
          <GlowingText 
            variant="h3" 
            sx={{ 
              mb: 2,
              color: '#fff',
              textShadow: `0 0 20px ${alpha('#fff', 0.3)}`,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' }
            }}
          >
            {viewMode === VIEW_MODES.MY_REMINDERS ? "My To-Do List" : `${partnerData?.displayName || "Partner"}'s To-Do List`}
          </GlowingText>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: alpha('#fff', 0.8),
              maxWidth: 600,
              mx: 'auto',
              mb: 3,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            {viewMode === VIEW_MODES.MY_REMINDERS 
              ? "Manage your personal tasks and to-dos"
              : "View and keep track of your partner's tasks"}
          </Typography>
        </Box>

        {/* View Mode Selector - Updated styles */}
        <Box sx={{ 
          mb: { xs: 3, sm: 4 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'center',
          gap: { xs: 1.5, sm: 2 }
        }}>
          <Button
            variant={viewMode === VIEW_MODES.MY_REMINDERS ? "contained" : "outlined"}
            onClick={() => setViewMode(VIEW_MODES.MY_REMINDERS)}
            sx={{ 
              minWidth: { xs: '100%', sm: '200px' },
              py: { xs: 1.25, sm: 1.5 },
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              ...(viewMode === VIEW_MODES.MY_REMINDERS ? {
                bgcolor: alpha('#fff', 0.1),
                '&:hover': {
                  bgcolor: alpha('#fff', 0.15)
                }
              } : {
                color: '#fff',
                borderColor: alpha('#fff', 0.3),
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: alpha('#fff', 0.05)
                }
              })
            }}
          >
            My To-Do List
          </Button>
          <Button
            variant={viewMode === VIEW_MODES.PARTNER_REMINDERS ? "contained" : "outlined"}
            onClick={() => setViewMode(VIEW_MODES.PARTNER_REMINDERS)}
            sx={{ 
              minWidth: { xs: '100%', sm: '200px' },
              py: { xs: 1.25, sm: 1.5 },
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              color: '#fff',
              ...(viewMode === VIEW_MODES.PARTNER_REMINDERS ? {
                bgcolor: alpha('#fff', 0.1),
                '&:hover': {
                  bgcolor: alpha('#fff', 0.15)
                }
              } : {
                borderColor: alpha('#fff', 0.3),
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: alpha('#fff', 0.05)
                }
              })
            }}
          >
            Partner's To-Do List
          </Button>
        </Box>

        {/* Create Button - Updated styles */}
        {viewMode === VIEW_MODES.MY_REMINDERS && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: { xs: 3, sm: 4 }
          }}>
            <Button
              variant="contained"
              onClick={() => setOpenCreate(true)}
              sx={{ 
                bgcolor: alpha('#fff', 0.1),
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: { xs: '0.95rem', sm: '1.1rem' },
                px: { xs: 4, sm: 6 },
                py: { xs: 1.25, sm: 1.5 },
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  bgcolor: alpha('#fff', 0.15)
                }
              }}
              startIcon={<AddIcon />}
            >
              Create New Task
            </Button>
          </Box>
        )}

        {/* Empty state message - Updated styles */}
        {filterReminders(reminders).length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: { xs: 6, sm: 8 },
            px: { xs: 2, sm: 3 },
            bgcolor: alpha('#fff', 0.05),
            borderRadius: '16px',
            border: `1px dashed ${alpha('#fff', 0.2)}`
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                color: alpha('#fff', 0.7),
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              {viewMode === VIEW_MODES.MY_REMINDERS 
                ? "You don't have any tasks yet"
                : "Your partner doesn't have any tasks yet"}
            </Typography>
            <Typography 
              sx={{ 
                color: alpha('#fff', 0.5),
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {viewMode === VIEW_MODES.MY_REMINDERS 
                ? "Click the Create button above to add your first task"
                : "Check back later to see your partner's tasks"}
            </Typography>
          </Box>
        )}

        {/* Reminders List - Updated styles */}
        {Object.entries(groupRemindersByDate(filterReminders(reminders))).map(([period, items]) => {
          if (items.length === 0) return null;

          const title = {
            today: "Today",
            tomorrow: "Tomorrow",
            thisWeek: "This Week",
            thisMonth: "This Month",
            later: "Later"
          }[period];

          return (
            <Box key={period} sx={{ mb: { xs: 3, sm: 4 } }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: { xs: 1.5, sm: 2 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} /> 
                {title}
              </Typography>
              <AnimatePresence>
                {items.map((reminder) => (
                  <ReminderItem
                    key={reminder.id}
                    reminder={reminder}
                    onToggle={() => handleToggleComplete(reminder)}
                    onEdit={() => {
                      setEditingReminder(reminder);
                      setNewTitle(reminder.title);
                      setNewDescription(reminder.description || "");
                      setNewCategory(reminder.category || "personal");
                      setSelectedDate(parseISO(reminder.date));
                    }}
                    onDelete={() => handleDeleteReminder(reminder.id)}
                    currentUserId={user.uid}
                  />
                ))}
              </AnimatePresence>
            </Box>
          );
        })}

        {/* Create Dialog */}
        <Dialog 
          open={openCreate} 
          onClose={() => setOpenCreate(false)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha('#fff', 0.1)}`,
              borderRadius: '24px',
              minWidth: { xs: '90vw', sm: '500px' }
            }
          }}
        >
          <DialogTitle>Create New Task</DialogTitle>
                        <form onSubmit={handleCreateReminderSubmit}>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Title"
                fullWidth
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: alpha('#fff', 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha('#fff', 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF69B4',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: alpha('#fff', 0.7),
                  },
                }}
              />
              
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: alpha('#fff', 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha('#fff', 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF69B4',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: alpha('#fff', 0.7),
                  },
                }}
              />

              <FormControl 
                fullWidth 
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: alpha('#fff', 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha('#fff', 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF69B4',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: alpha('#fff', 0.7),
                  },
                }}
              >
                <InputLabel>Category</InputLabel>
                <Select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  label="Category"
                >
                  {REMINDER_CATEGORIES.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={selectedDate}
                  onChange={(newValue) => {
                    if (newValue && !isNaN(newValue.getTime())) {
                      setSelectedDate(newValue);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
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
                            borderColor: '#FF69B4',
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: alpha('#fff', 0.7),
                        },
                        '& .MuiSvgIcon-root': {
                          color: alpha('#fff', 0.7),
                        }
                      }}
                    />
                  )}
                  PopperProps={{
                    sx: {
                      '& .MuiPaper-root': {
                        bgcolor: 'rgba(18, 18, 18, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${alpha('#fff', 0.1)}`,
                        '& .MuiPickersDay-root': {
                          color: '#fff',
                          '&.Mui-selected': {
                            bgcolor: '#FF69B4',
                          },
                          '&:hover': {
                            bgcolor: alpha('#FF69B4', 0.2),
                          }
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setOpenCreate(false)}
                sx={{ color: alpha('#fff', 0.7) }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained"
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  color: '#fff',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.15)
                  }
                }}
              >
                Create Task
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog 
          open={!!editingReminder} 
          onClose={() => setEditingReminder(null)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha('#fff', 0.1)}`,
              borderRadius: '24px',
              minWidth: { xs: '90vw', sm: '500px' }
            }
          }}
        >
          <DialogTitle>Edit Task</DialogTitle>
                        <form onSubmit={handleUpdateReminderSubmit}>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Title"
                fullWidth
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: alpha('#fff', 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha('#fff', 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF69B4',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: alpha('#fff', 0.7),
                  },
                }}
              />
              
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: alpha('#fff', 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha('#fff', 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF69B4',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: alpha('#fff', 0.7),
                  },
                }}
              />

              <FormControl 
                fullWidth 
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: alpha('#fff', 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha('#fff', 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF69B4',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: alpha('#fff', 0.7),
                  },
                }}
              >
                <InputLabel>Category</InputLabel>
                <Select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  label="Category"
                >
                  {REMINDER_CATEGORIES.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={selectedDate}
                  onChange={(newValue) => {
                    if (newValue && !isNaN(newValue.getTime())) {
                      setSelectedDate(newValue);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
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
                            borderColor: '#FF69B4',
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: alpha('#fff', 0.7),
                        },
                        '& .MuiSvgIcon-root': {
                          color: alpha('#fff', 0.7),
                        }
                      }}
                    />
                  )}
                  PopperProps={{
                    sx: {
                      '& .MuiPaper-root': {
                        bgcolor: 'rgba(18, 18, 18, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${alpha('#fff', 0.1)}`,
                        '& .MuiPickersDay-root': {
                          color: '#fff',
                          '&.Mui-selected': {
                            bgcolor: '#FF69B4',
                          },
                          '&:hover': {
                            bgcolor: alpha('#FF69B4', 0.2),
                          }
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setEditingReminder(null)}
                sx={{ color: alpha('#fff', 0.7) }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained"
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  color: '#fff',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.15)
                  }
                }}
              >
                Save
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Container>
  );
} 