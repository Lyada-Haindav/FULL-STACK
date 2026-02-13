type LegacyNode = {
  _value?: unknown;
  _children?: Record<string, unknown> | unknown[];
  _class?: string;
};

function isLegacyNode(value: unknown): value is LegacyNode {
  return !!value && typeof value === "object" && ("_value" in value || "_children" in value);
}

function unwrapLegacy(value: unknown): unknown {
  if (!isLegacyNode(value)) {
    if (Array.isArray(value)) {
      return value.map(unwrapLegacy);
    }
    if (value && typeof value === "object") {
      const result: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
        result[key] = unwrapLegacy(child);
      });
      return result;
    }
    return value;
  }

  if (value._value !== undefined) {
    return value._value;
  }

  if (Array.isArray(value._children)) {
    return value._children.map(unwrapLegacy);
  }

  const children = (value._children || {}) as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  Object.entries(children).forEach(([key, child]) => {
    result[key] = unwrapLegacy(child);
  });
  return result;
}

export function normalizeTemplateConfig(config: unknown): any {
  return unwrapLegacy(config);
}
