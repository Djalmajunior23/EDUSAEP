import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, BookOpen, CheckSquare, AlertCircle } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { CalendarEvent, Activity } from '../../types/edusaep.types';

export function CalendarView({ userProfile }: { userProfile: any }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [userProfile.uid, currentDate.getMonth(), currentDate.getFullYear()]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const allEvents: CalendarEvent[] = [];

      // Fetch Activities
      let actQuery;
      if (userProfile.role === 'aluno') {
        actQuery = query(collection(db, 'activities'), where('status', '==', 'active'));
      } else {
        actQuery = query(collection(db, 'activities'), where('createdBy', '==', userProfile.uid));
      }
      
      const actSnap = await getDocs(actQuery);
      actSnap.docs.forEach(doc => {
        const data = doc.data() as Activity;
        if (data.dueDate) {
          allEvents.push({
            id: doc.id,
            title: data.title,
            date: data.dueDate,
            type: 'activity',
            description: `Atividade valendo ${data.points} pts`
          });
        }
      });

      // Fetch Exams (Simulados)
      // For simplicity, fetching all exams. In a real app, filter by assigned exams or createdBy.
      const examSnap = await getDocs(collection(db, 'exams'));
      examSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
          // Using createdAt as a proxy for date if no specific date exists, or if there's a scheduledDate use that.
          // Assuming exams might not have a strict date in the current schema, we'll try to use a date field if it exists.
          const eventDate = data.scheduledDate || new Date(data.createdAt.seconds * 1000).toISOString().split('T')[0];
          allEvents.push({
            id: doc.id,
            title: data.title,
            date: eventDate,
            type: 'exam',
            description: `Simulado: ${data.type}`
          });
        }
      });

      // Fetch Custom Calendar Events
      const customSnap = await getDocs(collection(db, 'calendar_events'));
      customSnap.docs.forEach(doc => {
        allEvents.push({ id: doc.id, ...doc.data() } as CalendarEvent);
      });

      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'activity': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'exam': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'holiday': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'activity': return <CheckSquare size={12} />;
      case 'exam': return <BookOpen size={12} />;
      case 'holiday': return <AlertCircle size={12} />;
      default: return <CalendarIcon size={12} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="text-indigo-600" /> Calendário Acadêmico
          </h2>
          <p className="text-gray-500 mt-1">Acompanhe prazos de atividades, simulados e eventos.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <h3 className="text-xl font-bold text-gray-900 w-48 text-center">
            {monthNames[month]} {year}
          </h3>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronRight size={24} className="text-gray-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 bg-white rounded-2xl border border-gray-100"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {dayNames.map(day => (
              <div key={day} className="py-3 text-center text-sm font-bold text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

              return (
                <div 
                  key={index} 
                  className={`min-h-[120px] p-2 border-b border-r border-gray-100 ${!day ? 'bg-gray-50' : 'bg-white'} ${isToday ? 'bg-indigo-50/30' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-right mb-2 ${isToday ? 'font-bold text-indigo-600' : 'text-gray-500'}`}>
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-indigo-100' : ''}`}>
                          {day}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((event, i) => (
                          <div 
                            key={i} 
                            className={`text-xs p-1.5 rounded-md border flex items-start gap-1.5 ${getEventColor(event.type)}`}
                            title={event.description}
                          >
                            <div className="mt-0.5 opacity-70">{getEventIcon(event.type)}</div>
                            <span className="font-medium truncate">{event.title}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
      
      {/* Legend */}
      <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 rounded-full bg-indigo-400"></span> Atividades</div>
        <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 rounded-full bg-emerald-400"></span> Simulados</div>
        <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 rounded-full bg-red-400"></span> Feriados</div>
        <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 rounded-full bg-gray-400"></span> Outros</div>
      </div>
    </div>
  );
}
