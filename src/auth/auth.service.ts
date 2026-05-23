import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';
import * as bcryptjs from 'bcryptjs';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt.payload';
import { LoginResponse } from './interfaces/login-response';
import { RegisterUserDto } from './dto';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {

    //return newUser.save();

    try {
      const { password, ...userData } = createUserDto;

      const newUser = new this.userModel({
        password: bcryptjs.hashSync(password!, 10),
        ...userData
      });

      await newUser.save();
      const { password: _, ...user } = newUser.toJSON();

      return user

    } catch (error: any) {
      if (error.code === 11000) {
        throw new BadRequestException(`${createUserDto.email} already exists!`);
      }

      throw new InternalServerErrorException("Something terrible happened!")
    }


  }

  async register(registerDto: RegisterUserDto): Promise<LoginResponse> {
    const user = await this.create(registerDto);

    console.log({ user })

    return {
      user,
      token: this.getJwtToken({ id: user._id })
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException("Not valid credentials - email");
    }

    if (!bcryptjs.compareSync(password!, user.password!)) {
      throw new UnauthorizedException("Not valid credentials - password");
    }

    const { password: _, ...rest } = user.toJSON();

    return {
      user: rest,
      token: this.getJwtToken({ id: user.id }),
    }
  }

  findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  async findUserById(id: string | undefined) {

    const user = await this.userModel.findById(id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    const { password, ...rest } = user?.toJSON();
    return rest;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateUserDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  getJwtToken(payload: JwtPayload) {

    const token = this.jwtService.sign(payload);

    return token;

  }
}
