import Cocoa

let originalPath = "images/belgin-logo.png"
guard let originalImg = NSImage(contentsOfFile: originalPath),
      let originalCg = originalImg.cgImage(forProposedRect: nil, context: nil, hints: nil),
      let data = originalCg.dataProvider?.data,
      let ptr = CFDataGetBytePtr(data) else {
    print("Error reading original logo")
    exit(1)
}

let origW = originalCg.width
let origH = originalCg.height
let origBpr = originalCg.bytesPerRow
let origBpp = originalCg.bitsPerPixel / 8

let colorSpace = CGColorSpaceCreateDeviceRGB()

// Output canvas: 1600 x 740
let outW = 1600
let outH = 740

// 1. Clean Belgin + infinity
guard let cleanBelginCtx = CGContext(data: nil,
                                     width: origW,
                                     height: origH,
                                     bitsPerComponent: 8,
                                     bytesPerRow: origW * 4,
                                     space: colorSpace,
                                     bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
    exit(1)
}

guard let cleanPtr = cleanBelginCtx.data?.bindMemory(to: UInt8.self, capacity: origW * origH * 4) else { exit(1) }

for y in 0..<origH {
    for x in 0..<origW {
        let srcOffset = y * origBpr + x * origBpp
        let destOffset = (y * origW + x) * 4
        
        let r = ptr[srcOffset]
        let g = ptr[srcOffset+1]
        let b = ptr[srcOffset+2]
        let a = origBpp == 4 ? ptr[srcOffset+3] : 255
        
        let isOldKuyumculuk = (x < 710 && y >= 660 && y <= 850)
        let isOldSaat = (x >= 1260 && y >= 660 && y <= 850)
        
        if isOldKuyumculuk || isOldSaat {
            cleanPtr[destOffset] = 0
            cleanPtr[destOffset+1] = 0
            cleanPtr[destOffset+2] = 0
            cleanPtr[destOffset+3] = 0
        } else if a > 10 {
            if r > 250 && g > 250 && b > 250 {
                cleanPtr[destOffset] = 0
                cleanPtr[destOffset+1] = 0
                cleanPtr[destOffset+2] = 0
                cleanPtr[destOffset+3] = 0
            } else {
                let brightness = (Int(r) + Int(g) + Int(b)) / 3
                var alpha = Int(a)
                if brightness > 240 {
                    alpha = max(0, 255 - (brightness - 240) * 17)
                }
                cleanPtr[destOffset] = r
                cleanPtr[destOffset+1] = g
                cleanPtr[destOffset+2] = b
                cleanPtr[destOffset+3] = UInt8(alpha)
            }
        } else {
            cleanPtr[destOffset] = 0
            cleanPtr[destOffset+1] = 0
            cleanPtr[destOffset+2] = 0
            cleanPtr[destOffset+3] = 0
        }
    }
}

guard let cleanBelginCg = cleanBelginCtx.makeImage() else { exit(1) }

let nsImg = NSImage(size: NSSize(width: outW, height: outH))
nsImg.lockFocus()

guard let nsContext = NSGraphicsContext.current?.cgContext else {
    exit(1)
}

// Draw Belgin + Infinity
let drawW = CGFloat(origW)
let drawH = CGFloat(origH)
let drawX = (CGFloat(outW) - drawW) / 2.0
let drawY: CGFloat = -110.0

nsContext.draw(cleanBelginCg, in: CGRect(x: drawX, y: drawY, width: drawW, height: drawH))

// 2. Render bold, highly legible "Kuyumculuk" and "Saat" with professional typography
let font = NSFont(name: "AvenirNext-Bold", size: 82.0) ?? NSFont.boldSystemFont(ofSize: 82.0)
let textColor = NSColor(calibratedRed: 0/255.0, green: 0/255.0, blue: 0/255.0, alpha: 1.0)

let kuyumculukText = "Kuyumculuk"
let saatText = "Saat"

let kuyumculukAttrs: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: textColor,
    .kern: 19.5
]

let saatAttrs: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: textColor,
    .kern: 28.0
]

let attrKuyumculuk = NSAttributedString(string: kuyumculukText, attributes: kuyumculukAttrs)
let attrSaat = NSAttributedString(string: saatText, attributes: saatAttrs)

let kSize = attrKuyumculuk.size()
let sSize = attrSaat.size()

let kX: CGFloat = 55.0
let kY: CGFloat = 36.0

let sX: CGFloat = CGFloat(outW) - sSize.width - 55.0
let sY: CGFloat = 36.0

attrKuyumculuk.draw(at: NSPoint(x: kX, y: kY))
attrSaat.draw(at: NSPoint(x: sX, y: sY))

nsImg.unlockFocus()

guard let tiffData = nsImg.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiffData),
      let pngData = rep.representation(using: .png, properties: [:]) else {
    print("Error creating PNG data")
    exit(1)
}

let outPath = "images/belgin-logo-header.png"
try pngData.write(to: URL(fileURLWithPath: outPath))
print("Successfully created \(outPath)")
