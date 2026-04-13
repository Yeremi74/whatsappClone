import express from 'express';
import {
  listConversations,
  openConversationWithUser,
  getMessages,
  markConversationRead
} from '../controllers/conversationController.js';

const router = express.Router();

router.get('/', listConversations);
router.post('/open/:userId', openConversationWithUser);
router.post('/:conversationId/read', markConversationRead);
router.get('/:conversationId/messages', getMessages);

export default router;
