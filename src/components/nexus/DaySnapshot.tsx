'use client';

 import { useEffect, useState } from 'react';
 import { CheckCircle2 } from 'lucide-react';
 import { Task, subscribeTasks, updateTaskList } from '@/lib/quark/todoStore';

 export default function DaySnapshot() {
   const [dailyTasks, setDailyTasks] = useState<Task[]>([]);

   useEffect(() => {
     const refresh = (tasks: Task[]) => {
       setDailyTasks(tasks.filter((task) => task.timeFrame === 'daily'));
     };
     const unsubscribe = subscribeTasks(refresh);
     return unsubscribe;
   }, []);

   const toggleCompletion = (task: Task) => {
     const completed = task.properties.status === 'Done';
     updateTaskList((tasks) =>
       tasks.map((candidate) =>
         candidate.id === task.id
           ? {
               ...candidate,
               properties: {
                 ...candidate.properties,
                 status: completed ? 'To Do' : 'Done',
               },
               updatedAt: new Date().toISOString(),
             }
           : candidate,
       ),
     );
   };

   return (
     <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
       <h3
         style={{
           fontSize: '1.5rem',
           marginBottom: '1rem',
           color: 'var(--color-nexus-accent)',
         }}
       >
         Day Snapshot
       </h3>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
         {dailyTasks.length === 0 && (
           <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No daily tasks yet.</p>
         )}
         {dailyTasks.map((task) => {
           const isDone = task.properties.status === 'Done';
           return (
             <label
               key={task.id}
               style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.75rem',
                 cursor: 'pointer',
                 color: 'var(--text-primary)',
               }}
             >
               <input
                 type="checkbox"
                 checked={isDone}
                 onChange={() => toggleCompletion(task)}
                 style={{ width: '18px', height: '18px' }}
               />
               <span
                 style={{
                   textDecoration: isDone ? 'line-through' : 'none',
                   fontWeight: 500,
                 }}
               >
                 {task.title}
               </span>
               <CheckCircle2
                 size={18}
                 color={isDone ? 'var(--color-nexus-accent-2)' : 'var(--text-muted)'}
                 style={{ marginLeft: 'auto' }}
               />
             </label>
           );
         })}
       </div>
     </div>
   );
 }
