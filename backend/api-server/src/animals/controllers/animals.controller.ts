import { Controller, Get, Post, Put, Delete, Body, Param, Inject, Headers, UseInterceptors, UploadedFile, BadRequestException, ParseIntPipe } from "@nestjs/common";
import { AnimalsService } from "../services/animals.service";
import { CreateAnimalDto } from "../dto/create-animal.dto";
import { UpdateAnimalDto } from "../dto/update-animal.dto";
import { GetUser } from "../../common/decorators/auth.decorators";
import type { Farmer } from "@workspace/db";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";

@Controller("animals")
export class AnimalsController {
  constructor(@Inject(AnimalsService) private readonly animalsService: AnimalsService) {}

  @Post()
  async create(@GetUser() user: Farmer, @Body() dto: CreateAnimalDto) {
    return this.animalsService.create(user.id, dto);
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(new BadRequestException("Unsupported file type"), false);
        } else {
          cb(null, true);
        }
      },
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("File is required");
    }
    return { url: `/uploads/${file.filename}` };
  }

  @Get()
  async getMyAnimals(@GetUser() user: Farmer, @Headers("x-farm-id") farmId: string) {
    return this.animalsService.getByFarm(user.id, farmId);
  }

  @Get("farm/:farmId")
  async getByFarm(@GetUser() user: Farmer, @Param("farmId") farmId: string) {
    return this.animalsService.getByFarm(user.id, farmId);
  }

  @Get(":id")
  async getById(@GetUser() user: Farmer, @Param("id", ParseIntPipe) id: number) {
    return this.animalsService.getById(user.id, id);
  }

  @Put(":id")
  async update(@GetUser() user: Farmer, @Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAnimalDto) {
    return this.animalsService.update(user.id, id, dto);
  }

  @Delete(":id")
  async remove(@GetUser() user: Farmer, @Param("id", ParseIntPipe) id: number) {
    await this.animalsService.delete(user.id, id);
    return { success: true };
  }
}
