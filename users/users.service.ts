import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';  // Assuming User is the type defined in your schema file
import * as bcrypt from 'bcrypt';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  private readonly API_KEY = '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';

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  // Create a new user with email verification
  async create(fullName: string, email: string, password: string): Promise<User> {
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = new this.userModel({
      fullName,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      level: 1,     // Set initial level
      points: 0,
    });

    await newUser.save();
    await this.sendVerificationEmail(newUser.email, verificationToken);

    return newUser;
  }
  async addPoints(userId: string, pointsToAdd: number): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update points and level if necessary
    user.points += pointsToAdd;

    // Check for level increment based on 25-point threshold
    if (user.points >= 25) {
      const additionalLevels = Math.floor(user.points / 25);
      user.level += additionalLevels;
      user.points = user.points % 25; // Keep remainder points after leveling up
    }

    await user.save();
    return user;
  }


  // Send verification email with Brevo
  private async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `http://localhost:3000/users/verify-email?token=${token}`;

    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = this.API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const emailData = {
      sender: { email: 'skyrexcgaming@gmail.com' },
      to: [{ email: email }],
      subject: 'Verify your email address',
      htmlContent: `
        <p>Thank you for signing up! Please click the button below to verify your email address.</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; color: white; background-color: blue; text-decoration: none; border-radius: 5px;">
          Verify Account
        </a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    try {
      await apiInstance.sendTransacEmail(emailData);
      console.log('Verification email sent successfully');
    } catch (error) {
      console.error('Error sending verification email via Brevo:', error);
      throw new Error('Error sending verification email');
    }
  }
 async createOrUpdateGoogleUser(googleId: string, name: string, email: string): Promise<User> {
    // Check if the user already exists by email
    let user = await this.userModel.findOne({ email });

    if (!user) {
        // If the user doesn't exist, create a new user with default level and points
        user = new this.userModel({
            fullName: name,
            email,
            password: googleId, // You can store the Google ID as the password or handle it differently
            isVerified: true, // Assume user is verified after Google Sign-In
            level: 1, // Default level
            points: 0, // Default points
        });
        await user.save();
    } else {
        // If the user exists, update their information if needed (optional)
        user.fullName = name;
        user.email = email;
        await user.save();
    }

    // Return the updated user object, including level and points
    return user;
}
  // Verify email by token
  async verifyUserEmail(token: string): Promise<User | null> {
    const user = await this.userModel.findOne({ verificationToken: token });
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.isVerified = true;
    user.verificationToken = '';
    await user.save();
    return user;
  }

  // Login function
  async login(email: string, password: string): Promise<{ 
    fullName: string;
    email: string;
    level: number;
    points: number;
    streakDays: number;
    lastLoginDate: Date;
  }> {
    // Find user by email
    const user = await this.userModel.findOne({ email });

    if (!user || !user.isVerified) {
      throw new UnauthorizedException('Invalid credentials or email not verified');
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if the login is a continuation of a streak
    const today = new Date();
    let streakIncrement = 0;

    if (user.lastLoginDate) {
      const lastLogin = new Date(user.lastLoginDate);
      const lastLoginDay = lastLogin.getDate();
      const todayDay = today.getDate();

      // Check for consecutive login (streak)
      if (lastLogin.getFullYear() === today.getFullYear() && 
          lastLogin.getMonth() === today.getMonth() && 
          lastLoginDay === todayDay - 1) {
        // Continue streak (consecutive day login)
        streakIncrement = 1;
      } else if (lastLogin.getFullYear() !== today.getFullYear() || 
                 lastLogin.getMonth() !== today.getMonth() || 
                 lastLoginDay < todayDay - 1) {
        // Streak is broken, reset streak to 1
        streakIncrement = 1;
      }
    } else {
      // No previous login, set streak to 1
      streakIncrement = 1;
    }

    // Update streakDays and lastLoginDate
    user.streakDays = user.streakDays + streakIncrement;
     // Save date in ISO format (or your preferred format)

    // Save the updated user data
    await user.save();

    // Return the necessary data for frontend
    return {
      fullName: user.fullName,
      email: user.email,
      level: user.level,
      points: user.points,
      streakDays: user.streakDays,  // Include streakDays in the response
      lastLoginDate: user.lastLoginDate,  // Include lastLoginDate
    };
  }

  // Verify Password
  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid;
  }

  async updateProfile(email: string, fullName: string, newEmail: string, password?: string, newPassword?: string): Promise<User> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
        throw new BadRequestException('User not found');
    }

    if (password && password.length > 0) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Incorrect password');
        }
    }

    user.fullName = fullName;

    if (newEmail && newEmail !== email) {
        const existingUser = await this.userModel.findOne({ email: newEmail });
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }
        user.email = newEmail;
    }

    if (newPassword && newPassword.length > 0) {
        user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }
  
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();  // Generates a 6-digit reset code
    user.resetCode = resetCode;
    user.resetCodeExpiration = new Date(Date.now() + 3600000); // Code valid for 1 hour
    await user.save();
  
    const emailData = {
      sender: { email: 'skyrexcgaming@gmail.com' },
      to: [{ email: user.email }],
      subject: 'Your Password Reset Code',
      htmlContent: `<p>Use the following code to reset your password:</p><h2>${resetCode}</h2><p>The code is valid for 1 hour.</p>`,
    };

    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = this.API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    try {
      await apiInstance.sendTransacEmail(emailData);
    } catch (error) {
      console.error('Error sending password reset code:', error);
      throw new Error('Error sending password reset code');
    }
  }
  
  async resetPassword(resetCode: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findOne({
      resetCode,
      resetCodeExpiration: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = undefined;
    user.resetCodeExpiration = undefined;
    await user.save();
  }
  async deleteUserByEmail(email: string): Promise<boolean> {
    const user = await this.userModel.findOneAndDelete({ email });
    return !!user;  // Returns true if user was found and deleted, otherwise false
  }
  async getAllUsers(): Promise<User[]> {
    return await this.userModel.find({}, 'fullName points').exec();
  }
  
}