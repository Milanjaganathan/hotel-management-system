const express = require('express');
const router = express.Router();
const {
    getRooms,
    getRoomById,
    addRoom,
    updateRoom,
    deleteRoom
} = require('../controllers/roomController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', getRooms);
router.get('/:id', getRoomById);
router.post('/', verifyToken, verifyAdmin, addRoom);
router.put('/:id', verifyToken, verifyAdmin, updateRoom);
router.delete('/:id', verifyToken, verifyAdmin, deleteRoom);

module.exports = router;
