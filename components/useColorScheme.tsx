import { ColorSchemeName, useColorScheme as _useColorScheme } from 'react-native';

export function useColorScheme(): ColorSchemeName | null {
  const scheme = _useColorScheme();
  // remplacer undefined par null
  return scheme === undefined ? null : scheme;
}
