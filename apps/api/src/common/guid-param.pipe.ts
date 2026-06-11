import { Injectable, PipeTransform } from '@nestjs/common';
import { NotFoundException } from './exceptions';
import { isUuid } from './validation';

/**
 * ASP.NET route constraints like {id:guid} return 404 when the segment is not
 * a GUID (the route simply does not match). This pipe replicates that.
 */
@Injectable()
export class GuidRouteParam implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUuid(value)) {
      throw new NotFoundException('Not found.');
    }
    return value.toLowerCase();
  }
}
