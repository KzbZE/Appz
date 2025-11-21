import React, { useState } from 'react';
import { Appointment, Patient, Invoice, PatientType, ApptStatus } from '../types';
import { TrendingUp, Users, PieChart, Award, Activity, DollarSign, MapPin, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';

interface StatisticsModuleProps {
  appointments: Appointment[];
  patients: Patient[];
  invoices: Invoice[];
}

const StatisticsModule: React.FC<StatisticsModuleProps> = ({ appointments, patients, invoices }) => {
  const [clientSearch, setClientSearch] = useState('');

  const completedAppts = appointments.filter(a => a.status === ApptStatus.COMPLETED);
  
  const totalRevenue = completedAppts.reduce((sum, a) => sum + a.price + (a.travelFee || 0), 0);
  const totalSessions = completedAppts.length;
  const avgSessionPrice = totalSessions > 0 ? (totalRevenue / totalSessions) : 0;

  const clientStats = patients.map(p => {
      const pAppts = completedAppts.filter(a => String(a.patientId) === String(p.id));
      
      const sortedAppts = pAppts.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      const lastAppt = sortedAppts[0];
      
      const sessionCount = pAppts.length;
      const totalSpent = pAppts.reduce((sum, a) => sum + a.price + (a.travelFee || 0), 0);
      
      let status: 'ACTIVE' | 'RISK' | 'LOST' | 'NEW' = 'NEW';
      if (sessionCount > 0 && lastAppt) {
          const monthsSinceLast = (new Date().getTime() - new Date(lastAppt.startTime).getTime()) / (1000 * 60 * 60 * 24 * 30);
          if (monthsSinceLast < 3) status = 'ACTIVE';
          else if (monthsSinceLast < 6) status = 'RISK';
          else status = 'LOST';
      }
      
      return {
          id: p.id,
          name: p.name,
          type: p.type,
          owner: p.ownerName,
          sessionCount,
          totalSpent,
          lastVisit: lastAppt ? new Date(lastAppt.startTime) : null,
          status
      };
  }).sort((a,b) => b.totalSpent - a.totalSpent);

  const locStats = {
      cabinet: { count: 0, revenue: 0 },
      external: { count: 0, revenue: 0 }
  };
  
  completedAppts.forEach(a => {
      if (a.type === 'CABINET') {
          locStats.cabinet.count++;
          locStats.cabinet.revenue += a.price;
      } else {
          locStats.external.count++;
          locStats.external.revenue += (a.price + (a.travelFee || 0));
      }
  });

  const speciesCount = {
    [PatientType.HUMAN]: 0,
    [PatientType.EQUINE]: 0,
    [PatientType.CANINE]: 0
  };
  completedAppts.forEach(a => {
      const patient = patients.find(p => String(p.id) === String(a.patientId));
      if (patient) {
          speciesCount[patient.type] = (speciesCount[patient.type] || 0) + 1;
      }
  });
  const totalForDistrib = Object.values(speciesCount).reduce((a, b) => a + b, 0) || 1;

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
          <div>
              <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
              <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
              {subtitle && (
                  <div className="flex items-center mt-1">
                    {trend === 'up' ? <ArrowUpRight size={14} className="text-green-500 mr-1"/> : <ArrowDownRight size={14} className="text-red-500 mr-1"/>}
                    <p className="text-xs text-slate-400">{subtitle}</p>
                  </div>
              )}
          </div>
          <div className={`p-4 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
              <Icon size={24} />
          </div>
      </div>
  );

  return (
    <div className="space-y-8 pb-24 animate-fadeIn">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Business Intelligence</h2>
                <p className="text-slate-500 text-sm">Analyse détaillée de la performance et de la clientèle</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-1 flex text-xs font-medium">
                <button className="px-3 py-1 bg-slate-800 text-white rounded shadow-sm">Année en cours</button>
                <button className="px-3 py-1 text-slate-500 hover:bg-gray-50">12 derniers mois</button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                title="Chiffre d'Affaires" 
                value={`${totalRevenue.toFixed(0)} €`} 
                subtitle="+12% vs N-1" 
                trend="up"
                icon={DollarSign} 
                color="bg-emerald-100 text-emerald-600"
            />
            <StatCard 
                title="Séances Réalisées" 
                value={totalSessions} 
                subtitle="Taux Remplissage 78%" 
                trend="up"
                icon={Activity} 
                color="bg-blue-100 text-blue-600"
            />
             <StatCard 
                title="Patients Actifs" 
                value={clientStats.filter(c => c.status === 'ACTIVE').length} 
                subtitle="12 Perdus (6 mois)" 
                trend="down"
                icon={Users} 
                color="bg-purple-100 text-purple-600"
            />
            <StatCard 
                title="Panier Moyen" 
                value={`${avgSessionPrice.toFixed(0)} €`} 
                subtitle="Objectif: 85 €" 
                trend="up"
                icon={TrendingUp} 
                color="bg-amber-100 text-amber-600"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center">
                        <MapPin size={18} className="mr-2 text-slate-400"/>
                        Rentabilité par Lieu
                    </h3>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-bold text-slate-700">Cabinet (Humain)</span>
                            <span className="text-slate-500">{locStats.cabinet.revenue} € ({locStats.cabinet.count} séances)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div 
                                className="h-full bg-teal-500 rounded-full" 
                                style={{ width: `${(locStats.cabinet.revenue / (totalRevenue || 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-bold text-slate-700">Extérieur (Écuries / Domicile)</span>
                            <span className="text-slate-500">{locStats.external.revenue} € ({locStats.external.count} séances)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden relative">
                            <div 
                                className="h-full bg-amber-500 rounded-full" 
                                style={{ width: `${(locStats.external.revenue / (totalRevenue || 1)) * 100}%` }}
                            ></div>
                            <div 
                                className="absolute top-0 left-0 h-full bg-red-400/30 border-r border-red-400" 
                                style={{ width: `${((locStats.external.revenue * 0.2) / (totalRevenue || 1)) * 100}%` }}
                                title="Coût estimé des déplacements"
                            ></div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 text-right">*La zone rouge représente le coût estimé des déplacements</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                    <PieChart size={18} className="mr-2 text-slate-400"/>
                    Répartition Activité
                </h3>
                <div className="flex items-center justify-center mb-6">
                    <div className="relative w-40 h-40 rounded-full border-8 border-slate-50"
                         style={{
                             background: `conic-gradient(
                                 #f59e0b 0% ${ (speciesCount[PatientType.EQUINE] / totalForDistrib) * 100 }%, 
                                 #14b8a6 ${ (speciesCount[PatientType.EQUINE] / totalForDistrib) * 100 }% ${ ((speciesCount[PatientType.EQUINE] + speciesCount[PatientType.HUMAN]) / totalForDistrib) * 100 }%,
                                 #6366f1 ${ ((speciesCount[PatientType.EQUINE] + speciesCount[PatientType.HUMAN]) / totalForDistrib) * 100 }% 100%
                             )`
                         }}>
                         <div className="absolute inset-0 m-8 bg-white rounded-full flex items-center justify-center flex-col shadow-inner">
                             <span className="text-2xl font-bold text-slate-800">{totalSessions}</span>
                             <span className="text-[10px] text-slate-400 uppercase">Séances</span>
                         </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                     <div className="p-2 rounded bg-amber-50 border border-amber-100">
                        <span className="block font-bold text-amber-700">{Math.round((speciesCount[PatientType.EQUINE]/totalForDistrib)*100)}%</span>
                        <span className="text-slate-500">Cheval</span>
                     </div>
                     <div className="p-2 rounded bg-teal-50 border border-teal-100">
                        <span className="block font-bold text-teal-700">{Math.round((speciesCount[PatientType.HUMAN]/totalForDistrib)*100)}%</span>
                        <span className="text-slate-500">Humain</span>
                     </div>
                     <div className="p-2 rounded bg-indigo-50 border border-indigo-100">
                        <span className="block font-bold text-indigo-700">{Math.round((speciesCount[PatientType.CANINE]/totalForDistrib)*100)}%</span>
                        <span className="text-slate-500">Chien</span>
                     </div>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="font-bold text-slate-800 flex items-center">
                    <Award size={18} className="mr-2 text-slate-400"/>
                    Classement Clients (Meilleurs Contributeurs)
                </h3>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <input 
                        type="text" 
                        placeholder="Filtrer un client..." 
                        className="w-full pl-9 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary-500"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                    />
                </div>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-slate-500 font-medium">
                        <tr>
                            <th className="p-4 w-16 text-center">#</th>
                            <th className="p-4">Patient / Propriétaire</th>
                            <th className="p-4 text-center">Séances</th>
                            <th className="p-4 text-right">CA Cumulé</th>
                            <th className="p-4">Dernière Visite</th>
                            <th className="p-4 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {clientStats
                            .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.owner && c.owner.toLowerCase().includes(clientSearch.toLowerCase())))
                            .map((client, index) => (
                            <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 text-center font-bold text-slate-400">
                                    {index < 3 ? (
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs
                                            ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                                            {index + 1}
                                        </span>
                                    ) : (index + 1)}
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{client.name}</div>
                                    {client.type !== PatientType.HUMAN && <div className="text-xs text-slate-500">{client.owner}</div>}
                                </td>
                                <td className="p-4 text-center">
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-slate-600">{client.sessionCount}</span>
                                </td>
                                <td className="p-4 text-right font-bold text-slate-700">
                                    {client.totalSpent.toFixed(0)} €
                                </td>
                                <td className="p-4 text-slate-600">
                                    {client.lastVisit ? client.lastVisit.toLocaleDateString() : '-'}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide
                                        ${client.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                                          client.status === 'RISK' ? 'bg-orange-100 text-orange-700' : 
                                          client.status === 'NEW' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                        {client.status === 'RISK' ? 'À Relancer' : client.status === 'LOST' ? 'Perdu' : client.status === 'NEW' ? 'Nouveau' : 'Fidèle'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    </div>
  );
};

export default StatisticsModule;