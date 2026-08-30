import Cocoa

let srcPath = "/Users/macair1/.gemini/antigravity/brain/45be0db7-2696-49de-8116-4458600208be/.user_uploaded/media_1788037129991.jpg"
let destPath = "images/markalar/carren.png"

guard let srcImage = NSImage(contentsOfFile: srcPath),
      let srcCg = srcImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    exit(1)
}

let targetWidth = 360
let targetHeight = 180

let colorSpace = CGColorSpaceCreateDeviceRGB()
guard let context = CGContext(data: nil,
                              width: targetWidth,
                              height: targetHeight,
                              bitsPerComponent: 8,
                              bytesPerRow: targetWidth * 4,
                              space: colorSpace,
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
    exit(1)
}

// Background #F4F4F4
context.setFillColor(CGColor(red: 244/255.0, green: 244/255.0, blue: 244/255.0, alpha: 1.0))
context.fill(CGRect(x: 0, y: 0, width: targetWidth, height: targetHeight))

let srcW = srcCg.width
let srcH = srcCg.height
guard let srcData = srcCg.dataProvider?.data,
      let srcPtr = CFDataGetBytePtr(srcData) else { exit(1) }

guard let cleanContext = CGContext(data: nil,
                                   width: srcW,
                                   height: srcH,
                                   bitsPerComponent: 8,
                                   bytesPerRow: srcW * 4,
                                   space: colorSpace,
                                   bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
      let cleanData = cleanContext.data else { exit(1) }

let cleanPtr = cleanData.bindMemory(to: UInt8.self, capacity: srcW * srcH * 4)
let srcBpr = srcCg.bytesPerRow
let srcBpp = srcCg.bitsPerPixel / 8

for y in 0..<srcH {
    for x in 0..<srcW {
        let srcOffset = y * srcBpr + x * srcBpp
        let destOffset = (y * srcW + x) * 4
        
        let r = Double(srcPtr[srcOffset])
        let g = Double(srcPtr[srcOffset+1])
        let b = Double(srcPtr[srcOffset+2])
        let lum = 0.299 * r + 0.587 * g + 0.114 * b
        
        if lum > 235.0 {
            cleanPtr[destOffset] = 0
            cleanPtr[destOffset+1] = 0
            cleanPtr[destOffset+2] = 0
            cleanPtr[destOffset+3] = 0
        } else if r > 140 && g < 70 && b < 70 {
            // Bright red triangle
            cleanPtr[destOffset] = 220
            cleanPtr[destOffset+1] = 20
            cleanPtr[destOffset+2] = 30
            cleanPtr[destOffset+3] = 255
        } else {
            // Pitch solid black
            cleanPtr[destOffset] = 0
            cleanPtr[destOffset+1] = 0
            cleanPtr[destOffset+2] = 0
            cleanPtr[destOffset+3] = 255
        }
    }
}

guard let cleanCg = cleanContext.makeImage() else { exit(1) }

// Tight crop
var minX = srcW, maxX = 0, minY = srcH, maxY = 0
for y in 0..<srcH {
    for x in 0..<srcW {
        let offset = (y * srcW + x) * 4
        if cleanPtr[offset+3] > 128 {
            if x < minX { minX = x }
            if x > maxX { maxX = x }
            if y < minY { minY = y }
            if y > maxY { maxY = y }
        }
    }
}

let cropRect = CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1)
guard let croppedCg = cleanCg.cropping(to: cropRect) else { exit(1) }

let cropW = CGFloat(cropRect.width)
let cropH = CGFloat(cropRect.height)
let aspect = cropW / cropH

let drawH: CGFloat = 88.0
let drawW = drawH * aspect
let drawX = (CGFloat(targetWidth) - drawW) / 2.0
let drawY = (CGFloat(targetHeight) - drawH) / 2.0

context.interpolationQuality = .high
context.draw(croppedCg, in: CGRect(x: drawX, y: drawY, width: drawW, height: drawH))

guard let resultCg = context.makeImage() else { exit(1) }
let rep = NSBitmapImageRep(cgImage: resultCg)
if let png = rep.representation(using: .png, properties: [:]) {
    try? png.write(to: URL(fileURLWithPath: destPath))
    print("Exact Carren logo created with pitch black + red triangle!")
}
