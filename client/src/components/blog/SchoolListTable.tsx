import { Link } from "@tanstack/react-router";
import { flexRender, type SortingState, useTable } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { type AppColumnDef, tableFeaturesDefault } from "@/lib/table";

export interface SchoolListItem {
	name: string;
	/** Slug of the university on TimTruong; when set, the name links to its detail page. */
	slug?: string;
	region?: string;
	note?: string;
}

/**
 * A list of universities for blog posts (MDX). Schools that exist in TimTruong's
 * database (have a `slug`) link to /danh-sach-truong/$slug; the rest are plain text.
 */
export const SchoolListTable = ({ schools }: { schools: SchoolListItem[] }) => {
	const [sorting, setSorting] = useState<SortingState>([]);
	const hasRegion = schools.some((s) => s.region);
	const hasNote = schools.some((s) => s.note);

	const columns = useMemo<AppColumnDef<SchoolListItem>[]>(
		() => [
			{
				accessorKey: "name",
				header: "Trường",
				cell: ({ row }) =>
					row.original.slug ? (
						<Link
							to="/danh-sach-truong/$slug"
							params={{ slug: row.original.slug }}
							className="font-medium text-primary hover:underline"
						>
							{row.original.name}
						</Link>
					) : (
						row.original.name
					),
			},
			...(hasRegion
				? [{ accessorKey: "region", header: "Khu vực" } as const]
				: []),
			...(hasNote
				? [
						{
							accessorKey: "note",
							header: "Ghi chú",
							enableSorting: false,
						} as const,
					]
				: []),
		],
		[hasRegion, hasNote],
	);

	const table = useTable({
		features: tableFeaturesDefault,
		data: schools,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
	});

	return (
		<div className="not-prose my-6">
			<div className="rounded-md border border-border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id} className="font-semibold">
										{header.column.getCanSort() ? (
											<button
												type="button"
												onClick={header.column.getToggleSortingHandler()}
												className="inline-flex items-center gap-1 hover:text-foreground"
											>
												{flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
												<ArrowUpDown className="h-3.5 w-3.5" />
											</button>
										) : (
											flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)
										)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getAllCells().map((cell) => (
									<TableCell key={cell.id} className="whitespace-normal">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{schools.some((s) => s.slug) && (
				<p className="mt-2 text-sm text-muted-foreground">
					Tên trường màu xanh là trường đã có trên TimTruong. Bấm vào để xem
					ngành, điểm chuẩn và học phí.
				</p>
			)}
		</div>
	);
};
