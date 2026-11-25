import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const draftPath = path.resolve(process.cwd(), 'DRAFT_firestore.rules');

test('Firestore security rules enforce the Eight Pillars and child-safety invariants', () => {
  const target = fs.existsSync(rulesPath) ? rulesPath : draftPath;
  const rules = fs.readFileSync(target, 'utf8');

  // Pillar 0: Default deny safety net
  assert.match(rules, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);

  // Pillar 2 & 3: ID hardening & verified emails
  assert.match(rules, /function isValidId\(id\)/);
  assert.match(rules, /request\.auth\.token\.email_verified == true/);

  // Pillar 6: PII isolation & child-safe leaderboard opt-in
  assert.match(rules, /match \/leaderboard\/\{uid\}/);
  assert.match(rules, /resource\.data\.optedIn == true/);

  // Immutable rewards & no XP deduction
  assert.match(rules, /incoming\(\)\.xp >= existing\(\)\.xp/);
  assert.match(rules, /match \/rewards\/\{rewardId\}[\s\S]*?allow update: if false;/);

  // Friend system safety: no free-text messages, no self-friending, terminal state lock
  assert.match(rules, /match \/friendCodes\/\{code\}[\s\S]*?allow list: if false;/);
  assert.match(rules, /data\.fromUid != data\.toUid/);
  assert.match(rules, /data\.cheerType in \['high_five', 'awesome_job', 'keep_going'\]/);
  assert.match(rules, /existing\(\)\.status == 'pending'/);
});
