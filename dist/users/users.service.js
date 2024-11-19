"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./user.schema");
const bcrypt = require("bcrypt");
const SibApiV3Sdk = require("sib-api-v3-sdk");
const crypto = require("crypto");
let UsersService = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
        this.API_KEY = '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';
    }
    async create(fullName, email, password) {
        const existingUser = await this.userModel.findOne({ email });
        if (existingUser) {
            throw new common_1.ConflictException('User already exists with this email');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const newUser = new this.userModel({
            fullName,
            email,
            password: hashedPassword,
            isVerified: false,
            verificationToken,
            level: 1,
            points: 0,
        });
        await newUser.save();
        await this.sendVerificationEmail(newUser.email, verificationToken);
        return newUser;
    }
    async addPoints(userId, pointsToAdd) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        user.points += pointsToAdd;
        if (user.points >= 25) {
            const additionalLevels = Math.floor(user.points / 25);
            user.level += additionalLevels;
            user.points = user.points % 25;
        }
        await user.save();
        return user;
    }
    async addLanguage(email, language) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.languages.some(lang => lang.key === language.key)) {
            throw new common_1.ConflictException('Language already exists');
        }
        user.languages.push(language);
        try {
            await user.save();
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to add language: ' + error.message);
        }
    }
    async getLanguagesByEmail(email) {
        const user = await this.userModel.findOne({ email }).select('languages');
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        return user.languages;
    }
    async sendVerificationEmail(email, token) {
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
        }
        catch (error) {
            console.error('Error sending verification email via Brevo:', error);
            throw new Error('Error sending verification email');
        }
    }
    async createOrUpdateGoogleUser(googleId, name, email) {
        let user = await this.userModel.findOne({ email });
        if (!user) {
            user = new this.userModel({
                fullName: name,
                email,
                password: googleId,
                isVerified: true,
                level: 1,
                points: 0,
            });
            await user.save();
        }
        else {
            user.fullName = name;
            user.email = email;
            await user.save();
        }
        return user;
    }
    async verifyUserEmail(token) {
        const user = await this.userModel.findOne({ verificationToken: token });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired verification token');
        }
        user.isVerified = true;
        user.verificationToken = '';
        await user.save();
        return user;
    }
    async login(email, password) {
        const user = await this.userModel.findOne({ email });
        if (!user || !user.isVerified) {
            throw new common_1.UnauthorizedException('Invalid credentials or email not verified');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const today = new Date();
        let streakIncrement = 0;
        if (user.lastLoginDate) {
            const lastLogin = new Date(user.lastLoginDate);
            const lastLoginDay = lastLogin.getDate();
            const todayDay = today.getDate();
            if (lastLogin.getFullYear() === today.getFullYear() &&
                lastLogin.getMonth() === today.getMonth() &&
                lastLoginDay === todayDay - 1) {
                streakIncrement = 1;
            }
            else if (lastLogin.getFullYear() !== today.getFullYear() ||
                lastLogin.getMonth() !== today.getMonth() ||
                lastLoginDay < todayDay - 1) {
                streakIncrement = 1;
            }
        }
        else {
            streakIncrement = 1;
        }
        user.streakDays = user.streakDays + streakIncrement;
        await user.save();
        return {
            fullName: user.fullName,
            email: user.email,
            level: user.level,
            points: user.points,
            streakDays: user.streakDays,
            lastLoginDate: user.lastLoginDate,
        };
    }
    async verifyPassword(email, password) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        return isPasswordValid;
    }
    async updateProfile(email, fullName, newEmail, password, newPassword) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (password && password.length > 0) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Incorrect password');
            }
        }
        user.fullName = fullName;
        if (newEmail && newEmail !== email) {
            const existingUser = await this.userModel.findOne({ email: newEmail });
            if (existingUser) {
                throw new common_1.ConflictException('Email already in use');
            }
            user.email = newEmail;
        }
        if (newPassword && newPassword.length > 0) {
            user.password = await bcrypt.hash(newPassword, 10);
        }
        await user.save();
        return user;
    }
    async forgotPassword(email) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new common_1.BadRequestException('User with this email does not exist');
        }
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetCode = resetCode;
        user.resetCodeExpiration = new Date(Date.now() + 3600000);
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
        }
        catch (error) {
            console.error('Error sending password reset code:', error);
            throw new Error('Error sending password reset code');
        }
    }
    async resetPassword(resetCode, newPassword) {
        const user = await this.userModel.findOne({
            resetCode,
            resetCodeExpiration: { $gt: new Date() },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset code');
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetCode = undefined;
        user.resetCodeExpiration = undefined;
        await user.save();
    }
    async deleteUserByEmail(email) {
        const user = await this.userModel.findOneAndDelete({ email });
        return !!user;
    }
    async getAllUsers() {
        return await this.userModel.find({}, 'fullName points').exec();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map