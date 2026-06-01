import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import {
  EditablePostListVisibility,
  GetEditablePostListQuery,
  GetPostListQuery,
  PostSortOrder,
  SavePostMode,
  SavePostRequset,
} from './post.dto.type';

const MAX_POST_LIST_LIMIT = 50;
const DEFAULT_POST_LIST_LIMIT = 12;
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_QUERY_LENGTH = 120;
const MAX_TAG_LENGTH = 30;
const MAX_TAG_COUNT = 10;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_MARKDOWN_LENGTH = 200_000;

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
      sort: this.parseSort(record.sort),
    };
  }

  protected parseSort(value: unknown): PostSortOrder {
    if (value === undefined || value === 'newest') {
      return 'newest';
    }

    if (value === 'oldest') {
      return 'oldest';
    }

    throw new BadRequestException('sort must be newest or oldest');
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

    if (fieldName === 'query' && trimmed.length > MAX_QUERY_LENGTH) {
      throw new BadRequestException(
        `query must be at most ${MAX_QUERY_LENGTH} characters`,
      );
    }

    if (fieldName === 'tag' && trimmed.length > MAX_TAG_LENGTH) {
      throw new BadRequestException(
        `tag must be at most ${MAX_TAG_LENGTH} characters`,
      );
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

    const normalized = trim ? value.trim() : value;

    if (fieldName === 'title' && normalized.length > MAX_TITLE_LENGTH) {
      throw new BadRequestException(
        `title must be at most ${MAX_TITLE_LENGTH} characters`,
      );
    }

    if (fieldName === 'markdown' && normalized.length > MAX_MARKDOWN_LENGTH) {
      throw new BadRequestException(
        `markdown must be at most ${MAX_MARKDOWN_LENGTH} characters`,
      );
    }

    return normalized;
  }

  private parseNullableString(value: unknown, fieldName: string) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalized = this.parseString(value, fieldName, true);

    if (
      fieldName === 'description' &&
      normalized.length > MAX_DESCRIPTION_LENGTH
    ) {
      throw new BadRequestException(
        `description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
      );
    }

    return normalized;
  }

  private parseTags(value: unknown): string[] {
    if (
      !Array.isArray(value) ||
      !value.every((item) => typeof item === 'string')
    ) {
      throw new BadRequestException('tags must be an array of strings');
    }

    if (value.length > MAX_TAG_COUNT) {
      throw new BadRequestException(
        `tags must contain at most ${MAX_TAG_COUNT} items`,
      );
    }

    const normalizedTags = value.map((item) => item.trim());

    if (normalizedTags.some((item) => !item || item.length > MAX_TAG_LENGTH)) {
      throw new BadRequestException(
        `each tag must be between 1 and ${MAX_TAG_LENGTH} characters`,
      );
    }

    return [...normalizedTags];
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
