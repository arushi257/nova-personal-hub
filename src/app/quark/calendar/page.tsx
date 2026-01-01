'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Edit3 } from 'lucide-react';
import styles from './page.module.css';

interface Task {
    id: string;
    title: string;
    timeFrame: 'daily' | 'weekly' | 'monthly' | 'yearly';
    properties: {
        status?: string;
        department?: string;
        dueDate?: string;
        assignee?: string;
        duration?: string;
        description?: string;
        location?: string;
        startTime?: string; // HH:mm format
        endTime?: string;   // HH:mm format
        [key: string]: any;
    };
    createdAt?: string;
    updatedAt?: string;
}

type ViewType = 'yearly' | 'monthly' | 'daily';

// Helper to convert Date to local YYYY-MM-DD string (timezone-safe)
const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to parse date strings (handles both ISO and local formats)
const parseLocalDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    if (dateStr.includes('T')) {
        return new Date(dateStr);
    }
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

// Check if two dates are the same day (timezone-safe)
const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

export default function CalendarPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [view, setView] = useState<ViewType>('monthly');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showAddEventModal, setShowAddEventModal] = useState(false);

    // Event form state
    const [eventTitle, setEventTitle] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventStartTime, setEventStartTime] = useState('09:00');
    const [eventEndTime, setEventEndTime] = useState('10:00');
    const [eventDescription, setEventDescription] = useState('');
    const [eventLocation, setEventLocation] = useState('');

    useEffect(() => {
        // Load tasks from the same localStorage as To-Do page
        const loadTasks = () => {
            const stored = localStorage.getItem('notion-tasks'); // Match To-Do key
            if (stored) {
                try {
                    const parsedTasks = JSON.parse(stored);
                    setTasks(parsedTasks);
                    console.log('Calendar loaded tasks:', parsedTasks.length);
                } catch (e) {
                    console.error('Error loading tasks in calendar:', e);
                }
            }
        };

        loadTasks();

        // Listen for month click from year view
        const handleSwitchToMonth = () => setView('monthly');
        const handleSwitchToDay = () => setView('daily');

        window.addEventListener('switchToMonthView', handleSwitchToMonth);
        window.addEventListener('switchToDayView', handleSwitchToDay);

        // Reload tasks when localStorage changes (from other tabs/pages)
        window.addEventListener('storage', loadTasks);

        // Custom event for same-page updates
        const handleTasksUpdated = () => loadTasks();
        window.addEventListener('tasksUpdated', handleTasksUpdated);

        return () => {
            window.removeEventListener('switchToMonthView', handleSwitchToMonth);
            window.removeEventListener('switchToDayView', handleSwitchToDay);
            window.removeEventListener('storage', loadTasks);
            window.removeEventListener('tasksUpdated', handleTasksUpdated);
        };
    }, []);

    const getTasksForDate = (date: Date) => {
        return tasks.filter(task => {
            if (!task.properties.dueDate) return false;
            const taskDate = parseLocalDate(task.properties.dueDate);
            if (!taskDate) return false;
            return isSameDay(taskDate, date);
        });
    };

    const getTasksForMonth = (year: number, month: number) => {
        return tasks.filter(task => {
            if (!task.properties.dueDate) return false;
            const taskDate = parseLocalDate(task.properties.dueDate);
            if (!taskDate) return false;
            return taskDate.getFullYear() === year && taskDate.getMonth() === month;
        });
    };

    const deleteEvent = (taskId: string) => {
        if (!confirm('Delete this event?')) return;
        const updatedTasks = tasks.filter(t => t.id !== taskId);
        setTasks(updatedTasks);
        localStorage.setItem('notion-tasks', JSON.stringify(updatedTasks));
        window.dispatchEvent(new Event('tasksUpdated'));
    };

    const handleAddEvent = () => {
        if (!eventTitle.trim() || !eventDate) return;

        // Parse times
        const [startHours, startMinutes] = eventStartTime.split(':').map(Number);
        const [endHours, endMinutes] = eventEndTime.split(':').map(Number);

        // Validate: end time must be after start time
        const startTotalMins = startHours * 60 + startMinutes;
        const endTotalMins = endHours * 60 + endMinutes;
        
        if (endTotalMins <= startTotalMins) {
            alert('End time must be after start time');
            return;
        }

        // Calculate duration
        const durationMins = endTotalMins - startTotalMins;
        const durationStr = durationMins >= 60
            ? `${Math.floor(durationMins / 60)}h${durationMins % 60 > 0 ? ` ${durationMins % 60}m` : ''}`
            : `${durationMins}m`;

        // Store date as local YYYY-MM-DD, times separately
        const newEvent: Task = {
            id: Date.now().toString(),
            title: eventTitle,
            timeFrame: 'daily',
            properties: {
                status: 'To Do',
                dueDate: eventDate, // Already in YYYY-MM-DD format from input
                startTime: eventStartTime,
                endTime: eventEndTime,
                duration: durationStr,
                description: eventDescription,
                location: eventLocation,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const updatedTasks = [...tasks, newEvent];
        setTasks(updatedTasks);
        localStorage.setItem('notion-tasks', JSON.stringify(updatedTasks));

        // Dispatch event to update calendar if opened in another view
        window.dispatchEvent(new Event('tasksUpdated'));

        // Clear form and close modal
        setEventTitle('');
        setEventDate('');
        setEventStartTime('09:00');
        setEventEndTime('10:00');
        setEventDescription('');
        setEventLocation('');
        setShowAddEventModal(false);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isOverdue = (date: Date) => {
        return date < new Date() && !isToday(date);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>📅 Calendar</h1>

                <div className={styles.viewSwitcher}>
                    <button
                        className={`${styles.viewBtn} ${view === 'yearly' ? styles.active : ''}`}
                        onClick={() => setView('yearly')}
                    >
                        Year
                    </button>
                    <button
                        className={`${styles.viewBtn} ${view === 'monthly' ? styles.active : ''}`}
                        onClick={() => setView('monthly')}
                    >
                        Month
                    </button>
                    <button
                        className={`${styles.viewBtn} ${view === 'daily' ? styles.active : ''}`}
                        onClick={() => setView('daily')}
                    >
                        Day
                    </button>
                    <button
                        className={styles.addTaskBtn}
                        onClick={() => {
                            const dateToUse = selectedDate || currentDate;
                            setSelectedDate(dateToUse);
                            setEventDate(dateToUse.toISOString().split('T')[0]);
                            setShowAddEventModal(true);
                        }}
                    >
                        + Add Event
                    </button>
                </div>
            </div>

            {view === 'monthly' && (
                <MonthView
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    getTasksForDate={getTasksForDate}
                    isToday={isToday}
                    isOverdue={isOverdue}
                    onDateClick={setSelectedDate}
                />
            )}

            {view === 'yearly' && (
                <YearView
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    getTasksForMonth={getTasksForMonth}
                    tasks={tasks}
                />
            )}

            {view === 'daily' && (
                <DayView
                    selectedDate={selectedDate || currentDate}
                    setSelectedDate={setSelectedDate}
                    getTasksForDate={getTasksForDate}
                    onDeleteEvent={deleteEvent}
                />
            )}

            {/* Add Event Modal */}
            {showAddEventModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAddEventModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Create Event</h2>
                        <p className={styles.modalSubtitle}>
                            Add a new event to your calendar
                        </p>

                        <div className={styles.formGroup}>
                            <label>Event Name *</label>
                            <input
                                type="text"
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                                placeholder="Team meeting, Lunch with client..."
                                className={styles.input}
                                autoFocus
                            />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Date *</label>
                                <input
                                    type="date"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Start Time *</label>
                                <input
                                    type="time"
                                    value={eventStartTime}
                                    onChange={(e) => setEventStartTime(e.target.value)}
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>End Time *</label>
                                <input
                                    type="time"
                                    value={eventEndTime}
                                    onChange={(e) => setEventEndTime(e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Location</label>
                            <input
                                type="text"
                                value={eventLocation}
                                onChange={(e) => setEventLocation(e.target.value)}
                                placeholder="Conference Room A, Zoom link..."
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                value={eventDescription}
                                onChange={(e) => setEventDescription(e.target.value)}
                                placeholder="Add notes, agenda, participants..."
                                className={styles.textarea}
                                rows={3}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button onClick={() => setShowAddEventModal(false)} className={styles.cancelBtn}>
                                Cancel
                            </button>
                            <button
                                onClick={handleAddEvent}
                                className={styles.submitBtn}
                                disabled={!eventTitle.trim() || !eventDate}
                            >
                                Create Event
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Month View Component
function MonthView({ currentDate, setCurrentDate, getTasksForDate, isToday, isOverdue, onDateClick }: any) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1));

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className={styles.emptyDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayTasks = getTasksForDate(date);
        const today = isToday(date);
        const overdue = isOverdue(date) && dayTasks.length > 0;

        days.push(
            <div
                key={day}
                className={`${styles.day} ${today ? styles.today : ''} ${overdue ? styles.overdue : ''}`}
                onClick={() => {
                    onDateClick(date);
                    // Switch to day view
                    const event = new CustomEvent('switchToDayView');
                    window.dispatchEvent(event);
                }}
            >
                <div className={styles.dayNumber}>{day}</div>
                {dayTasks.length > 0 && (
                    <div className={styles.taskIndicator}>
                        <span className={styles.taskCount}>{dayTasks.length}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={styles.monthView}>
            <div className={styles.navigation}>
                <button onClick={prevMonth} className={styles.navBtn}>
                    <ChevronLeft size={20} />
                </button>
                <h2 className={styles.monthTitle}>{monthNames[month]} {year}</h2>
                <button onClick={nextMonth} className={styles.navBtn}>
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className={styles.weekdays}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className={styles.weekday}>{day}</div>
                ))}
            </div>

            <div className={styles.daysGrid}>
                {days}
            </div>
        </div>
    );
}

// Year View Component with Interactive Months
function YearView({ currentDate, setCurrentDate, getTasksForMonth, tasks }: any) {
    const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
    const year = currentDate.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const prevYear = () => setCurrentDate(new Date(year - 1, 0));
    const nextYear = () => setCurrentDate(new Date(year + 1, 0));

    const handleMonthClick = (monthIndex: number) => {
        setCurrentDate(new Date(year, monthIndex, 1));
        // Automatically switch to month view
        const event = new CustomEvent('switchToMonthView');
        window.dispatchEvent(event);
    };

    // Generate mini calendar for month
    const renderMiniMonth = (monthIndex: number) => {
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const firstDay = new Date(year, monthIndex, 1).getDay();
        const days = [];

        // Empty cells for alignment
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className={styles.miniDay} />);
        }

        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(
                <div key={day} className={styles.miniDay}>{day}</div>
            );
        }

        return days;
    };

    return (
        <div className={styles.yearView}>
            <div className={styles.navigation}>
                <button onClick={prevYear} className={styles.navBtn}>
                    <ChevronLeft size={20} />
                </button>
                <h2 className={styles.yearTitle}>{year}</h2>
                <button onClick={nextYear} className={styles.navBtn}>
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className={styles.yearGrid}>
                {monthNames.map((monthName, idx) => {
                    const monthTasks = getTasksForMonth(year, idx);
                    return (
                        <div
                            key={idx}
                            className={styles.monthCard}
                            onClick={() => handleMonthClick(idx)}
                            onMouseEnter={() => setHoveredMonth(idx)}
                            onMouseLeave={() => setHoveredMonth(null)}
                        >
                            <div className={styles.monthName}>{monthName}</div>
                            <div className={styles.monthGrid}>
                                {renderMiniMonth(idx)}
                            </div>
                            {monthTasks.length > 0 && (
                                <div className={styles.monthTaskBadge}>
                                    {monthTasks.length}
                                </div>
                            )}

                            {/* Hover Preview */}
                            {hoveredMonth === idx && (
                                <div className={styles.monthPreview}>
                                    <div className={styles.previewHeader}>{monthNames[idx]} {year}</div>
                                    <div className={styles.previewWeekdays}>
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                            <div key={i}>{d}</div>
                                        ))}
                                    </div>
                                    <div className={styles.previewGrid}>
                                        {renderMiniMonth(idx)}
                                    </div>
                                    <div className={styles.previewFooter}>
                                        Click to view full month
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Day View Component with Hourly Timeline
function DayView({ selectedDate, setSelectedDate, getTasksForDate, onDeleteEvent }: any) {
    const dayTasks = getTasksForDate(selectedDate);
    const formattedDate = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const prevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    };

    const nextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
    };

    // Generate hours 6 AM - 11 PM (more practical range)
    const hours = Array.from({ length: 18 }, (_, i) => i + 6);

    // Group tasks by their start hour
    const getTasksForHour = (hour: number) => {
        return dayTasks.filter((task: Task) => {
            // Use startTime if available, otherwise fall back to legacy behavior
            if (task.properties.startTime) {
                const [taskHour] = task.properties.startTime.split(':').map(Number);
                return taskHour === hour;
            }
            // Legacy: check if dueDate has time info
            if (task.properties.dueDate && task.properties.dueDate.includes('T')) {
                const taskDate = new Date(task.properties.dueDate);
                return taskDate.getHours() === hour;
            }
            // No time info - show at 9 AM by default
            return hour === 9;
        });
    };

    const formatHour = (hour: number) => {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:00 ${ampm}`;
    };

    const formatTimeRange = (task: Task) => {
        if (task.properties.startTime && task.properties.endTime) {
            return `${task.properties.startTime} - ${task.properties.endTime}`;
        }
        if (task.properties.dueDate && task.properties.dueDate.includes('T')) {
            const date = new Date(task.properties.dueDate);
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return '';
    };

    return (
        <div className={styles.dayView}>
            <div className={styles.navigation}>
                <button onClick={prevDay} className={styles.navBtn}>
                    <ChevronLeft size={20} />
                </button>
                <h2 className={styles.dayTitle}>{formattedDate}</h2>
                <button onClick={nextDay} className={styles.navBtn}>
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className={styles.timeline}>
                {hours.map(hour => {
                    const hourTasks = getTasksForHour(hour);
                    return (
                        <div key={hour} className={styles.timeSlot}>
                            <div className={styles.timeLabel}>
                                {formatHour(hour)}
                            </div>
                            <div className={styles.timeContent}>
                                {hourTasks.length > 0 ? (
                                    hourTasks.map((task: Task) => (
                                        <div key={task.id} className={styles.timelineTaskCard}>
                                            <div className={styles.taskHeader}>
                                                <div className={styles.taskTitle}>{task.title}</div>
                                                <button 
                                                    className={styles.deleteEventBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteEvent(task.id);
                                                    }}
                                                    title="Delete event"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className={styles.taskTime}>
                                                {formatTimeRange(task)}
                                                {task.properties.duration && ` (${task.properties.duration})`}
                                            </div>
                                            {task.properties.location && (
                                                <div className={styles.taskLocation}>📍 {task.properties.location}</div>
                                            )}
                                            <div className={styles.taskMeta}>
                                                {task.properties.status && (
                                                    <span className={styles.taskStatus} data-status={task.properties.status}>
                                                        {task.properties.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.emptySlot} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
