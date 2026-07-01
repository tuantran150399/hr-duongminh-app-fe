export function translateNotificationType(type, t) {
  if (!type) return '';

  const key = `notifications.types.${type}`;
  const translated = t(key);

  return translated === key
    ? String(type).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase())
    : translated;
}
