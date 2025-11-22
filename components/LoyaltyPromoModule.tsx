import React, { useState } from 'react';
import { LoyaltyCard, Referral, Promotion } from '../types';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Gift, Users, Tag, Percent, CreditCard, UserPlus, Trophy, Star, Plus, X, Check } from 'lucide-react';

const LoyaltyPromoModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'loyalty' | 'referrals' | 'promos'>('loyalty');

  const loyaltyCards = useLiveQuery(() => db.loyaltyCards.where('isActive').equals(1).toArray()) || [];
  const referrals = useLiveQuery(() => db.referrals.toArray()) || [];
  const promotions = useLiveQuery(() => db.promotions.toArray()) || [];
  const patients = useLiveQuery(() => db.patients.toArray()) || [];

  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showAddPromoModal, setShowAddPromoModal] = useState(false);
  const [showAddReferralModal, setShowAddReferralModal] = useState(false);

  // Loyalty Card Management
  const handleCreateCard = async (patientId: number | string, patientName: string, type: 'STAMP_CARD' | 'POINTS') => {
    await db.loyaltyCards.add({
      patientId,
      patientName,
      type,
      currentCount: 0,
      targetCount: type === 'STAMP_CARD' ? 10 : 100,
      createdDate: new Date().toISOString(),
      isActive: true,
      rewardClaimed: false
    } as LoyaltyCard);
    setShowAddCardModal(false);
  };

  const handleStampCard = async (cardId: number, currentCount: number) => {
    const newCount = currentCount + 1;
    await db.loyaltyCards.update(cardId, { currentCount: newCount });

    if (newCount >= 10) {
      alert('🎉 Carte complète ! Séance gratuite disponible !');
    }
  };

  const handleClaimReward = async (cardId: number) => {
    await db.loyaltyCards.update(cardId, {
      rewardClaimed: true,
      currentCount: 0,
      isActive: false
    });
    alert('✅ Récompense réclamée ! Une nouvelle carte a été créée.');
  };

  // Promotion Management
  const handleCreatePromo = async (promo: Partial<Promotion>) => {
    if (!promo.name || !promo.value) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    await db.promotions.add({
      ...promo,
      usageCount: 0,
      isActive: true
    } as Promotion);
    setShowAddPromoModal(false);
  };

  const togglePromoStatus = async (id: number, currentStatus: boolean) => {
    await db.promotions.update(id, { isActive: !currentStatus });
  };

  // Referral Management
  const handleCreateReferral = async (referral: Partial<Referral>) => {
    if (!referral.referrerId || !referral.referredName) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    await db.referrals.add({
      ...referral,
      status: 'PENDING',
      createdDate: new Date().toISOString(),
      referrerReward: 20, // 20€ de réduction
      referredReward: 10  // 10€ de réduction
    } as Referral);
    setShowAddReferralModal(false);
  };

  const markReferralCompleted = async (id: number) => {
    await db.referrals.update(id, {
      status: 'COMPLETED',
      completedDate: new Date().toISOString()
    });
    alert('✅ Parrainage validé ! Les récompenses peuvent être attribuées.');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Tabs */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
          <Gift size={24} className="text-purple-600" />
          Fidélisation & Promotions
        </h3>
        <div className="flex bg-white rounded-xl p-1.5 shadow-lg border border-slate-200">
          <button onClick={() => setActiveTab('loyalty')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'loyalty' ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <CreditCard size={16} className="inline mr-2" />
            Cartes
          </button>
          <button onClick={() => setActiveTab('referrals')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'referrals' ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Users size={16} className="inline mr-2" />
            Parrainage
          </button>
          <button onClick={() => setActiveTab('promos')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'promos' ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Tag size={16} className="inline mr-2" />
            Promos
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold opacity-90 uppercase">Cartes Actives</div>
            <CreditCard size={20} className="opacity-80" />
          </div>
          <div className="text-3xl font-black">{loyaltyCards.length}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold opacity-90 uppercase">Parrainages</div>
            <Users size={20} className="opacity-80" />
          </div>
          <div className="text-3xl font-black">{referrals.filter(r => r.status === 'COMPLETED').length}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold opacity-90 uppercase">Promos Actives</div>
            <Tag size={20} className="opacity-80" />
          </div>
          <div className="text-3xl font-black">{promotions.filter(p => p.isActive).length}</div>
        </div>
      </div>

      {/* Loyalty Cards Tab */}
      {activeTab === 'loyalty' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">Programme: 9 séances payées = 1 séance offerte</p>
            <button
              onClick={() => setShowAddCardModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-bold shadow-lg transition-all hover:scale-105 flex items-center gap-2"
            >
              <Plus size={18} /> Nouvelle Carte
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loyaltyCards.map(card => {
              const progress = (card.currentCount / card.targetCount) * 100;
              return (
                <div key={card.id} className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 text-white/10 transform translate-x-4 -translate-y-4">
                    <CreditCard size={120} />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-black text-lg">{card.patientName}</div>
                        <div className="text-xs opacity-80">Carte de Fidélité</div>
                      </div>
                      <Trophy size={24} className="opacity-80" />
                    </div>

                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`aspect-square rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
                            i < card.currentCount
                              ? 'bg-white text-purple-600'
                              : 'bg-white/20 text-white/50'
                          }`}
                        >
                          {i < card.currentCount ? <Check size={16} /> : (i + 1)}
                        </div>
                      ))}
                    </div>

                    <div className="w-full bg-white/30 rounded-full h-2 mb-3">
                      <div
                        className="h-2 bg-white rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex gap-2">
                      {card.currentCount < card.targetCount ? (
                        <button
                          onClick={() => card.id && handleStampCard(card.id as number, card.currentCount)}
                          className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-bold text-sm transition-all"
                        >
                          + Tamponner
                        </button>
                      ) : (
                        <button
                          onClick={() => card.id && handleClaimReward(card.id as number)}
                          className="flex-1 px-3 py-2 bg-white text-purple-600 rounded-lg font-bold text-sm transition-all hover:scale-105 flex items-center justify-center gap-1"
                        >
                          <Gift size={16} /> Réclamer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">Parrain: 20€ de réduction | Filleul: 10€ de réduction</p>
            <button
              onClick={() => setShowAddReferralModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-bold shadow-lg transition-all hover:scale-105 flex items-center gap-2"
            >
              <UserPlus size={18} /> Nouveau Parrainage
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-100 to-cyan-100 text-slate-700">
                <tr>
                  <th className="p-4 text-left font-black uppercase text-xs">Parrain</th>
                  <th className="p-4 text-left font-black uppercase text-xs">Filleul</th>
                  <th className="p-4 text-left font-black uppercase text-xs">Statut</th>
                  <th className="p-4 text-center font-black uppercase text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map(ref => (
                  <tr key={ref.id} className="hover:bg-blue-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{ref.referrerName}</td>
                    <td className="p-4 text-slate-600">{ref.referredName}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        ref.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        ref.status === 'REWARDED' ? 'bg-purple-100 text-purple-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {ref.status === 'COMPLETED' ? 'Validé' : ref.status === 'REWARDED' ? 'Récompensé' : 'En attente'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {ref.status === 'PENDING' && (
                        <button
                          onClick={() => ref.id && markReferralCompleted(ref.id as number)}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Valider
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promotions Tab */}
      {activeTab === 'promos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">Créez des offres promotionnelles temporaires pour booster vos ventes</p>
            <button
              onClick={() => setShowAddPromoModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-bold shadow-lg transition-all hover:scale-105 flex items-center gap-2"
            >
              <Plus size={18} /> Nouvelle Promo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promotions.map(promo => {
              const isExpired = new Date(promo.endDate) < new Date();
              const daysLeft = Math.ceil((new Date(promo.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div key={promo.id} className={`bg-white rounded-xl border-2 p-5 hover:shadow-lg transition-all ${
                  promo.isActive && !isExpired ? 'border-orange-300' : 'border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-black text-lg text-slate-800">{promo.name}</div>
                      {promo.code && (
                        <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                          <Tag size={12} /> {promo.code}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => promo.id && togglePromoStatus(promo.id as number, promo.isActive)}
                      className={`p-2 rounded-lg transition-all ${
                        promo.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {promo.isActive ? <Check size={18} /> : <X size={18} />}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Réduction:</span>
                      <span className="font-black text-orange-600 text-lg">
                        {promo.type === 'PERCENTAGE' ? `${promo.value}%` : `${promo.value}€`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Utilisations:</span>
                      <span>{promo.usageCount}/{promo.usageLimit || '∞'}</span>
                    </div>

                    {!isExpired && daysLeft >= 0 && (
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        ⏰ {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
                      </div>
                    )}

                    {isExpired && (
                      <div className="text-xs text-red-600 font-semibold">❌ Expirée</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyPromoModule;
