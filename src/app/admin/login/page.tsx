import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./login-form";
import "../admin.css";
import { cmsFont } from "../font";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");
  return <div className={cmsFont.className}><LoginForm /></div>;
}

