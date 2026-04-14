import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
   conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
   },
   senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
   },
   content: {
    type: String,
    required: true
   },
   readBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
   },
   attachments: {
    type: [String],
    default: []
   },
   edited: {
    type: Boolean,
    default: false
   },
   deleted: {
    type: Boolean,
    default: false
   },
   createdAt: {
    type: Date,
    default: Date.now
   },
   updatedAt: {
    type: Date,
    default: Date.now
   },
   kind: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
   }
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
