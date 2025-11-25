/**
 * Service de visioconférence intégrée
 * Intégration Jitsi Meet ou Whereby pour consultations à distance
 */

export interface VideoSession {
  id: string;
  roomName: string;
  roomUrl: string;
  patientId: number;
  patientName: string;
  practitionerName: string;
  startTime: string;
  duration: number; // minutes
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED';
  recording?: {
    enabled: boolean;
    url?: string;
    consent: boolean;
  };
  participants: {
    id: string;
    name: string;
    role: 'PRACTITIONER' | 'PATIENT';
    joinedAt?: string;
    leftAt?: string;
  }[];
}

export interface VideoConferenceConfig {
  provider: 'JITSI' | 'WHEREBY' | 'ZOOM' | 'CUSTOM';
  jitsi?: {
    domain: string; // meet.jit.si ou domaine personnalisé
    jwt?: string; // Token JWT si domaine personnalisé
  };
  whereby?: {
    apiKey: string;
    subdomain: string;
  };
  features: {
    screenSharing: boolean;
    chat: boolean;
    recording: boolean;
    virtualBackground: boolean;
    handRaise: boolean;
  };
  quality: 'LOW' | 'STANDARD' | 'HD';
  maxDuration: number; // minutes
}

class VideoConferenceService {
  /**
   * Créer une session de visioconférence
   */
  static async createSession(
    patientId: number,
    patientName: string,
    practitionerName: string,
    config: VideoConferenceConfig
  ): Promise<VideoSession> {
    const roomName = `session_${patientId}_${Date.now()}`;
    let roomUrl = '';

    switch (config.provider) {
      case 'JITSI':
        roomUrl = await this.createJitsiRoom(roomName, config);
        break;
      case 'WHEREBY':
        roomUrl = await this.createWherebyRoom(roomName, config);
        break;
      default:
        throw new Error(`Provider ${config.provider} not supported`);
    }

    const session: VideoSession = {
      id: Date.now().toString(),
      roomName,
      roomUrl,
      patientId,
      patientName,
      practitionerName,
      startTime: new Date().toISOString(),
      duration: config.maxDuration || 60,
      status: 'SCHEDULED',
      recording: {
        enabled: config.features.recording,
        consent: false
      },
      participants: [
        { id: '1', name: practitionerName, role: 'PRACTITIONER' },
        { id: '2', name: patientName, role: 'PATIENT' }
      ]
    };

    // Sauvegarder
    await this.saveSession(session);

    console.log(`✅ Session vidéo créée: ${roomName}`);
    console.log(`🔗 URL: ${roomUrl}`);

    return session;
  }

  /**
   * Créer une salle Jitsi Meet
   */
  private static async createJitsiRoom(
    roomName: string,
    config: VideoConferenceConfig
  ): Promise<string> {
    const domain = config.jitsi?.domain || 'meet.jit.si';
    const roomUrl = `https://${domain}/${roomName}`;

    console.log(`🎥 [JITSI] Salle créée: ${roomUrl}`);

    /*
    Pour un domaine personnalisé avec JWT:

    const jwt = generateJWT({
      room: roomName,
      user: {
        name: practitionerName,
        moderator: true
      }
    });

    const roomUrl = `https://${domain}/${roomName}?jwt=${jwt}`;
    */

    return roomUrl;
  }

  /**
   * Créer une salle Whereby
   */
  private static async createWherebyRoom(
    roomName: string,
    config: VideoConferenceConfig
  ): Promise<string> {
    if (!config.whereby?.apiKey) {
      throw new Error('Whereby API key required');
    }

    console.log(`🎥 [WHEREBY] Création salle: ${roomName}`);

    /*
    PRODUCTION CODE:

    const response = await fetch('https://api.whereby.dev/v1/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whereby.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endDate: new Date(Date.now() + config.maxDuration * 60000).toISOString(),
        fields: ['hostRoomUrl'],
        roomNamePrefix: roomName
      })
    });

    const data = await response.json();
    return data.roomUrl;
    */

    // Mock
    const subdomain = config.whereby?.subdomain || 'your-subdomain';
    return `https://${subdomain}.whereby.com/${roomName}`;
  }

  /**
   * Rejoindre une session avec Jitsi Web API
   */
  static initializeJitsiMeet(
    containerId: string,
    roomName: string,
    userName: string,
    config: VideoConferenceConfig
  ): any {
    if (typeof window === 'undefined' || !(window as any).JitsiMeetExternalAPI) {
      console.error('❌ Jitsi Meet API non chargée');
      return null;
    }

    const domain = config.jitsi?.domain || 'meet.jit.si';

    const options = {
      roomName,
      parentNode: document.getElementById(containerId),
      width: '100%',
      height: '100%',
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'desktop',
          'chat',
          'settings',
          'hangup',
          ...(config.features.screenSharing ? ['desktop'] : []),
          ...(config.features.recording ? ['recording'] : [])
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false
      },
      userInfo: {
        displayName: userName
      }
    };

    const api = new (window as any).JitsiMeetExternalAPI(domain, options);

