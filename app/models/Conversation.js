import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    users: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        required: true
    },
    messages: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Message',
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
