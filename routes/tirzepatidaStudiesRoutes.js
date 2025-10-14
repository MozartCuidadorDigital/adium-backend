import express from 'express';
import tirzepatidaStudiesController from '../controllers/tirzepatidaStudiesController.js';

const router = express.Router();

/**
 * @route POST /api/tirzepatida-studies/question
 * @desc Process a tirzepatida study question (SURPASS/SURMOUNT)
 * @access Public
 */
router.post('/question', tirzepatidaStudiesController.processStudyQuestion);

/**
 * @route GET /api/tirzepatida-studies/questions
 * @desc Get all tirzepatida studies questions
 * @access Public
 */
router.get('/questions', tirzepatidaStudiesController.getStudiesQuestions);

/**
 * @route GET /api/tirzepatida-studies/cache-stats
 * @desc Get audio cache statistics
 * @access Public
 */
router.get('/cache-stats', tirzepatidaStudiesController.getCacheStats);

/**
 * @route POST /api/tirzepatida-studies/preload-audios
 * @desc Preload all audios in the background
 * @access Public
 */
router.post('/preload-audios', tirzepatidaStudiesController.preloadAudios);

/**
 * @route DELETE /api/tirzepatida-studies/cache
 * @desc Clear audio cache
 * @access Public
 */
router.delete('/cache', tirzepatidaStudiesController.clearCache);

/**
 * @route GET /api/tirzepatida-studies/health
 * @desc Health check for tirzepatida studies service
 * @access Public
 */
router.get('/health', tirzepatidaStudiesController.healthCheck);

export default router;

