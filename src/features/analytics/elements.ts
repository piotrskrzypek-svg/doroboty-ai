// Retain only DOM structure, never text, values, IDs, classes or link destinations.
export function sanitizeElements(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((element) => {
    if (!element || typeof element !== "object") return [];
    const { tag_name, nth_child, nth_of_type } = element;
    if (typeof tag_name !== "string" || !/^[a-z][a-z0-9-]*$/.test(tag_name)) return [];
    return [
      {
        tag_name,
        ...(Number.isInteger(nth_child) && nth_child > 0 ? { nth_child } : {}),
        ...(Number.isInteger(nth_of_type) && nth_of_type > 0 ? { nth_of_type } : {}),
      },
    ];
  });
}

export function sanitizeElementChain(value: unknown) {
  if (typeof value !== "string") return undefined;
  return value
    .split(";")
    .flatMap((element) => {
      const tag = element.match(/^([a-z][a-z0-9-]*)(?=[.:\s[]|$)/)?.[1];
      if (!tag) return [];
      const positions = [...element.matchAll(/:nth-(?:child|of-type)="[1-9][0-9]*"/g)]
        .map(([position]) => position)
        .join("");
      return [tag + positions];
    })
    .join(";");
}
