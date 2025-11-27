import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'theraflow-hybrid@1.0.0'
    }
  }
});

// Type definitions for database tables (camelCase mapping)
export type Database = {
  patients: {
    id: number;
    name: string;
    owner_name?: string;
    type: 'HUMAN' | 'EQUINE' | 'CANINE';
    location: string;
    address: string;
    phone?: string;
    email?: string;
    last_visit?: string;
    avatar_url?: string;
    medical_history?: any;
    distance_km?: number;
    custom_tariffs?: any;
    tags?: string[];
    notes?: string;
    created_at: string;
    updated_at: string;
  };
  appointments: {
    id: number;
    patient_id: number;
    start_time: string;
    duration_min: number;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS' | 'UNAVAILABLE';
    type: 'CABINET' | 'DOMICILE' | 'STABLE' | 'BLOCK';
    notes?: string;
    weather?: any;
    price: number;
    travel_fee?: number;
    distance_km?: number;
    travel_duration_min?: number;
    created_at: string;
    updated_at: string;
  };
  invoices: {
    id: number;
    number: string;
    date: string;
    due_date: string;
    patient_name: string;
    amount_ht: number;
    vat_rate: number;
    amount_ttc: number;
    amount_paid: number;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'PARTIAL';
    items: any;
    reminder_sent_at?: string;
    reminders?: any;
    payments?: any;
    created_at: string;
    updated_at: string;
  };
  recurring_invoices: {
    id: number;
    patient_name: string;
    subscription_type: string;
    frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    amount_ht: number;
    vat_rate: number;
    items: any;
    start_date: string;
    next_due_date: string;
    end_date?: string;
    is_active: boolean;
    last_generated_date?: string;
    total_generated: number;
    created_at: string;
    updated_at: string;
  };
  expenses: {
    id: number;
    date: string;
    category: 'CARBURANT' | 'MATERIEL' | 'FORMATION' | 'ASSURANCES' | 'LOYER' | 'AUTRE';
    description: string;
    amount: number;
    receipt_url?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
  };
  sessions: {
    id: number;
    patient_id: number;
    appointment_id?: number;
    date: string;
    type: string;
    anamnesis: any;
    tensions: any;
    treatment_notes: string;
    exercises: string[];
    documents: any;
    price: number;
    practitioner_notes?: string;
    created_at: string;
    updated_at: string;
  };
  sms_logs: {
    id: number;
    date: string;
    patient_name: string;
    phone: string;
    message: string;
    trigger: string;
    status: 'QUEUED' | 'SENT' | 'FAILED';
    created_at: string;
  };
  survey_responses: {
    id: number;
    session_id?: number;
    patient_id: number;
    patient_name: string;
    date: string;
    nps_score?: number;
    rating?: number;
    answers: any;
    feedback: string;
    would_recommend: boolean;
    created_at: string;
  };
  goals: {
    id: number;
    type: 'REVENUE' | 'SESSIONS' | 'NEW_PATIENTS' | 'CUSTOM';
    name: string;
    period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    target_value: number;
    current_value: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    unit: 'EUR' | 'COUNT' | 'PERCENT';
    created_at: string;
    updated_at: string;
  };
  loyalty_cards: {
    id: number;
    patient_id: number;
    patient_name: string;
    type: 'STAMP_CARD' | 'POINTS';
    current_count: number;
    target_count: number;
    created_date: string;
    expiry_date?: string;
    is_active: boolean;
    reward_claimed: boolean;
    created_at: string;
    updated_at: string;
  };
  loyalty_transactions: {
    id: number;
    card_id: number;
    patient_id: number;
    date: string;
    type: 'EARN' | 'REDEEM';
    points: number;
    description: string;
    created_at: string;
  };
  referrals: {
    id: number;
    referrer_id: number;
    referrer_name: string;
    referred_id?: number;
    referred_name: string;
    referred_phone?: string;
    referred_email?: string;
    status: 'PENDING' | 'COMPLETED' | 'REWARDED';
    created_date: string;
    completed_date?: string;
    referrer_reward: number;
    referred_reward: number;
    created_at: string;
    updated_at: string;
  };
  promotions: {
    id: number;
    name: string;
    code?: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SESSION';
    value: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    usage_limit?: number;
    usage_count: number;
    target_segment?: string;
    min_purchase?: number;
    created_at: string;
    updated_at: string;
  };
  settings: {
    id: number;
    app_name: string;
    practitioner_name: string;
    cabinet_address: string;
    km_rate: number;
    default_tariffs: any;
    finance?: any;
    social?: any;
    branding?: any;
    google?: any;
    sms?: any;
    survey?: any;
    created_at: string;
    updated_at: string;
  };
};

// Utility functions for camelCase <-> snake_case conversion
export const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

export const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  // Vérifier si le mode local est forcé via variable d'environnement
  const forceLocal = import.meta.env.VITE_FORCE_LOCAL_AUTH === 'true';

  if (forceLocal) {
    console.log('🔒 Mode local FORCÉ via VITE_FORCE_LOCAL_AUTH - Utilisation d\'IndexedDB');
    return false;
  }

  // Liste des URLs factices/dev qui indiquent qu'on veut utiliser le mode local
  const devUrls = [
    'https://your-project.supabase.co',
    'https://local-dev.supabase.co',
    'local-dev',
    'localhost'
  ];

  const devKeys = [
    'your_anon_key_here',
    'demo_key',
    'demo_key_for_local_development'
  ];

  // Vérifier si l'URL ou la clé contient des patterns de dev
  const isDevUrl = devUrls.some(devUrl => supabaseUrl.includes(devUrl));
  const isDevKey = devKeys.some(devKey => supabaseAnonKey.includes(devKey));

  // Si URL ou clé de dev, on est en mode local
  if (isDevUrl || isDevKey) {
    console.log('🔧 Mode local détecté (URL/clé de dev) - Utilisation d\'IndexedDB');
    return false;
  }

  // Sinon, vérifier qu'on a bien des valeurs
  const hasValidConfig = !!(supabaseUrl && supabaseAnonKey);

  if (hasValidConfig) {
    console.log('☁️ Supabase configuré - Utilisation de Supabase Cloud');
  } else {
    console.log('🔧 Pas de configuration Supabase - Utilisation d\'IndexedDB');
  }

  return hasValidConfig;
};

// Helper to check connection
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('settings').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};
