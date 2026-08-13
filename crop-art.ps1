# ตัดเฉพาะส่วน "ภาพวาด/ภาพถ่าย" ออกจากการ์ดต้นฉบับ (ตัดตัวอักษรกับกรอบดำทิ้ง)
# ใช้เมื่อเปลี่ยนไฟล์การ์ดใหม่ — ปรับตัวเลข x/y/w/h ให้ตรงกับรูปใหม่
# รัน:  powershell -ExecutionPolicy Bypass -File crop-art.ps1

Add-Type -AssemblyName System.Drawing

# คัดลอกพิกเซลแบบ 1:1 (ไม่ย่อ ไม่ขยาย) + บันทึกที่ quality 100
# ถ้าย่อหรือลด quality ตรงนี้ จะเป็นการบีบอัดทับของเดิมซ้ำรอบสอง → ภาพแตก
function Crop-Img($src, $dst, $x, $y, $w, $h) {
  $img = [System.Drawing.Image]::FromFile($src)
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $bmp.SetResolution($img.HorizontalResolution, $img.VerticalResolution)
  $g   = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode  = 'NearestNeighbor'   # 1:1 จึงไม่ต้อง interpolate
  $g.PixelOffsetMode    = 'Half'
  $g.SmoothingMode      = 'None'
  $g.DrawImage($img,
    (New-Object System.Drawing.Rectangle 0, 0, $w, $h),
    (New-Object System.Drawing.Rectangle $x, $y, $w, $h), 'Pixel')

  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $p = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 100)
  $bmp.Save($dst, $codec, $p)

  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  "{0} -> {1}x{2}" -f (Split-Path $dst -Leaf), $w, $h
}

# ลบแถบ "THEM CODE : ●●●●" ที่พิมพ์อยู่ในตัวรูปการ์ดใบที่ 3 ด้วยการทาสีพื้นกระดาษทับ
# ต้นฉบับที่ยังมีแถบนี้เก็บไว้ที่ card-rings-original.jpg (ไม่ถูกแก้)
function Erase-Rect($src, $dst, $x, $y, $w, $h, $sampleX, $sampleY) {
  $img = [System.Drawing.Image]::FromFile($src)
  $bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
  $bmp.SetResolution($img.HorizontalResolution, $img.VerticalResolution)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($img, 0, 0, $img.Width, $img.Height)
  $img.Dispose()                                  # ปล่อยไฟล์ก่อน ไม่งั้นเขียนทับตัวเองไม่ได้

  $bg = $bmp.GetPixel($sampleX, $sampleY)         # ดูดสีพื้นกระดาษจริงมาใช้ ไม่ fix เป็นสีขาว
  $brush = New-Object System.Drawing.SolidBrush($bg)
  $g.FillRectangle($brush, $x, $y, $w, $h)
  $g.Dispose(); $brush.Dispose()

  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $p = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 100)
  $bmp.Save($dst, $codec, $p)
  $bmp.Dispose()
  "{0} : ลบแถบ THEM CODE แล้ว (สีพื้น R{1} G{2} B{3})" -f (Split-Path $dst -Leaf), $bg.R, $bg.G, $bg.B
}

$d = Join-Path $PSScriptRoot 'assets\img'

if (Test-Path "$d\card-rings-original.jpg") {
  Erase-Rect "$d\card-rings-original.jpg" "$d\card-rings.jpg" 700 1392 338 70 700 1425
}

# การ์ดป่าสน 1097x1491 — ตัดครึ่งล่างที่เป็นภาพวาดล้วน (ตัวอักษรจบราว y=650)
Crop-Img "$d\card-forest.jpg" "$d\art-forest.jpg" 46 706 1005 748

# การ์ดหุบเขา 1088x1504 — ตัวอักษรตัวเขียนจบราว y=770
Crop-Img "$d\card-valley.jpg" "$d\art-valley.jpg" 46 806 996 652

# การ์ดภาพถ่าย 1096x1494 — เอาเฉพาะกรอบรูปด้านบน
Crop-Img "$d\card-rings.jpg"  "$d\photo-couple.jpg" 70 48 918 808
