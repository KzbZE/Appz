import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  TrendingUp,
  Calendar,
  Users,
  Star,
  DollarSign,
  Clock,
  CloudRain,
  Navigation,
  Settings,
  X,
  Plus,
  Grid
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

/**
 * Dashboard avec widgets personnalisables drag & drop
 * Utilise @dnd-kit pour le drag and drop
 */

export type WidgetType =
  | 'REVENUE_TODAY'
  | 'REVENUE_WEEK'
  | 'REVENUE_MONTH'
  | 'CALENDAR_FILL_RATE'
  | 'PATIENTS_TO_CALL'
  | 'AVERAGE_NPS'
  | 'TOP_PATIENTS'
  | 'TODAY_SLOTS'
  | 'WEATHER'
  | 'TRAFFIC';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  position: number;
  size: 'small' | 'medium' | 'large';
}

interface SortableWidgetProps {
  widget: Widget;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({ widget, onRemove, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-teal-500 transition-all ${
        widget.size === 'small' ? 'col-span-1' : widget.size === 'large' ? 'col-span-2 row-span-2' : 'col-span-1'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white">{widget.title}</h3>
        <div className="flex items-center space-x-2">
          <button
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-move"
            title="Déplacer"
          >
            <Grid size={16} className="text-gray-400" />
          </button>
          <button
            onClick={() => onRemove(widget.id)}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
            title="Retirer"
          >
            <X size={16} className="text-red-500" />
          </button>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
};

// Composants de widgets individuels

const RevenueWidget: React.FC<{ period: 'today' | 'week' | 'month' }> = ({ period }) => {
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];

  const revenue = invoices
    .filter(inv => {
      const invDate = new Date(inv.createdAt);
      const now = new Date();

      if (period === 'today') {
        return invDate.toDateString() === now.toDateString();
      } else if (period === 'week') {
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        return invDate >= weekStart;
      } else {
        return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
      }
    })
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
        <DollarSign size={32} className="text-green-600 dark:text-green-400" />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{revenue.toFixed(0)}€</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {period === 'today' ? "Aujourd'hui" : period === 'week' ? 'Cette semaine' : 'Ce mois'}
        </p>
      </div>
    </div>
  );
};

const CalendarFillRateWidget: React.FC = () => {
  const appointments = useLiveQuery(() => db.appointments.toArray()) || [];

  const thisWeek = appointments.filter(a => {
    const apptDate = new Date(a.startTime);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return apptDate >= weekStart && apptDate <= weekEnd && a.status !== 'CANCELLED';
  });

  const workingHours = 35; // 7h/jour * 5 jours
  const bookedHours = thisWeek.reduce((sum, a) => sum + a.durationMin / 60, 0);
  const fillRate = Math.min(100, (bookedHours / workingHours) * 100);

  return (
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
        <Calendar size={32} className="text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(fillRate)}%</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Taux de remplissage</p>
        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
            style={{ width: `${fillRate}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const TopPatientsWidget: React.FC = () => {
  const sessions = useLiveQuery(() => db.sessions.toArray()) || [];
  const patients = useLiveQuery(() => db.patients.toArray()) || [];

  const patientCounts = sessions.reduce((acc, session) => {
    acc[session.patientId] = (acc[session.patientId] || 0) + 1;
    return acc;
  }, {} as Record<string | number, number>);

  const topPatients = Object.entries(patientCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([patientId, count]) => ({
      patient: patients.find(p => String(p.id) === String(patientId)),
      count
    }))
    .filter(p => p.patient);

  return (
    <div className="space-y-2">
      {topPatients.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {idx + 1}
            </div>
            <span className="font-medium text-gray-900 dark:text-white">{item.patient?.name}</span>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{item.count} séances</span>
        </div>
      ))}
    </div>
  );
};

const TodaySlotsWidget: React.FC = () => {
  const appointments = useLiveQuery(() => db.appointments.toArray()) || [];

  const todayAppointments = appointments.filter(a => {
    const apptDate = new Date(a.startTime);
    const now = new Date();
    return apptDate.toDateString() === now.toDateString() && a.status !== 'CANCELLED';
  });

  const workingHours = 7; // 7h de travail par jour
  const bookedHours = todayAppointments.reduce((sum, a) => sum + a.durationMin / 60, 0);
  const availableSlots = Math.floor((workingHours - bookedHours) / 1); // Créneaux d'1h

  return (
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
        <Clock size={32} className="text-purple-600 dark:text-purple-400" />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{availableSlots}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Créneaux libres aujourd'hui</p>
      </div>
    </div>
  );
};

const CustomizableDashboard: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Charger les widgets sauvegardés
  useEffect(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    if (saved) {
      setWidgets(JSON.parse(saved));
    } else {
      // Widgets par défaut
      setWidgets([
        { id: '1', type: 'REVENUE_TODAY', title: "Revenus aujourd'hui", enabled: true, position: 0, size: 'medium' },
        { id: '2', type: 'REVENUE_WEEK', title: 'Revenus semaine', enabled: true, position: 1, size: 'medium' },
        { id: '3', type: 'CALENDAR_FILL_RATE', title: 'Taux de remplissage', enabled: true, position: 2, size: 'medium' },
        { id: '4', type: 'TODAY_SLOTS', title: 'Créneaux disponibles', enabled: true, position: 3, size: 'medium' },
        { id: '5', type: 'TOP_PATIENTS', title: 'Top 5 patients', enabled: true, position: 4, size: 'large' }
      ]);
    }
  }, []);

  // Sauvegarder les widgets
  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem('dashboard_widgets', JSON.stringify(widgets));
    }
  }, [widgets]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const handleAddWidget = (type: WidgetType) => {
    const widgetTemplates: Record<WidgetType, { title: string; size: Widget['size'] }> = {
      REVENUE_TODAY: { title: "Revenus aujourd'hui", size: 'medium' },
      REVENUE_WEEK: { title: 'Revenus semaine', size: 'medium' },
      REVENUE_MONTH: { title: 'Revenus mois', size: 'medium' },
      CALENDAR_FILL_RATE: { title: 'Taux de remplissage', size: 'medium' },
      PATIENTS_TO_CALL: { title: 'Patients à rappeler', size: 'medium' },
      AVERAGE_NPS: { title: 'NPS moyen', size: 'small' },
      TOP_PATIENTS: { title: 'Top patients', size: 'large' },
      TODAY_SLOTS: { title: 'Créneaux libres', size: 'medium' },
      WEATHER: { title: 'Météo', size: 'small' },
      TRAFFIC: { title: 'Trafic', size: 'small' }
    };

    const template = widgetTemplates[type];
    const newWidget: Widget = {
      id: Date.now().toString(),
      type,
      title: template.title,
      enabled: true,
      position: widgets.length,
      size: template.size
    };

    setWidgets([...widgets, newWidget]);
    setShowWidgetPicker(false);
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'REVENUE_TODAY':
        return <RevenueWidget period="today" />;
      case 'REVENUE_WEEK':
        return <RevenueWidget period="week" />;
      case 'REVENUE_MONTH':
        return <RevenueWidget period="month" />;
      case 'CALENDAR_FILL_RATE':
        return <CalendarFillRateWidget />;
      case 'TODAY_SLOTS':
        return <TodaySlotsWidget />;
      case 'TOP_PATIENTS':
        return <TopPatientsWidget />;
      default:
        return <p className="text-gray-500">Widget en développement</p>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de Bord Personnalisé</h2>
          <p className="text-gray-600 dark:text-gray-400">Glissez-déposez les widgets pour les réorganiser</p>
        </div>
        <button
          onClick={() => setShowWidgetPicker(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg"
        >
          <Plus size={20} />
          <span>Ajouter un widget</span>
        </button>
      </div>

      {/* Dashboard Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {widgets.map(widget => (
              <SortableWidget key={widget.id} widget={widget} onRemove={handleRemoveWidget}>
                {renderWidget(widget)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ajouter un widget</h3>
              <button onClick={() => setShowWidgetPicker(false)}>
                <X size={24} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { type: 'REVENUE_TODAY', icon: DollarSign, label: "Revenus aujourd'hui", color: 'green' },
                { type: 'REVENUE_WEEK', icon: TrendingUp, label: 'Revenus semaine', color: 'blue' },
                { type: 'REVENUE_MONTH', icon: TrendingUp, label: 'Revenus mois', color: 'purple' },
                { type: 'CALENDAR_FILL_RATE', icon: Calendar, label: 'Taux de remplissage', color: 'indigo' },
                { type: 'TOP_PATIENTS', icon: Users, label: 'Top patients', color: 'teal' },
                { type: 'TODAY_SLOTS', icon: Clock, label: 'Créneaux libres', color: 'orange' },
                { type: 'AVERAGE_NPS', icon: Star, label: 'NPS moyen', color: 'yellow' },
                { type: 'WEATHER', icon: CloudRain, label: 'Météo', color: 'cyan' },
                { type: 'TRAFFIC', icon: Navigation, label: 'Trafic', color: 'red' }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => handleAddWidget(item.type as WidgetType)}
                    className="flex items-center space-x-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all"
                  >
                    <div className={`p-2 bg-${item.color}-100 dark:bg-${item.color}-900/20 rounded-lg`}>
                      <Icon size={24} className={`text-${item.color}-600 dark:text-${item.color}-400`} />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizableDashboard;
