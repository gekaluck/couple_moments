import { NextResponse } from "next/server";

type PageProps = {
  params: Promise<{ spaceId: string }>;
};

export async function GET(request: Request, { params }: PageProps) {
  const { spaceId } = await params;
  const url = new URL(request.url);
  url.pathname = `/spaces/${spaceId}/calendar`;
  url.search = "";
  return NextResponse.redirect(url);
}
