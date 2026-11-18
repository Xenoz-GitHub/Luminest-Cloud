package app.luminest.twa;

import android.net.Uri;

/**
 * Trusted Web Activity launcher.
 *
 * Opens the framework-free /open route in Chrome's engine, full screen. The
 * AndroidBrowserHelper base class handles the three launch paths itself:
 *   1. Trusted Web Activity (no URL bar) when Digital Asset Links verify.
 *   2. Custom Tab (with URL bar) when verification fails or Chrome is old.
 *   3. Default browser intent if Custom Tabs are unavailable entirely.
 *
 * That three-step fallback is why this is more reliable than a WebAPK on
 * older Android: it degrades instead of closing.
 */
public class LauncherActivity
    extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    private static final String LAUNCH_URL = "https://luminest-cloud.vercel.app/open";

    @Override
    protected Uri getLaunchingUrl() {
        return Uri.parse(LAUNCH_URL);
    }
}
