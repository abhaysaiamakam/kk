# MindCare Security Specification & Test Matrix

## 1. Data Invariants
1. **User Identity & Isolation**: A user can only access and update their own document at `/users/{uid}` where `request.auth.uid == uid`. Users cannot escalate or change their `role` field on updates.
2. **Patient Data Privacy**: Only authenticated users who are either the linked patient (`uid == patient.id` or `uid == patient.userId`) or an authorized caregiver (`request.auth.uid in patient.caregiverIds` or `request.auth.uid == patient.caregiverId`) can read or modify patient records.
3. **Task & Medication Integrity**: Tasks must be bound to a valid `patientId`. Only authorized caregivers or the patient themselves may read or update task statuses.
4. **No Blanket Reads**: Every query must evaluate identity against `request.auth.uid` or an authorized relation. Unauthenticated access is denied across all documents.
5. **Immutable Identifiers**: `id`, `uid`, `createdAt` are immutable after creation.

## 2. The Dirty Dozen Attack Payloads (Must Return PERMISSION_DENIED)
1. **Payload 1 (Ghost Field / Shadow Update)**: Unprivileged user sends `{ "isAdmin": true, "role": "admin" }` to `/users/{uid}`.
2. **Payload 2 (PII Snooping)**: User A attempts `get` on `/users/{userB_uid}`.
3. **Payload 3 (Unauthenticated Read)**: Unauthenticated visitor attempts `list` on `/patients`.
4. **Payload 4 (Patient Impersonation)**: Attacker attempts to create task on `/tasks/{taskId}` with foreign `patientId` without caregiver link.
5. **Payload 5 (ID Poisoning)**: Write attempt with a 50KB junk character document ID.
6. **Payload 6 (State Shortcutting)**: Arbitrary caller sets SOS alert to `resolved` without authentication.
7. **Payload 7 (Role Escalation)**: Patient updates own profile setting `role: "caregiver"`.
8. **Payload 8 (Voice Note Interception)**: Unrelated user tries to read voice notes belonging to another patient.
9. **Payload 9 (Blanket Scraping)**: Client sends query `where('completed', '==', false)` on `/tasks` without scoping by `patientId`.
10. **Payload 10 (Created Timestamp Spoofing)**: Client creates a task with a backdated or future `createdAt` string instead of valid format.
11. **Payload 11 (Oversized Payload Denial of Wallet)**: Client attempts to write a 1MB string into `notes` or `transcription`.
12. **Payload 12 (Cross-Tenant Caregiver Access)**: Caregiver of Patient X attempts to read medical tasks of Patient Y.
