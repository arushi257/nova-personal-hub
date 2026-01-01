'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

type TripStatus = 'upcoming' | 'active' | 'past';

type TripSegment = {
  id: string;
  location: string;
  mode: string;
  startDate: string;
  endDate: string;
  notes?: string;
};

type SegmentDraft = {
  location: string;
  mode: string;
  startDate: string;
  endDate: string;
  notes: string;
};

type Attachment = {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'other';
  url: string;
};

type ItineraryItem = {
  id: string;
  time: string;
  detail: string;
};

type Trip = {
  id: string;
  title: string;
  status: TripStatus;
  mood: string;
  notes: string;
  segments: TripSegment[];
  itinerary: ItineraryItem[];
  attachments: Attachment[];
  calendarDates: string[];
  addedLocations: string[];
};

type ClockEntry = {
  id: string;
  label: string;
  offset: number;
  weather: string;
};

const initialTrips: Trip[] = [
  {
    id: 'iceland-aurora',
    title: 'Iceland Aurora Expedition',
    status: 'past',
    mood: 'chill',
    notes: 'Chased the lights around Iceland and soaked in geothermal pools.',
    segments: [
      {
        id: 'seg-1',
        location: 'Seattle (SEA)',
        mode: 'Flight · Delta A330',
        startDate: '2024-02-01',
        endDate: '2024-02-01',
        notes: 'Overnight flight to Keflavík with premium cabin.'
      },
      {
        id: 'seg-2',
        location: 'Reykjavik',
        mode: 'Rental Car · VW ID.4',
        startDate: '2024-02-02',
        endDate: '2024-02-10',
        notes: 'Ring road loop + glacier hike stops.'
      }
    ],
    itinerary: [
      { id: 'iti-1', time: 'Day 1', detail: 'Arrive, rest, light Reykjavik walk.' },
      { id: 'iti-2', time: 'Day 3', detail: 'Northern lights chase near Vik.' }
    ],
    attachments: [],
    calendarDates: ['2024-02-01', '2024-02-10'],
    addedLocations: ['Seattle', 'Reykjavik']
  },
  {
    id: 'tokyo-garden',
    title: 'Japan Garden Sprint',
    status: 'past',
    mood: 'excited',
    notes: 'Cherry blossoms, neon arcades, and tea ceremonies.',
    segments: [
      {
        id: 'seg-3',
        location: 'San Francisco (SFO)',
        mode: 'Flight · ANA 787',
        startDate: '2024-03-04',
        endDate: '2024-03-05',
        notes: 'Red-eye to Narita, quick layover in Tokyo.'
      },
      {
        id: 'seg-4',
        location: 'Kyoto',
        mode: 'Shinkansen · Hikari',
        startDate: '2024-03-06',
        endDate: '2024-03-10',
        notes: 'Tea ceremonies in Higashiyama, early morning gardens.'
      }
    ],
    itinerary: [
      { id: 'iti-3', time: 'Day 2', detail: 'Shibuya crossing + neon dinner.' },
      { id: 'iti-4', time: 'Day 4', detail: 'Arashiyama bamboo groves + river cruise.' }
    ],
    attachments: [],
    calendarDates: ['2024-03-04', '2024-03-10'],
    addedLocations: ['San Francisco', 'Tokyo', 'Kyoto']
  },
  {
    id: '2025-europe-families',
    title: '2025 Europe Family Tour',
    status: 'upcoming',
    mood: 'anxious',
    notes: 'In-progress planning for Paris, Amsterdam, and Milan.',
    segments: [
      {
        id: 'seg-5',
        location: 'New York (JFK)',
        mode: 'Flight · Air France A350',
        startDate: '2025-05-12',
        endDate: '2025-05-12',
        notes: 'Night leg to Paris.'
      },
      {
        id: 'seg-6',
        location: 'Paris → Amsterdam',
        mode: 'Train · Thalys',
        startDate: '2025-05-15',
        endDate: '2025-05-15',
        notes: 'Day trip with luggage delivery service.'
      },
      {
        id: 'seg-7',
        location: 'Amsterdam → Milan',
        mode: 'Flight · ITA Airways CRJ',
        startDate: '2025-05-18',
        endDate: '2025-05-18',
        notes: 'Connecting through Zurich.'
      }
    ],
    itinerary: [{ id: 'iti-5', time: 'Day 6', detail: 'Gondola rehearsal in Venice (tentative).' }],
    attachments: [],
    calendarDates: ['2025-05-12', '2025-05-18'],
    addedLocations: ['Paris', 'Amsterdam', 'Milan']
  }
];

