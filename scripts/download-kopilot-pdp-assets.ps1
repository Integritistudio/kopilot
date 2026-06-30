# Kopilot PDP assets — copies bundled theme assets to kopilot-pdp-* names.
# When Figma MCP is available, add Invoke-WebRequest URLs from download_assets output here.

$assetsDir = Join-Path $PSScriptRoot "..\assets"

$copies = @{
  "kopilot-pdp-gallery-1.jpg" = "Screenshot 2026-04-21 at 17.17.14 5.png"
  "kopilot-pdp-gallery-2.jpg" = "9648162c1c4607f7f4f02afa33d5c16c4c73c3e8.png"
  "kopilot-pdp-gallery-3.jpg" = "kopilot-card-2-setup.jpg"
  "kopilot-pdp-gallery-4.jpg" = "kopilot-features-main.jpg"
  "kopilot-pdp-gallery-5.jpg" = "ccde2c0b8a273159116b272ed4a979affb3da026.jpg"
  "kopilot-pdp-gallery-6.jpg" = "kopilot-image-text.jpg"
  "kopilot-pdp-emergency.jpg" = "ba364058e14ab9f73dd4f65ee4e8e3b8ae77a58f.jpg"
  "kopilot-pdp-tap.jpg" = "534e09e74dba5f2840077260761a394727c97e76.png"
  "kopilot-pdp-privacy-icon.png" = "kopilot-card-1-phone.png"
  "kopilot-pdp-testimonial-jerry.jpg" = "kopilot-ambassador-hillary.jpg"
  "kopilot-pdp-testimonial-nicolas.jpg" = "kopilot-ambassador-breck.jpg"
  "kopilot-pdp-testimonial-karen.jpg" = "kopilot-ambassador-kait.jpg"
  "kopilot-pdp-hero-cta.jpg" = "kopilot-cta-banner.jpg"
}

foreach ($entry in $copies.GetEnumerator()) {
  $src = Join-Path $assetsDir $entry.Value
  $dst = Join-Path $assetsDir $entry.Key
  if (Test-Path $src) {
    Copy-Item -Path $src -Destination $dst -Force
    Write-Host "OK $($entry.Key) <- $($entry.Value)"
  } else {
    Write-Host "MISSING source: $($entry.Value)"
  }
}

Get-ChildItem $assetsDir -Filter "kopilot-pdp-*" | Select-Object Name, Length
