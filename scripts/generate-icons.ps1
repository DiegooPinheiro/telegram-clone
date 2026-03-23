$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function New-BrushGradient {
  param(
    [float]$Width,
    [float]$Height
  )

  $rect = New-Object System.Drawing.RectangleF(0, 0, $Width, $Height)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.ColorTranslator]::FromHtml('#2F7EF7'),
    [System.Drawing.ColorTranslator]::FromHtml('#43D7D2'),
    315
  )

  $blend = New-Object System.Drawing.Drawing2D.ColorBlend
  $blend.Colors = @(
    [System.Drawing.ColorTranslator]::FromHtml('#2E78F6'),
    [System.Drawing.ColorTranslator]::FromHtml('#3FA6F3'),
    [System.Drawing.ColorTranslator]::FromHtml('#42D4D4')
  )
  $blend.Positions = @(0.0, 0.55, 1.0)
  $brush.InterpolationColors = $blend

  return $brush
}

function Set-GraphicsQuality {
  param([System.Drawing.Graphics]$Graphics)

  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
}

function Draw-Glyph {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Color]$Color,
    [float]$Scale = 1.0
  )

  $pen = New-Object System.Drawing.Pen($Color, (54 * $Scale))
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  $bubbleRect = New-Object System.Drawing.RectangleF((222 * $Scale), (214 * $Scale), (444 * $Scale), (444 * $Scale))
  $Graphics.DrawEllipse($pen, $bubbleRect)

  $tailPoints = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new((540 * $Scale), (610 * $Scale)),
    [System.Drawing.PointF]::new((676 * $Scale), (742 * $Scale)),
    [System.Drawing.PointF]::new((600 * $Scale), (616 * $Scale))
  )
  $Graphics.DrawLines($pen, $tailPoints)

  $planePath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $planePoints = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new((355 * $Scale), (430 * $Scale)),
    [System.Drawing.PointF]::new((590 * $Scale), (328 * $Scale)),
    [System.Drawing.PointF]::new((506 * $Scale), (565 * $Scale)),
    [System.Drawing.PointF]::new((466 * $Scale), (500 * $Scale)),
    [System.Drawing.PointF]::new((400 * $Scale), (566 * $Scale)),
    [System.Drawing.PointF]::new((400 * $Scale), (506 * $Scale)),
    [System.Drawing.PointF]::new((355 * $Scale), (430 * $Scale))
  )
  $planePath.AddPolygon($planePoints)

  $fillBrush = New-Object System.Drawing.SolidBrush($Color)
  $Graphics.FillPath($fillBrush, $planePath)

  $pen.Dispose()
  $fillBrush.Dispose()
  $planePath.Dispose()
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

$assets = Join-Path $PSScriptRoot '..\\assets'

# icon.png
$iconBitmap = New-Object System.Drawing.Bitmap(1024, 1024)
$g = [System.Drawing.Graphics]::FromImage($iconBitmap)
Set-GraphicsQuality -Graphics $g
$g.Clear([System.Drawing.Color]::Transparent)

$backgroundPath = New-RoundedRectPath -X 110 -Y 110 -Width 804 -Height 804 -Radius 88
$backgroundBrush = New-BrushGradient -Width 1024 -Height 1024
$g.FillPath($backgroundBrush, $backgroundPath)

$shadowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 0, 0, 0), 18)
$shadowPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$g.DrawPath($shadowPen, $backgroundPath)

$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 18)
$borderPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$g.DrawPath($borderPen, $backgroundPath)

Draw-Glyph -Graphics $g -Color ([System.Drawing.Color]::White) -Scale 1.0

Save-Png -Bitmap $iconBitmap -Path (Join-Path $assets 'icon.png')

$borderPen.Dispose()
$shadowPen.Dispose()
$backgroundBrush.Dispose()
$backgroundPath.Dispose()
$g.Dispose()
$iconBitmap.Dispose()

# android background
$bgBitmap = New-Object System.Drawing.Bitmap(1024, 1024)
$bg = [System.Drawing.Graphics]::FromImage($bgBitmap)
Set-GraphicsQuality -Graphics $bg
$bg.Clear([System.Drawing.Color]::Transparent)
$bgBrush = New-BrushGradient -Width 1024 -Height 1024
$bg.FillRectangle($bgBrush, 0, 0, 1024, 1024)
Save-Png -Bitmap $bgBitmap -Path (Join-Path $assets 'android-icon-background.png')
$bgBrush.Dispose()
$bg.Dispose()
$bgBitmap.Dispose()

# android foreground
$fgBitmap = New-Object System.Drawing.Bitmap(1024, 1024)
$fg = [System.Drawing.Graphics]::FromImage($fgBitmap)
Set-GraphicsQuality -Graphics $fg
$fg.Clear([System.Drawing.Color]::Transparent)
Draw-Glyph -Graphics $fg -Color ([System.Drawing.Color]::White) -Scale 1.0
Save-Png -Bitmap $fgBitmap -Path (Join-Path $assets 'android-icon-foreground.png')
$fg.Dispose()
$fgBitmap.Dispose()

# android monochrome
$monoBitmap = New-Object System.Drawing.Bitmap(1024, 1024)
$mono = [System.Drawing.Graphics]::FromImage($monoBitmap)
Set-GraphicsQuality -Graphics $mono
$mono.Clear([System.Drawing.Color]::Transparent)
Draw-Glyph -Graphics $mono -Color ([System.Drawing.Color]::Black) -Scale 1.0
Save-Png -Bitmap $monoBitmap -Path (Join-Path $assets 'android-icon-monochrome.png')
$mono.Dispose()
$monoBitmap.Dispose()

# favicon
$faviconBitmap = New-Object System.Drawing.Bitmap(256, 256)
$fav = [System.Drawing.Graphics]::FromImage($faviconBitmap)
Set-GraphicsQuality -Graphics $fav
$fav.Clear([System.Drawing.Color]::Transparent)
$favScale = 0.25
$favPath = New-RoundedRectPath -X 28 -Y 28 -Width 200 -Height 200 -Radius 22
$favBrush = New-BrushGradient -Width 256 -Height 256
$fav.FillPath($favBrush, $favPath)
$favBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 5)
$favBorder.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$fav.DrawPath($favBorder, $favPath)
Draw-Glyph -Graphics $fav -Color ([System.Drawing.Color]::White) -Scale $favScale
Save-Png -Bitmap $faviconBitmap -Path (Join-Path $assets 'favicon.png')
$favBorder.Dispose()
$favBrush.Dispose()
$favPath.Dispose()
$fav.Dispose()
$faviconBitmap.Dispose()

# splash icon
$splashBitmap = New-Object System.Drawing.Bitmap(1024, 1024)
$splash = [System.Drawing.Graphics]::FromImage($splashBitmap)
Set-GraphicsQuality -Graphics $splash
$splash.Clear([System.Drawing.Color]::Transparent)
$splashPath = New-RoundedRectPath -X 110 -Y 110 -Width 804 -Height 804 -Radius 88
$splashBrush = New-BrushGradient -Width 1024 -Height 1024
$splash.FillPath($splashBrush, $splashPath)
$splashBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 18)
$splashBorder.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$splash.DrawPath($splashBorder, $splashPath)
Draw-Glyph -Graphics $splash -Color ([System.Drawing.Color]::White) -Scale 1.0
Save-Png -Bitmap $splashBitmap -Path (Join-Path $assets 'splash-icon.png')
$splashBorder.Dispose()
$splashBrush.Dispose()
$splashPath.Dispose()
$splash.Dispose()
$splashBitmap.Dispose()
