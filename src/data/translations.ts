import { Language } from '../types';

export interface Translations {
  appName: string;
  tagline: string;
  welcomeBack: string;
  signInSubtitle: string;
  yourNamePlaceholder: string;
  continueBtn: string;
  or: string;
  signInGoogle: string;
  kindnessMotto: string;
  chooseRoleTitle: string;
  chooseRoleSubtitle: string;
  iAmCaregiver: string;
  caregiverDesc: string;
  iAmPatient: string;
  patientDesc: string;
  helloGreeting: string;
  takeSmallSteps: string;
  patientId: string;
  age: string;
  bloodGroup: string;
  nextTask: string;
  viewSchedule: string;
  photos: string;
  photosDesc: string;
  games: string;
  gamesDesc: string;
  calm: string;
  calmDesc: string;
  calling: string;
  callingDesc: string;
  medsRoutine: string;
  voiceNotes: string;
  calmMusic: string;
  sosButton: string;
  sosPrompt: string;
  navHome: string;
  navRoutine: string;
  navPhotos: string;
  navMore: string;
  goodMorning: string;
  confirmTitle: string;
  confirmVoicePrompt: string;
  yes: string;
  no: string;
  markCompleted: string;
  snooze: string;
  settings: string;
  appPreferences: string;
  language: string;
  notifications: string;
  editDetails: string;
  liveLocation: string;
  homeLocation: string;
  quickCall: string;
  contacts: string;
  callNow: string;
  emergencyAlert: string;
  emergencyConfirmQuestion: string;
  locationShared: string;
  sendVoiceNote: string;
  voiceNoteSent: string;
  ifNoResponseEscalate: string;
  cancelEmergency: string;
  caregiverDashboard: string;
  aiOverview: string;
  patientsOverview: string;
  dailyRoutineCompletion: string;
  moodTracker: string;
  great: string;
  good: string;
  okay: string;
  low: string;
  sad: string;
  meetings: string;
  taskScheduler: string;
  album: string;
  allGood: string;
  medsPending: string;
  sosAlert: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'MindCare',
    tagline: 'Better Days, Together',
    welcomeBack: 'Welcome Back!',
    signInSubtitle: 'Sign in to continue your journey',
    yourNamePlaceholder: 'Your name',
    continueBtn: 'Continue',
    or: 'or',
    signInGoogle: 'Sign in with Google',
    kindnessMotto: 'Kindness • Care • Connection',
    chooseRoleTitle: 'Are you a Caretaker or a Patient?',
    chooseRoleSubtitle: 'Choose your role to continue',
    iAmCaregiver: 'I am a Caretaker',
    caregiverDesc: 'Manage and support your loved ones',
    iAmPatient: 'I am a Patient',
    patientDesc: 'Your personal wellness journey',
    helloGreeting: 'Hello',
    takeSmallSteps: 'Take small steps, feel better',
    patientId: 'Patient ID',
    age: 'Age',
    bloodGroup: 'Blood Group',
    nextTask: 'Next Task',
    viewSchedule: 'View daily schedule',
    photos: 'Photos',
    photosDesc: 'View your memories',
    games: 'Games',
    gamesDesc: 'Play & stay active',
    calm: 'Calm',
    calmDesc: 'Breathe & relax',
    calling: 'Calling',
    callingDesc: 'Family & close contacts',
    medsRoutine: 'Meds / Routine',
    voiceNotes: 'Voice Notes',
    calmMusic: 'Spotify / Calm Music',
    sosButton: 'SOS',
    sosPrompt: 'Press for help',
    navHome: 'Home',
    navRoutine: 'Routine',
    navPhotos: 'Photos',
    navMore: 'More',
    goodMorning: 'Good Morning',
    confirmTitle: 'Time for your task',
    confirmVoicePrompt: 'Hi Aarav, it\'s time for your morning medicine. Would you like to confirm?',
    yes: 'Yes',
    no: 'No',
    markCompleted: 'Mark as Completed',
    snooze: 'Snooze 10m',
    settings: 'Settings',
    appPreferences: 'App Preferences',
    language: 'Language',
    notifications: 'Notifications',
    editDetails: 'Edit Details',
    liveLocation: 'Live Location',
    homeLocation: 'Home Location',
    quickCall: 'Quick Call',
    contacts: 'Contacts',
    callNow: 'Call Now',
    emergencyAlert: 'Emergency Alert',
    emergencyConfirmQuestion: 'Are you sure you need help?',
    locationShared: 'Location shared',
    sendVoiceNote: 'Send voice note',
    voiceNoteSent: 'Voice note sent',
    ifNoResponseEscalate: 'Call directly within 20 sec (repeated call)',
    cancelEmergency: 'Cancel Alert',
    caregiverDashboard: 'Caregiver Dashboard',
    aiOverview: 'AI Overview',
    patientsOverview: 'Patients Overview',
    dailyRoutineCompletion: 'Daily Routine Completion',
    moodTracker: 'Mood Tracker',
    great: 'Great',
    good: 'Good',
    okay: 'Okay',
    low: 'Low',
    sad: 'Sad',
    meetings: 'Meetings',
    taskScheduler: 'Task Scheduler',
    album: 'Album',
    allGood: 'All good',
    medsPending: 'Meds pending',
    sosAlert: 'SOS alert',
  },
  kn: {
    appName: 'ಮೈಂಡ್‌ಕೇರ್',
    tagline: 'ಉತ್ತಮ ದಿನಗಳು, ಜೊತೆಯಾಗಿ',
    welcomeBack: 'ಸ್ವಾಗತ!',
    signInSubtitle: 'ನಿಮ್ಮ ಕ್ಷೇಮ ಪ್ರಯಾಣ ಮುಂದುವರಿಸಲು ಲಾಗಿನ್ ಆಗಿ',
    yourNamePlaceholder: 'ನಿಮ್ಮ ಹೆಸರು',
    continueBtn: 'ಮುಂದುವರಿಯಿರಿ',
    or: 'ಅಥವಾ',
    signInGoogle: 'ಗೂಗಲ್ ಮೂಲಕ ಲಾಗಿನ್ ಮಾಡಿ',
    kindnessMotto: 'ದಯೆ • ಕಾಳಜಿ • ಬಾಂಧವ್ಯ',
    chooseRoleTitle: 'ನೀವು ಆರೈಕೆದಾರರೇ ಅಥವಾ ರೋಗಿಯೇ?',
    chooseRoleSubtitle: 'ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆರಿಸಿ',
    iAmCaregiver: 'ನಾನು ಆರೈಕೆದಾರ (Caretaker)',
    caregiverDesc: 'ನಿಮ್ಮ ಆತ್ಮೀಯರನ್ನು ನಿರ್ವಹಿಸಿ ಮತ್ತು ಬೆಂಬಲಿಸಿ',
    iAmPatient: 'ನಾನು ರೋಗಿ (Patient)',
    patientDesc: 'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಕ್ಷೇಮ ಪ್ರಯಾಣ',
    helloGreeting: 'ನಮಸ್ಕಾರ',
    takeSmallSteps: 'ಸಣ್ಣ ಹೆಜ್ಜೆಗಳನ್ನಿಡಿ, ಲವಲವಿಕೆಯಿಂದಿರಿ',
    patientId: 'ರೋಗಿ ಐಡಿ',
    age: 'ವಯಸ್ಸು',
    bloodGroup: 'ರಕ್ತದ ಗುಂಪು',
    nextTask: 'ಮುಂದಿನ ಕಾರ್ಯ',
    viewSchedule: 'ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿ ನೋಡಿ',
    photos: 'ಫೋಟೋಗಳು',
    photosDesc: 'ನಿಮ್ಮ ಸವಿ ನೆನಪುಗಳನ್ನು ನೋಡಿ',
    games: 'ಆಟಗಳು',
    gamesDesc: 'ಆಡಿ ಸಕ್ರಿಯರಾಗಿರಿ',
    calm: 'ಶಾಂತಿ',
    calmDesc: 'ಉಸಿರಾಡಿ ಮತ್ತು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ',
    calling: 'ಕರೆಗಳು',
    callingDesc: 'ಕುಟುಂಬ ಮತ್ತು ಆಪ್ತರು',
    medsRoutine: 'ಔಷಧಿ / ದಿನಚರಿ',
    voiceNotes: 'ಧ್ವನಿ ಟಿಪ್ಪಣಿಗಳು',
    calmMusic: 'ಶಾಂತ ಸಂಗೀತ',
    sosButton: 'ತುರ್ತು (SOS)',
    sosPrompt: 'ಸಹಾಯಕ್ಕಾಗಿ ಒತ್ತಿ',
    navHome: 'ಮುಖಪುಟ',
    navRoutine: 'ದಿನಚರಿ',
    navPhotos: 'ಫೋಟೋಗಳು',
    navMore: 'ಇನ್ನಷ್ಟು',
    goodMorning: 'ಶುಭೋದಯ',
    confirmTitle: 'ಕಾರ್ಯದ ಸಮಯ',
    confirmVoicePrompt: 'ನಮಸ್ಕಾರ ಆರವ್, ನಿಮ್ಮ ಬೆಳಗಿನ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯವಾಗಿದೆ. ದೃಢೀಕರಿಸಲು ಬಯಸುವಿರಾ?',
    yes: 'ಹೌದು',
    no: 'ಇಲ್ಲ',
    markCompleted: 'ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿ',
    snooze: '10 ನಿಮಿಷ ಮುಂದೂಡಿ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    appPreferences: 'ಅಪ್ಲಿಕೇಶನ್ ಆದ್ಯತೆಗಳು',
    language: 'ಭಾಷೆ',
    notifications: 'ಸೂಚನೆಗಳು',
    editDetails: 'ವಿವರಗಳನ್ನು ತಿದ್ದಿ',
    liveLocation: 'ಲೈವ್ ಸ್ಥಳ',
    homeLocation: 'ಮನೆಯ ವಿಳಾಸ',
    quickCall: 'ತ್ವರಿತ ಕರೆ',
    contacts: 'ಸಂಪರ್ಕಗಳು',
    callNow: 'ಈಗಲೇ ಕರೆ ಮಾಡಿ',
    emergencyAlert: 'ತುರ್ತು ಎಚ್ಚರಿಕೆ',
    emergencyConfirmQuestion: 'ನಿಮಗೆ ಖಂಡಿತ ತುರ್ತು ನೆರವು ಬೇಕೆ?',
    locationShared: 'ಸ್ಥಳ ಹಂಚಿಕೊಳ್ಳಲಾಗಿದೆ',
    sendVoiceNote: 'ಧ್ವನಿ ಸಂದೇಶ ಕಳುಹಿಸಿ',
    voiceNoteSent: 'ಧ್ವನಿ ಸಂದೇಶ ಕಳುಹಿಸಲಾಗಿದೆ',
    ifNoResponseEscalate: '20 ಸೆಕೆಂಡಿನಲ್ಲಿ ನೇರ ಕರೆ ಸಂಪರ್ಕ',
    cancelEmergency: 'ರದ್ದುಗೊಳಿಸಿ',
    caregiverDashboard: 'ಆರೈಕೆದಾರರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    aiOverview: 'AI ಅವಲೋಕನ',
    patientsOverview: 'ರೋಗಿಗಳ ಅವಲೋಕನ',
    dailyRoutineCompletion: 'ದೈನಂದಿನ ದಿನಚರಿ ಪೂರ್ಣತೆ',
    moodTracker: 'ಮನಸ್ಥಿತಿ ಟ್ರ್ಯಾಕರ್',
    great: 'ಉತ್ತಮ',
    good: 'ಚೆನ್ನಾಗಿದೆ',
    okay: 'ಸಾಮಾನ್ಯ',
    low: 'ಕಡಿಮೆ',
    sad: 'ಬೇಸರ',
    meetings: 'ಸಭೆಗಳು',
    taskScheduler: 'ಕಾರ್ಯ ವೇಳಾಪಟ್ಟಿ',
    album: 'ಆಲ್ಬಮ್',
    allGood: 'ಎಲ್ಲವೂ ಸರಿ ಇದೆ',
    medsPending: 'ಔಷಧಿ ಬಾಕಿ ಇದೆ',
    sosAlert: 'ತುರ್ತು ಎಚ್ಚರಿಕೆ (SOS)',
  },
  hi: {
    appName: 'माइंडकेयर',
    tagline: 'बेहतर दिन, साथ मिलकर',
    welcomeBack: 'स्वागत है!',
    signInSubtitle: 'अपनी स्वास्थ्य यात्रा जारी रखने के लिए साइन इन करें',
    yourNamePlaceholder: 'आपका नाम',
    continueBtn: 'आगे बढ़ें',
    or: 'या',
    signInGoogle: 'गूगल से साइन इन करें',
    kindnessMotto: 'दया • देखभाल • अपनापन',
    chooseRoleTitle: 'क्या आप देखभालकर्ता हैं या मरीज़?',
    chooseRoleSubtitle: 'जारी रखने के लिए अपनी भूमिका चुनें',
    iAmCaregiver: 'मैं देखभालकर्ता हूँ (Caretaker)',
    caregiverDesc: 'अपने प्रियजनों की देखभाल और सहायता करें',
    iAmPatient: 'मैं मरीज़ हूँ (Patient)',
    patientDesc: 'आपकी व्यक्तिगत स्वास्थ्य यात्रा',
    helloGreeting: 'नमस्ते',
    takeSmallSteps: 'छोटे कदम उठाएं, बेहतर महसूस करें',
    patientId: 'मरीज़ आईडी',
    age: 'उम्र',
    bloodGroup: 'रक्त समूह',
    nextTask: 'अगला कार्य',
    viewSchedule: 'दैनिक दिनचर्या देखें',
    photos: 'तस्वीरें',
    photosDesc: 'अपनी यादें देखें',
    games: 'खेल',
    gamesDesc: 'खेलें और सक्रिय रहें',
    calm: 'शांति',
    calmDesc: 'सांस लें और विश्राम करें',
    calling: 'कॉलिंग',
    callingDesc: 'परिवार और करीबी संपर्क',
    medsRoutine: 'दवा / दिनचर्या',
    voiceNotes: 'वॉयस नोट्स',
    calmMusic: 'शांत संगीत',
    sosButton: 'आपातकालीन (SOS)',
    sosPrompt: 'मदद के लिए दबाएं',
    navHome: 'होम',
    navRoutine: 'दिनचर्या',
    navPhotos: 'तस्वीरें',
    navMore: 'अधिक',
    goodMorning: 'शुभ प्रभात',
    confirmTitle: 'दवा का समय',
    confirmVoicePrompt: 'नमस्ते आरव, यह आपकी सुबह की दवा लेने का समय है। क्या आप पुष्टि करना चाहते हैं?',
    yes: 'हाँ',
    no: 'नहीं',
    markCompleted: 'पूर्ण चिह्नित करें',
    snooze: '10 मिनट बाद',
    settings: 'सेटिंग्स',
    appPreferences: 'ऐप प्राथमिकताएं',
    language: 'भाषा',
    notifications: 'सूचनाएं',
    editDetails: 'विवरण संपादित करें',
    liveLocation: 'लाइव स्थान',
    homeLocation: 'घर का पता',
    quickCall: 'त्वरित कॉल',
    contacts: 'संपर्क',
    callNow: 'अभी कॉल करें',
    emergencyAlert: 'आपातकालीन चेतावनी',
    emergencyConfirmQuestion: 'क्या आपको सचमुच मदद चाहिए?',
    locationShared: 'स्थान साझा किया गया',
    sendVoiceNote: 'वॉयस नोट भेजें',
    voiceNoteSent: 'वॉयस नोट भेजा गया',
    ifNoResponseEscalate: '20 सेकंड में स्वचालित संपर्क',
    cancelEmergency: 'अलर्ट रद्द करें',
    caregiverDashboard: 'देखभालकर्ता डैशबोर्ड',
    aiOverview: 'AI सारांश',
    patientsOverview: 'मरीज़ों की सूची',
    dailyRoutineCompletion: 'दैनिक दिनचर्या पूर्णता',
    moodTracker: 'मूड ट्रैकर',
    great: 'शानदार',
    good: 'अच्छा',
    okay: 'ठीक',
    low: 'उदास',
    sad: 'दुखी',
    meetings: 'मुलाकातें',
    taskScheduler: 'शेड्यूलर',
    album: 'एल्बम',
    allGood: 'सब ठीक है',
    medsPending: 'दवा बाकी है',
    sosAlert: 'आपातकालीन अलर्ट (SOS)',
  }
};
