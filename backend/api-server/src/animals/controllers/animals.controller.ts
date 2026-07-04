import { Controller, Get, Post, Put, Delete, Body, Param, Inject, Headers, UseInterceptors, UploadedFile, BadRequestException } from "@nestjs/common";
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
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    const publicUrl = `/uploads/${file.filename}`;
    return { url: publicUrl };
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
  async getById(@GetUser() user: Farmer, @Param("id") id: string) {
    return this.animalsService.getById(user.id, Number(id));
  }

  @Put(":id")
  async update(@GetUser() user: Farmer, @Param("id") id: string, @Body() dto: UpdateAnimalDto) {
    return this.animalsService.update(user.id, Number(id), dto);
  }

  @Delete(":id")
  async remove(@GetUser() user: Farmer, @Param("id") id: string) {
    await this.animalsService.delete(user.id, Number(id));
    return { success: true };
  }
}
