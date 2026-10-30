/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Language, 
  UserRole, 
  PatientProfile, 
  TaskItem, 
  ContactItem 
} from './types';
import { db } from './services/db';
import { INITIAL_CONTACTS } from './data/initialData';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { RoleSelectionView } from './components/RoleSelectionView';
import { PatientDashboard } from './components/PatientDashboard';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { VoiceReminderModal } from './components/VoiceReminderModal';
import { PatientDetailsModal } from './components/PatientDetailsModal';
import { CallingModal } from './components/CallingModal';
import { SOSModal } from './components/SOSModal';
import { CalmBreathingModal } from './components/CalmBreathingModal';
import { BrainGamesModal } from './components/BrainGamesModal';
import { MusicPlayerModal } from './components/MusicPlayerModal';
import { VoiceNotesModal } from './components/VoiceNotesModal';
import { PhotoAlbumModal } from './components/PhotoAlbumModal';
import { DailyRoutineModal } from './components/DailyRoutineModal';
import { RoutineSchedulerModal } from './components/RoutineSchedulerModal';
import { MeetingsModal } from './components/MeetingsModal';
import { AddPatientModal } from './components/AddPatientModal';
import { MoodTrackerModal } from './components/MoodTrackerModal';
import { CalmCornerModal } from './components/CalmCornerModal';
import { MemoryLaneModal } from './components/MemoryLaneModal';
import { FamilyConnectModal } from './components/FamilyConnectModal';
import { SmartMedicationModal } from './components/SmartMedicationModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { AIVoiceCompanionModal } from './components/AIVoiceCompanionModal';
import { auth, onAuthStateChanged, FirebaseUser, UserProfileDocument } from './services/firebase';
import { authService } from './services/authService';

