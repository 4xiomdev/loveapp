import React, { useState } from 'react';
import { Box, Typography, Paper, alpha, Divider, IconButton, Chip, TextField, InputAdornment, Button } from '@mui/material';
import { format, addDays, subDays, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval } from 'date-fns';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SearchIcon from '@mui/icons-material/Search';
import TodayIcon from '@mui/icons-material/Today';
import FilterListIcon from '@mui/icons-material/FilterList';

// A more enhanced list-based view for mobile devices
const MobileFallbackView = ({ events = [], title, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'user', 'partner'
  
  // Navigation functions
  const goToToday = () => setCurrentDate(new Date());
  
  const goToPrevious = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
  };
  
  const goToNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
  };
  
  // Filter events based on date range, search term, and filter type
  const getFilteredEvents = () => {
    let filteredEvents = [...events];
    
    // Date range filtering
    if (viewMode === 'day') {
      filteredEvents = filteredEvents.filter(event => 
        isSameDay(new Date(event.start), currentDate)
      );
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      filteredEvents = filteredEvents.filter(event => 
        isWithinInterval(new Date(event.start), { start: weekStart, end: weekEnd })
      );
    }
    
    // Search term filtering
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        (event.title?.toLowerCase().includes(lowerSearchTerm)) ||
        (event.location?.toLowerCase().includes(lowerSearchTerm)) ||
        (event.description?.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Event type filtering
    if (filterType !== 'all') {
      filteredEvents = filteredEvents.filter(event => 
        filterType === 'partner' ? event.isPartnerEvent : !event.isPartnerEvent
      );
    }
    
    // Sort by start time
    filteredEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    return filteredEvents;
  };
  
  const filteredEvents = getFilteredEvents();
  
  // Group events by date for better organization
  const groupEventsByDate = () => {
    const grouped = {};
    filteredEvents.forEach(event => {
      const dateStr = format(new Date(event.start), 'yyyy-MM-dd');
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(event);
    });
    
    return grouped;
  };
  
  const groupedEvents = groupEventsByDate();
  const sortedDates = Object.keys(groupedEvents).sort();
  
  // Format date range string based on view mode
  const getDateRangeString = () => {
    if (viewMode === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    }
    return '';
  };
  
  return (
    <Box sx={{
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: alpha('#121212', 0.6),
      borderRadius: 2,
      p: 2
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6">
          {title || 'Events'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton 
            size="small" 
            onClick={() => setShowFilters(!showFilters)}
            color={showFilters ? 'primary' : 'default'}
          >
            <FilterListIcon />
          </IconButton>
          <IconButton size="small" onClick={goToToday}>
            <TodayIcon />
          </IconButton>
        </Box>
      </Box>
      
      {showFilters && (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1 }}
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label="All Events" 
              onClick={() => setFilterType('all')}
              color={filterType === 'all' ? 'primary' : 'default'}
              variant={filterType === 'all' ? 'filled' : 'outlined'}
              size="small"
            />
            <Chip 
              label="Your Events" 
              onClick={() => setFilterType('user')}
              color={filterType === 'user' ? 'primary' : 'default'}
              variant={filterType === 'user' ? 'filled' : 'outlined'}
              size="small"
            />
            <Chip 
              label="Partner Events" 
              onClick={() => setFilterType('partner')}
              color={filterType === 'partner' ? 'primary' : 'default'}
              variant={filterType === 'partner' ? 'filled' : 'outlined'}
              size="small"
            />
          </Box>
        </Box>
      )}
      
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label="Day" 
            onClick={() => setViewMode('day')}
            color={viewMode === 'day' ? 'primary' : 'default'}
            variant={viewMode === 'day' ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip 
            label="Week" 
            onClick={() => setViewMode('week')}
            color={viewMode === 'week' ? 'primary' : 'default'}
            variant={viewMode === 'week' ? 'filled' : 'outlined'}
            size="small"
          />
        </Box>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 2,
        py: 1,
        px: 1,
        bgcolor: alpha('#fff', 0.05),
        borderRadius: 1
      }}>
        <IconButton size="small" onClick={goToPrevious}>
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          {getDateRangeString()}
        </Typography>
        
        <IconButton size="small" onClick={goToNext}>
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Box>
      
      {filteredEvents.length === 0 ? (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          height: '100%',
          opacity: 0.7
        }}>
          <CalendarTodayIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
          <Typography>No events to display</Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={goToToday}
            sx={{ mt: 2 }}
          >
            Go to Today
          </Button>
        </Box>
      ) : (
        <Box sx={{ 
          overflowY: 'auto',
          flex: 1,
        }}>
          {sortedDates.map(dateStr => (
            <Box key={dateStr} sx={{ mb: 3 }}>
              {/* Only show date headers in week view */}
              {viewMode === 'week' && (
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 'bold',
                    mb: 1,
                    pb: 0.5,
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {format(new Date(dateStr), 'EEEE, MMMM d')}
                </Typography>
              )}
              
              {groupedEvents[dateStr].map(event => (
                <Paper
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: alpha(event.isPartnerEvent ? '#e74c3c' : '#9b59b6', 0.3),
                    border: `1px solid ${alpha(event.isPartnerEvent ? '#e74c3c' : '#9b59b6', 0.5)}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(event.isPartnerEvent ? '#e74c3c' : '#9b59b6', 0.4),
                      transform: 'translateY(-2px)'
                    },
                    '&:active': {
                      transform: 'translateY(0)'
                    }
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {event.title || 'Untitled Event'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, opacity: 0.8 }}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption">
                      {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                    </Typography>
                  </Box>
                  
                  {event.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, opacity: 0.8 }}>
                      <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="caption" noWrap>
                        {event.location}
                      </Typography>
                    </Box>
                  )}
                  
                  {event.description && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mt: 1, 
                        fontSize: '0.75rem',
                        opacity: 0.7,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {event.description}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MobileFallbackView; 