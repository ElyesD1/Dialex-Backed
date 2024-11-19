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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const class_validator_1 = require("class-validator");
class SignupDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], SignupDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SignupDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], SignupDto.prototype, "password", void 0);
class UpdatePointsDto {
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdatePointsDto.prototype, "email", void 0);
class LoginDto {
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class UpdateProfileDto {
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "newEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "newPassword", void 0);
class AddLanguageDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddLanguageDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddLanguageDto.prototype, "languageName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddLanguageDto.prototype, "languageKey", void 0);
class ForgotPasswordDto {
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
class ResetPasswordDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "resetToken", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async signup(signupDto) {
        try {
            const user = await this.usersService.create(signupDto.fullName, signupDto.email, signupDto.password);
            return { user };
        }
        catch (error) {
            throw new common_1.BadRequestException('Signup failed: ' + error.message);
        }
    }
    async addLanguage(addLanguageDto) {
        const { email, languageName, languageKey } = addLanguageDto;
        if (!email || !languageName || !languageKey) {
            throw new common_1.BadRequestException('Email, languageName, and languageKey are required.');
        }
        try {
            await this.usersService.addLanguage(email, { name: languageName, key: languageKey });
            return { message: 'Language added successfully' };
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to add language: ' + error.message);
        }
    }
    async getLanguages(email) {
        if (!email) {
            throw new common_1.BadRequestException('Email is required');
        }
        return this.usersService.getLanguagesByEmail(email);
    }
    async googleSignIn(body) {
        const { googleId, name, email } = body;
        if (!googleId || !name || !email) {
            throw new common_1.BadRequestException('Google credentials are missing or incomplete.');
        }
        const user = await this.usersService.createOrUpdateGoogleUser(googleId, name, email);
        return {
            message: 'User signed in successfully.',
            user: {
                fullName: user.fullName,
                email: user.email,
                level: user.level,
                points: user.points,
                streakDays: user.streakDays,
            },
        };
    }
    async verifyEmail(token) {
        if (!token) {
            throw new common_1.BadRequestException('Token is required');
        }
        const user = await this.usersService.verifyUserEmail(token);
        if (user) {
            return { message: 'Email verified successfully!' };
        }
        else {
            throw new common_1.BadRequestException('Invalid or expired token.');
        }
    }
    async login(loginDto) {
        try {
            const user = await this.usersService.login(loginDto.email, loginDto.password);
            return {
                fullName: user.fullName,
                email: user.email,
                level: user.level,
                points: user.points,
                streakDays: user.streakDays,
                lastLoginDate: user.lastLoginDate,
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Login failed: ' + error.message);
        }
    }
    async verifyPassword({ email, password }) {
        try {
            const isValid = await this.usersService.verifyPassword(email, password);
            return { valid: isValid };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Password verification failed: ' + error.message);
        }
    }
    async updateProfile(updateProfileDto) {
        try {
            const updatedUser = await this.usersService.updateProfile(updateProfileDto.email, updateProfileDto.fullName, updateProfileDto.newEmail, updateProfileDto.password, updateProfileDto.newPassword);
            return { user: updatedUser };
        }
        catch (error) {
            throw new common_1.BadRequestException('Profile update failed: ' + error.message);
        }
    }
    async forgotPassword(forgotPasswordDto) {
        await this.usersService.forgotPassword(forgotPasswordDto.email);
        return { message: 'Password reset email sent' };
    }
    async resetPassword(resetPasswordDto) {
        await this.usersService.resetPassword(resetPasswordDto.resetToken, resetPasswordDto.newPassword);
        return { message: 'Password has been reset successfully' };
    }
    async deleteUser({ email }) {
        try {
            const result = await this.usersService.deleteUserByEmail(email);
            if (result) {
                return { message: 'User deleted successfully' };
            }
            else {
                throw new common_1.BadRequestException('User not found or deletion failed');
            }
        }
        catch (error) {
            throw new common_1.BadRequestException('User deletion failed: ' + error.message);
        }
    }
    async getAllUsers() {
        try {
            const users = await this.usersService.getAllUsers();
            return users.map(user => ({
                fullName: user.fullName,
                points: user.points,
            }));
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to fetch users: ' + error.message);
        }
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)('signup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SignupDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)('add-language'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AddLanguageDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addLanguage", null);
__decorate([
    (0, common_1.Get)('languages'),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getLanguages", null);
__decorate([
    (0, common_1.Post)('google-signin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "googleSignIn", null);
__decorate([
    (0, common_1.Get)('verify-email'),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('verifyPassword'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "verifyPassword", null);
__decorate([
    (0, common_1.Post)('update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Delete)('delete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllUsers", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map