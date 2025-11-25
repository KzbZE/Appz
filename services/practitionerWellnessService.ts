/**
 * Service de bien-être du praticien
 * Suivi santé mentale et physique, équilibre vie pro/perso
 */

export interface WellnessMetrics {
  date: string;
  hoursWorked: number;
  sessionsCount: number;
  mentalLoad: number; // 0-10
  physicalFatigue: number; // 0-10
  satisfaction: number; // 0-10
  stressLevel: number; // 0-10
  sleepQuality: number; // 0-10
  exerciseDone: boolean;
  breaksTaken: number;
  notes?: string;
}

export interface WellnessGoal {
  id: string;
  type: 'WORK_HOURS' | 'REST_DAYS' | 'BREAKS' | 'EXERCISE' | 'SATISFACTION' | 'STRESS';
  title: string;
  target: number;
  currentValue: number;
  unit: string;
  period: 'DAY' | 'WEEK' | 'MONTH';
  status: 'ON_TRACK' | 'AT_RISK' | 'EXCEEDED';
}

export interface WellnessAlert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: 'OVERWORK' | 'NO_REST' | 'HIGH_STRESS' | 'BURNOUT_RISK' | 'LOW_SATISFACTION';
  title: string;
  message: string;
  suggestions: string[];
  createdAt: string;
  acknowledged: boolean;
}

export interface WorkLifeBalance {
  weeklyHoursWorked: number;
  recommendedHours: number;
  restDaysThisMonth: number;
  recommendedRestDays: number;
  consecutiveWorkDays: number;
  balanceScore: number; // 0-100
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

class PractitionerWellnessService {
  /**
   * Enregistrer les métriques du jour
   */
  static async logDailyMetrics(metrics: WellnessMetrics): Promise<void> {
    const allMetrics = await this.loadMetrics();

    // Supprimer anciennes métriques du même jour
    const filtered = allMetrics.filter(m => m.date !== metrics.date);
    filtered.push(metrics);

    localStorage.setItem('wellness_metrics', JSON.stringify(filtered));

    // Vérifier si alerte nécessaire
    await this.checkForAlerts(metrics);

    console.log(`✅ Métriques bien-être enregistrées pour ${metrics.date}`);
  }

