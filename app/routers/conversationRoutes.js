import express from 'express';
import {
  listConversations,
  openConversationWithUser,
  getMessages,
  markConversationRead,
  deleteConversation
} from '../controllers/conversationController.js';

const router = express.Router();

router.get('/', listConversations);
router.post('/open/:userId', openConversationWithUser);
router.post('/:conversationId/read', markConversationRead);
router.get('/:conversationId/messages', getMessages);
router.delete('/:conversationId', deleteConversation);

export default router;
