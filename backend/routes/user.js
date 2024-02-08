const express = require("express");
const jwt = require("jsonwebtoken");
const zod = require("zod");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const { User, Account } = require("../db");
const JWT_SECRET = require("../config");
const mongoose = require("mongoose");
const { authMiddleware } = require("../middleware");

const signupBody = zod.object({
  username: zod.string().email(),
  firstName: zod.string(),
  lastName: zod.string(),
  password: zod.string(),
});

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { success } = signupBody.safeParse(req.body);
    if (!success) {
      return res.status(411).json({
        message: "Email already taken / Incorrect inputs / zod invalid",
      });
    }

    const existingUser = await User.findOne({
      username: req.body.username,
    });

    if (existingUser) {
      return res.status(411).json({
        message: "Email already taken / Incorrect inputs",
      });
    }
    // Initialize newUser object with request data
    const newUser = new User({
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    });

    const hashedPassword = await newUser.createHash(req.body.password);
    newUser.password_hash = hashedPassword;

    const userId = newUser._id;

    /// --- Create new account ---
    await Account.create({
      userId: userId,
      balance: 1 + Math.random() * 10000,
    });

    // Save newUser object to database
    await newUser.save();

    const token = jwt.sign(
      {
        userId,
      },
      JWT_SECRET
    );
    res.json({
      message: "User created successfully",
      token: `${token}`,
    });
  })
);

const signinBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

router.post(
  "/signin",
  asyncHandler(async (req, res) => {
    const { success } = signinBody.safeParse(req.body);
    if (!success) {
      return res.status(411).json({
        message: "Email already taken / Incorrect inputs",
      });
    }
    const password = req.body.password;
    const user = await User.findOne({
      username: req.body.username,
    });
    if (user === null) {
      return res.status(400).json({
        message: "User not found.",
      });
    } else {
      if (await user.validatePassword(req.body.password)) {
        const token = jwt.sign(
          {
            userId: user._id,
          },
          JWT_SECRET
        );
        res.json({
          token: `${token}`,
        });
        return res.status(200).json({
          message: "User Successfully Logged In",
        });
      } else {
        return res.status(400).json({
          message: "Incorrect Password",
        });
      }
    }
  })
);

userInputValidation = zod.object({
  password: zod
    .string()
    .min(6, { message: "Error while updating information" })
    .optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

router.put("/update", authMiddleware, async (req, res) => {
  const { success } = userInputValidation.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "Error while updating information",
    });
  }

  const checkId = await User.findOne({
    _id: req.userId,
  });

  if (checkId._id) {
    checkId.firstName = req.body.firstName;
    checkId.lastName = req.body.lastName;
  }

  const hashedPassword = await checkId.createHash(req.body.password);
  checkId.password_hash = hashedPassword;
  await checkId.save();

  res.json({
    message: "Update successfully",
  });
});

router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";
  const username = req.body.username;

  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });
  const filterUser = users.filter((user) => user.username != username);

  res.status(200).json({
    user: filterUser.map((user) => ({
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});
module.exports = router;
