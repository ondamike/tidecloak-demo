"use client"
import React, { useEffect } from "react";
import IAMService from "/lib/IAMService";
import { useRouter } from "next/navigation";

export default function RedirectPage() {
  // This is the authentication callback page that securely fetch the JWT access token and redirects (stateless) session to the protected page

  const router = useRouter(); 

  useEffect(() => {
    IAMService.initIAM((authenticated) => {
      window.location.href = "/admin";
    });
  }, []);

  return;
}


