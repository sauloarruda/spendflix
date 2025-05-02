import express, { Router } from 'express';

import { components } from '../types/api';
import onboardingRepository from '../repository/onboarding.repository';
import getLogger from '../../lib/logger';

const onboardingLogger = getLogger().child({ module: 'onboarding' });

export type OnboardingData = components['schemas']['OnboardingData'];

const onboardingRouter: Router = express.Router();
export default onboardingRouter;

onboardingRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  onboardingLogger.info({ id }, 'Received get onboarding request');

  try {
    const onboarding = await onboardingRepository.find(id);

    if (!onboarding) {
      onboardingLogger.info({ id }, 'Onboarding not found');
      return res.status(404).send();
    }

    onboardingLogger.debug({ id, onboarding }, 'Onboarding data retrieved successfully');
    return res.status(200).json(onboarding.data as unknown as OnboardingData);
  } catch (error) {
    onboardingLogger.error({ error, id }, 'Error getting onboarding data');
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to get onboarding data',
    });
  }
});

onboardingRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body as Partial<OnboardingData>;
  onboardingLogger.info({ id, data }, 'Received update onboarding request');

  try {
    onboardingRepository.update(id, data as OnboardingData);
    onboardingLogger.info({ id }, 'Onboarding data updated successfully');
    return res.status(204).end();
  } catch (error) {
    onboardingLogger.error({ error, id }, 'Error updating onboarding data');
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update onboarding data',
    });
  }
});
