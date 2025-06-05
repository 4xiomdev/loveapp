import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  alpha
} from '@mui/material';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { motion } from "framer-motion";
import { format, parseISO } from 'date-fns';
import { ReminderCard } from './StyledComponents';

const REMINDER_CATEGORIES = [
  { value: 'personal', label: 'Personal', icon: '👤' },
  { value: 'work', label: 'Work', icon: '💼' },
  { value: 'health', label: 'Health', icon: '🏥' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'social', label: 'Social', icon: '🤝' },
  { value: 'other', label: 'Other', icon: '📝' }
];

function ReminderItem({ reminder, onToggle, onEdit, onDelete, currentUserId }) {
  const canModify = reminder.owner === currentUserId;
  const isPartnerView = reminder.owner !== currentUserId;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <ReminderCard 
        completed={reminder.completed ? 'true' : 'false'}
        data-partner-view={isPartnerView}
        sx={{
          bgcolor: alpha('#fff', 0.03),
          borderColor: alpha('#fff', reminder.completed ? 0.1 : 0.2)
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
            <IconButton 
              onClick={() => onToggle(reminder)}
              disabled={!canModify}
              sx={{ 
                color: reminder.completed ? '#4caf50' : alpha('#fff', 0.7),
                '&:hover': {
                  color: canModify ? (reminder.completed ? '#66bb6a' : '#fff') : undefined
                },
                opacity: canModify ? 1 : 0.5
              }}
            >
              {reminder.completed ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
            </IconButton>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  textDecoration: reminder.completed ? 'line-through' : 'none',
                  color: reminder.completed ? alpha('#fff', 0.5) : '#fff'
                }}
              >
                {reminder.title}
              </Typography>
              {reminder.description && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mt: 1,
                    color: alpha('#fff', 0.7),
                    textDecoration: reminder.completed ? 'line-through' : 'none'
                  }}
                >
                  {reminder.description}
                </Typography>
              )}
              <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip 
                  label={format(parseISO(reminder.date), 'MMM d, yyyy')}
                  size="small"
                  sx={{ 
                    bgcolor: alpha('#fff', 0.1),
                    color: '#fff',
                    '& .MuiChip-label': {
                      px: 2
                    }
                  }}
                />
                {reminder.category && (
                  <Chip 
                    label={REMINDER_CATEGORIES.find(c => c.value === reminder.category)?.label || reminder.category}
                    size="small"
                    sx={{ 
                      bgcolor: alpha('#fff', 0.1),
                      color: '#fff',
                      '& .MuiChip-label': {
                        px: 2
                      }
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
          {canModify && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                onClick={() => onEdit(reminder)}
                sx={{ 
                  color: alpha('#fff', 0.7),
                  '&:hover': { color: '#fff' }
                }}
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                onClick={() => onDelete(reminder.id)}
                sx={{ 
                  color: alpha('#fff', 0.7),
                  '&:hover': { color: '#f44336' }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </ReminderCard>
    </motion.div>
  );
}

export default ReminderItem; 