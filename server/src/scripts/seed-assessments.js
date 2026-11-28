const { connectDB, disconnectDB, getDbState } = require('../config/db');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');

// Usage:  node src/scripts/seed-assessments.js [course-slug]
// Adds ONE sample quiz and ONE sample assignment (both published) to a course so you can test the student experience.
// Without a slug it uses the first active course. Running it twice does not create duplicates.
const opt = (text, correct = false) => ({ text, correct });

const run = async () => {
  await connectDB();
  if (getDbState() !== 'connected') {
    console.error('[seed-assessments] Database is not connected. Check MONGODB_URI in server/.env');
    process.exit(1);
  }
  const slug = (process.argv[2] || '').trim().toLowerCase();
  const course = slug ? await Course.findOne({ slug }) : await Course.findOne({ isActive: true }).sort({ order: 1 });
  if (!course) {
    console.error(slug ? `[seed-assessments] No course with slug "${slug}".` : '[seed-assessments] No course found. Create a course first.');
    process.exit(1);
  }

  const quizTitle = 'Sample Quiz - Test Your Basics';
  if (await Quiz.findOne({ courseSlug: course.slug, title: quizTitle })) console.log('[seed-assessments] Sample quiz already exists - skipped.');
  else {
    await Quiz.create({
      courseSlug: course.slug,
      courseTitle: course.title,
      title: quizTitle,
      description: 'A short practice quiz to try out the quiz experience: all question types, a timer and instant results.',
      status: 'published',
      timeLimitMin: 5,
      passPercent: 60,
      maxAttempts: 0,
      shuffleQuestions: false,
      shuffleOptions: true,
      showAnswers: 'after_submit',
      questions: [
        { type: 'single', text: 'Which planet is known as Surya in Vedic astrology?', points: 2, explanation: 'Surya is the Sun, the king of the planets.', options: [opt('Sun', true), opt('Moon'), opt('Mars'), opt('Jupiter')] },
        { type: 'multiple', text: 'Which of these are considered natural benefics? (select all that apply)', points: 4, explanation: 'Jupiter, Venus, a strong Moon and Mercury are generally benefic.', options: [opt('Jupiter', true), opt('Venus', true), opt('Saturn'), opt('Rahu')] },
        { type: 'truefalse', text: 'The Moon is treated as a planet (graha) in Jyotish.', points: 1, explanation: 'Yes - both the Sun and the Moon are counted among the nine grahas.', options: [opt('True', true), opt('False')] },
        { type: 'short', text: 'Which planet is the lord of Aries (Mesha)?', points: 2, explanation: 'Mars (Mangal) rules Aries and Scorpio.', acceptedAnswers: ['Mars', 'Mangal', 'Kuja'] },
        { type: 'single', text: 'How many grahas are there in the Navagraha?', points: 1, explanation: 'Nine: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu and Ketu.', options: [opt('7'), opt('9', true), opt('12'), opt('27')] },
      ],
    });
    console.log(`[seed-assessments] Created quiz "${quizTitle}" in course "${course.title}".`);
  }

  const asgTitle = 'Sample Assignment - Write About Your Learning';
  if (await Assignment.findOne({ courseSlug: course.slug, title: asgTitle })) console.log('[seed-assessments] Sample assignment already exists - skipped.');
  else {
    await Assignment.create({
      courseSlug: course.slug,
      courseTitle: course.title,
      title: asgTitle,
      description: 'Write a short note (5-8 lines) about the most interesting thing you learnt in this course so far.\n\nYou may also attach a PDF or an image of your handwritten notes, and add a link if you like.',
      status: 'published',
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxPoints: 50,
      allowLate: true,
      submissionTypes: ['text', 'file', 'link'],
      maxFiles: 2,
      resources: [],
    });
    console.log(`[seed-assessments] Created assignment "${asgTitle}" (due in 7 days) in course "${course.title}".`);
  }
  console.log('[seed-assessments] Done. Enrolled students (or anyone, if the course is free) will see them under Quizzes & Assignments.');
};

run()
  .catch((err) => {
    console.error('[seed-assessments] Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB().then(() => process.exit()));