import express from 'express';
import { signup, confirm } from './signup.service';
import onboardingRepository from './repository/onboarding';

const authRouter = express.Router();
export default authRouter;

authRouter.post('/signup', async (req, res) => {
  const { name, email } = req.body;

  try {
    await signup(name, email);
    return res.status(201).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create user', error });
  }
});

authRouter.post('/confirm', async (req, res) => {
  const { email, code } = req.body;
  try {
    const tokens = await confirm(email, code);
    await onboardingRepository.deleteTempPassword(email);
    console.log(tokens);
    return res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to confirm user', error });
  }
});
