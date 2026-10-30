import { Language, TaskItem, PatientProfile, ActivityLog, MoodRecord } from '../types';

export interface AICompanionResponse {
  spokenText: string;
  detectedIntent: string;
  action: string;
  actionPayload: any;
  needsConfirmation: boolean;
  confirmationPrompt: string;
  quickFollowUps: string[];
}

export interface AIProviderStatus {
  hasGeminiKey: boolean;
  geminiModel: string;
  hasOpenRouterKey: boolean;
  openRouterModel: string;
  primaryProvider: string;
}

export const aiClient = {
  /**
   * Fetch AI provider status (Gemini & OpenRouter availability)
   */
  async getStatus(): Promise<AIProviderStatus> {
    try {
      const res = await fetch('/api/ai/status');
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    } catch (e) {
      console.warn('Could not fetch AI status:', e);
    }
    return {
      hasGeminiKey: false,
      geminiModel: 'gemini-3.8-flash',
      hasOpenRouterKey: false,
      openRouterModel: 'anthropic/claude-3.5-haiku',
      primaryProvider: 'fallback'
    };
  },

  /**
   * Voice Companion Chat Request
   */
  async chatWithCompanion(patientId: string, message: string, language: Language = 'en'): Promise<AICompanionResponse> {
    const res = await fetch('/api/ai/companion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, message, language })
    });

    if (!res.ok) {
      throw new Error(`Companion HTTP error: ${res.status}`);
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Invalid companion response');
    }

    return json.data;
  },

  /**
   * Get AI conversational prompts for Memory Lane photo reminiscence
   */
  async getMemorySuggestions(
    photoTitle: string,
    caption: string,
    date: string,
    tags: string[] = [],
    language: Language = 'en'
  ): Promise<string[]> {
    try {
      const res = await fetch('/api/ai/memory-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoTitle, caption, date, tags, language })
      });

      if (!res.ok) throw new Error(`Memory suggest error ${res.status}`);
      const json = await res.json();
      if (json.success && json.data?.prompts) {
        return json.data.prompts;
      }
    } catch (e) {
      console.warn('Memory suggest fallback:', e);
    }

    // Default reminiscence prompts
    if (language === 'kn') {
      return [
        'ಈ ದಿನ ಎಷ್ಟು ಸುಂದರವಾಗಿತ್ತು ನೋಡಿ! ನಿಮಗೆ ಈ ಹೂವುಗಳ ಸುವಾಸನೆ ನೆನಪಾಗುತ್ತಿದೆಯೇ?',
        'ಎಲ್ಲರೂ ಎಷ್ಟು ಖುಷಿಯಿಂದ ನಗುತ್ತಿದ್ದಾರೆ, ಇದು ನಿಮ್ಮ ಪ್ರೀತಿಯ ಕುಟುಂಬದ ಮಧುರ ನೆನಪು.'
      ];
    } else if (language === 'hi') {
      return [
        'देखिए कितना प्यारा दिन था! क्या आपको वो खास पल याद है?',
        'सबके चेहरों पर कितनी सुंदर मुस्कान है, आपका परिवार आपसे बहुत स्नेह करता है।'
      ];
    }
    return [
      'Look at the joyful smiles in this memory! Do you remember the fresh morning air that day?',
      'Such a peaceful family afternoon. Would you like to tell me what you enjoyed most?'
    ];
  },

  /**
   * Get gentle hint or encouragement for Cognitive Games
   */
  async getCognitiveHint(
    gameType: 'memory' | 'quiz' | 'association' | 'checkin',
    questionContext: string,
    userChoice: string,
    isCorrect: boolean,
    language: Language = 'en'
  ): Promise<string> {
    try {
      const res = await fetch('/api/ai/cognitive-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType, questionContext, userChoice, isCorrect, language })
      });

      if (!res.ok) throw new Error(`Hint error ${res.status}`);
      const json = await res.json();
      if (json.success && json.data?.hint) {
        return json.data.hint;
      }
    } catch (e) {
      console.warn('Cognitive hint fallback:', e);
    }

    if (isCorrect) {
      return language === 'kn'
        ? 'ಅದ್ಭುತ! ನೀವು ತುಂಬಾ ಚೆನ್ನಾಗಿ ಯೋಚಿಸಿದ್ದೀರಿ! 🌟'
        : language === 'hi'
        ? 'बहुत बढ़िया! आपका दिमाग बहुत चुस्त और सक्रिय है! 🌟'
        : 'Wonderful job! Your mind is active, bright, and alert! 🌟';
    }

    return language === 'kn'
      ? 'ತುಂಬಾ ಒಳ್ಳೆಯ ಪ್ರಯತ್ನ! ಇಲ್ಲಿ ಇನ್ನೊಂದು ಸಣ್ಣ ಸುಳಿವು ಇಲ್ಲಿದೆ.'
      : language === 'hi'
      ? 'बहुत अच्छा प्रयास! यहाँ एक छोटा सा संकेत है।'
      : 'A wonderful, thoughtful try! Here is a gentle hint to guide you.';
  },

  /**
   * Get grounded Caregiver Daily/Weekly AI Summary
   */
  async getCaregiverSummary(
    patientId: string,
    reportType: 'daily' | 'weekly' | 'missed' | 'medication' | 'mood' = 'daily',
    language: Language = 'en'
  ): Promise<string> {
    try {
      const res = await fetch('/api/ai/caregiver-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, reportType, language })
      });

      if (!res.ok) throw new Error(`Caregiver summary error ${res.status}`);
      const json = await res.json();
      if (json.success && json.data?.summary) {
        return json.data.summary;
      }
    } catch (e) {
      console.warn('Caregiver summary fallback:', e);
    }

    return '';
  }
};
