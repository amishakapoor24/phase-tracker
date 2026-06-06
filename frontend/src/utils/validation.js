import Joi from 'joi';

// Validation schemas
export const schemas = {
  // Auth validation
  register: Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 50 characters',
    }),
    email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
    }),
    password: Joi.string().min(6).max(50).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
    }),
    house: Joi.string().trim().required().messages({
      'string.empty': 'Please select a house',
    }),
    role: Joi.string().valid('student', 'mentor', 'admin').default('student'),
  }),

  login: Joi.object({
    email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required',
    }),
  }),

  // Phase validation
  phase: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'Phase ID is required',
    }),
    name: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'Phase name is required',
      'string.min': 'Phase name must be at least 2 characters',
    }),
    description: Joi.string().max(500).allow('').messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
    icon: Joi.string().max(20).allow(''),
  }),

  // Sub-phase validation
  subPhase: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'Sub-phase ID is required',
    }),
    title: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'Sub-phase title is required',
      'string.min': 'Title must be at least 2 characters',
    }),
    description: Joi.string().max(500).allow('').messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
    order: Joi.number().required().messages({
      'number.base': 'Order must be a number',
    }),
  }),

  // Submission validation
  submission: Joi.object({
    submissionMessage: Joi.string().max(500).allow('').messages({
      'string.max': 'Message must not exceed 500 characters',
    }),
    githubLink: Joi.string().uri().allow('').messages({
      'string.uri': 'Please enter a valid GitHub URL',
    }),
    deploymentLink: Joi.string().uri().allow('').messages({
      'string.uri': 'Please enter a valid deployment URL',
    }),
    videoLink: Joi.string().uri().allow('').messages({
      'string.uri': 'Please enter a valid video URL',
    }),
  }),

  // Approval feedback validation
  feedback: Joi.object({
    approvalMessage: Joi.string().max(500).required().messages({
      'string.empty': 'Feedback is required',
      'string.max': 'Feedback must not exceed 500 characters',
    }),
  }),
};

// Validate function
export const validate = (data, schema) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = {};
    error.details.forEach((detail) => {
      errors[detail.path[0]] = detail.message;
    });
    return { errors, isValid: false };
  }

  return { errors: {}, isValid: true, value };
};

// Validate single field
export const validateField = (fieldName, fieldValue, schema) => {
  const fieldSchema = Joi.object({ [fieldName]: schema });
  const { error } = fieldSchema.validate({ [fieldName]: fieldValue }, { abortEarly: false });

  if (error) {
    return error.details[0].message;
  }

  return null;
};
