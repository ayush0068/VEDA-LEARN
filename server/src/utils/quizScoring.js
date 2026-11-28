// Scores quiz answers. Used only on the server, so the right answers never reach the browser before the attempt ends.

const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
const round2 = (n) => Math.round(n * 100) / 100;
const idOf = (v) => String(v && v._id ? v._id : v);

/** { correct, earned } for one question and the student's answer ({ selected: [optionId], text }) */
const scoreQuestion = (question, answer) => {
  const points = question.points || 1;
  if (!answer) return { correct: false, earned: 0 };

  if (question.type === 'short') {
    const given = norm(answer.text);
    const ok = Boolean(given) && (question.acceptedAnswers || []).some((a) => norm(a) === given);
    return { correct: ok, earned: ok ? points : 0 };
  }

  const right = new Set((question.options || []).filter((o) => o.correct).map(idOf));
  const valid = new Set((question.options || []).map(idOf));
  const picked = [...new Set((answer.selected || []).map(String))].filter((id) => valid.has(id));
  if (!picked.length || !right.size) return { correct: false, earned: 0 };

  const hit = picked.filter((id) => right.has(id)).length;
  const wrong = picked.length - hit;
  if (question.type === 'multiple') {
    // partial credit: every right pick earns a share, every wrong pick takes one away
    const earned = round2(points * Math.max(0, (hit - wrong) / right.size));
    return { correct: hit === right.size && wrong === 0, earned };
  }
  const ok = picked.length === 1 && hit === 1;
  return { correct: ok, earned: ok ? points : 0 };
};

const totalPoints = (quiz) => (quiz.questions || []).reduce((sum, q) => sum + (q.points || 1), 0);

/** scores a whole attempt: returns { answers (with correct / earned), score, total, percent, passed } */
const scoreAttempt = (quiz, given) => {
  const byQuestion = new Map((given || []).map((a) => [String(a.question), a]));
  const answers = [];
  let score = 0;
  (quiz.questions || []).forEach((q) => {
    const a = byQuestion.get(idOf(q));
    const res = scoreQuestion(q, a);
    score += res.earned;
    if (a && ((a.selected && a.selected.length) || norm(a.text))) {
      answers.push({ question: q._id, selected: (a.selected || []).map(String), text: String(a.text || '').slice(0, 500), correct: res.correct, earned: res.earned });
    }
  });
  const total = totalPoints(quiz);
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  return { answers, score: round2(score), total, percent, passed: percent >= (quiz.passPercent || 0) };
};

/** Fisher-Yates */
const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

module.exports = { norm, scoreQuestion, scoreAttempt, totalPoints, shuffle, idOf };