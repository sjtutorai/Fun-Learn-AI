# FUNLEARN AI — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Owner-Only Private Data**: `/users/{uid}` and all subcollections (`gameProgress`, `achievements`, `dailyChallenges`, `rewards`) are readable and writable strictly by `request.auth.uid == uid` with verified email (`request.auth.token.email_verified == true`).
2. **PII Isolation & Child Safety**: Public collections (`/leaderboard/{uid}`, `/friendCodes/{code}`) never store emails, real names, phone numbers, or free-text messages—only approved nicknames (2–24 chars), avatar IDs, level, XP, and badge counts.
3. **Immutable Rewards & Terminal States**: `/users/{uid}/rewards/{rewardId}` cannot be updated or deleted once created (preventing duplicate reward claims for the same challenge). `/friendRequests/{requestId}` cannot be modified once status reaches `accepted` or `declined`.
4. **No Self-Friending or Spoofing**: In `/friendRequests/{requestId}`, `fromUid == request.auth.uid` and `fromUid != toUid`. Only `toUid` may transition `status` from `pending` to `accepted` or `declined`.
5. **High-Five Safety**: `/highFives/{highFiveId}` permits only enum `cheerType` values (`high_five`, `awesome_job`, `keep_going`) and forbids custom message strings.
6. **Master Gate**: Subcollections under `/users/{uid}/...` verify parent `/users/{uid}` exists via `exists()` before creating child records.
7. **Strict Timestamps & Size Limits**: Every string has explicit `.size()` bounds; every document ID uses `isValidId()`; `createdAt`/`updatedAt` require `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Cross-User Profile Read**: User B attempts `get(/users/userA)` -> DENIED.
2. **Shadow Field Injection on Profile**: User A writes `{ ..., isAdmin: true }` to `/users/userA` -> DENIED (`hasOnly`).
3. **Unverified Email Write**: Auth token with `email_verified: false` attempts write to `/users/userA` -> DENIED.
4. **Oversized Document ID Poisoning**: Write to `/users/userA/rewards/<200-char-id>` -> DENIED (`isValidId`).
5. **Duplicate/Mutable Reward Tampering**: User A attempts `update` on `/users/userA/rewards/card_1` -> DENIED (`allow update: if false`).
6. **Direct Message Injection in High-Five**: Payload includes `message: "meet me at..."` in `/highFives/hf_1` -> DENIED (`hasOnly`).
7. **Friend Request Identity Spoofing**: User B creates `/friendRequests/req_1` with `fromUid: "userA"` -> DENIED (`fromUid == request.auth.uid`).
8. **Self-Accepting Friend Request**: Sender (`fromUid`) attempts to update `status` to `"accepted"` -> DENIED (only `toUid` can accept).
9. **Terminal State Rollback**: User updates `status` from `"declined"` back to `"pending"` -> DENIED (`existing().status == 'pending'`).
10. **Leaderboard Opt-Out Scraping**: Query listing `/leaderboard` docs where `optedIn == false` -> DENIED (`resource.data.optedIn == true`).
11. **XP Value Poisoning**: Writing `xp: "999999"` (string) or negative `xp: -50` to `/users/userA` -> DENIED (`is int && >= 0`).
12. **Client Timestamp Forgery**: Creating `/users/userA/rewards/r1` with backdated `createdAt` instead of `request.time` -> DENIED.
