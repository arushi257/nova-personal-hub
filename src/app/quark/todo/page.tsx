'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Settings, LayoutGrid, List, Calendar, Moon, Sun } from 'lucide-react';
import styles from './page.module.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Task, subscribeTasks, updateTaskList } from '@/lib/quark/todoStore';

// Types (updated for 'list' view instead of 'table')
type ViewType = 'list' | 'board' | 'timeline';

// Default properties
interface PropertyDef {
    id: string;
    name: string;
    type: 'text' | 'number' | 'select' | 'multi-select' | 'status' | 'date' | 'checkbox' | 'url' | 'email';
    options?: string[];
}

const DEFAULT_PROPERTIES: PropertyDef[] = [
    { id: 'status', name: 'Status', type: 'status', options: ['To Do', 'In Progress', 'Done', 'Blocked'] },
    { id: 'department', name: 'Department', type: 'select', options: ['Design', 'Development', 'Marketing', 'Operations'] },
    { id: 'priority', name: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'] },
    { id: 'dueDate', name: 'Due Date', type: 'date' },
    { id: 'assignee', name: 'Assignee', type: 'text' },
];

// Helper to convert Date to local YYYY-MM-DD string (timezone-safe)
const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to parse local date string back to Date (at midnight local time)
const parseLocalDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    if (dateStr.includes('T')) {
        return new Date(dateStr);
    }
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

export default function TodoPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [properties, setProperties] = useState<PropertyDef[]>(DEFAULT_PROPERTIES);
    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<Task['timeFrame'] | 'all'>('all');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [sortByProperty, setSortByProperty] = useState<string>('');
    const [boardSortBy, setBoardSortBy] = useState<'status' | 'department' | 'priority'>('status');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [showPropertyManager, setShowPropertyManager] = useState(false);

    // Load theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('quark-todo-theme') as 'light' | 'dark';
        if (savedTheme) setTheme(savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('quark-todo-theme', newTheme);
    };
    useEffect(() => {
        const unsubscribe = subscribeTasks(setTasks);
        return unsubscribe;
    }, []);
    const [showAddPropertyForm, setShowAddPropertyForm] = useState(false);
    const [editingProperty, setEditingProperty] = useState<PropertyDef | null>(null);
    const [newPropertyData, setNewPropertyData] = useState({ name: '', type: 'text' as PropertyDef['type'], options: '' });
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);
    const [newNote, setNewNote] = useState('');
    const [timelineDate, setTimelineDate] = useState<Date>(new Date());

    useEffect(() => {
        const savedProps = localStorage.getItem('notion-properties');
        if (savedProps) {
            try {
                setProperties(JSON.parse(savedProps));
            } catch (e) {
                console.error('Error loading properties:', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('notion-properties', JSON.stringify(properties));
    }, [properties]);

    const addTask = (timeFrame: Task['timeFrame']) => {
        const newTask: Task = {
            id: Date.now().toString(),
            title: 'New Task',
            properties: { status: 'To Do' },
            timeFrame,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        updateTaskList((current) => [...current, newTask]);
    };

    const updateTask = (id: string, updates: Partial<Task>) => {
        updateTaskList((current) =>
            current.map((task) =>
                task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task,
            ),
        );
    };

    const addNoteToTask = (taskId: string, note: string) => {
        if (!note.trim()) return;

        const timestamp = new Date().toLocaleString();
        const noteWithTimestamp = `[${timestamp}] ${note}`;

        updateTaskList((current) =>
            current.map((task) => {
                if (task.id === taskId) {
                    const existingNotes = task.properties.notes || '';
                    const updatedNotes = existingNotes
                        ? `${existingNotes}\n${noteWithTimestamp}`
                        : noteWithTimestamp;

                    return {
                        ...task,
                        properties: {
                            ...task.properties,
                            notes: updatedNotes,
                        },
                        updatedAt: new Date().toISOString(),
                    };
                }
                return task;
            }),
        );

        setNewNote('');
    };

    const deleteTask = (id: string) => {
        updateTaskList((current) => current.filter((t) => t.id !== id));
    };

    const addProperty = () => {
        if (newPropertyData.name.trim()) {
            const newProp: PropertyDef = {
                id: Date.now().toString(),
                name: newPropertyData.name.trim(),
                type: newPropertyData.type,
                options: (newPropertyData.type === 'select' || newPropertyData.type === 'status')
                    ? newPropertyData.options.split(',').map(o => o.trim()).filter(o => o)
                    : undefined,
            };
            setProperties([...properties, newProp]);
            setNewPropertyData({ name: '', type: 'text', options: '' });
            setShowAddPropertyForm(false);
        }
    };

    const updateProperty = () => {
        if (editingProperty && newPropertyData.name.trim()) {
            const updatedProp: PropertyDef = {
                ...editingProperty,
                name: newPropertyData.name.trim(),
                type: newPropertyData.type,
                options: (newPropertyData.type === 'select' || newPropertyData.type === 'status')
                    ? newPropertyData.options.split(',').map(o => o.trim()).filter(o => o)
                    : undefined,
            };
            setProperties(properties.map(p => p.id === editingProperty.id ? updatedProp : p));
            setEditingProperty(null);
            setNewPropertyData({ name: '', type: 'text', options: '' });
        }
    };

    const startEditProperty = (prop: PropertyDef) => {
        setEditingProperty(prop);
        setNewPropertyData({
            name: prop.name,
            type: prop.type,
            options: prop.options?.join(', ') || '',
        });
    };

    const deleteProperty = (propId: string) => {
        if (confirm('Delete this property? This will remove it from all tasks. This action cannot be undone.')) {
            setProperties(properties.filter(p => p.id !== propId));
            updateTaskList((current) =>
                current.map((t) => {
                    const newProps = { ...t.properties };
                    delete newProps[propId];
                    return { ...t, properties: newProps };
                }),
            );
        }
    };

    const filteredTasks = (() => {
        let result = tasks;

        // Filter by timeframe
        if (selectedTimeFrame !== 'all') {
            result = result.filter(t => t.timeFrame === selectedTimeFrame);
        }

        // Filter by department
        if (selectedDepartment !== 'all') {
            result = result.filter(t => t.properties.department === selectedDepartment);
        }

        // Sort by property
        if (sortByProperty) {
            result = [...result].sort((a, b) => {
                const aVal = a.properties[sortByProperty];
                const bVal = b.properties[sortByProperty];

                if (!aVal && !bVal) return 0;
                if (!aVal) return 1;
                if (!bVal) return -1;

                // Handle different types
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return aVal.localeCompare(bVal);
                }
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return aVal - bVal;
                }
                return String(aVal).localeCompare(String(bVal));
            });
        }

        return result;
    })();

    const departmentOptions = Array.from(
        new Set(tasks.map(t => t.properties.department).filter(Boolean))
    ) as string[];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'To Do': return '#5E6AD2';
            case 'In Progress': return '#FFA344';
            case 'Done': return '#26B5CE';
            case 'Blocked': return '#FF6F6F';
            default: return '#999';
        }
    };

    return (
        <div className={`${styles.container} ${styles[theme]}`}>
            {/* Time Stacks */}
            <div className={styles.timeStacks}>
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(timeFrame => (
                    <div key={timeFrame} className={styles.timeStack}>
                        <div className={styles.stackHeader}>
                            <h3>{timeFrame.toUpperCase()}</h3>
                            <button className={styles.addStackTask} onClick={() => addTask(timeFrame)}>
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className={styles.stackCards}>
                            {filteredTasks.filter(task => task.timeFrame === timeFrame).map(task => (
                                <div
                                    key={task.id}
                                    className={styles.stackCard}
                                    onClick={() => setViewingTask(task)}
                                >
                                    <div className={styles.stackCardTitle}>{task.title}</div>
                                    {task.properties.status && (
                                        <span
                                            className={styles.stackCardStatus}
                                            data-status={task.properties.status}
                                        >
                                            {task.properties.status}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* View Switcher */}
            <div className={styles.viewSwitcher}>
                <div className={styles.viewTabs}>
                    <button
                        className={`${styles.viewTab} ${currentView === 'list' ? styles.activeTab : ''}`}
                        onClick={() => setCurrentView('list')}
                    >
                        <List size={18} />
                        List
                    </button>
                    <button
                        className={`${styles.viewTab} ${currentView === 'board' ? styles.activeTab : ''}`}
                        onClick={() => setCurrentView('board')}
                    >
                        <LayoutGrid size={18} />
                        Board
                    </button>
                    <button
                        className={`${styles.viewTab} ${currentView === 'timeline' ? styles.activeTab : ''}`}
                        onClick={() => setCurrentView('timeline')}
                    >
                        <Calendar size={18} />
                        Timeline
                    </button>
                </div>
                <div className={styles.viewActions}>
                    <select
                        className={styles.filterSelect}
                        value={selectedTimeFrame}
                        onChange={(e) => setSelectedTimeFrame(e.target.value as any)}
                    >
                        <option value="all">All Timeframes</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>

                    <select
                        className={styles.filterSelect}
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        <option value="all">All Departments</option>
                        {departmentOptions.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>

                    {currentView === 'board' && (
                        <select
                            value={boardSortBy}
                            onChange={(e) => setBoardSortBy(e.target.value as 'status' | 'department' | 'priority')}
                            className={styles.filterSelect}
                        >
                            <option value="status">Sort by Status</option>
                            <option value="department">Sort by Department</option>
                            <option value="priority">Sort by Priority</option>
                        </select>
                    )}

                    <select
                        className={styles.filterSelect}
                        value={sortByProperty}
                        onChange={(e) => setSortByProperty(e.target.value)}
                    >
                        <option value="">Sort by...</option>
                        {properties.map(prop => (
                            <option key={prop.id} value={prop.id}>{prop.name}</option>
                        ))}
                    </select>

                    <button className={styles.settingsBtn} onClick={() => setShowPropertyManager(!showPropertyManager)}>
                        <Settings size={18} />
                    </button>
                </div>
            </div >

            {/* List View */}
            {
                currentView === 'list' && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    {properties.map(prop => (
                                        <th key={prop.id}>{prop.name}</th>
                                    ))}
                                    <th className={styles.actionsHeader}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map(task => (
                                    <tr key={task.id}>
                                        <td>
                                            <input
                                                type="text"
                                                value={task.title}
                                                onChange={(e) => updateTask(task.id, { title: e.target.value })}
                                                className={styles.taskTitleInput}
                                            />
                                        </td>
                                        {properties.map(prop => (
                                            <td key={prop.id}>
                                                {prop.type === 'text' && (
                                                    <input
                                                        type="text"
                                                        value={task.properties[prop.id] || ''}
                                                        onChange={(e) => updateTask(task.id, {
                                                            properties: { ...task.properties, [prop.id]: e.target.value }
                                                        })}
                                                        className={styles.cellInput}
                                                    />
                                                )}
                                                {prop.type === 'select' && (
                                                    <select
                                                        value={task.properties[prop.id] || ''}
                                                        onChange={(e) => updateTask(task.id, {
                                                            properties: { ...task.properties, [prop.id]: e.target.value }
                                                        })}
                                                        className={styles.cellSelect}
                                                    >
                                                        <option value="">-</option>
                                                        {prop.options?.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                {prop.type === 'status' && (
                                                    <select
                                                        value={task.properties[prop.id] || ''}
                                                        onChange={(e) => updateTask(task.id, {
                                                            properties: { ...task.properties, [prop.id]: e.target.value }
                                                        })}
                                                        className={styles.cellSelect}
                                                        data-status={task.properties[prop.id] || 'To Do'}
                                                    >
                                                        <option value="">-</option>
                                                        {prop.options?.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                {prop.type === 'date' && (
                                                    <DatePicker
                                                        selected={task.properties[prop.id] ? parseLocalDate(task.properties[prop.id]) : null}
                                                        onChange={(date) => updateTask(task.id, {
                                                            properties: { ...task.properties, [prop.id]: date ? toLocalDateString(date) : null }
                                                        })}
                                                        className={styles.cellDate}
                                                        dateFormat="MMM d, yyyy"
                                                    />
                                                )}
                                                {prop.type === 'checkbox' && (
                                                    <input
                                                        type="checkbox"
                                                        checked={task.properties[prop.id] || false}
                                                        onChange={(e) => updateTask(task.id, {
                                                            properties: { ...task.properties, [prop.id]: e.target.checked }
                                                        })}
                                                        className={styles.cellCheckbox}
                                                    />
                                                )}
                                            </td>
                                        ))}
                                        <td>
                                            <button onClick={() => deleteTask(task.id)} className={styles.deleteBtn}>
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                <tr className={styles.addRow}>
                                    <td colSpan={properties.length + 2}>
                                        <button onClick={() => addTask('daily')} className={styles.addTaskBtn}>
                                            <Plus size={16} /> Add Task
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )
            }

            {/* Board View (Simplified) */}
            {
                currentView === 'board' && (
                    <div className={styles.boardContainer}>
                        {(() => {
                            let columns: { [key: string]: Task[] } = {};

                            // Group tasks by selected sort criteria
                            if (boardSortBy === 'status') {
                                const statuses = ['To Do', 'In Progress', 'Done', 'Blocked'];
                                statuses.forEach(status => {
                                    columns[status] = filteredTasks.filter(t => t.properties.status === status);
                                });
                            } else if (boardSortBy === 'department') {
                                const departments = Array.from(new Set(filteredTasks.map(t => t.properties.department).filter(Boolean))) as string[];
                                departments.forEach(dept => {
                                    columns[dept] = filteredTasks.filter(t => t.properties.department === dept);
                                });
                                // Add "No Department" column
                                columns['No Department'] = filteredTasks.filter(t => !t.properties.department);
                            } else if (boardSortBy === 'priority') {
                                const priorities = ['High', 'Medium', 'Low'];
                                priorities.forEach(priority => {
                                    columns[priority] = filteredTasks.filter(t => t.properties.priority === priority);
                                });
                                // Add "No Priority" column
                                columns['No Priority'] = filteredTasks.filter(t => !t.properties.priority);
                            }

                            return Object.entries(columns).map(([columnName, columnTasks]) => (
                                <div key={columnName} className={styles.boardColumn}>
                                    <div className={styles.columnHeader}>
                                        <h3>{columnName}</h3>
                                        <span className={styles.columnCount}>{columnTasks.length}</span>
                                    </div>
                                    <div className={styles.columnCards}>
                                        {columnTasks.map(task => (
                                            <div
                                                key={task.id}
                                                className={styles.boardCard}
                                                onClick={() => setEditingTask(task)}
                                            >
                                                <div className={styles.cardTitle}>{task.title}</div>
                                                {task.properties.department && (
                                                    <div className={styles.cardMeta}>📁 {task.properties.department}</div>
                                                )}
                                                {task.properties.assignee && (
                                                    <div className={styles.cardMeta}>👤 {task.properties.assignee}</div>
                                                )}
                                                {task.properties.dueDate && (
                                                    <div className={styles.cardDue}>
                                                        📅 {new Date(task.properties.dueDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )
            }

            {/* Timeline/Calendar View */}
            {
                currentView === 'timeline' && (
                    <div className={styles.timelineContainer}>
                        <div className={styles.timelineHeader}>
                            <h2>Timeline View</h2>
                            <DatePicker
                                selected={timelineDate}
                                onChange={(date) => date && setTimelineDate(date)}
                                inline
                                className={styles.timelineCalendar}
                            />
                        </div>
                        <div className={styles.timelineContent}>
                            {(() => {
                                // Filter tasks for selected date's month
                                const selectedMonth = timelineDate.getMonth();
                                const selectedYear = timelineDate.getFullYear();
                                
                                const tasksInMonth = filteredTasks
                                    .filter(t => {
                                        if (!t.properties.dueDate) return false;
                                        const taskDate = parseLocalDate(t.properties.dueDate);
                                        if (!taskDate) return false;
                                        return taskDate.getMonth() === selectedMonth && taskDate.getFullYear() === selectedYear;
                                    })
                                    .sort((a, b) => {
                                        const dateA = parseLocalDate(a.properties.dueDate);
                                        const dateB = parseLocalDate(b.properties.dueDate);
                                        if (!dateA) return 1;
                                        if (!dateB) return -1;
                                        return dateA.getTime() - dateB.getTime();
                                    });

                                if (tasksInMonth.length === 0) {
                                    return (
                                        <div className={styles.emptyTimeline}>
                                            No tasks scheduled for {timelineDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </div>
                                    );
                                }

                                return (
                                    <div className={styles.timelineSection}>
                                        <h3 className={styles.timelineSectionTitle}>
                                            {timelineDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </h3>
                                        <div className={styles.timelineTasks}>
                                            {tasksInMonth.map(task => {
                                                const taskDate = parseLocalDate(task.properties.dueDate);
                                                return (
                                                    <div key={task.id} className={styles.timelineTask}>
                                                        <div className={styles.timelineTaskDate}>
                                                            {taskDate
                                                                ? taskDate.toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })
                                                                : 'No date'
                                                            }
                                                        </div>
                                                        <div
                                                            className={styles.timelineTaskBar}
                                                            data-status={task.properties.status || 'To Do'}
                                                            onClick={() => setEditingTask(task)}
                                                        >
                                                            <div className={styles.timelineTaskTitle}>{task.title}</div>
                                                            <div className={styles.timelineTaskMeta}>
                                                                {task.properties.department && (
                                                                    <span className={styles.timelineTaskDept}>{task.properties.department}</span>
                                                                )}
                                                                {task.properties.assignee && (
                                                                    <span className={styles.timelineTaskAssignee}>{task.properties.assignee}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )
            }

            {/* Property Manager Modal */}
            {
                showPropertyManager && (
                    <div className={styles.modalOverlay} onClick={() => setShowPropertyManager(false)}>
                        <div className={styles.propertyModal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>Manage Properties</h2>
                                <button onClick={() => setShowPropertyManager(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className={styles.propertyList}>
                                {properties.map(prop => (
                                    <div key={prop.id} className={styles.propertyItem}>
                                        <div className={styles.propertyInfo}>
                                            <span className={styles.propertyName}>{prop.name}</span>
                                            <span className={styles.propertyType}>{prop.type}</span>
                                        </div>
                                        <div className={styles.propertyActions}>
                                            <button
                                                onClick={() => startEditProperty(prop)}
                                                className={styles.editPropertyBtn}
                                                title="Edit property"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteProperty(prop.id)}
                                                className={styles.deletePropertyBtn}
                                                title="Delete property"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowAddPropertyForm(true)} className={styles.addPropertyBtn}>
                                <Plus size={16} /> Add Property
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Task Detail Modal */}
            {viewingTask && (
                <div className={styles.modalOverlay} onClick={() => setViewingTask(null)}>
                    <div className={styles.taskDetailModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.detailHeader}>
                            <h2 className={styles.detailTitle}>{viewingTask.title}</h2>
                            <button onClick={() => setViewingTask(null)} className={styles.closeBtn}>✕</button>
                        </div>

                        <div className={styles.detailContent}>
                            <div className={styles.detailSection}>
                                <h3 className={styles.sectionTitle}>Details</h3>
                                <div className={styles.detailGrid}>
                                    {viewingTask.properties.status && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Status</span>
                                            <span className={styles.detailValue} data-status={viewingTask.properties.status}>
                                                {viewingTask.properties.status}
                                            </span>
                                        </div>
                                    )}
                                    {viewingTask.properties.dueDate && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Due Date</span>
                                            <span className={styles.detailValue}>
                                                {new Date(viewingTask.properties.dueDate).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {viewingTask.properties.duration && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Duration</span>
                                            <span className={styles.detailValue}>{viewingTask.properties.duration}</span>
                                        </div>
                                    )}
                                    {viewingTask.properties.location && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Location</span>
                                            <span className={styles.detailValue}>📍 {viewingTask.properties.location}</span>
                                        </div>
                                    )}
                                    {viewingTask.properties.department && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Department</span>
                                            <span className={styles.detailValue}>{viewingTask.properties.department}</span>
                                        </div>
                                    )}
                                    {viewingTask.properties.priority && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Priority</span>
                                            <span className={styles.detailValue}>{viewingTask.properties.priority}</span>
                                        </div>
                                    )}
                                    {viewingTask.properties.assignee && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Assignee</span>
                                            <span className={styles.detailValue}>👤 {viewingTask.properties.assignee}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {viewingTask.properties.description && (
                                <div className={styles.detailSection}>
                                    <h3 className={styles.sectionTitle}>Description</h3>
                                    <p className={styles.descriptionText}>{viewingTask.properties.description}</p>
                                </div>
                            )}

                            <div className={styles.detailSection}>
                                <h3 className={styles.sectionTitle}>Notes</h3>
                                {viewingTask.properties.notes && (
                                    <div className={styles.notesDisplay}>
                                        {viewingTask.properties.notes.split('\n').map((note: string, idx: number) => (
                                            <div key={idx} className={styles.noteItem}>{note}</div>
                                        ))}
                                    </div>
                                )}
                                <div className={styles.addNoteSection}>
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Add a note..."
                                        className={styles.noteInput}
                                        rows={3}
                                    />
                                    <button
                                        onClick={() => {
                                            if (!newNote.trim()) return;
                                            const timestamp = new Date().toLocaleString();
                                            const noteWithTimestamp = `[${timestamp}] ${newNote}`;
                                            const existingNotes = viewingTask.properties.notes || '';
                                            const updatedNotes = existingNotes
                                                ? `${existingNotes}\n${noteWithTimestamp}`
                                                : noteWithTimestamp;

                                            const updatedTask = {
                                                ...viewingTask,
                                                properties: { ...viewingTask.properties, notes: updatedNotes },
                                                updatedAt: new Date().toISOString(),
                                            };

                                            updateTaskList((current) =>
                                                current.map((task) =>
                                                    task.id === viewingTask.id ? updatedTask : task,
                                                ),
                                            );
                                            setViewingTask(updatedTask);
                                            setNewNote('');
                                        }}
                                        className={styles.addNoteBtn}
                                        disabled={!newNote.trim()}
                                    >
                                        Add Note
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setEditingTask(viewingTask);
                                    setViewingTask(null);
                                }}
                                className={styles.editTaskBtn}
                            >
                                Edit Task
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Property Form Modal */}
            {
                (showAddPropertyForm || editingProperty) && (
                    <div className={styles.modalOverlay} onClick={() => {
                        setShowAddPropertyForm(false);
                        setEditingProperty(null);
                        setNewPropertyData({ name: '', type: 'text', options: '' });
                    }}>
                        <div className={styles.propertyModal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>{editingProperty ? 'Edit Property' : 'Add New Property'}</h2>
                                <button onClick={() => {
                                    setShowAddPropertyForm(false);
                                    setEditingProperty(null);
                                    setNewPropertyData({ name: '', type: 'text', options: '' });
                                }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Property Name</label>
                                <input
                                    type="text"
                                    value={newPropertyData.name}
                                    onChange={(e) => setNewPropertyData({ ...newPropertyData, name: e.target.value })}
                                    placeholder="e.g., Tags, Priority, Assignee"
                                    className={styles.formInput}
                                    autoFocus
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Property Type</label>
                                <select
                                    value={newPropertyData.type}
                                    onChange={(e) => setNewPropertyData({ ...newPropertyData, type: e.target.value as PropertyDef['type'] })}
                                    className={styles.formInput}
                                >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="select">Select (dropdown)</option>
                                    <option value="multi-select">Multi-select</option>
                                    <option value="status">Status</option>
                                    <option value="date">Date</option>
                                    <option value="checkbox">Checkbox</option>
                                    <option value="url">URL</option>
                                    <option value="email">Email</option>
                                </select>
                            </div>

                            {(newPropertyData.type === 'select' || newPropertyData.type === 'multi-select' || newPropertyData.type === 'status') && (
                                <div className={styles.formGroup}>
                                    <label>Options (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={newPropertyData.options}
                                        onChange={(e) => setNewPropertyData({ ...newPropertyData, options: e.target.value })}
                                        placeholder="e.g., Option 1, Option 2, Option 3"
                                        className={styles.formInput}
                                    />
                                    <small className={styles.formHint}>Separate options with commas</small>
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                <button
                                    onClick={() => editingProperty ? updateProperty() : addProperty()}
                                    className={styles.submitButton}
                                >
                                    {editingProperty ? 'Update Property' : 'Add Property'}
                                </button>
                                <button onClick={() => {
                                    setShowAddPropertyForm(false);
                                    setEditingProperty(null);
                                    setNewPropertyData({ name: '', type: 'text', options: '' });
                                }} className={styles.cancelButton}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
