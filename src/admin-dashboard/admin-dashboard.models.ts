import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import type * as T from './admin-dashboard.types';

// GraphQL object types for the admin dashboard queries. Each class implements its matching
// REST response type, so the two shapes cannot drift apart without a compile error.
// String unions (StatKey, StatusTone, ...) are exposed as plain String to keep the JSON
// identical to REST.

// GraphQL enum names cannot start with a digit; the internal values stay '12M' | '6M' | '30D'.
export enum ActivityPeriodEnum {
  TWELVE_MONTHS = '12M',
  SIX_MONTHS = '6M',
  THIRTY_DAYS = '30D',
}
registerEnumType(ActivityPeriodEnum, { name: 'ActivityPeriod' });

@ObjectType()
export class DashboardStat implements T.DashboardStat {
  @Field() key!: T.StatKey;
  @Field() title!: string;
  @Field() value!: string;
  @Field(() => Int) rawValue!: number;
  @Field(() => Float) change!: number;
  @Field() changeType!: T.ChangeType;
  @Field() comparisonText!: string;
  @Field(() => [Float]) trend!: number[];
}

@ObjectType()
export class ActivityPoint implements T.ActivityPoint {
  @Field() label!: string;
  @Field(() => Int) plays!: number;
}

@ObjectType()
export class ActivityData implements T.ActivityData {
  @Field(() => ActivityPeriodEnum) period!: T.ActivityPeriod;
  @Field() subtitle!: string;
  @Field(() => [ActivityPoint]) points!: ActivityPoint[];
}

@ObjectType()
export class ActiveDay implements T.ActiveDay {
  @Field() day!: string;
  @Field(() => Int) value!: number;
}

@ObjectType()
export class HourActivity implements T.HourActivity {
  @Field() hour!: string;
  @Field(() => Int) value!: number;
}

@ObjectType()
export class Retention implements T.Retention {
  @Field(() => Float) rate!: number;
  @Field(() => Int) returning!: number;
  @Field(() => Int) newListeners!: number;
  @Field(() => Int) totalListeners!: number;
}

@ObjectType()
export class TopSong implements T.TopSong {
  @Field(() => ID) id!: string;
  @Field() title!: string;
  @Field() artist!: string;
  @Field() plays!: string;
  @Field(() => Int) playCount!: number;
  @Field(() => Float) change!: number;
  @Field() accent!: string;
}

@ObjectType()
export class TopArtist implements T.TopArtist {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field(() => Int) songs!: number;
  @Field() plays!: string;
  @Field(() => Int) playCount!: number;
  @Field() accent!: string;
}

@ObjectType()
export class StatusCount implements T.StatusCount {
  @Field() label!: string;
  @Field(() => Int) value!: number;
  @Field() tone!: T.StatusTone;
}

@ObjectType()
export class ContentOverview implements T.ContentOverview {
  @Field(() => [StatusCount]) songs!: StatusCount[];
  @Field(() => [StatusCount]) artists!: StatusCount[];
}

@ObjectType()
export class ActivityItem implements T.ActivityItem {
  @Field(() => ID) id!: string;
  @Field() type!: T.ActivityItemType;
  @Field() title!: string;
  @Field() description!: string;
  @Field() time!: string;
  @Field() createdAt!: string;
}

@ObjectType()
export class PlatformAlert implements T.PlatformAlert {
  @Field(() => ID) id!: string;
  @Field() level!: T.AlertLevel;
  @Field() title!: string;
  @Field() description!: string;
}

@ObjectType()
export class LanguageShare implements T.LanguageShare {
  @Field() label!: string;
  @Field(() => Float) value!: number;
  @Field(() => Int) count!: number;
}
