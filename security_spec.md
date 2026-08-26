# Security Specification - PerioDash Pro

## 1. Data Invariants & Security Architecture
- **Authentication**: Every clinical Firestore operation requires authenticated access (`request.auth != null`).
- **Identity & Access**: Patients and appointments can only be read, modified, and listed by authenticated clinical users or verified patient sessions.
- **Resource Integrity**: Document IDs must adhere to standard alphanumeric identifier constraints (`isValidId`). String fields have strict size boundaries to prevent denial-of-wallet / resource exhaustion attacks.
- **Global Safety Net**: Default deny-all catch-all rule `match /{document=**} { allow read, write: if false; }`.

## 2. The "Dirty Dozen" Threat Scenarios
1. **Unauthenticated Public Read**: Anonymous attacker attempts `GET /patients/pat-123` without auth token -> Denied.
2. **Unauthenticated Public Write**: Anonymous attacker attempts `POST /patients` -> Denied.
3. **Malicious Oversized Document ID**: Attacker sends a 5KB path identifier in document key -> Denied by `isValidId`.
4. **Denial-of-Wallet Payload**: Attacker tries writing a 10MB nested string into `name` or `treatmentPlan` -> Denied by size constraints.
5. **Ghost Field Poisoning**: Attacker injects arbitrary unexpected system fields into Patient record -> Denied by schema validation.
6. **Appointment Spoofing Without Required Keys**: Attacker attempts to create an appointment missing `patientId` or `status` -> Denied by `isValidAppointment`.
7. **Cross-Tenant IDOR Traversal**: Attacker queries patient files using unverified keys -> Protected by authenticated query and verification rules.
8. **Public Write on Appointments**: Unauthenticated actor attempts modifying appointment status -> Denied.
9. **Corrupted Data Types**: Attacker submits numeric value for `patientName` or boolean for `id` -> Denied by type checks.
10. **Arbitrary Collection Creation**: Attacker attempts `POST /malicious_collection/doc1` -> Denied by default-deny catch-all.
11. **API Key Scraping**: Firebase configuration is protected by Firestore Rules enforcement.
12. **AI Proxy Flood Attack**: Unmetered access to `/api/dentito` -> Protected by server rate-limiter and payload size limits.
