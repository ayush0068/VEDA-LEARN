const { getDbState } = require('../config/db');
const service = require('../services/assessmentAdmin.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const bodyOf = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});

const handler = (fn, status = 200) =>
  asyncHandler(async (req, res) => {
    if (getDbState() !== 'connected') throw new ApiError(503, 'Database unavailable');
    const data = await fn(req);
    res.set('Cache-Control', 'no-store');
    res.status(status).json({ success: true, data });
  });

module.exports = {
  courses: handler(() => service.listCourses()),
  overview: handler(() => service.getOverview()),

  listQuizzes: handler((req) => service.listQuizzes(req.query)),
  getQuiz: handler((req) => service.getQuiz(req.params.id)),
  createQuiz: handler((req) => service.createQuiz(bodyOf(req), req.user), 201),
  updateQuiz: handler((req) => service.updateQuiz(req.params.id, bodyOf(req))),
  deleteQuiz: handler((req) => service.deleteQuiz(req.params.id)),
  duplicateQuiz: handler((req) => service.duplicateQuiz(req.params.id, req.user), 201),
  quizAnalytics: handler((req) => service.getQuizAnalytics(req.params.id)),

  listAssignments: handler((req) => service.listAssignments(req.query)),
  getAssignment: handler((req) => service.getAssignment(req.params.id)),
  createAssignment: handler((req) => service.createAssignment(bodyOf(req), req.user), 201),
  updateAssignment: handler((req) => service.updateAssignment(req.params.id, bodyOf(req))),
  deleteAssignment: handler((req) => service.deleteAssignment(req.params.id)),
  duplicateAssignment: handler((req) => service.duplicateAssignment(req.params.id, req.user), 201),
  submissions: handler((req) => service.listSubmissions(req.params.id)),
  grade: handler((req) => service.gradeSubmission(req.params.id, bodyOf(req), req.user)),
};