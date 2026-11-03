import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Report } from "@/components/report/Report";

export async function generateMetadata({ searchParams }: PageProps<"/report">): Promise<Metadata> {
  const q = (await searchParams).q;
  return { title: `${typeof q === "string" ? q : "Report"} · Lot & Block` };
}

export default async function ReportPage({ searchParams }: PageProps<"/report">) {
  const q = (await searchParams).q;
  if (typeof q !== "string" || !q.trim()) redirect("/");
  return <Report q={q.trim()} />;
}
