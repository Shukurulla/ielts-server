import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  generateToken,
  errorResponse,
  successResponse,
} from "../utils/helpers.js";

// Register user
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return errorResponse(
        res,
        400,
        "User already exists with this email or phone"
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: role,
    });

    // Generate token
    const token = generateToken(user._id);

    successResponse(
      res,
      {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
      "User registered successfully"
    );
  } catch (error) {
    console.error("Register error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 400, "Invalid credentials");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 400, "Invalid credentials");
    }

    // Generate token
    const token = generateToken(user._id);

    successResponse(
      res,
      {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
      "Login successful"
    );
  } catch (error) {
    console.error("Login error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    successResponse(res, { user }, "Profile retrieved successfully");
  } catch (error) {
    console.error("Get profile error:", error);
    errorResponse(res, 500, "Server error");
  }
};