  /**
   * Obtenir les métriques de la semaine
   */
  static async getWeeklyMetrics(): Promise<WellnessMetrics[]> {
    const allMetrics = await this.loadMetrics();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return allMetrics
      .filter(m => new Date(m.date) >= weekAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Calculer l'équilibre vie pro/perso
   */
  static async calculateWorkLifeBalance(): Promise<WorkLifeBalance> {
    const weeklyMetrics = await this.getWeeklyMetrics();
    const monthlyMetrics = await this.getMetricsPeriod(30);

    const weeklyHoursWorked = weeklyMetrics.reduce((sum, m) => sum + m.hoursWorked, 0);
    const recommendedHours = 35; // 35h par semaine

    // Compter jours de repos ce mois
    const restDaysThisMonth = monthlyMetrics.filter(m => m.hoursWorked === 0).length;
    const recommendedRestDays = 8; // 2 jours/semaine * 4 semaines

    // Jours consécutifs travaillés
    const consecutiveWorkDays = this.calculateConsecutiveWorkDays(weeklyMetrics);

    // Score d'équilibre (0-100)
    const hoursScore = Math.max(0, 100 - Math.abs(weeklyHoursWorked - recommendedHours) * 2);
    const restScore = (restDaysThisMonth / recommendedRestDays) * 100;
    const consecutiveScore = Math.max(0, 100 - (consecutiveWorkDays - 5) * 20);

    const balanceScore = Math.round((hoursScore + restScore + consecutiveScore) / 3);

    // Tendance (comparer 2 dernières semaines)
    const lastWeekAvg = weeklyMetrics.slice(-7).reduce((sum, m) => sum + m.satisfaction, 0) / 7;
    const prevWeekAvg = weeklyMetrics.slice(-14, -7).reduce((sum, m) => sum + m.satisfaction, 0) / 7;

    let trend: WorkLifeBalance['trend'] = 'STABLE';
    if (lastWeekAvg > prevWeekAvg + 0.5) trend = 'IMPROVING';
    if (lastWeekAvg < prevWeekAvg - 0.5) trend = 'DECLINING';

    return {
      weeklyHoursWorked,
      recommendedHours,
      restDaysThisMonth,
      recommendedRestDays,
      consecutiveWorkDays,
      balanceScore,
      trend
    };
  }

  /**
   * Obtenir les objectifs bien-être
   */
  static async getWellnessGoals(): Promise<WellnessGoal[]> {
    const weeklyMetrics = await this.getWeeklyMetrics();

    const totalHours = weeklyMetrics.reduce((sum, m) => sum + m.hoursWorked, 0);
    const avgStress = weeklyMetrics.reduce((sum, m) => sum + m.stressLevel, 0) / (weeklyMetrics.length || 1);
    const avgSatisfaction = weeklyMetrics.reduce((sum, m) => sum + m.satisfaction, 0) / (weeklyMetrics.length || 1);
    const totalBreaks = weeklyMetrics.reduce((sum, m) => sum + m.breaksTaken, 0);
    const exerciseDays = weeklyMetrics.filter(m => m.exerciseDone).length;

    const goals: WellnessGoal[] = [
      {
        id: 'work_hours',
        type: 'WORK_HOURS',
        title: 'Heures de travail hebdomadaires',
        target: 35,
        currentValue: totalHours,
        unit: 'heures',
        period: 'WEEK',
        status: totalHours <= 40 ? 'ON_TRACK' : totalHours <= 45 ? 'AT_RISK' : 'EXCEEDED'
      },
      {
        id: 'stress',
        type: 'STRESS',
        title: 'Niveau de stress moyen',
        target: 5,
        currentValue: Math.round(avgStress * 10) / 10,
        unit: '/10',
        period: 'WEEK',
        status: avgStress <= 5 ? 'ON_TRACK' : avgStress <= 7 ? 'AT_RISK' : 'EXCEEDED'
      },
      {
        id: 'satisfaction',
        type: 'SATISFACTION',
        title: 'Satisfaction professionnelle',
        target: 7,
        currentValue: Math.round(avgSatisfaction * 10) / 10,
        unit: '/10',
        period: 'WEEK',
        status: avgSatisfaction >= 7 ? 'ON_TRACK' : avgSatisfaction >= 5 ? 'AT_RISK' : 'EXCEEDED'
      },
      {
        id: 'breaks',
        type: 'BREAKS',
        title: 'Pauses dans la semaine',
        target: 14, // 2 pauses par jour
        currentValue: totalBreaks,
        unit: 'pauses',
        period: 'WEEK',
        status: totalBreaks >= 14 ? 'ON_TRACK' : totalBreaks >= 10 ? 'AT_RISK' : 'EXCEEDED'
      },
      {
        id: 'exercise',
        type: 'EXERCISE',
        title: 'Jours d\'exercice',
        target: 3,
        currentValue: exerciseDays,
        unit: 'jours',
        period: 'WEEK',
        status: exerciseDays >= 3 ? 'ON_TRACK' : exerciseDays >= 2 ? 'AT_RISK' : 'EXCEEDED'
      }
    ];

    return goals;
  }

  /**
   * Vérifier et créer des alertes si nécessaire
   */
  static async checkForAlerts(metrics: WellnessMetrics): Promise<void> {
    const weeklyMetrics = await this.getWeeklyMetrics();
    const alerts: WellnessAlert[] = [];

    // Alerte surcharge de travail
    const weeklyHours = weeklyMetrics.reduce((sum, m) => sum + m.hoursWorked, 0);
    if (weeklyHours > 45) {
      alerts.push({
        id: `overwork_${Date.now()}`,
        severity: 'CRITICAL',
        type: 'OVERWORK',
        title: '⚠️ Surcharge de travail détectée',
        message: `Vous avez travaillé ${weeklyHours}h cette semaine (recommandé: 35h).`,
        suggestions: [
          'Bloquer des jours de repos',
          'Refuser de nouveaux RDV cette semaine',
          'Déléguer certaines tâches administratives'
        ],
        createdAt: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Alerte jours sans repos
    const consecutiveDays = this.calculateConsecutiveWorkDays(weeklyMetrics);
    if (consecutiveDays >= 7) {
      alerts.push({
        id: `no_rest_${Date.now()}`,
        severity: 'CRITICAL',
        type: 'NO_REST',
        title: '🚨 Aucun jour de repos depuis 7 jours',
        message: 'Vous n\'avez pas eu de jour de repos complet cette semaine.',
        suggestions: [
          'Bloquer le prochain week-end',
          'Annuler des RDV non urgents',
          'Prendre une demi-journée de récupération'
        ],
        createdAt: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Alerte stress élevé
    if (metrics.stressLevel >= 8) {
      alerts.push({
        id: `stress_${Date.now()}`,
        severity: 'WARNING',
        type: 'HIGH_STRESS',
        title: '😰 Niveau de stress élevé',
        message: `Stress à ${metrics.stressLevel}/10. Prenez soin de vous.`,
        suggestions: [
          'Pratiquer la méditation ou respiration',
          'Faire une pause de 15 minutes',
          'Parler à un collègue ou proche',
          'Consulter un professionnel si persistant'
        ],
        createdAt: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Alerte risque de burnout
    const avgMentalLoad = weeklyMetrics.reduce((sum, m) => sum + m.mentalLoad, 0) / (weeklyMetrics.length || 1);
    const avgSatisfaction = weeklyMetrics.reduce((sum, m) => sum + m.satisfaction, 0) / (weeklyMetrics.length || 1);

    if (avgMentalLoad >= 7 && avgSatisfaction <= 4 && weeklyHours > 40) {
      alerts.push({
        id: `burnout_${Date.now()}`,
        severity: 'CRITICAL',
        type: 'BURNOUT_RISK',
        title: '🔥 Risque de burnout',
        message: 'Combinaison de charge mentale élevée, faible satisfaction et heures excessives.',
        suggestions: [
          '⚠️ Consulter un médecin ou psychologue',
          'Prendre une semaine de congés',
          'Réduire drastiquement les heures',
          'Réévaluer votre organisation professionnelle'
        ],
        createdAt: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Sauvegarder les alertes
    if (alerts.length > 0) {
      await this.saveAlerts(alerts);
    }
  }

  /**
   * Obtenir les alertes actives
   */
  static async getActiveAlerts(): Promise<WellnessAlert[]> {
    const stored = localStorage.getItem('wellness_alerts');
    const alerts: WellnessAlert[] = stored ? JSON.parse(stored) : [];

    return alerts
      .filter(a => !a.acknowledged)
      .sort((a, b) => {
        const severityOrder = { CRITICAL: 3, WARNING: 2, INFO: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Accuser réception d'une alerte
   */
  static async acknowledgeAlert(alertId: string): Promise<void> {
    const stored = localStorage.getItem('wellness_alerts');
    const alerts: WellnessAlert[] = stored ? JSON.parse(stored) : [];

    const updated = alerts.map(a =>
      a.id === alertId ? { ...a, acknowledged: true } : a
    );

    localStorage.setItem('wellness_alerts', JSON.stringify(updated));
  }

  /**
   * Obtenir recommandations personnalisées
   */
  static async getPersonalizedRecommendations(): Promise<string[]> {
    const balance = await this.calculateWorkLifeBalance();
    const weeklyMetrics = await this.getWeeklyMetrics();

    const recommendations: string[] = [];

    // Recommandations basées sur équilibre
    if (balance.balanceScore < 50) {
      recommendations.push('🎯 Priorité: Rétablir l\'équilibre travail-vie personnelle');
    }

    if (balance.consecutiveWorkDays > 6) {
      recommendations.push('🏖️ Prendre au moins 1 jour de repos complet cette semaine');
    }

    if (balance.weeklyHoursWorked > 40) {
      recommendations.push('⏰ Réduire vos heures: limiter à 8 séances par jour');
    }

    // Basé sur satisfaction
    const avgSatisfaction = weeklyMetrics.reduce((sum, m) => sum + m.satisfaction, 0) / (weeklyMetrics.length || 1);
    if (avgSatisfaction < 5) {
      recommendations.push('💭 Identifier sources d\'insatisfaction et actions correctrices');
      recommendations.push('🗣️ En parler avec un collègue ou mentor');
    }

    // Basé sur exercice
    const exerciseDays = weeklyMetrics.filter(m => m.exerciseDone).length;
    if (exerciseDays < 2) {
      recommendations.push('🏃 Ajouter 30min d\'activité physique 3x/semaine');
    }

    // Basé sur pauses
    const avgBreaks = weeklyMetrics.reduce((sum, m) => sum + m.breaksTaken, 0) / (weeklyMetrics.length || 1);
    if (avgBreaks < 2) {
      recommendations.push('☕ Prendre au moins 2 pauses de 15min par jour');
    }

    return recommendations;
  }

  /**
   * Générer rapport bien-être mensuel
   */
  static async generateMonthlyReport(): Promise<{
    period: string;
    totalHours: number;
    avgDailyHours: number;
    restDays: number;
    avgSatisfaction: number;
    avgStress: number;
    exerciseDays: number;
    topConcerns: string[];
    improvements: string[];
  }> {
    const metrics = await this.getMetricsPeriod(30);

    const totalHours = metrics.reduce((sum, m) => sum + m.hoursWorked, 0);
    const restDays = metrics.filter(m => m.hoursWorked === 0).length;
    const avgSatisfaction = metrics.reduce((sum, m) => sum + m.satisfaction, 0) / (metrics.length || 1);
    const avgStress = metrics.reduce((sum, m) => sum + m.stressLevel, 0) / (metrics.length || 1);
    const exerciseDays = metrics.filter(m => m.exerciseDone).length;

    const topConcerns: string[] = [];
    if (avgStress > 6) topConcerns.push('Niveau de stress élevé');
    if (avgSatisfaction < 6) topConcerns.push('Satisfaction professionnelle faible');
    if (restDays < 8) topConcerns.push('Jours de repos insuffisants');
    if (exerciseDays < 12) topConcerns.push('Activité physique insuffisante');

    const improvements: string[] = [];
    if (metrics.length > 30) {
      const firstWeek = metrics.slice(0, 7);
      const lastWeek = metrics.slice(-7);

      const firstWeekSat = firstWeek.reduce((sum, m) => sum + m.satisfaction, 0) / 7;
      const lastWeekSat = lastWeek.reduce((sum, m) => sum + m.satisfaction, 0) / 7;

      if (lastWeekSat > firstWeekSat + 1) {
        improvements.push('✅ Amélioration de la satisfaction professionnelle');
      }

      const firstWeekStress = firstWeek.reduce((sum, m) => sum + m.stressLevel, 0) / 7;
      const lastWeekStress = lastWeek.reduce((sum, m) => sum + m.stressLevel, 0) / 7;

      if (lastWeekStress < firstWeekStress - 1) {
        improvements.push('✅ Réduction du niveau de stress');
      }
    }

    return {
      period: `${new Date(new Date().setDate(new Date().getDate() - 30)).toLocaleDateString('fr-FR')} - ${new Date().toLocaleDateString('fr-FR')}`,
      totalHours: Math.round(totalHours),
      avgDailyHours: Math.round((totalHours / metrics.length) * 10) / 10,
      restDays,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      avgStress: Math.round(avgStress * 10) / 10,
      exerciseDays,
      topConcerns,
      improvements
    };
  }

  // ===== MÉTHODES PRIVÉES =====

  private static async loadMetrics(): Promise<WellnessMetrics[]> {
    try {
      const stored = localStorage.getItem('wellness_metrics');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static async getMetricsPeriod(days: number): Promise<WellnessMetrics[]> {
    const allMetrics = await this.loadMetrics();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return allMetrics.filter(m => new Date(m.date) >= cutoff);
  }

  private static calculateConsecutiveWorkDays(metrics: WellnessMetrics[]): number {
    let consecutive = 0;
    let maxConsecutive = 0;

    for (const metric of metrics.reverse()) {
      if (metric.hoursWorked > 0) {
        consecutive++;
        maxConsecutive = Math.max(maxConsecutive, consecutive);
      } else {
        consecutive = 0;
      }
    }

    return maxConsecutive;
  }

  private static async saveAlerts(alerts: WellnessAlert[]): Promise<void> {
    const stored = localStorage.getItem('wellness_alerts');
    const existing: WellnessAlert[] = stored ? JSON.parse(stored) : [];

    const combined = [...existing, ...alerts];
    localStorage.setItem('wellness_alerts', JSON.stringify(combined));
  }
}

export default PractitionerWellnessService;
