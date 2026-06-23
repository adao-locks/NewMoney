import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'limitTo',
  standalone: true
})
export class LimitToPipe implements PipeTransform {
  transform(value: any[], limit: number): any[] {
    if (!value) return [];
    return value.slice(0, limit);
  }
}
