import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verificationToken: string;

  @Prop()
  resetCode?: string;

  @Prop()
  resetCodeExpiration?: Date;

  // Properties for tracking user progress
  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  points: number;

  // Properties for tracking streaks
  @Prop({ default: 0 })
  streakDays: number;

  @Prop({ default: new Date() })
  lastLoginDate: Date;
  @Prop()
  lastClaimDate?: Date; 
}

export const UserSchema = SchemaFactory.createForClass(User);