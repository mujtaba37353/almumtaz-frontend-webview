import { TextStyle } from 'react-native';
import { colors, typography as t } from './tokens';

export const textStyles = {
  hero: {
    fontFamily: t.fontSansBold,
    fontSize: t.sizeHero,
    color: colors.text,
  } as TextStyle,
  title: {
    fontFamily: t.fontArBold,
    fontSize: t.sizeXl,
    color: colors.text,
  } as TextStyle,
  subtitle: {
    fontFamily: t.fontAr,
    fontSize: t.sizeMd,
    color: colors.textMuted,
  } as TextStyle,
  body: {
    fontFamily: t.fontAr,
    fontSize: t.sizeMd,
    color: colors.text,
  } as TextStyle,
  bodyEn: {
    fontFamily: t.fontSans,
    fontSize: t.sizeMd,
    color: colors.text,
  } as TextStyle,
  label: {
    fontFamily: t.fontArMd,
    fontSize: t.sizeSm,
    color: colors.textMuted,
  } as TextStyle,
  button: {
    fontFamily: t.fontSansMd,
    fontSize: t.sizeMd,
    color: colors.textOnBrand,
  } as TextStyle,
};