export default function App() {
  // Navigation & Authentication State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileDocument | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [userName, setUserName] = useState('Aarav Sharma');

  // Real-Time Database Synchronized State
  const [patients, setPatients] = useState<PatientProfile[]>(() => db.getPatients());
  const [activePatientId, setActivePatientId] = useState<string>('P-10482');
  const [tasks, setTasks] = useState<TaskItem[]>(() => db.getTasks());
  const [contacts, setContacts] = useState<ContactItem[]>(INITIAL_CONTACTS);

  // Active Modals & Dialogs State
  const [activeReminderTask, setActiveReminderTask] = useState<TaskItem | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCallingModal, setShowCallingModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showCalmBreathingModal, setShowCalmBreathingModal] = useState(false);
  const [showBrainGamesModal, setShowBrainGamesModal] = useState(false);
  const [showMusicPlayerModal, setShowMusicPlayerModal] = useState(false);
  const [showVoiceNotesModal, setShowVoiceNotesModal] = useState(false);
  const [showPhotoAlbumModal, setShowPhotoAlbumModal] = useState(false);
  const [showDailyRoutineModal, setShowDailyRoutineModal] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [showMeetingsModal, setShowMeetingsModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  
  // New Feature Modals
  const [showMoodTrackerModal, setShowMoodTrackerModal] = useState(false);
  const [showCalmCornerModal, setShowCalmCornerModal] = useState(false);
  const [showMemoryLaneModal, setShowMemoryLaneModal] = useState(false);
  const [showFamilyConnectModal, setShowFamilyConnectModal] = useState(false);
  const [showSmartMedicationModal, setShowSmartMedicationModal] = useState(false);
  const [showNotificationCenterModal, setShowNotificationCenterModal] = useState(false);
  const [showVoiceCompanionModal, setShowVoiceCompanionModal] = useState(false);

  // Active patient object
  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];
  const activePatientTasks = tasks.filter((t) => t.patientId === activePatient.id);

  // Global Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        setIsLoggedIn(true);

        try {
          const profile = await authService.getUserProfile(firebaseUser.uid);
          if (profile) {
            setUserProfile(profile);
            setUserRole(profile.role);
            if (profile.preferredLanguage) {
              setLanguage(profile.preferredLanguage);
            }
            if (profile.fullName) {
              setUserName(profile.fullName);
            }
            if (profile.patientId) {
              setActivePatientId(profile.patientId);
            }
          } else {
            setUserName(firebaseUser.displayName || 'MindCare User');
          }
        } catch (err) {
          console.warn('Could not fetch Firestore user profile:', err);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsLoggedIn(false);
        setUserRole(null);
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time store events
  useEffect(() => {
    const unsubscribe = db.subscribe((event) => {
      setPatients(db.getPatients());
      setTasks(db.getTasks());
    });
    return () => unsubscribe();
  }, []);

  // Unread Emergency / High Priority Alerts Count
  const unreadAlertCount = patients.filter((p) => p.status === 'sos_alert').length;

  // Handlers
  const handleLoginSuccess = (user: FirebaseUser, profile: UserProfileDocument) => {
    setCurrentUser(user);
    setUserProfile(profile);
    setIsLoggedIn(true);
    setUserRole(profile.role);
    setLanguage(profile.preferredLanguage);
    setUserName(profile.fullName || user.displayName || 'MindCare User');
    if (profile.patientId) {
      setActivePatientId(profile.patientId);
    }
  };

  const handleSelectRole = (role: UserRole) => {
    setUserRole(role);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setCurrentUser(null);
    setUserProfile(null);
    setIsLoggedIn(false);
    setUserRole(null);
  };

  // Real-time task synchronization handlers
  const handleConfirmTask = (taskId: string) => {
    db.updateTaskStatus(taskId, 'completed', true);
  };

  const handleSnoozeTask = (taskId: string) => {
    db.updateTaskStatus(taskId, 'snoozed', true);
  };

  const handleToggleTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (target) {
      db.updateTaskStatus(taskId, target.completed ? 'upcoming' : 'completed', true);
    }
  };

  const handleAddTask = (newTask: TaskItem) => {
    db.createTask(newTask);
  };

  const handleDeleteTask = (taskId: string) => {
    db.deleteTask(taskId);
  };

  const handleTriggerCaregiverAlert = (location: string, voiceNote: boolean) => {
    db.triggerSOS(activePatient.id);
  };

  const handleResolveSos = (patientId: string) => {
    db.resolveSOS(patientId);
  };

  const handleUpdatePatient = (updated: PatientProfile) => {
    db.updatePatient(updated);
  };

  const handleAddPatient = (newPatient: PatientProfile) => {
    db.addPatient(newPatient);
    setActivePatientId(newPatient.id);
  };

  const handleAddContact = (newContact: ContactItem) => {
    setContacts((prev) => [...prev, newContact]);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#F8F7F0] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-[#A8C9B0] flex items-center justify-center shadow-lg text-[#2D4F3B] mb-4 animate-pulse">
          <svg className="w-9 h-9" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.5,3 C17.5,3 15.2,5.3 14,8.5 C12.8,11.7 13.5,14 13.5,14 C13.5,14 11.2,13.3 8,14.5 C4.8,15.7 2.5,18 2.5,18 C2.5,18 4.8,20.3 8,19.1 C11.2,17.9 11.9,15.6 11.9,15.6 C11.9,15.6 14.2,16.3 17.4,15.1 C20.6,13.9 22.9,11.6 22.9,11.6 C22.9,11.6 20.6,9.3 17.4,10.5 C14.2,11.7 13.5,14 13.5,14 C13.5,14 14.2,11.7 15.4,8.5 C16.6,5.3 17.5,3 17.5,3 Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">MindCare</h2>
        <p className="text-xs text-[#3B664B] mt-1 font-medium">Connecting to secure health records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F0] text-[#263238] flex flex-col selection:bg-[#A8C9B0]/30 selection:text-[#263238]">
      
      {/* 1. Login View (Screen 1) */}
      {!isLoggedIn && (
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}

      {/* 2. Role Selection View (Screen 2) */}
      {isLoggedIn && !userRole && (
        <>
          <Navbar
            currentRole={null}
            onRoleSwitch={() => {}}
            language={language}
            onLanguageChange={setLanguage}
            onOpenSettings={() => setShowSettingsModal(true)}
            unreadAlertCount={unreadAlertCount}
            onLogout={handleLogout}
          />
          <RoleSelectionView
            onSelectRole={handleSelectRole}
            language={language}
          />
        </>
      )}

      {/* 3. Patient Interface (Section 2, 3, 4, 5) */}
      {isLoggedIn && userRole === 'patient' && (
        <>
          <Navbar
            currentRole="patient"
            onRoleSwitch={(role) => setUserRole(role)}
            language={language}
            onLanguageChange={setLanguage}
            onOpenSettings={() => setShowSettingsModal(true)}
            unreadAlertCount={unreadAlertCount}
            onViewAlerts={() => setShowSOSModal(true)}
            onOpenVoiceNotes={() => setShowVoiceNotesModal(true)}
            onLogout={handleLogout}
            activePatientName={activePatient.name}
            activePatientId={activePatient.id}
          />
          <main className="flex-1">
            <PatientDashboard
              patient={activePatient}
              tasks={activePatientTasks}
              language={language}
              onOpenPhotos={() => setShowMemoryLaneModal(true)}
              onOpenGames={() => setShowBrainGamesModal(true)}
              onOpenCalm={() => setShowCalmCornerModal(true)}
              onOpenCalling={() => setShowFamilyConnectModal(true)}
              onOpenRoutine={() => setShowDailyRoutineModal(true)}
              onOpenVoiceNotes={() => setShowVoiceNotesModal(true)}
              onOpenMusic={() => setShowMusicPlayerModal(true)}
              onOpenSOS={() => setShowSOSModal(true)}
              onOpenMoodTracker={() => setShowMoodTrackerModal(true)}
              onOpenMemoryLane={() => setShowMemoryLaneModal(true)}
              onOpenCalmCorner={() => setShowCalmCornerModal(true)}
              onOpenMedicationTracker={() => setShowSmartMedicationModal(true)}
              onOpenFamilyConnect={() => setShowFamilyConnectModal(true)}
              onOpenTaskReminder={(task) => setActiveReminderTask(task)}
              onConfirmTask={handleConfirmTask}
              onSnoozeTask={handleSnoozeTask}
              onOpenSettings={() => setShowSettingsModal(true)}
              onOpenVoiceCompanion={() => setShowVoiceCompanionModal(true)}
            />
          </main>
        </>
      )}

      {/* 4. Caregiver Interface (Sections 6, 7, 8, 9, 10, 14, 15, 16) */}
      {isLoggedIn && userRole === 'caregiver' && (
        <>
          <Navbar
            currentRole="caregiver"
            onRoleSwitch={(role) => setUserRole(role)}
            language={language}
            onLanguageChange={setLanguage}
            onOpenSettings={() => setShowSettingsModal(true)}
            unreadAlertCount={unreadAlertCount}
            onViewAlerts={() => setShowNotificationCenterModal(true)}
            onOpenVoiceNotes={() => setShowVoiceNotesModal(true)}
            onLogout={handleLogout}
          />
          <main className="flex-1">
            <CaregiverDashboard
              patients={patients}
              activePatient={activePatient}
              onSelectPatient={(p) => setActivePatientId(p.id)}
              tasks={activePatientTasks}
              language={language}
              onCallPatient={(p) => {
                setActivePatientId(p.id);
                setShowCallingModal(true);
              }}
              onOpenScheduler={() => setShowSchedulerModal(true)}
              onOpenMeetings={() => setShowMeetingsModal(true)}
              onOpenAlbum={() => setShowMemoryLaneModal(true)}
              onOpenSettings={() => setShowSettingsModal(true)}
              onOpenNotifications={() => setShowNotificationCenterModal(true)}
              onOpenVoiceNotes={() => setShowVoiceNotesModal(true)}
              onAddPatient={() => setShowAddPatientModal(true)}
              onResolveSos={handleResolveSos}
              onViewSosModal={() => setShowSOSModal(true)}
            />
          </main>
        </>
      )}

      {/* ================= ALL MODALS & INTERACTIVE OVERLAYS ================= */}

      {/* Mood Tracker Modal (Section 3) */}
      <MoodTrackerModal
        isOpen={showMoodTrackerModal}
        onClose={() => setShowMoodTrackerModal(false)}
        patientId={activePatient.id}
        patientName={activePatient.name}
        language={language}
      />

      {/* Calm Corner Modal (Section 4) */}
      <CalmCornerModal
        isOpen={showCalmCornerModal}
        onClose={() => setShowCalmCornerModal(false)}
        language={language}
      />

      {/* Memory Lane Modal (Section 11) */}
      <MemoryLaneModal
        isOpen={showMemoryLaneModal}
        onClose={() => setShowMemoryLaneModal(false)}
        canUpload={true}
        language={language}
      />

      {/* Family Connect Modal (Section 12) */}
      <FamilyConnectModal
        isOpen={showFamilyConnectModal}
        onClose={() => setShowFamilyConnectModal(false)}
        onStartCall={(c) => setShowCallingModal(true)}
      />

      {/* Smart Medication Tracker (Section 13) */}
      <SmartMedicationModal
        isOpen={showSmartMedicationModal}
        onClose={() => setShowSmartMedicationModal(false)}
        patientId={activePatient.id}
      />

      {/* Notification Center (Section 15) */}
      <NotificationCenterModal
        isOpen={showNotificationCenterModal}
        onClose={() => setShowNotificationCenterModal(false)}
        userRole={userRole}
      />

      {/* Voice Reminder & Push Notification Dialog (Screen 5) */}
      {activeReminderTask && (
        <VoiceReminderModal
          task={activeReminderTask}
          isOpen={!!activeReminderTask}
          onClose={() => setActiveReminderTask(null)}
          onConfirmTask={handleConfirmTask}
          onSnoozeTask={handleSnoozeTask}
          patientName={activePatient.name}
          language={language}
        />
      )}

      {/* Patient Details & Settings (Screen 4) */}
      <PatientDetailsModal
        patient={activePatient}
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onUpdatePatient={handleUpdatePatient}
        language={language}
        onLanguageChange={setLanguage}
        onLogout={handleLogout}
      />

      {/* Calling Screen & Simulator (Screen 8) */}
      <CallingModal
        isOpen={showCallingModal}
        onClose={() => setShowCallingModal(false)}
        contacts={contacts}
        language={language}
        onAddContact={handleAddContact}
      />

      {/* SOS Emergency Flow with Live Location Tracking (Sections 5 & 10) */}
      <SOSModal
        isOpen={showSOSModal}
        onClose={() => setShowSOSModal(false)}
        patient={activePatient}
        language={language}
        onTriggerCaregiverAlert={handleTriggerCaregiverAlert}
      />

      {/* Calm & Breathing Exercise */}
      <CalmBreathingModal
        isOpen={showCalmBreathingModal}
        onClose={() => setShowCalmBreathingModal(false)}
        language={language}
      />

      {/* Brain Games (Memory Cards & Trivia) */}
      <BrainGamesModal
        isOpen={showBrainGamesModal}
        onClose={() => setShowBrainGamesModal(false)}
        language={language}
        patientName={activePatient.name}
      />

      {/* Spotify Calming Music Player (Screen 10) */}
      <MusicPlayerModal
        isOpen={showMusicPlayerModal}
        onClose={() => setShowMusicPlayerModal(false)}
      />

      {/* Voice Notes Messenger (Bidirectional Audio between Caretaker & Patient) */}
      <VoiceNotesModal
        isOpen={showVoiceNotesModal}
        onClose={() => setShowVoiceNotesModal(false)}
        activePatient={activePatient}
        currentRole={userRole || 'patient'}
        currentUserName={userRole === 'caregiver' ? 'Priya Sharma (Caregiver)' : activePatient.name}
        language={language}
      />

      {/* AI Voice Companion Modal (Full Voice Guidance & Commands) */}
      <AIVoiceCompanionModal
        isOpen={showVoiceCompanionModal}
        onClose={() => setShowVoiceCompanionModal(false)}
        patient={activePatient}
        tasks={activePatientTasks}
        language={language}
        onLanguageChange={setLanguage}
        onOpenRoutine={() => setShowDailyRoutineModal(true)}
        onOpenMedicationTracker={() => setShowSmartMedicationModal(true)}
        onOpenCalling={() => setShowFamilyConnectModal(true)}
        onOpenPhotos={() => setShowMemoryLaneModal(true)}
        onOpenBreathing={() => setShowCalmCornerModal(true)}
        onOpenMusic={() => setShowMusicPlayerModal(true)}
        onTriggerSOS={() => setShowSOSModal(true)}
        onSnoozeTask={handleSnoozeTask}
      />

      {/* Photo Album Memories */}
      <PhotoAlbumModal
        isOpen={showPhotoAlbumModal}
        onClose={() => setShowPhotoAlbumModal(false)}
        canAddPhoto={true}
      />

      {/* Daily Routine Full List */}
      <DailyRoutineModal
        isOpen={showDailyRoutineModal}
        onClose={() => setShowDailyRoutineModal(false)}
        tasks={activePatientTasks}
        onToggleTask={handleToggleTask}
        onSnoozeTask={handleSnoozeTask}
        language={language}
      />

      {/* Caregiver Task Scheduler */}
      <RoutineSchedulerModal
        isOpen={showSchedulerModal}
        onClose={() => setShowSchedulerModal(false)}
        tasks={activePatientTasks}
        activePatient={activePatient}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Meetings & Visits */}
      <MeetingsModal
        isOpen={showMeetingsModal}
        onClose={() => setShowMeetingsModal(false)}
        activePatient={activePatient}
      />

      {/* Add New Patient */}
      <AddPatientModal
        isOpen={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        onAddPatient={handleAddPatient}
        existingCount={patients.length}
      />

    </div>
  );
}
