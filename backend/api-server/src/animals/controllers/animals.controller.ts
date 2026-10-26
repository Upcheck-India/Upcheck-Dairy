import { Controller, Get, Post, Put, Delete, Body, Param, Inject, Headers, UseInterceptors, UseFilters, UploadedFile, BadRequestException, ParseIntPipe } from "@nestjs/common";
import { AnimalsService } from "../services/animals.service";
import { CreateAnimalDto } from "../dto/create-animal.dto";
import { UpdateAnimalDto } from "../dto/update-animal.dto";
import { GetUser } from "../../common/decorators/auth.decorators";
import type { PublicFarmer } from "../../common/public-farmer";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { MulterExceptionFilter } from "../../common/multer-exception.filter";
import { randomBytes } from "node:crypto";
import { extname } from "path";

@Controller("animals")
export class AnimalsController {
  constructor(@Inject(AnimalsService) private readonly animalsService: AnimalsService) {}

  @Post()
  async create(@GetUser() user: PublicFarmer, @Body() dto: CreateAnimalDto) {
    return this.animalsService.create(user.id, dto);
  }

  @Post("upload")
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(
    FileInterceptor("file", {
      // Without a cap any authenticated user could fill the disk. Phone photos
      // arrive compressed (the picker uses quality 0.7), so 10 MB is far above
      // a real upload while still bounding the damage.
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, cb) => {
          // crypto, not Math.random: the filename is part of the file's URL,
          // so a predictable one is worth avoiding even behind the ownership
          // check in FilesService.
          const uniqueSuffix = Date.now() + "-" + randomBytes(8).toString("hex");
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
  async getMyAnimals(@GetUser() user: PublicFarmer, @Headers("x-farm-id") farmId: string) {
    return this.animalsService.getByFarm(user.id, farmId);
  }

  @Get("farm/:farmId")
  async getByFarm(@GetUser() user: PublicFarmer, @Param("farmId") farmId: string) {
    return this.animalsService.getByFarm(user.id, farmId);
  }

  @Get(":id")
  async getById(@GetUser() user: PublicFarmer, @Param("id", ParseIntPipe) id: number) {
    return this.animalsService.getById(user.id, id);
  }

  @Put(":id")
  async update(@GetUser() user: PublicFarmer, @Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAnimalDto) {
    return this.animalsService.update(user.id, id, dto);
  }

  @Delete(":id")
  async remove(@GetUser() user: PublicFarmer, @Param("id", ParseIntPipe) id: number) {
    await this.animalsService.delete(user.id, id);
    return { success: true };
  }
}
