import {
	type Column,
	type ColumnDef,
	columnFilteringFeature,
	createExpandedRowModel,
	createFilteredRowModel,
	createSortedRowModel,
	type FilterFn,
	globalFilteringFeature,
	type Row,
	rowExpandingFeature,
	rowSortingFeature,
	sortFn_alphanumeric,
	sortFn_datetime,
	sortFn_text,
	tableFeatures,
} from "@tanstack/react-table";

/**
 * Feature set shared by the app's data tables (TanStack Table v9 requires
 * features to be registered explicitly). Covers sorting, a custom global
 * filter, and expandable detail rows.
 *
 * `sortFns` holds the built-ins that `sortFn: "auto"` can resolve to;
 * numbers fall back to `sortFn_basic` automatically.
 */
export const tableFeaturesDefault = tableFeatures({
	columnFilteringFeature,
	globalFilteringFeature,
	rowSortingFeature,
	rowExpandingFeature,
	filteredRowModel: createFilteredRowModel(),
	sortedRowModel: createSortedRowModel(),
	expandedRowModel: createExpandedRowModel(),
	sortFns: {
		alphanumeric: sortFn_alphanumeric,
		text: sortFn_text,
		datetime: sortFn_datetime,
	},
});

type Features = typeof tableFeaturesDefault;

// biome-ignore lint/suspicious/noExplicitAny: mirrors TanStack's own default TValue
export type AppColumnDef<TData extends object> = ColumnDef<Features, TData, any>;
// biome-ignore lint/suspicious/noExplicitAny: header contexts pass columns with any TValue
export type AppColumn<TData extends object> = Column<Features, TData, any>;
export type AppRow<TData extends object> = Row<Features, TData>;
export type AppFilterFn<TData extends object> = FilterFn<Features, TData>;
