import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActionArea,
  CardActions,
  Divider,
  IconButton,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { GuestRepository, type Guest } from '../repositories/GuestRepository';

import type { Tables } from '../lib/supabase';

type Event = Tables<'events'>;

const EventList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [open, setOpen] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({ name: '', event_date: '' });
  const [newGuest, setNewGuest] = useState({ name: '', email: '' });
  const [guestsByEvent, setGuestsByEvent] = useState<Record<string, Guest[]>>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch all data when component mounts
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setLoadingGuests(true);

        // Fetch events and guests in parallel
        const [eventsData, guestsData] = await Promise.all([
          supabase.from('events').select('*').order('event_date', { ascending: false }),
          GuestRepository.getAllEventGuests()
        ]);

        if (eventsData.error) throw eventsData.error;

        setEvents(eventsData.data || []);
        setGuestsByEvent(guestsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
        setLoadingGuests(false);
      }
    };

    fetchAllData();
  }, []);



  const handleOpen = () => {
    setOpen(true);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setNewEvent({ name: '', event_date: '' });
    setError(null);
  };

  const handleGuestDialogOpen = (event: Event) => {
    setSelectedEvent(event);
    setGuestDialogOpen(true);
  };

  const handleGuestDialogClose = () => {
    setGuestDialogOpen(false);
    setNewGuest({ name: '', email: '' });
    setError(null);
  };

  // Update guests in the state after adding a new guest
  const updateGuestsForEvent = (eventId: string, guest: Guest) => {
    setGuestsByEvent(prev => ({
      ...prev,
      [eventId]: [...(prev[eventId] || []), guest]
    }));
  };

  const handleAddGuest = async () => {
    if (!newGuest.name.trim()) {
      setError('Please enter a name for the guest');
      return;
    }

    if (!selectedEvent) return;

    try {
      const guest = await GuestRepository.addGuestToEvent(
        {
          display_name: newGuest.name.trim(),
          email: newGuest.email?.trim()
        },
        selectedEvent.id
      );

      // Update the local state with the new guest
      updateGuestsForEvent(selectedEvent.id, guest);

      // Reset the form
      setNewGuest({ name: '', email: '' });

      // Show success message
      setError('Guest added successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Error adding guest:', err);
      setError(err instanceof Error ? err.message : 'Failed to add guest');
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.name.trim() || !newEvent.event_date) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            event_name: newEvent.name.trim(),
            event_date: newEvent.event_date,
          },
        ])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setEvents([data[0], ...events]);
        handleClose();
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h2" component="h2">
          My Events
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          New Event
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary" gutterBottom>
              No events yet
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Create your first event to get started
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3,
          alignItems: 'start'
        }}>
          {events.map((event) => (
            <Card
              key={event.id}
              variant="outlined"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: 'auto',
                minHeight: '120px',
                maxWidth: '100%',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardActionArea
                component={Link}
                to={`/events/${event.id}`}
                sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <CardContent sx={{ pb: 1, width: '100%' }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {event.event_name}
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    {formatDate(event.event_date)}
                  </Typography>
                </CardContent>
              </CardActionArea>
              <Divider />
              <Box sx={{
                p: 2,
                pt: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
                mt: 'auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 1 }}>
                    {guestsByEvent[event.id]?.length || 0} {guestsByEvent[event.id]?.length === 1 ? 'guest' : 'guests'}
                  </Typography>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleGuestDialogOpen(event);
                    }}
                  >
                    <PersonAddIcon fontSize="small" />
                  </IconButton>
                </Box>

                {loadingGuests ? (
                  <Box display="flex" justifyContent="center" py={1}>
                    <CircularProgress size={20} />
                  </Box>
                ) : guestsByEvent[event.id]?.length > 0 ? (
                  <Box>
                    {guestsByEvent[event.id].slice(0, 3).map(guest => (
                      <Box key={guest.id} display="flex" alignItems="center" mb={0.5}>
                        <PersonIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {guest.display_name}
                          {guest.email && ` (${guest.email})`}
                        </Typography>
                      </Box>
                    ))}
                    {guestsByEvent[event.id].length > 3 && (
                      <Typography variant="body2" color="text.secondary">
                        +{guestsByEvent[event.id].length - 3} more...
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No guests yet. Click + to add one.
                  </Typography>
                )}
              </Box>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  color="primary"
                  component={Link}
                  to={`/events/${event.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Add Guest Dialog */}
      <Dialog open={guestDialogOpen} onClose={handleGuestDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add Guest to {selectedEvent?.event_name}
          <IconButton
            aria-label="close"
            onClick={handleGuestDialogClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert
              severity={error.includes('success') ? 'success' : 'error'}
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {selectedEvent && guestsByEvent[selectedEvent.id]?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Guests ({guestsByEvent[selectedEvent.id].length})
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                {selectedEvent && guestsByEvent[selectedEvent.id]?.map(guest => (
                  <Box
                    key={guest.id}
                    display="flex"
                    alignItems="center"
                    py={1}
                    px={1}
                    sx={{
                      '&:not(:last-child)': {
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }
                    }}
                  >
                    <PersonIcon fontSize="small" color="action" sx={{ mr: 1.5 }} />
                    <Box>
                      <Typography variant="body2">
                        {guest.display_name}
                      </Typography>
                      {guest.email && (
                        <Typography variant="caption" color="text.secondary">
                          {guest.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Add New Guest
            </Typography>
            <Box display="flex" gap={2}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="guest-name"
                label="Guest Name"
                name="name"
                autoFocus
                value={newGuest.name}
                onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                size="small"
              />
              <TextField
                margin="normal"
                fullWidth
                id="guest-email"
                label="Email (optional)"
                name="email"
                type="email"
                value={newGuest.email}
                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                size="small"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleGuestDialogClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddGuest}
            variant="contained"
            color="primary"
          >
            Add Guest
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Create New Event
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="event-name"
              label="Event Name"
              name="name"
              autoFocus
              value={newEvent.name}
              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="event_date"
              label="Date & Time"
              type="datetime-local"
              id="event-date"
              InputLabelProps={{
                shrink: true,
              }}
              value={newEvent.event_date}
              onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateEvent}
            variant="contained"
            color="primary"
          >
            Create Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventList;
