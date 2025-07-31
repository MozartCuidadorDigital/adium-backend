import express from 'express';
import totemController from '../controllers/totemController.js';

const router = express.Router();

/**
 * @route POST /api/totem/question
 * @desc Process a user question through the totem system
 * @access Public
 */
router.post('/question', totemController.processQuestion);

/**
 * @route GET /api/totem/questions
 * @desc Get predefined questions for the totem interface
 * @access Public
 */
router.get('/questions', totemController.getPredefinedQuestions);

/**
 * @route GET /api/totem/health
 * @desc Health check for totem services
 * @access Public
 */
router.get('/health', totemController.healthCheck);

/**
 * @route GET /api/totem/test
 * @desc Test endpoint for quick validation
 * @access Public
 */
router.get('/test', totemController.test);

export default router; 