import { ExternalLink } from "lucide-react";
import { formatAcademicYear, formatTuition } from "@/lib/majors";
import type { MajorYear } from "@/types";

interface MajorTuitionTableProps {
	/** Newest-first, as the API returns them. */
	years: MajorYear[];
}

/** Icon link nguồn nhỏ cạnh một con số trong bảng — null thì không render. */
const SourceLink = ({ url, title }: { url: string | null; title: string }) =>
	url ? (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			title={title}
			className="ml-1 inline-flex align-middle text-muted-foreground hover:text-primary"
		>
			<ExternalLink className="h-3 w-3" />
		</a>
	) : null;

/**
 * Per-year tuition/quota table for one major (every MajorYear row, newest first).
 * Renders nothing with fewer than 2 year rows (no history to show; the majors
 * table already carries the latest figures). The trend chart is MajorTuitionChart.
 */
const MajorTuitionTable = ({ years }: MajorTuitionTableProps) => {
	if (years.length < 2) return null;

	return (
		<div className="mt-4">
			<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
				Học phí · chỉ tiêu theo năm
			</p>
			<div className="overflow-x-auto rounded-md border border-border">
				<table className="w-full border-collapse text-xs">
					<thead>
						<tr className="bg-muted/40">
							<th className="border-b border-border px-3 py-2 text-center font-medium text-muted-foreground">
								Năm học
							</th>
							<th className="border-b border-l border-border px-3 py-2 text-center font-medium text-muted-foreground">
								Học phí
							</th>
							<th className="border-b border-l border-border px-3 py-2 text-center font-medium text-muted-foreground">
								Chỉ tiêu
							</th>
						</tr>
					</thead>
					<tbody>
						{years.map((y) => (
							<tr
								key={y.year}
								className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
							>
								<td className="px-3 py-2 text-center font-medium text-foreground tabular-nums whitespace-nowrap">
									{formatAcademicYear(y.year)}
								</td>
								<td className="border-l border-border px-3 py-2 text-center tabular-nums text-foreground whitespace-nowrap">
									{y.tuitionFeeMin != null
										? formatTuition(
												y.tuitionFeeMin,
												y.tuitionFeeMax,
												y.tuitionFeeUnit,
											)
										: "—"}
									<SourceLink url={y.tuitionSourceUrl} title="Nguồn học phí" />
								</td>
								<td className="border-l border-border px-3 py-2 text-center tabular-nums text-foreground whitespace-nowrap">
									{y.enrollmentQuota ?? "—"}
									<SourceLink
										url={y.quotaSourceUrl}
										title="Nguồn chỉ tiêu (đề án)"
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default MajorTuitionTable;
