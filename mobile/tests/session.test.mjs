import test from 'node:test';
import assert from 'node:assert/strict';
const { parseLoad, remainingRest, counts, completionPayload } = await import(process.env.CFIT_TEST_SESSION);
const draft = () => ({
  submissionId: 'a-submission-id', startedAt: '2026-10-02T10:00:00Z', endedAt: '2026-10-02T10:20:00Z',
  workout: { exercises: [{ id: 'exercise-a', revision: '2026-10-02T09:00:00Z' }, { id: 'exercise-b', revision: '2026-10-02T09:00:00Z' }] },
  results: [{ id: 'exercise-a', completed: [true, true, true], load: '20,50' }, { id: 'exercise-b', completed: [true, true], load: '' }],
});
test('rest follows the deadline after background suspension rather than interval ticks', () => {
  assert.equal(remainingRest(160000, 100000), 60);
  assert.equal(remainingRest(160000, 130100), 30);
  assert.equal(remainingRest(160000, 190000), 0);
  assert.equal(remainingRest(null, 190000), 0);
});
test('load accepts decimal comma, zero and no load without accepting negative or malformed values', () => {
  assert.equal(parseLoad('20,50'), '20.50');
  assert.equal(parseLoad('0'), '0');
  assert.equal(parseLoad(' '), null);
  for (const value of ['-1', '1e3', 'NaN', 'Infinity', '100000', '1.234', '20kg', '1,2,3']) assert.throws(() => parseLoad(value));
});
test('incomplete or empty sessions cannot be sent as completed', () => {
  const value = draft();
  value.results[1].completed[0] = false;
  assert.deepEqual(counts(value), { total: 5, done: 4, complete: false });
  assert.throws(() => completionPayload(value));
  assert.equal(counts({ results: [] }).complete, false);
});
test('completion freezes identity and duration for retries and converts loads without changing draft', () => {
  const value = draft();
  const original = structuredClone(value);
  const first = completionPayload(value);
  assert.deepEqual(completionPayload(value), first);
  assert.equal(first.submission_id, value.submissionId);
  assert.equal(first.ended_at, value.endedAt);
  assert.equal(first.exercises[0].load, '20.50');
  assert.equal(first.exercises[1].load, null);
  assert.deepEqual(value, original);
});
