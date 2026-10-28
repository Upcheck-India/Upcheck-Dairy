import { Controller, Get, Inject, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { FilesService } from "./files.service";
import { GetUser } from "../common/decorators/auth.decorators";
import type { PublicFarmer } from "../common/public-farmer";

@Controller("files")
export class FilesController {
  constructor(@Inject(FilesService) private readonly filesService: FilesService) {}

  /**
   * Serve an uploaded file to the farmer who owns the record referencing it.
   *
   * Replaces `express.static("/uploads")`, which served every upload to anyone
   * who could guess — or be told — a filename, with no authentication at all.
   * This route sits behind the global JWT guard and additionally checks
   * ownership in FilesService.
   */
  @Get(":filename")
  async getFile(
    @GetUser() user: PublicFarmer,
    @Param("filename") filename: string,
    @Res() res: Response
  ) {
    const { absolutePath } = await this.filesService.resolveForUser(user.id, filename);

    // Uploads are per-farmer and authorised per request, so they must not be
    // stored in a shared cache.
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.sendFile(absolutePath);
  }
}
