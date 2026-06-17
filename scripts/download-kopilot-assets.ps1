$assetsDir = Join-Path $PSScriptRoot "..\assets"
$downloads = @{
  "kopilot-hero-bg.jpg" = "https://www.figma.com/api/mcp/asset/bef62a95-fa4d-4df1-baad-00fed5f69163"
  "kopilot-hero-product.png" = "https://www.figma.com/api/mcp/asset/f443690e-d419-4c85-b45b-88c1fc9dac8d"
  "kopilot-hero-logo-1.png" = "https://www.figma.com/api/mcp/asset/2431a7b1-1b91-4648-a55a-66aa2ee54044"
  "kopilot-hero-logo-2.png" = "https://www.figma.com/api/mcp/asset/7aa4a567-0802-4950-9b8d-de5129348aca"
  "kopilot-image-text.jpg" = "https://www.figma.com/api/mcp/asset/79d652c7-232d-4236-b6c8-fb80a5a5c6cc"
  "kopilot-features-main.jpg" = "https://www.figma.com/api/mcp/asset/d2ddc4f3-af76-4edc-9d0c-92b76a9a9850"
  "kopilot-icon-durable.png" = "https://www.figma.com/api/mcp/asset/a1ce9715-81e7-4ea5-84b9-8e4fcc1549e9"
  "kopilot-icon-battery.png" = "https://www.figma.com/api/mcp/asset/580dc4ab-dbbe-4b60-9827-434051d0d746"
  "kopilot-icon-medical.png" = "https://www.figma.com/api/mcp/asset/b50cd77e-5953-4917-ad14-add011a19f41"
  "kopilot-icon-subscription.png" = "https://www.figma.com/api/mcp/asset/941d4da4-42d9-47ad-bc98-90bcd1252b58"
  "kopilot-icon-languages.png" = "https://www.figma.com/api/mcp/asset/db4020f8-6f06-4f7b-a54b-4d43b2470b0b"
  "kopilot-icon-works.png" = "https://www.figma.com/api/mcp/asset/66cadfd3-af58-4d28-875c-9ad0aea5648e"
  "kopilot-info-cards-bg.jpg" = "https://www.figma.com/api/mcp/asset/90ed21a6-f939-4f26-9c95-22ad33d17bb8"
  "kopilot-card-1-bg.jpg" = "https://www.figma.com/api/mcp/asset/0173ecce-2f7a-455f-b9fc-7a741002704c"
  "kopilot-card-1-phone.png" = "https://www.figma.com/api/mcp/asset/d157085b-07b6-4a55-9d3c-318d2d2eb25e"
  "kopilot-card-2-setup.jpg" = "https://www.figma.com/api/mcp/asset/1e28ca62-5add-4617-a5c2-1f05bd30c6d7"
  "kopilot-card-3-app.jpg" = "https://www.figma.com/api/mcp/asset/b76819c1-8b83-450d-ac9e-1beda1bb549f"
  "kopilot-ambassador-hillary.jpg" = "https://www.figma.com/api/mcp/asset/0ebb3e25-8e17-439d-bfdb-3da07b2e4c9a"
  "kopilot-ambassador-breck.jpg" = "https://www.figma.com/api/mcp/asset/c2181748-a1fb-4be7-802a-e7b0de84adc8"
  "kopilot-ambassador-kait.jpg" = "https://www.figma.com/api/mcp/asset/382bee6c-9d1a-4fed-b536-06d45293d0ff"
  "kopilot-partner-1.png" = "https://www.figma.com/api/mcp/asset/2943cfc3-4faf-4e83-a174-783b27edf03c"
  "kopilot-partner-2.png" = "https://www.figma.com/api/mcp/asset/401eb19f-cf6f-4733-ac15-6a6698335f4b"
  "kopilot-partner-3.png" = "https://www.figma.com/api/mcp/asset/e0d67940-ed9f-44a7-862d-6ca85e7d1ce8"
  "kopilot-partner-4.png" = "https://www.figma.com/api/mcp/asset/3f54a342-8802-4e2d-b102-b2f688c88769"
  "kopilot-partner-5.png" = "https://www.figma.com/api/mcp/asset/a2b6a2db-940d-4294-85ef-a40fe5e8e6bf"
  "kopilot-partner-6.png" = "https://www.figma.com/api/mcp/asset/fe2e3cac-aeec-496b-a576-3a67191af6cc"
  "kopilot-product-1tag.png" = "https://www.figma.com/api/mcp/asset/ae8c6c42-8114-4069-9406-c02536cde44b"
  "kopilot-product-2tags.png" = "https://www.figma.com/api/mcp/asset/77459ff7-1007-4f8a-a247-3a62935eee1f"
  "kopilot-product-3tags.png" = "https://www.figma.com/api/mcp/asset/4b135764-cd17-4934-80ee-e520f34e8a4a"
  "kopilot-guarantee-moneyback.png" = "https://www.figma.com/api/mcp/asset/8669cad5-6f71-4681-b242-9db860851515"
  "kopilot-guarantee-nosub.png" = "https://www.figma.com/api/mcp/asset/f5f94735-4110-4a38-96c1-00a5c5f4ad11"
  "kopilot-guarantee-warranty.png" = "https://www.figma.com/api/mcp/asset/cf9c821d-cdb0-40b4-bd53-b4faeb5ecbdc"
  "kopilot-guarantee-works.png" = "https://www.figma.com/api/mcp/asset/094f4842-b8a5-4adc-9d7e-bfd66d2b5d64"
  "kopilot-cta-banner.jpg" = "https://www.figma.com/api/mcp/asset/6e54113e-f989-4d7a-836a-e8c0aded3d19"
  "kopilot-star.svg" = "https://www.figma.com/api/mcp/asset/5a5fe712-a31f-430d-b888-7e08a78300de"
  "kopilot-checkmark.svg" = "https://www.figma.com/api/mcp/asset/4c52cac8-651d-409c-886e-1507bd0a7951"
}

foreach ($entry in $downloads.GetEnumerator()) {
  $out = Join-Path $assetsDir $entry.Key
  try {
    Invoke-WebRequest -Uri $entry.Value -OutFile $out -UseBasicParsing
    Write-Host "OK $($entry.Key)"
  } catch {
    Write-Host "FAIL $($entry.Key): $_"
  }
}

Get-ChildItem $assetsDir -Filter "kopilot-*" | Select-Object Name, Length
