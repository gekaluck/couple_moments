import { NextResponse } from "next/server";

type Params = {
  params: { spaceId: string };
};

export async function GET(request: Request, { params }: Params) {
  const url = new URL(request.url);
  url.pathname = `/spaces/${params.spaceId}/calendar`;
  url.search = "";
  return NextResponse.redirect(url);
}
