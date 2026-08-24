export const DOMAIN_SCHEMA_VERSION = "3.0.0" as const;

export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export type Localized<T> = Readonly<Record<Locale, T>>;
export type LocalizedText = Localized<string>;

export type AxisKind = "structure" | "palette";
export type GenerationMode = "opening" | "timeline";

export interface AxisCopy {
  readonly label: string;
  readonly description: string;
  readonly wisdom: string;
  readonly intro: string;
  /** Empty only for Palette, which has no cross-axis note in the legacy source. */
  readonly links: string;
}

export interface AxisOptionCopy {
  readonly label: string;
  readonly summary: string;
  readonly detail: string;
}

export interface AxisOptionDefinition {
  /** Locale-independent ID sent across storage and API boundaries. */
  readonly id: string;
  readonly order: number;
  readonly copy: Localized<AxisOptionCopy>;
}

export interface AxisDefinition {
  /** Locale-independent semantic ID used by application code. */
  readonly id: string;
  /** Compact compatibility code retained for the existing prompt contract. */
  readonly code: string;
  readonly kind: AxisKind;
  readonly order: number;
  readonly copy: Localized<AxisCopy>;
  readonly options: readonly AxisOptionDefinition[];
}

export interface DomainSelection<
  TAxisId extends string = string,
  TOptionId extends string = string,
> {
  readonly axisId: TAxisId;
  readonly optionId: TOptionId;
}
