import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import {
  EditablePostListVisibility,
  GetEditablePostListQuery,
  GetPostListQuery,
  SavePostMode,
  SavePostRequset,
} from './post.dto.type';

const MAX_POST_LIST_LIMIT = 50;
const DEFAULT_POST_LIST_LIMIT = 12;
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;

@Injectable()
export class ParseGetPostListQueryPipe implements PipeTransform<
  unknown,
  GetPostListQuery
> {
  transform(value: unknown): GetPostListQuery {
    const record = this.asRecord(value);

    return {
      limit: this.parseLimit(record.limit),
      cursor: this.parseOptionalString(record.cursor, 'cursor'),
      query: this.parseOptionalString(record.query, 'query'),
      tag: this.parseOptionalString(record.tag, 'tag'),
    };
  }

  private asRecord(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('invalid query');
    }

    return value as Record<string, unknown>;
  }

  private parseLimit(value: unknown) {
    if (value === undefined) {
      return DEFAULT_POST_LIST_LIMIT;
    }

    const parsed = this.parseInteger(value, 'limit');

    if (parsed < 1 || parsed > MAX_POST_LIST_LIMIT) {
      throw new BadRequestException('limit must be between 1 and 50');
    }

    return parsed;
  }

  private parseOptionalString(value: unknown, fieldName: string) {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string`);
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return undefined;
    }

    if (fieldName === 'cursor' && !BASE64_URL_PATTERN.test(trimmed)) {
      throw new BadRequestException('cursor must be a base64url string');
    }

    return trimmed;
  }

  private parseInteger(value: unknown, fieldName: string) {
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new BadRequestException(`${fieldName} must be an integer`);
    }

    const parsed = Number.parseInt(String(value), 10);

    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${fieldName} must be an integer`);
    }

    return parsed;
  }
}

@Injectable()
export class ParseGetEditablePostListQueryPipe
  extends ParseGetPostListQueryPipe
  implements PipeTransform<unknown, GetEditablePostListQuery>
{
  override transform(value: unknown): GetEditablePostListQuery {
    const parsed = super.transform(value);
    const record = value as Record<string, unknown>;
    const visibility = this.parseVisibility(record.visibility);

    return {
      ...parsed,
      visibility,
    };
  }

  private parseVisibility(value: unknown): EditablePostListVisibility {
    if (value === undefined || value === 'all') {
      return 'all';
    }

    if (value === 'public' || value === 'draft') {
      return value;
    }

    throw new BadRequestException('visibility must be all, public, or draft');
  }
}

@Injectable()
export class ParseSavePostRequestPipe implements PipeTransform<
  unknown,
  SavePostRequset
> {
  transform(value: unknown): SavePostRequset {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('invalid request body');
    }

    const record = value as Record<string, unknown>;
    const title = this.parseString(record.title, 'title', true);
    const description = this.parseNullableString(
      record.description,
      'description',
    );
    const markdown = this.parseString(record.markdown, 'markdown', false);
    const tags = this.parseTags(record.tags);
    const isPublic = this.parseBoolean(record.isPublic, 'isPublic');
    const saveMode = this.parseSaveMode(record.saveMode);
    const thumbnailId = this.parseNullableInteger(
      record.thumbnailId,
      'thumbnailId',
    );

    return {
      title,
      description,
      markdown,
      tags,
      isPublic,
      saveMode,
      thumbnailId,
    };
  }

  private parseString(value: unknown, fieldName: string, trim: boolean) {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string`);
    }

    return trim ? value.trim() : value;
  }

  private parseNullableString(value: unknown, fieldName: string) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    return this.parseString(value, fieldName, true);
  }

  private parseTags(value: unknown): string[] {
    if (
      !Array.isArray(value) ||
      !value.every((item) => typeof item === 'string')
    ) {
      throw new BadRequestException('tags must be an array of strings');
    }

    return [...value];
  }

  private parseBoolean(value: unknown, fieldName: string): boolean {
    if (typeof value !== 'boolean') {
      throw new BadRequestException(`${fieldName} must be a boolean`);
    }

    return value;
  }

  private parseSaveMode(value: unknown): SavePostMode {
    if (
      value !== SavePostMode.AUTO &&
      value !== SavePostMode.DRAFT &&
      value !== SavePostMode.PUBLISH
    ) {
      throw new BadRequestException('saveMode must be AUTO, DRAFT, or PUBLISH');
    }

    return value;
  }

  private parseNullableInteger(
    value: unknown,
    fieldName: string,
  ): number | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    if (!Number.isInteger(value)) {
      throw new BadRequestException(`${fieldName} must be an integer or null`);
    }

    return value as number;
  }
}
