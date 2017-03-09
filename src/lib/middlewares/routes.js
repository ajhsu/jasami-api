import { Router } from 'express';
import healthCheck from './health-check';
import favicon from './favicon';
import meal from './meal';

const router = Router();

router.route('/health').get(healthCheck);
router.route('/favicon.ico').get(favicon);
router.route('*').get(meal);

export default router;