    // Event listeners
    api.addEventListener('videoConferenceJoined', () => {
      console.log('✅ Rejoint la visioconférence');
    });

    api.addEventListener('videoConferenceLeft', () => {
      console.log('👋 Quitté la visioconférence');
    });

    api.addEventListener('participantJoined', (participant: any) => {
      console.log('👤 Participant rejoint:', participant.displayName);
    });

    return api;
  }

  /**
   * Démarrer un enregistrement (avec consentement)
   */
  static async startRecording(sessionId: string, hasConsent: boolean): Promise<boolean> {
    if (!hasConsent) {
      throw new Error('Consentement requis pour enregistrer');
    }

    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session introuvable');
    }

    if (!session.recording) {
      session.recording = { enabled: true, consent: true };
    }

    session.recording.consent = true;

    await this.updateSession(session);

    console.log(`🔴 Enregistrement démarré pour session ${sessionId}`);
    return true;
  }

  /**
   * Arrêter un enregistrement
   */
  static async stopRecording(sessionId: string, recordingUrl: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session || !session.recording) return;

    session.recording.url = recordingUrl;
    await this.updateSession(session);

    console.log(`⏹️ Enregistrement arrêté: ${recordingUrl}`);
  }

  /**
   * Partager l'écran (instructions)
   */
  static getScreenSharingInstructions(): string {
    return `
Pour partager votre écran:
1. Cliquez sur l'icône "Partager l'écran"
2. Sélectionnez la fenêtre ou l'écran entier
3. Cliquez sur "Partager"

Idéal pour montrer des exercices ou des documents.
    `;
  }

  /**
   * Obtenir les sessions d'un patient
   */
  static async getPatientSessions(patientId: number): Promise<VideoSession[]> {
    const sessions = await this.loadSessions();
    return sessions
      .filter(s => s.patientId === patientId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  /**
   * Obtenir les sessions actives
   */
  static async getActiveSessions(): Promise<VideoSession[]> {
    const sessions = await this.loadSessions();
    return sessions.filter(s => s.status === 'ACTIVE');
  }

  /**
   * Terminer une session
   */
  static async endSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    session.status = 'ENDED';

    // Mettre à jour les participants
    session.participants = session.participants.map(p => ({
      ...p,
      leftAt: p.leftAt || new Date().toISOString()
    }));

    await this.updateSession(session);

    console.log(`✅ Session vidéo terminée: ${sessionId}`);
  }

  /**
   * Générer un rapport de session
   */
  static async generateSessionReport(sessionId: string): Promise<{
    sessionId: string;
    duration: number;
    participants: number;
    recording: boolean;
    recordingUrl?: string;
  }> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session introuvable');
    }

    const joinedParticipants = session.participants.filter(p => p.joinedAt);
    const avgDuration = joinedParticipants.reduce((sum, p) => {
      if (!p.joinedAt || !p.leftAt) return sum;
      const duration = new Date(p.leftAt).getTime() - new Date(p.joinedAt).getTime();
      return sum + duration;
    }, 0) / (joinedParticipants.length || 1);

    return {
      sessionId: session.id,
      duration: Math.round(avgDuration / 60000), // en minutes
      participants: joinedParticipants.length,
      recording: !!session.recording?.enabled,
      recordingUrl: session.recording?.url
    };
  }

  // ===== STOCKAGE =====

  private static async saveSession(session: VideoSession): Promise<void> {
    const sessions = await this.loadSessions();
    sessions.push(session);
    localStorage.setItem('video_sessions', JSON.stringify(sessions));
  }

  private static async loadSessions(): Promise<VideoSession[]> {
    try {
      const stored = localStorage.getItem('video_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static async getSession(sessionId: string): Promise<VideoSession | null> {
    const sessions = await this.loadSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  private static async updateSession(session: VideoSession): Promise<void> {
    const sessions = await this.loadSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
      localStorage.setItem('video_sessions', JSON.stringify(sessions));
    }
  }
}

export default VideoConferenceService;

/**
 * CONFIGURATION PRODUCTION
 *
 * 1. JITSI MEET (Open Source, Gratuit)
 *
 * Installation:
 * - Ajouter dans index.html:
 * <script src='https://meet.jit.si/external_api.js'></script>
 *
 * - Utilisation:
 * const api = VideoConferenceService.initializeJitsiMeet(
 *   'jitsi-container',
 *   'room-name',
 *   'User Name',
 *   config
 * );
 *
 * 2. WHEREBY (Payant, Simple)
 *
 * - Créer compte: https://whereby.com/
 * - Obtenir API key: https://whereby.dev/
 * - Pricing: $9.99/mois pour 4 salles
 *
 * 3. ZOOM (Payant, Professionnel)
 *
 * - Zoom SDK: https://marketplace.zoom.us/
 * - Requires OAuth app
 * - Plus complexe mais plus de features
 *
 * 4. DOMAINE PERSONNALISÉ JITSI
 *
 * - Héberger propre serveur Jitsi
 * - Contrôle total
 * - Configuration JWT pour sécurité
 * - Guide: https://jitsi.github.io/handbook/docs/devops-guide/
 */
