import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetMedia } from '../application/use-cases/get-media';
import { MediaResponseDto } from './dtos/media-response.dto';
import { MediaUpdateDto } from './dtos/media-update.dto';
import { UpdateMedia } from '../application/use-cases/update-media';
import { DeleteMedia } from '../application/use-cases/delete-media';
import { ListMedia } from '../application/use-cases/list-media';
import { AddMediaDto } from './dtos/add-media.dto';
import { AddMedia } from '../application/use-cases/add-media';
import {
  AddMediaResponseDto,
  PresignedPartUrlDto,
} from './dtos/add-media-response.dto';
import { CompleteUpload } from '../application/use-cases/complete-upload';
import { GetUploadPartUrls } from '../application/use-cases/get-upload-part-urls';
import { MediaQueryDto } from './dtos/media-query.dto';
import { PaginatedMediaResponseDto } from './dtos/paginated-media-response.dto';
import { Roles } from '../../shared/presentation/decorator/roles.decorator';
import { Role } from '../../user/domain/constants';
import { CurrentUser } from '../../shared/presentation/decorator/get-current-user.decorator';

@Controller('api/media')
@ApiTags('Media')
export class MediaController {
  constructor(
    private readonly getMedia: GetMedia,
    private readonly updateMedia: UpdateMedia,
    private readonly deleteMedia: DeleteMedia,
    private readonly listMedia: ListMedia,
    private readonly addMedia: AddMedia,
    private readonly completeUpload: CompleteUpload,
    private readonly getUploadPartUrls: GetUploadPartUrls,
  ) {}

  @Get('/')
  @ApiOperation({ summary: 'List media' })
  @ApiOkResponse({ type: PaginatedMediaResponseDto })
  async listAll(
    @CurrentUser('role') role: Role,
    @Query() query: MediaQueryDto,
  ): Promise<PaginatedMediaResponseDto> {
    const { cursor, limit, ...filter } = query;
    filter.includePrivate = role === Role.ADMIN;
    return PaginatedMediaResponseDto.fromPage(
      await this.listMedia.execute(filter, { cursor, limit }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media by ID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Media identifier' })
  @ApiOkResponse({ type: MediaResponseDto })
  @ApiNotFoundResponse({ description: 'Media not found' })
  async findById(
    @CurrentUser('role') role: Role,
    @Param('id') id: string,
    @Query() query: MediaQueryDto,
  ): Promise<MediaResponseDto> {
    const filter = { ...query, includePrivate: role === Role.ADMIN };
    return MediaResponseDto.fromDomain(await this.getMedia.execute(id, filter));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update media details' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Media identifier' })
  @ApiOkResponse({ description: 'Media updated' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({ description: 'Media not found' })
  async update(
    @Param('id') id: string,
    @Body() data: MediaUpdateDto,
  ): Promise<void> {
    await this.updateMedia.execute(id, data);
  }

  @Roles([Role.ADMIN])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete media by ID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Media identifier' })
  @ApiOkResponse({ description: 'Media deleted' })
  async delete(@Param('id') id: string) {
    return this.deleteMedia.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Initialize a multipart media upload' })
  @ApiCreatedResponse({ type: AddMediaResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiConflictResponse({ description: 'Media with this title already exists' })
  async initUpload(
    @CurrentUser('appUserId') ownerId: string,
    @Body() data: AddMediaDto,
  ): Promise<AddMediaResponseDto> {
    const output = await this.addMedia.execute({ ...data, ownerId });
    return AddMediaResponseDto.from(output);
  }

  @Post('/upload/:id/complete')
  @ApiOperation({ summary: 'Complete a multipart media upload' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Media identifier' })
  @ApiCreatedResponse({ description: 'Multipart upload completed' })
  @ApiBadRequestResponse({ description: 'No uploaded parts were found' })
  @ApiNotFoundResponse({ description: 'Media not found' })
  async complete(@Param('id') id: string): Promise<void> {
    return await this.completeUpload.execute(id);
  }

  @Get('/:id/upload/parts')
  @ApiOperation({ summary: 'Get presigned URLs for media upload parts' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Media identifier' })
  @ApiQuery({ name: 'from', type: Number, description: 'First part number' })
  @ApiQuery({
    name: 'count',
    type: Number,
    description: 'Number of part URLs to generate',
  })
  @ApiOkResponse({ type: PresignedPartUrlDto, isArray: true })
  @ApiBadRequestResponse({ description: 'Invalid part range query parameters' })
  @ApiNotFoundResponse({ description: 'Media not found' })
  async getUrls(
    @Param('id') id: string,
    @Query('from', ParseIntPipe) from: number,
    @Query('count', ParseIntPipe) count: number,
  ): Promise<PresignedPartUrlDto[]> {
    if (from === undefined || count === undefined)
      throw new BadRequestException('Invalid Request Format');

    return await this.getUploadPartUrls.execute(id, from, count);
  }
}
