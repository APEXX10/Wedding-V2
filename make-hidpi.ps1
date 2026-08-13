# สร้างไฟล์ภาพสำหรับจอความละเอียดสูง (@2x) จากไฟล์ art-*.jpg / photo-couple.jpg
#
# ทำไมต้องมี: จอที่ตั้ง Windows scaling 125–150% หรือจอมือถือ มี devicePixelRatio > 1
# เบราว์เซอร์จึงต้องยืดภาพขึ้นเองด้วยวิธีเร็ว ๆ ผลคือขอบฟุ้ง ภาพดูเบลอ
# ไฟล์ @2x นี้ขยายด้วย HighQualityBicubic แล้วตามด้วย unsharp mask เพื่อดึงคมกลับมา
# แล้วปล่อยให้เบราว์เซอร์ "ย่อ" ลงแทนการ "ขยาย" ซึ่งให้ผลคมกว่าเสมอ
#
# หมายเหตุตามตรง: การขยายไม่ได้เพิ่มรายละเอียดที่ไม่มีอยู่จริงในไฟล์ต้นทาง
# ถ้าได้ไฟล์ต้นฉบับความละเอียดสูงจากคนออกแบบการ์ด ผลจะดีกว่าวิธีนี้มาก
#
# รัน:  powershell -ExecutionPolicy Bypass -File make-hidpi.ps1

Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class HiDpi {
  // ขยายภาพ + unsharp mask แล้วบันทึกเป็น JPEG
  public static void Make(string src, string dst, int scale, float amount, int radius, long quality) {
    using (Image img = Image.FromFile(src)) {
      int w = img.Width * scale, h = img.Height * scale;
      using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb)) {
        using (Graphics g = Graphics.FromImage(bmp)) {
          g.InterpolationMode   = InterpolationMode.HighQualityBicubic;
          g.PixelOffsetMode     = PixelOffsetMode.HighQuality;
          g.SmoothingMode       = SmoothingMode.HighQuality;
          g.CompositingQuality  = CompositingQuality.HighQuality;
          g.DrawImage(img, new Rectangle(0, 0, w, h));
        }
        Unsharp(bmp, amount, radius);
        ImageCodecInfo codec = null;
        foreach (ImageCodecInfo c in ImageCodecInfo.GetImageEncoders())
          if (c.MimeType == "image/jpeg") codec = c;
        EncoderParameters p = new EncoderParameters(1);
        p.Param[0] = new EncoderParameter(Encoder.Quality, quality);
        bmp.Save(dst, codec, p);
      }
    }
  }

  // unsharp mask = ต้นฉบับ + amount * (ต้นฉบับ - เวอร์ชันเบลอ)
  static void Unsharp(Bitmap bmp, float amount, int radius) {
    int w = bmp.Width, h = bmp.Height;
    Rectangle rect = new Rectangle(0, 0, w, h);
    BitmapData data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format24bppRgb);
    int stride = data.Stride;
    byte[] buf = new byte[stride * h];
    Marshal.Copy(data.Scan0, buf, 0, buf.Length);
    byte[] blur = new byte[buf.Length];

    // box blur แนวนอนแล้วแนวตั้ง (แยกแกน = เร็วพอสำหรับภาพขนาดนี้)
    int win = radius * 2 + 1;
    byte[] tmp = new byte[buf.Length];
    for (int y = 0; y < h; y++) {
      int row = y * stride;
      for (int c = 0; c < 3; c++) {
        int sum = 0;
        for (int x = -radius; x <= radius; x++) sum += buf[row + Clamp(x, w) * 3 + c];
        for (int x = 0; x < w; x++) {
          tmp[row + x * 3 + c] = (byte)(sum / win);
          sum -= buf[row + Clamp(x - radius, w) * 3 + c];
          sum += buf[row + Clamp(x + radius + 1, w) * 3 + c];
        }
      }
    }
    for (int x = 0; x < w; x++) {
      for (int c = 0; c < 3; c++) {
        int sum = 0;
        for (int y = -radius; y <= radius; y++) sum += tmp[Clamp(y, h) * stride + x * 3 + c];
        for (int y = 0; y < h; y++) {
          blur[y * stride + x * 3 + c] = (byte)(sum / win);
          sum -= tmp[Clamp(y - radius, h) * stride + x * 3 + c];
          sum += tmp[Clamp(y + radius + 1, h) * stride + x * 3 + c];
        }
      }
    }

    for (int i = 0; i < buf.Length; i++) {
      int v = (int)(buf[i] + amount * (buf[i] - blur[i]));
      buf[i] = (byte)(v < 0 ? 0 : v > 255 ? 255 : v);
    }
    Marshal.Copy(buf, 0, data.Scan0, buf.Length);
    bmp.UnlockBits(data);
  }

  static int Clamp(int v, int max) { return v < 0 ? 0 : v >= max ? max - 1 : v; }
}
'@ -ReferencedAssemblies System.Drawing

$d = Join-Path $PSScriptRoot 'assets\img'
foreach ($name in 'art-forest', 'art-valley', 'photo-couple') {
  $src = "$d\$name.jpg"
  $dst = "$d\$name@2x.jpg"
  [HiDpi]::Make($src, $dst, 2, 0.85, 2, 90)
  $img = [System.Drawing.Image]::FromFile($dst)
  "{0}@2x.jpg -> {1}x{2}  ({3} KB)" -f $name, $img.Width, $img.Height, [int]((Get-Item $dst).Length / 1KB)
  $img.Dispose()
}
