# 015 — Magic Link Error Not Surfaced in Auth Callback

**Severity:** Medium  
**Platform:** Mobile (Expo)  
**Status:** Fixed

## Symptom

When a user tapped an expired or already-used Supabase magic link in an email, the app silently landed on the More tab with no error message. The user had no way to know why sign-in failed. In earlier builds, a deleted-user link left the app stuck on a "Signing you in…" spinner indefinitely.

## Root Cause

The deep-link error handling had a **listener-timing mismatch**:

1. Supabase redirects an expired/used link back to the app as `mobile://auth/callback#error=access_denied&error_code=otp_expired&...`
2. The original error parsing lived in the auth/callback **screen**, which mounted only when the deep link arrived
3. That screen called `Linking.useURL()` to read the URL, but its listener attached **after** the deep-link event had already fired
4. `getInitialURL()` returns the app's launch URL, not the deep-link event, so the late-mounted listener missed it
5. The screen always saw a null/stale URL, found no error, and bounced to More

**Why token sign-in worked:** The AuthProvider's `Linking.useURL()` is mounted at app launch, so it *did* catch the event. This asymmetry made debugging confusing: successful links worked, errors didn't.

**Key insight:** Deep-link events fire at the OS level when the user taps a link. If a React component's event listener isn't already attached, it misses the event entirely.

## The Fix

Move error extraction into `AuthProvider` (which is mounted at app start) using a derived (not stateful) `useMemo` hook. This way the app-launch-mounted `Linking.useURL()` catches the deep-link event, and the `authError` value is always available on the context.

### Before: error parsing in the late-mounted callback screen

```tsx
// apps/mobile/src/app/auth/callback.tsx (old)
export default function AuthCallbackScreen() {
  const router = useRouter();
  const incomingUrl = Linking.useURL(); // listener attached AFTER deep link fired ❌
  const authError = authErrorFromUrl(incomingUrl); // always null
  
  useEffect(() => {
    if (!authError) { // false, even though link had error
      router.replace("/more"); // bounces blindly
    }
  }, [authError]);
}
```

### After: error captured at app start in AuthProvider

```tsx
// apps/mobile/src/marginalia/AuthContext.tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const incomingUrl = Linking.useURL(); // listener mounted at app start ✓
  // Derived (not stateful) so it's reliable: naturally clears when a new link arrives
  const authError = useMemo(() => authErrorFromUrl(incomingUrl), [incomingUrl]);
  
  // ... exposed on context
  const value = useMemo<AuthContextValue>(
    () => ({
      // ...
      authError,
    }),
    // ...
  );
}
```

```tsx
// apps/mobile/src/app/auth/callback.tsx (new)
export default function AuthCallbackScreen() {
  const { signedIn, authError } = useMarginalia(); // read from context ✓
  
  useEffect(() => {
    if (authError) return; // error is reliably present
    const t = setTimeout(() => router.replace("/more"), signedIn ? 0 : 1500);
    return () => clearTimeout(t);
  }, [authError, signedIn, router]);
  
  if (authError) {
    return (
      <View>
        <Text>Sign-in link problem</Text>
        <Text>{authError}</Text>
        <Pressable onPress={() => router.replace("/account")}>
          <Text>Get a new link</Text>
        </Pressable>
      </View>
    );
  }
}
```

## Files Changed

- `apps/mobile/src/marginalia/AuthContext.tsx`
  - Added `authError: string | null` to `AuthContextValue` (line 67)
  - Added `authErrorFromUrl` helper (line 71–88, was private to callback)
  - Added `useMemo` hook to derive `authError` from the app-start-mounted `Linking.useURL()` (lines 124–127)
  - Exposed `authError` on context value (line 275)

- `apps/mobile/src/app/auth/callback.tsx`
  - Removed local `Linking.useURL()` listener
  - Read `authError` from context instead (line 22)
  - Gate bounce-to-More on `authError === null` (lines 27–30)
  - Show error UI when `authError` is present (lines 32–52)

## Verification

Tested on the simulator by clicking an expired magic link:
- "Sign-in link problem" screen appears
- Error message displays: "That sign-in link has expired or was already used. Request a fresh one below."
- "Get a new link" button navigates to account screen for retry

## Key Rule

**Handle deep-link events in a provider mounted at app launch, never in a screen that only mounts in response to the deep link.** A late-mounted event listener will miss the event that opened it.
