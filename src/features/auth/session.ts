"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
type GuestProfile={id:string;displayName:string;mode:"guest"};
type AuthState={profile:GuestProfile|null;continueAsGuest:(displayName?:string)=>void;signOut:()=>void};
export const useAuthStore=create<AuthState>()(persist((set)=>({profile:null,continueAsGuest:(displayName="Guest Creator")=>set({profile:{id:crypto.randomUUID(),displayName,mode:"guest"}}),signOut:()=>set({profile:null})}),{name:"lumaforge-guest-session"}));
