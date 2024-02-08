const express = require("express");
const router = express.Router();
const { User, Account } = require("../db");
const { authMiddleware } = require("../middleware");
const { default: mongoose } = require("mongoose");
const { compareSync } = require("bcrypt");

router.get("/balance", authMiddleware, async (req, res) => {
  const userId = req.userId;
  console.log(userId);
  const account = await Account.findOne({
    userId: userId,
  });
  const balance = account.balance;
  res.status(200).json({
    balance: balance,
  });
});

router.post("/transfer", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const { amount, username } = req.body;

  // Fetch the accounts within the transaction
  const reciverId = await User.findOne({
    _id: username,
  });

  const toAccount = await Account.findOne({ userId: reciverId }).session(
    session
  );

  if (!toAccount) {
    await session.abortTransaction();
    return res.status(400).json({
      message: "Invalid account",
    });
  }

  const account = await Account.findOne({
    userId: req.userId,
  }).session(session);

  if (!account || account.balance < amount) {
    await session.abortTransaction();
    return res.status(400).json({
      message: "Insufficient balance",
    });
  }

  //Perform the transfer
  await Account.updateOne(
    {
      userId: req.userId,
    },
    {
      $inc: {
        balance: -amount,
      },
    }
  ).session(session);
  await Account.updateOne(
    {
      to: reciverId._id,
    },
    {
      $inc: { balance: amount },
    }
  ).session(session);

  //Commit the transition
  await session.commitTransaction();
  res.json({
    message: "Transfer successful",
  });
});

module.exports = router;
