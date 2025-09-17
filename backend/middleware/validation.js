const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    const errorMessages = errors.array().map(error => `${error.path}: ${error.msg}`).join(', ');
    return res.status(400).json({
      error: `Validation failed: ${errorMessages}`,
      details: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('first_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('last_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('role')
    .isIn(['investor', 'project_owner'])
    .withMessage('Role must be either "investor" or "project_owner"'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
  handleValidationErrors
];

// Project creation validation
const validateProjectCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Project title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Project description must be between 50 and 2000 characters'),
  body('funding_goal')
    .isFloat({ min: 1000, max: 10000000 })
    .withMessage('Funding goal must be between $1,000 and $10,000,000'),
  body('industry')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Project industry is required'),
  body('location')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project location is required'),
  body('team_size')
    .isInt({ min: 1, max: 100 })
    .withMessage('Team size must be between 1 and 100'),
  handleValidationErrors
];

// Investment validation
const validateInvestment = [
  body('project_id')
    .isInt({ min: 1 })
    .withMessage('Valid project ID is required'),
  body('amount')
    .isFloat({ min: 100, max: 1000000 })
    .withMessage('Investment amount must be between $100 and $1,000,000'),
  handleValidationErrors
];

// User update validation
const validateUserUpdate = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

// Project update validation
const validateProjectUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Project title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Project description must be between 50 and 2000 characters'),
  body('funding_goal')
    .optional()
    .isFloat({ min: 1000, max: 10000000 })
    .withMessage('Funding goal must be between $1,000 and $10,000,000'),
  body('industry')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Project industry is required'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project location is required'),
  body('team_size')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Team size must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProjectCreation,
  validateInvestment,
  validateUserUpdate,
  validateProjectUpdate,
  handleValidationErrors
};