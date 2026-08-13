import { Allow } from 'class-validator';

/**
 * Registers Swagger-documented DTO properties with class-validator so Nest's
 * global whitelist keeps them. Swagger decorators describe the API contract,
 * but are not validation decorators by themselves.
 */
export function allowSwaggerDtoProperties(metatype: any): void {
  const prototype = metatype?.prototype;
  if (!prototype) return;

  const properties: string[] = Reflect.getMetadata(
    'swagger/apiModelPropertiesArray',
    prototype,
  ) ?? [];

  for (const property of properties) {
    const propertyName = property.startsWith(':') ? property.slice(1) : property;
    Allow()(prototype, propertyName);
  }
}

/** Explicit allow-list for legacy DTOs that do not use Swagger decorators. */
export function AllowProperties(...propertyNames: string[]): ClassDecorator {
  return (target) => {
    for (const propertyName of propertyNames) {
      Allow()(target.prototype, propertyName);
    }
  };
}