const locationPins: Record<string, { x: number; y: number }> = {
  Reykjavik: { x: 20, y: 40 },
  Seattle: { x: 15, y: 20 },
  Tokyo: { x: 85, y: 45 },
  Kyoto: { x: 80, y: 55 },
  Paris: { x: 45, y: 35 },
  Amsterdam: { x: 43, y: 30 },
  Milan: { x: 50, y: 45 }
};

const initialClocks: ClockEntry[] = [
  { id: 'clock-1', label: 'Reykjavik', offset: 0, weather: 'Snow • -2°C' },
  { id: 'clock-2', label: 'Kyoto', offset: 9, weather: 'Clear • 22°C' },
  { id: 'clock-3', label: 'Paris', offset: 1, weather: 'Cloudy • 14°C' }
];

const moods = [
  { value: 'excited', label: 'Excited' },
  { value: 'chill', label: 'Chill' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'focused', label: 'Focused' }
];

const createEmptySegmentDraft = (): SegmentDraft => ({
  location: '',
  mode: '',
  startDate: '',
  endDate: '',
  notes: ''
});

export default function TravelPage() {
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TripStatus>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(initialTrips[0]?.id || null);
  const [newTripDraft, setNewTripDraft] = useState({
    title: '',
    startDate: '',
    endDate: '',
    status: 'upcoming' as TripStatus,
    mood: 'excited',
    notes: '',
    primaryLocation: ''
  });
  const [newTripSegments, setNewTripSegments] = useState<TripSegment[]>([]);
  const [newTripSegmentDraft, setNewTripSegmentDraft] = useState<SegmentDraft>(createEmptySegmentDraft());
  const [drawerSegmentDraft, setDrawerSegmentDraft] = useState<SegmentDraft>(createEmptySegmentDraft());
  const [itineraryDraft, setItineraryDraft] = useState({ time: '', detail: '' });
  const [worldClocks, setWorldClocks] = useState<ClockEntry[]>(initialClocks);
  const [newClock, setNewClock] = useState({ label: '', offset: '0', weather: 'Calm • 18°C' });

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const term = searchTerm.toLowerCase();
      const matches =
        trip.title.toLowerCase().includes(term) ||
        trip.notes.toLowerCase().includes(term) ||
        trip.segments.some((segment) => segment.location.toLowerCase().includes(term));
      const statusMatch = statusFilter === 'all' || trip.status === statusFilter;
      return matches && statusMatch;
    });
  }, [trips, searchTerm, statusFilter]);

  const sortedTrips = useMemo(() => {
    const copy = [...filteredTrips];
    if (sortOption === 'newest') {
      copy.sort((a, b) => (b.calendarDates[0] || '').localeCompare(a.calendarDates[0] || ''));
    } else if (sortOption === 'oldest') {
      copy.sort((a, b) => (a.calendarDates[0] || '').localeCompare(b.calendarDates[0] || ''));
    } else {
      copy.sort((a, b) => a.title.localeCompare(b.title));
    }
    return copy;
  }, [filteredTrips, sortOption]);

  const timelineSegments = useMemo(() => {
    return filteredTrips
      .flatMap((trip) =>
        trip.segments.map((segment) => ({
          ...segment,
          tripTitle: trip.title,
          status: trip.status,
          mood: trip.mood
        }))
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [filteredTrips]);

  const calendarHighlight = useMemo(() => {
    const map: Record<string, string> = {};
    trips.forEach((trip) => {
      trip.calendarDates.forEach((date) => {
        map[date] = trip.id;
      });
    });
    return map;
  }, [trips]);

  const activeTrip = useMemo(() => trips.find((trip) => trip.id === selectedTripId) ?? null, [trips, selectedTripId]);

  const formatRange = (start: string, end: string) => {
    if (!start && !end) return 'Dates TBD';
    if (!end) return new Date(start).toLocaleDateString();
    return `${new Date(start).toLocaleDateString()} — ${new Date(end).toLocaleDateString()}`;
  };

  const isValidDateRange = (start: string, end: string) => {
    if (!start || !end) return true;
    return new Date(end) >= new Date(start);
  };

  const formatClock = (offset: number) => {
    const date = new Date();
    date.setHours(date.getUTCHours() + offset);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleAddSegmentToDraft = () => {
    const { location, startDate, endDate } = newTripSegmentDraft;
    if (!location || !startDate || !endDate) return;
    if (!isValidDateRange(startDate, endDate)) {
      alert('Segment end date must be same as or after the start date.');
      return;
    }
    setNewTripSegments((prev) => [...prev, { id: crypto.randomUUID(), ...newTripSegmentDraft }]);
    setNewTripSegmentDraft(createEmptySegmentDraft());
  };

  const handleAddTrip = () => {
    if (!newTripDraft.title || !newTripDraft.startDate || !newTripDraft.endDate) return;
    if (!isValidDateRange(newTripDraft.startDate, newTripDraft.endDate)) {
      alert('Trip end date must be the same as or after the start date.');
      return;
    }
    const trip: Trip = {
      id: crypto.randomUUID(),
      title: newTripDraft.title,
      status: newTripDraft.status,
      mood: newTripDraft.mood,
      notes: newTripDraft.notes,
      segments:
        newTripSegments.length > 0
          ? newTripSegments
          : [
              {
                id: crypto.randomUUID(),
                location: newTripDraft.primaryLocation || 'TBD',
                mode: 'General travel plan',
                startDate: newTripDraft.startDate,
                endDate: newTripDraft.endDate,
                notes: ''
              }
            ],
      itinerary: [],
      attachments: [],
      calendarDates: [newTripDraft.startDate, newTripDraft.endDate],
      addedLocations: newTripSegments.map((segment) => segment.location)
    };
    setTrips((prev) => [trip, ...prev]);
    setNewTripDraft({
      title: '',
      startDate: '',
      endDate: '',
      status: 'upcoming',
      mood: 'excited',
      notes: '',
      primaryLocation: ''
    });
    setNewTripSegments([]);
    setSelectedTripId(trip.id);
  };

  const handleAddSegment = (tripId: string) => {
    const { location, startDate, endDate } = drawerSegmentDraft;
    if (!location || !startDate || !endDate) return;
    if (!isValidDateRange(startDate, endDate)) {
      alert('Segment end date must be same as or after the start date.');
      return;
    }
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, segments: [...trip.segments, { id: crypto.randomUUID(), ...drawerSegmentDraft }] }
          : trip
      )
    );
    setDrawerSegmentDraft(createEmptySegmentDraft());
  };

  const handleAddItinerary = (tripId: string) => {
    if (!itineraryDraft.time || !itineraryDraft.detail) return;
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, itinerary: [...trip.itinerary, { id: crypto.randomUUID(), ...itineraryDraft }] }
          : trip
      )
    );
    setItineraryDraft({ time: '', detail: '' });
  };

  const handleAttachmentUpload = (tripId: string, files: FileList | null) => {
    if (!files) return;
    const attachments = Array.from(files).map((file) => {
      const url = URL.createObjectURL(file);
      let type: Attachment['type'] = 'other';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type === 'application/pdf') type = 'pdf';
      return { id: crypto.randomUUID(), name: file.name, type, url };
    });
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId ? { ...trip, attachments: [...trip.attachments, ...attachments] } : trip
      )
    );
  };

  const handleRemoveAttachment = (tripId: string, attachmentId: string) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, attachments: trip.attachments.filter((attachment) => attachment.id !== attachmentId) }
          : trip
      )
    );
  };

  const handleTripUpdate = (
    tripId: string,
    field: keyof Pick<Trip, 'title' | 'notes' | 'mood' | 'status'>,
    value: string
  ) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              [field]: field === 'status' ? (value as TripStatus) : value
            }
          : trip
      )
    );
  };

  const handleWorldClockAdd = () => {
    if (!newClock.label) return;
    setWorldClocks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: newClock.label, offset: Number(newClock.offset), weather: newClock.weather }
    ]);
    setNewClock({ label: '', offset: '0', weather: 'Calm • 18°C' });
  };

  const handleCalendarDateClick = (date: string) => {
    const tripId = calendarHighlight[date];
    if (tripId) {
      setSelectedTripId(tripId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.headerRow}>
        <div>
          <p className={styles.subtext}>Pulse • Travel hub</p>
          <h1 className={styles.mainTitle}>Travel log & planning center</h1>
          <p className={styles.description}>
            Capture past journeys, plan future escapes, stash itineraries, embed weather widgets, and sync with the calendar.
          </p>
        </div>
        <button className={styles.glassButton} onClick={() => document.getElementById('add-trip-form')?.scrollIntoView({ behavior: 'smooth' })}>
          Add new trip
        </button>
      </header>

      <section className={styles.addTripSection} id="add-trip-form">
        <h2>Plan a trip</h2>
        <div className={styles.formGrid}>
          <label>
            <span className={styles.smallLabel}>Trip title</span>
            <input
              value={newTripDraft.title}
              onChange={(e) => setNewTripDraft({ ...newTripDraft, title: e.target.value })}
              className={styles.textInput}
              placeholder="Family Euro tour"
            />
          </label>
          <label>
            <span className={styles.smallLabel}>Start date</span>
            <input
              type="date"
              value={newTripDraft.startDate}
              onChange={(e) => setNewTripDraft({ ...newTripDraft, startDate: e.target.value })}
              className={styles.textInput}
            />
          </label>
          <label>
            <span className={styles.smallLabel}>End date</span>
            <input
              type="date"
              value={newTripDraft.endDate}
              onChange={(e) => setNewTripDraft({ ...newTripDraft, endDate: e.target.value })}
              className={styles.textInput}
            />
          </label>
          <label>
            <span className={styles.smallLabel}>Mode of travel</span>
            <input
              value={newTripDraft.primaryLocation}
              onChange={(e) => setNewTripDraft({ ...newTripDraft, primaryLocation: e.target.value })}
              className={styles.textInput}
              placeholder="Flights · Emirates A380"
            />
          </label>
          <label>
            <span className={styles.smallLabel}>Status</span>
            <select
              value={newTripDraft.status}
              onChange={(e) =>
                setNewTripDraft({
                  ...newTripDraft,
                  status: e.target.value as TripStatus
                })
              }
              className={styles.textInput}
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="past">Past</option>
            </select>
          </label>
          <label>
            <span className={styles.smallLabel}>Mood</span>
            <select
              value={newTripDraft.mood}
              onChange={(e) => setNewTripDraft({ ...newTripDraft, mood: e.target.value })}
              className={styles.textInput}
            >
              {moods.map((mood) => (
                <option key={mood.value} value={mood.value}>
                  {mood.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={styles.smallLabel}>Notes</span>
            <textarea
              rows={2}
              value={newTripDraft.notes}
              onChange={(e) => setNewTripDraft({ ...newTripDraft, notes: e.target.value })}
              className={styles.textArea}
              placeholder="Any pre-trip reminders?"
            />
          </label>
        </div>
        <div className={styles.segmentForm}>
          <h3>Trip segments</h3>
          <div className={styles.inlineRow}>
            <input
              className={styles.smallInput}
              placeholder="Location"
              value={newTripSegmentDraft.location}
              onChange={(e) => setNewTripSegmentDraft({ ...newTripSegmentDraft, location: e.target.value })}
            />
            <input
              className={styles.smallInput}
              placeholder="Mode + carrier"
              value={newTripSegmentDraft.mode}
              onChange={(e) => setNewTripSegmentDraft({ ...newTripSegmentDraft, mode: e.target.value })}
            />
            <input
              type="date"
              className={styles.smallInput}
              value={newTripSegmentDraft.startDate}
              onChange={(e) => setNewTripSegmentDraft({ ...newTripSegmentDraft, startDate: e.target.value })}
            />
            <input
              type="date"
              className={styles.smallInput}
              value={newTripSegmentDraft.endDate}
              onChange={(e) => setNewTripSegmentDraft({ ...newTripSegmentDraft, endDate: e.target.value })}
            />
            <input
              className={styles.smallInput}
              placeholder="Notes"
              value={newTripSegmentDraft.notes}
              onChange={(e) => setNewTripSegmentDraft({ ...newTripSegmentDraft, notes: e.target.value })}
            />
            <button className={styles.actionButton} type="button" onClick={handleAddSegmentToDraft}>
              Add segment
            </button>
          </div>
          {newTripSegments.length > 0 && (
            <div className={styles.segmentPreview}>
              {newTripSegments.map((segment) => (
                <div key={segment.id} className={styles.segmentBadge}>
                  {segment.location} • {segment.mode} • {formatRange(segment.startDate, segment.endDate)}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={styles.formActions}>
          <button className={styles.actionButton} onClick={handleAddTrip}>
            Save trip
          </button>
          <span className={styles.helperText}>Segments are optional—will default to the main date range.</span>
        </div>
      </section>

      <section className={styles.toolbar}>
        <div className={styles.filters}>
          <input
            className={styles.searchInput}
            placeholder="Search location or notes"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={styles.filterPills}>
            {(['all', 'upcoming', 'active', 'past'] as const).map((status) => (
              <button
                key={status}
                className={`${styles.filterPill} ${statusFilter === status ? styles.filterActive : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All trips' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.toolbarActions}>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value as any)} className={styles.select}>
            <option value="newest">Sort: newest</option>
            <option value="oldest">Sort: oldest</option>
            <option value="title">Sort: title</option>
          </select>
          <div className={styles.viewToggle}>
            {(['list', 'timeline'] as const).map((mode) => (
              <button
                key={mode}
                className={`${styles.viewButton} ${viewMode === mode ? styles.viewActive : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {mode === 'list' ? 'List' : 'Timeline'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.grid}>
        <div className={styles.mainColumn}>
          {viewMode === 'list' ? (
            <div className={styles.listView}>
              {sortedTrips.length === 0 && <p className={styles.emptyState}>No trips match this filter.</p>}
              {sortedTrips.map((trip) => (
                <div key={trip.id} className={styles.tripCard}>
                  <div className={styles.tripHeader}>
                    <div>
                      <h3>{trip.title}</h3>
                      <p className={styles.tripMeta}>
                        {formatRange(trip.calendarDates[0], trip.calendarDates[1])} • {trip.status} • Mood: {trip.mood}
                      </p>
                    </div>
                    <div className={styles.tripActions}>
                      <button onClick={() => setSelectedTripId(trip.id)} className={styles.linkButton}>
                        Details
                      </button>
                      <button
                        className={styles.linkButton}
                        onClick={() => setTrips((prev) => prev.filter((item) => item.id !== trip.id))}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className={styles.tripNote}>{trip.notes}</p>
                  <div className={styles.segmentList}>
                    {trip.segments.map((segment) => (
                      <div key={segment.id} className={styles.segmentRow}>
                        <div>
                          <strong className={styles.segmentLocation}>{segment.location}</strong>
                          <span className={styles.segmentMode}>{segment.mode}</span>
                        </div>
                        <div className={styles.segmentDates}>{formatRange(segment.startDate, segment.endDate)}</div>
                        {segment.notes && <p className={styles.segmentNotes}>{segment.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.timeline}>
              {timelineSegments.map((segment) => (
                <div key={`${segment.id}-${segment.startDate}`} className={styles.timelineCard}>
                  <div className={styles.timelineTrip}>{segment.tripTitle}</div>
                  <div className={styles.timelineSegment}>{segment.location}</div>
                  <div className={styles.timelineMode}>{segment.mode}</div>
                  <div className={styles.timelineDates}>{formatRange(segment.startDate, segment.endDate)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.mapCard}>
            <h3>Map overview</h3>
            <svg className={styles.mapSvg} viewBox="0 0 100 60">
              <path
                d="M4 30 Q15 10 40 12 Q60 14 80 4 Q92 30 80 50 Q60 56 40 50 Q15 48 4 30"
                fill="url(#land)"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="0.5"
              />
              <defs>
                <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#142D50" />
                  <stop offset="100%" stopColor="#0D1622" />
                </linearGradient>
              </defs>
              {Object.entries(locationPins).map(([label, coords]) => (
                <circle key={label} cx={coords.x} cy={coords.y} r="2" fill="#00E5FF" />
              ))}
              {Object.entries(locationPins).map(([label, coords]) => (
                <text key={`${label}-label`} x={coords.x + 3} y={coords.y + 2} className={styles.pinLabel}>
                  {label}
                </text>
              ))}
            </svg>
            <div className={styles.mapLegend}>
              {filteredTrips.slice(0, 3).map((trip) => (
                <span key={trip.id}>{trip.title}</span>
              ))}
            </div>
          </div>

          <div className={styles.calendarCard}>
            <h3>Mini calendar</h3>
            <div className={styles.calendarGrid}>
              {Array.from({ length: 30 }).map((_, index) => {
                const day = index + 1;
                const date = new Date();
                date.setDate(day);
                const key = date.toISOString().split('T')[0];
                const highlight = calendarHighlight[key];
                return (
                  <button
                    key={key}
                    className={`${styles.calendarDay} ${highlight ? styles.calendarHighlighted : ''} ${
                      key === new Date().toISOString().split('T')[0] ? styles.calendarToday : ''
                    }`}
                    onClick={() => handleCalendarDateClick(key)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.clockSection}>
            <h3>Clocks & weather</h3>
            <div className={styles.clockGrid}>
              {worldClocks.map((clock) => (
                <div key={clock.id} className={styles.clockCard}>
                  <div className={styles.clockTime}>{formatClock(clock.offset)}</div>
                  <div className={styles.clockLabel}>{clock.label}</div>
                  <div className={styles.clockWeather}>{clock.weather}</div>
                </div>
              ))}
            </div>
            <div className={styles.inlineRow}>
              <input
                className={styles.smallInput}
                placeholder="Location"
                value={newClock.label}
                onChange={(e) => setNewClock({ ...newClock, label: e.target.value })}
              />
              <input
                type="number"
                className={styles.smallInput}
                placeholder="UTC offset"
                value={newClock.offset}
                onChange={(e) => setNewClock({ ...newClock, offset: e.target.value })}
              />
              <input
                className={styles.smallInput}
                placeholder="Weather note"
                value={newClock.weather}
                onChange={(e) => setNewClock({ ...newClock, weather: e.target.value })}
              />
              <button className={styles.actionButton} onClick={handleWorldClockAdd}>
                Add
              </button>
            </div>
          </div>

          <Link className={styles.pulseLink} href="/pulse/habits">
            Set up a Travel Mood habit in Pulse
          </Link>
        </aside>
      </div>

      {activeTrip && (
        <section className={styles.drawer}>
          <div className={styles.drawerHeader}>
            <input
              value={activeTrip.title}
              onChange={(e) => handleTripUpdate(activeTrip.id, 'title', e.target.value)}
              className={styles.drawerTitle}
            />
            <select
              value={activeTrip.status}
              onChange={(e) => handleTripUpdate(activeTrip.id, 'status', e.target.value)}
              className={styles.drawerSelect}
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="past">Past</option>
            </select>
            <select
              value={activeTrip.mood}
              onChange={(e) => handleTripUpdate(activeTrip.id, 'mood', e.target.value)}
              className={styles.drawerSelect}
            >
              {moods.map((mood) => (
                <option key={mood.value} value={mood.value}>
                  {mood.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.drawerSection}>
            <h4>Notes</h4>
            <textarea
              className={styles.textArea}
              rows={3}
              value={activeTrip.notes}
              onChange={(e) => handleTripUpdate(activeTrip.id, 'notes', e.target.value)}
            />
          </div>
          <div className={styles.drawerSection}>
            <h4>Itinerary</h4>
            <div className={styles.inlineRow}>
              <input
                value={itineraryDraft.time}
                onChange={(e) => setItineraryDraft({ ...itineraryDraft, time: e.target.value })}
                className={styles.smallInput}
                placeholder="Time slot"
              />
              <input
                value={itineraryDraft.detail}
                onChange={(e) => setItineraryDraft({ ...itineraryDraft, detail: e.target.value })}
                className={styles.smallInput}
                placeholder="Detail"
              />
              <button className={styles.actionButton} onClick={() => handleAddItinerary(activeTrip.id)}>
                Add
              </button>
            </div>
            <ul className={styles.itineraryList}>
              {activeTrip.itinerary.map((item) => (
                <li key={item.id}>
                  <strong>{item.time}</strong> — {item.detail}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.drawerSection}>
            <h4>Segments</h4>
            <div className={styles.inlineRow}>
              <input
                value={drawerSegmentDraft.location}
                onChange={(e) => setDrawerSegmentDraft({ ...drawerSegmentDraft, location: e.target.value })}
                className={styles.smallInput}
                placeholder="Location"
              />
              <input
                value={drawerSegmentDraft.mode}
                onChange={(e) => setDrawerSegmentDraft({ ...drawerSegmentDraft, mode: e.target.value })}
                className={styles.smallInput}
                placeholder="Mode + carrier"
              />
              <input
                type="date"
                value={drawerSegmentDraft.startDate}
                onChange={(e) => setDrawerSegmentDraft({ ...drawerSegmentDraft, startDate: e.target.value })}
                className={styles.smallInput}
              />
              <input
                type="date"
                value={drawerSegmentDraft.endDate}
                onChange={(e) => setDrawerSegmentDraft({ ...drawerSegmentDraft, endDate: e.target.value })}
                className={styles.smallInput}
              />
              <input
                value={drawerSegmentDraft.notes}
                onChange={(e) => setDrawerSegmentDraft({ ...drawerSegmentDraft, notes: e.target.value })}
                className={styles.smallInput}
                placeholder="Notes"
              />
              <button className={styles.actionButton} onClick={() => handleAddSegment(activeTrip.id)}>
                Add
              </button>
            </div>
            {activeTrip.segments.map((segment) => (
              <div key={segment.id} className={styles.segmentRow}>
                <div>
                  <strong className={styles.segmentLocation}>{segment.location}</strong>
                  <span className={styles.segmentMode}>{segment.mode}</span>
                </div>
                <div className={styles.segmentDates}>{formatRange(segment.startDate, segment.endDate)}</div>
                {segment.notes && <p className={styles.segmentNotes}>{segment.notes}</p>}
              </div>
            ))}
          </div>
          <div className={styles.drawerSection}>
            <h4>Attachments</h4>
            <input type="file" multiple onChange={(e) => handleAttachmentUpload(activeTrip.id, e.target.files)} />
            <div className={styles.attachmentList}>
              {activeTrip.attachments.map((attachment) => (
                <div key={attachment.id} className={styles.attachmentItem}>
                  <span>{attachment.name}</span>
                  <button className={styles.linkButton} onClick={() => handleRemoveAttachment(activeTrip.id, attachment.id)}>
                    Remove
                  </button>
                  {attachment.type === 'image' && (
                    <img className={styles.attachmentPreview} src={attachment.url} alt={attachment.name} />
                  )}
                  {attachment.type === 'video' && (
                    <video className={styles.attachmentPreview} controls src={attachment.url} />
                  )}
                  {attachment.type === 'pdf' && <div className={styles.attachmentPreview}>PDF saved ({attachment.name})</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
