import React, { useState } from 'react';
import { Appointment, Patient, ApptStatus } from '../types';
import { checkAvailability, CABINET_ADDRESS } from '../services/logisticsService';
import { Calendar, MapPin, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface ClientBookingProps {
  appointments: Appointment[];
  patients: Patient[]; 
  onBook: (appt: Partial<Appointment>) => void;
  onClose: () => void;
}

const ClientBooking: React.FC<ClientBookingProps> = ({ appointments, patients, onBook, onClose }) => {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    address: '',
    date: new Date().toISOString().split('T')[0],
    type: 'CABINET' as 'CABINET' | 'STABLE' | 'DOMICILE',
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const generateSlots = () => {
    const slots = [];
    const startHour = 9;
    const endHour = 18;
    
    for (let h = startHour; h < endHour; h++) {
      const timeStr = `${h.toString().padStart(2, '0')}:00`;
      const dateObj = new Date(`${bookingData.date}T${timeStr}`);
      
      const targetAddr = bookingData.type === 'CABINET' ? CABINET_ADDRESS : bookingData.address;
      
      const check = checkAvailability(
          dateObj, 
          60, 
          targetAddr, 
          appointments, 
          patients
      );

      if (check.available) {
        slots.push(timeStr);
      }
    }
    setAvailableSlots(slots);
    setStep(2);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-primary-600 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Prise de Rendez-vous en Ligne</h2>
            <p className="text-primary-100 text-sm">Trouvez le créneau parfait pour vous et nous.</p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-full p-2 text-white">✕</button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type de Consultation</label>
                <div className="grid grid-cols-3 gap-2">
                  {['CABINET', 'STABLE', 'DOMICILE'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setBookingData({...bookingData, type: t as any})}
                      className={`py-2 text-sm rounded-lg border ${bookingData.type === t ? 'bg-primary-50 border-primary-500 text-primary-700 font-bold' : 'border-gray-200 text-slate-600'}`}
                    >
                      {t === 'STABLE' ? 'Écurie' : t === 'DOMICILE' ? 'Domicile' : 'Cabinet'}
                    </button>
                  ))}
                </div>
              </div>

              {bookingData.type !== 'CABINET' && (
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Adresse d'intervention</label>
                   <div className="relative">
                     <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                     <input 
                       type="text" 
                       className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg"
                       placeholder="Ex: Écuries de la forêt, 78000..."
                       value={bookingData.address}
                       onChange={e => setBookingData({...bookingData, address: e.target.value})}
                     />
                     <p className="text-xs text-slate-400 mt-1">Nécessaire pour calculer les frais de déplacement.</p>
                   </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date souhaitée</label>
                <input 
                  type="date" 
                  className="w-full p-2.5 border border-gray-200 rounded-lg"
                  value={bookingData.date}
                  onChange={e => setBookingData({...bookingData, date: e.target.value})}
                />
              </div>

              <button 
                onClick={generateSlots}
                disabled={bookingData.type !== 'CABINET' && !bookingData.address}
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 disabled:opacity-50 mt-4"
              >
                Voir les disponibilités
              </button>
            </div>
          )}

          {step === 2 && (
             <div className="animate-fadeIn">
                <h3 className="font-bold text-slate-800 mb-4">Créneaux disponibles le {new Date(bookingData.date).toLocaleDateString()}</h3>
                {availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-orange-50 rounded-xl border border-orange-100 text-orange-800">
                    <AlertCircle className="mx-auto mb-2" />
                    <p>Aucun créneau disponible ce jour-là en tenant compte des trajets.</p>
                    <button onClick={() => setStep(1)} className="mt-2 text-sm underline">Changer de date</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {availableSlots.map(slot => (
                      <button 
                        key={slot}
                        onClick={() => {
                           onBook({
                             startTime: `${bookingData.date}T${slot}`,
                             type: bookingData.type,
                             notes: 'RDV Web Client',
                             status: ApptStatus.SCHEDULED,
                             price: 80 // Default mock price
                           });
                           onClose();
                        }}
                        className="py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg font-bold hover:bg-green-100"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setStep(1)} className="mt-6 text-sm text-slate-500 w-full text-center">Retour</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientBooking;