import express from 'express';
import {
  createFriendRequest,
  getReceivedFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequestStatus,
  getFriends,
  cancelFriendRequest
} from '../controllers/friendRequestController.js';

const router = express.Router();

router.post('/', createFriendRequest);
router.get('/received', getReceivedFriendRequests);
router.get('/friends', getFriends);
router.get('/status/:userId', getFriendRequestStatus);
router.delete('/:requestId', cancelFriendRequest);
router.put('/:requestId/accept', acceptFriendRequest);
router.put('/:requestId/reject', rejectFriendRequest);

export default router;
