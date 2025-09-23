'use client'

import React from "react";
import Image from "next/image";
import { FloatingDock } from "@/components/ui/floatingDock";
import {
  IconHome,
  IconFileText,
  IconBell,
  IconUser,
  IconUserCircle,
  IconUserPlus,
} from "@tabler/icons-react";
import { useAuth } from '@/contexts/AuthContext';

export default function FloatingDockNav() {
  const { isAuthenticated, user } = useAuth();

  const baseLinks = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-cyan-400 hover:text-cyan-300 transition-colors" />
      ),
      href: "/",
    },
    {
      title: "Report",
      icon: (
        <IconFileText className="h-full w-full text-cyan-400 hover:text-cyan-300 transition-colors" />
      ),
      href: "#report-form",
    },
    {
      title: "Notifications",
      icon: (
        <IconBell className="h-full w-full text-cyan-400 hover:text-cyan-300 transition-colors" />
      ),
      href: "/notifications",
    },
  ];

  const authLinks = isAuthenticated
    ? [
        {
          title: "Profile",
          icon: (
            <div className="relative h-full w-full">
              {/* Gmail Profile Picture */}
              {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                <Image
                  src={user.user_metadata.avatar_url || user.user_metadata.picture}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full rounded-full object-cover border-2 border-cyan-400 hover:border-cyan-300 transition-colors"
                />
              ) : (
                // Fallback if no profile picture available
                <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center border-2 border-cyan-400 hover:border-cyan-300 transition-colors">
                  <IconUser className="h-3/4 w-3/4 text-white" />
                </div>
              )}
            </div>
          ),
          href: "/account",
        },
      ]
    : [
        {
          title: "Login",
          icon: (
            <IconUserCircle className="h-full w-full text-cyan-400 hover:text-cyan-300 transition-colors" />
          ),
          href: "/auth",
        },
        {
          title: "Sign Up",
          icon: (
            <IconUserPlus className="h-full w-full text-cyan-400 hover:text-cyan-300 transition-colors" />
          ),
          href: "/auth",
        },
      ];

  const links = [...baseLinks, ...authLinks];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <FloatingDock
        mobileClassName="translate-y-0"
        desktopClassName=""
        items={links}
      />
    </div>
  );
}