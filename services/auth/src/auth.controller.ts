import express from 'express';
import signup from './signup.service';

const authRouter = express.Router();
export default authRouter;

authRouter.post('/signup', async (req, res) => {
  const { name, email } = req.body;

  try {
    const response = await signup(name, email);
    return res.status(201).json({ message: 'User created', userId: response.User?.Username });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create user', error });
  }
});
