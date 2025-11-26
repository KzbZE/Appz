/**
 * Script de création des comptes initiaux
 * Exécuter avec: npm run setup:accounts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Charger les variables d'environnement depuis .env
config();

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

interface AccountToCreate {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'PRACTITIONER' | 'PATIENT';
}

const accounts: AccountToCreate[] = [
  {
    email: 'arnaudvb7@gmail.com',
    password: 'Jiskan22',
    name: 'Arnaud VB',
    role: 'PRACTITIONER'
  },
  {
    email: 'admin@admin.com',
    password: 'adminadmin',
    name: 'Administrateur',
    role: 'ADMIN'
  }
];

async function createAccount(account: AccountToCreate) {
  console.log(`\n📝 Création du compte ${account.role}: ${account.email}...`);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
      options: {
        data: {
          name: account.name,
          role: account.role,
          createdAt: new Date().toISOString()
        },
        emailRedirectTo: undefined // Pas de confirmation email en dev
      }
    });

    if (error) {
      console.error(`❌ Erreur: ${error.message}`);
      return false;
    }

    if (data.user) {
      console.log(`✅ Compte créé avec succès!`);
      console.log(`   ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Rôle: ${account.role}`);
      return true;
    }

    return false;
  } catch (err: any) {
    console.error(`❌ Exception: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Création des comptes TheraFlow...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

  // Vérifier que Supabase est configuré
  if (!supabaseUrl || !supabaseAnonKey ||
      supabaseUrl === 'https://local-dev.supabase.co' ||
      supabaseAnonKey.includes('demo_key')) {
    console.error('\n❌ ERREUR: Supabase n\'est pas configuré correctement!');
    console.log('\n📋 Pour configurer Supabase:');
    console.log('1. Créez un projet sur https://supabase.com');
    console.log('2. Copiez l\'URL du projet et la clé anon');
    console.log('3. Mettez à jour le fichier .env:');
    console.log('   VITE_SUPABASE_URL=https://votre-projet.supabase.co');
    console.log('   VITE_SUPABASE_ANON_KEY=votre_cle_anon');
    console.log('4. Relancez ce script\n');
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (const account of accounts) {
    const success = await createAccount(account);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Petite pause entre les créations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Comptes créés: ${successCount}`);
  console.log(`❌ Échecs: ${failCount}`);
  console.log('='.repeat(50));

  if (successCount > 0) {
    console.log('\n🎉 Vous pouvez maintenant vous connecter avec:');
    accounts.forEach(acc => {
      console.log(`\n${acc.role === 'ADMIN' ? '🔐' : '👨‍⚕️'} ${acc.role}:`);
      console.log(`   Email: ${acc.email}`);
      console.log(`   Mot de passe: ${acc.password}`);
    });
  }

  console.log('\n');
}

main().catch(console.error);
