# Generates the static OG card + PNG icons in frontend/public using GDI+.
#
# Run from anywhere:  pwsh frontend/scripts/generate-images.ps1
#
# Why not next/og (ImageResponse)? Two reasons: next.config.js uses
# `output: 'export'`, which cannot run ImageResponse at request time, and Next
# 14.0.4's bundled @vercel/og throws on import on Windows (it builds a malformed
# `file:` URL when loading its default font). So these assets are rendered once
# and committed. Re-run this only when the brand mark or wordmark changes.
#
# Windows-only (System.Drawing/GDI+). Output: og-default.png (1200x630),
# icon-512.png, icon-192.png, apple-touch-icon.png, favicon.ico.
Add-Type -AssemblyName System.Drawing

# Script lives in frontend/scripts/, assets belong in frontend/public/.
$OutDir = Join-Path (Split-Path -Parent $PSScriptRoot) 'public'
if (-not (Test-Path $OutDir)) { throw "public/ not found at $OutDir" }
Write-Host "output: $OutDir"

$Indigo = [System.Drawing.Color]::FromArgb(99, 102, 241)   # #6366f1
$Dark   = [System.Drawing.Color]::FromArgb(17, 24, 39)     # #111827
$Muted  = [System.Drawing.Color]::FromArgb(156, 163, 175)  # #9ca3af

function New-Canvas([int]$w, [int]$h, $bg) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    if ($bg) { $g.Clear($bg) } else { $g.Clear([System.Drawing.Color]::Transparent) }
    return @{ Bitmap = $bmp; Graphics = $g }
}

# Brand mark: indigo circle with a white play triangle, matching public/icon.svg.
function Draw-Mark($g, [float]$cx, [float]$cy, [float]$size) {
    $r = $size / 2.0
    $circle = New-Object System.Drawing.SolidBrush($Indigo)
    $g.FillEllipse($circle, ($cx - $r), ($cy - $r), $size, $size)
    $circle.Dispose()

    # Triangle proportions mirror the SVG: 35,40 -> 65,50 -> 35,60 on a 100 box.
    $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $u = $size / 100.0
    $pts = @(
        (New-Object System.Drawing.PointF(($cx - 15 * $u), ($cy - 15 * $u))),
        (New-Object System.Drawing.PointF(($cx + 18 * $u), $cy)),
        (New-Object System.Drawing.PointF(($cx - 15 * $u), ($cy + 15 * $u)))
    )
    $g.FillPolygon($white, $pts)
    $white.Dispose()
}

function Save-Png($canvas, [string]$name) {
    $path = Join-Path $OutDir $name
    $canvas.Graphics.Dispose()
    $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $size = [math]::Round((Get-Item $path).Length / 1KB, 1)
    Write-Host ("  {0}  {1}x{2}  {3} KB" -f $name, $canvas.Bitmap.Width, $canvas.Bitmap.Height, $size)
    $canvas.Bitmap.Dispose()
}

# --- Icons ------------------------------------------------------------------
foreach ($spec in @(@{n='icon-512.png'; s=512}, @{n='icon-192.png'; s=192}, @{n='apple-touch-icon.png'; s=180})) {
    # Opaque dark background: iOS and Android maskable icons don't honour alpha.
    $c = New-Canvas $spec.s $spec.s $Dark
    Draw-Mark $c.Graphics ($spec.s / 2.0) ($spec.s / 2.0) ($spec.s * 0.82)
    Save-Png $c $spec.n
}

# --- Open Graph card --------------------------------------------------------
$W = 1200; $H = 630
$og = New-Canvas $W $H $Dark
$g = $og.Graphics

Draw-Mark $g ($W / 2.0) 210 170

$titleFont = New-Object System.Drawing.Font("Segoe UI", 78, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subFont   = New-Object System.Drawing.Font("Segoe UI", 36, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$center = New-Object System.Drawing.StringFormat
$center.Alignment = [System.Drawing.StringAlignment]::Center

$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$mutedBrush = New-Object System.Drawing.SolidBrush($Muted)

$g.DrawString("Pokytalk", $titleFont, $whiteBrush, (New-Object System.Drawing.RectangleF(0, 340, $W, 110)), $center)
$g.DrawString("Free random voice chat. No signup.", $subFont, $mutedBrush, (New-Object System.Drawing.RectangleF(0, 460, $W, 60)), $center)

$titleFont.Dispose(); $subFont.Dispose(); $whiteBrush.Dispose(); $mutedBrush.Dispose()
Save-Png $og 'og-default.png'

# --- favicon.ico (32x32 PNG wrapped in an ICO container) --------------------
$fav = New-Canvas 32 32 $Dark
Draw-Mark $fav.Graphics 16 16 27
$fav.Graphics.Dispose()
$ms = New-Object System.IO.MemoryStream
$fav.Bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $ms.ToArray()
$ms.Dispose(); $fav.Bitmap.Dispose()

$ico = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($ico)
$bw.Write([UInt16]0)              # reserved
$bw.Write([UInt16]1)              # type: icon
$bw.Write([UInt16]1)              # image count
$bw.Write([Byte]32)               # width
$bw.Write([Byte]32)               # height
$bw.Write([Byte]0)                # palette colours
$bw.Write([Byte]0)                # reserved
$bw.Write([UInt16]1)              # colour planes
$bw.Write([UInt16]32)             # bits per pixel
$bw.Write([UInt32]$pngBytes.Length)
$bw.Write([UInt32]22)             # offset of image data
$bw.Write($pngBytes)
$bw.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $OutDir 'favicon.ico'), $ico.ToArray())
$bw.Dispose(); $ico.Dispose()
Write-Host ("  favicon.ico  32x32  {0} KB" -f [math]::Round((Get-Item (Join-Path $OutDir 'favicon.ico')).Length / 1KB, 1))

Write-Host "done"
