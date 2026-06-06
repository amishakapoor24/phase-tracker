const Joi = require('joi');

// Validation schemas
const schemas = {
  // Auth validation
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(50).required(),
    house: Joi.string().trim().lowercase().required(),
    role: Joi.string().valid('student', 'mentor', 'admin').default('student'),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Phase validation
  createPhase: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).allow(''),
    icon: Joi.string().max(20).allow(''),
    order: Joi.number().default(0),
  }),

  // Sub-phase validation
  createSubPhase: Joi.object({
    id: Joi.string().required(),
    title: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).allow(''),
    order: Joi.number().required(),
  }),

  // Approval response validation
  approvalResponse: Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    approvalMessage: Joi.string().max(500).allow(''),
  }),

  // Submission validation
  submission: Joi.object({
    submissionMessage: Joi.string().max(500).allow(''),
    githubLink: Joi.string().uri().allow(''),
    deploymentLink: Joi.string().uri().allow(''),
    videoLink: Joi.string().uri().allow(''),
  }),
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = {};
      error.details.forEach((detail) => {
        errors[detail.path[0]] = detail.message;
      });

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  schemas,
  validate,
};
